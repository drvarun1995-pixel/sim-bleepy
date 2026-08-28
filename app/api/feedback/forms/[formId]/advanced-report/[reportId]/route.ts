import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { downloadFeedbackReport } from '@/lib/feedback/reportStorage'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: { formId: string; reportId: string } }
) {
  try {
    const { formId, reportId } = params
    if (!formId || !reportId) {
      return NextResponse.json({ error: 'Form ID and report ID are required' }, { status: 400 })
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

    const file = await downloadFeedbackReport(formId, reportId)
    if (!file) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return new NextResponse(Buffer.from(file.bytes) as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${file.fileName}"`,
        'Content-Length': String(file.bytes.length),
        'Cache-Control': 'no-store'
      }
    })
  } catch (error) {
    console.error('Error downloading advanced feedback report:', error)
    return NextResponse.json({ error: 'Failed to download report' }, { status: 500 })
  }
}
