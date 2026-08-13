import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import { requireYearProgressionAdmin } from '@/lib/year-progression-auth'
import {
  EXISTING_COHORT_LABEL,
  isExistingNoEmailCohort,
  isProgressableLearner,
  previousCohortLabel,
  suggestNextCohortLabel,
  upcomingCohortLabel,
  type LearnerSnapshot,
} from '@/lib/year-progression'
import {
  YEAR_GROUP_DEFS,
  defaultDatesForYearGroup,
  encodeTimelineNotes,
  isCohortTimelinesClosed,
  matchesYearGroup,
  parseTimelineNotes,
  yearGroupByKey,
  type YearGroupKey,
} from '@/lib/year-group-timelines'
import {
  copyTimelinesFromPreviousCohort,
  datesFromPreviousSchedule,
  ensureDefaultCohortTimelines,
  loadTimelineScheduleMap,
  cohortWindowFromPrevious,
} from '@/lib/copy-cohort-timelines'

async function syncCohortClosed(label: string, closed: boolean) {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    is_closed: closed,
    closed_at: closed ? new Date().toISOString() : null,
  }
  const { error } = await supabaseAdmin
    .from('academic_cohorts')
    .update(updates)
    .eq('label', label)
  if (error && /is_closed|closed_at/.test(error.message)) {
    return
  }
}

export const dynamic = 'force-dynamic'

const LEARNER_SELECT =
  'id, email, name, role, role_type, university, study_year, foundation_year, academic_status, academic_cohort'

async function learnersInCohort(cohortLabel: string): Promise<LearnerSnapshot[]> {
  const pageSize = 1000
  let from = 0
  const all: LearnerSnapshot[] = []
  while (true) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(LEARNER_SELECT)
      .eq('academic_cohort', cohortLabel)
      .eq('academic_status', 'active')
      .range(from, from + pageSize - 1)
    if (error) throw error
    const rows = (data || []) as LearnerSnapshot[]
    all.push(...rows)
    if (rows.length < pageSize) break
    from += pageSize
  }
  return all.filter(isProgressableLearner)
}

export async function GET(request: NextRequest) {
  const auth = await requireYearProgressionAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const requested = request.nextUrl.searchParams.get('cohort')?.trim()
  const { data: cohorts, error: cohortError } = await supabaseAdmin
    .from('academic_cohorts')
    .select('*')
    .order('label', { ascending: true })

  if (cohortError) {
    return NextResponse.json({ error: cohortError.message }, { status: 503 })
  }

  const cohortLabel = requested || upcomingCohortLabel(cohorts || []) || EXISTING_COHORT_LABEL

  const selected = (cohorts || []).find((c) => c.label === cohortLabel) || (cohorts || [])[0]
  const label = selected?.label || cohortLabel
  const nextDefault = suggestNextCohortLabel(label)

  await ensureDefaultCohortTimelines(auth.user.id)

  const { data: schedules } = await supabaseAdmin
    .from('progression_schedules')
    .select('*')
    .eq('cohort_label', label)
    .order('updated_at', { ascending: false })

  const timelineSchedules = (schedules || []).filter((row) => parseTimelineNotes(row.notes))
  const previousLabel = previousCohortLabel(label)

  const byKey = new Map<string, (typeof timelineSchedules)[number]>()
  for (const row of timelineSchedules) {
    const parsed = parseTimelineNotes(row.notes)
    if (!parsed) continue
    if (!byKey.has(parsed.timeline_key)) byKey.set(parsed.timeline_key, row)
  }

  const learners = await learnersInCohort(label)
  const nextFromSchedules =
    timelineSchedules.find((row) => row.next_cohort_label)?.next_cohort_label || nextDefault

  const previousByKey = previousLabel ? await loadTimelineScheduleMap(previousLabel) : new Map()

  const groups = YEAR_GROUP_DEFS.map((group) => {
    const schedule = byKey.get(group.key)
    const parsed = parseTimelineNotes(schedule?.notes)
    const fallback = defaultDatesForYearGroup(
      group,
      label,
      selected?.starts_on,
      selected?.ends_on
    )
    const inherited = datesFromPreviousSchedule(group.key, previousByKey, fallback)
    return {
      key: group.key,
      label: group.label,
      section: group.section,
      university: group.university,
      study_year: group.study_year,
      foundation_year: group.foundation_year,
      terminal: group.terminal,
      advancesTo: group.advancesTo,
      starts_on: parsed?.starts_on || inherited.starts_on,
      ends_on: schedule?.effective_date || inherited.ends_on,
      exit_action: schedule?.recommended_exit_action || 'graduate',
      status: schedule?.status || 'draft',
      schedule_id: schedule?.id || null,
      learner_count: learners.filter((user) => matchesYearGroup(user, group)).length,
    }
  })

  const closed = isCohortTimelinesClosed(groups)
  if (!!selected?.is_closed !== closed) {
    await syncCohortClosed(label, closed)
  }

  return NextResponse.json({
    cohort_label: label,
    next_cohort_label: nextFromSchedules,
    cohort: selected ? { ...selected, is_closed: closed } : null,
    cohorts: cohorts || [],
    groups,
    closed,
  })
}

