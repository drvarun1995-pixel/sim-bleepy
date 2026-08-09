import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const pageId = typeof body.pageId === 'string' ? body.pageId : ''
    const helpful = body.helpful === true || body.helpful === false ? body.helpful : null
    const comment =
      typeof body.comment === 'string' ? body.comment.trim().slice(0, 1000) : null

    if (!pageId || helpful === null) {
      return NextResponse.json(
        { error: 'pageId and helpful (boolean) are required' },
        { status: 400 }
      )
    }

    const { data: page } = await supabaseAdmin
      .from('fy_pages')
      .select('id')
      .eq('id', pageId)
      .maybeSingle()

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const { data: existing } = await supabaseAdmin
      .from('fy_page_feedback')
      .select('id')
      .eq('page_id', pageId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      const { error } = await supabaseAdmin
        .from('fy_page_feedback')
        .update({
          helpful,
          comment: comment || null,
        })
        .eq('id', existing.id)

      if (error) {
        console.error('FY feedback update error:', error)
        return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
      }

      return NextResponse.json({ ok: true, updated: true })
    }

    const { error } = await supabaseAdmin.from('fy_page_feedback').insert({
      page_id: pageId,
      user_id: user.id,
      helpful,
      comment: comment || null,
    })

    if (error) {
      console.error('FY feedback insert error:', error)
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, updated: false })
  } catch (error) {
    console.error('FY feedback POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
