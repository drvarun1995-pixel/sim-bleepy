import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import { requireYearProgressionAdmin } from '@/lib/year-progression-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireYearProgressionAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const historyUserId = request.nextUrl.searchParams.get('historyUserId')
  if (historyUserId) {
    const { data: stages } = await supabaseAdmin
      .from('user_stage_history')
      .select('*')
      .eq('user_id', historyUserId)
      .order('started_at', { ascending: true })
    const { data: bookings } = await supabaseAdmin
      .from('event_bookings')
      .select('id, status, booked_at, checked_in, checked_in_at, event_id, events:event_id (title, date)')
      .eq('user_id', historyUserId)
      .order('booked_at', { ascending: false })
      .limit(200)
    const bookingsWithStage = (bookings || []).map((b: any) => {
      const at = b.booked_at || b.checked_in_at
      const stage = (stages || []).find((s: any) => {
        const start = s.started_at
        const end = s.ended_at
        if (!at) return false
        if (start && at < start) return false
        if (end && at >= end) return false
        return true
      })
      return { ...b, stage_label: stage?.stage_label || 'Before stage tracking' }
    })
    return NextResponse.json({ stages: stages || [], bookings: bookingsWithStage })
  }
  const q = (request.nextUrl.searchParams.get('q') || '').trim()
  let query = supabaseAdmin
    .from('users')
    .select('id, name, email, university, study_year, foundation_year, role_type, academic_status, academic_cohort')
    .order('name', { ascending: true })
    .limit(25)

  if (q) {
    const safe = q.replace(/[,()]/g, ' ').slice(0, 80)
    query = query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%`)
  } else {
    query = query.in('role_type', ['medical_student', 'foundation_doctor'])
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ users: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await requireYearProgressionAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json()
  if (body.action === 'add-exception') {
    if (!body.userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
    const { data, error } = await supabaseAdmin
      .from('progression_exceptions')
      .insert({
        user_id: body.userId,
        schedule_id: body.scheduleId || null,
        exception_type: body.exception_type || 'skip',
        reason: body.reason || null,
        created_by: auth.user.id,
        expires_at: body.expires_at || null,
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ exception: data })
  }

  if (body.action === 'delete-exception') {
    if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const { error } = await supabaseAdmin.from('progression_exceptions').delete().eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
