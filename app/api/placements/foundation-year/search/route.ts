import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import {
  fyPresentationalCohort,
  fyStorageCohort,
  isBasildonTopicSlug,
  isFyCohort,
  type FyCohort,
} from '@/lib/foundation-year'

function sanitizeQuery(raw: string) {
  return raw.trim().slice(0, 80).replace(/[%_,]/g, ' ')
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = sanitizeQuery(searchParams.get('q') || '')
    const cohort = searchParams.get('cohort')
    const topicSlug = searchParams.get('topicSlug')
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 12), 1), 30)

    if (q.length < 2) {
      return NextResponse.json({ topics: [], pages: [] })
    }

    if (cohort && !isFyCohort(cohort)) {
      return NextResponse.json({ error: 'Invalid cohort' }, { status: 400 })
    }

    const cohortFilter = cohort as FyCohort | null
    const storageCohort = cohortFilter ? fyStorageCohort(cohortFilter) : null

    let topicsQuery = supabaseAdmin
      .from('fy_topics')
      .select('id, cohort, name, slug, description')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (storageCohort) topicsQuery = topicsQuery.eq('cohort', storageCohort)
    if (topicSlug) topicsQuery = topicsQuery.eq('slug', topicSlug)

    const { data: topicsRaw, error: topicsError } = await topicsQuery
    if (topicsError) {
      console.error('FY search topics error:', topicsError)
      return NextResponse.json({ error: 'Failed to search topics' }, { status: 500 })
    }

    let allTopics = (topicsRaw || []).filter((t) => {
      if (cohortFilter === 'basildon') return isBasildonTopicSlug(t.slug)
      if (cohortFilter === 'fy1') return !isBasildonTopicSlug(t.slug)
      return true
    })
    const qLower = q.toLowerCase()
    const topics = allTopics
      .filter((t) => {
        const name = (t.name || '').toLowerCase()
        const description = (t.description || '').toLowerCase()
        return name.includes(qLower) || description.includes(qLower)
      })
      .slice(0, limit)
      .map((t) => ({
        ...t,
        cohort: fyPresentationalCohort(t.cohort, t.slug),
      }))

    const topicIds = allTopics.map((t) => t.id)
    if (topicIds.length === 0) {
      return NextResponse.json({ topics, pages: [] })
    }

    const topicById = new Map(allTopics.map((t) => [t.id, t]))

    const { data: pagesRaw, error: pagesError } = await supabaseAdmin
      .from('fy_pages')
      .select('id, title, slug, featured_image, updated_at, topic_id')
      .eq('is_active', true)
      .eq('status', 'published')
      .in('topic_id', topicIds)
      .ilike('title', `%${q}%`)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (pagesError) {
      console.error('FY search pages error:', pagesError)
      return NextResponse.json({ error: 'Failed to search pages' }, { status: 500 })
    }

    const pages = (pagesRaw || [])
      .map((row) => {
        const topic = topicById.get(row.topic_id)
        if (!topic) return null
        return {
          id: row.id,
          title: row.title,
          slug: row.slug,
          featuredImage: row.featured_image || null,
          updatedAt: row.updated_at || null,
          cohort: fyPresentationalCohort(topic.cohort, topic.slug),
          topicSlug: topic.slug,
          topicName: topic.name,
        }
      })
      .filter(Boolean)

    return NextResponse.json({ topics, pages })
  } catch (error) {
    console.error('FY search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
