import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    console.log('📋 Getting feedback template:', params.templateId)
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: template, error: templateError } = await supabaseAdmin
      .from('feedback_templates')
      .select(`
        id, name, description, category, questions, is_system_template, 
        is_active, usage_count, created_at, updated_at, is_shared, shared_at,
        users!feedback_templates_created_by_fkey (
          id, name, role
        )
      `)
      .eq('id', params.templateId)
      .single()

    if (templateError) {
      console.error('Error fetching template:', templateError)
      return NextResponse.json({ 
        error: 'Template not found' 
      }, { status: 404 })
    }

    // Check permissions based on user role and template ownership/sharing
    const canView = user.role === 'admin' || 
                   (user.role === 'meded_team' || user.role === 'ctf') && 
                   (template.created_by === user.id || template.is_shared) ||
                   (user.role === 'educator' && 
                    (template.created_by === user.id || template.is_shared))

    if (!canView) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to view this template' 
      }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      template: {
        ...template,
        question_count: Array.isArray(template.questions) ? template.questions.length : 0
      }
    })

  } catch (error) {
    console.error('Error in GET /api/feedback/templates/[templateId]:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    console.log('📝 Updating feedback template:', params.templateId)
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    console.log('📝 Received update request:', JSON.stringify(body, null, 2))
    
    const { 
      name, 
      description, 
      category,
      questions,
      is_active,
      is_shared
    } = body

    // Get existing template to check permissions
    const { data: existingTemplate, error: fetchError } = await supabaseAdmin
      .from('feedback_templates')
      .select('created_by, is_system_template, name')
      .eq('id', params.templateId)
      .single()

    if (fetchError) {
      return NextResponse.json({ 
        error: 'Template not found' 
      }, { status: 404 })
    }

    // Check permissions - users can edit their own templates, admins can edit any
    const canEdit = user.role === 'admin' || 
                   (['meded_team', 'ctf', 'educator'].includes(user.role) && 
                    existingTemplate.created_by === user.id)

    if (!canEdit) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to edit this template' 
      }, { status: 403 })
    }

    // Validate questions if provided
    if (questions && Array.isArray(questions)) {
      const validQuestionTypes = ['rating', 'text', 'long_text', 'yes_no', 'multiple_choice']
      for (const question of questions) {
        if (!question.type || !validQuestionTypes.includes(question.type)) {
          return NextResponse.json({ 
            error: `Invalid question type: ${question.type}. Must be one of: ${validQuestionTypes.join(', ')}` 
          }, { status: 400 })
        }
        if (!question.question) {
          return NextResponse.json({ 
            error: 'All questions must have a question text' 
          }, { status: 400 })
        }
      }
    }

    // Check if new name conflicts (if name is being changed)
    if (name && name !== existingTemplate.name) {
      const { data: nameConflict } = await supabaseAdmin
        .from('feedback_templates')
        .select('id')
        .eq('name', name)
        .eq('created_by', user.id)
        .neq('id', params.templateId)
        .single()

      if (nameConflict) {
        return NextResponse.json({ 
          error: 'A template with this name already exists' 
        }, { status: 400 })
      }
    }

    // Build update object
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (questions !== undefined) updateData.questions = questions
    if (is_active !== undefined) updateData.is_active = is_active
    if (is_shared !== undefined) updateData.is_shared = is_shared

    // Update template
    const { data: updatedTemplate, error: updateError } = await supabaseAdmin
      .from('feedback_templates')
      .update(updateData)
      .eq('id', params.templateId)
      .select(`
        id, name, description, category, questions, is_system_template, 
        is_active, usage_count, created_at, updated_at, is_shared, shared_at,
        users!feedback_templates_created_by_fkey (
          id, name, role
        )
      `)
      .single()

    if (updateError) {
      console.error('❌ Failed to update template:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update template',
        details: updateError.message
      }, { status: 500 })
    }

    console.log('✅ Template updated successfully:', updatedTemplate.id)

    return NextResponse.json({
      success: true,
      template: {
        ...updatedTemplate,
        question_count: Array.isArray(updatedTemplate.questions) ? updatedTemplate.questions.length : 0
      }
    })

  } catch (error) {
    console.error('Error in PUT /api/feedback/templates/[templateId]:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    console.log('🗑️ Deleting feedback template:', params.templateId)
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only admins can delete templates
    if (user.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Only administrators can delete templates' 
      }, { status: 403 })
    }

    // Check if template exists
    const { data: existingTemplate, error: fetchError } = await supabaseAdmin
      .from('feedback_templates')
      .select('id, is_system_template')
      .eq('id', params.templateId)
      .single()

    if (fetchError) {
      return NextResponse.json({ 
        error: 'Template not found' 
      }, { status: 404 })
    }

    // Prevent deletion of system templates
    if (existingTemplate.is_system_template) {
      return NextResponse.json({ 
        error: 'Cannot delete system templates' 
      }, { status: 400 })
    }

    // Delete template
    const { error: deleteError } = await supabaseAdmin
      .from('feedback_templates')
      .delete()
      .eq('id', params.templateId)

    if (deleteError) {
      console.error('❌ Failed to delete template:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete template',
        details: deleteError.message
      }, { status: 500 })
    }

    console.log('✅ Template deleted successfully:', params.templateId)

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })

  } catch (error) {
    console.error('Error in DELETE /api/feedback/templates/[templateId]:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
