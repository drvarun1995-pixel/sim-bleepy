import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import { requireSimulationFellowshipUser } from '@/lib/simulation-fellowship-access'
import { SIMULATION_FELLOWSHIP_STORAGE_BUCKET } from '@/lib/simulation-fellowship'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const access = await requireSimulationFellowshipUser()
    if (access.error) return access.error

    const { data: file, error } = await supabaseAdmin
      .from('simulation_fellowship_files')
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
      .from(SIMULATION_FELLOWSHIP_STORAGE_BUCKET)
      .download(file.file_path)

    if (downloadError || !fileData) {
      console.error('Simulation fellowship download error:', downloadError)
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
    console.error('Simulation fellowship download error:', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const access = await requireSimulationFellowshipUser()
    if (access.error) return access.error

    const { data: file, error: fetchError } = await supabaseAdmin
      .from('simulation_fellowship_files')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', access.session.user.id)
      .single()

    if (fetchError || !file) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const { error: deleteError } = await supabaseAdmin
      .from('simulation_fellowship_files')
      .delete()
      .eq('id', params.id)
      .eq('user_id', access.session.user.id)

    if (deleteError) {
      console.error('Simulation fellowship delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 })
    }

    if (file.file_path) {
      try {
        const { error: storageDeleteError } = await supabaseAdmin.storage
          .from(SIMULATION_FELLOWSHIP_STORAGE_BUCKET)
          .remove([file.file_path])
        if (storageDeleteError) {
          console.error('Simulation fellowship storage delete error:', storageDeleteError)
        }
      } catch (storageError) {
        console.error('Simulation fellowship storage delete error:', storageError)
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Simulation fellowship delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
