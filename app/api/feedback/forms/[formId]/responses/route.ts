import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { loadFeedbackFormResponses } from '@/lib/feedback/formResponseData'

export async function GET(
  _request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const { formId } = params

    if (!formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!['admin', 'meded_team', 'ctf'].includes(userRecord.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const loaded = await loadFeedbackFormResponses(formId)
    if (!loaded.ok) {
      return NextResponse.json({ error: loaded.error }, { status: loaded.status })
    }

    return NextResponse.json({
      success: true,
      ...loaded.data
    })
  } catch (error) {
    console.error('Error in feedback form responses API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
