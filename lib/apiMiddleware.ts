import { NextRequest, NextResponse } from 'next/server'
import { trackHumeUsage, trackOpenAIUsage } from './apiUsageTracker'

// Hume API tracking middleware
export class HumeAPITracker {
  private sessionId: string

  constructor(sessionId: string) {
    this.sessionId = sessionId
  }

  // Track ASR usage
  async trackASRCall(durationMs: number, metadata?: Record<string, any>) {
    await trackHumeUsage(this.sessionId, 'asr', {
      duration_ms: durationMs,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    })
  }

  // Track TTS usage
  async trackTTSCall(durationMs: number, metadata?: Record<string, any>) {
    await trackHumeUsage(this.sessionId, 'tts', {
      duration_ms: durationMs,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    })
  }

  // Track emotion analysis usage
  async trackEmotionCall(tokensUsed: number, metadata?: Record<string, any>) {
    await trackHumeUsage(this.sessionId, 'emotion', {
      tokens_used: tokensUsed,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    })
  }
}

// OpenAI API tracking middleware
export class OpenAIAPITracker {
  private sessionId: string

  constructor(sessionId: string) {
    this.sessionId = sessionId
  }

  // Track chat completion usage
  async trackChatCompletion(
    inputTokens: number,
    outputTokens: number,
    metadata?: Record<string, any>
  ) {
    await trackOpenAIUsage(this.sessionId, 'chat', {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    })
  }

  // Track embeddings usage
  async trackEmbeddings(tokensUsed: number, metadata?: Record<string, any>) {
    await trackOpenAIUsage(this.sessionId, 'embeddings', {
      tokens_used: tokensUsed,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    })
  }
}

// Wrapper functions for easy integration
export const createHumeTracker = (sessionId: string) => new HumeAPITracker(sessionId)
export const createOpenAITracker = (sessionId: string) => new OpenAIAPITracker(sessionId)

// Example usage in API routes:
/*
// In your API route:
import { createHumeTracker, createOpenAITracker } from '@/lib/apiMiddleware'

export async function POST(request: NextRequest) {
  const sessionId = request.headers.get('x-session-id') || 'unknown'
  const humeTracker = createHumeTracker(sessionId)
  const openaiTracker = createOpenAITracker(sessionId)

  try {
    // Make Hume API call
    const startTime = Date.now()
    const humeResponse = await fetch('https://api.hume.ai/...')
    const endTime = Date.now()
    
    // Track the usage
    await humeTracker.trackASRCall(endTime - startTime, {
      endpoint: '/asr',
      success: humeResponse.ok
    })

    // Make OpenAI API call
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [...],
        // ... other params
      })
    })
    
    const usage = await openaiResponse.json().then(r => r.usage)
    await openaiTracker.trackChatCompletion(
      usage.prompt_tokens,
      usage.completion_tokens,
      {
        model: 'gpt-4',
        endpoint: '/chat/completions'
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API call failed:', error)
    return NextResponse.json({ error: 'API call failed' }, { status: 500 })
  }
}
*/
