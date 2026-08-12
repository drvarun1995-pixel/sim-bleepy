import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import { isMembersOnlyFyPage } from '@/lib/fy-blog-access'
import { PUBLIC_FY_COHORTS } from '@/lib/foundation-year'
import {
  rankFyPages,
  sanitizeFySearchQuery,
  type FySearchPageRow,
  type FySearchTopicRow,
} from '@/lib/fy-search'

/** Public search over published, non-members-only Foundation Year guides. */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = sanitizeFySearchQuery(searchParams.get('q') || '')
    const topicSlug = searchParams.get('topicSlug')
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 12), 1), 30)

    if (q.length < 2) {
      return NextResponse.json({ topics: [], pages: [] })
    }

    let topicsQuery = supabaseAdmin
      .from('fy_topics')
      .select('id, cohort, name, slug, description')
      .eq('is_active', true)
      .in('cohort', [...PUBLIC_FY_COHORTS])
      .order('display_order', { ascending: true })

    if (topicSlug) topicsQuery = topicsQuery.eq('slug', topicSlug)

    const { data: topicsRaw, error: topicsError } = await topicsQuery
    if (topicsError) {
      console.error('Public FY search topics error:', topicsError)
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
        .select(
          'id, title, slug, featured_image, updated_at, topic_id, requires_auth, status, is_active, meta_description'
        )
        .eq('is_active', true)
        .eq('status', 'published')
        .in('topic_id', topicIds)
        .order('updated_at', { ascending: false })
        .limit(500)

      if (withMeta.error?.message?.includes('meta_description')) {
        const withoutMeta = await supabaseAdmin
          .from('fy_pages')
          .select(
            'id, title, slug, featured_image, updated_at, topic_id, requires_auth, status, is_active'
          )
          .eq('is_active', true)
          .eq('status', 'published')
          .in('topic_id', topicIds)
          .order('updated_at', { ascending: false })
          .limit(500)

        if (withoutMeta.error) {
          console.error('Public FY search pages error:', withoutMeta.error)
          return NextResponse.json({ error: 'Failed to search pages' }, { status: 500 })
        }
        pagesRaw = (withoutMeta.data || []) as FySearchPageRow[]
      } else if (withMeta.error) {
        console.error('Public FY search pages error:', withMeta.error)
        return NextResponse.json({ error: 'Failed to search pages' }, { status: 500 })
      } else {
        pagesRaw = (withMeta.data || []) as FySearchPageRow[]
      }
    }

    const publicPages = (pagesRaw || []).filter((row) => !isMembersOnlyFyPage(row))
    const ranked = rankFyPages(publicPages, topicById, q, limit)

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
    console.error('Public FY search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
