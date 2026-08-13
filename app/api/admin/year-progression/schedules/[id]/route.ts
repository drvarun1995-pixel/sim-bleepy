import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import { requireYearProgressionAdmin } from '@/lib/year-progression-auth'
import { applySchedule, previewSchedule, type ProgressionScheduleRow } from '@/lib/year-progression-apply'

export const dynamic = 'force-dynamic'

async function loadSchedule(id: string) {
  const { data, error } = await supabaseAdmin
    .from('progression_schedules')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return data as ProgressionScheduleRow
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireYearProgressionAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const schedule = await loadSchedule(params.id)
  if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  if (body.action === 'preview') {
    const preview = await previewSchedule(schedule)
    return NextResponse.json({
      applyCount: preview.apply.length,
      skipCount: preview.skip.length,
      apply: preview.apply.slice(0, 80),
      skip: preview.skip.slice(0, 80),
    })
  }

  if (body.action === 'apply') {
    if (schedule.status === 'applied') {
      return NextResponse.json({ error: 'This schedule has already been applied' }, { status: 400 })
    }
    const result = await applySchedule({
      schedule,
      actorId: auth.user.id,
      source: 'admin',
    })
    return NextResponse.json({ success: true, ...result })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
