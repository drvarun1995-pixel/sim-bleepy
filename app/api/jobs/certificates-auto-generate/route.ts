import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

// Job: auto-generate certificates for attendees after event end (not gated by feedback)
// Triggered by Vercel Cron. Idempotent: skips existing certificates.
export async function POST(request: NextRequest) {
  try {
    const now = new Date()
    const lookbackHours = parseInt(process.env.CERT_JOB_LOOKBACK_HOURS || '6', 10)
    const windowStart = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000)

    // Find candidate events
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('id, title, date, start_time, end_time, auto_generate_certificate, certificate_template_id, certificate_auto_send_email')
      .eq('auto_generate_certificate', true)

    if (eventsError) {
      console.error('Error querying certificate events:', eventsError)
      return NextResponse.json({ error: 'Failed to query events' }, { status: 500 })
    }

    const endedEvents = (events || []).filter((e: any) => {
      if (!e.certificate_template_id) return false
      const endAt = new Date(`${e.date}T${e.end_time || e.start_time || '23:59:59'}Z`)
      return endAt <= now && endAt >= windowStart
    })

    let generated = 0
    let skipped = 0
    let emailed = 0

    for (const ev of endedEvents) {
      // Get attendees who scanned QR successfully
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

      const userIds = Array.from(new Set((scans || []).map((s: any) => s.user_id)))
      if (userIds.length === 0) continue

      // For each user, ensure a booking exists (create minimal if missing), then call auto-generate API
      for (const userId of userIds) {
        // Ensure a booking exists
        let bookingId: string | null = null
        const { data: booking } = await supabaseAdmin
          .from('event_bookings')
          .select('id')
          .eq('event_id', ev.id)
          .eq('user_id', userId)
          .neq('status', 'cancelled')
          .maybeSingle()
        if (booking?.id) {
          bookingId = booking.id
        } else {
          const { data: newBooking } = await supabaseAdmin
            .from('event_bookings')
            .insert({ event_id: ev.id, user_id: userId, status: 'attended', checked_in: true })
            .select('id')
            .single()
          bookingId = newBooking?.id || null
        }

        if (!bookingId) { skipped++; continue }

        // Avoid duplicates
        const { data: existing } = await supabaseAdmin
          .from('certificates')
          .select('id')
          .eq('event_id', ev.id)
          .eq('user_id', userId)
          .maybeSingle()
        if (existing?.id) { skipped++; continue }

        // Call internal API to generate (respects sendEmail flag)
        try {
          const res = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/certificates/auto-generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId: ev.id,
              userId,
              bookingId,
              templateId: ev.certificate_template_id,
              sendEmail: ev.certificate_auto_send_email
            })
          })
          if (res.ok) {
            generated++
            if (ev.certificate_auto_send_email) emailed++
          } else {
            console.error('Auto-generate cert failed:', await res.text())
          }
        } catch (e) {
          console.error('Cert generation error', e)
        }
      }
    }

    return NextResponse.json({ success: true, windowStart: windowStart.toISOString(), now: now.toISOString(), eventsChecked: endedEvents.length, generated, skipped, emailed })
  } catch (error) {
    console.error('Error in certificates job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


