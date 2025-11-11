import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

// POST - Join challenge
export async function POST(
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
      .select('id, name')
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

    if (challenge.status !== 'lobby') {
      return NextResponse.json({ error: 'Challenge is not accepting new players' }, { status: 400 })
    }

    // Check if user is already a participant
    const { data: existingParticipant } = await supabaseAdmin
      .from('quiz_challenge_participants')
      .select('id')
      .eq('challenge_id', challenge.id)
      .eq('user_id', user.id)
      .single()

    if (existingParticipant) {
      return NextResponse.json({ error: 'Already joined this challenge' }, { status: 400 })
    }

    // Check participant count (max 8)
    const { count: participantCount } = await supabaseAdmin
      .from('quiz_challenge_participants')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challenge.id)

    if ((participantCount || 0) >= 8) {
      return NextResponse.json({ error: 'Challenge is full (max 8 players)' }, { status: 400 })
    }

    // Add participant
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('quiz_challenge_participants')
      .insert({
        challenge_id: challenge.id,
        user_id: user.id,
        status: 'joined',
      })
      .select()
      .single()

    if (participantError) {
      console.error('Error joining challenge:', participantError)
      return NextResponse.json({ error: 'Failed to join challenge' }, { status: 500 })
    }

    return NextResponse.json({
      participant,
      challenge,
    })
  } catch (error) {
    console.error('Error in POST /api/quiz/challenges/[code]/join:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


