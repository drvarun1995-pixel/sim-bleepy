import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import { requireTeachingPortfolioUser } from '@/lib/teaching-portfolio-access'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const access = await requireTeachingPortfolioUser()
    if (access.error) return access.error

    const kind = request.nextUrl.searchParams.get('kind')

    let query = supabaseAdmin
      .from('teaching_portfolio_files')
      .select('*')
      .eq('user_id', access.session.user.id)
      .order('activity_date', { ascending: true })
      .order('created_at', { ascending: true })

    if (kind === 'taught' || kind === 'learnt') {
      query = query.eq('entry_kind', kind)
    }

    const { data: files, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
    }

    return NextResponse.json({ files: files || [] }, { status: 200 })
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }
}
