import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import { requireTeachingPortfolioUser } from '@/lib/teaching-portfolio-access'
import {
  LEARNING_TYPE_OPTIONS,
  TAUGHT_TO_OPTIONS,
} from '@/lib/teaching-portfolio'

export const dynamic = 'force-dynamic'

const TAUGHT_TO = new Set(TAUGHT_TO_OPTIONS.map((opt) => opt.value))
const LEARNING_TYPES = new Set(LEARNING_TYPE_OPTIONS.map((opt) => opt.value))

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const access = await requireTeachingPortfolioUser()
    if (access.error) return access.error

    const { data: file, error } = await supabaseAdmin
      .from('teaching_portfolio_files')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', access.session.user.id)
      .single()

    if (error || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    if (!file.file_path) {
      return NextResponse.json({ error: 'No evidence uploaded' }, { status: 404 })
    }

    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('teaching-portfolio')
      .download(file.file_path)

    if (downloadError) {
      console.error('Storage download error:', downloadError)
      return NextResponse.json(
        { error: 'Failed to download file from storage', details: downloadError.message },
        { status: 500 }
      )
    }

    if (!fileData) {
      return NextResponse.json({ error: 'No file data returned from storage' }, { status: 500 })
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
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const access = await requireTeachingPortfolioUser()
    if (access.error) return access.error

    const body = await request.json()
    const sessionTitle = typeof body.sessionTitle === 'string' ? body.sessionTitle.trim() : ''
    const activityDate = typeof body.activityDate === 'string' ? body.activityDate.trim() : ''
    const sessionTime = typeof body.sessionTime === 'string' ? body.sessionTime.trim() : ''
    const taughtTo = typeof body.taughtTo === 'string' ? body.taughtTo.trim() : ''
    const learningType = typeof body.learningType === 'string' ? body.learningType.trim() : ''
    const provider = typeof body.provider === 'string' ? body.provider.trim() : ''
    const entryKind = body.entryKind === 'learnt' ? 'learnt' : body.entryKind === 'taught' ? 'taught' : null

    if (!sessionTitle) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!activityDate) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }
    if (entryKind === 'taught' && taughtTo && !TAUGHT_TO.has(taughtTo)) {
      return NextResponse.json({ error: 'Invalid taught to value' }, { status: 400 })
    }
    if (entryKind === 'learnt' && learningType && !LEARNING_TYPES.has(learningType)) {
      return NextResponse.json({ error: 'Invalid learning type' }, { status: 400 })
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('teaching_portfolio_files')
      .select('entry_kind')
      .eq('id', params.id)
      .eq('user_id', access.session.user.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const kind = entryKind || (existing.entry_kind === 'learnt' ? 'learnt' : 'taught')

    const updateData: Record<string, string | null> = {
      session_title: sessionTitle,
      display_name: sessionTitle,
      activity_date: activityDate,
      session_time: sessionTime || null,
      updated_at: new Date().toISOString(),
    }

    if (kind === 'taught') {
      updateData.taught_to = taughtTo || null
    } else {
      updateData.learning_type = learningType || null
      updateData.provider = provider || null
    }

    const { data, error } = await supabaseAdmin
      .from('teaching_portfolio_files')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', access.session.user.id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 })
    }

    return NextResponse.json({ success: true, file: data }, { status: 200 })
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const access = await requireTeachingPortfolioUser()
    if (access.error) return access.error

    const { data: file, error: fetchError } = await supabaseAdmin
      .from('teaching_portfolio_files')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', access.session.user.id)
      .single()

    if (fetchError || !file) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const { error: deleteError } = await supabaseAdmin
      .from('teaching_portfolio_files')
      .delete()
      .eq('id', params.id)
      .eq('user_id', access.session.user.id)

    if (deleteError) {
      console.error('Database delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 })
    }

    if (file.file_path) {
      try {
        const { error: storageDeleteError } = await supabaseAdmin.storage
          .from('teaching-portfolio')
          .remove([file.file_path])
        if (storageDeleteError) {
          console.error('Storage delete error:', storageDeleteError)
        }
      } catch (storageError) {
        console.error('Storage delete error:', storageError)
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
