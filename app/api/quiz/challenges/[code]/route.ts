import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { cleanupChallengeQRCode } from '@/lib/quiz/cleanup-qr-code'

export const dynamic = 'force-dynamic'

// GET - Get challenge details
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
      console.error(`[GET /api/quiz/challenges/${code}] Error fetching participants:`, participantsError)
    }

    console.log(`[GET /api/quiz/challenges/${code}] Fetched participants:`, {
      challengeId: challenge.id,
      participantsCount: participants?.length || 0,
      participants: participants?.map((p: any) => ({ id: p.id, userId: p.user_id, name: p.users?.name, email: p.users?.email }))
    })

    // Check if user is participant
    const userParticipant = participants?.find((p: any) => p.user_id === user.id)
    console.log(`[GET /api/quiz/challenges/${code}] User participant:`, {
      userId: user.id,
      isParticipant: !!userParticipant,
      userParticipantId: userParticipant?.id
    })

    // If challenge is active, fetch questions
    let questions: any[] = []
    if (challenge.status === 'active') {
      // Get the current user's participant ID to fetch their questions
      const { data: userParticipant } = await supabaseAdmin
        .from('quiz_challenge_participants')
        .select('id')
        .eq('challenge_id', challenge.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (userParticipant) {
        // Fetch questions for this specific participant (they all have the same questions)
        const { data: answers, error: answersError } = await supabaseAdmin
          .from('quiz_challenge_answers')
          .select('question_id, question_order')
          .eq('challenge_id', challenge.id)
          .eq('participant_id', userParticipant.id)
          .order('question_order', { ascending: true })

        if (!answersError && answers && answers.length > 0) {
          // Get unique question IDs from answers
          const questionIds = answers
            .map((a: any) => a.question_id)
            .filter((id: any) => id !== null && id !== undefined)

          if (questionIds.length > 0) {
            // Fetch questions
            const { data: questionsData, error: questionsError } = await supabaseAdmin
              .from('quiz_questions')
              .select('*')
              .in('id', questionIds)

            if (!questionsError && questionsData && questionsData.length > 0) {
              // Create a map for quick lookup
              const questionMap = new Map(questionsData.map((q: any) => [q.id, q]))
              
              // Sort questions by question_order from answers
              questions = answers
                .map((a: any) => questionMap.get(a.question_id))
                .filter((q: any) => q !== undefined)
            }
          }
        }
      }

      // If no questions found from answers, fetch based on challenge settings
      // This handles the case where challenge just started and answers are still being inserted
      if (questions.length === 0) {
        // Wait a bit and retry (for cases where answers are still being inserted)
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Try fetching answers again
        const { data: retryAnswers } = await supabaseAdmin
          .from('quiz_challenge_answers')
          .select('question_id, question_order')
          .eq('challenge_id', challenge.id)
          .limit(1)

        if (retryAnswers && retryAnswers.length > 0) {
          // Answers exist, fetch questions for any participant
          const { data: allAnswers } = await supabaseAdmin
            .from('quiz_challenge_answers')
            .select('question_id, question_order')
            .eq('challenge_id', challenge.id)
            .order('question_order', { ascending: true })
            .limit(100)

          if (allAnswers && allAnswers.length > 0) {
            const questionIds = [...new Set(allAnswers.map((a: any) => a.question_id).filter((id: any) => id !== null && id !== undefined))]
            
            if (questionIds.length > 0) {
              const { data: questionsData } = await supabaseAdmin
                .from('quiz_questions')
                .select('*')
                .in('id', questionIds)

              if (questionsData && questionsData.length > 0) {
                const questionMap = new Map(questionsData.map((q: any) => [q.id, q]))
                const questionOrderMap = new Map<string, number>()
                
                allAnswers.forEach((a: any) => {
                  if (a.question_id && a.question_order !== null && a.question_order !== undefined) {
                    if (!questionOrderMap.has(a.question_id)) {
                      questionOrderMap.set(a.question_id, a.question_order)
                    }
                  }
                })
                
                questions = questionsData.sort((a: any, b: any) => {
                  const orderA = questionOrderMap.get(a.id) ?? 999
                  const orderB = questionOrderMap.get(b.id) ?? 999
                  return orderA - orderB
                })
              }
            }
          }
        } else {
          // Fallback: fetch based on challenge settings
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

          if (!questionsError && allQuestions && allQuestions.length > 0) {
            // Use Fisher-Yates shuffle (same as start endpoint)
            function shuffleArray<T>(array: T[]): T[] {
              const shuffled = [...array]
              for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
                ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
              }
              return shuffled
            }
            
            const shuffled = shuffleArray(allQuestions)
            questions = shuffled.slice(0, Math.min(challenge.question_count || 10, shuffled.length))
          }
        }
      }
    }

    return NextResponse.json({
      challenge,
      participants: participants || [],
      isHost: challenge.host_id === user.id,
      userParticipant,
      questions: questions.length > 0 ? questions : undefined,
    })
  } catch (error) {
    console.error('Error in GET /api/quiz/challenges/[code]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update challenge (e.g., status, cancellation)
export async function PUT(
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

    // Get current challenge to check permissions and get existing status
    const { data: currentChallenge, error: challengeError } = await supabaseAdmin
      .from('quiz_challenges')
      .select('*')
      .eq('code', code)
      .single()

    if (challengeError || !currentChallenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Verify user is host (only host can update challenge)
    if (currentChallenge.host_id !== user.id) {
      return NextResponse.json({ error: 'Only the host can update the challenge' }, { status: 403 })
    }

    const body = await request.json()
    const { status, selected_categories, selected_difficulties, question_count, time_limit, ...otherUpdates } = body

    // Only allow updating settings if challenge is in lobby
    if (currentChallenge.status !== 'lobby') {
      // Only allow status updates for non-lobby challenges
      if (selected_categories !== undefined || selected_difficulties !== undefined || question_count !== undefined || time_limit !== undefined) {
        return NextResponse.json({ error: 'Settings can only be updated when challenge is in lobby' }, { status: 400 })
      }
    }

    // Prepare update object
    const updateData: any = { ...otherUpdates }

    // Update settings (only allowed in lobby)
    if (currentChallenge.status === 'lobby') {
      if (selected_categories !== undefined) {
        updateData.selected_categories = Array.isArray(selected_categories) ? selected_categories : null
      }
      if (selected_difficulties !== undefined) {
        updateData.selected_difficulties = Array.isArray(selected_difficulties) && selected_difficulties.length > 0 ? selected_difficulties : null
      }
      if (question_count !== undefined) {
        updateData.question_count = question_count
      }
      if (time_limit !== undefined) {
        // Validate time_limit
        if (![30, 45, 60, 75, 90].includes(time_limit)) {
          return NextResponse.json({ error: 'Invalid time_limit. Must be one of: 30, 45, 60, 75, 90' }, { status: 400 })
        }
        updateData.time_limit = time_limit
      }
    }

    // If status is being updated, handle QR code cleanup for completed/cancelled challenges
    if (status && status !== currentChallenge.status) {
      updateData.status = status

      // Cleanup QR code when challenge is completed or cancelled
      if ((status === 'completed' || status === 'cancelled') && currentChallenge.qr_code_url) {
        console.log(
          `🧹 Cleaning up QR code for challenge ${currentChallenge.id} (status: ${currentChallenge.status} -> ${status})`
        )

        // Delete QR code from storage
        await cleanupChallengeQRCode(currentChallenge.qr_code_url, currentChallenge.id)

        // Clear qr_code_url from database
        updateData.qr_code_url = null
      }

      // Set completed_at timestamp if status is being set to completed
      if (status === 'completed' && !currentChallenge.completed_at) {
        updateData.completed_at = new Date().toISOString()
      }
    }

    // Update challenge
    const { data: updatedChallenge, error: updateError } = await supabaseAdmin
      .from('quiz_challenges')
      .update(updateData)
      .eq('id', currentChallenge.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating challenge:', updateError)
      return NextResponse.json({ error: 'Failed to update challenge' }, { status: 500 })
    }

    return NextResponse.json({
      challenge: updatedChallenge,
    })
  } catch (error) {
    console.error('Error in PUT /api/quiz/challenges/[code]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


