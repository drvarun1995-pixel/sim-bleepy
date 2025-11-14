import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { deleteQuestionById } from '@/lib/quiz/questionCleanup'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const ids = Array.isArray(body.ids) ? body.ids.filter((value) => typeof value === 'string' && value.trim().length > 0) : []
    const force = Boolean(body.force)

    if (!ids.length) {
      return NextResponse.json({ error: 'No question IDs provided' }, { status: 400 })
    }

    const summary = {
      deleted: [] as { id: string; message: string }[],
      needsConfirmation: [] as { id: string; message: string }[],
      blocked: [] as { id: string; reason: string; details?: any }[],
      notFound: [] as { id: string }[],
      errors: [] as { id: string; error: string; details?: string }[],
    }

    for (const id of ids) {
      const result = await deleteQuestionById(id, { confirmed: force })
      switch (result.status) {
        case 'success':
          summary.deleted.push({ id, message: result.message })
          break
        case 'needs-confirmation':
          summary.needsConfirmation.push({
            id,
            message: result.message,
          })
          break
        case 'campaign-blocked':
          summary.blocked.push({
            id,
            reason: result.error,
            details: result.usedIn,
          })
          break
        case 'incomplete-sessions':
          summary.blocked.push({
            id,
            reason: result.error,
            details: { incompleteSessions: result.incompleteSessions },
          })
          break
        case 'not-found':
          summary.notFound.push({ id })
          break
        case 'error':
        default:
          summary.errors.push({
            id,
            error: result.error,
            details: result.details,
          })
          break
      }
    }

    const success =
      summary.deleted.length === ids.length &&
      summary.needsConfirmation.length === 0 &&
      summary.blocked.length === 0 &&
      summary.errors.length === 0 &&
      summary.notFound.length === 0

    return NextResponse.json({
      success,
      summary,
      totalRequested: ids.length,
      deletedCount: summary.deleted.length,
    })
  } catch (error) {
    console.error('Error in POST /api/quiz/questions/bulk-delete:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


