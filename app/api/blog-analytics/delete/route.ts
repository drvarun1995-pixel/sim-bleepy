import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/require-admin-api'
import { supabaseAdmin } from '@/utils/supabase'
import { applyFileSecurityHeaders } from '@/lib/secure-file-access'

type DeleteBody = {
  /** Delete one email, all admin rows, or everything in range */
  scope: 'user' | 'admins' | 'all'
  userEmail?: string
  pageSlug?: string
  days?: number
}

export async function POST(request: NextRequest) {
  const denied = await requireAdminApi()
  if (denied) return applyFileSecurityHeaders(denied)

  try {
    const body = (await request.json()) as DeleteBody
    if (!body?.scope || !['user', 'admins', 'all'].includes(body.scope)) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Invalid scope' }, { status: 400 })
      )
    }

    if (body.scope === 'user' && !body.userEmail?.trim()) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'userEmail is required for scope=user' }, { status: 400 })
      )
    }

    const days = Math.min(Math.max(Number(body.days) || 3650, 1), 3650)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const pageSlug = body.pageSlug?.trim() || ''

    let query = supabaseAdmin
      .from('system_logs')
      .select('id, user_email, context')
      .eq('api_route', '/api/blog-analytics/track')
      .gte('created_at', since)
      .limit(10000)

    const { data: rows, error } = await query
    if (error) {
      console.error('Blog analytics delete fetch error:', error)
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Failed to load records' }, { status: 500 })
      )
    }

    let adminEmails = new Set<string>()
    if (body.scope === 'admins') {
      const { data: admins } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('role', 'admin')
      adminEmails = new Set(
        (admins || []).map((a) => String(a.email || '').toLowerCase())
      )
    }

    const targetEmail = (body.userEmail || '').trim().toLowerCase()
    const ids = (rows || [])
      .filter((row) => {
        const ctx = (row.context || {}) as {
          kind?: string
          page_slug?: string
          is_admin?: boolean
        }
        if (ctx.kind !== 'fy_blog') return false
        if (pageSlug && ctx.page_slug !== pageSlug) return false

        const email = String(row.user_email || '').toLowerCase()
        if (body.scope === 'user') return email === targetEmail
        if (body.scope === 'admins') {
          return ctx.is_admin === true || adminEmails.has(email)
        }
        return true
      })
      .map((row) => row.id)

    if (!ids.length) {
      return applyFileSecurityHeaders(
        NextResponse.json({ success: true, deleted: 0 })
      )
    }

    // Delete in chunks to avoid payload limits
    let deleted = 0
    const chunkSize = 200
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize)
      const { error: delError, count } = await supabaseAdmin
        .from('system_logs')
        .delete({ count: 'exact' })
        .in('id', chunk)
      if (delError) {
        console.error('Blog analytics delete error:', delError)
        return applyFileSecurityHeaders(
          NextResponse.json(
            { error: 'Failed to delete some records', deleted },
            { status: 500 }
          )
        )
      }
      deleted += count ?? chunk.length
    }

    // Best-effort cleanup of dedicated tables if migration was applied
    try {
      if (body.scope === 'user' && targetEmail) {
        let s = supabaseAdmin
          .from('fy_blog_sessions')
          .delete()
          .ilike('user_email', targetEmail)
          .gte('started_at', since)
        if (pageSlug) s = s.eq('page_slug', pageSlug)
        await s

        let e = supabaseAdmin
          .from('fy_blog_events')
          .delete()
          .ilike('user_email', targetEmail)
          .gte('created_at', since)
        if (pageSlug) e = e.eq('page_slug', pageSlug)
        await e
      } else if (body.scope === 'all') {
        let s = supabaseAdmin.from('fy_blog_sessions').delete().gte('started_at', since)
        if (pageSlug) s = s.eq('page_slug', pageSlug)
        await s
        let e = supabaseAdmin.from('fy_blog_events').delete().gte('created_at', since)
        if (pageSlug) e = e.eq('page_slug', pageSlug)
        await e
      }
    } catch {
      // Tables may not exist / RLS — ignore
    }

    return applyFileSecurityHeaders(
      NextResponse.json({ success: true, deleted })
    )
  } catch (error) {
    console.error('Blog analytics delete unexpected error:', error)
    return applyFileSecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
