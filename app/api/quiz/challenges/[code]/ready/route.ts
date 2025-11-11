import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

// POST - Mark ready
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
    const { data: challenge } = await supabaseAdmin
      .from('quiz_challenges')
      .select('*')
      .eq('code', params.code)
      .single()

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    if (challenge.status !== 'lobby') {
      return NextResponse.json({ error: 'Challenge is not in lobby state' }, { status: 400 })
    }

    // Update participant status
    const { data: participant, error } = await supabaseAdmin
      .from('quiz_challenge_participants')
      .update({
        status: 'ready',
        ready_at: new Date().toISOString(),
      })
      .eq('challenge_id', challenge.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating ready status:', error)
      return NextResponse.json({ error: 'Failed to update ready status' }, { status: 500 })
    }

    return NextResponse.json({ participant })
  } catch (error) {
    console.error('Error in POST /api/quiz/challenges/[code]/ready:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


