import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { sendCertificateEmail } from '@/lib/email'
import { generateCertificateId } from '@/lib/certificates'
import { generateCertificateImage } from '@/lib/certificate-generator'

export async function POST(request: NextRequest) {
  try {
    console.log('🎓 Auto-certificate generation API route hit!')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      eventId, 
      userId, 
      bookingId, 
      templateId, 
      sendEmail = true 
    } = body

    if (!eventId || !userId || !bookingId || !templateId) {
      return NextResponse.json({ 
        error: 'Missing required fields: eventId, userId, bookingId, templateId' 
      }, { status: 400 })
    }

    // Get user info
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get event details
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select(`
        id, title, description, date, start_time, end_time, time_notes,
        location_id, locations(name), organizer_id, category_id, format_id, status, event_link
      `)
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ 
        error: 'Event not found' 
      }, { status: 404 })
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('event_bookings')
      .select(`
        id, status, checked_in, feedback_completed
      `)
      .eq('id', bookingId)
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ 
        error: 'Booking not found' 
      }, { status: 404 })
    }

    // Verify user has attended and completed feedback
    if (!booking.checked_in) {
      return NextResponse.json({ 
        error: 'User must attend the event before certificate generation' 
      }, { status: 400 })
    }

    if (!booking.feedback_completed) {
      return NextResponse.json({ 
        error: 'User must complete feedback before certificate generation' 
      }, { status: 400 })
    }

    // Check if certificate already exists
    const { data: existingCertificate, error: certCheckError } = await supabaseAdmin
      .from('certificates')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single()

    if (existingCertificate) {
      return NextResponse.json({ 
        error: 'Certificate already exists for this user and event' 
      }, { status: 400 })
    }

    // Get certificate template
    const { data: template, error: templateError } = await supabaseAdmin
      .from('certificate_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ 
        error: 'Certificate template not found' 
      }, { status: 404 })
    }

    // Generate certificate data
    const certificateId = generateCertificateId()
    const certificateData = {
      attendee_name: user.name,
      event_title: event.title,
      event_date: new Date(event.date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      certificate_id: certificateId,
      event_location: event.locations?.[0]?.name || 'Online',
      event_duration: event.time_notes || `${event.start_time} - ${event.end_time}`
    }

    // Generate certificate image
    const certificateImageBuffer = await generateCertificateImage(template, certificateData)
    
    // Upload to Supabase Storage
    const fileName = `certificate-${certificateId}.png`
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('certificates')
      .upload(fileName, certificateImageBuffer, {
        contentType: 'image/png',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload certificate image' 
      }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('certificates')
      .getPublicUrl(fileName)

    const certificatePath = urlData.publicUrl

    // Save certificate to database
    const { data: certificate, error: certError } = await supabaseAdmin
      .from('certificates')
      .insert({
        id: certificateId,
        event_id: eventId,
        user_id: userId,
        booking_id: bookingId,
        template_id: templateId,
        certificate_url: certificatePath,
        certificate_filename: fileName,
        certificate_data: certificateData,
        generated_at: new Date().toISOString(),
        sent_via_email: false,
        email_sent_at: null,
        generated_by: session.user.id
      })
      .select()
      .single()

    if (certError) {
      console.error('Database insert error:', certError)
      return NextResponse.json({ 
        error: 'Failed to save certificate to database' 
      }, { status: 500 })
    }

    // Send email if requested
    if (sendEmail) {
      try {
        await sendCertificateEmail({
          recipientEmail: user.email,
          recipientName: user.name,
          eventTitle: event.title,
          eventDate: certificateData.event_date,
          eventLocation: certificateData.event_location,
          eventDuration: certificateData.event_duration,
          certificateUrl: certificatePath,
          certificateId: certificateId
        })

        // Update certificate as sent
        await supabaseAdmin
          .from('certificates')
          .update({
            sent_via_email: true,
            email_sent_at: new Date().toISOString()
          })
          .eq('id', certificateId)

        console.log('✅ Certificate email sent to:', user.email)
      } catch (emailError) {
        console.error('Email sending failed:', emailError)
        // Don't fail the request for email errors
      }
    }

    console.log('✅ Auto-certificate generated successfully:', certificateId)

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificateId,
        eventId: eventId,
        userId: userId,
        certificateUrl: certificatePath,
        emailSent: sendEmail
      }
    })

  } catch (error) {
    console.error('Error in auto-certificate generation:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}


