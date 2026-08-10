import { NextResponse } from 'next/server'
import { listPublicFyTopics } from '@/lib/fy-public-guides'

export const dynamic = 'force-dynamic'

/** Public: list active general-cohort FY topics (no auth). */
export async function GET() {
  try {
    const topics = await listPublicFyTopics()
    return NextResponse.json({ topics })
  } catch (error) {
    console.error('Public FY topics error:', error)
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 })
  }
}
