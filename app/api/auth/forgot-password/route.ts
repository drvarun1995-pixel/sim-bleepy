import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'
import {
  checkAuthRateLimit,
  forgotPasswordRateKey,
  getClientIp,
  ipRateKey,
  LOGIN_IP_RATE_LIMIT,
  recordFailedAuthAttempt,
} from '@/lib/auth-rate-limit'
import {
  hashPasswordResetToken,
  invalidateUserResetTokens,
} from '@/lib/password-reset-token'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const ip = getClientIp(request)
    const emailKey = forgotPasswordRateKey(normalizedEmail)
    const ipKey = ip !== 'unknown' ? ipRateKey(ip, 'forgot') : null

    const [emailLimit, ipLimit] = await Promise.all([
      checkAuthRateLimit(emailKey),
      ipKey ? checkAuthRateLimit(ipKey, LOGIN_IP_RATE_LIMIT) : Promise.resolve({ allowed: true as const }),
    ])

    if (!emailLimit.allowed || !ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many reset requests. Please try again later.' },
        { status: 429 }
      )
    }

    await recordFailedAuthAttempt(emailKey)
    if (ipKey) await recordFailedAuthAttempt(ipKey, LOGIN_IP_RATE_LIMIT)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', normalizedEmail)
      .single()

    const generic = {
      message: 'If an account with that email exists, a password reset link has been sent.',
    }

    if (userError || !user) {
      return NextResponse.json(generic)
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await invalidateUserResetTokens(supabase, user.id)

    const { error: tokenError } = await supabase.from('password_reset_tokens').insert({
      user_id: user.id,
      token: hashPasswordResetToken(resetToken),
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    })

    if (tokenError) {
      console.error('Error storing reset token:', tokenError)
      return NextResponse.json(generic)
    }

    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`

    try {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        resetUrl,
      })
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError)
    }

    return NextResponse.json(generic)
  } catch (error) {
    console.error('Error in POST /api/auth/forgot-password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
