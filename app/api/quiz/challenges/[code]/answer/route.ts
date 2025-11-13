import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { calculateScore } from '@/lib/quiz/scoring'

export const dynamic = 'force-dynamic'

// POST - Submit answer
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
    const { data: challenge } = await supabaseAdmin
      .from('quiz_challenges')
      .select('*')
      .eq('code', code)
      .single()

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    if (challenge.status !== 'active') {
      return NextResponse.json({ error: 'Challenge is not active' }, { status: 400 })
    }

    // Get participant
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('quiz_challenge_participants')
      .select('*')
      .eq('challenge_id', challenge.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (participantError) {
      console.error('Error fetching participant:', participantError)
      return NextResponse.json({ error: 'Failed to fetch participant' }, { status: 500 })
    }

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant in this challenge' }, { status: 403 })
    }

    const body = await request.json()
    const { question_id, question_order, selected_answer, time_taken_seconds } = body

    console.log('Answer submission request:', {
      challenge_id: challenge.id,
      participant_id: participant.id,
      question_id,
      question_order,
      selected_answer,
      time_taken_seconds,
    })

    // Validate required fields (selected_answer can be empty string for timeouts)
    if (!question_id || !question_order || time_taken_seconds === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: question_id, question_order, and time_taken_seconds are required' 
      }, { status: 400 })
    }

    // selected_answer can be empty string (for timeouts) but should be defined
    if (selected_answer === undefined || selected_answer === null) {
      return NextResponse.json({ 
        error: 'selected_answer is required (can be empty string for timeouts)' 
      }, { status: 400 })
    }

    // Get question
    const { data: question, error: questionError } = await supabaseAdmin
      .from('quiz_questions')
      .select('*')
      .eq('id', question_id)
      .maybeSingle()

    if (questionError) {
      console.error('Error fetching question:', questionError)
      return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 })
    }

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Check if already answered (update existing answer if it exists)
    // Try to find by question_id first, then by question_order as fallback
    const { data: existingAnswer, error: existingAnswerError } = await supabaseAdmin
      .from('quiz_challenge_answers')
      .select('id, points_earned, is_correct, selected_answer, question_order')
      .eq('challenge_id', challenge.id)
      .eq('participant_id', participant.id)
      .eq('question_id', question_id)
      .maybeSingle()

    if (existingAnswerError) {
      console.error('Error checking existing answer:', existingAnswerError)
      // Don't fail, just log - we'll try to insert if not found
    }

    // If not found by question_id, try by question_order (fallback)
    let answerToUpdate = existingAnswer
    if (!answerToUpdate && question_order) {
      const { data: answerByOrder } = await supabaseAdmin
        .from('quiz_challenge_answers')
        .select('id, points_earned, is_correct, selected_answer, question_order, question_id')
        .eq('challenge_id', challenge.id)
        .eq('participant_id', participant.id)
        .eq('question_order', question_order)
        .maybeSingle()
      
      if (answerByOrder) {
        answerToUpdate = answerByOrder
        // Update question_id if it was missing
        if (!answerByOrder.question_id) {
          await supabaseAdmin
            .from('quiz_challenge_answers')
            .update({ question_id })
            .eq('id', answerByOrder.id)
        }
      }
    }

    // Check if answer was already submitted (not null and not empty)
    if (answerToUpdate && answerToUpdate.selected_answer !== null && answerToUpdate.selected_answer !== '') {
      return NextResponse.json({ error: 'Answer already submitted' }, { status: 400 })
    }

    // Determine if answer is correct (empty string means timeout/unanswered = incorrect)
    const isCorrect = selected_answer !== '' && selected_answer === question.correct_answer

    // Get current streak for this participant
    const { data: previousAnswers } = await supabaseAdmin
      .from('quiz_challenge_answers')
      .select('is_correct')
      .eq('challenge_id', challenge.id)
      .eq('participant_id', participant.id)
      .order('question_order', { ascending: false })

    let currentStreak = 0
    if (previousAnswers) {
      for (const answer of previousAnswers) {
        if (answer.is_correct) {
          currentStreak++
        } else {
          break
        }
      }
    }
    if (isCorrect) {
      currentStreak++
    }

    // Calculate score
    const scoringResult = calculateScore({
      isCorrect,
      timeTakenSeconds: time_taken_seconds,
      difficulty: question.difficulty as 'easy' | 'medium' | 'hard',
      currentStreak: isCorrect ? currentStreak : 0,
    })

    // Save or update answer
    // Convert empty string to null for database storage (timeouts)
    // CHAR(1) can store null or a single character (A, B, C, D, E)
    const answerToStore = selected_answer === '' || selected_answer === null ? null : selected_answer.charAt(0).toUpperCase()

    // Validate answer format if not null
    if (answerToStore !== null && !['A', 'B', 'C', 'D', 'E'].includes(answerToStore)) {
      return NextResponse.json({ 
        error: 'Invalid answer format. Must be A, B, C, D, or E' 
      }, { status: 400 })
    }

    let answerData
    if (answerToUpdate) {
      // Update existing answer (from pre-populated row)
      const { data: updatedAnswer, error: updateError } = await supabaseAdmin
        .from('quiz_challenge_answers')
        .update({
          selected_answer: answerToStore,
          is_correct: isCorrect,
          time_taken_seconds,
          points_earned: scoringResult.totalPoints,
          answered_at: new Date().toISOString(),
        })
        .eq('id', answerToUpdate.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating answer:', updateError)
        console.error('Update details:', {
          answer_id: answerToUpdate.id,
          challenge_id: challenge.id,
          participant_id: participant.id,
          question_id,
          question_order,
          answerToStore,
          isCorrect,
          updateErrorCode: updateError.code,
          updateErrorMessage: updateError.message,
        })
        return NextResponse.json({ 
          error: 'Failed to save answer',
          details: updateError.message 
        }, { status: 500 })
      }
      answerData = updatedAnswer
    } else {
      // Insert new answer (fallback if pre-population didn't work)
      const { data: insertedAnswer, error: insertError } = await supabaseAdmin
        .from('quiz_challenge_answers')
        .insert({
          challenge_id: challenge.id,
          participant_id: participant.id,
          question_id,
          question_order,
          selected_answer: answerToStore,
          is_correct: isCorrect,
          time_taken_seconds,
          points_earned: scoringResult.totalPoints,
          answered_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error saving answer:', insertError)
        console.error('Insert details:', {
          challenge_id: challenge.id,
          participant_id: participant.id,
          question_id,
          question_order,
          answerToStore,
          isCorrect,
          insertErrorCode: insertError.code,
          insertErrorMessage: insertError.message,
        })
        
        // Check if it's a unique constraint violation (duplicate)
        if (insertError.code === '23505') {
          // Try to update instead
          const { data: existing } = await supabaseAdmin
            .from('quiz_challenge_answers')
            .select('id')
            .eq('challenge_id', challenge.id)
            .eq('participant_id', participant.id)
            .eq('question_id', question_id)
            .maybeSingle()
          
          if (existing) {
            const { data: updated, error: updateErr } = await supabaseAdmin
              .from('quiz_challenge_answers')
              .update({
                selected_answer: answerToStore,
                is_correct: isCorrect,
                time_taken_seconds,
                points_earned: scoringResult.totalPoints,
                answered_at: new Date().toISOString(),
              })
              .eq('id', existing.id)
              .select()
              .single()
            
            if (updateErr) {
              return NextResponse.json({ 
                error: 'Failed to save answer',
                details: updateErr.message 
              }, { status: 500 })
            }
            answerData = updated
          } else {
            return NextResponse.json({ 
              error: 'Failed to save answer',
              details: insertError.message 
            }, { status: 500 })
          }
        } else {
          return NextResponse.json({ 
            error: 'Failed to save answer',
            details: insertError.message 
          }, { status: 500 })
        }
      } else {
        answerData = insertedAnswer
      }
    }

    // Update participant score
    // Check if this is the first time answering (answerToUpdate.selected_answer is null or empty)
    const isFirstAnswer = !answerToUpdate || answerToUpdate.selected_answer === null || answerToUpdate.selected_answer === ''
    
    let updatedParticipant = participant
    if (isFirstAnswer) {
      // First time answering - add to score
      const { data: updated, error: updateParticipantError } = await supabaseAdmin
        .from('quiz_challenge_participants')
        .update({
          final_score: (participant.final_score || 0) + scoringResult.totalPoints,
          questions_answered: (participant.questions_answered || 0) + 1,
          correct_answers: (participant.correct_answers || 0) + (isCorrect ? 1 : 0),
        })
        .eq('id', participant.id)
        .select()
        .single()

      if (updateParticipantError) {
        console.error('Error updating participant score:', updateParticipantError)
        // Don't fail the request, just log the error
      } else if (updated) {
        updatedParticipant = updated
      }
    } else if (answerToUpdate) {
      // Updating an existing answer - adjust score by difference
      const previousPoints = answerToUpdate.points_earned || 0
      const pointsDifference = scoringResult.totalPoints - previousPoints
      const wasCorrect = answerToUpdate.is_correct === true
      const correctDifference = (isCorrect ? 1 : 0) - (wasCorrect ? 1 : 0)

      const { data: updated, error: updateParticipantError } = await supabaseAdmin
        .from('quiz_challenge_participants')
        .update({
          final_score: (participant.final_score || 0) + pointsDifference,
          correct_answers: (participant.correct_answers || 0) + correctDifference,
        })
        .eq('id', participant.id)
        .select()
        .single()

      if (updateParticipantError) {
        console.error('Error updating participant score (update):', updateParticipantError)
        // Don't fail the request, just log the error
      } else if (updated) {
        updatedParticipant = updated
      }
    }

    // Check if all participants have answered this question
    const { data: allParticipants } = await supabaseAdmin
      .from('quiz_challenge_participants')
      .select('id')
      .eq('challenge_id', challenge.id)
      .eq('status', 'playing')

    console.log('[answer] DEBUG: Checking allAnswered status:', {
      challengeId: challenge.id,
      questionId: question_id,
      questionOrder: question_order,
      totalParticipants: allParticipants?.length || 0,
      participantIds: allParticipants?.map((p: any) => p.id)
    })

    // Check answered_at instead of selected_answer to include timeouts (which store null selected_answer)
    // But filter out answers that were submitted before the game started (pre-populated rows)
    const { data: allAnswers } = await supabaseAdmin
      .from('quiz_challenge_answers')
      .select('participant_id, answered_at')
      .eq('challenge_id', challenge.id)
      .eq('question_id', question_id)
      .eq('question_order', question_order)
      .not('answered_at', 'is', null)

    const gameStartedAt = challenge.started_at ? new Date(challenge.started_at) : null
    
    // Filter answers to only include those submitted after game started
    const validAnswers = (allAnswers || []).filter((a: any) => {
      if (!gameStartedAt) return true // Fallback for old challenges
      const answeredAt = new Date(a.answered_at)
      return answeredAt >= gameStartedAt
    })

    console.log('[answer] DEBUG: Answers found:', {
      totalAnswers: allAnswers?.length || 0,
      validAnswers: validAnswers.length,
      gameStartedAt: gameStartedAt?.toISOString(),
      answers: allAnswers?.map((a: any) => ({
        participantId: a.participant_id,
        answeredAt: a.answered_at,
        isAfterStart: gameStartedAt ? new Date(a.answered_at) >= gameStartedAt : true
      }))
    })

    const answeredParticipantIds = new Set(
      validAnswers.map((a: any) => a.participant_id)
    )
    
    const allAnswered =
      allParticipants &&
      allParticipants.every((p: any) => answeredParticipantIds.has(p.id))

    console.log('[answer] DEBUG: All answered calculation:', {
      answeredParticipantIds: Array.from(answeredParticipantIds),
      answeredCount: answeredParticipantIds.size,
      totalCount: allParticipants?.length || 0,
      allAnswered,
      participantCheck: allParticipants?.map((p: any) => ({
        participantId: p.id,
        hasAnswered: answeredParticipantIds.has(p.id)
      }))
    })

    return NextResponse.json({
      answer: answerData,
      isCorrect,
      correctAnswer: question.correct_answer,
      scoring: scoringResult,
      participant: updatedParticipant,
      allAnswered,
      answeredCount: answeredParticipantIds.size,
      totalCount: allParticipants?.length || 0,
      userAnswered: true, // User has answered this question
    })
  } catch (error: any) {
    console.error('Error in POST /api/quiz/challenges/[code]/answer:', error)
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



