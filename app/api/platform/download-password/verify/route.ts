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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return applyFileSecurityHeaders(NextResponse.json({ valid: false }))
    }

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

