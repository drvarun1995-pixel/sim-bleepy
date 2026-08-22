import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { applyFileSecurityHeaders } from '@/lib/secure-file-access'
import { supabaseAdmin } from '@/utils/supabase'

type DeleteBody = {
  library: 'study' | 'teaching'
  scope: 'user' | 'admins' | 'all'
  userEmail?: string
  days?: number
}

const TABLES = {
  study: 'download_tracking',
  teaching: 'teaching_resource_download_tracking',
} as const

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return applyFileSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const { data: actor } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (!actor || (actor.role !== 'admin' && actor.role !== 'meded_team')) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Admin or MedEd Team access required' }, { status: 403 })
      )
    }

    const body = (await request.json()) as DeleteBody
    if (!body?.library || !TABLES[body.library]) {
      return applyFileSecurityHeaders(NextResponse.json({ error: 'Invalid library' }, { status: 400 }))
    }
    if (!body?.scope || !['user', 'admins', 'all'].includes(body.scope)) {
      return applyFileSecurityHeaders(NextResponse.json({ error: 'Invalid scope' }, { status: 400 }))
    }
    if (body.scope === 'user' && !body.userEmail?.trim()) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'userEmail is required for scope=user' }, { status: 400 })
      )
    }

    const table = TABLES[body.library]
    const days = Number(body.days)
    const since =
      Number.isFinite(days) && days > 0
        ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
        : null
    const targetEmail = (body.userEmail || '').trim().toLowerCase()

    let adminEmails: string[] = []
    if (body.scope === 'admins') {
      const { data: admins } = await supabaseAdmin.from('users').select('email').eq('role', 'admin')
      adminEmails = (admins || [])
        .map((row) => String(row.email || '').toLowerCase())
        .filter(Boolean)
      if (!adminEmails.length) {
        return applyFileSecurityHeaders(NextResponse.json({ success: true, deleted: 0 }))
      }
    }

    let query = supabaseAdmin.from(table).select('id, resource_id, user_email').limit(10000)
    if (since) query = query.gte('download_timestamp', since)
    if (body.scope === 'user') query = query.ilike('user_email', targetEmail)
    if (body.scope === 'admins') query = query.in('user_email', adminEmails)

    const { data: rows, error } = await query
    if (error) {
      console.error('Download analytics delete fetch error:', error)
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Failed to load records' }, { status: 500 })
      )
    }

    const ids = (rows || []).map((row) => row.id).filter(Boolean)
    const resourceIds = [
      ...new Set((rows || []).map((row) => row.resource_id).filter(Boolean) as string[]),
    ]

    if (!ids.length) {
      return applyFileSecurityHeaders(NextResponse.json({ success: true, deleted: 0 }))
    }

    let deleted = 0
    const chunkSize = 200
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize)
      const { error: delError, count } = await supabaseAdmin
        .from(table)
        .delete({ count: 'exact' })
        .in('id', chunk)
      if (delError) {
        console.error('Download analytics delete error:', delError)
        return applyFileSecurityHeaders(
          NextResponse.json({ error: 'Failed to delete some records', deleted }, { status: 500 })
        )
      }
      deleted += count ?? chunk.length
    }

    if (body.library === 'teaching' && resourceIds.length) {
      for (const resourceId of resourceIds) {
        const { count } = await supabaseAdmin
          .from('teaching_resource_download_tracking')
          .select('id', { count: 'exact', head: true })
          .eq('resource_id', resourceId)
        await supabaseAdmin
          .from('teaching_resources')
          .update({ download_count: count || 0, updated_at: new Date().toISOString() })
          .eq('id', resourceId)
      }
    }

    return applyFileSecurityHeaders(NextResponse.json({ success: true, deleted }))
  } catch (error) {
    console.error('Download analytics delete unexpected error:', error)
    return applyFileSecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
