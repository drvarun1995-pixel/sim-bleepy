import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { audioBlob, stationConfig } = await request.json();

    if (!audioBlob) {
      return NextResponse.json({ error: 'Audio data is required' }, { status: 400 });
    }

    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(audioBlob, 'base64');

    // Transcribe the audio using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: new File([audioBuffer], 'audio.webm', { type: 'audio/webm' }),
      model: 'whisper-1',
    });

    const doctorInput = transcription.text;

    // Get AI response using the chat API
    const chatResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/openai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'doctor',
            content: doctorInput,
            timestamp: new Date().toISOString()
          }
        ],
        systemPrompt: stationConfig.openaiConfig?.systemPrompt,
        promptId: stationConfig.openaiConfig?.promptId,
        model: stationConfig.openaiConfig?.model,
        temperature: stationConfig.openaiConfig?.temperature,
        maxTokens: stationConfig.openaiConfig?.maxTokens
      }),
    });

    if (!chatResponse.ok) {
      throw new Error('Failed to get AI response');
    }

    const chatData = await chatResponse.json();
    const patientResponse = chatData.response;

    // Convert text to speech using OpenAI TTS
    const ttsResponse = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy', // You can change this to 'echo', 'fable', 'onyx', 'nova', or 'shimmer'
      input: patientResponse,
    });

    // Convert the audio response to base64
    const audioArrayBuffer = await ttsResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioArrayBuffer).toString('base64');

    return NextResponse.json({
      doctorInput,
      patientResponse,
      audioBase64,
      audioType: 'audio/mpeg'
    });

  } catch (error) {
    console.error('Speech-to-speech API error:', error);
    return NextResponse.json(
      { error: 'Failed to process speech-to-speech request' },
      { status: 500 }
    );
  }
}

