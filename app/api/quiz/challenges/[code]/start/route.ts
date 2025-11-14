import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

// Fisher-Yates shuffle with seed for consistent randomization per challenge
function shuffleArrayWithSeed<T>(array: T[], seed: string): T[] {
  // Convert seed string to a number for consistent randomization
  let seedValue = 0
  for (let i = 0; i < seed.length; i++) {
    seedValue = ((seedValue << 5) - seedValue) + seed.charCodeAt(i)
    seedValue = seedValue & 0xffffffff // Convert to 32-bit integer
  }
  
  // Simple seeded random number generator
  let seedNum = Math.abs(seedValue)
  function seededRandom() {
    seedNum = (seedNum * 9301 + 49297) % 233280
    return seedNum / 233280
  }
  
  // Fisher-Yates shuffle with seeded random
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  return shuffled
}

// POST - Start challenge (host only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
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
      .eq('code', code)
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Verify user is host
    if (challenge.host_id !== user.id) {
      return NextResponse.json({ error: 'Only the host can start the challenge' }, { status: 403 })
    }

    if (challenge.status !== 'lobby') {
      return NextResponse.json({ error: 'Challenge is not in lobby state' }, { status: 400 })
    }

    // Get questions based on challenge settings
    let query = supabaseAdmin
      .from('quiz_questions')
      .select('*')
      .eq('status', 'published')

    if (challenge.selected_categories && challenge.selected_categories.length > 0) {
      query = query.in('category', challenge.selected_categories)
    }

    if (challenge.selected_difficulties && challenge.selected_difficulties.length > 0) {
      query = query.in('difficulty', challenge.selected_difficulties)
    }

    const { data: allQuestions, error: questionsError } = await query

    if (questionsError || !allQuestions || allQuestions.length === 0) {
      return NextResponse.json({ error: 'No questions found matching criteria' }, { status: 404 })
    }

    // Randomize questions ONCE per challenge using challenge ID as seed
    // This ensures all participants in the same challenge see questions in the same randomized order
    // But different challenges will have different randomizations
    const shuffledQuestions = shuffleArrayWithSeed([...allQuestions], challenge.id)
    
    // Select the first N questions from the shuffled array
    const selectedQuestions = shuffledQuestions.slice(0, Math.min(challenge.question_count || 10, shuffledQuestions.length))

    // Update challenge status
    const { data: updatedChallenge, error: updateError } = await supabaseAdmin
      .from('quiz_challenges')
      .update({
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .eq('id', challenge.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error starting challenge:', updateError)
      return NextResponse.json({ error: 'Failed to start challenge' }, { status: 500 })
    }

    // Update all participants to playing status
    const { data: participants } = await supabaseAdmin
      .from('quiz_challenge_participants')
      .select('id')
      .eq('challenge_id', challenge.id)

    if (participants && participants.length > 0) {
      await supabaseAdmin
        .from('quiz_challenge_participants')
        .update({ status: 'playing' })
        .eq('challenge_id', challenge.id)

      // Pre-populate question order in challenge_answers for all participants
      // This ensures all participants see the same questions in the same order
      const answerInserts = []
      for (const participant of participants) {
        for (let i = 0; i < selectedQuestions.length; i++) {
          answerInserts.push({
            challenge_id: challenge.id,
            participant_id: participant.id,
            question_id: selectedQuestions[i].id,
            question_order: i + 1,
            selected_answer: null, // Not answered yet
            answered_at: null, // Explicitly null to avoid default timestamps
          })
        }
      }

      if (answerInserts.length > 0) {
        // Insert all at once for faster initialization
        // Use a single insert instead of batches for better performance
        const { error: insertError } = await supabaseAdmin
          .from('quiz_challenge_answers')
          .insert(answerInserts)

        if (insertError) {
          console.error('Error inserting challenge answers:', insertError)
          // If batch insert fails, try smaller batches as fallback
          const batchSize = 50
          for (let i = 0; i < answerInserts.length; i += batchSize) {
            const batch = answerInserts.slice(i, i + batchSize)
            await supabaseAdmin
              .from('quiz_challenge_answers')
              .insert(batch)
          }
        }
      }
    }

    return NextResponse.json({
      challenge: updatedChallenge,
      questions: selectedQuestions,
    })
  } catch (error) {
    console.error('Error in POST /api/quiz/challenges/[code]/start:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


