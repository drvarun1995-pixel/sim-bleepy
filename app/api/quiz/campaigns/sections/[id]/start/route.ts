import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

// POST - Start section
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get section
    const { data: section } = await supabaseAdmin
      .from('quiz_campaign_sections')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    // Create or update progress
    const { data: progress, error } = await supabaseAdmin
      .from('quiz_user_progress')
      .upsert({
        user_id: user.id,
        section_id: params.id,
        status: 'in_progress',
        total_questions: section.question_ids.length,
      }, {
        onConflict: 'user_id,section_id',
      })
      .select()
      .single()

    if (error) {
      console.error('Error starting section:', error)
      return NextResponse.json({ error: 'Failed to start section' }, { status: 500 })
    }

    // Get questions
    const { data: questions } = await supabaseAdmin
      .from('quiz_questions')
      .select('*')
      .in('id', section.question_ids)
      .eq('status', 'published')

    return NextResponse.json({
      progress,
      questions: questions || [],
      section,
    })
  } catch (error) {
    console.error('Error in POST /api/quiz/campaigns/sections/[id]/start:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


