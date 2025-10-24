import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import crypto from 'crypto'
import { sendFeedbackFormEmail } from '@/lib/email'

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
      .select('id, name, email')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Handle both old encrypted format and new URL format
    let targetEventId = eventId
    
    if (qrCodeData && !eventId) {
      // Try to parse as URL first
      try {
        const url = new URL(qrCodeData)
        const eventParam = url.searchParams.get('event')
        if (eventParam) {
          targetEventId = eventParam
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
        error: 'Attendance already marked for this event',
        details: {
          checkedInAt: booking.checked_in_at
        }
      }, { status: 400 })
    }

    // Check booking status
    if (!['confirmed', 'waitlist'].includes(booking.status)) {
      return NextResponse.json({ 
        error: 'Booking status does not allow attendance marking' 
      }, { status: 400 })
    }

    // Update booking to mark attendance
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

    // Log the scan
    const { error: scanLogError } = await supabaseAdmin
      .from('qr_code_scans')
      .insert({
        qr_code_id: qrCode.id,
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
        eventTitle: (qrCode.events as any)?.title || 'Event',
        eventDate: (qrCode.events as any)?.date || 'Date not available',
        eventTime: (qrCode.events as any)?.start_time || 'Time not available',
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
        eventTitle: (qrCode.events as any)?.title,
        eventDate: (qrCode.events as any)?.date,
        checkedInAt: now.toISOString(),
        feedbackEmailSent: true
      }
    })

  } catch (error) {
    console.error('Error in QR code scan:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
