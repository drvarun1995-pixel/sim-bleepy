import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

// POST - Start challenge (host only)
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

    // Shuffle and select questions
    const shuffled = allQuestions.sort(() => 0.5 - Math.random())
    const selectedQuestions = shuffled.slice(0, Math.min(challenge.question_count, shuffled.length))

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
    await supabaseAdmin
      .from('quiz_challenge_participants')
      .update({ status: 'playing' })
      .eq('challenge_id', challenge.id)

    return NextResponse.json({
      challenge: updatedChallenge,
      questions: selectedQuestions,
    })
  } catch (error) {
    console.error('Error in POST /api/quiz/challenges/[code]/start:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


