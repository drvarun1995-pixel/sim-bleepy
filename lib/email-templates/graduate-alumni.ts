/**
 * Graduate / alumni email. Uses shared system-email chrome.
 * Safe for client preview pages — no Node-only imports.
 */

import {
  EMAIL_FONT,
  EMAIL_SITE,
  escapeHtml,
  fallbackUrlNote,
  featureRows,
  firstName,
  greeting,
  infoBanner,
  p,
  wrapEmailHtml,
} from '@/lib/email-templates/layout'

export type GraduateEmailData = {
  name: string
  university?: string | null
  lastStageLabel?: string | null
  cohortLabel?: string | null
  recommendUrl?: string
  feedbackUrl?: string
  dashboardUrl?: string
  privacyUrl?: string
  unsubscribeUrl?: string
  preferencesUrl?: string
}

export function buildGraduateEmailSubject(data: Pick<GraduateEmailData, 'name'>): string {
  const first = firstName(data.name)
  return `Congratulations ${first} — thank you for being part of Bleepy`
}

export function buildGraduateEmailHtml(data: GraduateEmailData): string {
  const recommendUrl = data.recommendUrl || `${EMAIL_SITE}/share`
  const feedbackUrl = data.feedbackUrl || `${EMAIL_SITE}/site-feedback?source=graduate-email`
  const dashboardUrl = data.dashboardUrl || `${EMAIL_SITE}/dashboard`

  const stageDetail = data.lastStageLabel
    ? `${data.lastStageLabel}${data.cohortLabel ? ` · cohort ${data.cohortLabel}` : ''}`
    : data.cohortLabel
      ? `cohort ${data.cohortLabel}`
      : 'your student / foundation pathway'

  return wrapEmailHtml({
    title: 'Thank you from Bleepy',
    headline: 'Congratulations and thank you',
    subheadline: stageDetail,
    footerKind: 'learner',
    reasonLine: 'You received this because your Bleepy learner status was updated to graduated.',
    privacyUrl: data.privacyUrl,
    unsubscribeUrl: data.unsubscribeUrl,
    preferencesUrl: data.preferencesUrl,
    bodyHtml:
      greeting(data.name) +
      p(`You have completed your time as <strong>${escapeHtml(stageDetail)}</strong> on Bleepy.`) +
      p(
        'Your account remains available, including certificates, attendance history and previous learning records. You will no longer be included in active student or foundation year groups for cohort tools and new teaching emails.'
      ) +
      p(
        'If Bleepy helped you, please consider recommending it to a colleague or junior doctor starting placement — and share brief feedback so we can improve for the next cohort.'
      ),
    ctas: [
      { href: recommendUrl, label: 'Share Bleepy' },
      { href: feedbackUrl, label: 'Send feedback', variant: 'secondary' },
    ],
    extraBlocksHtml:
      `<p style="margin:0 0 14px 0;font-family:${EMAIL_FONT};font-size:13px;line-height:20px;color:#6b7280;">You can still <a href="${dashboardUrl}" style="color:#1d4ed8;text-decoration:underline;">open your Bleepy account</a> at any time.</p>` +
      infoBanner(
        'Stay connected with Bleepy',
        `<p style="margin:0;">Follow updates for medical students and foundation doctors on <a href="https://www.instagram.com/bleepyuk" style="color:#1d4ed8;text-decoration:underline;">@bleepyuk</a> and keep access to guides at <a href="${EMAIL_SITE}" style="color:#1d4ed8;text-decoration:underline;">sim.bleepy.co.uk</a>.</p>`
      ) +
      infoBanner(
        'Resources',
        featureRows([
          {
            title: 'Foundation Year guides',
            text: 'Practical ward and on-call resources for FY doctors.',
            href: `${EMAIL_SITE}/guides/foundation-year`,
            linkLabel: 'Explore now',
          },
          {
            title: 'Teaching calendar',
            text: 'Browse sessions and keep learning with your trust.',
            href: `${EMAIL_SITE}/events-list`,
            linkLabel: 'View events',
          },
          {
            title: 'Your certificates',
            text: 'Download records from teaching you attended.',
            href: `${EMAIL_SITE}/mycertificates`,
            linkLabel: 'Open certificates',
          },
        ])
      ) +
      fallbackUrlNote(recommendUrl),
  })
}
