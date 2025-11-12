import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { cleanupChallengeQRCode } from '@/lib/quiz/cleanup-qr-code'

export const dynamic = 'force-dynamic'

// POST - Leave challenge
export async function POST(
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

    // Check if user is host
    const isHost = challenge.host_id === user.id

    if (isHost) {
      // Host is leaving - cancel the challenge and remove all participants
      // Cleanup QR code if it exists (this should always happen when host leaves)
      if (challenge.qr_code_url) {
        console.log(`🧹 Cleaning up QR code for challenge ${challenge.id} (host leaving)`)
        await cleanupChallengeQRCode(challenge.qr_code_url, challenge.id)
      }

      // Remove all participants first
      const { error: deleteParticipantsError } = await supabaseAdmin
        .from('quiz_challenge_participants')
        .delete()
        .eq('challenge_id', challenge.id)

      if (deleteParticipantsError) {
        console.error('Error removing participants:', deleteParticipantsError)
        // Continue anyway to cancel the challenge
      }

      // Update challenge status to cancelled and clear QR code URL
      const { error: updateError } = await supabaseAdmin
        .from('quiz_challenges')
        .update({
          status: 'cancelled',
          qr_code_url: null, // Clear QR code URL from database
        })
        .eq('id', challenge.id)

      if (updateError) {
        console.error('Error cancelling challenge:', updateError)
        return NextResponse.json({ error: 'Failed to cancel challenge' }, { status: 500 })
      }

      console.log(`✅ Challenge ${challenge.id} cancelled and all participants removed`)

      return NextResponse.json({
        success: true,
        message: 'Challenge cancelled',
        cancelled: true,
      })
    } else {
      // Participant is leaving - remove from participants
      const { error: deleteError } = await supabaseAdmin
        .from('quiz_challenge_participants')
        .delete()
        .eq('challenge_id', challenge.id)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Error leaving challenge:', deleteError)
        return NextResponse.json({ error: 'Failed to leave challenge' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Left challenge successfully',
        cancelled: false,
      })
    }
  } catch (error) {
    console.error('Error in POST /api/quiz/challenges/[code]/leave:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

