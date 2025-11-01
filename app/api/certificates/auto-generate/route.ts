export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import crypto from 'crypto'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { sendCertificateEmail } from '@/lib/email'
import { generateCertificateId } from '@/lib/certificates'
import { generateCertificateImage } from '@/lib/certificate-generator'

export async function POST(request: NextRequest) {
  try {
    console.log('🎓 Auto-certificate generation API route hit!')
    
    const session = await getServerSession(authOptions)

    const internalSecret = process.env.INTERNAL_CRON_SECRET
    const cronSecret = request.headers.get('x-cron-secret')
    const isVercelCron = request.headers.has('x-vercel-cron')
    const isCronRequest = internalSecret
      ? cronSecret === internalSecret
      : isVercelCron
    const allowUnauthed = isCronRequest || process.env.NODE_ENV !== 'production'

    if (!session?.user && !allowUnauthed) {
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
      .select('id, name, email, role, university')
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
        feedback_required_for_certificate,
        location_id, organizer_id, category_id, format_id, status, event_link,
        created_by, organizer_name, certificate_auto_send_email
      `)
      .eq('id', eventId)
      .single()
    if (eventError || !event) {
      console.error('Event fetch error for', eventId, eventError)
      return NextResponse.json({ 
        error: 'Event not found' 
      }, { status: 404 })
    }

    let eventOwnerName: string | null = null
    if (event.created_by) {
      // Try to use the joined creator name first
      const { data: creator } = await supabaseAdmin
        .from('users')
        .select('id, name')
        .eq('id', event.created_by)
        .maybeSingle()
      eventOwnerName = creator?.name || null
    }

    if (!eventOwnerName && event.organizer_id) {
      const { data: organizer } = await supabaseAdmin
        .from('users')
        .select('id, name')
        .eq('id', event.organizer_id)
        .maybeSingle()
      eventOwnerName = organizer?.name || null
    }

    const resolvedEventOwnerName = eventOwnerName || event.organizer_name || 'Unknown Organizer'

    let locationName: string | null = null
    let locationAddress: string | null = null
    if (event.location_id) {
      const { data: locationData, error: locationError } = await supabaseAdmin
        .from('locations')
        .select('name, address')
        .eq('id', event.location_id)
        .maybeSingle()
      if (locationError) {
        console.error('Location fetch error for', event.location_id, locationError)
      }
      locationName = locationData?.name || null
      locationAddress = locationData?.address || null
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

    const feedbackRequired = Boolean(event.feedback_required_for_certificate)

    if (feedbackRequired && !booking.feedback_completed) {
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
    const certificateRecordId = crypto.randomUUID()
    const friendlyCertificateId = generateCertificateId()
    const eventDuration = event.time_notes || [event.start_time, event.end_time].filter(Boolean).join(' - ')

    const certificateData = {
      attendee_name: user.name || user.email?.split('@')[0] || 'Participant',
      attendee_email: user.email,
      attendee_university: user.university || '',
      attendee_role: user.role || '',
      event_title: event.title,
      event_description: event.description || '',
      event_date: new Date(event.date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      event_start_time: event.start_time || '',
      event_startTime: event.start_time || '',
      event_end_time: event.end_time || '',
      event_endTime: event.end_time || '',
      event_time_notes: event.time_notes || '',
      event_timeNotes: event.time_notes || '',
      certificate_id: friendlyCertificateId,
      certificate_date: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      event_location: locationName || locationAddress || 'Online',
      event_duration: eventDuration || '',
      event_organizer: resolvedEventOwnerName,
      event_category: event.category_id || '',
      event_format: event.format_id || '',
      event_link: event.event_link || '',
      event_eventLink: event.event_link || '',
      event_status: event.status || '',
      event_owner_name: resolvedEventOwnerName,
      generator_name: 'Auto_Generator'
    }

    // Generate a fresh signed URL for the template image
    let backgroundImageUrl = template.image_path || template.background_image
    
    // If it's a storage path (not a full URL), create a signed URL
    if (backgroundImageUrl && !backgroundImageUrl.startsWith('http')) {
      try {
        const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
          .from('certificates')
          .createSignedUrl(backgroundImageUrl, 3600) // 1 hour expiry
        
        if (signedUrlError) {
          console.error('Error generating signed URL for template image:', signedUrlError)
          return NextResponse.json({ 
            error: 'Failed to generate template image URL' 
          }, { status: 500 })
        }
        
        backgroundImageUrl = signedUrlData.signedUrl
        console.log('Generated fresh signed URL for template image in auto-generate')
      } catch (error) {
        console.error('Error creating signed URL:', error)
        return NextResponse.json({ 
          error: 'Failed to generate template image URL' 
        }, { status: 500 })
      }
    }

    // Create template object with fresh signed URL
    const templateWithSignedUrl = {
      ...template,
      backgroundImage: backgroundImageUrl,
      fields: template.fields || [],
      canvasSize: template.canvas_size || template.canvasSize || { width: 800, height: 565 }
    }

    // Generate certificate image
    const certificatePath = await generateCertificateImage(templateWithSignedUrl, certificateData)
    
    if (!certificatePath) {
      console.error('Failed to generate certificate image')
      return NextResponse.json({ 
        error: 'Failed to generate certificate image' 
      }, { status: 500 })
    }

    // Get public URL from the generated path
    const { data: urlData } = supabaseAdmin.storage
      .from('certificates')
      .getPublicUrl(certificatePath)

    // Save certificate to database
    const { data: certificate, error: certError } = await supabaseAdmin
      .from('certificates')
      .insert({
        id: certificateRecordId,
        event_id: eventId,
        user_id: userId,
        booking_id: bookingId,
        template_id: templateId,
        certificate_url: certificatePath, // Store storage path instead of public URL
        certificate_filename: certificatePath.split('/').pop(),
        certificate_data: certificateData,
        generated_at: new Date().toISOString(),
        sent_via_email: false,
        email_sent_at: null,
        generated_by: session?.user?.id ?? null
      })
      .select()
      .single()

    if (certError) {
      console.error('Database insert error:', certError)
      const errorDetails = {
        message: certError.message,
        details: (certError as any)?.details || null,
        hint: (certError as any)?.hint || null,
        code: (certError as any)?.code || null
      }
      try {
        await supabaseAdmin.storage
          .from('certificates')
          .remove([certificatePath])
      } catch (storageCleanupError) {
        console.error('Failed to clean up certificate file after DB error:', storageCleanupError)
      }
      return NextResponse.json({ 
        error: 'Failed to save certificate to database',
        details: errorDetails
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
          certificateId: friendlyCertificateId
        })

        // Update certificate as sent
        await supabaseAdmin
          .from('certificates')
          .update({
            sent_via_email: true,
            email_sent_at: new Date().toISOString(),
            email_error_message: null
          })
          .eq('id', certificateRecordId)

        console.log('✅ Certificate email sent to:', user.email)
      } catch (emailError) {
        console.error('Email sending failed:', emailError)
        await supabaseAdmin
          .from('certificates')
          .update({
            email_error_message: emailError instanceof Error ? emailError.message : String(emailError)
          })
          .eq('id', certificateRecordId)
        // Don't fail the request for email errors
      }
    }

    console.log('✅ Auto-certificate generated successfully:', friendlyCertificateId)

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificateRecordId,
        friendlyId: friendlyCertificateId,
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


