import { signAccessToken, verifyAccessToken } from '@/lib/secure-file-access'

export const CERTIFICATE_GUEST_TOKEN_PURPOSE = 'guest-certificate' as const
/** Guests may reopen the email link for a long while after the event */
export const CERTIFICATE_GUEST_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 365 // 1 year

export type CertificateGuestTokenPayload = {
  purpose: typeof CERTIFICATE_GUEST_TOKEN_PURPOSE
  certificateId: string
  userId: string
}

export function signCertificateGuestToken(params: {
  certificateId: string
  userId: string
  ttlSeconds?: number
}): string {
  return signAccessToken(
    {
      purpose: CERTIFICATE_GUEST_TOKEN_PURPOSE,
      certificateId: params.certificateId,
      userId: params.userId,
    },
    params.ttlSeconds ?? CERTIFICATE_GUEST_TOKEN_TTL_SECONDS
  )
}

export function verifyCertificateGuestToken(
  token: string | null | undefined
): CertificateGuestTokenPayload | null {
  const payload = verifyAccessToken<CertificateGuestTokenPayload>(token)
  if (!payload) return null
  if (payload.purpose !== CERTIFICATE_GUEST_TOKEN_PURPOSE) return null
  if (!payload.certificateId || !payload.userId) return null
  return {
    purpose: CERTIFICATE_GUEST_TOKEN_PURPOSE,
    certificateId: payload.certificateId,
    userId: payload.userId,
  }
}

export function buildGuestCertificateUrl(params: {
  certificateId: string
  token: string
  baseUrl?: string
}): string {
  const base = (params.baseUrl || process.env.NEXTAUTH_URL || '').replace(/\/$/, '')
  return `${base}/guest-certificate/${params.certificateId}?token=${encodeURIComponent(params.token)}`
}

export function isWalkInGuestAccount(params: {
  accountOrigin?: string | null
  registrationSource?: string | null
}): boolean {
  return (
    params.accountOrigin === 'walk_in_guest' ||
    params.registrationSource === 'walk_in_guest'
  )
}

/** Dashboard link for signed-in users, or signed guest link for walk-in guests */
export function resolveCertificateEmailAccess(params: {
  certificateId: string
  userId: string
  accountOrigin?: string | null
  registrationSource?: string | null
  baseUrl?: string
}): { viewUrl: string; isGuestAccess: boolean } {
  const base =
    (params.baseUrl ||
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      '')
      .replace(/\/$/, '') || 'https://sim.bleepy.co.uk'

  if (
    isWalkInGuestAccount({
      accountOrigin: params.accountOrigin,
      registrationSource: params.registrationSource,
    })
  ) {
    const token = signCertificateGuestToken({
      certificateId: params.certificateId,
      userId: params.userId,
    })
    return {
      viewUrl: buildGuestCertificateUrl({
        certificateId: params.certificateId,
        token,
        baseUrl: base,
      }),
      isGuestAccess: true,
    }
  }

  return {
    viewUrl: `${base}/mycertificates`,
    isGuestAccess: false,
  }
}
