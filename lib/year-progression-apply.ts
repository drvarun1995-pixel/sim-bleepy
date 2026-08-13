import { supabaseAdmin } from '@/utils/supabase'
import { sendCustomHtmlEmail } from '@/lib/email'
import { buildGraduateEmailForUser } from '@/lib/email-templates/graduate-alumni-send'
import { buildProgressionConfirmEmail } from '@/lib/email-templates/progression-confirm'
import {
  EXISTING_COHORT_LABEL,
  NEXT_COHORT_LABEL,
  TEST_ACCOUNT_EMAILS,
  compareCohortLabels,
  computeNextProgression,
  isExistingNoEmailCohort,
  isProgressableLearner,
  isTestAccountEmail,
  snapshotFromUser,
  stageLabel,
  upcomingCohortLabel,
  type LearnerSnapshot,
  type ProgressionAction,
  type ScheduleScope,
} from '@/lib/year-progression'

export type ProgressionScheduleRow = {
  id: string
  name: string
  cohort_label: string | null
  next_cohort_label: string | null
  scope: ScheduleScope
  university: string | null
  study_year: string | null
  foundation_year: string | null
  role_type: string | null
  user_ids: string[] | null
  recommended_action: ProgressionAction | 'per_user'
  recommended_exit_action: ProgressionAction
  effective_date: string
  reminder_days_after: number
  suppress_emails: boolean
  status: string
}

const LEARNER_SELECT =
  'id, email, name, role, role_type, university, study_year, foundation_year, academic_status, academic_cohort, marketing_consent'

function emailsSuppressedFor(user: LearnerSnapshot, schedule: ProgressionScheduleRow): boolean {
  if (isTestAccountEmail(user.email)) return false
  if (schedule.suppress_emails) return true
  if (isExistingNoEmailCohort(schedule.cohort_label)) return true
  if (isExistingNoEmailCohort(user.academic_cohort)) return true
  return false
}

async function sendTestAccountProgressionEmails(params: {
  user: LearnerSnapshot
  fromCohort: string | null
  toCohort: string
  computed?: ReturnType<typeof computeNextProgression>
}) {
  if (!params.user.email) return
  const fromLabel = `${stageLabel(params.user)} · ${params.fromCohort || 'unlabelled'}`
  const toLabel = `${stageLabel({ ...params.user, academic_cohort: params.toCohort })} · ${params.toCohort}`
  const computed = params.computed
  const isGraduate =
    computed && !('skip' in computed) && computed.action === 'graduate' && computed.isExit

  try {
    if (isGraduate) {
      const mail = buildGraduateEmailForUser({
        userId: params.user.id,
        email: params.user.email,
        name: params.user.name || 'there',
        university: params.user.university,
        lastStageLabel: stageLabel(params.user),
        cohortLabel: params.fromCohort,
      })
      await sendCustomHtmlEmail(params.user.email, mail.subject, mail.html)
    }
    const confirm = buildProgressionConfirmEmail({
      name: params.user.name || 'there',
      fromLabel,
      toLabel,
    })
    await sendCustomHtmlEmail(params.user.email, confirm.subject, confirm.html)
  } catch (error) {
    console.error('Test account progression email failed:', error)
  }
}

export async function getCurrentCohortLabel(): Promise<string> {
  const { data } = await supabaseAdmin
    .from('academic_cohorts')
    .select('label')
    .eq('is_current', true)
    .maybeSingle()
  return data?.label || EXISTING_COHORT_LABEL
}

export async function ensureLearnerCohort(userId: string, roleType: string | null | undefined) {
  if (roleType !== 'medical_student' && roleType !== 'foundation_doctor') return
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, academic_cohort, academic_status, role_type, university, study_year, foundation_year')
    .eq('id', userId)
    .maybeSingle()
  if (!user || user.academic_cohort) return

  const cohort = await getCurrentCohortLabel()
  await supabaseAdmin
    .from('users')
    .update({ academic_cohort: cohort, academic_status: user.academic_status || 'active' })
    .eq('id', userId)

  const snapshot = { ...user, academic_cohort: cohort } as LearnerSnapshot
  await supabaseAdmin.from('user_stage_history').insert({
    user_id: userId,
    academic_cohort: cohort,
    academic_status: 'active',
    role_type: user.role_type,
    university: user.university,
    study_year: user.study_year,
    foundation_year: user.foundation_year,
    stage_label: stageLabel(snapshot),
    started_at: new Date().toISOString(),
    source: 'profile',
  })
}

