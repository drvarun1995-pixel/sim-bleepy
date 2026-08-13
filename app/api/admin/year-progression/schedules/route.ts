import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import { requireYearProgressionAdmin } from '@/lib/year-progression-auth'
import { isExistingNoEmailCohort } from '@/lib/year-progression'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = await requireYearProgressionAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json()
  const name = String(body.name || '').trim()
  const effective_date = String(body.effective_date || '').trim()
  if (!name || !effective_date) {
    return NextResponse.json({ error: 'Name and effective date are required' }, { status: 400 })
  }

  const cohortLabel = body.cohort_label || null
  const suppress =
    body.suppress_emails === true || isExistingNoEmailCohort(cohortLabel)

  const { data, error } = await supabaseAdmin
    .from('progression_schedules')
    .insert({
      name,
      cohort_label: cohortLabel,
      next_cohort_label: body.next_cohort_label || null,
      scope: body.scope || 'all',
      university: body.university || null,
      study_year: body.study_year || null,
      foundation_year: body.foundation_year || null,
      role_type: body.role_type || null,
      user_ids: body.user_ids || [],
      recommended_action: body.recommended_action || 'per_user',
      recommended_exit_action: body.recommended_exit_action || 'graduate',
      effective_date,
      reminder_days_after: Number(body.reminder_days_after) || 14,
      suppress_emails: suppress,
      status: body.status || 'draft',
      created_by: auth.user.id,
      notes: body.notes || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ schedule: data })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireYearProgressionAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const allowed = [
    'name',
    'cohort_label',
    'next_cohort_label',
    'scope',
    'university',
    'study_year',
    'foundation_year',
    'role_type',
    'user_ids',
    'recommended_action',
    'recommended_exit_action',
    'effective_date',
    'reminder_days_after',
    'suppress_emails',
    'status',
    'notes',
  ]
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }
  if (updates.cohort_label && isExistingNoEmailCohort(String(updates.cohort_label))) {
    updates.suppress_emails = true
  }

  const { data, error } = await supabaseAdmin
    .from('progression_schedules')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ schedule: data })
}
