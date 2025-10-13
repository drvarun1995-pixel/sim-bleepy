import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all files for the user
    const { data: files, error } = await supabaseAdmin
      .from('portfolio_files')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database query error:', error)
      return NextResponse.json({ error: 'Failed to fetch files', details: error.message }, { status: 500 })
    }

    // Check storage bucket contents
    const { data: bucketContents, error: bucketError } = await supabaseAdmin.storage
      .from('imt-portfolio')
      .list('', {
        limit: 1000,
        offset: 0
      })

    if (bucketError) {
      console.error('Bucket listing error:', bucketError)
    }

    // For each file, check if it exists in storage
    const fileStatuses = files.map(file => {
      const fileExists = bucketContents?.some(item => 
        item.name === file.file_path || 
        (file.file_path && item.name.includes(file.file_path.split('/').pop() || ''))
      )
      
      return {
        id: file.id,
        filename: file.original_filename,
        file_path: file.file_path,
        exists_in_storage: fileExists,
        category: file.category,
        subcategory: file.subcategory,
        created_at: file.created_at
      }
    })

    return NextResponse.json({
      user_id: session.user.id,
      total_files: files.length,
      files: fileStatuses,
      bucket_contents_count: bucketContents?.length || 0,
      sample_bucket_contents: bucketContents?.slice(0, 5) || []
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
