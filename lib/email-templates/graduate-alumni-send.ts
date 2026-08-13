/**
 * Server-only graduate email builder (signed preference / unsubscribe links).
 * Do not import from Client Components — uses HMAC signing.
 */

import { buildEmailActionUrls } from '@/lib/email-preference-token'
import {
  buildGraduateEmailHtml,
  buildGraduateEmailSubject,
  type GraduateEmailData,
} from '@/lib/email-templates/graduate-alumni'

const SITE = 'https://sim.bleepy.co.uk'

/** Build subject + HTML with per-recipient signed unsubscribe / preference links. */
export function buildGraduateEmailForUser(params: {
  userId: string
  email: string
  name: string
  university?: string | null
  lastStageLabel?: string | null
  cohortLabel?: string | null
}): { subject: string; html: string; preferencesUrl: string; unsubscribeUrl: string } {
  const { preferencesUrl, unsubscribeUrl } = buildEmailActionUrls({
    userId: params.userId,
    email: params.email,
  })
  const data: GraduateEmailData = {
    name: params.name,
    university: params.university,
    lastStageLabel: params.lastStageLabel,
    cohortLabel: params.cohortLabel,
    recommendUrl: `${SITE}/share`,
    feedbackUrl: `${SITE}/site-feedback?source=graduate-email`,
    preferencesUrl,
    unsubscribeUrl,
  }
  return {
    subject: buildGraduateEmailSubject(data),
    html: buildGraduateEmailHtml(data),
    preferencesUrl,
    unsubscribeUrl,
  }
}
