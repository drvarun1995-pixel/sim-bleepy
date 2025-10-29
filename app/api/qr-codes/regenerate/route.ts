import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import QRCode from 'qrcode'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Regenerating QR code for event')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userRole = user.role
    if (!['admin', 'meded_team', 'ctf'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { eventId, scanWindowStart, scanWindowEnd } = body

    if (!eventId) {
      return NextResponse.json({ 
        error: 'Missing required field: eventId' 
      }, { status: 400 })
    }

    // Get event details
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select(`
        id, title, date, start_time, end_time, qr_attendance_enabled, status
      `)
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ 
        error: 'Event not found' 
      }, { status: 404 })
    }

    // Check if event has QR attendance enabled
    if (!event.qr_attendance_enabled) {
      return NextResponse.json({ 
        error: 'Event must have QR attendance enabled to generate QR code' 
      }, { status: 400 })
    }

    // Delete existing QR code if it exists
    const { data: existingQR, error: fetchError } = await supabaseAdmin
      .from('event_qr_codes')
      .select('id, qr_code_image_url')
      .eq('event_id', eventId)
      .single()

    if (existingQR) {
      // Delete all old QR code images from storage
      if (existingQR.qr_code_image_url) {
        try {
          const url = new URL(existingQR.qr_code_image_url)
          const pathParts = url.pathname.split('/')
          const folderName = pathParts[pathParts.length - 2] // Get the folder name
          
          // List all files in the event folder
          const { data: files, error: listError } = await supabaseAdmin.storage
            .from('qr-codes')
            .list(folderName)
          
          if (!listError && files && files.length > 0) {
            // Delete all files in the folder
            const filePaths = files.map(file => `${folderName}/${file.name}`)
            
            const { error: deleteStorageError } = await supabaseAdmin.storage
              .from('qr-codes')
              .remove(filePaths)
            
            if (deleteStorageError) {
              console.error('Error deleting old QR code images from storage:', deleteStorageError)
            }
          }
        } catch (urlError) {
          console.error('Error parsing image URL:', urlError)
          // Continue with regeneration even if URL parsing fails
        }
      }

      // Delete the existing QR code record
      const { error: deleteError } = await supabaseAdmin
        .from('event_qr_codes')
        .delete()
        .eq('event_id', eventId)

      if (deleteError) {
        console.error('Error deleting existing QR code:', deleteError)
        return NextResponse.json({ 
          error: 'Failed to delete existing QR code' 
        }, { status: 500 })
      }
    }

    // Calculate scan window (use provided values or default to event start/end time)
    let scanStart, scanEnd
    
    if (scanWindowStart && scanWindowEnd) {
      // Use provided scan window
      scanStart = new Date(scanWindowStart)
      scanEnd = new Date(scanWindowEnd)
      
      // Validate dates
      if (isNaN(scanStart.getTime()) || isNaN(scanEnd.getTime())) {
        return NextResponse.json({ 
          error: 'Invalid scan window date format' 
        }, { status: 400 })
      }
      
      if (scanStart >= scanEnd) {
        return NextResponse.json({ 
          error: 'Scan window start must be before scan window end' 
        }, { status: 400 })
      }
    } else {
      // Use default: event start time to event end time
      const eventDateTime = new Date(`${event.date}T${event.start_time}`)
      const eventEndDateTime = new Date(`${event.date}T${event.end_time}`)
      
      scanStart = new Date(eventDateTime) // Event start time
      scanEnd = new Date(eventEndDateTime) // Event end time
    }

    // Generate QR code URL that points to attendance scanning page
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const qrCodeData = `${baseUrl}/scan-attendance-smart?event=${eventId}`

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
    
    console.log('📁 Uploading QR code to:', fileName)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('qr-codes')
      .upload(fileName, qrCodeImageBuffer, {
        contentType: 'image/png',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      console.error('Upload details:', { fileName, eventId, eventTitle: event.title })
      return NextResponse.json({ 
        error: 'Failed to upload QR code image',
        details: uploadError.message 
      }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('qr-codes')
      .getPublicUrl(fileName)

    const qrCodeImageUrl = urlData.publicUrl

    // Insert new QR code to database
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
      console.error('Insert details:', { eventId, qrCodeData, qrCodeImageUrl })
      return NextResponse.json({ 
        error: 'Failed to save QR code to database',
        details: insertError.message 
      }, { status: 500 })
    }

    console.log('✅ QR Code regenerated successfully:', qrCode.id)

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
    console.error('Error in regenerating QR code:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
