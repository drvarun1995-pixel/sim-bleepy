import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import { sendFeedbackFormEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Simple endpoint to send feedback invites after event end.
// Intended to be triggered by an external scheduler (e.g., Vercel Cron or Supabase Scheduler).
export async function POST(request: NextRequest) {
  try {
    const now = new Date()
    const lookbackHours = parseInt(process.env.FEEDBACK_INVITE_LOOKBACK_HOURS || '6', 10)
    const windowStart = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000)

    // Find events that ended within the lookback window and have feedback enabled.
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('id, title, date, end_time, booking_enabled, feedback_enabled')
      .eq('feedback_enabled', true)

    if (eventsError) {
      console.error('Error querying events for feedback invites:', eventsError)
      return NextResponse.json({ error: 'Failed to query events' }, { status: 500 })
    }

    const endedEvents = (events || []).filter((e: any) => {
      const endAt = new Date(`${e.date}T${e.end_time || '23:59:59'}Z`)
      return endAt <= now && endAt >= windowStart
    })

    let invitesSent = 0

    for (const ev of endedEvents) {
      // Only send for workflows where we deferred the email (booking_enabled true)
      if (!ev.booking_enabled) continue

      // Active form for event
      const { data: activeForm } = await supabaseAdmin
        .from('feedback_forms')
        .select('id')
        .eq('event_id', ev.id)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!activeForm?.id) continue

      // Users who scanned attendance successfully
      const { data: qrRows } = await supabaseAdmin
        .from('event_qr_codes')
        .select('id')
        .eq('event_id', ev.id)

      const qrIds = (qrRows || []).map((r: any) => r.id)
      if (qrIds.length === 0) continue

      const { data: scans } = await supabaseAdmin
        .from('qr_code_scans')
        .select('user_id')
        .in('qr_code_id', qrIds)
        .eq('scan_success', true)

      const uniqueUserIds = Array.from(new Set((scans || []).map((s: any) => s.user_id)))
      if (uniqueUserIds.length === 0) continue

      // Lookup emails
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, name, email')
        .in('id', uniqueUserIds)

      for (const u of users || []) {
        try {
          await sendFeedbackFormEmail({
            recipientEmail: u.email,
            recipientName: u.name,
            eventTitle: ev.title,
            eventDate: ev.date,
            eventTime: ev.end_time || '',
            feedbackFormUrl: `${process.env.NEXTAUTH_URL}/feedback/${activeForm.id}`
          })
          invitesSent += 1
        } catch (e) {
          console.error('Failed to send feedback invite', { eventId: ev.id, userId: u.id }, e)
        }
      }
    }

    return NextResponse.json({ success: true, invitesSent, windowStart: windowStart.toISOString(), now: now.toISOString() })
  } catch (error) {
    console.error('Error in feedback invites job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


