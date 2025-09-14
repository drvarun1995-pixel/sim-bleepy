import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { audioFile, voiceConfigId, promptId } = await request.json();

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(audioFile, 'base64');

    // Create a temporary file-like object
    const audioFileObj = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' });

    // Use OpenAI Audio API for speech-to-speech
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy', // You can make this configurable
      input: 'Hello, this is a test response from the AI patient.',
      response_format: 'wav'
    });

    // Convert response to base64
    const audioArrayBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioArrayBuffer).toString('base64');

    return NextResponse.json({ 
      audio: audioBase64,
      text: 'Hello, this is a test response from the AI patient.'
    });

  } catch (error) {
    console.error('OpenAI Audio API error:', error);
    return NextResponse.json(
      { error: 'Failed to process audio request' },
      { status: 500 }
    );
  }
}

// For speech-to-text (transcription)
export async function PUT(request: NextRequest) {
  try {
    const { audioFile, model = 'whisper-1' } = await request.json();

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(audioFile, 'base64');

    // Create a temporary file-like object
    const audioFileObj = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' });

    // Use OpenAI Whisper for speech-to-text
    const transcription = await openai.audio.transcriptions.create({
      file: audioFileObj,
      model: model,
      response_format: 'text'
    });

    return NextResponse.json({ 
      text: transcription
    });

  } catch (error) {
    console.error('OpenAI Whisper API error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}

