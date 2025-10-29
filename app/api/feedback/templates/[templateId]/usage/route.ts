import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    console.log('📊 Incrementing template usage:', params.templateId)
    
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

    // Check if template exists
    const { data: template, error: templateError } = await supabaseAdmin
      .from('feedback_templates')
      .select('id, usage_count')
      .eq('id', params.templateId)
      .single()

    if (templateError) {
      console.error('Template not found:', templateError)
      return NextResponse.json({ 
        error: 'Template not found' 
      }, { status: 404 })
    }

    // Increment usage count
    const { error: updateError } = await supabaseAdmin
      .from('feedback_templates')
      .update({ 
        usage_count: template.usage_count + 1 
      })
      .eq('id', params.templateId)

    if (updateError) {
      console.error('Failed to increment usage count:', updateError)
      return NextResponse.json({ 
        error: 'Failed to increment usage count',
        details: updateError.message
      }, { status: 500 })
    }

    console.log('✅ Template usage incremented successfully')

    return NextResponse.json({
      success: true,
      message: 'Usage count incremented'
    })

  } catch (error) {
    console.error('Error in POST /api/feedback/templates/[templateId]/usage:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
