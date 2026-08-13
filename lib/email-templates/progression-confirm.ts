import {
  EMAIL_SITE,
  fallbackUrlNote,
  greeting,
  infoBanner,
  p,
  roleChangeCards,
  wrapEmailHtml,
} from '@/lib/email-templates/layout'

export function buildProgressionConfirmEmail(params: {
  name: string
  fromLabel: string
  toLabel: string
}): { subject: string; html: string } {
  const dashboardUrl = `${EMAIL_SITE}/dashboard`
  const html = wrapEmailHtml({
    title: 'Your Bleepy year has been updated',
    headline: 'Your year has been updated',
    subheadline: params.toLabel,
    footerKind: 'learner',
    reasonLine: 'You received this because your Bleepy learner stage was updated.',
    bodyHtml:
      greeting(params.name) +
      p(
        'Your Bleepy learner stage has been updated. Please check this is correct so you stay in the right teaching groups.'
      ) +
      roleChangeCards(params.fromLabel, params.toLabel),
    ctas: [{ href: dashboardUrl, label: 'Open your account' }],
    extraBlocksHtml:
      infoBanner(
        'If this does not look right',
        `<p style="margin:0;">Contact your medical education team or <a href="${EMAIL_SITE}/contact" style="color:#1d4ed8;text-decoration:underline;">Bleepy support</a>.</p>`
      ) + fallbackUrlNote(dashboardUrl),
  })
  return { subject: 'Your Bleepy year has been updated', html }
}
