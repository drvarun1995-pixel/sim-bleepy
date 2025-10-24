import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Feedback submission API route hit!')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Get user info
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get feedback form
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

    // Get user's booking for this event
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('event_bookings')
      .select(`
        id, status, checked_in, feedback_completed
      `)
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ 
        error: 'No booking found for this event' 
      }, { status: 404 })
    }

    // Check if user has attended
    if (!booking.checked_in) {
      return NextResponse.json({ 
        error: 'You must attend the event before completing feedback' 
      }, { status: 400 })
    }

    // Check if feedback already completed
    if (booking.feedback_completed) {
      return NextResponse.json({ 
        error: 'Feedback already completed for this event' 
      }, { status: 400 })
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

    // Save feedback response
    const { data: feedbackResponse, error: responseError } = await supabaseAdmin
      .from('feedback_responses')
      .insert({
        feedback_form_id: feedbackFormId,
        event_id: eventId,
        booking_id: booking.id,
        user_id: user.id,
        responses: responses,
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (responseError) {
      console.error('Error saving feedback response:', responseError)
      return NextResponse.json({ 
        error: 'Failed to save feedback response' 
      }, { status: 500 })
    }

    // Update booking to mark feedback as completed
    const { error: updateError } = await supabaseAdmin
      .from('event_bookings')
      .update({
        feedback_completed: true,
        feedback_completed_at: new Date().toISOString()
      })
      .eq('id', booking.id)

    if (updateError) {
      console.error('Failed to update booking:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update booking status' 
      }, { status: 500 })
    }

    // Check if auto-certificate is enabled
    const event = feedbackForm.events as any
    let autoCertificateGenerated = false

    if (event.auto_generate_certificate && event.certificate_template_id) {
      try {
        // Call auto-certificate generation API
        const certificateResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/certificates/auto-generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.user.accessToken}` // You may need to adjust this
          },
          body: JSON.stringify({
            eventId: eventId,
            userId: user.id,
            bookingId: booking.id,
            templateId: event.certificate_template_id,
            sendEmail: event.certificate_auto_send_email
          })
        })

        if (certificateResponse.ok) {
          autoCertificateGenerated = true
          console.log('✅ Auto-certificate generated for user:', user.id)
        } else {
          console.error('Auto-certificate generation failed:', await certificateResponse.text())
        }
      } catch (certError) {
        console.error('Error generating auto-certificate:', certError)
        // Don't fail the feedback submission for certificate errors
      }
    }

    console.log('✅ Feedback submitted successfully for user:', user.id)

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


