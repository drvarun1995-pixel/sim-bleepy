import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { cleanupChallengeQRCode } from '@/lib/quiz/cleanup-qr-code'

export const dynamic = 'force-dynamic'

// POST - Leave challenge (for beacon/navigator.sendBeacon)
// This handles host leaving on page refresh/close
// Note: sendBeacon sends data as a blob, but we can get the code from URL params
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    
    // Try to get session, but don't fail if unavailable (beacon requests may not have auth)
    let session = null
    try {
      session = await getServerSession(authOptions)
    } catch (error) {
      // Session might not be available in beacon requests
      console.log('Session not available in beacon request (this is normal)')
    }

    if (!session?.user?.email) {
      // Return 200 for beacon requests even if unauthorized to avoid browser errors
      return new NextResponse(null, { status: 200 })
    }

    // Get user ID
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (!user) {
      return new NextResponse(null, { status: 200 })
    }

    // Get challenge
    const { data: challenge, error: challengeError } = await supabaseAdmin
      .from('quiz_challenges')
      .select('*')
      .eq('code', code)
      .maybeSingle()

    if (challengeError || !challenge) {
      // Challenge doesn't exist or error - return 200 to avoid browser errors
      return new NextResponse(null, { status: 200 })
    }

    // Only process if user is host and challenge is still in lobby
    const isHost = challenge.host_id === user.id
    if (!isHost) {
      // Not host - return 200 (participant leaving doesn't cancel challenge)
      return new NextResponse(null, { status: 200 })
    }

    // Only cancel if challenge is in lobby (not active or already cancelled)
    if (challenge.status !== 'lobby') {
      return new NextResponse(null, { status: 200 })
    }

    // Cleanup QR code if it exists
    if (challenge.qr_code_url) {
      console.log(`🧹 Cleaning up QR code for challenge ${challenge.id} (host page refresh/close via beacon)`)
      await cleanupChallengeQRCode(challenge.qr_code_url, challenge.id)
    }

    // Remove all participants
    const { error: deleteParticipantsError } = await supabaseAdmin
      .from('quiz_challenge_participants')
      .delete()
      .eq('challenge_id', challenge.id)

    if (deleteParticipantsError) {
      console.error('Error removing participants in beacon:', deleteParticipantsError)
      // Continue anyway
    }

    // Cancel challenge and clear QR code URL
    const { error: updateError } = await supabaseAdmin
      .from('quiz_challenges')
      .update({
        status: 'cancelled',
        qr_code_url: null,
      })
      .eq('id', challenge.id)

    if (updateError) {
      console.error('Error cancelling challenge in beacon:', updateError)
    } else {
      console.log(`✅ Challenge ${challenge.id} cancelled via beacon (host page refresh/close)`)
    }

    // Always return 200 for beacon requests to avoid browser errors
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error('Error in POST /api/quiz/challenges/[code]/leave-beacon:', error)
    // Always return 200 for beacon requests even on error to avoid browser warnings
    return new NextResponse(null, { status: 200 })
  }
}

