import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { applyFileSecurityHeaders } from '@/lib/secure-file-access'

type TrackBody = {
  action: 'start' | 'heartbeat' | 'end' | 'event'
  sessionId: string
  pageId: string
  pageSlug: string
  pageTitle?: string
  activeSeconds?: number
  maxScrollPercent?: number
  eventType?: 'click' | 'download' | 'outbound' | 'image'
  eventLabel?: string
  eventHref?: string
}

function badRequest(message: string) {
  return applyFileSecurityHeaders(
    NextResponse.json({ error: message }, { status: 400 })
  )
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    }

    const body = (await request.json()) as TrackBody
    if (!body?.action || !body.sessionId || !body.pageId || !body.pageSlug) {
      return badRequest('Missing required tracking fields')
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, analytics_consent')
      .eq('email', session.user.email)
      .maybeSingle()

    // Server-side policy gate: explicit opt-out in account consent blocks tracking
    if (user?.analytics_consent === false) {
      return applyFileSecurityHeaders(
        NextResponse.json({ success: false, skipped: 'analytics_consent_denied' })
      )
    }

    const activeSeconds = Math.max(0, Math.min(Number(body.activeSeconds) || 0, 60 * 60 * 6))
    const maxScrollPercent = Math.max(
      0,
      Math.min(Number(body.maxScrollPercent) || 0, 100)
    )

    const context: Record<string, unknown> = {
      kind: 'fy_blog',
      action: body.action,
      session_id: body.sessionId,
      page_id: body.pageId,
      page_slug: body.pageSlug,
      page_title: body.pageTitle || null,
      active_seconds: activeSeconds,
      max_scroll_percent: maxScrollPercent,
      user_role: user?.role || null,
      is_admin: user?.role === 'admin',
    }

    if (body.action === 'event') {
      if (!body.eventType) return badRequest('eventType required')
      context.event_type = body.eventType
      context.event_label = (body.eventLabel || '').slice(0, 300)
      context.event_href = (body.eventHref || '').slice(0, 1000)
    }

    const message =
      body.action === 'event'
        ? `fy_blog:event:${body.eventType}`
        : `fy_blog:${body.action}`

    const { error } = await supabaseAdmin.from('system_logs').insert({
      level: 'info',
      message,
      api_route: '/api/blog-analytics/track',
      user_id: user?.id || null,
      user_email: session.user.email,
      context,
    })

    if (error) {
      console.error('Blog analytics track error:', error)
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Failed to track' }, { status: 500 })
      )
    }

    return applyFileSecurityHeaders(NextResponse.json({ success: true }))
  } catch (error) {
    console.error('Blog analytics track unexpected error:', error)
    return applyFileSecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
