import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import { requireYearProgressionAdmin } from '@/lib/year-progression-auth'
import { backfillExistingCohort, syncTestAccountsToLatestCohort } from '@/lib/year-progression-apply'
import {
  isLearnerTargetable,
  isExcludedFromLearnerLists,
  upcomingCohortLabel,
} from '@/lib/year-progression'
import { ensureDefaultCohortTimelines } from '@/lib/copy-cohort-timelines'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireYearProgressionAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { data: cohorts, error: cohortError } = await supabaseAdmin
    .from('academic_cohorts')
    .select('*')
    .order('label', { ascending: true })

  if (cohortError) {
    return NextResponse.json(
      {
        error: 'Year progression tables are not installed yet. Run supabase/migrations/20260813_year_progression.sql in the Supabase SQL editor.',
        detail: cohortError.message,
      },
      { status: 503 }
    )
  }

  await ensureDefaultCohortTimelines(auth.user.id)
  await syncTestAccountsToLatestCohort()

  const { data: refreshedCohorts } = await supabaseAdmin
    .from('academic_cohorts')
    .select('*')
    .order('label', { ascending: true })

  const { data: schedules } = await supabaseAdmin
    .from('progression_schedules')
    .select('*')
    .order('effective_date', { ascending: false })
    .limit(50)

  const { data: exceptions } = await supabaseAdmin
    .from('progression_exceptions')
    .select('id, user_id, schedule_id, exception_type, reason, expires_at, created_at, users:user_id (name, email)')
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: audit } = await supabaseAdmin
    .from('progression_audit_log')
    .select('id, user_id, action, from_snapshot, to_snapshot, emails_suppressed, reminder_due_at, reminder_sent_at, source, created_at, users:user_id (name, email)')
    .order('created_at', { ascending: false })
    .limit(80)

  const cohortRows = refreshedCohorts || cohorts || []
  const currentCohort =
    cohortRows.find((c) => c.is_current)?.label || '25-26'
  const overviewCohort = upcomingCohortLabel(cohortRows)
  const preferredTimelineCohort = overviewCohort

  const { data: labelledRows } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .eq('academic_cohort', overviewCohort)
  const labelledUsers = (labelledRows || []).filter((user) => !isExcludedFromLearnerLists(user))

  const { count: unlabelled } = await supabaseAdmin
    .from('users')
    .select('id', { count: 'exact', head: true })
    .is('academic_cohort', null)
    .in('role_type', ['medical_student', 'foundation_doctor'])

  const { data: activeUsers } = await supabaseAdmin
    .from('users')
    .select('id, name, email, university, study_year, foundation_year, role_type, academic_cohort, academic_status')
    .eq('academic_status', 'active')
    .eq('academic_cohort', overviewCohort)
    .in('role_type', ['medical_student', 'foundation_doctor'])
    .order('name', { ascending: true })
    .limit(50)

  const leftoverActive = (activeUsers || []).filter((user) => !isExcludedFromLearnerLists(user))

  const { count: graduated } = await supabaseAdmin
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('academic_status', 'graduated')

  const { count: intercalated } = await supabaseAdmin
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('academic_status', 'intercalated')

  return NextResponse.json({
    cohorts: cohortRows,
    schedules: schedules || [],
    exceptions: exceptions || [],
    audit: audit || [],
    stats: {
      currentCohort,
      overviewCohort,
      preferredTimelineCohort,
      labelled25: labelledUsers.length,
      labelledCurrent: labelledUsers.length,
      unlabelled: unlabelled || 0,
      active: leftoverActive.length,
      graduated: graduated || 0,
      intercalated: intercalated || 0,
      targetableNote: isLearnerTargetable({ academic_status: 'active' }),
    },
    activeLearners: leftoverActive,
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireYearProgressionAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json().catch(() => ({}))
  if (body.action === 'backfill') {
    const result = await backfillExistingCohort()
    return NextResponse.json({ success: true, ...result })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
