import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { isStaffRole } from '@/lib/connections'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { data: viewer, error: viewerError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', session.user.email)
      .single()

    if (viewerError || !viewer) {
      console.error('Failed to load viewer for connection removal', viewerError)
      return NextResponse.json({ error: 'Unable to load current user' }, { status: 500 })
    }

    const { data: connection, error: connectionError } = await supabase
      .from('user_connections')
      .select('id, requester_id, addressee_id, connection_type, status')
      .eq('id', params.id)
      .maybeSingle()

    if (connectionError) {
      console.error('Failed to fetch connection for deletion', connectionError)
      return NextResponse.json({ error: 'Unable to load connection' }, { status: 500 })
    }

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    const viewerIsStaff = isStaffRole(viewer.role)
    const viewerIsParticipant = connection.requester_id === viewer.id || connection.addressee_id === viewer.id

    if (!viewerIsStaff && !viewerIsParticipant) {
      return NextResponse.json({ error: 'You are not allowed to remove this connection' }, { status: 403 })
    }

    const { error: deleteError } = await supabaseAdmin
      .from('user_connections')
      .delete()
      .eq('id', connection.id)

    if (deleteError) {
      console.error('Failed to delete connection', deleteError)
      return NextResponse.json({ error: 'Failed to remove connection' }, { status: 500 })
    }

    await supabaseAdmin.from('system_logs').insert({
      level: 'info',
      message: 'Connection removed',
      context: {
        connectionId: connection.id,
        viewerId: viewer.id,
        connectionType: connection.connection_type,
        previousStatus: connection.status,
      },
      user_id: viewer.id,
      user_email: viewer.email,
      api_route: `/api/network/${params.id}`,
    })

    return NextResponse.json({ message: 'Connection removed successfully.' })
  } catch (error) {
    console.error('Unhandled error removing connection', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
