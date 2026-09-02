import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { ensureFeedbackFormQr } from '@/lib/feedback/form-qr'

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    console.log('📋 Getting feedback form for event:', params.eventId)
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get feedback form for this event
    const { data: feedbackForm, error: formError } = await supabaseAdmin
      .from('feedback_forms')
      .select(`
        id, form_name, form_template, questions, active, created_at, anonymous_enabled,
        qr_code_data, qr_code_image_url, qr_code_storage_path, event_id,
        events (
          id, title, date, start_time, end_time, location_name
        )
      `)
      .eq('event_id', params.eventId)
      .eq('active', true)
      .single()

    if (formError) {
      if (formError.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'Feedback form not found for this event' 
        }, { status: 404 })
      }
      console.error('Error fetching feedback form:', formError)
      return NextResponse.json({ 
        error: 'Failed to fetch feedback form' 
      }, { status: 500 })
    }

    console.log('✅ Feedback form retrieved successfully:', feedbackForm.id)

    const eventTitle = Array.isArray(feedbackForm.events)
      ? feedbackForm.events[0]?.title
      : (feedbackForm.events as { title?: string } | null)?.title
    const qr = await ensureFeedbackFormQr(feedbackForm, eventTitle)

    return NextResponse.json({
      success: true,
      feedbackForm: {
        id: feedbackForm.id,
        formName: feedbackForm.form_name,
        formTemplate: feedbackForm.form_template,
        questions: feedbackForm.questions,
        active: feedbackForm.active,
        createdAt: feedbackForm.created_at,
        events: feedbackForm.events,
        qrCodeImageUrl: qr?.imageUrl || feedbackForm.qr_code_image_url || null,
        qrCodeData: qr?.formUrl || feedbackForm.qr_code_data || null,
      }
    })

  } catch (error) {
    console.error('Error in GET /api/feedback/forms/event/[eventId]:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