/** Keep test accounts on a cohort without changing year, university, FY, or role. */
export async function assignTestAccountsToCohort(
  label: string,
  options?: { onlyIfOlderThan?: string }
): Promise<{ moved: number }> {
  const found: LearnerSnapshot[] = []
  for (const email of TEST_ACCOUNT_EMAILS) {
    const { data } = await supabaseAdmin
      .from('users')
      .select(LEARNER_SELECT)
      .ilike('email', email)
    found.push(...((data || []) as LearnerSnapshot[]))
  }

  let moved = 0
  for (const user of found) {
    if (!isTestAccountEmail(user.email)) continue
    if ((user.academic_cohort || '') === label && (user.academic_status || 'active') === 'active') {
      continue
    }
    if (
      options?.onlyIfOlderThan &&
      user.academic_cohort &&
      compareCohortLabels(user.academic_cohort, options.onlyIfOlderThan) >= 0
    ) {
      continue
    }

    const now = new Date().toISOString()
    await supabaseAdmin
      .from('users')
      .update({
        academic_cohort: label,
        academic_status: 'active',
        academic_status_changed_at: now,
        updated_at: now,
      })
      .eq('id', user.id)

    await closeAndOpenStage({
      user,
      to: {
        academic_status: 'active',
        academic_cohort: label,
        role_type: user.role_type || null,
        university: user.university || null,
        study_year: user.study_year || null,
        foundation_year: user.foundation_year || null,
        stage_label: stageLabel({ ...user, academic_cohort: label, academic_status: 'active' }),
      },
      source: 'test_account_cohort',
    })
    await sendTestAccountProgressionEmails({
      user,
      fromCohort: user.academic_cohort || null,
      toCohort: label,
    })
    moved += 1
  }

  return { moved }
}

export async function syncTestAccountsToLatestCohort(): Promise<{ label: string; moved: number }> {
  const { data } = await supabaseAdmin.from('academic_cohorts').select('label, is_current')
  const label = upcomingCohortLabel(data || [])
  const { moved } = await assignTestAccountsToCohort(label, { onlyIfOlderThan: label })
  return { label, moved }
}

async function fetchAllLearnersMatching(schedule: ProgressionScheduleRow): Promise<LearnerSnapshot[]> {
  const pageSize = 1000
  let from = 0
  const all: LearnerSnapshot[] = []

  while (true) {
    let query = supabaseAdmin.from('users').select(LEARNER_SELECT)

    if (schedule.scope === 'selected_users') {
      const ids = schedule.user_ids || []
      if (ids.length === 0) return []
      query = query.in('id', ids)
    } else if (schedule.scope === 'cohort' && schedule.cohort_label) {
      query = query.eq('academic_cohort', schedule.cohort_label)
    } else if (schedule.cohort_label) {
      query = query.eq('academic_cohort', schedule.cohort_label)
    }

    if (schedule.university) query = query.eq('university', schedule.university)
    if (schedule.study_year) query = query.eq('study_year', schedule.study_year)
    if (schedule.foundation_year) query = query.eq('foundation_year', schedule.foundation_year)
    if (schedule.role_type) query = query.eq('role_type', schedule.role_type)

    const { data, error } = await query.range(from, from + pageSize - 1)
    if (error) throw error
    const rows = (data || []) as LearnerSnapshot[]
    all.push(...rows)
    if (rows.length < pageSize) break
    from += pageSize
  }

  return all.filter(isProgressableLearner)
}

async function activeExceptionUserIds(userIds: string[], scheduleId?: string | null): Promise<Set<string>> {
  if (userIds.length === 0) return new Set()
  const now = new Date().toISOString()
  const { data } = await supabaseAdmin
    .from('progression_exceptions')
    .select('user_id, schedule_id, expires_at')
    .in('user_id', userIds)

  const blocked = new Set<string>()
  for (const row of data || []) {
    if (row.expires_at && row.expires_at < now) continue
    if (row.schedule_id && scheduleId && row.schedule_id !== scheduleId) continue
    blocked.add(row.user_id)
  }
  return blocked
}

export type PreviewRow = {
  userId: string
  name: string | null
  email: string | null
  fromLabel: string
  toLabel: string
  action: string
  skip?: boolean
  reason?: string
}

