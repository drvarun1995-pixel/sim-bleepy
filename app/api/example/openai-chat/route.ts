import { NextRequest, NextResponse } from 'next/server'
import { createOpenAITracker } from '@/lib/apiMiddleware'

// Example API route showing how to track OpenAI chat usage
export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id') || 'unknown'
    const openaiTracker = createOpenAITracker(sessionId)
    
    const { messages, model = 'gpt-4' } = await request.json()
    
    // Make actual OpenAI API call
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1000,
        temperature: 0.7
      })
    })
    
    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }
    
    const result = await openaiResponse.json()
    
    // Track the usage
    await openaiTracker.trackChatCompletion(
      result.usage.prompt_tokens,
      result.usage.completion_tokens,
      {
        model,
        endpoint: '/chat/completions',
        success: openaiResponse.ok,
        total_tokens: result.usage.total_tokens
      }
    )
    
    return NextResponse.json({
      success: true,
      result,
      usage: {
        prompt_tokens: result.usage.prompt_tokens,
        completion_tokens: result.usage.completion_tokens,
        total_tokens: result.usage.total_tokens,
        tracked: true
      }
    })
    
  } catch (error) {
    console.error('OpenAI Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}
