import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiUsageTracker } from '@/lib/apiUsageTracker'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get real-time metrics
    const metrics = await apiUsageTracker.getRealtimeMetrics()

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Realtime usage API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch realtime metrics' },
      { status: 500 }
    )
  }
}
