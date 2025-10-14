import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: formats, error } = await supabase
      .from('formats')
      .select('id, name')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching formats:', error)
      return NextResponse.json({ error: 'Failed to fetch formats' }, { status: 500 })
    }

    return NextResponse.json({ formats: formats || [] })

  } catch (error) {
    console.error('Error in formats API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

