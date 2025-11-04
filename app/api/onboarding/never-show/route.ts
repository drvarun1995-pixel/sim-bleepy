import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.error('never-show API: No session or email found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('never-show API: Updating for email:', session.user.email)

    const supabase = supabaseAdmin
    
    const { data, error } = await supabase
      .from('users')
      .update({
        onboarding_never_show: true,
        onboarding_skipped: true,
        onboarding_skipped_at: new Date().toISOString(),
      })
      .eq('email', session.user.email)
      .select()

    if (error) {
      console.error('Error updating onboarding never_show status:', error)
      return NextResponse.json({ error: 'Failed to update onboarding status', details: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      console.error('never-show API: No user found with email:', session.user.email)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('never-show API: Successfully updated user:', data[0].email)
    return NextResponse.json({ success: true, updated: data[0] })
  } catch (error) {
    console.error('Error in onboarding never-show API:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