export async function PUT(request: NextRequest) {
  const auth = await requireYearProgressionAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json().catch(() => ({}))
  const cohortLabel = String(body.cohort_label || '').trim()
  const nextCohortLabel = String(body.next_cohort_label || '').trim()
  const groups = Array.isArray(body.groups) ? body.groups : []

  if (!/^\d{2}-\d{2}$/.test(cohortLabel) || !/^\d{2}-\d{2}$/.test(nextCohortLabel)) {
    return NextResponse.json({ error: 'Select a from cohort and next cohort' }, { status: 400 })
  }

  const { data: existing } = await supabaseAdmin
    .from('progression_schedules')
    .select('*')
    .eq('cohort_label', cohortLabel)

  const currentlyClosed = isCohortTimelinesClosed(
    YEAR_GROUP_DEFS.map((group) => {
      const row = (existing || []).find(
        (item) => parseTimelineNotes(item.notes)?.timeline_key === group.key
      )
      const defaults = defaultDatesForYearGroup(group, cohortLabel, null, null)
      return { ends_on: row?.effective_date || defaults.ends_on }
    })
  )
  if (currentlyClosed && body.allow_override !== true) {
    return NextResponse.json(
      { error: 'This cohort is closed. Confirm a manual override to edit timelines.' },
      { status: 409 }
    )
  }

  const { data: nextCohortRow } = await supabaseAdmin
    .from('academic_cohorts')
    .select('id')
    .eq('label', nextCohortLabel)
    .maybeSingle()

  if (!nextCohortRow) {
    const window = await cohortWindowFromPrevious(cohortLabel)
    await supabaseAdmin.from('academic_cohorts').insert({
      label: nextCohortLabel,
      name: `Academic year 20${nextCohortLabel.replace('-', '–20')}`,
      is_current: false,
      suppress_emails: isExistingNoEmailCohort(nextCohortLabel),
      starts_on: window.starts_on,
      ends_on: window.ends_on,
    })
    await copyTimelinesFromPreviousCohort({
      toLabel: nextCohortLabel,
      fromLabel: cohortLabel,
      createdBy: auth.user.id,
    })
  }

  const byKey = new Map<string, any>()
  for (const row of existing || []) {
    const parsed = parseTimelineNotes(row.notes)
    if (!parsed) continue
    if (!byKey.has(parsed.timeline_key)) byKey.set(parsed.timeline_key, row)
  }

  const suppress = isExistingNoEmailCohort(cohortLabel)
  let saved = 0

  for (const incoming of groups) {
    const group = yearGroupByKey(String(incoming.key || ''))
    if (!group) continue
    const startsOn = String(incoming.starts_on || '').trim() || null
    const endsOn = String(incoming.ends_on || '').trim() || null
    const exitAction = group.terminal
      ? String(incoming.exit_action || 'graduate')
      : 'graduate'
    const current = byKey.get(group.key)

    if (!endsOn) {
      if (current && current.status !== 'applied') {
        await supabaseAdmin
          .from('progression_schedules')
          .update({
            status: 'cancelled',
            notes: encodeTimelineNotes(group.key as YearGroupKey, startsOn),
            updated_at: new Date().toISOString(),
          })
          .eq('id', current.id)
      }
      continue
    }

    const payload = {
      name: `${group.label} · ${cohortLabel}`,
      cohort_label: cohortLabel,
      next_cohort_label: nextCohortLabel,
      scope: 'year_group',
      university: group.university,
      study_year: group.study_year,
      foundation_year: group.foundation_year,
      role_type: null,
      recommended_action: 'per_user',
      recommended_exit_action: exitAction,
      effective_date: endsOn,
      reminder_days_after: 14,
      suppress_emails: suppress,
      status: current?.status === 'applied' ? 'applied' : 'scheduled',
      notes: encodeTimelineNotes(group.key as YearGroupKey, startsOn),
      updated_at: new Date().toISOString(),
    }

    if (current) {
      const today = new Date().toISOString().slice(0, 10)
      const status =
        current.status === 'applied' && endsOn > today
          ? 'scheduled'
          : current.status === 'applied'
            ? 'applied'
            : 'scheduled'
      await supabaseAdmin
        .from('progression_schedules')
        .update({ ...payload, status })
        .eq('id', current.id)
    } else {
      await supabaseAdmin.from('progression_schedules').insert({
        ...payload,
        created_by: auth.user.id,
      })
    }
    saved += 1
  }

  await syncCohortClosed(cohortLabel, isCohortTimelinesClosed(groups))
  return NextResponse.json({ success: true, saved })
}
