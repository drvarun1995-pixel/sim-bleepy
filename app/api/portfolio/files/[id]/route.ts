import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: file, error } = await supabaseAdmin
      .from('portfolio_files')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single()

    if (error || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('IMT Portfolio')
      .download(file.file_path)

    if (downloadError) {
      console.error('Storage download error:', downloadError)
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
    }

    const fileBuffer = await fileData.arrayBuffer()

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': file.mime_type,
        'Content-Disposition': `attachment; filename="${file.original_filename}"`,
        'Content-Length': file.file_size.toString()
      }
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { category, subcategory, evidenceType, displayName, pmid, url, description } = await request.json()

    const ALLOWED_CATEGORIES = [
      'postgraduate',
      'presentations', 
      'publications',
      'teaching-experience',
      'training-in-teaching',
      'qi'
    ]

    if (category && !ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('portfolio_files')
      .update({
        category: category || undefined,
        subcategory: subcategory || undefined,
        evidence_type: evidenceType || undefined,
        display_name: displayName || undefined,
        pmid: pmid || undefined,
        url: url || undefined,
        description: description || undefined
      })
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: 'Failed to update file' }, { status: 500 })
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get file info first
    const { data: file, error: fetchError } = await supabaseAdmin
      .from('portfolio_files')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single()

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from('portfolio_files')
      .delete()
      .eq('id', params.id)
      .eq('user_id', session.user.id)

    if (deleteError) {
      console.error('Database delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete file from database' }, { status: 500 })
    }

    // Delete file from Supabase Storage
    try {
      const { error: storageDeleteError } = await supabaseAdmin.storage
        .from('IMT Portfolio')
        .remove([file.file_path])

      if (storageDeleteError) {
        console.error('Storage delete error:', storageDeleteError)
        // Continue even if storage deletion fails - database record is already deleted
      }
    } catch (storageError) {
      console.error('Storage delete error:', storageError)
      // Continue even if storage deletion fails - database record is already deleted
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
