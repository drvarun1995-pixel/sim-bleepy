import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileId, action } = await request.json()

    if (!fileId || !action) {
      return NextResponse.json({ error: 'Missing fileId or action' }, { status: 400 })
    }

    // Get the file record
    const { data: file, error: fetchError } = await supabaseAdmin
      .from('portfolio_files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', session.user.id)
      .single()

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    if (action === 'delete_from_db') {
      // Delete the database record for orphaned files
      const { error: deleteError } = await supabaseAdmin
        .from('portfolio_files')
        .delete()
        .eq('id', fileId)
        .eq('user_id', session.user.id)

      if (deleteError) {
        console.error('Delete error:', deleteError)
        return NextResponse.json({ error: 'Failed to delete file record', details: deleteError.message }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'File record deleted successfully',
        deleted_file: {
          id: file.id,
          filename: file.original_filename,
          category: file.category
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Fix storage error:', error)
    return NextResponse.json({ error: 'Fix failed', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
