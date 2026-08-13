import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import { requireYearProgressionAdmin } from '@/lib/year-progression-auth'
import { applyProgressionToUser } from '@/lib/year-progression-apply'
import { type LearnerSnapshot, type ProgressionAction } from '@/lib/year-progression'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = await requireYearProgressionAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json()
  const userId = String(body.userId || '')
  const action = body.action as ProgressionAction | 'per_user'
  if (!userId || !action) {
    return NextResponse.json({ error: 'userId and action are required' }, { status: 400 })
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email, name, role, role_type, university, study_year, foundation_year, academic_status, academic_cohort, marketing_consent')
    .eq('id', userId)
    .maybeSingle()

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const result = await applyProgressionToUser({
    user: user as LearnerSnapshot,
    schedule: null,
    forcedAction: action,
    exitAction: action === 'per_user' ? 'graduate' : action,
    nextCohortLabel: body.nextCohortLabel || null,
    actorId: auth.user.id,
    source: 'override',
    notes: body.notes || 'Manual override',
  })

  return NextResponse.json(result)
}
