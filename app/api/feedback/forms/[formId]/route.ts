import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const { formId } = params

    if (!formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Any authenticated user can view a feedback form (submission is validated separately)

    // Get the feedback form
    console.log('Fetching feedback form with ID:', formId)
    
    // First try a simple query without relationships
    const { data: form, error: formError } = await supabaseAdmin
      .from('feedback_forms')
      .select('*')
      .eq('id', formId)
      .single()

    console.log('Query result:', { form, formError })

    if (formError) {
      console.error('Error fetching feedback form:', formError)
      console.error('Form ID:', formId)
      return NextResponse.json({ 
        error: 'Failed to fetch feedback form',
        details: formError.message,
        formId: formId
      }, { status: 500 })
    }

    if (!form) {
      return NextResponse.json({ error: 'Feedback form not found' }, { status: 404 })
    }

    // Now fetch related data separately
    let eventData = null
    let userData = null

    if (form.event_id) {
      const { data: event, error: eventError } = await supabaseAdmin
        .from('events')
        .select('id, title, date, start_time, end_time, location_id')
        .eq('id', form.event_id)
        .single()
      
      if (!eventError) {
        eventData = event
      }
    }

    if (form.created_by) {
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, name')
        .eq('id', form.created_by)
        .single()
      
      if (!userError) {
        userData = user
      }
    }

    // Combine the data
    const formWithRelations = {
      ...form,
      events: eventData,
      users: userData
    }

    // Add default anonymous_enabled if not present
    const formWithDefaults = {
      ...formWithRelations,
      anonymous_enabled: formWithRelations.anonymous_enabled ?? false
    }

    return NextResponse.json({
      success: true,
      form: formWithDefaults,
      feedbackForm: formWithDefaults
    })

  } catch (error) {
    console.error('Error in feedback form API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const { formId } = params

    if (!formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 })
    }

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
      form_name, 
      form_template, 
      anonymous_enabled,
      questions 
    } = body

    if (!form_name || !form_template) {
      return NextResponse.json({ 
        error: 'Missing required fields: form_name, form_template' 
      }, { status: 400 })
    }

    // Update the feedback form
    const updateData: any = {
      form_name,
      form_template,
      questions
    }

    // Only include anonymous_enabled if the column exists
    if (anonymous_enabled !== undefined) {
      updateData.anonymous_enabled = anonymous_enabled
    }

    const { data: updatedForm, error: updateError } = await supabaseAdmin
      .from('feedback_forms')
      .update(updateData)
      .eq('id', formId)
      .select(`
        id, form_name, form_template, questions, active, created_at,
        events (
          id, title, date, start_time, end_time, location_id
        ),
        users (
          id, name
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating feedback form:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update feedback form',
        details: updateError.message 
      }, { status: 500 })
    }

    // Add default anonymous_enabled if not present
    const formWithDefaults = {
      ...updatedForm,
      anonymous_enabled: (updatedForm as any).anonymous_enabled ?? false
    }

    return NextResponse.json({
      success: true,
      form: formWithDefaults,
      message: 'Feedback form updated successfully'
    })

  } catch (error) {
    console.error('Error in feedback form update API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const { formId } = params

    if (!formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 })
    }

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

    console.log(`🗑️ Deleting feedback form ${formId}`)

    // Check for existing responses
    const { data: responses, error: responsesError } = await supabaseAdmin
      .from('feedback_responses')
      .select('id')
      .eq('feedback_form_id', formId)

    if (responsesError) {
      console.error('Error checking feedback responses:', responsesError)
      return NextResponse.json({ error: 'Failed to check feedback responses' }, { status: 500 })
    }

    // Delete feedback responses first (foreign key constraint)
    if (responses && responses.length > 0) {
      console.log(`🗑️ Deleting ${responses.length} feedback responses for form ${formId}`)
      
      const { error: deleteResponsesError } = await supabaseAdmin
        .from('feedback_responses')
        .delete()
        .eq('feedback_form_id', formId)

      if (deleteResponsesError) {
        console.error('Error deleting feedback responses:', deleteResponsesError)
        return NextResponse.json({ error: 'Failed to delete feedback responses' }, { status: 500 })
      }
    }

    // Delete the feedback form
    const { error: deleteFormError } = await supabaseAdmin
      .from('feedback_forms')
      .delete()
      .eq('id', formId)

    if (deleteFormError) {
      console.error('Error deleting feedback form:', deleteFormError)
      return NextResponse.json({ error: 'Failed to delete feedback form' }, { status: 500 })
    }

    console.log(`✅ Successfully deleted feedback form ${formId} and all related responses`)

    return NextResponse.json({
      success: true,
      message: 'Feedback form and all responses deleted successfully'
    })

  } catch (error) {
    console.error('Error in feedback form deletion API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}