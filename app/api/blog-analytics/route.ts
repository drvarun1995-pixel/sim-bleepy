import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/require-admin-api'
import { supabaseAdmin } from '@/utils/supabase'
import { applyFileSecurityHeaders } from '@/lib/secure-file-access'

type LogRow = {
  id: string
  message: string
  user_email: string | null
  user_id: string | null
  created_at: string
  context: {
    kind?: string
    action?: string
    session_id?: string
    page_id?: string
    page_slug?: string
    page_title?: string
    active_seconds?: number
    max_scroll_percent?: number
    event_type?: string
    event_label?: string
    event_href?: string
    user_role?: string | null
    is_admin?: boolean
  } | null
}

function rankEmailMatches(query: string, emails: string[], limit = 10): string[] {
  const q = query.trim().toLowerCase()
  const unique = Array.from(new Set(emails.filter((e) => e && e !== 'unknown')))
  if (!q) return unique.sort((a, b) => a.localeCompare(b)).slice(0, limit)

  return unique
    .map((email) => {
      const e = email.toLowerCase()
      const local = e.split('@')[0] || ''
      let score = 0
      if (e === q) score = 100
      else if (e.startsWith(q)) score = 90
      else if (local.startsWith(q)) score = 80
      else if (e.includes(q)) score = 60
      else if (local.includes(q)) score = 50
      else return null
      return { email, score }
    })
    .filter((x): x is { email: string; score: number } => !!x)
    .sort((a, b) => b.score - a.score || a.email.localeCompare(b.email))
    .slice(0, limit)
    .map((x) => x.email)
}

