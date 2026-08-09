import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { NextRequest, NextResponse } from 'next/server'
import {
  applyFileSecurityHeaders,
  hasDownloadUnlock,
  isStaffRole,
  withFileSecurityHeaders,
} from '@/lib/secure-file-access'

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    zip: 'application/zip',
  }
  return mimeTypes[ext || ''] || 'application/octet-stream'
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

    const unlocked =
      isStaffRole(user?.role) || (await hasDownloadUnlock(session.user.email))
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
      .select('file_path, views, file_name, file_type, is_active')
      .eq('id', id)
      .single()

    if (error || !resource || resource.is_active === false) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Resource not found' }, { status: 404 })
      )
    }

    if (!resource.file_path) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'File path missing' }, { status: 404 })
      )
    }

    await supabaseAdmin
      .from('resources')
      .update({ views: (resource.views || 0) + 1 })
      .eq('id', id)

    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('resources')
      .download(resource.file_path)

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError)
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
      )
    }

    const contentType = resource.file_type || getMimeType(resource.file_name)
    const arrayBuffer = await fileData.arrayBuffer()

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: withFileSecurityHeaders(undefined, {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(resource.file_name)}"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
      }),
    })
  } catch (error) {
    console.error('Download error:', error)
    return applyFileSecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
