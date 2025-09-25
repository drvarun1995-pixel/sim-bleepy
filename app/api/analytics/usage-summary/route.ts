import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiUsageTracker } from '@/lib/apiUsageTracker'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const sessionId = searchParams.get('session_id')

    // Get usage summary
    const summary = await apiUsageTracker.getUsageSummary(
      startDate || undefined,
      endDate || undefined,
      sessionId || undefined
    )

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Usage summary API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage summary' },
      { status: 500 }
    )
  }
}
