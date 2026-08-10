import { NextRequest, NextResponse } from 'next/server'
import {
  getPublicFyTopicBySlug,
  listAllPublicFyPages,
  listPublicFyPagesForTopicSlug,
} from '@/lib/fy-public-guides'

export const dynamic = 'force-dynamic'

/**
 * Public: list published, non-members-only FY pages for general cohort.
 * ?topicSlug=working-on-calls — pages for one topic
 * (omit) — all public pages across topics
 */
export async function GET(request: NextRequest) {
  try {
    const topicSlug = new URL(request.url).searchParams.get('topicSlug')

    if (topicSlug) {
      const topic = await getPublicFyTopicBySlug(topicSlug)
      if (!topic) {
        return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
      }
      const pages = await listPublicFyPagesForTopicSlug(topicSlug)
      return NextResponse.json({ topic, pages })
    }

    const pages = await listAllPublicFyPages()
    return NextResponse.json({ pages })
  } catch (error) {
    console.error('Public FY pages error:', error)
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 })
  }
}
