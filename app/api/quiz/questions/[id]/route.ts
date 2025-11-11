import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

// GET - Get single question
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin (for draft/archived questions)
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    const isAdmin = user?.role === 'admin'

    const { data: question, error } = await supabaseAdmin
      .from('quiz_questions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching question:', error)
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Non-admins can only see published questions
    if (!isAdmin && question.status !== 'published') {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    return NextResponse.json({ question })
  } catch (error) {
    console.error('Error in GET /api/quiz/questions/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update question (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      scenario_text,
      scenario_image_url,
      scenario_table_data,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      option_e,
      correct_answer,
      explanation_text,
      explanation_image_url,
      explanation_table_data,
      category,
      difficulty,
      tags,
      status,
    } = body

    // Build update object (only include provided fields)
    const updateData: any = {}
    if (scenario_text !== undefined) updateData.scenario_text = scenario_text
    if (scenario_image_url !== undefined) updateData.scenario_image_url = scenario_image_url
    if (scenario_table_data !== undefined) updateData.scenario_table_data = scenario_table_data
    if (question_text !== undefined) updateData.question_text = question_text
    if (option_a !== undefined) updateData.option_a = option_a
    if (option_b !== undefined) updateData.option_b = option_b
    if (option_c !== undefined) updateData.option_c = option_c
    if (option_d !== undefined) updateData.option_d = option_d
    if (option_e !== undefined) updateData.option_e = option_e
    if (correct_answer !== undefined) {
      if (!['A', 'B', 'C', 'D', 'E'].includes(correct_answer)) {
        return NextResponse.json({ error: 'Invalid correct_answer' }, { status: 400 })
      }
      updateData.correct_answer = correct_answer
    }
    if (explanation_text !== undefined) updateData.explanation_text = explanation_text
    if (explanation_image_url !== undefined) updateData.explanation_image_url = explanation_image_url
    if (explanation_table_data !== undefined) updateData.explanation_table_data = explanation_table_data
    if (category !== undefined) updateData.category = category
    if (difficulty !== undefined) {
      if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 })
      }
      updateData.difficulty = difficulty
    }
    if (tags !== undefined) updateData.tags = tags
    if (status !== undefined) {
      if (!['draft', 'published', 'archived'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updateData.status = status
    }

    const { data: question, error } = await supabaseAdmin
      .from('quiz_questions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating question:', error)
      return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
    }

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    return NextResponse.json({ question })
  } catch (error) {
    console.error('Error in PUT /api/quiz/questions/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete question (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Check if question is used in any campaign sections
    let campaignSections: any[] = []
    try {
      const { data: allSections, error: campaignError } = await supabaseAdmin
        .from('quiz_campaign_sections')
        .select('id, title, campaign_id, question_ids')
      
      if (campaignError) {
        console.error('Error checking campaign sections:', campaignError)
        // Continue with deletion even if check fails
      } else if (allSections) {
        // Filter sections that contain this question ID in their question_ids array
        campaignSections = allSections.filter(section => 
          section.question_ids && Array.isArray(section.question_ids) && section.question_ids.includes(id)
        )
      }
    } catch (error) {
      console.error('Error checking campaign sections:', error)
      // Continue with deletion even if check fails
    }

    if (campaignSections && campaignSections.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete question',
        message: 'This question is used in campaign sections. Please remove it from campaigns first.',
        usedIn: campaignSections.map(s => ({
          sectionId: s.id,
          sectionTitle: s.title,
          campaignId: s.campaign_id,
        }))
      }, { status: 400 })
    }

    // Check if question is used in any practice sessions or challenges
    // First, get all practice answers for this question
    const { data: practiceAnswers, error: practiceError } = await supabaseAdmin
      .from('quiz_practice_answers')
      .select('id, session_id')
      .eq('question_id', id)

    if (practiceError) {
      console.error('Error checking practice answers:', practiceError)
    }

    // Get session completion status for each session
    let incompleteSessionCount = 0
    let completedSessionCount = 0
    
    if (practiceAnswers && practiceAnswers.length > 0) {
      const sessionIds = [...new Set(practiceAnswers.map((a: any) => a.session_id))]
      
      // Check completion status of sessions
      const { data: sessions, error: sessionsError } = await supabaseAdmin
        .from('quiz_practice_sessions')
        .select('id, completed')
        .in('id', sessionIds)
      
      if (sessionsError) {
        console.error('Error checking session status:', sessionsError)
      } else if (sessions) {
        incompleteSessionCount = sessions.filter((s: any) => !s.completed).length
        completedSessionCount = sessions.filter((s: any) => s.completed).length
      }
    }

    const { data: challengeAnswers, error: challengeError } = await supabaseAdmin
      .from('quiz_challenge_answers')
      .select('id, challenge_id')
      .eq('question_id', id)

    if (challengeError) {
      console.error('Error checking challenge answers:', challengeError)
    }

    // Get usage statistics
    const practiceSessionCount = practiceAnswers?.length || 0
    const challengeCount = challengeAnswers?.length || 0

    // If there are incomplete sessions, prevent deletion
    if (incompleteSessionCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete question',
        message: `This question is currently being used in ${incompleteSessionCount} active practice session(s). Please wait for these sessions to complete before deleting.`,
        incompleteSessions: incompleteSessionCount,
        totalSessions: practiceSessionCount,
        usedInChallenges: challengeCount > 0,
      }, { status: 400 })
    }

    // Check if we need confirmation (question used in completed sessions)
    const { searchParams } = new URL(request.url)
    const confirmed = searchParams.get('confirmed') === 'true'
    
    const hasUsage = practiceSessionCount > 0 || challengeCount > 0
    
    // If question has usage and not confirmed, return usage info for frontend confirmation
    if (hasUsage && !confirmed) {
      return NextResponse.json({ 
        requiresConfirmation: true,
        warning: true,
        message: `This question has been used in ${completedSessionCount} completed practice session(s) and ${challengeCount} challenge(s). Deleting will remove all answer records but preserve session data.`,
        completedSessions: completedSessionCount,
        challengeCount: challengeCount,
      }, { status: 200 })
    }
    
    // Attempt deletion (CASCADE will handle related answers if migration is applied)
    const { error: deleteError } = await supabaseAdmin
      .from('quiz_questions')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting question:', deleteError)
      console.error('Delete error details:', {
        message: deleteError.message,
        details: deleteError.details,
        hint: deleteError.hint,
        code: deleteError.code,
      })
      
      // Check if it's a foreign key constraint error (shouldn't happen with CASCADE, but just in case)
      if (deleteError.code === '23503' || deleteError.message?.includes('foreign key constraint')) {
        return NextResponse.json({ 
          error: 'Cannot delete question',
          message: 'This question is referenced by other records. Please run the database migration to enable cascade deletes, or archive the question instead.',
          details: deleteError.message,
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to delete question',
        details: deleteError.message,
        hint: deleteError.hint || 'Check server logs for more details'
      }, { status: 500 })
    }

    // Return success
    return NextResponse.json({ 
      success: true,
      message: hasUsage 
        ? `Question deleted successfully. ${completedSessionCount} answer record(s) from completed sessions and ${challengeCount} challenge answer(s) have been removed. Session data has been preserved.`
        : 'Question deleted successfully.',
    })
  } catch (error) {
    console.error('Error in DELETE /api/quiz/questions/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