export async function previewSchedule(schedule: ProgressionScheduleRow): Promise<{
  apply: PreviewRow[]
  skip: PreviewRow[]
}> {
  const users = await fetchAllLearnersMatching(schedule)
  const blocked = await activeExceptionUserIds(users.map((u) => u.id), schedule.id)
  const apply: PreviewRow[] = []
  const skip: PreviewRow[] = []

  for (const user of users) {
    if (blocked.has(user.id)) {
      skip.push({
        userId: user.id,
        name: user.name || null,
        email: user.email || null,
        fromLabel: stageLabel(user),
        toLabel: stageLabel(user),
        action: 'skip',
        skip: true,
        reason: 'Exception: repeat / don’t bump',
      })
      continue
    }
    const next = computeNextProgression(user, {
      forcedAction: schedule.recommended_action,
      exitAction: schedule.recommended_exit_action,
      nextCohortLabel: schedule.next_cohort_label || NEXT_COHORT_LABEL,
    })
    if ('skip' in next) {
      skip.push({
        userId: user.id,
        name: user.name || null,
        email: user.email || null,
        fromLabel: stageLabel(user),
        toLabel: stageLabel(user),
        action: 'skip',
        skip: true,
        reason: next.reason,
      })
      continue
    }
    apply.push({
      userId: user.id,
      name: user.name || null,
      email: user.email || null,
      fromLabel: next.fromLabel,
      toLabel: next.toLabel,
      action: next.action,
    })
  }

  return { apply, skip }
}

async function closeAndOpenStage(params: {
  user: LearnerSnapshot
  to: ReturnType<typeof snapshotFromUser> & { academic_status: string }
  source: string
}) {
  const now = new Date().toISOString()
  await supabaseAdmin
    .from('user_stage_history')
    .update({ ended_at: now })
    .eq('user_id', params.user.id)
    .is('ended_at', null)

  await supabaseAdmin.from('user_stage_history').insert({
    user_id: params.user.id,
    academic_cohort: params.to.academic_cohort,
    academic_status: params.to.academic_status,
    role_type: params.to.role_type,
    university: params.to.university,
    study_year: params.to.study_year,
    foundation_year: params.to.foundation_year,
    stage_label: params.to.stage_label,
    started_at: now,
    source: params.source,
  })
}

