import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { sendCertificateEmail } from '@/lib/email'
import { generateCertificateId } from '@/lib/certificates'
import { generateCertificateImage } from '@/lib/certificate-generator'

export async function POST(request: NextRequest) {
  console.log('🚀 Certificate generation API route hit!')
  try {
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
    const { 
      eventId, 
      templateId, 
      attendeeIds, 
      sendEmails = true 
    } = body

    console.log('Certificate generation request:', { eventId, templateId, attendeeIds, sendEmails })

    if (!eventId || !templateId || !attendeeIds || !Array.isArray(attendeeIds)) {
      return NextResponse.json({ 
        error: 'Missing required fields: eventId, templateId, attendeeIds' 
      }, { status: 400 })
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
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get template details
    const { data: template, error: templateError } = await supabaseAdmin
      .from('certificate_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      console.error('Template fetch error:', templateError)
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    console.log('Template fetched:', {
      id: template.id,
      name: template.name,
      hasBackgroundImage: !!template.background_image,
      hasImagePath: !!template.image_path,
      fields: template.fields?.length || 0
    })

    // Check template permissions (admins can use any template, others only their own)
    if (userRole !== 'admin' && template.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Template access denied' }, { status: 403 })
    }

    // Get attendees details
    console.log('Querying attendees for event:', eventId, 'with user IDs:', attendeeIds)
    const { data: attendees, error: attendeesError } = await supabaseAdmin
      .from('event_bookings')
      .select(`
        id, user_id, checked_in,
        users!event_bookings_user_id_fkey(id, name, email)
      `)
      .eq('event_id', eventId)
      .in('user_id', attendeeIds)
      .neq('status', 'cancelled')
    
    console.log('Attendees query result:', { attendees, attendeesError })

    if (attendeesError) {
      console.error('Attendees query error:', attendeesError)
      return NextResponse.json({ 
        error: 'Failed to fetch attendees', 
        details: attendeesError.message 
      }, { status: 500 })
    }

    if (!attendees) {
      console.error('No attendees data returned')
      return NextResponse.json({ error: 'No attendees data returned' }, { status: 500 })
    }

    if (attendees.length === 0) {
      return NextResponse.json({ error: 'No valid attendees found' }, { status: 400 })
    }

    const results = {
      success: 0,
      failed: 0,
      emailsSent: 0,
      errors: [] as string[]
    }

    console.log('Starting certificate generation for', attendees.length, 'attendees')

    // Generate certificate for each attendee
    for (const attendee of attendees) {
      try {
        console.log('Processing attendee:', attendee)
        const certificateId = crypto.randomUUID() // Use proper UUID format
        
        // Prepare certificate data
        const certificateData = {
          event_title: event.title,
          event_description: event.description || '',
          event_date: new Date(event.date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          event_start_time: event.start_time || '',
          event_end_time: event.end_time || '',
          event_time_notes: event.time_notes || '',
          event_location: event.locations?.[0]?.name || '',
          event_organizer: event.organizer_id || '',
          event_category: event.category_id || '',
          event_format: event.format_id || '',
          attendee_name: (attendee.users as any)?.name || '',
          attendee_email: (attendee.users as any)?.email || '',
          certificate_date: new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          certificate_id: certificateId,
          user_id: session.user.id // Add user ID for proper folder structure
        }

        // Map template to the format expected by generateCertificateImage
        const mappedTemplate = {
          id: template.id,
          name: template.name,
          backgroundImage: template.image_path || template.background_image,
          fields: template.fields || [],
          canvasSize: template.canvas_size || { width: 800, height: 565 }
        }
        
        console.log('Mapped template for generation:', {
          id: mappedTemplate.id,
          name: mappedTemplate.name,
          backgroundImage: mappedTemplate.backgroundImage,
          fieldsCount: mappedTemplate.fields.length
        })

        // For now, we'll use a placeholder path since we'll handle image generation client-side
        // The actual image generation with text fields will be handled by the client
        console.log('Preparing certificate data for client-side generation:', certificateId)
        
        // Create a placeholder path - the actual image will be generated client-side
        const eventTitleSlug = certificateData.event_title.replace(/[^a-zA-Z0-9]/g, '_')
        const attendeeNameSlug = certificateData.attendee_name.replace(/[^a-zA-Z0-9]/g, '_')
        const filename = `${eventTitleSlug}_${certificateData.certificate_id}.png`
        const folderPath = `users/${session.user.id}/certificates/${attendeeNameSlug}`
        const certificatePath = `${folderPath}/${filename}`

        // Save certificate to database
        console.log('Saving certificate to database:', certificateId)
        const { error: certError } = await supabaseAdmin
          .from('certificates')
          .insert({
            id: certificateId,
            event_id: eventId,
            user_id: attendee.user_id,
            template_id: templateId,
            certificate_url: certificatePath,
            certificate_filename: certificatePath, // Store the full path for deletion
            certificate_data: certificateData,
            generated_at: new Date().toISOString(),
            sent_via_email: false,
            email_sent_at: null,
            generated_by: session.user.id
          })

        if (certError) {
          console.error('Database insert error:', certError)
          throw new Error(`Database error: ${certError.message}`)
        }
        
        console.log('Certificate saved successfully:', certificateId)

        // Send email if requested
        if (sendEmails && (attendee.users as any)?.email) {
          try {
            await sendCertificateEmail({
              recipientEmail: (attendee.users as any).email,
              recipientName: (attendee.users as any).name || 'Participant',
              eventTitle: event.title,
              eventDate: certificateData.event_date,
              eventLocation: event.locations?.[0]?.name,
              eventDuration: event.time_notes,
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

            results.emailsSent++
          } catch (emailError) {
            console.error('Email sending failed:', emailError)
            results.errors.push(`Failed to send email to ${(attendee.users as any).email}: ${emailError}`)
          }
        }

        results.success++

      } catch (error) {
        console.error('Certificate generation failed for attendee:', attendee.user_id, error)
        results.failed++
        results.errors.push(`Failed to generate certificate for ${(attendee.users as any)?.name}: ${error}`)
      }
    }

    return NextResponse.json({
      message: `Generated ${results.success} certificates successfully`,
      results
    })

  } catch (error) {
    console.error('Certificate generation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

