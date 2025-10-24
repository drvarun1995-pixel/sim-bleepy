import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    console.log('📋 Getting feedback form:', params.formId)
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get feedback form with event details
    const { data: feedbackForm, error: formError } = await supabaseAdmin
      .from('feedback_forms')
      .select(`
        id, form_name, form_template, questions, active, created_at,
        events (
          id, title, date, start_time, end_time, location_name
        )
      `)
      .eq('id', params.formId)
      .eq('active', true)
      .single()

    if (formError) {
      if (formError.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'Feedback form not found' 
        }, { status: 404 })
      }
      console.error('Error fetching feedback form:', formError)
      return NextResponse.json({ 
        error: 'Failed to fetch feedback form' 
      }, { status: 500 })
    }

    console.log('✅ Feedback form retrieved successfully:', feedbackForm.id)

    return NextResponse.json({
      success: true,
      feedbackForm: {
        id: feedbackForm.id,
        formName: feedbackForm.form_name,
        formTemplate: feedbackForm.form_template,
        questions: feedbackForm.questions,
        active: feedbackForm.active,
        createdAt: feedbackForm.created_at,
        events: feedbackForm.events
      }
    })

  } catch (error) {
    console.error('Error in GET /api/feedback/forms/[formId]:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    console.log('📝 Updating feedback form:', params.formId)
    
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
    const { formName, questions, active } = body

    // Update feedback form
    const { data: updatedForm, error: updateError } = await supabaseAdmin
      .from('feedback_forms')
      .update({
        form_name: formName,
        questions: questions,
        active: active,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.formId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating feedback form:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update feedback form' 
      }, { status: 500 })
    }

    console.log('✅ Feedback form updated successfully:', updatedForm.id)

    return NextResponse.json({
      success: true,
      feedbackForm: {
        id: updatedForm.id,
        formName: updatedForm.form_name,
        formTemplate: updatedForm.form_template,
        questions: updatedForm.questions,
        active: updatedForm.active,
        updatedAt: updatedForm.updated_at
      }
    })

  } catch (error) {
    console.error('Error in PUT /api/feedback/forms/[formId]:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    console.log('🗑️ Deleting feedback form:', params.formId)
    
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
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin role required' }, { status: 403 })
    }

    // Delete feedback form (cascade will handle responses)
    const { error: deleteError } = await supabaseAdmin
      .from('feedback_forms')
      .delete()
      .eq('id', params.formId)

    if (deleteError) {
      console.error('Error deleting feedback form:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete feedback form' 
      }, { status: 500 })
    }

    console.log('✅ Feedback form deleted successfully:', params.formId)

    return NextResponse.json({
      success: true,
      message: 'Feedback form deleted successfully'
    })

  } catch (error) {
    console.error('Error in DELETE /api/feedback/forms/[formId]:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}


