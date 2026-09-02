import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { loadFeedbackFormResponses } from '@/lib/feedback/formResponseData'
import { generateAdvancedFeedbackReport } from '@/lib/feedback/generateAdvancedFeedbackReport'
import { deleteFeedbackReports, listFeedbackReports, saveFeedbackReportPdf } from '@/lib/feedback/reportStorage'

export const runtime = 'nodejs'
export const maxDuration = 60

async function requireFeedbackManager() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: userRecord, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('email', session.user.email)
    .single()

  if (userError || !userRecord) {
    return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) }
  }

  if (!['admin', 'meded_team', 'ctf'].includes(userRecord.role)) {
    return { error: NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }) }
  }

  return { user: userRecord }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const { formId } = params
    if (!formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 })
    }

    const auth = await requireFeedbackManager()
    if ('error' in auth) return auth.error

    const reports = await listFeedbackReports(formId)
    return NextResponse.json({ success: true, reports })
  } catch (error) {
    console.error('Error listing advanced feedback reports:', error)
    return NextResponse.json({ error: 'Failed to list reports' }, { status: 500 })
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const { formId } = params
    if (!formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 })
    }

    const auth = await requireFeedbackManager()
    if ('error' in auth) return auth.error
    const { user } = auth

    const loaded = await loadFeedbackFormResponses(formId)
    if (!loaded.ok) {
      return NextResponse.json({ error: loaded.error }, { status: loaded.status })
    }

    if (loaded.data.summary.totalResponses === 0) {
      return NextResponse.json(
        { error: 'This form has no responses yet. Collect feedback before generating a report.' },
        { status: 400 }
      )
    }

    const { bytes, filename } = await generateAdvancedFeedbackReport(loaded.data)

    await saveFeedbackReportPdf({
      formId,
      eventId: loaded.data.form.eventId,
      filename,
      bytes,
      createdBy: user.id
    })

    return new NextResponse(Buffer.from(bytes) as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(bytes.length),
        'Cache-Control': 'no-store'
      }
    })
  } catch (error: any) {
    console.error('Error generating advanced feedback report:', error)
    const message =
      error?.message === 'OpenAI is not configured'
        ? 'Advanced reports need an OpenAI API key.'
        : error?.message || 'Failed to generate advanced report'
    return NextResponse.json({ error: message }, { status: 500 })
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

    const auth = await requireFeedbackManager()
    if ('error' in auth) return auth.error

    const body = await request.json().catch(() => ({}))
    const all = body?.all === true
    const reportIds = Array.isArray(body?.reportIds) ? body.reportIds.filter(Boolean) : []

    if (!all && reportIds.length === 0) {
      return NextResponse.json({ error: 'Select at least one report to delete' }, { status: 400 })
    }

    const result = await deleteFeedbackReports(formId, { all, reportIds })
    return NextResponse.json({ success: true, deleted: result.deleted })
  } catch (error: any) {
    console.error('Error deleting advanced feedback reports:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to delete reports' },
      { status: 500 }
    )
  }
}
