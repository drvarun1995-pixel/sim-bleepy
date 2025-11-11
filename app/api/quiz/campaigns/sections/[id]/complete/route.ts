import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

// POST - Complete section
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

    const body = await request.json()
    const { score, correct_count, total_questions } = body

    // Calculate accuracy
    const accuracy = total_questions > 0 ? (correct_count / total_questions) * 100 : 0
    const isMastered = accuracy >= 80

    // Update progress
    const updateData: any = {
      status: isMastered ? 'mastered' : 'completed',
      score,
      correct_count,
      completed_at: new Date().toISOString(),
    }

    if (isMastered) {
      updateData.mastered_at = new Date().toISOString()
    }

    const { data: progress, error } = await supabaseAdmin
      .from('quiz_user_progress')
      .update(updateData)
      .eq('user_id', user.id)
      .eq('section_id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error completing section:', error)
      return NextResponse.json({ error: 'Failed to complete section' }, { status: 500 })
    }

    // Unlock next section if mastered
    if (isMastered) {
      const { data: section } = await supabaseAdmin
        .from('quiz_campaign_sections')
        .select('campaign_id, order_index')
        .eq('id', params.id)
        .single()

      if (section) {
        // Find next section
        const { data: nextSection } = await supabaseAdmin
          .from('quiz_campaign_sections')
          .select('id')
          .eq('campaign_id', section.campaign_id)
          .eq('order_index', section.order_index + 1)
          .single()

        if (nextSection) {
          // Unlock next section
          await supabaseAdmin
            .from('quiz_user_progress')
            .upsert({
              user_id: user.id,
              section_id: nextSection.id,
              status: 'unlocked',
            }, {
              onConflict: 'user_id,section_id',
            })
        }
      }
    }

    return NextResponse.json({
      progress,
      mastered: isMastered,
      accuracy,
    })
  } catch (error) {
    console.error('Error in POST /api/quiz/campaigns/sections/[id]/complete:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


