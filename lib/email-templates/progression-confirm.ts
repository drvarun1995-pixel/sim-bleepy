import { EMAIL_SITE, greeting, p, wrapEmailHtml } from '@/lib/email-templates/layout'
import { escapeHtml } from '@/lib/email-templates/layout'

export function buildProgressionConfirmEmail(params: {
  name: string
  fromLabel: string
  toLabel: string
}): { subject: string; html: string } {
  const html = wrapEmailHtml({
    title: 'Your Bleepy year has been updated',
    headline: 'Your year has been updated',
    footerKind: 'learner',
    reasonLine: 'You received this because your Bleepy learner stage was updated.',
    bodyHtml:
      greeting(params.name) +
      p(
        `Your Bleepy learner stage has been moved from <strong>${escapeHtml(params.fromLabel)}</strong> to <strong>${escapeHtml(params.toLabel)}</strong>.`
      ) +
      p(
        `Please check this is correct. If it is not, contact your medical education team or <a href="${EMAIL_SITE}/contact" style="color:#1d4ed8;">support</a>.`
      ),
    ctas: [{ href: `${EMAIL_SITE}/dashboard`, label: 'Open your account' }],
  })
  return { subject: 'Your Bleepy year has been updated', html }
}
