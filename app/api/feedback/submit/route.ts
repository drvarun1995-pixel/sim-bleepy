import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

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
        id, questions, active,
        events (
          id, title, auto_generate_certificate, certificate_template_id, certificate_auto_send_email
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
    const session = await getServerSession(authOptions)
    let userId: string | null = null
    if (!feedbackForm.anonymous_enabled) {
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

      // Admin/MedEd/CTF bypass for testing
      if (!isPrivileged) {
        // Require successful QR scan for this event (independent of booking)
        const { data: qrRows } = await supabaseAdmin
          .from('event_qr_codes')
          .select('id')
          .eq('event_id', eventId)

        if (!qrRows || qrRows.length === 0) {
          return NextResponse.json({ error: 'No QR code found for this event' }, { status: 400 })
        }

        const qrIds = qrRows.map((r: any) => r.id)
        const { data: scans } = await supabaseAdmin
          .from('qr_code_scans')
          .select('id, status')
          .in('qr_code_id', qrIds)
          .eq('user_id', userId)
          .eq('status', 'success')
          .limit(1)

        if (!scans || scans.length === 0) {
          return NextResponse.json({ error: 'Attendance not found for this event. Please scan the QR code first.' }, { status: 400 })
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
    let bookingIdForInsert: string | undefined = undefined
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
      return NextResponse.json({ 
        error: 'Failed to save feedback response' 
      }, { status: 500 })
    }

    // No booking linkage needed; independent of booking

    // Check if auto-certificate is enabled
    const event = feedbackForm.events as any
    let autoCertificateGenerated = false

    if (event.auto_generate_certificate && event.certificate_template_id && userId) {
      try {
        // Call auto-certificate generation API
        const certificateResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/certificates/auto-generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.user?.accessToken ? { 'Authorization': `Bearer ${session.user.accessToken}` } : {}),
          },
          body: JSON.stringify({
            eventId: eventId,
            userId: userId,
            bookingId: baseInsert.booking_id || bookingIdForInsert || null,
            templateId: event.certificate_template_id,
            sendEmail: event.certificate_auto_send_email
          })
        })

        if (certificateResponse.ok) {
          autoCertificateGenerated = true
          console.log('✅ Auto-certificate generated for user:', userId)
        } else {
          console.error('Auto-certificate generation failed:', await certificateResponse.text())
        }
      } catch (certError) {
        console.error('Error generating auto-certificate:', certError)
        // Don't fail the feedback submission for certificate errors
      }
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


