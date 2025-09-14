import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Convert messages to OpenAI format
    const openaiMessages = [
      { role: 'system', content: 'You are a helpful AI assistant. Be conversational and engaging.' },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Make OpenAI API call
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || '';

    return NextResponse.json({ response });

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('insufficient_quota') || error.message.includes('429')) {
        return NextResponse.json({
          error: 'API quota exceeded',
          details: 'OpenAI API quota has been exceeded. Please check your billing.',
          response: "I'm sorry, I'm having trouble responding right now due to API limitations. Please try again later."
        }, { status: 429 });
      }
      
      if (error.message.includes('invalid_api_key')) {
        return NextResponse.json({
          error: 'Invalid API key',
          details: 'The OpenAI API key is invalid or expired.'
        }, { status: 401 });
      }
    }
    
    return NextResponse.json({
      error: 'Failed to get AI response',
      details: error instanceof Error ? error.message : 'Unknown error',
      response: "I'm sorry, I'm having trouble responding right now. Please try again."
    }, { status: 500 });
  }
}
