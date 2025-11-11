import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

// GET - Get challenge details
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get challenge
    const { data: challenge, error: challengeError } = await supabaseAdmin
      .from('quiz_challenges')
      .select('*')
      .eq('code', params.code)
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Get participants
    const { data: participants, error: participantsError } = await supabaseAdmin
      .from('quiz_challenge_participants')
      .select(`
        *,
        users:user_id (
          id,
          name,
          email
        )
      `)
      .eq('challenge_id', challenge.id)
      .order('joined_at', { ascending: true })

    if (participantsError) {
      console.error('Error fetching participants:', participantsError)
    }

    // Check if user is participant
    const userParticipant = participants?.find((p: any) => p.user_id === user.id)

    return NextResponse.json({
      challenge,
      participants: participants || [],
      isHost: challenge.host_id === user.id,
      userParticipant,
    })
  } catch (error) {
    console.error('Error in GET /api/quiz/challenges/[code]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