export async function applyProgressionToUser(params: {
  user: LearnerSnapshot
  schedule: ProgressionScheduleRow | null
  forcedAction?: ProgressionAction | 'per_user'
  exitAction?: ProgressionAction
  nextCohortLabel?: string | null
  actorId?: string | null
  source: string
  notes?: string
}): Promise<{ applied: boolean; skipped?: string; action?: string }> {
  const schedule = params.schedule
  const keepTestProfile = isTestAccountEmail(params.user.email) && params.source !== 'manual_override'
  const next = computeNextProgression(params.user, {
    forcedAction: params.forcedAction || schedule?.recommended_action || 'per_user',
    exitAction: params.exitAction || schedule?.recommended_exit_action || 'graduate',
    nextCohortLabel: params.nextCohortLabel || schedule?.next_cohort_label || NEXT_COHORT_LABEL,
  })
  if ('skip' in next && !keepTestProfile) {
    return { applied: false, skipped: next.reason }
  }

  const now = new Date()
  const toCohort =
    (!('skip' in next) && next.academic_cohort) ||
    params.nextCohortLabel ||
    schedule?.next_cohort_label ||
    NEXT_COHORT_LABEL
  const toSnapshot = keepTestProfile
    ? {
        academic_status: 'active' as const,
        academic_cohort: toCohort,
        role_type: params.user.role_type || null,
        university: params.user.university || null,
        study_year: params.user.study_year || null,
        foundation_year: params.user.foundation_year || null,
        stage_label: stageLabel({
          ...params.user,
          academic_cohort: toCohort,
          academic_status: 'active',
        }),
      }
    : {
        academic_status: (next as Exclude<typeof next, { skip: true }>).academic_status,
        academic_cohort: (next as Exclude<typeof next, { skip: true }>).academic_cohort,
        role_type: (next as Exclude<typeof next, { skip: true }>).role_type,
        university: (next as Exclude<typeof next, { skip: true }>).university,
        study_year: (next as Exclude<typeof next, { skip: true }>).study_year,
        foundation_year: (next as Exclude<typeof next, { skip: true }>).foundation_year,
        stage_label: (next as Exclude<typeof next, { skip: true }>).toLabel,
      }

  await supabaseAdmin
    .from('users')
    .update({
      academic_status: toSnapshot.academic_status,
      academic_cohort: toSnapshot.academic_cohort,
      academic_status_changed_at: now.toISOString(),
      last_progressed_at: now.toISOString(),
      role_type: toSnapshot.role_type,
      university: toSnapshot.university,
      study_year: toSnapshot.study_year,
      foundation_year: toSnapshot.foundation_year,
      updated_at: now.toISOString(),
    })
    .eq('id', params.user.id)

  await closeAndOpenStage({
    user: params.user,
    to: toSnapshot,
    source: params.source,
  })

  const suppress = keepTestProfile
    ? false
    : schedule
      ? emailsSuppressedFor(params.user, schedule)
      : isExistingNoEmailCohort(params.user.academic_cohort)
  const reminderDays = schedule?.reminder_days_after ?? 14
  const reminderDue = new Date(now.getTime() + reminderDays * 24 * 60 * 60 * 1000)
  const action =
    keepTestProfile ? 'advance' : !('skip' in next) ? next.action : 'advance'
  const fromLabel = !('skip' in next) ? next.fromLabel : stageLabel(params.user)
  const toLabel = toSnapshot.stage_label

  const { data: audit } = await supabaseAdmin
    .from('progression_audit_log')
    .insert({
      user_id: params.user.id,
      schedule_id: schedule?.id || null,
      action,
      from_snapshot: snapshotFromUser(params.user),
      to_snapshot: toSnapshot,
      emails_suppressed: suppress,
      reminder_due_at: suppress ? null : reminderDue.toISOString(),
      actor_id: params.actorId || null,
      source: params.source,
      notes: params.notes || `${fromLabel} → ${toLabel}`,
    })
    .select('id')
    .maybeSingle()

  if (keepTestProfile) {
    await sendTestAccountProgressionEmails({
      user: params.user,
      fromCohort: params.user.academic_cohort || null,
      toCohort,
      computed: next,
    })
    if (audit?.id) {
      await supabaseAdmin
        .from('progression_audit_log')
        .update({ graduate_email_sent_at: now.toISOString() })
        .eq('id', audit.id)
    }
    return { applied: true, action }
  }

  if (!suppress && !('skip' in next) && next.isExit && params.user.email && params.user.marketing_consent !== false) {
    try {
      const mail = buildGraduateEmailForUser({
        userId: params.user.id,
        email: params.user.email,
        name: params.user.name || 'there',
        university: params.user.university,
        lastStageLabel: next.fromLabel,
        cohortLabel: params.user.academic_cohort,
      })
      await sendCustomHtmlEmail(params.user.email, mail.subject, mail.html)
      if (audit?.id) {
        await supabaseAdmin
          .from('progression_audit_log')
          .update({ graduate_email_sent_at: now.toISOString() })
          .eq('id', audit.id)
      }
    } catch (error) {
      console.error('Graduate progression email failed:', error)
    }
  }

  return { applied: true, action }
}

