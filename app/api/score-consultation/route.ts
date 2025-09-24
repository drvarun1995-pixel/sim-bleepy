import { NextRequest, NextResponse } from 'next/server';
import { generateConsultationScore, generatePsoriaticArthritisScore, ConsultationMessage } from '@/utils/openaiService';
import { trackUsage, extractOpenAIUsage } from '@/lib/usageTracker';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, stationType, duration, correctDiagnosis, diagnosisCriteria } = body;

    console.log('Received scoring request:', { 
      messageCount: messages?.length, 
      stationType, 
      duration 
    });

    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages format:', messages);
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    if (!stationType) {
      console.error('Station type is required');
      return NextResponse.json(
        { error: 'Station type is required' },
        { status: 400 }
      );
    }

    // Convert messages to the expected format
    const consultationMessages: ConsultationMessage[] = messages.map((msg: any) => ({
      role: msg.role === 'user_message' ? 'doctor' : 'patient',
      content: msg.message?.content || msg.content || '',
      timestamp: new Date(msg.receivedAt || Date.now())
    }));

    console.log('Converted messages:', consultationMessages);

    // Check if we have any meaningful conversation
    if (consultationMessages.length === 0) {
      console.log('No conversation messages found');
      return NextResponse.json({
        totalScore: 0,
        maxScore: 12,
        status: "FAIL",
        domainScores: {
          dataGathering: 0,
          clinicalManagement: 0,
          interpersonalSkills: 0
        },
        examinerNotes: "No conversation was recorded. Please ensure you have a meaningful dialogue with the patient during the consultation.",
        strengths: [],
        areasForImprovement: [
          "No conversation recorded",
          "Please engage in a full consultation with the patient",
          "Ensure your microphone is working properly"
        ],
        nextSteps: [
          "Check your microphone and audio settings",
          "Engage in a complete consultation with the patient",
          "Ask questions about symptoms, history, and concerns",
          "Provide appropriate clinical advice and next steps"
        ],
        detailedAnalysis: {
          communication: "No conversation recorded to analyze",
          clinicalReasoning: "No conversation recorded to analyze",
          patientSafety: "No conversation recorded to analyze",
          professionalism: "No conversation recorded to analyze"
        }
      });
    }

    // Generate the score using OpenAI - use specialized scoring for joint pain assessment
    let score;
    if (stationType.toLowerCase().includes('joint-pain') || stationType.toLowerCase().includes('arthritis')) {
      score = await generatePsoriaticArthritisScore(
        consultationMessages,
        duration || 8
      );
    } else {
      score = await generateConsultationScore(
        consultationMessages,
        stationType,
        duration || 5,
        correctDiagnosis,
        diagnosisCriteria
      );
    }

    console.log('Generated score:', score);

    // Track OpenAI usage
    try {
      await trackUsage({
        service: 'openai',
        endpoint: '/api/score-consultation',
        usage_data: extractOpenAIUsage(score),
        timestamp: new Date().toISOString(),
        request_id: `score-${Date.now()}`
      });
    } catch (error) {
      console.error('Error tracking OpenAI usage:', error);
    }

    // Include transcript in the response
    const responseWithTranscript = {
      ...score,
      transcript: consultationMessages
    };

    return NextResponse.json(responseWithTranscript);

  } catch (error) {
    console.error('Error in score-consultation API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
