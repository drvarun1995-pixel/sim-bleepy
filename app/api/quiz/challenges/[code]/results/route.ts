import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

// GET - Get final results
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get challenge
    const { data: challenge } = await supabaseAdmin
      .from('quiz_challenges')
      .select('*')
      .eq('code', params.code)
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
          email
        )
      `)
      .eq('challenge_id', challenge.id)
      .order('final_score', { ascending: false })

    if (participantsError) {
      console.error('Error fetching participants:', participantsError)
    }

    // Get all answers with question details
    const { data: answers, error: answersError } = await supabaseAdmin
      .from('quiz_challenge_answers')
      .select(`
        *,
        question:question_id (
          id,
          question_text,
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

    // Get unique questions
    const questionIds = Array.from(answersByQuestion.keys())
    const { data: questions } = await supabaseAdmin
      .from('quiz_questions')
      .select('*')
      .in('id', questionIds)
      .order('id', { ascending: true })

    return NextResponse.json({
      challenge,
      participants: participants || [],
      questions: questions || [],
      answersByQuestion: Object.fromEntries(answersByQuestion),
      allAnswers: answers || [],
    })
  } catch (error) {
    console.error('Error in GET /api/quiz/challenges/[code]/results:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


