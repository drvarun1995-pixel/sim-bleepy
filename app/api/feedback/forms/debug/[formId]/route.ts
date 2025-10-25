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

    console.log('Debug: Fetching feedback form with ID:', formId)

    const session = await getServerSession(authOptions)
    console.log('Debug: Session:', !!session)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if the form exists at all
    const { data: form, error: formError } = await supabaseAdmin
      .from('feedback_forms')
      .select('*')
      .eq('id', formId)
      .single()

    console.log('Debug: Form query result:', { form: !!form, error: formError })

    if (formError) {
      return NextResponse.json({
        error: 'Form not found',
        details: formError.message,
        code: formError.code
      }, { status: 404 })
    }

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      form: {
        id: form.id,
        form_name: form.form_name,
        form_template: form.form_template,
        questions: form.questions,
        active: form.active,
        created_at: form.created_at,
        event_id: form.event_id,
        created_by: form.created_by
      }
    })

  } catch (error) {
    console.error('Debug: Error in feedback form API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
