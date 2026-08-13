import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import {
  applySchedule,
  backfillExistingCohort,
  sendDueProgressionReminders,
  syncTestAccountsToLatestCohort,
  type ProgressionScheduleRow,
} from '@/lib/year-progression-apply'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function authorize(request: NextRequest): boolean {
  const cronSecret = (process.env.CRON_SECRET || process.env.INTERNAL_CRON_SECRET)?.trim()
  if (!cronSecret) return false
  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${cronSecret}`) return true
  const secretParam = request.nextUrl.searchParams.get('secret')?.trim()
  return secretParam === cronSecret
}

async function runJob() {
  let backfill: { labelled: number; history: number; scheduleId: string | null } = {
    labelled: 0,
    history: 0,
    scheduleId: null,
  }
  try {
    backfill = await backfillExistingCohort()
  } catch (error) {
    console.error('year-progression backfill skipped:', error)
  }

  try {
    await syncTestAccountsToLatestCohort()
  } catch (error) {
    console.error('year-progression test accounts skipped:', error)
  }

  const today = new Date().toISOString().slice(0, 10)
  const { data: due } = await supabaseAdmin
    .from('progression_schedules')
    .select('*')
    .eq('status', 'scheduled')
    .lte('effective_date', today)
    .order('effective_date', { ascending: true })
    .limit(5)

  const applied: Array<{ id: string; applied: number; skipped: number }> = []
  for (const schedule of due || []) {
    const result = await applySchedule({
      schedule: schedule as ProgressionScheduleRow,
      source: 'cron',
    })
    applied.push({ id: schedule.id, ...result })
  }

  const reminders = await sendDueProgressionReminders(40)

  return {
    success: true,
    backfill,
    schedulesApplied: applied,
    reminders,
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!authorize(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const result = await runJob()
    return NextResponse.json(result)
  } catch (error) {
    console.error('year-progression cron failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
