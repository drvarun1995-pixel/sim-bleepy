import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

// GET - Get lobby status (SSE endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Set up Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        console.log('📡 SSE connection established for challenge:', params.code)

        const sendUpdate = async () => {
          try {
            // Get challenge
            const { data: challenge } = await supabaseAdmin
              .from('quiz_challenges')
              .select('*')
              .eq('code', params.code)
              .single()

            if (!challenge) {
              controller.enqueue(`data: ${JSON.stringify({ error: 'Challenge not found' })}\n\n`)
              return
            }

            // Get participants
            const { data: participants } = await supabaseAdmin
              .from('quiz_challenge_participants')
              .select(`
                *,
                users:user_id (
                  id,
                  name,
                  email
                )
              `)
              .eq('challenge_id', challenge.id)
              .order('joined_at', { ascending: true })

            const data = {
              type: 'lobby_update',
              challenge,
              participants: participants || [],
              timestamp: Date.now(),
            }

            controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
          } catch (error) {
            console.error('Error in SSE update:', error)
          }
        }

        // Send initial update
        await sendUpdate()

        // Set up polling (every 2 seconds)
        const interval = setInterval(sendUpdate, 2000)

        // Set up Supabase realtime subscription
        const subscription = supabaseAdmin
          .channel(`challenge-${params.code}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'quiz_challenge_participants',
              filter: `challenge_id=eq.${challenge?.id}`,
            },
            async () => {
              await sendUpdate()
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'quiz_challenges',
              filter: `id=eq.${challenge?.id}`,
            },
            async () => {
              await sendUpdate()
            }
          )
          .subscribe()

        // Keep connection alive with periodic ping
        const pingInterval = setInterval(() => {
          controller.enqueue(`data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`)
        }, 30000) // Every 30 seconds

        // Cleanup function
        const cleanup = () => {
          clearInterval(interval)
          clearInterval(pingInterval)
          subscription.unsubscribe()
          try {
            controller.close()
          } catch (error) {
            // Controller might already be closed
          }
        }

        // Handle client disconnect
        request.signal.addEventListener('abort', cleanup)
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in GET /api/quiz/challenges/[code]/lobby:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


