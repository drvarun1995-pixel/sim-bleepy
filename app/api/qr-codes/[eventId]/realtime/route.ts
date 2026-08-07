import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import {
  attendeesFingerprint,
  fetchQrAttendance,
  getLatestQrCodeIdForEvent,
} from '@/lib/qrAttendance'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const POLL_INTERVAL_MS = 3000

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!['admin', 'meded_team', 'ctf'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const qrCodeId = await getLatestQrCodeIdForEvent(params.eventId)
    if (!qrCodeId) {
      return NextResponse.json({ error: 'QR code not found for this event' }, { status: 404 })
    }

    const stream = new ReadableStream({
      start(controller) {
        let isCleanedUp = false
        let lastScanCount = -1
        let lastAttendeeFingerprint = ''

        const pushUpdate = async () => {
          if (isCleanedUp) return

          try {
            const { scanCount, attendees } = await fetchQrAttendance(qrCodeId)
            const fingerprint = attendeesFingerprint(attendees)

            if (scanCount !== lastScanCount) {
              lastScanCount = scanCount
              controller.enqueue(
                `data: ${JSON.stringify({
                  type: 'scan_count_update',
                  scanCount,
                  timestamp: Date.now(),
                })}\n\n`
              )
            }

            if (fingerprint !== lastAttendeeFingerprint) {
              lastAttendeeFingerprint = fingerprint
              controller.enqueue(
                `data: ${JSON.stringify({
                  type: 'attendees_update',
                  attendees,
                  timestamp: Date.now(),
                })}\n\n`
              )
            }
          } catch (error) {
            console.error('Error polling attendance for SSE:', error)
          }
        }

        pushUpdate()

        const pollInterval = setInterval(pushUpdate, POLL_INTERVAL_MS)
        const pingInterval = setInterval(() => {
          if (isCleanedUp) return
          try {
            controller.enqueue(`data: {"type":"ping","timestamp":${Date.now()}}\n\n`)
          } catch {
            clearInterval(pingInterval)
          }
        }, 30000)

        const cleanup = () => {
          if (isCleanedUp) return
          isCleanedUp = true
          clearInterval(pollInterval)
          clearInterval(pingInterval)
          try {
            controller.close()
          } catch {
            // already closed
          }
        }

        request.signal.addEventListener('abort', cleanup)
        ;(controller as any).cleanup = cleanup
      },

      cancel() {
        if ((this as any).cleanup) {
          ;(this as any).cleanup()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in real-time attendance SSE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
