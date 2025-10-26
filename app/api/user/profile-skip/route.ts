import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update profile_skipped_at and mark profile as completed
    const { error } = await supabase
      .from('users')
      .update({
        profile_skipped_at: new Date().toISOString(),
        last_profile_prompt: new Date().toISOString(),
        profile_completed: true, // Mark as completed so user can access dashboard
        onboarding_completed_at: new Date().toISOString(), // Set completion timestamp
      })
      .eq('email', session.user.email)

    if (error) {
      console.error('Error updating skip timestamp:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in profile-skip API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
