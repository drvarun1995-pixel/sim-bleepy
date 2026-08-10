import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import bcrypt from 'bcryptjs'
import {
  DOWNLOAD_UNLOCK_COOKIE,
  DOWNLOAD_UNLOCK_TTL_SECONDS,
  applyFileSecurityHeaders,
  downloadUnlockCookieOptions,
  signAccessToken,
} from '@/lib/secure-file-access'
import {
  checkAuthRateLimit,
  clearAuthRateLimit,
  downloadPasswordRateKey,
  getClientIp,
  ipRateKey,
  recordFailedAuthAttempt,
} from '@/lib/auth-rate-limit'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    }

    const emailKey = downloadPasswordRateKey(session.user.email)
    const ipKey = ipRateKey(getClientIp(request), 'download-password')
    const [emailLimit, ipLimit] = await Promise.all([
      checkAuthRateLimit(emailKey),
      checkAuthRateLimit(ipKey),
    ])
    if (!emailLimit.allowed || !ipLimit.allowed) {
      const retryAfterSeconds =
        emailLimit.retryAfterSeconds || ipLimit.retryAfterSeconds
      return applyFileSecurityHeaders(
        NextResponse.json(
          { error: 'Too many attempts. Please try again later.' },
          {
            status: 429,
            headers: retryAfterSeconds
              ? { 'Retry-After': String(retryAfterSeconds) }
              : undefined,
          }
        )
      )
    }

    const { password } = await request.json()

    if (!password || typeof password !== 'string') {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Password is required' }, { status: 400 })
      )
    }

    const { data: setting, error: settingError } = await supabaseAdmin
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', 'download_password_hash')
      .single()

    if (settingError || !setting) {
      console.error('Error fetching download password:', settingError)
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Download password not configured' }, { status: 500 })
      )
    }

    const isValid = await bcrypt.compare(password, setting.setting_value)
    if (!isValid) {
      await Promise.all([
        recordFailedAuthAttempt(emailKey),
        recordFailedAuthAttempt(ipKey),
      ])
      return applyFileSecurityHeaders(NextResponse.json({ valid: false }))
    }

    await Promise.all([clearAuthRateLimit(emailKey), clearAuthRateLimit(ipKey)])

    const token = signAccessToken(
      { email: session.user.email, purpose: 'download-unlock' },
      DOWNLOAD_UNLOCK_TTL_SECONDS
    )

    const response = NextResponse.json({ valid: true })
    response.cookies.set(
      DOWNLOAD_UNLOCK_COOKIE,
      token,
      downloadUnlockCookieOptions(DOWNLOAD_UNLOCK_TTL_SECONDS)
    )
    return applyFileSecurityHeaders(response)
  } catch (error) {
    console.error('Password verification error:', error)
    return applyFileSecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}

