import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { awardQuizXp } from '@/lib/quiz/quizXp'

export const dynamic = 'force-dynamic'

// GET - Get final results
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Get participants with user info, sorted by score
    const { data: participants, error: participantsError } = await supabaseAdmin
      .from('quiz_challenge_participants')
      .select(`
        *,
        users:user_id (
          id,
          name,
          email,
          profile_picture_url,
          profile_picture_updated_at,
          avatar_type,
          avatar_asset,
          avatar_thumbnail
        )
      `)
      .eq('challenge_id', challenge.id)
      .order('final_score', { ascending: false })

    if (participantsError) {
      console.error('Error fetching participants:', participantsError)
    }

    if (participants && participants.length > 0) {
      const winnerParticipantId = participants[0]?.id
      for (let index = 0; index < participants.length; index++) {
        const participant = participants[index]
        if (!participant?.user_id) continue

        const finalScore = participant.final_score || 0
        const baseXp = Math.max(0, Math.floor(finalScore / 2)) + 100

        if (baseXp > 0) {
          try {
            await awardQuizXp({
              userId: participant.user_id,
              amount: baseXp,
              reason: 'challenge_participation',
              sourceType: 'challenge_participant',
              sourceId: participant.id,
              metadata: {
                challengeId: challenge.id,
                finalScore,
                questionsAnswered: participant.questions_answered || 0,
              },
            })
          } catch (xpError) {
            console.error('Failed to award base challenge XP:', xpError, {
              participantId: participant.id,
              challengeId: challenge.id,
            })
          }
        }

        if (participant.id === winnerParticipantId && finalScore > 0) {
          try {
            await awardQuizXp({
              userId: participant.user_id,
              amount: 200,
              reason: 'challenge_bonus',
              sourceType: 'challenge_winner',
              sourceId: participant.id,
              metadata: {
                challengeId: challenge.id,
                placement: 1,
              },
            })
          } catch (xpError) {
            console.error('Failed to award winner bonus XP:', xpError, {
              participantId: participant.id,
              challengeId: challenge.id,
            })
          }
        }
      }
    }

    // Get all answers with question details (including answered_at for timeout detection)
    const { data: answers, error: answersError } = await supabaseAdmin
      .from('quiz_challenge_answers')
      .select(`
        *,
        question:question_id (
          id,
          question_text,
          scenario_text,
          option_a,
          option_b,
          option_c,
          option_d,
          option_e,
          correct_answer,
          explanation_text,
          explanation_image_url,
          explanation_table_data
        )
      `)
      .eq('challenge_id', challenge.id)
      .order('question_order', { ascending: true })

    if (answersError) {
      console.error('Error fetching answers:', answersError)
    }

    // Group answers by question
    const answersByQuestion = new Map()
    if (answers) {
      for (const answer of answers) {
        const questionId = answer.question_id
        if (!answersByQuestion.has(questionId)) {
          answersByQuestion.set(questionId, [])
        }
        answersByQuestion.get(questionId).push(answer)
      }
    }

    // Get unique questions and include scenario_text
    const questionIds = Array.from(answersByQuestion.keys())
    const { data: allQuestions } = await supabaseAdmin
      .from('quiz_questions')
      .select('*')
      .in('id', questionIds)

    // Sort questions by question_order from answers (to maintain the order they were asked)
    // Get the question_order for each question from the first answer
    const questionOrderMap = new Map()
    if (answers) {
      for (const answer of answers) {
        if (answer.question_id && answer.question_order && !questionOrderMap.has(answer.question_id)) {
          questionOrderMap.set(answer.question_id, answer.question_order)
        }
      }
    }
    
    // Sort questions by their question_order
    const questions = (allQuestions || []).sort((a: any, b: any) => {
      const orderA = questionOrderMap.get(a.id) || 0
      const orderB = questionOrderMap.get(b.id) || 0
      return orderA - orderB
    })

    // Get current user's participant ID
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .maybeSingle()

    let currentUserParticipantId = null
    if (currentUser && participants) {
      const currentUserParticipant = participants.find((p: any) => p.user_id === currentUser.id)
      if (currentUserParticipant) {
        currentUserParticipantId = currentUserParticipant.id
      }
    }

    return NextResponse.json({
      challenge,
      participants: participants || [],
      questions: questions || [],
      answersByQuestion: Object.fromEntries(answersByQuestion),
      allAnswers: answers || [],
      currentUserParticipantId,
    })
  } catch (error) {
    console.error('Error in GET /api/quiz/challenges/[code]/results:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


