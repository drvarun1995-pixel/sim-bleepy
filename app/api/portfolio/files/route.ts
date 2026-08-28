import { NextRequest, NextResponse } from 'next/server'
import { requirePersonalPortfolioUser } from '@/lib/portfolio-access'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const access = await requirePersonalPortfolioUser('IMT Portfolio')
    if (access.error) return access.error
    const session = access.session

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let query = supabaseAdmin
      .from('portfolio_files')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data: files, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
    }

    return NextResponse.json({ files }, { status: 200 })

  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }
}
