import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { fetchExistingConnection, ConnectionType, isStaffRole } from '@/lib/connections'
import { supabaseAdmin } from '@/utils/supabase'
import { sendConnectionRequestEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const sanitizeConnectionType = (value: unknown): ConnectionType | null => {
  if (value === 'friend' || value === 'mentor') return value
  return null
}

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const { data: viewer, error: viewerError } = await supabase
      .from('users')
      .select('id, email, name, role, allow_messages, public_slug, is_public')
      .eq('email', session.user.email)
      .single()

    if (viewerError || !viewer) {
      console.error('Failed to load viewer for connection request', viewerError)
      return NextResponse.json({ error: 'Unable to load current user' }, { status: 500 })
    }

    const viewerIsStaff = isStaffRole(viewer.role)

    const body = await request.json()
    const targetUserId = typeof body?.targetUserId === 'string' ? body.targetUserId : null
    const connectionType = sanitizeConnectionType(body?.connectionType)
    const mentorNotes = typeof body?.notes === 'string' ? body.notes.trim() : undefined

    if (!targetUserId || !connectionType) {
      return NextResponse.json({ error: 'Invalid connection payload' }, { status: 400 })
    }

    if (targetUserId === viewer.id) {
      return NextResponse.json({ error: 'You cannot connect with yourself' }, { status: 400 })
    }

    const { data: target, error: targetError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        role,
        allow_messages,
        public_slug,
        is_public,
        public_display_name
      `)
      .eq('id', targetUserId)
      .single()

    if (targetError || !target) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    const { data: targetPreferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('pause_connection_requests, email_notifications')
      .eq('user_id', target.id)
      .maybeSingle()

    if (prefError) {
      console.error('Failed to fetch target preferences', prefError)
    }

    if (targetPreferences?.pause_connection_requests && !viewerIsStaff) {
      return NextResponse.json({
        error: 'This user is currently not accepting new connection requests'
      }, { status: 403 })
    }

    const connection = await fetchExistingConnection(viewer.id, target.id, connectionType)

    if (connection) {
      if (connection.status === 'accepted') {
        return NextResponse.json({
          message: `You are already connected as ${connectionType === 'friend' ? 'friends' : 'mentor/mentee'}.`
        }, { status: 200 })
      }

      if (connection.status === 'pending') {
        if (connection.requester_id === target.id) {
          // Auto-accept reciprocal requests
          const { error: acceptError } = await supabaseAdmin
            .from('user_connections')
            .update({
              status: 'accepted',
              responded_at: new Date().toISOString(),
              notes: connectionType === 'mentor' && mentorNotes ? mentorNotes : connection.notes
            })
            .eq('id', connection.id)

          if (acceptError) {
            console.error('Failed to auto-accept reciprocal connection', acceptError)
            return NextResponse.json({ error: 'Unable to accept existing connection' }, { status: 500 })
          }

          return NextResponse.json({
            message: connectionType === 'friend'
              ? 'Friend request accepted — you are now connected.'
              : 'Mentor request accepted — connection created.'
          }, { status: 200 })
        }

        return NextResponse.json({
          message: 'You already sent a request. We will notify them again.'
        }, { status: 200 })
      }

      if (connection.status === 'snoozed') {
        return NextResponse.json({
          message: 'This user snoozed your last request. Try again later.'
        }, { status: 200 })
      }

      if (connection.status === 'declined') {
        if (connection.requester_id === viewer.id) {
          return NextResponse.json({
            message: 'This user declined your previous request. You can wait for them to reach out if they change their mind.'
          }, { status: 200 })
        }

        const now = new Date().toISOString()
        const { error: reviveError } = await supabaseAdmin
          .from('user_connections')
          .update({
            requester_id: viewer.id,
            addressee_id: target.id,
            connection_type: connectionType,
            status: 'pending',
            initiated_by_requester: true,
            requested_at: now,
            responded_at: null,
            snoozed_until: null,
            notes: connectionType === 'mentor' ? (mentorNotes || connection.notes || null) : null,
          })
          .eq('id', connection.id)

        if (reviveError) {
          console.error('Failed to revive declined connection', reviveError)
          return NextResponse.json({ error: 'Unable to create connection request' }, { status: 500 })
        }

        await supabaseAdmin.from('system_logs').insert({
          level: 'info',
          message: 'Connection request re-opened after decline',
          context: {
            requesterId: viewer.id,
            addresseeId: target.id,
            connectionType,
          },
          user_id: viewer.id,
          user_email: viewer.email,
          api_route: '/api/network/request'
        })

        if (target.email && targetPreferences?.email_notifications !== false) {
          void sendConnectionRequestEmail({
            recipientEmail: target.email,
            recipientName: target.public_display_name || target.name || target.email,
            requesterName: viewer.name || session.user.email || 'Bleepy User',
            connectionType,
            respondUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? ''}/connections`
          }).catch((error) => {
            console.error('Failed to send connection request email', error)
          })
        }

        return NextResponse.json({
          message: connectionType === 'friend'
            ? 'Friend request sent successfully.'
            : 'Mentor request sent successfully.'
        })
      }

      if (connection.status === 'blocked') {
        return NextResponse.json({ error: 'Connection not allowed with this user.' }, { status: 403 })
      }
    }

    const insertPayload: Record<string, any> = {
      requester_id: viewer.id,
      addressee_id: target.id,
      connection_type: connectionType,
      status: 'pending',
      initiated_by_requester: true,
      requested_at: new Date().toISOString(),
    }

    const { error: insertError } = await supabaseAdmin
      .from('user_connections')
      .insert(insertPayload)

    if (insertError) {
      console.error('Failed to insert connection request', insertError)
      return NextResponse.json({ error: 'Failed to create connection request' }, { status: 500 })
    }

    // Log event for auditing
    await supabaseAdmin.from('system_logs').insert({
      level: 'info',
      message: 'Connection request created',
      context: {
        requesterId: viewer.id,
        addresseeId: target.id,
        connectionType,
      },
      user_id: viewer.id,
      user_email: viewer.email,
      api_route: '/api/network/request'
    })

    if (target.email && targetPreferences?.email_notifications !== false) {
      void sendConnectionRequestEmail({
        recipientEmail: target.email,
        recipientName: target.public_display_name || target.name || target.email,
        requesterName: viewer.name || session.user.email || 'Bleepy User',
        connectionType,
        respondUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? ''}/connections`
      }).catch((error) => {
        console.error('Failed to send connection request email', error)
      })
    }

    return NextResponse.json({
      message: connectionType === 'friend'
        ? 'Friend request sent successfully.'
        : 'Mentor request sent successfully.'
    })
  } catch (error) {
    console.error('Unhandled error sending connection request', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
