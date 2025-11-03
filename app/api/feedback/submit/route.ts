import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { logError, logInfo, logWarning } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Feedback submission API route hit!')

    const body = await request.json()
    const { 
      feedbackFormId, 
      eventId, 
      responses 
    } = body

    if (!feedbackFormId || !eventId || !responses) {
      return NextResponse.json({ 
        error: 'Missing required fields: feedbackFormId, eventId, responses' 
      }, { status: 400 })
    }

    // Get feedback form first to determine anonymous rules
    const { data: feedbackForm, error: formError } = await supabaseAdmin
      .from('feedback_forms')
      .select(`
        id, questions, active, anonymous_enabled,
        events (
          id, title, auto_generate_certificate, certificate_template_id, certificate_auto_send_email, feedback_required_for_certificate
        )
      `)
      .eq('id', feedbackFormId)
      .eq('active', true)
      .single()

    if (formError || !feedbackForm) {
      return NextResponse.json({ 
        error: 'Feedback form not found or inactive' 
      }, { status: 404 })
    }

    // Determine user context based on anonymous flag
    const session = (await getServerSession(authOptions as any)) as any
    let userId: string | null = null
    // Predeclare to allow early assignment before later initialization
    let bookingIdForInsert: string | undefined = undefined
    const anonymousEnabled = Boolean((feedbackForm as any).anonymous_enabled)
    if (!anonymousEnabled) {
      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, name, email, role')
        .eq('email', session.user.email)
        .single()
      if (userError || !user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      userId = user.id
      const isPrivileged = ['admin','meded_team','ctf'].includes((user as any).role)

      // Fetch event flags to decide requirements per workflow
      const { data: eventFlags } = await supabaseAdmin
        .from('events')
        .select('booking_enabled, qr_attendance_enabled')
        .eq('id', eventId)
        .single()

      if (!isPrivileged) {
        // Check booking if required
        if (eventFlags?.booking_enabled) {
          const { data: existingBooking } = await supabaseAdmin
            .from('event_bookings')
            .select('id')
            .eq('event_id', eventId)
            .eq('user_id', userId)
            .neq('status', 'cancelled')
            .maybeSingle()
          if (!existingBooking?.id) {
            return NextResponse.json({ error: 'Booking required to submit feedback for this event.' }, { status: 403 })
          }
          bookingIdForInsert = bookingIdForInsert || existingBooking.id
        }

        // Check QR attendance if required
        if (eventFlags?.qr_attendance_enabled) {
          const { data: qrRows } = await supabaseAdmin
            .from('event_qr_codes')
            .select('id')
            .eq('event_id', eventId)

          const qrIds = (qrRows || []).map((r: any) => r.id)
          if (qrIds.length === 0) {
            return NextResponse.json({ error: 'No QR code found for this event' }, { status: 400 })
          }
          const { data: scans } = await supabaseAdmin
            .from('qr_code_scans')
            .select('id')
            .in('qr_code_id', qrIds)
            .eq('user_id', userId)
            .eq('scan_success', true)
            .limit(1)
          if (!scans || scans.length === 0) {
            return NextResponse.json({ error: 'Attendance not found for this event. Please scan the QR code first.' }, { status: 400 })
          }
        }
      }
    }

    // Validate responses against form questions
    const questions = feedbackForm.questions as any[]
    const validationErrors = []

    for (const question of questions) {
      if (question.required && !responses[question.id]) {
        validationErrors.push(`Question "${question.question}" is required`)
      }
      
      if (responses[question.id]) {
        // Validate response type
        if (question.type === 'rating' && (responses[question.id] < 1 || responses[question.id] > question.scale)) {
          validationErrors.push(`Rating for "${question.question}" must be between 1 and ${question.scale}`)
        }
        
        if (question.type === 'yes_no' && !['yes', 'no'].includes(responses[question.id].toLowerCase())) {
          validationErrors.push(`Answer for "${question.question}" must be yes or no`)
        }
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Validation errors',
        details: validationErrors
      }, { status: 400 })
    }

    // Try to attach an existing booking if present (but not required)
    if (userId) {
      const { data: existingBooking } = await supabaseAdmin
        .from('event_bookings')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle()
      if (existingBooking?.id) bookingIdForInsert = existingBooking.id
    }

    // Build insert payload, omitting booking_id if not known
    const baseInsert: any = {
      feedback_form_id: feedbackFormId,
      event_id: eventId,
      user_id: userId,
      responses: responses,
      completed_at: new Date().toISOString()
    }
    if (bookingIdForInsert) baseInsert.booking_id = bookingIdForInsert

    // Attempt insert; if schema requires booking_id, create a minimal booking and retry
    let feedbackResponse: any = null
    let responseError: any = null
    try {
      const res = await supabaseAdmin
        .from('feedback_responses')
        .insert(baseInsert)
        .select()
        .single()
      feedbackResponse = res.data
      responseError = res.error
    } catch (e) {
      responseError = e
    }

    if (responseError && (responseError.code === '23502' || String(responseError.message || '').includes('booking_id'))) {
      // Create a minimal booking record and retry
      if (userId) {
        const { data: newBooking, error: createBookingError } = await supabaseAdmin
          .from('event_bookings')
          .insert({
            event_id: eventId,
            user_id: userId,
            status: 'attended',
            checked_in: true,
          })
          .select('id')
          .single()
        if (!createBookingError && newBooking?.id) {
          baseInsert.booking_id = newBooking.id
          const retry = await supabaseAdmin
            .from('feedback_responses')
            .insert(baseInsert)
            .select()
            .single()
          feedbackResponse = retry.data
          responseError = retry.error
        }
      }
    }

    if (responseError) {
      console.error('Error saving feedback response:', responseError)
      
      // Check if it's a duplicate key error
      if (responseError.code === '23505' || String(responseError.message || '').includes('duplicate key')) {
        return NextResponse.json({ 
          error: 'You already submitted your feedback for this event' 
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to save feedback response' 
      }, { status: 500 })
    }

    // No booking linkage needed; independent of booking

    const finalBookingId = baseInsert.booking_id || bookingIdForInsert

    // Ensure we have a booking for certificate generation (create one if needed)
    let certificateBookingId: string | null = finalBookingId || null
    
    // Check if auto-certificate is enabled and feedback is required for certificate
    // Only generate certificate after feedback if feedback_required_for_certificate is true
    // Otherwise, certificate will be generated after event end (workflow 1)
    const event = feedbackForm.events as any
    let autoCertificateGenerated = false

    const feedbackRequiredForCert = Boolean(event.feedback_required_for_certificate)
    
    // If we need a booking for certificate generation but don't have one, create it
    if (event.auto_generate_certificate && event.certificate_template_id && userId && feedbackRequiredForCert && !certificateBookingId) {
      try {
        // Try to find existing booking first
        const { data: existingBooking } = await supabaseAdmin
          .from('event_bookings')
          .select('id')
          .eq('event_id', eventId)
          .eq('user_id', userId)
          .neq('status', 'cancelled')
          .maybeSingle()
        
        if (existingBooking?.id) {
          certificateBookingId = existingBooking.id
        } else {
          // Create a minimal booking for certificate generation
          const { data: newBooking, error: bookingError } = await supabaseAdmin
            .from('event_bookings')
            .insert({
              event_id: eventId,
              user_id: userId,
              status: 'attended',
              checked_in: true,
              feedback_completed: true
            })
            .select('id')
            .single()
          
          if (!bookingError && newBooking?.id) {
            certificateBookingId = newBooking.id
            console.log('✅ Created booking for certificate generation:', certificateBookingId)
          }
        }
      } catch (bookingCreateError) {
        console.error('Failed to create booking for certificate generation:', bookingCreateError)
      }
    }

    // Update booking feedback_completed flag if we have a booking
    if (userId && finalBookingId) {
      try {
        await supabaseAdmin
          .from('event_bookings')
          .update({ feedback_completed: true })
          .eq('id', finalBookingId)
      } catch (updateError) {
        console.warn('Failed to mark booking feedback_completed:', updateError)
      }
    }

    // Also update the certificate booking if it's different
    if (certificateBookingId && certificateBookingId !== finalBookingId) {
      try {
        await supabaseAdmin
          .from('event_bookings')
          .update({ feedback_completed: true })
          .eq('id', certificateBookingId)
      } catch (updateError) {
        console.warn('Failed to mark certificate booking feedback_completed:', updateError)
      }
    }
    
    if (event.auto_generate_certificate && event.certificate_template_id && userId && feedbackRequiredForCert) {
      if (!certificateBookingId) {
        console.error('❌ Cannot generate certificate: no booking available for user:', userId, 'event:', eventId)
      } else {
        try {
          console.log('🎓 Starting certificate generation for Workflow 3 (Feedback Gate)')
          console.log('📋 Certificate generation params:', {
            eventId,
            userId,
            bookingId: certificateBookingId,
            templateId: event.certificate_template_id,
            sendEmail: event.certificate_auto_send_email,
            feedbackRequired: feedbackRequiredForCert
          })
          
          // Wait a moment to ensure booking update is committed
          await new Promise(resolve => setTimeout(resolve, 200))
          
          // Verify booking has feedback_completed flag set
          const { data: bookingCheck } = await supabaseAdmin
            .from('event_bookings')
            .select('id, checked_in, feedback_completed')
            .eq('id', certificateBookingId)
            .single()
          
          console.log('🔍 Booking check before certificate generation:', bookingCheck)
          
          if (!bookingCheck?.checked_in) {
            console.error('❌ Booking not checked in:', bookingCheck)
          }
          if (!bookingCheck?.feedback_completed) {
            console.error('❌ Booking feedback not completed:', bookingCheck)
          }
          
          // Call auto-certificate generation API (only when feedback is required for certificate)
          const apiUrl = `${process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/certificates/auto-generate`
          console.log('📞 Calling certificate API:', apiUrl)
          
          const certificateResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Use internal secret if available for cron-to-API calls
              ...(process.env.INTERNAL_CRON_SECRET ? { 'x-cron-secret': process.env.INTERNAL_CRON_SECRET } : {}),
            },
            body: JSON.stringify({
              eventId: eventId,
              userId: userId,
              bookingId: certificateBookingId,
              templateId: event.certificate_template_id,
              sendEmail: event.certificate_auto_send_email
            })
          })

          console.log('📨 Certificate API response status:', certificateResponse.status)

          if (certificateResponse.ok) {
            const responseData = await certificateResponse.json()
            autoCertificateGenerated = true
            console.log('✅ Auto-certificate generated after feedback submission for user:', userId, 'certificate:', responseData.certificateId || 'unknown')
            await logInfo(
              'Certificate generated after feedback submission (Workflow 3)',
              {
                userId,
                eventId,
                bookingId: certificateBookingId,
                certificateId: responseData.certificateId
              },
              '/api/feedback/submit',
              userId,
              session?.user?.email
            )
          } else {
            const errorText = await certificateResponse.text()
            console.error('❌ Auto-certificate generation failed:', {
              status: certificateResponse.status,
              statusText: certificateResponse.statusText,
              error: errorText
            })
            await logError(
              'Certificate generation failed after feedback submission',
              new Error(errorText),
              {
                userId,
                eventId,
                bookingId: certificateBookingId,
                status: certificateResponse.status,
                statusText: certificateResponse.statusText
              },
              '/api/feedback/submit',
              userId,
              session?.user?.email
            )
          }
        } catch (certError) {
          console.error('❌ Error generating auto-certificate:', {
            error: certError,
            message: certError instanceof Error ? certError.message : String(certError),
            stack: certError instanceof Error ? certError.stack : undefined
          })
          await logError(
            'Exception during certificate generation after feedback submission',
            certError instanceof Error ? certError : new Error(String(certError)),
            {
              userId,
              eventId,
              bookingId: certificateBookingId
            },
            '/api/feedback/submit',
            userId,
            session?.user?.email
          )
          // Don't fail the feedback submission for certificate errors
        }
      }
    } else if (event.auto_generate_certificate && !feedbackRequiredForCert) {
      console.log('ℹ️ Certificate will be generated after event end (not gated by feedback) for user:', userId)
    } else {
      console.log('ℹ️ Certificate generation not triggered:', {
        autoGenerate: event.auto_generate_certificate,
        hasTemplate: !!event.certificate_template_id,
        hasUserId: !!userId,
        feedbackRequired: feedbackRequiredForCert
      })
    }

    console.log('✅ Feedback submitted successfully for user:', userId)

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      details: {
        feedbackResponseId: feedbackResponse.id,
        autoCertificateGenerated: autoCertificateGenerated,
        certificateStatus: autoCertificateGenerated ? 'Generated automatically' : 'Requires manual approval'
      }
    })

  } catch (error) {
    console.error('Error in feedback submission:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}


