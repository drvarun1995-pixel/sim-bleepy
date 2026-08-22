import { NextRequest, NextResponse } from 'next/server'
import { getTeachingResourcesActor } from '@/lib/teaching-resources-server'
import {
  previewKindFromFile,
  TEACHING_RESOURCES_BUCKET,
} from '@/lib/teaching-resources'
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
      .select('file_path, file_name, file_type, preview_path, is_active')
      .eq('id', params.id)
      .single()

    if (error || !resource || resource.is_active === false) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Resource not found' }, { status: 404 })
      )
    }

    const kind = previewKindFromFile(
      resource.file_name,
      resource.file_type,
      !!resource.preview_path
    )

    const storagePath =
      kind === 'thumbnail' || (kind === 'none' && resource.preview_path)
        ? resource.preview_path
        : kind === 'none'
          ? null
          : resource.file_path

    if (!storagePath || !isSafeStoragePath(storagePath)) {
      return applyFileSecurityHeaders(
        NextResponse.json(
          { error: 'No preview available', code: 'NO_PREVIEW', kind: 'none' },
          { status: 404 }
        )
      )
    }

    const { data: signed, error: signedError } = await supabaseAdmin.storage
      .from(TEACHING_RESOURCES_BUCKET)
      .createSignedUrl(storagePath, 180)

    if (signedError || !signed?.signedUrl) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Failed to prepare preview' }, { status: 500 })
      )
    }

    const readable = await isSignedStorageObjectReadable(signed.signedUrl)
    if (!readable) {
      return applyFileSecurityHeaders(
        NextResponse.json(
          { error: 'Preview file is missing', code: 'NO_PREVIEW', kind: 'none' },
          { status: 404 }
        )
      )
    }

    return applyFileSecurityHeaders(
      NextResponse.json({
        url: signed.signedUrl,
        kind: kind === 'none' ? 'thumbnail' : kind,
        filename: resource.file_name,
        mime: resource.file_type,
      })
    )
  } catch (error) {
    console.error('Teaching resource preview error:', error)
    return applyFileSecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
