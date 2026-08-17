import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { NextRequest, NextResponse } from 'next/server'
import {
  applyFileSecurityHeaders,
  hasDownloadUnlock,
  isSafeStoragePath,
  isStaffRole,
} from '@/lib/secure-file-access'
import { isSignedStorageObjectReadable } from '@/lib/storage-object-readable'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function downloadFileName(name: string) {
  return name.replace(/[\r\n"]/g, '_').slice(0, 180) || 'download'
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    const role = user?.role || (session.user as { role?: string }).role
    const unlocked =
      isStaffRole(role) || (await hasDownloadUnlock(session.user.email))
    if (!unlocked) {
      return applyFileSecurityHeaders(
        NextResponse.json(
          { error: 'Download password required', code: 'DOWNLOAD_PASSWORD_REQUIRED' },
          { status: 403 }
        )
      )
    }

    const { id } = params

    const { data: resource, error } = await supabaseAdmin
      .from('resources')
      .select('file_path, views, file_name, is_active')
      .eq('id', id)
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
      .from('resources')
      .createSignedUrl(resource.file_path, 180, { download: filename })

    if (signedError || !signed?.signedUrl) {
      console.error('Signed URL error:', {
        id,
        filePath: resource.file_path,
        message: signedError?.message,
      })
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Failed to prepare download' }, { status: 500 })
      )
    }

    const readable = await isSignedStorageObjectReadable(signed.signedUrl)
    if (!readable) {
      console.error('Storage object missing:', {
        id,
        filePath: resource.file_path,
      })
      return applyFileSecurityHeaders(
        NextResponse.json(
          {
            error:
              'This file is listed in the library but the original is missing from storage. Please re-upload it.',
            code: 'STORAGE_OBJECT_MISSING',
          },
          { status: 404 }
        )
      )
    }

    await supabaseAdmin
      .from('resources')
      .update({ views: (resource.views || 0) + 1 })
      .eq('id', id)

    return applyFileSecurityHeaders(
      NextResponse.json({
        url: signed.signedUrl,
        filename,
      })
    )
  } catch (error) {
    console.error('Download error:', error)
    return applyFileSecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
