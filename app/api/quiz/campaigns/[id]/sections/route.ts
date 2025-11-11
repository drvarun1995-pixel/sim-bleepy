import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

// GET - Get campaign sections
export async function GET(
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

    // Get sections
    const { data: sections, error: sectionsError } = await supabaseAdmin
      .from('quiz_campaign_sections')
      .select('*')
      .eq('campaign_id', params.id)
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (sectionsError) {
      console.error('Error fetching sections:', sectionsError)
      return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
    }

    // Get user progress
    const sectionIds = sections?.map(s => s.id) || []
    const { data: progress } = await supabaseAdmin
      .from('quiz_user_progress')
      .select('*')
      .eq('user_id', user.id)
      .in('section_id', sectionIds)

    const progressMap = new Map(progress?.map(p => [p.section_id, p]) || [])

    // Determine unlock status
    const sectionsWithStatus = sections?.map(section => {
      const userProgress = progressMap.get(section.id)
      let status = 'locked'

      if (userProgress) {
        status = userProgress.status
      } else if (!section.unlock_requirement) {
        status = 'unlocked' // First section is always unlocked
      } else {
        // Check if requirement is met
        const requiredSectionId = section.unlock_requirement
        const requiredProgress = progressMap.get(requiredSectionId)
        if (requiredProgress?.status === 'completed' || requiredProgress?.status === 'mastered') {
          status = 'unlocked'
        }
      }

      return {
        ...section,
        userProgress,
        status,
      }
    })

    return NextResponse.json({ sections: sectionsWithStatus || [] })
  } catch (error) {
    console.error('Error in GET /api/quiz/campaigns/[id]/sections:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


