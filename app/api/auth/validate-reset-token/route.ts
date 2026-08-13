import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  checkAuthRateLimit,
  getClientIp,
  recordFailedAuthAttempt,
  resetPasswordRateKey,
} from '@/lib/auth-rate-limit'
import { findPasswordResetToken } from '@/lib/password-reset-token'

export async function GET(request: NextRequest) {
  try {
    const token = new URL(request.url).searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Reset token is required' }, { status: 400 })
    }

    const ip = getClientIp(request)
    const rateKey = resetPasswordRateKey(ip)
    const rateLimit = await checkAuthRateLimit(rateKey)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many reset attempts. Please try again later.' },
        {
          status: 429,
          headers: rateLimit.retryAfterSeconds
            ? { 'Retry-After': String(rateLimit.retryAfterSeconds) }
            : undefined,
        }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const resetToken = await findPasswordResetToken(supabase, token)

    if (!resetToken) {
      await recordFailedAuthAttempt(rateKey)
      return NextResponse.json({ error: 'Invalid reset token' }, { status: 400 })
    }

    if (new Date() > new Date(resetToken.expires_at)) {
      await recordFailedAuthAttempt(rateKey)
      return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 })
    }

    if (resetToken.used) {
      await recordFailedAuthAttempt(rateKey)
      return NextResponse.json({ error: 'Reset token has already been used' }, { status: 400 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', resetToken.user_id)
      .single()

    return NextResponse.json({
      message: 'Reset token is valid',
      valid: true,
      email: user?.email || undefined,
    })
  } catch (error) {
    console.error('Error in GET /api/auth/validate-reset-token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
