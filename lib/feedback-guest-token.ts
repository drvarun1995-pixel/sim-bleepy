import { signAccessToken, verifyAccessToken } from '@/lib/secure-file-access'

export const FEEDBACK_GUEST_TOKEN_PURPOSE = 'guest-feedback' as const
/** Guests may submit feedback for a while after the session */
export const FEEDBACK_GUEST_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 45 // 45 days

export type FeedbackGuestTokenPayload = {
  purpose: typeof FEEDBACK_GUEST_TOKEN_PURPOSE
  formId: string
  eventId: string
  userId: string
}

export function signFeedbackGuestToken(params: {
  formId: string
  eventId: string
  userId: string
  ttlSeconds?: number
}): string {
  return signAccessToken(
    {
      purpose: FEEDBACK_GUEST_TOKEN_PURPOSE,
      formId: params.formId,
      eventId: params.eventId,
      userId: params.userId,
    },
    params.ttlSeconds ?? FEEDBACK_GUEST_TOKEN_TTL_SECONDS
  )
}

export function verifyFeedbackGuestToken(
  token: string | null | undefined
): FeedbackGuestTokenPayload | null {
  const payload = verifyAccessToken<FeedbackGuestTokenPayload>(token)
  if (!payload) return null
  if (payload.purpose !== FEEDBACK_GUEST_TOKEN_PURPOSE) return null
  if (!payload.formId || !payload.eventId || !payload.userId) return null
  return {
    purpose: FEEDBACK_GUEST_TOKEN_PURPOSE,
    formId: payload.formId,
    eventId: payload.eventId,
    userId: payload.userId,
  }
}

export function buildGuestFeedbackUrl(params: {
  formId: string
  token: string
  baseUrl?: string
}): string {
  const base = (params.baseUrl || process.env.NEXTAUTH_URL || '').replace(/\/$/, '')
  // Outside /feedback so it is not wrapped by the signed-in dashboard layout
  return `${base}/guest-feedback/${params.formId}?token=${encodeURIComponent(params.token)}`
}
