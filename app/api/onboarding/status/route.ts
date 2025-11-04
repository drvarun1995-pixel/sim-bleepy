import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    const { data: user, error } = await supabase
      .from('users')
      .select('onboarding_completed, onboarding_skipped, onboarding_never_show, onboarding_completed_at, onboarding_skipped_at')
      .eq('email', session.user.email)
      .single()

    if (error) {
      console.error('Error fetching onboarding status:', error)
      return NextResponse.json({ error: 'Failed to fetch onboarding status' }, { status: 500 })
    }

    return NextResponse.json({
      completed: user?.onboarding_completed || false,
      skipped: user?.onboarding_skipped || false,
      neverShow: user?.onboarding_never_show || false,
      completedAt: user?.onboarding_completed_at,
      skippedAt: user?.onboarding_skipped_at,
    })
  } catch (error) {
    console.error('Error in onboarding status API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
