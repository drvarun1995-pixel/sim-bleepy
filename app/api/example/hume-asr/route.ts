import { NextRequest, NextResponse } from 'next/server'
import { createHumeTracker } from '@/lib/apiMiddleware'

// Example API route showing how to track Hume ASR usage
export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id') || 'unknown'
    const humeTracker = createHumeTracker(sessionId)
    
    // Get audio data from request
    const audioData = await request.arrayBuffer()
    
    // Start timing the API call
    const startTime = Date.now()
    
    // Make actual Hume API call
    const humeResponse = await fetch('https://api.hume.ai/v0/batch/jobs', {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': process.env.HUME_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        models: {
          prosody: {
            granularity: 'word',
            window: 0.1
          }
        },
        transcription: {
          language: 'en'
        },
        media: [
          {
            data: Buffer.from(audioData).toString('base64')
          }
        ]
      })
    })
    
    const endTime = Date.now()
    const durationMs = endTime - startTime
    
    if (!humeResponse.ok) {
      throw new Error(`Hume API error: ${humeResponse.status}`)
    }
    
    const result = await humeResponse.json()
    
    // Track the usage
    await humeTracker.trackASRCall(durationMs, {
      endpoint: '/batch/jobs',
      success: humeResponse.ok,
      models: ['prosody'],
      audioSize: audioData.byteLength,
      responseSize: JSON.stringify(result).length
    })
    
    return NextResponse.json({
      success: true,
      result,
      usage: {
        duration_ms: durationMs,
        tracked: true
      }
    })
    
  } catch (error) {
    console.error('Hume ASR API error:', error)
    return NextResponse.json(
      { error: 'Failed to process audio' },
      { status: 500 }
    )
  }
}
