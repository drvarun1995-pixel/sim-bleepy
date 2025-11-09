import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { isStaffRole } from '@/lib/connections'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { data: viewer, error: viewerError } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (viewerError || !viewer || !isStaffRole(viewer.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const since = request.nextUrl.searchParams.get('since') ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: events, error: eventsError } = await supabase
      .from('connection_events')
      .select('event_type')
      .gte('created_at', since)

    if (eventsError) {
      console.error('Failed to fetch connection event metrics', eventsError)
      return NextResponse.json({ error: 'Unable to load metrics' }, { status: 500 })
    }

    const eventCounts = Object.entries(
      (events ?? []).reduce<Record<string, number>>((acc, current) => {
        const key = current.event_type ?? 'unknown'
        acc[key] = (acc[key] ?? 0) + 1
        return acc
      }, {})
    ).map(([event_type, count]) => ({ event_type, count }))

    const { count: pendingCount } = await supabase
      .from('user_connections')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { count: acceptedCount } = await supabase
      .from('user_connections')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'accepted')

    const { count: blockedCount } = await supabase
      .from('user_connections')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'blocked')

    return NextResponse.json({
      since,
      events: eventCounts,
      snapshot: {
        pending: pendingCount ?? 0,
        accepted: acceptedCount ?? 0,
        blocked: blockedCount ?? 0,
      },
    })
  } catch (error) {
    console.error('Unhandled error fetching connection metrics', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
