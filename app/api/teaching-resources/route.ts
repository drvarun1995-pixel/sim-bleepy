import { NextRequest, NextResponse } from 'next/server'
import { getTeachingResourcesActor } from '@/lib/teaching-resources-server'
import {
  isCanvaTeachingResource,
  isTeachingResourceCategory,
  parseTeachingTags,
  previewKindFromFile,
  sanitizeTeachingSearch,
  teachingResourceOpenUrl,
  type TeachingResourceRecord,
} from '@/lib/teaching-resources'
import { supabaseAdmin } from '@/utils/supabase'
import { applyFileSecurityHeaders } from '@/lib/secure-file-access'

export const dynamic = 'force-dynamic'

function toPublicResource(
  row: Record<string, unknown>,
  previewUrl: string | null
): TeachingResourceRecord {
  const tags = Array.isArray(row.tags) ? (row.tags as string[]) : parseTeachingTags(row.tags_text as string)
  const hasPreviewImage = typeof row.preview_path === 'string' && row.preview_path.length > 0
  const previewKind = previewKindFromFile(String(row.file_name || ''), String(row.file_type || ''), hasPreviewImage)
  return {
    id: String(row.id),
    title: String(row.title || ''),
    description: (row.description as string) || null,
    category: row.category as TeachingResourceRecord['category'],
    file_name: String(row.file_name || ''),
    file_size: Number(row.file_size || 0),
    file_type: String(row.file_type || ''),
    tags,
    license_source: (row.license_source as string) || null,
    license_note: (row.license_note as string) || null,
    source_url: (row.source_url as string) || null,
    uploaded_by: (row.uploaded_by as string) || null,
    uploaded_by_name: (row.uploaded_by_name as string) || null,
    download_count: Number(row.download_count || 0),
    created_at: String(row.created_at || ''),
    updated_at: String(row.updated_at || ''),
    has_inline_preview: previewKind !== 'none',
    preview_kind: previewKind,
    preview_url: previewUrl,
    is_canva_template: isCanvaTeachingResource({
      source_url: (row.source_url as string) || null,
      file_type: String(row.file_type || ''),
      file_name: String(row.file_name || ''),
    }),
    open_url: teachingResourceOpenUrl({
      source_url: (row.source_url as string) || null,
      file_type: String(row.file_type || ''),
    }),
  }
}

export async function GET(request: NextRequest) {
  try {
    const actor = await getTeachingResourcesActor()
    if (actor.error) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: actor.error }, { status: actor.status })
      )
    }

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const tag = sanitizeTeachingSearch(searchParams.get('tag') || '')
    const search = sanitizeTeachingSearch(searchParams.get('search') || '')

    let query = supabaseAdmin
      .from('teaching_resources')
      .select(
        'id, title, description, category, file_name, file_size, file_type, preview_path, tags, tags_text, license_source, license_note, source_url, uploaded_by, uploaded_by_name, download_count, created_at, updated_at'
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (isTeachingResourceCategory(category)) {
      query = query.eq('category', category)
    }

    if (tag) {
      query = query.contains('tags', [tag.toLowerCase()])
    }

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,file_name.ilike.%${search}%,description.ilike.%${search}%,tags_text.ilike.%${search}%`
      )
    }

    const { data, error } = await query

    if (error) {
      console.error('Teaching resources fetch error:', error)
      const missing = /teaching_resources|schema cache|does not exist/i.test(error.message)
      return applyFileSecurityHeaders(
        NextResponse.json(
          {
            error: missing
              ? 'Teaching resources are not set up yet. Run migrations/create-teaching-resources-system.sql in Supabase.'
              : 'Failed to fetch teaching resources',
          },
          { status: 500 }
        )
      )
    }

    const resources = (data || []).map((row) => toPublicResource(row as Record<string, unknown>, null))

    return applyFileSecurityHeaders(
      NextResponse.json({
        resources,
      })
    )
  } catch (error) {
    console.error('Teaching resources fetch error:', error)
    return applyFileSecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
