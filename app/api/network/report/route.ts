import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { sendConnectionReportEmail, sendConnectionReportAcknowledgementEmail } from '@/lib/email'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const targetUserId = typeof body?.targetUserId === 'string' ? body.targetUserId : null
    const connectionId = typeof body?.connectionId === 'string' ? body.connectionId : null
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''
    const notes = typeof body?.notes === 'string' ? body.notes.trim() : null

    if (!targetUserId || reason.length === 0) {
      return NextResponse.json({ error: 'Invalid report payload' }, { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { data: reporter, error: reporterError } = await supabase
      .from('users')
      .select('id, name, email, public_display_name')
      .eq('email', session.user.email)
      .single()

    if (reporterError || !reporter) {
      console.error('Failed to load reporter for connection report', reporterError)
      return NextResponse.json({ error: 'Unable to process report' }, { status: 500 })
    }

    if (reporter.id === targetUserId) {
      return NextResponse.json({ error: 'You cannot report yourself.' }, { status: 400 })
    }

    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('id, name, email, public_display_name')
      .eq('id', targetUserId)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json({ error: 'Target user not found.' }, { status: 404 })
    }

    const reporterDisplayName = reporter.public_display_name || reporter.name || reporter.email
    const targetDisplayName = targetUser.public_display_name || targetUser.name || targetUser.email
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? ''

    const { error: insertError } = await supabase
      .from('connection_reports')
      .insert({
        reporter_id: reporter.id,
        target_user_id: targetUserId,
        connection_id: connectionId,
        reason,
        notes,
      })

    if (insertError) {
      console.error('Failed to create connection report', insertError)
      return NextResponse.json({ error: 'Unable to submit report right now.' }, { status: 500 })
    }

    await supabaseAdmin.from('system_logs').insert({
      level: 'warning',
      message: 'Connection reported',
      context: {
        reporterId: reporter.id,
        targetUserId,
        connectionId,
        reason,
      },
      user_id: reporter.id,
      user_email: reporter.email,
      api_route: '/api/network/report'
    })

    await supabaseAdmin.from('connection_events').insert({
      actor_id: reporter.id,
      counterpart_id: targetUserId,
      connection_id: connectionId,
      event_type: 'request_reported',
      metadata: {
        reason,
        hasNotes: Boolean(notes),
      },
    })

    const contactMessage = {
      name: reporterDisplayName,
      email: reporter.email,
      subject: `Connection report: ${reporterDisplayName} → ${targetDisplayName}`,
      category: 'connections_report',
      message:
        `Reporter: ${reporterDisplayName} (${reporter.email})` +
        `\nTarget: ${targetDisplayName}` +
        `\nReason: ${reason}` +
        (notes ? `\nAdditional notes:\n${notes}` : '') +
        (connectionId ? `\nConnection ID: ${connectionId}` : '') +
        '\n\nSubmitted via in-app connections beta.',
      status: 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error: contactMessageError } = await supabase
      .from('contact_messages')
      .insert(contactMessage)

    if (contactMessageError) {
      console.error('Failed to create contact message for connection report', contactMessageError)
    }

    const adminEmail = process.env.CONNECTION_REPORTS_EMAIL || process.env.ADMIN_EMAIL
    if (adminEmail) {
      void sendConnectionReportEmail({
        reviewerEmail: adminEmail,
        reporterName: reporterDisplayName,
        targetName: targetDisplayName,
        reason,
        notes,
        dashboardUrl: `${appBaseUrl}/connections`
      }).catch((error) => {
        console.error('Failed to send connection report email', error)
      })
    }

    void sendConnectionReportAcknowledgementEmail({
      recipientEmail: reporter.email,
      recipientName: reporterDisplayName,
      targetName: targetDisplayName,
      reason,
      notes,
      dashboardUrl: `${appBaseUrl}/connections`
    }).catch((error) => {
      console.error('Failed to send reporter acknowledgement email', error)
    })

    return NextResponse.json({ message: 'Thanks. Our team will review this connection.' })
  } catch (error) {
    console.error('Unhandled error submitting connection report', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
