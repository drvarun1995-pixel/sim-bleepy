import { supabaseAdmin } from '@/utils/supabase'
import { isExistingNoEmailCohort, previousCohortLabel, suggestNextCohortLabel } from '@/lib/year-progression'
import {
  YEAR_GROUP_DEFS,
  defaultDatesForYearGroup,
  encodeTimelineNotes,
  inheritDatesFromPrevious,
  parseTimelineNotes,
  shiftIsoDate,
  type YearGroupKey,
} from '@/lib/year-group-timelines'

type ScheduleRow = {
  id?: string
  notes?: string | null
  effective_date?: string | null
  recommended_exit_action?: string | null
  next_cohort_label?: string | null
  status?: string | null
}

export async function loadTimelineScheduleMap(cohortLabel: string) {
  const { data } = await supabaseAdmin
    .from('progression_schedules')
    .select('*')
    .eq('cohort_label', cohortLabel)
    .order('updated_at', { ascending: false })

  const byKey = new Map<string, ScheduleRow>()
  for (const row of data || []) {
    const parsed = parseTimelineNotes(row.notes)
    if (!parsed) continue
    if (!byKey.has(parsed.timeline_key)) byKey.set(parsed.timeline_key, row)
  }
  return byKey
}

export function datesFromPreviousSchedule(
  groupKey: YearGroupKey,
  previousByKey: Map<string, ScheduleRow>,
  fallback: { starts_on: string; ends_on: string }
) {
  const previous = previousByKey.get(groupKey)
  const parsed = parseTimelineNotes(previous?.notes)
  return inheritDatesFromPrevious(
    {
      starts_on: parsed?.starts_on || null,
      ends_on: previous?.effective_date || null,
    },
    fallback
  )
}

async function ensureCohortRow(label: string) {
  const { data } = await supabaseAdmin
    .from('academic_cohorts')
    .select('id, starts_on, ends_on')
    .eq('label', label)
    .maybeSingle()
  if (data) return data

  const previous = previousCohortLabel(label)
  const window = await cohortWindowFromPrevious(previous)
  const { data: created } = await supabaseAdmin
    .from('academic_cohorts')
    .insert({
      label,
      name: `Academic year 20${label.replace('-', '–20')}`,
      is_current: false,
      suppress_emails: isExistingNoEmailCohort(label),
      starts_on: window.starts_on,
      ends_on: window.ends_on,
    })
    .select('id, starts_on, ends_on')
    .single()
  return created
}

/** Persist default / inherited year-group dates as scheduled timelines. */
export async function ensureCohortTimelines(params: {
  label: string
  createdBy?: string | null
}) {
  const cohort = await ensureCohortRow(params.label)
  const previousLabel = previousCohortLabel(params.label)
  const previousByKey = previousLabel ? await loadTimelineScheduleMap(previousLabel) : new Map()
  const existingByKey = await loadTimelineScheduleMap(params.label)
  const nextLabel = suggestNextCohortLabel(params.label)
  const suppress = isExistingNoEmailCohort(params.label)
  let saved = 0

  for (const group of YEAR_GROUP_DEFS) {
    const fallback = defaultDatesForYearGroup(
      group,
      params.label,
      cohort?.starts_on,
      cohort?.ends_on
    )
    const dates = datesFromPreviousSchedule(group.key, previousByKey, fallback)
    if (!dates.ends_on) continue

    const existing = existingByKey.get(group.key)
    const previous = previousByKey.get(group.key)
    const existingParsed = parseTimelineNotes(existing?.notes)
    const looksGeneric =
      !existing?.id ||
      (existingParsed?.starts_on === cohort?.starts_on &&
        existing.effective_date === cohort?.ends_on)
    const alreadyCorrect =
      existingParsed?.starts_on === dates.starts_on && existing?.effective_date === dates.ends_on

    if (existing?.id) {
      if (existing.status === 'applied') continue
      // Only auto-fill missing ARU school windows. Never overwrite UCL/FY/custom dates.
      const isAruGeneric =
        group.university === 'ARU' &&
        (looksGeneric || !existingParsed?.starts_on || !existing.effective_date)
      if (!isAruGeneric) continue
    }

    const payload = {
      name: `${group.label} · ${params.label}`,
      cohort_label: params.label,
      next_cohort_label: nextLabel,
      scope: 'year_group',
      university: group.university,
      study_year: group.study_year,
      foundation_year: group.foundation_year,
      role_type: null,
      recommended_action: 'per_user',
      recommended_exit_action: previous?.recommended_exit_action || existing?.recommended_exit_action || 'graduate',
      effective_date: dates.ends_on,
      reminder_days_after: 14,
      suppress_emails: suppress,
      notes: encodeTimelineNotes(group.key, dates.starts_on),
      updated_at: new Date().toISOString(),
    }

    if (existing?.id) {
      if (existing.status === 'applied') continue
      await supabaseAdmin
        .from('progression_schedules')
        .update({
          ...payload,
          status: existing.status === 'cancelled' ? 'scheduled' : existing.status || 'scheduled',
        })
        .eq('id', existing.id)
    } else {
      await supabaseAdmin.from('progression_schedules').insert({
        ...payload,
        status: 'scheduled',
        created_by: params.createdBy || null,
      })
    }
    saved += 1
  }

  return { saved }
}

export async function ensureDefaultCohortTimelines(createdBy?: string | null) {
  const first = await ensureCohortTimelines({ label: '25-26', createdBy })
  const second = await ensureCohortTimelines({ label: '26-27', createdBy })
  return { '25-26': first.saved, '26-27': second.saved }
}

/** Copy previous cohort year-group dates (+1 year) onto a newly created cohort. */
export async function copyTimelinesFromPreviousCohort(params: {
  toLabel: string
  createdBy?: string | null
  fromLabel?: string | null
}) {
  const result = await ensureCohortTimelines({
    label: params.toLabel,
    createdBy: params.createdBy,
  })
  return { copied: result.saved }
}

export async function cohortWindowFromPrevious(fromLabel: string | null) {
  if (!fromLabel) return { starts_on: null as string | null, ends_on: null as string | null }
  const { data } = await supabaseAdmin
    .from('academic_cohorts')
    .select('starts_on, ends_on')
    .eq('label', fromLabel)
    .maybeSingle()
  return {
    starts_on: shiftIsoDate(data?.starts_on, 1) || null,
    ends_on: shiftIsoDate(data?.ends_on, 1) || null,
  }
}
