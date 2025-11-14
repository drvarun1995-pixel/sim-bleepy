import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string; participantId: string }> }
) {
  try {
    const { code, participantId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .maybeSingle()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: challenge } = await supabaseAdmin
      .from('quiz_challenges')
      .select('id, host_id')
      .eq('code', code)
      .maybeSingle()

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    if (challenge.host_id !== user.id) {
      return NextResponse.json({ error: 'Only the host can remove participants' }, { status: 403 })
    }

    const { data: participant } = await supabaseAdmin
      .from('quiz_challenge_participants')
      .select('id, user_id')
      .eq('id', participantId)
      .eq('challenge_id', challenge.id)
      .maybeSingle()

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    if (participant.user_id === user.id) {
      return NextResponse.json({ error: 'Host cannot remove themselves' }, { status: 400 })
    }

    await supabaseAdmin
      .from('quiz_challenge_answers')
      .delete()
      .eq('challenge_id', challenge.id)
      .eq('participant_id', participant.id)

    await supabaseAdmin
      .from('quiz_challenge_participants')
      .delete()
      .eq('id', participant.id)
      .eq('challenge_id', challenge.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing participant from lobby:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


