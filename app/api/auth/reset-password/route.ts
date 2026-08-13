import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { validatePassword } from '@/lib/password-policy'
import { sendPasswordChangedEmail } from '@/lib/email'
import {
  checkAuthRateLimit,
  clearAuthRateLimit,
  getClientIp,
  recordFailedAuthAttempt,
  resetPasswordRateKey,
} from '@/lib/auth-rate-limit'
import {
  findPasswordResetToken,
  invalidateUserResetTokens,
} from '@/lib/password-reset-token'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
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

    const passwordCheck = validatePassword(password)
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.errors[0] || 'Password does not meet the password policy' },
        { status: 400 }
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

    const hashedPassword = await bcrypt.hash(password, 12)
    const changedAt = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        email_verified: true,
        must_change_password: false,
        password_changed_at: changedAt,
        updated_at: changedAt,
      })
      .eq('id', resetToken.user_id)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }

    await invalidateUserResetTokens(supabase, resetToken.user_id)

    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, profile_completed, admin_created')
      .eq('id', resetToken.user_id)
      .single()

    if (user?.email) {
      void sendPasswordChangedEmail({
        email: user.email,
        name: user.name || user.email,
      }).catch((error) => {
        console.error('Password changed email failed:', error)
      })
    }

    await clearAuthRateLimit(rateKey)
    return NextResponse.json({
      message: 'Password reset successfully. You can now sign in with your new password.',
      user: user || undefined,
    })
  } catch (error) {
    console.error('Error in POST /api/auth/reset-password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
