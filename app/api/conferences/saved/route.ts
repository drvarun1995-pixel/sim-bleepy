import { NextResponse } from 'next/server'
import { getConferenceSessionUser } from '@/lib/conferences-auth'
import { listSavedOpportunities } from '@/lib/conferences-db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getConferenceSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const opportunities = await listSavedOpportunities(user.id)
    return NextResponse.json({ opportunities })
  } catch (error) {
    console.error('GET /api/conferences/saved', error)
    return NextResponse.json({ error: 'Failed to load saved conferences' }, { status: 500 })
  }
}
