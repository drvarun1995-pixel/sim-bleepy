import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { promptId, audioBase64, messages } = await request.json();

    console.log('Audio Speech API called with:', { 
      promptId, 
      hasAudio: !!audioBase64,
      hasMessages: !!messages
    });

    if (!promptId) {
      return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 });
    }

    // Convert base64 audio to buffer if provided
    let audioBuffer = null;
    if (audioBase64) {
      try {
        audioBuffer = Buffer.from(audioBase64, 'base64');
      } catch (error) {
        console.error('Error converting audio from base64:', error);
        return NextResponse.json({ error: 'Invalid audio format' }, { status: 400 });
      }
    }

    // If we have audio input, use speech-to-speech
    if (audioBuffer) {
      // First, transcribe the audio
      const transcription = await openai.audio.transcriptions.create({
        file: new File([audioBuffer], "audio.webm", { type: "audio/webm" }),
        model: "whisper-1",
      });

      console.log('Transcribed audio:', transcription.text);

      // Use the prompt ID directly with OpenAI
      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are using prompt ID: ${promptId}. Follow the exact behavior and persona defined in that prompt.`
          },
          {
            role: "user",
            content: transcription.text
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      });

      const responseText = chatCompletion.choices[0]?.message?.content || "";

      // Generate speech from response
      const mp3 = await openai.audio.speech.create({
        model: "tts-1-hd",
        voice: "alloy",
        input: responseText,
        response_format: "mp3",
        speed: 1.0
      });

      const audioResponseBuffer = Buffer.from(await mp3.arrayBuffer());
      const audioResponseBase64 = audioResponseBuffer.toString('base64');

      return NextResponse.json({
        transcription: transcription.text,
        response: responseText,
        audioResponse: audioResponseBase64,
        format: "mp3"
      });

    } else if (messages && messages.length > 0) {
      // Handle text conversation using the prompt
      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are using prompt ID: ${promptId}. Follow the exact behavior and persona defined in that prompt.`
          },
          ...messages.map((msg: any) => ({
            role: msg.role === 'doctor' ? 'user' : 'assistant', // Doctor speaks to AI, Patient responds
            content: msg.content
          }))
        ],
        max_tokens: 150,
        temperature: 0.7
      });

      const responseText = chatCompletion.choices[0]?.message?.content || "";

      // Generate speech from response
      const mp3 = await openai.audio.speech.create({
        model: "tts-1-hd",
        voice: "alloy",
        input: responseText,
        response_format: "mp3",
        speed: 1.0
      });

      const audioResponseBuffer = Buffer.from(await mp3.arrayBuffer());
      const audioResponseBase64 = audioResponseBuffer.toString('base64');

      return NextResponse.json({
        response: responseText,
        audioResponse: audioResponseBase64,
        format: "mp3"
      });

    } else {
      // Return the exact opening line
      const responseText = "Hello doctor, I've been getting a heavy tightness in my chest whenever I walk quickly or go uphill.";

      // Generate speech from response
      const mp3 = await openai.audio.speech.create({
        model: "tts-1-hd",
        voice: "alloy",
        input: responseText,
        response_format: "mp3",
        speed: 1.0
      });

      const audioResponseBuffer = Buffer.from(await mp3.arrayBuffer());
      const audioResponseBase64 = audioResponseBuffer.toString('base64');

      return NextResponse.json({
        response: responseText,
        audioResponse: audioResponseBase64,
        format: "mp3"
      });
    }

  } catch (error: any) {
    console.error('OpenAI Audio API error:', error);
    
    // Handle specific OpenAI errors
    if (error.message.includes('insufficient_quota') || error.message.includes('429')) {
      return NextResponse.json(
        {
          error: 'OpenAI API quota exceeded',
          details: 'The OpenAI API quota has been exceeded. Please check your billing details or try again later.',
          fallbackResponse: "I'm sorry, I'm having trouble responding right now due to API limitations. Please try again later or contact support."
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process audio', details: error.message },
      { status: 500 }
    );
  }
}
