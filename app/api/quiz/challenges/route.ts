import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { generateChallengeCode } from '@/lib/quiz/challenge-code'

export const dynamic = 'force-dynamic'

// POST - Create challenge
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      selected_categories = [],
      selected_difficulties = [],
      question_count = 10,
    } = body

    // Generate unique 6-digit code
    let code: string
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    while (!isUnique && attempts < maxAttempts) {
      code = generateChallengeCode()
      const { data: existing } = await supabaseAdmin
        .from('quiz_challenges')
        .select('id')
        .eq('code', code)
        .single()

      if (!existing) {
        isUnique = true
      }
      attempts++
    }

    if (!isUnique) {
      return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 500 })
    }

    // Create challenge
    const { data: challenge, error } = await supabaseAdmin
      .from('quiz_challenges')
      .insert({
        code: code!,
        host_id: user.id,
        selected_categories,
        selected_difficulties,
        question_count,
        status: 'lobby',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating challenge:', error)
      return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 })
    }

    // Add host as participant
    const { data: participant } = await supabaseAdmin
      .from('quiz_challenge_participants')
      .insert({
        challenge_id: challenge.id,
        user_id: user.id,
        status: 'joined',
      })
      .select()
      .single()

    return NextResponse.json({
      challenge,
      participant,
    })
  } catch (error) {
    console.error('Error in POST /api/quiz/challenges:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


