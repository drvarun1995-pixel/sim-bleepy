import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { USER_ROLES } from '@/lib/roles'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .maybeSingle()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (![USER_ROLES.ADMIN, USER_ROLES.MEDED_TEAM].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [
      { error: transactionsError },
      { error: snapshotsError },
      { error: xpError },
    ] = await Promise.all([
      supabaseAdmin
        .from('quiz_xp_transactions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'),
      supabaseAdmin
        .from('quiz_leaderboard_snapshots')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'),
      supabaseAdmin
        .from('quiz_user_xp')
        .delete()
        .neq('user_id', '00000000-0000-0000-0000-000000000000'),
    ])

    if (transactionsError || snapshotsError || xpError) {
      console.error('Error resetting leaderboard:', {
        transactionsError,
        snapshotsError,
        xpError,
      })
      return NextResponse.json(
        { error: 'Failed to reset leaderboard data' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error resetting leaderboard:', error)
    return NextResponse.json(
      { error: 'Unexpected error resetting leaderboard' },
      { status: 500 }
    )
  }
}


