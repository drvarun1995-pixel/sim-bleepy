import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // List files in template-images folder
    const { data: files, error } = await supabase.storage
      .from('certificates')
      .list('template-images', {
        limit: 100
      })

    if (error) {
      console.error('Storage list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      files: files || [],
      count: files?.length || 0
    })

  } catch (error) {
    console.error('Test storage error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

