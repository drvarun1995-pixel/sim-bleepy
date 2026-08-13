import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Skipping profile onboarding is no longer allowed.
 * Kept as a stub so old clients get a clear error instead of silently marking complete.
 */
export async function POST(_request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json(
    {
      error:
        'Profile onboarding is required and can no longer be skipped. Please complete your profile.',
    },
    { status: 403 }
  )
}
