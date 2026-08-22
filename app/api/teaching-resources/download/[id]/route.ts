import { NextRequest, NextResponse } from 'next/server'
import { getTeachingResourcesActor } from '@/lib/teaching-resources-server'
import { downloadFileName, TEACHING_RESOURCES_BUCKET } from '@/lib/teaching-resources'
import { applyFileSecurityHeaders, isSafeStoragePath } from '@/lib/secure-file-access'
import { isSignedStorageObjectReadable } from '@/lib/storage-object-readable'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actor = await getTeachingResourcesActor()
    if (actor.error) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: actor.error }, { status: actor.status })
      )
    }

    const { data: resource, error } = await supabaseAdmin
      .from('teaching_resources')
      .select('file_path, file_name, file_size, file_type, title, category, download_count, is_active')
      .eq('id', params.id)
      .single()

    if (error || !resource || resource.is_active === false) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Resource not found' }, { status: 404 })
      )
    }

    if (!resource.file_path || !isSafeStoragePath(resource.file_path)) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'File path missing' }, { status: 404 })
      )
    }

    const filename = downloadFileName(resource.file_name)
    const { data: signed, error: signedError } = await supabaseAdmin.storage
      .from(TEACHING_RESOURCES_BUCKET)
      .createSignedUrl(resource.file_path, 180, { download: filename })

    if (signedError || !signed?.signedUrl) {
      console.error('Teaching resource signed URL error:', signedError)
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Failed to prepare download' }, { status: 500 })
      )
    }

    const readable = await isSignedStorageObjectReadable(signed.signedUrl)
    if (!readable) {
      return applyFileSecurityHeaders(
        NextResponse.json(
          {
            error: 'This file is listed but missing from storage. Please re-upload it.',
            code: 'STORAGE_OBJECT_MISSING',
          },
          { status: 404 }
        )
      )
    }

    await supabaseAdmin
      .from('teaching_resources')
      .update({
        download_count: (resource.download_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    const { error: trackError } = await supabaseAdmin
      .from('teaching_resource_download_tracking')
      .insert({
        resource_id: params.id,
        resource_name: resource.title || resource.file_name,
        category: resource.category,
        user_id: actor.profile?.id || null,
        user_email: actor.profile?.email || null,
        user_name: actor.profile?.name || null,
        file_size: resource.file_size || null,
        file_type: resource.file_type || null,
      })

    if (trackError) {
      console.error('Teaching download tracking insert error:', trackError)
    }

    return applyFileSecurityHeaders(
      NextResponse.json({
        url: signed.signedUrl,
        filename,
      })
    )
  } catch (error) {
    console.error('Teaching resource download error:', error)
    return applyFileSecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
