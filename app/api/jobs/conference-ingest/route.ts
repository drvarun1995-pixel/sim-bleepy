import { NextRequest, NextResponse } from 'next/server'
import { runAllConferenceIngest } from '@/lib/conferences/ingest/run'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

function authorize(request: NextRequest): boolean {
  const cronSecret = (process.env.CRON_SECRET || process.env.INTERNAL_CRON_SECRET)?.trim()
  if (!cronSecret) return false
  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${cronSecret}`) return true
  const secretParam = request.nextUrl.searchParams.get('secret')?.trim()
  return secretParam === cronSecret
}

export async function POST(request: NextRequest) {
  try {
    if (!authorize(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const result = await runAllConferenceIngest()
    const failed = result.results.filter((item) => !item.ok)
    return NextResponse.json({ success: failed.length === 0, ...result })
  } catch (error) {
    console.error('conference-ingest cron failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
