import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import { requireTeachingPortfolioUser } from '@/lib/teaching-portfolio-access'
import {
  evidenceFromEntry,
  findEvidenceForUser,
  removeStoragePaths,
  replaceEntryEvidence,
} from '@/lib/teaching-portfolio-server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const access = await requireTeachingPortfolioUser()
    if (access.error) return access.error

    const found = await findEvidenceForUser(access.session.user.id, params.id)
    if (!found) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const { file } = found
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('teaching-portfolio')
      .download(file.file_path)

    if (downloadError || !fileData) {
      console.error('Storage download error:', downloadError)
      return NextResponse.json({ error: 'Failed to download file from storage' }, { status: 500 })
    }

    const fileBuffer = await fileData.arrayBuffer()
    const encodedFilename = encodeURIComponent(file.original_filename || 'download')
    const safeFilename = file.original_filename?.replace(/[^\x00-\x7F]/g, '_') || 'download'
    const inline = request.nextUrl.searchParams.get('inline') === '1'
    const disposition = inline ? 'inline' : 'attachment'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': file.mime_type || 'application/octet-stream',
        'Content-Disposition': `${disposition}; filename*=UTF-8''${encodedFilename}; filename="${safeFilename}"`,
        'Content-Length': file.file_size?.toString() || String(fileBuffer.byteLength),
      },
    })
  } catch (error) {
    console.error('Evidence download error:', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const access = await requireTeachingPortfolioUser()
    if (access.error) return access.error

    const found = await findEvidenceForUser(access.session.user.id, params.id)
    if (!found) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const remaining = evidenceFromEntry(found.entry).filter((row) => row.id !== params.id)
    await replaceEntryEvidence({
      entryId: found.entry.id,
      userId: access.session.user.id,
      files: remaining,
    })
    await removeStoragePaths([found.file.file_path])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Evidence delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
