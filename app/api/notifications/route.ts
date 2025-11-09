import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'

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
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (viewerError || !viewer) {
      console.error('Failed to load user for notifications', viewerError)
      return NextResponse.json({ error: 'Unable to load notifications' }, { status: 500 })
    }

    const unreadOnly = request.nextUrl.searchParams.get('unreadOnly') === 'true'
    let query = supabase
      .from('user_notifications')
      .select('id, type, payload, read_at, created_at')
      .eq('user_id', viewer.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (unreadOnly) {
      query = query.is('read_at', null)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch notifications', error)
      return NextResponse.json({ error: 'Unable to load notifications' }, { status: 500 })
    }

    return NextResponse.json({ notifications: data ?? [] })
  } catch (error) {
    console.error('Unhandled error fetching notifications', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { data: viewer, error: viewerError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (viewerError || !viewer) {
      console.error('Failed to load user for notifications update', viewerError)
      return NextResponse.json({ error: 'Unable to update notifications' }, { status: 500 })
    }

    const body = await request.json()
    const ids = Array.isArray(body?.ids) ? body.ids.filter((value: unknown) => typeof value === 'string') : null
    const markAll = body?.markAll === true

    if ((!ids || ids.length === 0) && !markAll) {
      return NextResponse.json({ error: 'Invalid notification update payload' }, { status: 400 })
    }

    const updateQuery = supabase
      .from('user_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', viewer.id)
      .is('read_at', null)

    if (ids && ids.length > 0) {
      updateQuery.in('id', ids)
    }

    const { error: updateError } = await updateQuery

    if (updateError) {
      console.error('Failed to mark notifications as read', updateError)
      return NextResponse.json({ error: 'Unable to update notifications' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Notifications updated.' })
  } catch (error) {
    console.error('Unhandled error updating notifications', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
