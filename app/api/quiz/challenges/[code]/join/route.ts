import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

// POST - Join challenge
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('email', session.user.email)
      .maybeSingle()

    if (userError) {
      console.error('Error fetching user:', userError)
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get challenge
    const { data: challenge, error: challengeError } = await supabaseAdmin
      .from('quiz_challenges')
      .select('*')
      .eq('code', code)
      .maybeSingle()

    if (challengeError) {
      console.error('Error fetching challenge:', challengeError)
      return NextResponse.json({ error: 'Failed to fetch challenge' }, { status: 500 })
    }

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    if (challenge.status !== 'lobby') {
      return NextResponse.json({ 
        error: 'Challenge is not accepting new players',
        details: `Challenge status is: ${challenge.status}`
      }, { status: 400 })
    }

    // Check if user is already a participant
    const { data: existingParticipant, error: participantCheckError } = await supabaseAdmin
      .from('quiz_challenge_participants')
      .select('id, status')
      .eq('challenge_id', challenge.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (participantCheckError) {
      console.error('Error checking existing participant:', participantCheckError)
      // Don't fail, just log - we'll try to insert anyway
    }

    if (existingParticipant) {
      // User is already a participant - return success with existing participant
      // This allows the page to continue loading even if join is called multiple times
      return NextResponse.json({ 
        participant: existingParticipant,
        challenge,
        alreadyJoined: true
      })
    }

    // Check participant count (max 8)
    const { count: participantCount, error: countError } = await supabaseAdmin
      .from('quiz_challenge_participants')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challenge.id)

    if (countError) {
      console.error('Error counting participants:', countError)
      // Don't fail, just log - we'll try to insert anyway
    }

    if ((participantCount || 0) >= 8) {
      return NextResponse.json({ 
        error: 'Challenge is full (max 8 players)',
        details: `Current participant count: ${participantCount || 0}/8`
      }, { status: 400 })
    }

    // Add participant
    console.log(`[Join ${code}] Adding participant:`, {
      challenge_id: challenge.id,
      user_id: user.id,
      user_name: user.name,
      user_email: session.user.email
    })
    
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
      console.error(`[Join ${code}] Error joining challenge:`, participantError)
      console.error('Insert details:', {
        challenge_id: challenge.id,
        user_id: user.id,
        errorCode: participantError.code,
        errorMessage: participantError.message,
      })
      
      // Check if it's a unique constraint violation (already exists)
      if (participantError.code === '23505') {
        // User already joined - fetch existing participant
        const { data: existing } = await supabaseAdmin
          .from('quiz_challenge_participants')
          .select('*')
          .eq('challenge_id', challenge.id)
          .eq('user_id', user.id)
          .single()
        
        if (existing) {
          return NextResponse.json({
            participant: existing,
            challenge,
            alreadyJoined: true
          })
        }
      }
      
      return NextResponse.json({ 
        error: 'Failed to join challenge',
        details: participantError.message
      }, { status: 500 })
    }

    console.log(`[Join ${code}] Successfully joined challenge:`, {
      participantId: participant.id,
      challengeId: challenge.id,
      userName: user.name
    })

    return NextResponse.json({
      participant,
      challenge,
      alreadyJoined: false
    })
  } catch (error: any) {
    console.error(`[Join ${code}] Error in POST /api/quiz/challenges/[code]/join:`, error)
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
    })
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}


