import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import { sendFeedbackFormEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    console.log('📱 Public QR Code scan API route hit!')
    
    const body = await request.json()
    const { qrCodeData, eventId } = body

    if (!qrCodeData && !eventId) {
      return NextResponse.json({ 
        error: 'Missing required field: qrCodeData or eventId' 
      }, { status: 400 })
    }

    // Handle both old encrypted format and new URL format
    let targetEventId = eventId
    
    if (qrCodeData && !eventId) {
      // Check if it's a URL format
      if (qrCodeData.startsWith('http')) {
        try {
          const url = new URL(qrCodeData)
          const eventParam = url.searchParams.get('event')
          if (eventParam) {
            targetEventId = eventParam
          }
        } catch (urlError) {
          console.error('Invalid URL format:', urlError)
          return NextResponse.json({ 
            error: 'Invalid QR code format' 
          }, { status: 400 })
        }
      } else {
        // Handle old encrypted format (if needed)
        return NextResponse.json({ 
          error: 'Please use the authenticated scanner for this QR code' 
        }, { status: 400 })
      }
    }

    if (!targetEventId) {
      return NextResponse.json({ 
        error: 'Event ID not found in QR code' 
      }, { status: 400 })
    }

    // Get QR code details
    const { data: qrCode, error: qrError } = await supabaseAdmin
      .from('event_qr_codes')
      .select(`
        id, event_id, active, scan_window_start, scan_window_end,
        events (
          id, title, date, start_time, end_time
        )
      `)
      .eq('event_id', targetEventId)
      .eq('active', true)
      .single()

    if (qrError || !qrCode) {
      return NextResponse.json({ 
        error: 'QR code not found or inactive' 
      }, { status: 404 })
    }

    // Check if QR code is within scan window
    const now = new Date()
    const scanStart = new Date(qrCode.scan_window_start)
    const scanEnd = new Date(qrCode.scan_window_end)

    if (now < scanStart) {
      return NextResponse.json({ 
        error: 'QR code scanning is not yet active',
        details: {
          scanWindowStart: scanStart.toISOString(),
          currentTime: now.toISOString()
        }
      }, { status: 400 })
    }

    if (now > scanEnd) {
      return NextResponse.json({ 
        error: 'QR code scanning has expired',
        details: {
          scanWindowEnd: scanEnd.toISOString(),
          currentTime: now.toISOString()
        }
      }, { status: 400 })
    }

    // For public scanning, we need to get user info from the request
    // This could be from a form or session token
    const { userEmail, userName } = body

    if (!userEmail) {
      return NextResponse.json({ 
        error: 'Please provide your email address to mark attendance' 
      }, { status: 400 })
    }

    // Get or create user
    let user
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('email', userEmail)
      .single()

    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist, create them
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          email: userEmail,
          name: userName || userEmail.split('@')[0],
          role: 'student'
        })
        .select('id, name, email')
        .single()

      if (createError) {
        console.error('Error creating user:', createError)
        return NextResponse.json({ 
          error: 'Failed to create user account' 
        }, { status: 500 })
      }

      user = newUser
    } else if (userError) {
      console.error('Error fetching user:', userError)
      return NextResponse.json({ 
        error: 'Failed to fetch user information' 
      }, { status: 500 })
    } else {
      user = existingUser
    }

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

    if (bookingError || !booking) {
      return NextResponse.json({ 
        error: 'You do not have a booking for this event' 
      }, { status: 400 })
    }

    // Check if already checked in
    if (booking.checked_in) {
      return NextResponse.json({ 
        error: 'You have already checked in for this event',
        details: {
          checkedInAt: booking.checked_in_at
        }
      }, { status: 400 })
    }

    // Mark attendance
    const { error: updateError } = await supabaseAdmin
      .from('event_bookings')
      .update({
        checked_in: true,
        checked_in_at: now.toISOString(),
        status: 'attended'
      })
      .eq('id', booking.id)

    if (updateError) {
      console.error('Error updating attendance:', updateError)
      return NextResponse.json({ 
        error: 'Failed to mark attendance' 
      }, { status: 500 })
    }

    // Log the scan
    const { error: scanLogError } = await supabaseAdmin
      .from('qr_code_scans')
      .insert({
        event_id: targetEventId,
        user_id: user.id,
        booking_id: booking.id,
        scan_success: true
      })

    if (scanLogError) {
      console.error('Failed to log scan:', scanLogError)
      // Don't fail the request for logging errors
    }

    // Send feedback form email
    try {
      await sendFeedbackFormEmail({
        recipientEmail: user.email,
        recipientName: user.name,
        eventTitle: qrCode.events?.title || 'Event',
        eventDate: qrCode.events?.date || 'Date not available',
        eventTime: qrCode.events?.start_time || 'Time not available',
        feedbackFormUrl: `${process.env.NEXTAUTH_URL}/feedback/event/${targetEventId}`
      })
    } catch (emailError) {
      console.error('Failed to send feedback email:', emailError)
      // Don't fail the request for email errors
    }

    console.log('✅ Attendance marked successfully for user:', user.id)

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      details: {
        eventTitle: qrCode.events?.title,
        eventDate: qrCode.events?.date,
        checkedInAt: now.toISOString(),
        feedbackEmailSent: true
      }
    })

  } catch (error) {
    console.error('Error in public QR code scan:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}