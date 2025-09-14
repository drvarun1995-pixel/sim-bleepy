import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, conversation_history = [] } = await request.json();

    // Validate input
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log('Realtime Audio API called with:', { message, historyLength: conversation_history.length });

    // Build conversation context
    const messages = [
      { 
        role: 'system', 
        content: 'You are a friendly AI assistant. Keep responses very short (1 sentence max). Be conversational and natural.' 
      },
      ...conversation_history,
      { role: 'user', content: message }
    ];

    // Make OpenAI API call
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 80,
      stream: false,
    });

    const response = completion.choices[0]?.message?.content || '';

    return NextResponse.json({ 
      response: response.trim(),
      conversation_history: [
        ...conversation_history,
        { role: 'user', content: message },
        { role: 'assistant', content: response.trim() }
      ]
    });

  } catch (error) {
    console.error('OpenAI Realtime Audio API error:', error);
    
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
