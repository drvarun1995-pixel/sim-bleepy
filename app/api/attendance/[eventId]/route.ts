import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { getEventAttendanceData } from '@/lib/attendance-records'

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    console.log('📊 Getting attendance data for event:', params.eventId)

    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!['admin', 'meded_team', 'ctf'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const result = await getEventAttendanceData(params.eventId)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    console.log('✅ Attendance data retrieved successfully:', {
      eventId: params.eventId,
      totalRecords: result.records.length,
      stats: result.stats,
    })

    return NextResponse.json({
      success: true,
      event: result.event,
      records: result.records,
      no_shows: result.no_shows,
      stats: result.stats,
    })
  } catch (error) {
    console.error('Error in GET /api/attendance/[eventId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
