import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { USER_ROLES } from '@/lib/roles'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { userId } = body

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Verify the target user exists
    const { data: targetUser, error: targetUserError } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('id', userId)
      .single()

    if (targetUserError || !targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    // Reset quiz leaderboard data for specific user
    const [
      { error: transactionsError },
      { error: snapshotsError },
      { error: xpError },
    ] = await Promise.all([
      supabaseAdmin
        .from('quiz_xp_transactions')
        .delete()
        .eq('user_id', userId),
      supabaseAdmin
        .from('quiz_leaderboard_snapshots')
        .delete()
        .eq('user_id', userId),
      supabaseAdmin
        .from('quiz_user_xp')
        .delete()
        .eq('user_id', userId),
    ])

    if (transactionsError || snapshotsError || xpError) {
      console.error('Error resetting user leaderboard:', {
        transactionsError,
        snapshotsError,
        xpError,
        userId,
      })
      return NextResponse.json(
        { error: 'Failed to reset user leaderboard data' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: `Leaderboard data reset for user: ${targetUser.email || targetUser.name || userId}`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
      }
    })
  } catch (error) {
    console.error('Unexpected error resetting user leaderboard:', error)
    return NextResponse.json(
      { error: 'Unexpected error resetting user leaderboard' },
      { status: 500 }
    )
  }
}

