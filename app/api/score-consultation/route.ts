import { NextRequest, NextResponse } from 'next/server';
import { generateConsultationScore, generatePsoriaticArthritisScore, ConsultationMessage } from '@/utils/openaiService';
import { trackUsage, extractOpenAIUsage } from '@/lib/usageTracker';
import { collapseStreamingTurns } from '@/utils/stationFindings';
import {
  assessConsultationQuality,
  buildInsufficientConsultationScore,
} from '@/utils/consultationQuality';

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

    // Convert messages to the expected format (supports Hume raw + pre-normalized roles)
    const consultationMessages: ConsultationMessage[] = collapseStreamingTurns(
      messages.map((msg: any) => {
        const role =
          msg.role === 'user_message' || msg.role === 'doctor'
            ? 'doctor'
            : 'patient';
        return {
          role,
          content: msg.message?.content || msg.content || '',
          timestamp: new Date(msg.receivedAt || msg.timestamp || Date.now()),
        };
      })
    );

    console.log('Converted messages:', consultationMessages);

    const durationSeconds =
      typeof duration === 'number' ? Math.round(duration) : undefined;
    const quality = assessConsultationQuality(
      consultationMessages,
      durationSeconds
    );

    if (!quality.isScorable) {
      console.log('Consultation not scorable:', quality);
      const insufficientScore = buildInsufficientConsultationScore(
        quality,
        correctDiagnosis
      );
      return NextResponse.json({
        ...insufficientScore,
        transcript: consultationMessages,
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
        durationSeconds ? Math.max(1, Math.round(durationSeconds / 60)) : 5,
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
