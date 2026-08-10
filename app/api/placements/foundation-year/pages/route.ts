import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { canManageFoundationYear, isFyCohort, slugify } from '@/lib/foundation-year'
import { resolveRequiresAuth } from '@/lib/fy-blog-access'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const topicId = searchParams.get('topicId')
    const topicSlug = searchParams.get('topicSlug')
    const cohort = searchParams.get('cohort')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    let resolvedTopicId = topicId

    if (topicSlug && cohort && !topicId) {
      if (!isFyCohort(cohort)) {
        return NextResponse.json({ error: 'Invalid cohort' }, { status: 400 })
      }

      const { data: topic } = await supabaseAdmin
        .from('fy_topics')
        .select('id')
        .eq('cohort', cohort)
        .eq('slug', topicSlug)
        .maybeSingle()

      if (!topic) {
        return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
      }

      resolvedTopicId = topic.id
    }

    if (!resolvedTopicId) {
      return NextResponse.json(
        { error: 'topicId or topicSlug+cohort is required' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('fy_pages')
      .select('*')
      .eq('topic_id', resolvedTopicId)
      .order('display_order', { ascending: true })

    if (!includeInactive) {
      query = query.eq('is_active', true).eq('status', 'published')
    }

    const { data: pages, error } = await query

    if (error) {
      console.error('Error fetching FY pages:', error)
      return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 })
    }

    return NextResponse.json({ pages: pages || [] })
  } catch (error) {
    console.error('Error in FY pages GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (!user || !canManageFoundationYear(user.role)) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { topic_id, title, content, display_order, featured_image, status, requires_auth } =
      body

    if (!topic_id || !title) {
      return NextResponse.json({ error: 'topic_id and title are required' }, { status: 400 })
    }

    const baseSlug = slugify(title, 'page')
    let finalSlug = baseSlug
    let counter = 1

    while (true) {
      const { data: existing } = await supabaseAdmin
        .from('fy_pages')
        .select('id')
        .eq('topic_id', topic_id)
        .eq('slug', finalSlug)
        .maybeSingle()

      if (!existing) break
      finalSlug = `${baseSlug}-${counter}`
      counter++
    }

    const requiresAuth = resolveRequiresAuth({
      slug: finalSlug,
      // Omit / null → members-only (default). Explicit false → public.
      requires_auth: typeof requires_auth === 'boolean' ? requires_auth : true,
    })

    const payload: Record<string, unknown> = {
      topic_id,
      title,
      slug: finalSlug,
      content: content || null,
      display_order: display_order || 0,
      is_active: true,
      created_by: user.id,
      featured_image: featured_image || null,
      status: status || 'draft',
      requires_auth: requiresAuth,
    }

    let { data: page, error } = await supabaseAdmin
      .from('fy_pages')
      .insert(payload)
      .select()
      .single()

    if (error?.message?.includes('requires_auth')) {
      delete payload.requires_auth
      ;({ data: page, error } = await supabaseAdmin
        .from('fy_pages')
        .insert(payload)
        .select()
        .single())
    }

    if (error) {
      console.error('Error creating FY page:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ page })
  } catch (error) {
    console.error('Error in FY pages POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
