import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import { requireYearProgressionAdmin } from '@/lib/year-progression-auth'
import { isExistingNoEmailCohort, previousCohortLabel } from '@/lib/year-progression'
import { copyTimelinesFromPreviousCohort, cohortWindowFromPrevious } from '@/lib/copy-cohort-timelines'
import { assignTestAccountsToCohort } from '@/lib/year-progression-apply'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = await requireYearProgressionAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json()
  const label = String(body.label || '').trim()
  if (!/^\d{2}-\d{2}$/.test(label)) {
    return NextResponse.json({ error: 'Label must look like 26-27' }, { status: 400 })
  }

  const previousLabel = previousCohortLabel(label)
  const window = body.starts_on || body.ends_on
    ? { starts_on: body.starts_on || null, ends_on: body.ends_on || null }
    : await cohortWindowFromPrevious(previousLabel)

  const { data, error } = await supabaseAdmin
    .from('academic_cohorts')
    .insert({
      label,
      name: body.name || `Academic year 20${label.replace('-', '–20')}`,
      is_current: !!body.is_current,
      suppress_emails: body.suppress_emails === true || isExistingNoEmailCohort(label),
      starts_on: window.starts_on,
      ends_on: window.ends_on,
      notes: body.notes || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (data.is_current) {
    await supabaseAdmin.from('academic_cohorts').update({ is_current: false }).neq('id', data.id)
  }

  await copyTimelinesFromPreviousCohort({
    toLabel: label,
    fromLabel: previousLabel,
    createdBy: auth.user.id,
  })

  await assignTestAccountsToCohort(label)

  return NextResponse.json({ cohort: data })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireYearProgressionAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof body.is_current === 'boolean') updates.is_current = body.is_current
  if (typeof body.suppress_emails === 'boolean') updates.suppress_emails = body.suppress_emails
  if (body.notes !== undefined) updates.notes = body.notes
  if (body.name !== undefined) updates.name = body.name

  const { data, error } = await supabaseAdmin
    .from('academic_cohorts')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (data.is_current) {
    await supabaseAdmin.from('academic_cohorts').update({ is_current: false }).neq('id', data.id)
  }

  return NextResponse.json({ cohort: data })
}
