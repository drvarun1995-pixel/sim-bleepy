import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import {
  canManageFoundationYear,
  fyPresentationalCohort,
  fyStorageCohort,
  isBasildonTopicSlug,
  isFyCohort,
  slugify,
  type FyCohort,
} from '@/lib/foundation-year'

function presentTopic<T extends { cohort: string; slug: string }>(topic: T) {
  return {
    ...topic,
    cohort: fyPresentationalCohort(topic.cohort, topic.slug),
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cohortParam = searchParams.get('cohort')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    if (cohortParam && !isFyCohort(cohortParam)) {
      return NextResponse.json({ error: 'Invalid cohort' }, { status: 400 })
    }

    const cohort = cohortParam as FyCohort | null
    const storageCohort = cohort ? fyStorageCohort(cohort) : null

    let query = supabaseAdmin
      .from('fy_topics')
      .select('*')
      .order('display_order', { ascending: true })

    if (storageCohort) {
      query = query.eq('cohort', storageCohort)
    }

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data: topics, error } = await query

    if (error) {
      console.error('Error fetching FY topics:', error)
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 })
    }

    let rows = topics || []
    if (cohort === 'basildon') {
      rows = rows.filter((t) => isBasildonTopicSlug(t.slug))
    } else if (cohort === 'fy1') {
      rows = rows.filter((t) => !isBasildonTopicSlug(t.slug))
    }

    return NextResponse.json({ topics: rows.map(presentTopic) })
  } catch (error) {
    console.error('Error in FY topics GET:', error)
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
    const { cohort, name, description, icon, display_order } = body

    if (!cohort || !isFyCohort(cohort)) {
      return NextResponse.json({ error: 'Valid cohort is required' }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (cohort === 'basildon') {
      // Basildon topics must use the reserved slugs so virtual-cohort filtering works.
      // Managers can still set the display name/description freely.
    }

    const storageCohort = fyStorageCohort(cohort)
    const baseSlug = slugify(name, 'topic')
    let slug = baseSlug
    let counter = 1

    while (true) {
      const { data: existing } = await supabaseAdmin
        .from('fy_topics')
        .select('id')
        .eq('cohort', storageCohort)
        .eq('slug', slug)
        .maybeSingle()

      if (!existing) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    if (cohort === 'basildon' && !isBasildonTopicSlug(slug)) {
      return NextResponse.json(
        {
          error:
            'Basildon-Only topics must use slugs trust-induction or local-systems (rename the topic accordingly).',
        },
        { status: 400 }
      )
    }

    const { data: topic, error } = await supabaseAdmin
      .from('fy_topics')
      .insert({
        cohort: storageCohort,
        name,
        slug,
        description: description || null,
        icon: icon || null,
        display_order: display_order || 0,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating FY topic:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ topic: presentTopic(topic) })
  } catch (error) {
    console.error('Error in FY topics POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
