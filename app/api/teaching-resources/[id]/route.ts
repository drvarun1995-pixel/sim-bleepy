import { NextRequest, NextResponse } from 'next/server'
import {
  canEditTeachingResource,
  getTeachingResourcesActor,
} from '@/lib/teaching-resources-server'
import {
  isTeachingResourceCategory,
  parseTeachingTags,
  TEACHING_RESOURCES_BUCKET,
} from '@/lib/teaching-resources'
import { applyFileSecurityHeaders, isSafeStoragePath } from '@/lib/secure-file-access'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actor = await getTeachingResourcesActor()
    if (actor.error || !actor.profile) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: actor.error || 'Unauthorized' }, { status: actor.status || 401 })
      )
    }

    const { data: resource, error: fetchError } = await supabaseAdmin
      .from('teaching_resources')
      .select('id, uploaded_by')
      .eq('id', params.id)
      .single()

    if (fetchError || !resource) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Resource not found' }, { status: 404 })
      )
    }

    if (!canEditTeachingResource(actor.profile.role, resource.uploaded_by, actor.profile.id)) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'You can only edit your own uploads' }, { status: 403 })
      )
    }

    const body = await request.json()
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof body.title === 'string' && body.title.trim()) {
      updates.title = body.title.trim()
    }
    if (typeof body.description === 'string') {
      updates.description = body.description.trim() || null
    }
    if (isTeachingResourceCategory(body.category)) {
      updates.category = body.category
    }
    if (body.tags !== undefined) {
      const nextTags = parseTeachingTags(body.tags)
      updates.tags = nextTags
      updates.tags_text = nextTags.join(' ')
    }
    if (typeof body.licenseSource === 'string' && body.licenseSource.trim()) {
      updates.license_source = body.licenseSource.trim()
    }
    if (typeof body.licenseNote === 'string' && body.licenseNote.trim()) {
      updates.license_note = body.licenseNote.trim()
    }
    if (typeof body.sourceUrl === 'string') {
      updates.source_url = body.sourceUrl.trim() || null
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('teaching_resources')
      .update(updates)
      .eq('id', params.id)
      .select('id, title, category, tags')
      .single()

    if (updateError) {
      console.error('Teaching resource update error:', updateError)
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Failed to update resource' }, { status: 500 })
      )
    }

    return applyFileSecurityHeaders(NextResponse.json({ success: true, resource: updated }))
  } catch (error) {
    console.error('Teaching resource update error:', error)
    return applyFileSecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actor = await getTeachingResourcesActor()
    if (actor.error || !actor.profile) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: actor.error || 'Unauthorized' }, { status: 401 })
      )
    }

    const { data: resource, error: fetchError } = await supabaseAdmin
      .from('teaching_resources')
      .select('file_path, preview_path, uploaded_by')
      .eq('id', params.id)
      .single()

    if (fetchError || !resource) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Resource not found' }, { status: 404 })
      )
    }

    if (!canEditTeachingResource(actor.profile.role, resource.uploaded_by, actor.profile.id)) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'You can only delete your own uploads' }, { status: 403 })
      )
    }

    const paths = [resource.file_path, resource.preview_path].filter(
      (path): path is string => !!path && isSafeStoragePath(path)
    )
    if (paths.length) {
      await supabaseAdmin.storage.from(TEACHING_RESOURCES_BUCKET).remove(paths)
    }

    const { error: deleteError } = await supabaseAdmin
      .from('teaching_resources')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Teaching resource delete error:', deleteError)
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 })
      )
    }

    return applyFileSecurityHeaders(
      NextResponse.json({ success: true, message: 'Resource deleted successfully' })
    )
  } catch (error) {
    console.error('Teaching resource delete error:', error)
    return applyFileSecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
