import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { sendCertificateEmail } from '@/lib/email'
import { generateCertificateId } from '@/lib/certificates'
import { generateCertificateImage } from '@/lib/certificate-generator'
import { sendCertificateAvailableNotification } from '@/lib/push/certificateNotifications'

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
      errors: [] as string[],
      certificateIds: [] as string[]
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
          user_id: attendee.user_id, // Use attendee's user ID for proper folder structure
          generator_name: session.user.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown_Generator'
        }
        
        console.log('🔍 Certificate data being saved:', certificateData)
        console.log('🔍 Attendee data:', attendee)
        console.log('🔍 Attendee users:', attendee.users)
        console.log('🔍 Attendee name:', (attendee.users as any)?.name)
        console.log('🔍 Attendee email:', (attendee.users as any)?.email)

        // Generate a fresh signed URL for the template image
        let backgroundImageUrl = template.image_path || template.background_image
        
        // Check if it's a storage path (not a full URL) or if it's an expired signed URL
        const isStoragePath = backgroundImageUrl && !backgroundImageUrl.startsWith('http')
        const isExpiredSignedUrl = backgroundImageUrl && backgroundImageUrl.includes('storage/v1/object/sign/')
        
        if (isStoragePath || isExpiredSignedUrl) {
          try {
            // Extract the storage path from the URL if it's a signed URL
            let storagePath = backgroundImageUrl
            if (isExpiredSignedUrl) {
              // Extract path from signed URL: /storage/v1/object/sign/certificates/path?token=...
              const urlMatch = backgroundImageUrl.match(/\/storage\/v1\/object\/sign\/certificates\/([^?]+)/)
              if (urlMatch) {
                storagePath = urlMatch[1] // This will be just the path without 'certificates/' prefix
                console.log('Extracted storage path from signed URL:', storagePath)
              }
            }
            
            // Try to create signed URL for the template image
            const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
              .from('certificates')
              .createSignedUrl(storagePath, 3600) // 1 hour expiry
            
            if (signedUrlError) {
              console.error('❌ Template image not found in storage:', signedUrlError)
              console.error('❌ Storage path attempted:', storagePath)
              
              // Check if the template has a background_image (base64) as fallback
              if (template.background_image && template.background_image.startsWith('data:')) {
                console.log('🔄 Using base64 background image as fallback')
                backgroundImageUrl = template.background_image
              } else {
                return NextResponse.json({ 
                  error: 'Template image not found in storage and no fallback available' 
                }, { status: 500 })
              }
            } else {
              backgroundImageUrl = signedUrlData.signedUrl
              console.log('✅ Generated fresh signed URL for template image:', backgroundImageUrl)
            }
          } catch (error) {
            console.error('Error creating signed URL:', error)
            return NextResponse.json({ 
              error: 'Failed to generate template image URL' 
            }, { status: 500 })
          }
        }

        // Map template to the format expected by generateCertificateImage
        const mappedTemplate = {
          id: template.id,
          name: template.name,
          backgroundImage: backgroundImageUrl,
          fields: template.fields || [],
          canvasSize: template.canvas_size || { width: 800, height: 565 }
        }
        
        console.log('Mapped template for generation:', {
          id: mappedTemplate.id,
          name: mappedTemplate.name,
          backgroundImage: mappedTemplate.backgroundImage,
          fieldsCount: mappedTemplate.fields.length
        })

        // Generate the actual certificate image
        console.log('🎨 Generating certificate image for:', certificateData.attendee_name)
        console.log('🎨 Template data:', {
          id: mappedTemplate.id,
          name: mappedTemplate.name,
          backgroundImage: mappedTemplate.backgroundImage,
          fieldsCount: mappedTemplate.fields.length
        })
        
        let certificatePath: string | null = null
        try {
          certificatePath = await generateCertificateImage(mappedTemplate, certificateData)
          console.log('✅ Certificate image generation result:', certificatePath)
        } catch (imageError) {
          console.error('❌ Certificate image generation error:', imageError)
          throw new Error(`Certificate image generation failed: ${imageError}`)
        }
        
        if (!certificatePath) {
          console.error('❌ Certificate image generation returned null for:', certificateData.attendee_name)
          throw new Error('Certificate image generation returned null')
        }
        
        console.log('✅ Certificate image generated successfully:', certificatePath)

        // For private bucket, don't store public URL - store storage path instead
        // The frontend will use signed URLs via /api/certificates/view
        console.log('🔗 Certificate stored at path:', certificatePath)

        // Save certificate to database
        console.log('💾 Saving certificate to database:', certificateId)
        console.log('💾 Certificate data to save:', {
          id: certificateId,
          event_id: eventId,
          user_id: attendee.user_id,
          booking_id: attendee.id,
          template_id: templateId,
          certificate_url: certificatePath, // Store storage path instead of public URL
          certificate_filename: certificatePath
        })
        
        const { data: insertData, error: certError } = await supabaseAdmin
          .from('certificates')
          .insert({
            id: certificateId,
            event_id: eventId,
            user_id: attendee.user_id,
            booking_id: attendee.id, // Link to the booking
            template_id: templateId,
            certificate_url: certificatePath, // Store the storage path (not public URL)
            certificate_filename: certificatePath.split('/').pop(), // Store just the filename
            certificate_data: certificateData,
            generated_at: new Date().toISOString(),
            sent_via_email: false,
            email_sent_at: null,
            generated_by: session.user.id
          })
          .select()

        if (certError) {
          console.error('❌ Database insert error:', certError)
          console.error('❌ Error details:', certError.details)
          console.error('❌ Error hint:', certError.hint)
          console.error('❌ Error message:', certError.message)
          throw new Error(`Database error: ${certError.message}`)
        }
        
        console.log('✅ Certificate saved successfully to database:', certificateId)
        console.log('✅ Insert result:', insertData)

        // Add certificate ID to results
        results.certificateIds.push(certificateId)

        // Send push notification
        try {
          await sendCertificateAvailableNotification(certificateId)
          console.log('📱 Push notification sent for certificate:', certificateId)
        } catch (pushError) {
          console.error('Error sending certificate push notification:', pushError)
          // Don't fail certificate generation if notification fails
        }

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
        results.certificateIds.push(certificateId)

      } catch (error) {
        console.error('Certificate generation failed for attendee:', attendee.user_id, error)
        results.failed++
        results.errors.push(`Failed to generate certificate for ${(attendee.users as any)?.name}: ${error}`)
      }
    }

    return NextResponse.json({
      message: `Generated ${results.success} certificates successfully`,
      results,
      certificateIds: results.certificateIds || []
    })

  } catch (error) {
    console.error('Certificate generation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

