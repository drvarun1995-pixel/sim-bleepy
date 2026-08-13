import { signAccessToken, verifyAccessToken } from '@/lib/secure-file-access'

export const EMAIL_PREFS_TOKEN_PURPOSE = 'email-preferences' as const
/** Long-lived so footer links in old emails still work */
export const EMAIL_PREFS_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 365 // 1 year

export type EmailPrefsTokenPayload = {
  purpose: typeof EMAIL_PREFS_TOKEN_PURPOSE
  userId: string
  email: string
}

function appBaseUrl(baseUrl?: string): string {
  const raw =
    baseUrl ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://sim.bleepy.co.uk'
  // Never embed localhost in outbound email links
  if (/localhost|127\.0\.0\.1/i.test(raw)) {
    return 'https://sim.bleepy.co.uk'
  }
  return raw.replace(/\/$/, '')
}

export function signEmailPrefsToken(params: {
  userId: string
  email: string
  ttlSeconds?: number
}): string {
  return signAccessToken(
    {
      purpose: EMAIL_PREFS_TOKEN_PURPOSE,
      userId: params.userId,
      email: params.email.trim().toLowerCase(),
    },
    params.ttlSeconds ?? EMAIL_PREFS_TOKEN_TTL_SECONDS
  )
}

export function verifyEmailPrefsToken(
  token: string | null | undefined
): EmailPrefsTokenPayload | null {
  const payload = verifyAccessToken<EmailPrefsTokenPayload>(token)
  if (!payload) return null
  if (payload.purpose !== EMAIL_PREFS_TOKEN_PURPOSE) return null
  if (!payload.userId || !payload.email) return null
  return {
    purpose: EMAIL_PREFS_TOKEN_PURPOSE,
    userId: payload.userId,
    email: payload.email.trim().toLowerCase(),
  }
}

export function buildEmailPreferencesUrl(params: {
  token: string
  baseUrl?: string
}): string {
  return `${appBaseUrl(params.baseUrl)}/email-preferences?token=${encodeURIComponent(params.token)}`
}

export function buildUnsubscribeUrl(params: {
  token: string
  baseUrl?: string
}): string {
  return `${appBaseUrl(params.baseUrl)}/unsubscribe?token=${encodeURIComponent(params.token)}`
}

export function buildEmailActionUrls(params: {
  userId: string
  email: string
  baseUrl?: string
}): { preferencesUrl: string; unsubscribeUrl: string; token: string } {
  const token = signEmailPrefsToken({
    userId: params.userId,
    email: params.email,
  })
  return {
    token,
    preferencesUrl: buildEmailPreferencesUrl({ token, baseUrl: params.baseUrl }),
    unsubscribeUrl: buildUnsubscribeUrl({ token, baseUrl: params.baseUrl }),
  }
}
