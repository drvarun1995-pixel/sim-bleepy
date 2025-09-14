import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, assistantId, voiceConfigId } = await request.json();

    if (!assistantId) {
      return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 });
    }

    // Create a thread for the conversation
    const thread = await openai.beta.threads.create();

    // Add messages to the thread
    for (const message of messages) {
      await openai.beta.threads.messages.create(thread.id, {
        role: message.role === 'doctor' ? 'user' : 'assistant',
        content: message.content,
      });
    }

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    
    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    if (runStatus.status === 'completed') {
      // Get the assistant's response
      const messages = await openai.beta.threads.messages.list(thread.id);
      const assistantMessage = messages.data[0];
      
      if (assistantMessage && assistantMessage.content[0].type === 'text') {
        const response = assistantMessage.content[0].text.value;
        
        return NextResponse.json({ 
          response,
          threadId: thread.id,
          runId: run.id
        });
      }
    }

    return NextResponse.json({ error: 'Failed to get response from assistant' }, { status: 500 });

  } catch (error) {
    console.error('OpenAI Assistant API error:', error);
    return NextResponse.json(
      { error: 'Failed to process assistant request' },
      { status: 500 }
    );
  }
}

