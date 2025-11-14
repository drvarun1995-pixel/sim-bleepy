import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

// GET - Get lobby status (SSE endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get challenge first to verify it exists and get its ID
    const { data: initialChallenge } = await supabaseAdmin
      .from('quiz_challenges')
      .select('id')
      .eq('code', code)
      .single()

    if (!initialChallenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    const challengeId = initialChallenge.id

    const { data: viewerUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .maybeSingle()

    const viewerUserId = viewerUser?.id || null

    // Set up Server-Sent Events
    const stream = new ReadableStream({
      start(controller) {
        console.log(`[SSE ${code}] 📡 SSE connection established for challenge:`, code)
        console.log(`[SSE ${code}] User email:`, session.user.email)
        
        // Use a shared state object to ensure atomic updates
        const state = {
          isClosed: false,
          interval: null as NodeJS.Timeout | null,
          pingInterval: null as NodeJS.Timeout | null,
          subscription: null as ReturnType<typeof supabaseAdmin.channel> | null,
          lastChallengeStatus: null as string | null,
          lastParticipantsHash: null as string | null, // Hash of participants array for comparison
          lastSettingsHash: null as string | null, // Hash of challenge settings for comparison
        }

        // Safe enqueue function that handles all errors
        const safeEnqueue = (data: string): boolean => {
          if (state.isClosed) {
            console.log(`[SSE ${code}] Cannot enqueue - connection is closed`)
            return false
          }
          
          try {
            // Enqueue as string (Next.js ReadableStream accepts strings)
            controller.enqueue(data)
            return true
          } catch (error: any) {
            // Any error means controller is closed
            if (error?.code === 'ERR_INVALID_STATE' || error?.message?.includes('closed') || error?.message?.includes('Controller')) {
              console.log(`[SSE ${code}] Controller is closed, cleaning up`)
              state.isClosed = true
              cleanup()
              return false
            }
            // Re-throw unexpected errors
            console.error(`[SSE ${code}] Unexpected error in safeEnqueue:`, error)
            throw error
          }
        }

        const sendUpdate = async (): Promise<void> => {
          // Check if closed - return immediately
          if (state.isClosed) {
            return
          }

          try {
            // Get challenge
            const { data: challenge, error: challengeError } = await supabaseAdmin
              .from('quiz_challenges')
              .select('*')
              .eq('code', code)
              .single()

            // Check again after async operation
            if (state.isClosed) {
              return
            }

            if (challengeError || !challenge) {
              console.error(`[SSE ${code}] Error fetching challenge:`, challengeError)
              // Try to send error, but don't fail if controller is closed
              try {
                controller.enqueue(`data: ${JSON.stringify({ type: 'error', error: 'Challenge not found' })}\n\n`)
              } catch (e) {
                // Controller closed, cleanup
                state.isClosed = true
                cleanup()
              }
              return
            }

            // Get participants
            const { data: participants, error: participantsError } = await supabaseAdmin
              .from('quiz_challenge_participants')
              .select(`
                *,
                users:user_id (
                  id,
                  name,
                  profile_picture_url
                )
              `)
              .eq('challenge_id', challenge.id)
              .order('joined_at', { ascending: true })

            if (participantsError) {
              console.error(`[SSE ${code}] Error fetching participants:`, participantsError)
            }

            // Final check before enqueueing
            if (state.isClosed) {
              return
            }

            // Create a hash of participants for comparison (simple but effective)
            const participantsArray = participants || []
            const participantsHash = JSON.stringify(
              participantsArray.map((p: any) => ({ id: p.id, userId: p.user_id, status: p.status }))
            )

            // Create a hash of challenge settings for comparison
            const settingsHash = JSON.stringify({
              selected_categories: challenge.selected_categories || null,
              selected_difficulties: challenge.selected_difficulties || null,
              question_count: challenge.question_count || null,
              time_limit: challenge.time_limit || null,
            })

            // Check if data actually changed
            const statusChanged = state.lastChallengeStatus !== challenge.status
            const participantsChanged = state.lastParticipantsHash !== participantsHash
            const settingsChanged = state.lastSettingsHash !== settingsHash

            // Only send update if something actually changed (or if it's the first update)
            if (!statusChanged && !participantsChanged && !settingsChanged && state.lastChallengeStatus !== null) {
              // Data hasn't changed, skip sending update
              return
            }

            // Update last known state
            state.lastChallengeStatus = challenge.status
            state.lastParticipantsHash = participantsHash
            state.lastSettingsHash = settingsHash

            const data = {
              type: 'lobby_update',
              challenge,
              participants: participantsArray,
              timestamp: Date.now(),
            }

            const message = `data: ${JSON.stringify(data)}\n\n`
            
            // Only log when data actually changes (not on every poll)
            if (statusChanged || participantsChanged || settingsChanged) {
              console.log(`[SSE ${code}] Sending update (data changed):`, {
                challengeId: challenge.id,
                status: challenge.status,
                statusChanged,
                participantsCount: participantsArray.length,
                participantsChanged,
                settingsChanged,
                settings: {
                  selected_categories: challenge.selected_categories,
                  selected_difficulties: challenge.selected_difficulties,
                  question_count: challenge.question_count,
                  time_limit: challenge.time_limit,
                },
                participants: participantsArray.map((p: any) => ({ id: p.id, userId: p.user_id, name: p.users?.name }))
              })
            }

            // Enqueue directly (like the working QR code endpoint)
            try {
              controller.enqueue(message)
              if (statusChanged || participantsChanged || settingsChanged) {
                console.log(`[SSE ${code}] ✅ Update sent successfully`)
              }
            } catch (error: any) {
              // Controller might be closed
              if (error?.code === 'ERR_INVALID_STATE' || error?.message?.includes('closed') || error?.message?.includes('Controller')) {
                console.log(`[SSE ${code}] Controller closed during enqueue, cleaning up`)
                state.isClosed = true
                cleanup()
                return
              }
              throw error
            }
          } catch (error: any) {
            // If it's a controller error, cleanup
            if (error?.code === 'ERR_INVALID_STATE' || error?.message?.includes('closed') || error?.message?.includes('Controller')) {
              state.isClosed = true
              cleanup()
              return
            }
            // Only log non-controller errors
            if (!state.isClosed) {
              console.error(`[SSE ${code}] Error in SSE update:`, error)
            }
          }
        }

        // Cleanup function - clears all resources
        const cleanup = (): void => {
          // Prevent multiple cleanup calls
          if (state.isClosed) {
            return
          }
          
          // Set closed flag FIRST to prevent any new operations
          state.isClosed = true
          
          // Clear intervals immediately
          if (state.interval) {
            try {
              clearInterval(state.interval)
            } catch (error) {
              // Ignore clearInterval errors
            }
            state.interval = null
          }
          
          if (state.pingInterval) {
            try {
              clearInterval(state.pingInterval)
            } catch (error) {
              // Ignore clearInterval errors
            }
            state.pingInterval = null
          }
          
          // Unsubscribe from Supabase
          if (state.subscription) {
            try {
              state.subscription.unsubscribe()
            } catch (error) {
              // Ignore unsubscribe errors
            }
            state.subscription = null
          }
          
          // Close controller (may already be closed)
          try {
            controller.close()
          } catch (error) {
            // Controller might already be closed - ignore
          }
          
          console.log('📡 SSE cleanup completed for challenge:', code)
        }

        // Send initial update immediately to establish connection (fire and forget, don't await)
        // This sends challenge and participants data right away so the client knows the connection is working
        sendUpdate().catch((error) => {
          console.error(`[SSE ${code}] ❌ Error in initial update:`, error)
        })

        // Set up polling (every 30 seconds) - only as a backup since Supabase realtime handles most updates
        // This is just to catch any missed updates or if Supabase realtime fails
        if (!state.isClosed) {
          state.interval = setInterval(() => {
            // Check closed state at start of each interval
            if (state.isClosed) {
              // Clear interval and exit
              if (state.interval) {
                clearInterval(state.interval)
                state.interval = null
              }
              return
            }
            
            // Call sendUpdate - it will only send if data changed
            sendUpdate().catch(() => {
              // Errors are handled in sendUpdate, which will call cleanup if needed
            })
          }, 30000) // 30 seconds - just a backup, Supabase realtime is primary
        }

        // Set up Supabase realtime subscription - only if not closed
        if (!state.isClosed) {
          console.log(`[SSE ${code}] Setting up Supabase realtime subscription for challenge ${challengeId}`)
          state.subscription = supabaseAdmin
            .channel(`challenge-${code}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'quiz_challenge_participants',
                filter: `challenge_id=eq.${challengeId}`,
              },
              async (payload) => {
                console.log(`[SSE ${code}] Participant change detected:`, payload.eventType, payload)
                if (!state.isClosed) {
                  if (
                    payload.eventType === 'DELETE' &&
                    viewerUserId &&
                    payload.old &&
                    'user_id' in payload.old &&
                    payload.old.user_id === viewerUserId
                  ) {
                    console.log(`[SSE ${code}] Sending viewer_removed event to user ${viewerUserId}`)
                    safeEnqueue(`data: ${JSON.stringify({ type: 'viewer_removed', timestamp: Date.now() })}\n\n`)
                  }

                  await sendUpdate().catch(() => {
                    // Errors are handled in sendUpdate
                  })
                }
              }
            )
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'quiz_challenges',
                filter: `id=eq.${challengeId}`,
              },
              async (payload) => {
                console.log(`[SSE ${code}] Challenge change detected:`, payload.eventType, payload)
                if (!state.isClosed) {
                  await sendUpdate().catch(() => {
                    // Errors are handled in sendUpdate
                  })
                }
              }
            )
            .subscribe((status) => {
              console.log(`[SSE ${code}] Subscription status:`, status)
            })
        }

        // Keep connection alive with periodic ping - only if not closed
        if (!state.isClosed) {
          state.pingInterval = setInterval(() => {
            // Check closed state at start
            if (state.isClosed) {
              // Clear interval and exit
              if (state.pingInterval) {
                clearInterval(state.pingInterval)
                state.pingInterval = null
              }
              return
            }
            
            // Use safe enqueue for ping
            safeEnqueue(`data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`)
          }, 30000) // Every 30 seconds
        }

        // Handle client disconnect - cleanup immediately when request is aborted
        request.signal.addEventListener('abort', () => {
          console.log('📡 SSE connection aborted for challenge:', code)
          cleanup()
        })
      },
      cancel() {
        // Called when the stream is cancelled
        console.log('📡 SSE stream cancelled for challenge:', code)
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


