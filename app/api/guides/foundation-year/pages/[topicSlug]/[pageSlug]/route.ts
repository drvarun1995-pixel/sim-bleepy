import { NextRequest, NextResponse } from 'next/server'
import { getPublicFyPage } from '@/lib/fy-public-guides'

export const dynamic = 'force-dynamic'

/** Public: single published guide article (general cohort, not members-only). */
export async function GET(
  _request: NextRequest,
  { params }: { params: { topicSlug: string; pageSlug: string } }
) {
  try {
    const page = await getPublicFyPage(params.topicSlug, params.pageSlug)
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }
    return NextResponse.json({ page, topic: page.topic })
  } catch (error) {
    console.error('Public FY page error:', error)
    return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 })
  }
}
