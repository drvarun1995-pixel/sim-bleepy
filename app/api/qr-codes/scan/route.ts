import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import crypto from 'crypto'
import { sendFeedbackFormEmail, sendAttendanceThankYouEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    console.log('📱 QR Code scan API route hit!')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { qrCodeData, eventId } = body

    if (!qrCodeData && !eventId) {
      return NextResponse.json({ 
        error: 'Missing required field: qrCodeData or eventId' 
      }, { status: 400 })
    }

    // Get user info
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Handle both old encrypted format and new URL format
    let targetEventId = eventId
    
    console.log('🔍 Initial event ID:', { eventId, qrCodeData })
    
    if (qrCodeData && !eventId) {
      // Try to parse as URL first
      try {
        const url = new URL(qrCodeData)
        const eventParam = url.searchParams.get('event')
        console.log('🔍 URL parsing result:', { url: url.href, eventParam })
        if (eventParam) {
          targetEventId = eventParam
          console.log('🔍 Using event ID from URL:', targetEventId)
        } else {
          // Fallback to old encrypted format
          const secretKey = process.env.QR_CODE_SECRET_KEY || 'default-secret-key'
          const decipher = crypto.createDecipher('aes-256-cbc', secretKey)
          let decrypted = decipher.update(qrCodeData, 'hex', 'utf8')
          decrypted += decipher.final('utf8')
          const decryptedData = JSON.parse(decrypted)
          
          if (decryptedData.type !== 'attendance') {
            return NextResponse.json({ 
              error: 'Invalid QR code type' 
            }, { status: 400 })
          }
          
          targetEventId = decryptedData.eventId
        }
      } catch (urlError) {
        // If URL parsing fails, try old encrypted format
        try {
          const secretKey = process.env.QR_CODE_SECRET_KEY || 'default-secret-key'
          const decipher = crypto.createDecipher('aes-256-cbc', secretKey)
          let decrypted = decipher.update(qrCodeData, 'hex', 'utf8')
          decrypted += decipher.final('utf8')
          const decryptedData = JSON.parse(decrypted)
          
          if (decryptedData.type !== 'attendance') {
            return NextResponse.json({ 
              error: 'Invalid QR code type' 
            }, { status: 400 })
          }
          
          targetEventId = decryptedData.eventId
        } catch (decryptError) {
          console.error('QR code parsing failed:', decryptError)
          return NextResponse.json({ 
            error: 'Invalid QR code' 
          }, { status: 400 })
        }
      }
    }

    if (!targetEventId) {
      console.log('❌ No target event ID found')
      return NextResponse.json({ 
        error: 'Event ID not found in QR code' 
      }, { status: 400 })
    }

    console.log('🔍 Final target event ID:', targetEventId)

    // Get latest QR code details for this event (handles multiple records)
    const { data: qrRows, error: qrListError } = await supabaseAdmin
      .from('event_qr_codes')
      .select(`
        id, event_id, active, scan_window_start, scan_window_end,
        created_at,
        events (
          id, title, date, start_time, end_time
        )
      `)
      .eq('event_id', targetEventId)
      .order('created_at', { ascending: false })
      .limit(1)

    const qrCode = Array.isArray(qrRows) ? qrRows[0] : null
    const qrError = qrListError

    console.log('🔍 QR code query result:', { 
      qrCodeId: (qrCode as any)?.id,
      active: (qrCode as any)?.active,
      targetEventId,
      eventIdType: typeof targetEventId,
      eventIdLength: targetEventId?.length,
      qrError
    })

    if (qrError) {
      console.error('❌ QR code query error:', qrError)
      return NextResponse.json({ 
        error: 'QR code not found' 
      }, { status: 404 })
    }

    if (!qrCode) {
      console.error('❌ No QR code found for event:', targetEventId)
      return NextResponse.json({ 
        error: 'QR code not found' 
      }, { status: 404 })
    }

    if (!qrCode.active) {
      console.error('❌ QR code is inactive for event:', targetEventId)
      return NextResponse.json({ 
        error: 'QR code is inactive' 
      }, { status: 400 })
    }

    // Check if QR code is within scan window
    const now = new Date()
    const scanStart = new Date(qrCode.scan_window_start)
    const scanEnd = new Date(qrCode.scan_window_end)

    console.log('⏰ Scan window check:', {
      now: now.toISOString(),
      scanStart: scanStart.toISOString(),
      scanEnd: scanEnd.toISOString(),
      isBeforeStart: now < scanStart,
      isAfterEnd: now > scanEnd
    })

    if (now < scanStart) {
      console.log('❌ QR code scanning is not yet active')
      return NextResponse.json({ 
        error: 'QR code scanning is not yet active',
        details: {
          scanWindowStart: scanStart.toISOString(),
          currentTime: now.toISOString()
        }
      }, { status: 400 })
    }

    if (now > scanEnd) {
      console.log('❌ QR code scanning has expired')
      return NextResponse.json({ 
        error: 'QR code scanning has expired',
        details: {
          scanWindowEnd: scanEnd.toISOString(),
          currentTime: now.toISOString()
        }
      }, { status: 400 })
    }

    // Read event flags for policy decisions
    const { data: eventFlags } = await supabaseAdmin
      .from('events')
      .select('booking_enabled, qr_attendance_enabled, feedback_enabled, auto_generate_certificate, certificate_template_id, certificate_auto_send_email, feedback_required_for_certificate, date, start_time, end_time')
      .eq('id', targetEventId)
      .single()

    const role = (user as any)?.role || 'student'
    const isPrivileged = ['admin','meded_team','ctf'].includes(role)

    // Check if user has a booking for this event
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('event_bookings')
      .select(`
        id, status, checked_in, checked_in_at,
        events (
          id, title, date, start_time, end_time
        )
      `)
      .eq('event_id', targetEventId)
      .eq('user_id', user.id)
      .neq('status', 'cancelled')
      .is('deleted_at', null)
      .single()

    // Enforce booking requirement for workflows with booking_enabled + qr_attendance_enabled
    if (!isPrivileged && eventFlags?.booking_enabled && eventFlags?.qr_attendance_enabled && !booking) {
      return NextResponse.json({ 
        error: 'Booking required to scan attendance for this event.' 
      }, { status: 403 })
    }

    // If user has a booking, check if already checked in
    if (booking && booking.checked_in) {
      return NextResponse.json({ 
        error: 'Attendance already marked for this event',
        details: {
          checkedInAt: booking.checked_in_at
        }
      }, { status: 400 })
    }

    // If user has a booking, check booking status
    if (booking && !['confirmed', 'waitlist'].includes(booking.status)) {
      return NextResponse.json({ 
        error: 'Booking status does not allow attendance marking' 
      }, { status: 400 })
    }

    // Update booking to mark attendance (if user has a booking)
    if (booking) {
      const { error: updateError } = await supabaseAdmin
        .from('event_bookings')
        .update({
          checked_in: true,
          checked_in_at: now.toISOString(),
          status: 'attended'
        })
        .eq('id', booking.id)

      if (updateError) {
        console.error('Failed to update booking:', updateError)
        return NextResponse.json({ 
          error: 'Failed to mark attendance' 
        }, { status: 500 })
      }
    }

    // Prevent duplicate attendance: check if user already has a successful scan for this QR code
    const { data: existingScan, error: existingScanError } = await supabaseAdmin
      .from('qr_code_scans')
      .select('id, scanned_at')
      .eq('qr_code_id', qrCode.id)
      .eq('user_id', user.id)
      .eq('scan_success', true)
      .order('scanned_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingScanError) {
      console.error('Failed to check existing scan:', existingScanError)
      // Continue; we can still attempt to insert
    }

    if (existingScan) {
      return NextResponse.json({
        success: true,
        message: 'Attendance already marked for this event',
        details: {
          eventTitle: (qrCode.events as any)?.title,
          eventDate: (qrCode.events as any)?.date,
          checkedInAt: existingScan.scanned_at,
          hasBooking: !!booking,
          duplicate: true
        }
      })
    }

    // Log the scan (booking_id can be null if no booking)
    const { error: scanLogError } = await supabaseAdmin
      .from('qr_code_scans')
      .insert({
        qr_code_id: qrCode.id,
        user_id: user.id,
        booking_id: booking?.id || null,
        scanned_at: now.toISOString(),
        scan_success: true
      })
    
    if (scanLogError) {
      // Handle duplicate via DB unique index (if added later)
      const isDuplicate = (scanLogError as any)?.code === '23505'
      if (isDuplicate) {
        return NextResponse.json({
          success: true,
          message: 'Attendance already marked for this event',
          details: {
            eventTitle: (qrCode.events as any)?.title,
            eventDate: (qrCode.events as any)?.date,
            checkedInAt: now.toISOString(),
            hasBooking: !!booking,
            duplicate: true
          }
        })
      }
      console.error('Failed to log scan:', scanLogError)
      // Don't fail the request for logging errors
    }

    // Note: Some databases may not have a scan_count column; skip increment safely

    // Send feedback form email only if feedback is enabled AND policy allows immediate send
    // Immediate send: workflows without booking (Attendance + Feedback). Otherwise, defer to event-end job.
    if (eventFlags?.feedback_enabled && !eventFlags?.booking_enabled) {
      try {
        // Find the latest active feedback form for this event
        const { data: activeForm } = await supabaseAdmin
          .from('feedback_forms')
          .select('id')
          .eq('event_id', targetEventId)
          .eq('active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        const feedbackUrl = activeForm?.id
          ? `${process.env.NEXTAUTH_URL}/feedback/${activeForm.id}`
          : `${process.env.NEXTAUTH_URL}/feedback`;

        await sendFeedbackFormEmail({
          recipientEmail: user.email,
          recipientName: user.name,
          eventTitle: (qrCode.events as any)?.title || 'Event',
          eventDate: (qrCode.events as any)?.date || 'Date not available',
          eventTime: (qrCode.events as any)?.start_time || 'Time not available',
          feedbackFormUrl: feedbackUrl
        })
      } catch (emailError) {
        console.error('Failed to send feedback email:', emailError)
        // Don't fail the request for email errors
      }
    }

    // Queue certificate cron task ONLY if auto-generation is enabled AND feedback is NOT required
    // If feedback_required_for_certificate is true, DO NOT create cron task - certificates will be generated after feedback submission instead
    const shouldCreateCertTask = eventFlags?.auto_generate_certificate && 
                                 eventFlags?.certificate_template_id && 
                                 !eventFlags?.feedback_required_for_certificate
    
    if (shouldCreateCertTask) {
      try {
        const eventDate = eventFlags.date || (qrCode.events as any)?.date
        const fallbackDate = new Date().toISOString().split('T')[0]
        const eventEndTime = eventFlags.end_time || (qrCode.events as any)?.end_time || eventFlags.start_time || (qrCode.events as any)?.start_time || '23:59:59'

        let taskRunAt = new Date()
        if (eventDate) {
          const parsed = new Date(`${eventDate}T${eventEndTime}Z`)
          if (!Number.isNaN(parsed.getTime())) {
            taskRunAt = parsed
          }
        }

        if (taskRunAt < now) {
          taskRunAt = now
        }

        const idempotencyKey = `certificates_auto_generate|${targetEventId}|${user.id}|${eventDate || fallbackDate}`

        const { error: cronError } = await supabaseAdmin
          .from('cron_tasks')
          .insert({
            task_type: 'certificates_auto_generate',
            event_id: targetEventId,
            user_id: user.id,
            status: 'pending',
            run_at: taskRunAt.toISOString(),
            idempotency_key: idempotencyKey
          })

        if (cronError && (cronError as any)?.code !== '23505') {
          console.error('Failed to enqueue certificate generation task:', cronError)
        } else {
          console.log('✅ Queued certificate generation task (not gated by feedback) for user:', user.id)
        }
      } catch (taskError) {
        console.error('Failed to schedule certificate generation task:', taskError)
      }
    } else if (eventFlags?.auto_generate_certificate && eventFlags?.feedback_required_for_certificate) {
      console.log('ℹ️ Certificate generation gated by feedback - NO cron task created. Will be triggered after feedback submission for user:', user.id)
      // Explicitly do NOT create any cron task here
    }

    // Workflow 4: Attendance-Only - Send thank you email when booking/feedback/certificates are all disabled
    if (!eventFlags?.booking_enabled && !eventFlags?.feedback_enabled && !eventFlags?.auto_generate_certificate) {
      try {
        await sendAttendanceThankYouEmail({
          recipientEmail: user.email,
          recipientName: user.name,
          eventTitle: (qrCode.events as any)?.title || 'Event',
          eventDate: (qrCode.events as any)?.date || 'Date not available',
          eventTime: (qrCode.events as any)?.start_time || 'Time not available'
        })
        console.log('✅ Thank you email sent for attendance-only event')
      } catch (emailError) {
        console.error('Failed to send thank you email:', emailError)
        // Don't fail the request for email errors
      }
    }

    console.log('✅ Attendance marked successfully for user:', user.id)

    return NextResponse.json({
      success: true,
      message: booking ? 'Attendance marked successfully' : 'Attendance recorded successfully',
      details: {
        eventTitle: (qrCode.events as any)?.title,
        eventDate: (qrCode.events as any)?.date,
        checkedInAt: now.toISOString(),
        hasBooking: !!booking,
        feedbackEmailSent: Boolean(eventFlags?.feedback_enabled && !eventFlags?.booking_enabled)
      }
    })

  } catch (error) {
    console.error('Error in QR code scan:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
