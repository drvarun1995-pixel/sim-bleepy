import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import {
  CONNECTION_ACTIONS,
  ConnectionAction,
  ConnectionRecord,
  ConnectionType,
  isStaffRole,
} from '@/lib/connections'
import { supabaseAdmin } from '@/utils/supabase'
import { sendConnectionAcceptedEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const parseAction = (value: unknown): ConnectionAction | null => {
  const allowed = Object.values(CONNECTION_ACTIONS)
  if (typeof value === 'string' && allowed.includes(value as ConnectionAction)) {
    return value as ConnectionAction
  }
  return null
}

const sanitizeNotes = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const defaultSnoozeDays = 7

const isParticipant = (connection: ConnectionRecord, userId: string) =>
  connection.requester_id === userId || connection.addressee_id === userId

const deriveCounterpartId = (connection: ConnectionRecord, viewerId: string) =>
  connection.requester_id === viewerId ? connection.addressee_id : connection.requester_id

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { data: viewer, error: viewerError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', session.user.email)
      .single()

    if (viewerError || !viewer) {
      console.error('Failed to load viewer for connection response', viewerError)
      return NextResponse.json({ error: 'Unable to load current user' }, { status: 500 })
    }

    const viewerIsStaff = isStaffRole(viewer.role)

    const body = await request.json()
    const connectionId = typeof body?.connectionId === 'string' ? body.connectionId : null
    const action = parseAction(body?.action)
    const notes = sanitizeNotes(body?.notes)
    const snoozeUntilISO = typeof body?.snoozeUntil === 'string' ? body.snoozeUntil : null

    if (!connectionId || !action) {
      return NextResponse.json({ error: 'Invalid connection response payload' }, { status: 400 })
    }

    const { data: connection, error: connectionError } = await supabase
      .from('user_connections')
      .select('*')
      .eq('id', connectionId)
      .maybeSingle()

    if (connectionError) {
      console.error('Failed to load connection for response', connectionError)
      return NextResponse.json({ error: 'Unable to load connection' }, { status: 500 })
    }

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    if (!viewerIsStaff && !isParticipant(connection as ConnectionRecord, viewer.id)) {
      return NextResponse.json({ error: 'You do not have permission to modify this connection' }, { status: 403 })
    }

    const counterpartId = deriveCounterpartId(connection as ConnectionRecord, viewer.id)

    const { data: counterpart, error: counterpartError } = await supabase
      .from('users')
      .select('id, email, name, public_display_name, role')
      .eq('id', counterpartId)
      .single()

    if (counterpartError || !counterpart) {
      console.error('Failed to load counterpart for response', counterpartError)
    }

    const now = new Date().toISOString()

    if (action === CONNECTION_ACTIONS.ACCEPT) {
      const { error: updateError } = await supabaseAdmin
        .from('user_connections')
        .update({
          status: 'accepted',
          responded_at: now,
          notes: connection.connection_type === 'mentor' ? notes ?? connection.notes : connection.notes,
          snoozed_until: null,
        })
        .eq('id', connection.id)

      if (updateError) {
        console.error('Failed to accept connection', updateError)
        return NextResponse.json({ error: 'Unable to accept request' }, { status: 500 })
      }

      await supabaseAdmin.from('system_logs').insert({
        level: 'info',
        message: 'Connection accepted',
        context: {
          connectionId: connection.id,
          viewerId: viewer.id,
          counterpartId,
          connectionType: connection.connection_type,
        },
        user_id: viewer.id,
        user_email: viewer.email,
        api_route: '/api/network/respond'
      })

      if (counterpart?.email) {
        void sendConnectionAcceptedEmail({
          recipientEmail: counterpart.email,
          recipientName: counterpart.public_display_name || counterpart.name || counterpart.email,
          responderName: viewer.name || viewer.email,
          connectionType: connection.connection_type as ConnectionType,
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? ''}/connections`
        }).catch((error) => {
          console.error('Failed to send connection accepted email', error)
        })
      }

      return NextResponse.json({ message: 'Connection accepted successfully.' })
    }

    if (action === CONNECTION_ACTIONS.DECLINE) {
      const { error: declineError } = await supabaseAdmin
        .from('user_connections')
        .update({
          status: 'declined',
          responded_at: now,
          snoozed_until: null,
        })
        .eq('id', connection.id)

      if (declineError) {
        console.error('Failed to decline connection', declineError)
        return NextResponse.json({ error: 'Unable to decline request' }, { status: 500 })
      }

      await supabaseAdmin.from('system_logs').insert({
        level: 'info',
        message: 'Connection request declined',
        context: {
          connectionId: connection.id,
          viewerId: viewer.id,
          counterpartId,
          connectionType: connection.connection_type,
        },
        user_id: viewer.id,
        user_email: viewer.email,
        api_route: '/api/network/respond'
      })

      return NextResponse.json({ message: 'Connection request declined.' })
    }

    if (action === CONNECTION_ACTIONS.BLOCK) {
      const { error: blockError } = await supabaseAdmin
        .from('user_connections')
        .update({
          status: 'blocked',
          responded_at: now,
          snoozed_until: null,
        })
        .eq('id', connection.id)

      if (blockError) {
        console.error('Failed to block connection', blockError)
        return NextResponse.json({ error: 'Unable to block user' }, { status: 500 })
      }

      return NextResponse.json({ message: 'User has been blocked from connecting.' })
    }

    if (action === CONNECTION_ACTIONS.UNBLOCK) {
      const { error: unblockError } = await supabaseAdmin
        .from('user_connections')
        .update({
          status: 'pending',
          responded_at: null,
          snoozed_until: null,
        })
        .eq('id', connection.id)

      if (unblockError) {
        console.error('Failed to unblock user', unblockError)
        return NextResponse.json({ error: 'Unable to unblock connection' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Connection request reopened.' })
    }

    if (action === CONNECTION_ACTIONS.SNOOZE) {
      const snoozeUntil = snoozeUntilISO
        ? new Date(snoozeUntilISO)
        : new Date(Date.now() + defaultSnoozeDays * 24 * 60 * 60 * 1000)

      const { error: snoozeError } = await supabaseAdmin
        .from('user_connections')
        .update({
          status: 'snoozed',
          responded_at: now,
          snoozed_until: snoozeUntil.toISOString(),
        })
        .eq('id', connection.id)

      if (snoozeError) {
        console.error('Failed to snooze connection', snoozeError)
        return NextResponse.json({ error: 'Unable to snooze request' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Request snoozed. We will remind you later.' })
    }

    if (action === CONNECTION_ACTIONS.UNSNOOZE) {
      const { error: unsnoozeError } = await supabaseAdmin
        .from('user_connections')
        .update({
          status: 'pending',
          snoozed_until: null,
        })
        .eq('id', connection.id)

      if (unsnoozeError) {
        console.error('Failed to unsnooze connection', unsnoozeError)
        return NextResponse.json({ error: 'Unable to re-open request' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Request moved back to pending.' })
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (error) {
    console.error('Unhandled error responding to connection request', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