export async function applySchedule(params: {
  schedule: ProgressionScheduleRow
  actorId?: string | null
  source: string
}): Promise<{ applied: number; skipped: number }> {
  const { apply, skip } = await previewSchedule(params.schedule)
  const usersById = new Map(
    (await fetchAllLearnersMatching(params.schedule)).map((u) => [u.id, u])
  )

  await supabaseAdmin
    .from('progression_schedules')
    .update({ status: 'applying', updated_at: new Date().toISOString() })
    .eq('id', params.schedule.id)

  let applied = 0
  let skipped = skip.length

  for (const row of apply) {
    const user = usersById.get(row.userId)
    if (!user) {
      skipped += 1
      continue
    }
    const result = await applyProgressionToUser({
      user,
      schedule: params.schedule,
      actorId: params.actorId,
      source: params.source,
    })
    if (result.applied) applied += 1
    else skipped += 1
  }

  const nextCohort = params.schedule.next_cohort_label
  if (nextCohort && applied > 0) {
    await supabaseAdmin.from('academic_cohorts').update({ is_current: false }).neq('label', nextCohort)
    await supabaseAdmin.from('academic_cohorts').update({ is_current: true, updated_at: new Date().toISOString() }).eq('label', nextCohort)
  }

  await supabaseAdmin
    .from('progression_schedules')
    .update({
      status: 'applied',
      applied_at: new Date().toISOString(),
      applied_count: applied,
      skipped_count: skipped,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.schedule.id)

  return { applied, skipped }
}

export async function sendDueProgressionReminders(limit = 40): Promise<{ sent: number; failed: number }> {
  const now = new Date().toISOString()
  const { data: rows, error } = await supabaseAdmin
    .from('progression_audit_log')
    .select('id, user_id, action, from_snapshot, to_snapshot, emails_suppressed')
    .eq('emails_suppressed', false)
    .is('reminder_sent_at', null)
    .not('reminder_due_at', 'is', null)
    .lte('reminder_due_at', now)
    .limit(limit)

  if (error) throw error
  let sent = 0
  let failed = 0

  for (const row of rows || []) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, name, marketing_consent, academic_cohort')
      .eq('id', row.user_id)
      .maybeSingle()

    if (
      (!user?.email || user.marketing_consent === false) &&
      !isTestAccountEmail(user?.email)
    ) {
      await supabaseAdmin
        .from('progression_audit_log')
        .update({ reminder_sent_at: now, notes: 'Reminder skipped (unsubscribed)' })
        .eq('id', row.id)
      continue
    }
    if (isExistingNoEmailCohort(user.academic_cohort) && !isTestAccountEmail(user.email)) {
      await supabaseAdmin
        .from('progression_audit_log')
        .update({ reminder_sent_at: now, notes: 'Reminder skipped (unsubscribed or 25-26)' })
        .eq('id', row.id)
      continue
    }

    try {
      const fromLabel = row.from_snapshot?.stage_label || 'your previous stage'
      const toLabel = row.to_snapshot?.stage_label || 'your current stage'
      const mail = buildProgressionConfirmEmail({
        name: user.name || 'there',
        fromLabel,
        toLabel,
      })
      await sendCustomHtmlEmail(user.email, mail.subject, mail.html)
      await supabaseAdmin
        .from('progression_audit_log')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', row.id)
      sent += 1
    } catch (err) {
      console.error('Progression reminder failed:', err)
      failed += 1
    }
  }

  return { sent, failed }
}

export async function backfillExistingCohort(): Promise<{
  labelled: number
  history: number
  scheduleId: string | null
}> {
  const { data: users } = await supabaseAdmin
    .from('users')
    .select(LEARNER_SELECT)
    .is('academic_cohort', null)

  const eligible = ((users || []) as LearnerSnapshot[]).filter(
    (user) => isProgressableLearner(user) && !isTestAccountEmail(user.email)
  )
  let labelled = 0
  let history = 0
  const now = new Date().toISOString()

  for (const user of eligible) {
    await supabaseAdmin
      .from('users')
      .update({
        academic_cohort: EXISTING_COHORT_LABEL,
        academic_status: user.academic_status || 'active',
        updated_at: now,
      })
      .eq('id', user.id)
    labelled += 1

    const { data: open } = await supabaseAdmin
      .from('user_stage_history')
      .select('id')
      .eq('user_id', user.id)
      .is('ended_at', null)
      .maybeSingle()
    if (!open) {
      await supabaseAdmin.from('user_stage_history').insert({
        user_id: user.id,
        academic_cohort: EXISTING_COHORT_LABEL,
        academic_status: user.academic_status || 'active',
        role_type: user.role_type,
        university: user.university,
        study_year: user.study_year,
        foundation_year: user.foundation_year,
        stage_label: stageLabel({ ...user, academic_cohort: EXISTING_COHORT_LABEL }),
        started_at: now,
        source: 'backfill',
      })
      history += 1
    }
  }

  const { data: existing } = await supabaseAdmin
    .from('progression_schedules')
    .select('id')
    .eq('name', 'Progress existing 25-26 learners')
    .maybeSingle()

  let scheduleId = existing?.id || null
  if (!scheduleId) {
    const { data: created } = await supabaseAdmin
      .from('progression_schedules')
      .insert({
        name: 'Progress existing 25-26 learners',
        cohort_label: EXISTING_COHORT_LABEL,
        next_cohort_label: NEXT_COHORT_LABEL,
        scope: 'cohort',
        recommended_action: 'per_user',
        recommended_exit_action: 'graduate',
        effective_date: new Date().toISOString().slice(0, 10),
        reminder_days_after: 14,
        suppress_emails: true,
        status: 'scheduled',
        notes:
          'Existing ARU/UCL/FY learners. Emails suppressed. Year +1 or graduate/FY1 per path.',
      })
      .select('id')
      .maybeSingle()
    scheduleId = created?.id || null
  }

  return { labelled, history, scheduleId }
}
