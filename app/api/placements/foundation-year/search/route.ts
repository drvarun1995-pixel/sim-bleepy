import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { isFyCohort } from '@/lib/foundation-year'
import {
  rankFyPages,
  sanitizeFySearchQuery,
  type FySearchPageRow,
  type FySearchTopicRow,
} from '@/lib/fy-search'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = sanitizeFySearchQuery(searchParams.get('q') || '')
    const cohort = searchParams.get('cohort')
    const topicSlug = searchParams.get('topicSlug')
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 12), 1), 30)

    if (q.length < 2) {
      return NextResponse.json({ topics: [], pages: [] })
    }

    if (cohort && !isFyCohort(cohort)) {
      return NextResponse.json({ error: 'Invalid cohort' }, { status: 400 })
    }

    let topicsQuery = supabaseAdmin
      .from('fy_topics')
      .select('id, cohort, name, slug, description')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (cohort) topicsQuery = topicsQuery.eq('cohort', cohort)
    if (topicSlug) topicsQuery = topicsQuery.eq('slug', topicSlug)

    const { data: topicsRaw, error: topicsError } = await topicsQuery
    if (topicsError) {
      console.error('FY search topics error:', topicsError)
      return NextResponse.json({ error: 'Failed to search topics' }, { status: 500 })
    }

    const allTopics = (topicsRaw || []) as FySearchTopicRow[]
    const qLower = q.toLowerCase()
    const topics = allTopics
      .filter((t) => {
        const name = (t.name || '').toLowerCase()
        const description = (t.description || '').toLowerCase()
        return name.includes(qLower) || description.includes(qLower)
      })
      .slice(0, limit)

    const topicIds = allTopics.map((t) => t.id)
    if (topicIds.length === 0) {
      return NextResponse.json({ topics, pages: [] })
    }

    const topicById = new Map(allTopics.map((t) => [t.id, t]))

    // Prefer meta_description when the column exists; fall back if the schema lacks it.
    let pagesRaw: FySearchPageRow[] | null = null
    {
      const withMeta = await supabaseAdmin
        .from('fy_pages')
        .select('id, title, slug, featured_image, updated_at, topic_id, meta_description')
        .eq('is_active', true)
        .eq('status', 'published')
        .in('topic_id', topicIds)
        .order('updated_at', { ascending: false })
        .limit(500)

      if (withMeta.error?.message?.includes('meta_description')) {
        const withoutMeta = await supabaseAdmin
          .from('fy_pages')
          .select('id, title, slug, featured_image, updated_at, topic_id')
          .eq('is_active', true)
          .eq('status', 'published')
          .in('topic_id', topicIds)
          .order('updated_at', { ascending: false })
          .limit(500)

        if (withoutMeta.error) {
          console.error('FY search pages error:', withoutMeta.error)
          return NextResponse.json({ error: 'Failed to search pages' }, { status: 500 })
        }
        pagesRaw = (withoutMeta.data || []) as FySearchPageRow[]
      } else if (withMeta.error) {
        console.error('FY search pages error:', withMeta.error)
        return NextResponse.json({ error: 'Failed to search pages' }, { status: 500 })
      } else {
        pagesRaw = (withMeta.data || []) as FySearchPageRow[]
      }
    }

    const ranked = rankFyPages(pagesRaw || [], topicById, q, limit)

    const pages = ranked
      .map((row) => {
        const topic = topicById.get(row.topic_id)
        if (!topic) return null
        return {
          id: row.id,
          title: row.title,
          slug: row.slug,
          featuredImage: row.featured_image || null,
          updatedAt: row.updated_at || null,
          cohort: topic.cohort,
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
