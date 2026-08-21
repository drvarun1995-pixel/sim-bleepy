import { NextRequest, NextResponse } from 'next/server'
import { sendDueVerificationReminders } from '@/lib/email-verification-reminders'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function authorize(request: NextRequest): boolean {
  const cronSecret = (process.env.CRON_SECRET || process.env.INTERNAL_CRON_SECRET)?.trim()
  if (!cronSecret) return false
  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${cronSecret}`) return true
  const secretParam = request.nextUrl.searchParams.get('secret')?.trim()
  return secretParam === cronSecret
}

async function runJob() {
  const result = await sendDueVerificationReminders()
  return { success: true, ...result }
}

export async function POST(request: NextRequest) {
  try {
    if (!authorize(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const result = await runJob()
    return NextResponse.json(result)
  } catch (error) {
    console.error('verification-reminders cron failed:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
