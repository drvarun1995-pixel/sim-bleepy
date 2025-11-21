import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { USER_ROLES } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or meded_team
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (!user?.role || ![USER_ROLES.ADMIN, USER_ROLES.MEDED_TEAM].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { userId } = body

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Verify the target user exists
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('id', userId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const errors: string[] = []

    // 1. Delete practice answers for this user
    // First, get all practice session IDs for this user
    const { data: userPracticeSessions } = await supabaseAdmin
      .from('quiz_practice_sessions')
      .select('id')
      .eq('user_id', userId)

    if (userPracticeSessions && userPracticeSessions.length > 0) {
      const sessionIds = userPracticeSessions.map((s: any) => s.id)
      const { error: practiceAnswersError } = await supabaseAdmin
        .from('quiz_practice_answers')
        .delete()
        .in('session_id', sessionIds)

      if (practiceAnswersError) {
        console.error('Error deleting practice answers:', practiceAnswersError)
        errors.push(`Practice answers: ${practiceAnswersError.message}`)
      }
    }

    // 2. Delete practice sessions for this user
    const { error: practiceSessionsError } = await supabaseAdmin
      .from('quiz_practice_sessions')
      .delete()
      .eq('user_id', userId)

    if (practiceSessionsError) {
      console.error('Error deleting practice sessions:', practiceSessionsError)
      errors.push(`Practice sessions: ${practiceSessionsError.message}`)
    }

    // 3. Delete challenge answers for this user
    // First, get all challenge participant IDs for this user
    const { data: userParticipants } = await supabaseAdmin
      .from('quiz_challenge_participants')
      .select('id')
      .eq('user_id', userId)

    if (userParticipants && userParticipants.length > 0) {
      const participantIds = userParticipants.map((p: any) => p.id)
      const { error: challengeAnswersError } = await supabaseAdmin
        .from('quiz_challenge_answers')
        .delete()
        .in('participant_id', participantIds)

      if (challengeAnswersError) {
        console.error('Error deleting challenge answers:', challengeAnswersError)
        errors.push(`Challenge answers: ${challengeAnswersError.message}`)
      }
    }

    // 4. Delete challenge participants for this user
    const { error: participantsError } = await supabaseAdmin
      .from('quiz_challenge_participants')
      .delete()
      .eq('user_id', userId)

    if (participantsError) {
      console.error('Error deleting challenge participants:', participantsError)
      errors.push(`Challenge participants: ${participantsError.message}`)
    }

    // 5. Delete challenges hosted by this user
    const { error: challengesError } = await supabaseAdmin
      .from('quiz_challenges')
      .delete()
      .eq('host_id', userId)

    if (challengesError) {
      console.error('Error deleting challenges:', challengesError)
      errors.push(`Challenges: ${challengesError.message}`)
    }

    // 6. Delete leaderboard entries for this user
    const { error: leaderboardsError } = await supabaseAdmin
      .from('quiz_leaderboards')
      .delete()
      .eq('user_id', userId)

    if (leaderboardsError) {
      console.error('Error deleting leaderboards:', leaderboardsError)
      errors.push(`Leaderboards: ${leaderboardsError.message}`)
    }

    // 7. Delete user progress for this user
    const { error: progressError } = await supabaseAdmin
      .from('quiz_user_progress')
      .delete()
      .eq('user_id', userId)

    if (progressError) {
      console.error('Error deleting user progress:', progressError)
      errors.push(`User progress: ${progressError.message}`)
    }

    // If there were any errors, return them
    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some analytics data could not be cleared',
          details: errors,
          partialSuccess: true
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Analytics data for ${targetUser.name || targetUser.email} has been cleared successfully.`,
    })
  } catch (error: any) {
    console.error('Error clearing user analytics:', error)
    return NextResponse.json(
      { error: 'Failed to clear user analytics', details: error.message },
      { status: 500 }
    )
  }
}

