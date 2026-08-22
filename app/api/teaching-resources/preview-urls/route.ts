import { NextRequest, NextResponse } from 'next/server'
import {
  getTeachingResourcesActor,
  signTeachingPreviewUrls,
} from '@/lib/teaching-resources-server'
import { applyFileSecurityHeaders } from '@/lib/secure-file-access'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_IDS = 40

export async function POST(request: NextRequest) {
  try {
    const actor = await getTeachingResourcesActor()
    if (actor.error) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: actor.error }, { status: actor.status })
      )
    }

    const body = await request.json().catch(() => ({}))
    const rawIds = (Array.isArray(body.ids) ? body.ids : [])
      .map((id: unknown) => String(id || '').trim())
      .filter(Boolean)
    const seenIds: Record<string, true> = {}
    const ids: string[] = []
    for (let i = 0; i < rawIds.length; i++) {
      const id = rawIds[i]
      if (!seenIds[id]) {
        seenIds[id] = true
        ids.push(id)
      }
      if (ids.length >= MAX_IDS) break
    }

    if (!ids.length) {
      return applyFileSecurityHeaders(NextResponse.json({ urls: {} }))
    }

    const { data, error } = await supabaseAdmin
      .from('teaching_resources')
      .select('id, file_name, file_type, file_path, preview_path, is_active')
      .in('id', ids)
      .eq('is_active', true)

    if (error) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Failed to prepare previews' }, { status: 500 })
      )
    }

    const urls = await signTeachingPreviewUrls(data || [])
    return applyFileSecurityHeaders(NextResponse.json({ urls }))
  } catch (error) {
    console.error('Teaching resource preview URL error:', error)
    return applyFileSecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