export async function GET(request: NextRequest) {
  const denied = await requireAdminApi()
  if (denied) return applyFileSecurityHeaders(denied)

  try {
    const { searchParams } = new URL(request.url)
    const pageSlug = searchParams.get('pageSlug') || ''
    const userEmail = searchParams.get('userEmail') || ''
    const emailSuggest = searchParams.has('emailSuggest')
      ? searchParams.get('emailSuggest') || ''
      : null
    const days = Math.min(Math.max(Number(searchParams.get('days') || 30), 1), 365)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabaseAdmin
      .from('system_logs')
      .select('id, message, user_email, user_id, created_at, context')
      .eq('api_route', '/api/blog-analytics/track')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5000)

    if (error) {
      console.error('Blog analytics fetch error:', error)
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
      )
    }

    // Typeahead: return ranked emails from analytics logs (+ matching platform users)
    if (emailSuggest !== null) {
      const logEmails = ((data || []) as LogRow[])
        .filter((row) => {
          const ctx = row.context || {}
          if (ctx.kind !== 'fy_blog') return false
          if (pageSlug && ctx.page_slug !== pageSlug) return false
          return true
        })
        .map((row) => row.user_email || '')
        .filter(Boolean)

      const q = emailSuggest.trim()
      let userEmails: string[] = []
      if (q.length >= 1) {
        const { data: users } = await supabaseAdmin
          .from('users')
          .select('email')
          .ilike('email', `%${q}%`)
          .limit(20)
        userEmails = (users || []).map((u) => String(u.email || '')).filter(Boolean)
      }

      const suggestions = rankEmailMatches(q, [...logEmails, ...userEmails], 10)
      return applyFileSecurityHeaders(NextResponse.json({ suggestions }))
    }

    const needle = userEmail.trim().toLowerCase()
    const rows = ((data || []) as LogRow[]).filter((row) => {
      const ctx = row.context || {}
      if (ctx.kind !== 'fy_blog') return false
      if (pageSlug && ctx.page_slug !== pageSlug) return false
      if (needle) {
        const email = (row.user_email || '').toLowerCase()
        if (!email.includes(needle)) return false
      }
      return true
    })

    const emails = Array.from(
      new Set(rows.map((r) => r.user_email || '').filter((e) => e && e !== 'unknown'))
    )

    const adminEmails = new Set<string>()
    if (emails.length) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('email, role')
        .in('email', emails)

      for (const u of users || []) {
        if (u.role === 'admin' && u.email) {
          adminEmails.add(String(u.email).toLowerCase())
        }
      }

      // Case-insensitive fallback if email casing differs in DB
      if (adminEmails.size === 0) {
        const { data: admins } = await supabaseAdmin
          .from('users')
          .select('email')
          .eq('role', 'admin')
        const adminSet = new Set(
          (admins || []).map((a) => String(a.email || '').toLowerCase())
        )
        for (const email of emails) {
          if (adminSet.has(email.toLowerCase())) adminEmails.add(email.toLowerCase())
        }
      }
    }

    // Also honor is_admin flag stored on newer track events
    for (const row of rows) {
      if (row.context?.is_admin && row.user_email) {
        adminEmails.add(row.user_email.toLowerCase())
      }
    }

    const isAdminEmail = (email: string) => adminEmails.has(email.toLowerCase())

    const sessions = new Map<
      string,
      {
        sessionId: string
        pageId: string
        pageSlug: string
        pageTitle: string
        userEmail: string
        userId: string | null
        isAdmin: boolean
        startedAt: string
        lastSeenAt: string
        activeSeconds: number
        maxScrollPercent: number
        eventCount: number
      }
    >()

    const events: Array<{
      id: string
      sessionId: string
      pageSlug: string
      pageTitle: string
      userEmail: string
      isAdmin: boolean
      eventType: string
      eventLabel: string
      eventHref: string
      createdAt: string
    }> = []

    for (const row of rows) {
      const ctx = row.context || {}
      const sessionId = ctx.session_id || row.id
      const email = row.user_email || 'unknown'
      const admin = isAdminEmail(email)

      if (row.message.startsWith('fy_blog:event')) {
        events.push({
          id: row.id,
          sessionId,
          pageSlug: ctx.page_slug || '',
          pageTitle: ctx.page_title || '',
          userEmail: email,
          isAdmin: admin,
          eventType: ctx.event_type || 'click',
          eventLabel: ctx.event_label || '',
          eventHref: ctx.event_href || '',
          createdAt: row.created_at,
        })
      }

      const existing = sessions.get(sessionId)
      if (!existing) {
        sessions.set(sessionId, {
          sessionId,
          pageId: ctx.page_id || '',
          pageSlug: ctx.page_slug || '',
          pageTitle: ctx.page_title || '',
          userEmail: email,
          userId: row.user_id,
          isAdmin: admin,
          startedAt: row.created_at,
          lastSeenAt: row.created_at,
          activeSeconds: Number(ctx.active_seconds) || 0,
          maxScrollPercent: Number(ctx.max_scroll_percent) || 0,
          eventCount: row.message.startsWith('fy_blog:event') ? 1 : 0,
        })
      } else {
        if (row.created_at < existing.startedAt) existing.startedAt = row.created_at
        if (row.created_at > existing.lastSeenAt) existing.lastSeenAt = row.created_at
        existing.activeSeconds = Math.max(
          existing.activeSeconds,
          Number(ctx.active_seconds) || 0
        )
        existing.maxScrollPercent = Math.max(
          existing.maxScrollPercent,
          Number(ctx.max_scroll_percent) || 0
        )
        if (row.message.startsWith('fy_blog:event')) existing.eventCount += 1
        if (!existing.pageTitle && ctx.page_title) existing.pageTitle = ctx.page_title
        existing.isAdmin = existing.isAdmin || admin
      }
    }

    const sessionList = Array.from(sessions.values()).sort(
      (a, b) => +new Date(b.lastSeenAt) - +new Date(a.lastSeenAt)
    )

    const readerKey = (email: string, slug: string) => `${email}::${slug}`
    const readers = new Map<
      string,
      {
        userEmail: string
        isAdmin: boolean
        pageSlug: string
        pageTitle: string
        sessions: number
        totalActiveSeconds: number
        maxScrollPercent: number
        events: number
        lastSeenAt: string
      }
    >()

    for (const s of sessionList) {
      const key = readerKey(s.userEmail, s.pageSlug)
      const existing = readers.get(key)
      if (!existing) {
        readers.set(key, {
          userEmail: s.userEmail,
          isAdmin: s.isAdmin,
          pageSlug: s.pageSlug,
          pageTitle: s.pageTitle,
          sessions: 1,
          totalActiveSeconds: s.activeSeconds,
          maxScrollPercent: s.maxScrollPercent,
          events: s.eventCount,
          lastSeenAt: s.lastSeenAt,
        })
      } else {
        existing.sessions += 1
        existing.totalActiveSeconds += s.activeSeconds
        existing.maxScrollPercent = Math.max(
          existing.maxScrollPercent,
          s.maxScrollPercent
        )
        existing.events += s.eventCount
        if (s.lastSeenAt > existing.lastSeenAt) existing.lastSeenAt = s.lastSeenAt
        existing.isAdmin = existing.isAdmin || s.isAdmin
      }
    }

    const pages = new Map<
      string,
      {
        pageSlug: string
        pageTitle: string
        uniqueReaders: Set<string>
        uniqueAdminReaders: Set<string>
        sessions: number
        adminSessions: number
        totalActiveSeconds: number
        adminActiveSeconds: number
        events: number
        adminEvents: number
      }
    >()

    for (const s of sessionList) {
      const existing = pages.get(s.pageSlug)
      if (!existing) {
        pages.set(s.pageSlug, {
          pageSlug: s.pageSlug,
          pageTitle: s.pageTitle,
          uniqueReaders: new Set([s.userEmail]),
          uniqueAdminReaders: new Set(s.isAdmin ? [s.userEmail] : []),
          sessions: 1,
          adminSessions: s.isAdmin ? 1 : 0,
          totalActiveSeconds: s.activeSeconds,
          adminActiveSeconds: s.isAdmin ? s.activeSeconds : 0,
          events: s.eventCount,
          adminEvents: s.isAdmin ? s.eventCount : 0,
        })
      } else {
        existing.uniqueReaders.add(s.userEmail)
        if (s.isAdmin) existing.uniqueAdminReaders.add(s.userEmail)
        existing.sessions += 1
        if (s.isAdmin) existing.adminSessions += 1
        existing.totalActiveSeconds += s.activeSeconds
        if (s.isAdmin) existing.adminActiveSeconds += s.activeSeconds
        existing.events += s.eventCount
        if (s.isAdmin) existing.adminEvents += s.eventCount
        if (!existing.pageTitle && s.pageTitle) existing.pageTitle = s.pageTitle
      }
    }

    const pageStats = Array.from(pages.values())
      .map((p) => ({
        pageSlug: p.pageSlug,
        pageTitle: p.pageTitle,
        uniqueReaders: p.uniqueReaders.size,
        uniqueAdminReaders: p.uniqueAdminReaders.size,
        sessions: p.sessions,
        adminSessions: p.adminSessions,
        totalActiveSeconds: p.totalActiveSeconds,
        adminActiveSeconds: p.adminActiveSeconds,
        avgActiveSeconds:
          p.sessions > 0 ? Math.round(p.totalActiveSeconds / p.sessions) : 0,
        events: p.events,
        adminEvents: p.adminEvents,
      }))
      .sort((a, b) => b.sessions - a.sessions)

    const readerList = Array.from(readers.values()).sort((a, b) => {
      if (a.isAdmin !== b.isAdmin) return a.isAdmin ? -1 : 1
      return +new Date(b.lastSeenAt) - +new Date(a.lastSeenAt)
    })

    const adminSessions = sessionList.filter((s) => s.isAdmin)
    const nonAdminSessions = sessionList.filter((s) => !s.isAdmin)

    return applyFileSecurityHeaders(
      NextResponse.json({
        summary: {
          days,
          totalSessions: sessionList.length,
          totalEvents: events.length,
          uniqueReaders: new Set(sessionList.map((s) => s.userEmail)).size,
          totalActiveSeconds: sessionList.reduce((n, s) => n + s.activeSeconds, 0),
          adminSessions: adminSessions.length,
          nonAdminSessions: nonAdminSessions.length,
          uniqueAdminReaders: new Set(adminSessions.map((s) => s.userEmail)).size,
          uniqueNonAdminReaders: new Set(nonAdminSessions.map((s) => s.userEmail)).size,
          adminActiveSeconds: adminSessions.reduce((n, s) => n + s.activeSeconds, 0),
          adminEvents: events.filter((e) => e.isAdmin).length,
        },
        pageStats,
        readers: readerList,
        adminReaders: readerList.filter((r) => r.isAdmin),
        sessions: sessionList.slice(0, 500),
        events: events.slice(0, 500),
      })
    )
  } catch (error) {
    console.error('Blog analytics GET error:', error)
    return applyFileSecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
