import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import QRCode from 'qrcode'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Auto-generating QR code for event')
    
    const body = await request.json()
    const { eventId } = body

    console.log('🚀 Event ID received:', eventId)

    if (!eventId) {
      console.log('❌ Missing eventId in request body')
      return NextResponse.json({ 
        error: 'Missing required field: eventId' 
      }, { status: 400 })
    }

    // Get event details
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select(`
        id, title, date, start_time, end_time, booking_enabled, status
      `)
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      console.log('❌ Event not found:', eventError)
      return NextResponse.json({ 
        error: 'Event not found' 
      }, { status: 404 })
    }

    console.log('🚀 Event found:', event.title, 'Booking enabled:', event.booking_enabled)

    // Check if event has booking enabled
    if (!event.booking_enabled) {
      console.log('❌ Event does not have booking enabled')
      return NextResponse.json({ 
        error: 'Event must have booking enabled to generate QR code' 
      }, { status: 400 })
    }

    // Check if QR code already exists
    const { data: existingQR, error: existingError } = await supabaseAdmin
      .from('event_qr_codes')
      .select('id, active')
      .eq('event_id', eventId)
      .single()

    if (existingQR && existingQR.active) {
      console.log('🚀 QR code already exists for this event:', existingQR.id)
      return NextResponse.json({ 
        success: true,
        message: 'QR code already exists for this event',
        qrCode: {
          id: existingQR.id,
          eventId: eventId,
          exists: true
        }
      })
    }

    console.log('🚀 No existing QR code found, proceeding with generation')

    // Calculate scan window (default: event start time to event end time)
    const eventDateTime = new Date(`${event.date}T${event.start_time}`)
    const eventEndDateTime = new Date(`${event.date}T${event.end_time}`)
    
    const scanStart = new Date(eventDateTime) // Event start time
    const scanEnd = new Date(eventEndDateTime) // Event end time

    // Generate QR code URL that points to attendance scanning page
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const qrCodeData = `${baseUrl}/scan-attendance?event=${eventId}`

    // Generate QR code image
    const qrCodeOptions = {
      type: 'png' as const,
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 512
    }

    const qrCodeImageBuffer = await QRCode.toBuffer(qrCodeData, qrCodeOptions)
    
    // Create organized storage path: event-title/qr-code-eventId-timestamp.png
    const timestamp = Date.now()
    const sanitizedEventTitle = event.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase()
    const fileName = `${sanitizedEventTitle}/qr-code-${eventId}-${timestamp}.png`
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('qr-codes')
      .upload(fileName, qrCodeImageBuffer, {
        contentType: 'image/png',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload QR code image' 
      }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('qr-codes')
      .getPublicUrl(fileName)

    const qrCodeImageUrl = urlData.publicUrl

    // Save to database
    const { data: qrCode, error: insertError } = await supabaseAdmin
      .from('event_qr_codes')
      .insert({
        event_id: eventId,
        qr_code_data: qrCodeData,
        qr_code_image_url: qrCodeImageUrl,
        scan_window_start: scanStart.toISOString(),
        scan_window_end: scanEnd.toISOString(),
        active: true
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json({ 
        error: 'Failed to save QR code to database' 
      }, { status: 500 })
    }

    console.log('✅ QR Code auto-generated successfully:', qrCode.id)

    return NextResponse.json({
      success: true,
      qrCode: {
        id: qrCode.id,
        eventId: eventId,
        qrCodeImageUrl: qrCodeImageUrl,
        scanWindowStart: scanStart.toISOString(),
        scanWindowEnd: scanEnd.toISOString(),
        active: qrCode.active
      }
    })

  } catch (error) {
    console.error('Error in auto-generating QR code:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
