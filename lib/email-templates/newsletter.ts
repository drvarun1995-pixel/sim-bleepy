/**
 * Weekly Bleepy newsletter. Uses the same Outlook-safe chrome as system emails.
 * Safe for client preview pages — no Node-only imports.
 *
 * Personalized slots (events / FY guides / student practice) are wrapped in
 * <!--BLEEPY:NAME--> markers so the send route can replace them per recipient.
 */

import {
  EMAIL_FONT,
  EMAIL_SITE,
  SOCIAL,
  SOCIAL_ICONS,
  escapeHtml,
  fallbackUrlNote,
  greeting,
  p,
} from '@/lib/email-templates/layout'

export const NEWSLETTER_DRAFT_KEY = 'bleepy.newsletterDraft'

export const NEWSLETTER_SLOTS = {
  events: 'EVENTS',
  persona: 'PERSONA',
} as const

export type NewsletterHighlight = {
  title: string
  text: string
  href?: string
  linkLabel?: string
  imageUrl?: string
}

export type NewsletterEvent = {
  title: string
  when: string
  where?: string
  href?: string
}

export type NewsletterPersonaKind = 'foundation_doctor' | 'medical_student' | 'other'

export function newsletterPersonaKind(user: {
  role_type?: string | null
  role?: string | null
} | null | undefined): NewsletterPersonaKind {
  const type = String(user?.role_type || '').toLowerCase()
  if (type === 'foundation_doctor') return 'foundation_doctor'
  if (type === 'medical_student') return 'medical_student'
  return 'other'
}

export type WeeklyNewsletterData = {
  name?: string
  weekLabel: string
  headline: string
  intro: string
  highlights: NewsletterHighlight[]
  closingNote?: string
  primaryCta?: { href: string; label: string }
  secondaryCta?: { href: string; label: string }
  includeThisWeekEvents?: boolean
  includePersonaSection?: boolean
}

export type NewsletterDraftPayload = {
  subject: string
  html: string
  data?: WeeklyNewsletterData
}

export type NewsletterPersonaPreview = {
  kind: NewsletterPersonaKind
  events?: NewsletterEvent[]
  fyGuides?: NewsletterHighlight[]
  practice?: NewsletterHighlight[]
}

function mondayOf(date: Date): Date {
  const start = new Date(date)
  start.setHours(12, 0, 0, 0)
  const day = start.getDay()
  const offset = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + offset)
  return start
}

function formatDayMonth(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
}

export function formatNewsletterWeekLabel(date = new Date()): string {
  const start = mondayOf(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return `${formatDayMonth(start)} – ${formatDayMonth(end)} ${end.getFullYear()}`
}

export function wrapNewsletterSlot(name: string, innerHtml: string): string {
  return `<!--BLEEPY:${name}-->${innerHtml}<!--/BLEEPY:${name}-->`
}

export function hasNewsletterSlot(html: string, name: string): boolean {
  return html.includes(`<!--BLEEPY:${name}-->`)
}

export function isPersonalizedNewsletterHtml(html: string): boolean {
  return (
    hasNewsletterSlot(html, NEWSLETTER_SLOTS.events) ||
    hasNewsletterSlot(html, NEWSLETTER_SLOTS.persona)
  )
}

export function setNewsletterSlot(html: string, name: string, innerHtml: string): string {
  const pattern = new RegExp(`<!--BLEEPY:${name}-->[\\s\\S]*?<!--/BLEEPY:${name}-->`, 'g')
  if (!pattern.test(html)) return html
  return html.replace(
    new RegExp(`<!--BLEEPY:${name}-->[\\s\\S]*?<!--/BLEEPY:${name}-->`, 'g'),
    wrapNewsletterSlot(name, innerHtml)
  )
}

export function sampleNewsletterEvents(): NewsletterEvent[] {
  return [
    {
      title: 'FY teaching: approach to the unwell patient',
      when: 'Thu 20 Aug · 13:00',
      where: 'Education Centre',
      href: `${EMAIL_SITE}/events-list`,
    },
    {
      title: 'Simulation session',
      when: 'Fri 21 Aug · 09:00',
      where: 'Sim suite',
      href: `${EMAIL_SITE}/events-list`,
    },
  ]
}

export const NEWSLETTER_FY_OG_VERSION = '3'

export function fyGuideEmailImageUrl(topicSlug: string, pageSlug: string): string {
  return `${EMAIL_SITE}/guides/foundation-year/og/${topicSlug}/${pageSlug}.jpg?v=${NEWSLETTER_FY_OG_VERSION}`
}

export function sampleFyGuideHighlights(): NewsletterHighlight[] {
  return [
    {
      title: 'Chest pain on the ward',
      text: 'A practical step-by-step approach when you are called to chest pain.',
      href: `${EMAIL_SITE}/guides/foundation-year/on-calls/foundation-doctor-chest-pain`,
      linkLabel: 'Read the guide',
      imageUrl: fyGuideEmailImageUrl('on-calls', 'foundation-doctor-chest-pain'),
    },
    {
      title: 'ECG basics',
      text: 'A calm sequence for looking at an ECG as an FY doctor.',
      href: `${EMAIL_SITE}/guides/foundation-year/core-investigations/ecg-basics-guide`,
      linkLabel: 'Read the guide',
      imageUrl: fyGuideEmailImageUrl('core-investigations', 'ecg-basics-guide'),
    },
  ]
}

export function sampleStudentPractice(): NewsletterHighlight[] {
  return [
    {
      title: 'AI patient simulator',
      text: 'Take a history with an AI patient. This link opens a random OSCE station.',
      href: `${EMAIL_SITE}/station/random`,
      linkLabel: 'Start a random station',
    },
    {
      title: 'SBA games',
      text: 'Single-best-answer questions at your own pace — useful between jobs or on the commute.',
      href: `${EMAIL_SITE}/games/practice`,
      linkLabel: 'Start SBA practice',
    },
  ]
}

function alsoOnBleepyRows(): NewsletterHighlight[] {
  return [
    {
      title: 'AI patient simulator',
      text: 'Practise OSCE history-taking with an AI patient. Opens a random station each time.',
      href: `${EMAIL_SITE}/station/random`,
      linkLabel: 'Start a random station',
    },
    {
      title: 'SBA games',
      text: 'Single-best-answer questions in Practice mode. Work through a set when you have a spare few minutes.',
      href: `${EMAIL_SITE}/games/practice`,
      linkLabel: 'Start SBA practice',
    },
    {
      title: 'Your certificates',
      text: 'Download records from teaching you have attended.',
      href: `${EMAIL_SITE}/mycertificates`,
      linkLabel: 'Open certificates',
    },
  ]
}

export function defaultWeeklyNewsletter(date = new Date()): WeeklyNewsletterData {
  const weekLabel = formatNewsletterWeekLabel(date)
  return {
    name: '{{firstName}}',
    weekLabel,
    headline: 'This week on Bleepy',
    intro:
      'Your teaching for the next few days is listed below, matched to your year group. We have also included a couple of things worth opening this week.',
    highlights: [],
    closingNote:
      'If a colleague would find Bleepy useful this week, please forward this note or point them to sim.bleepy.co.uk.',
    primaryCta: { href: `${EMAIL_SITE}/dashboard`, label: 'Open Bleepy' },
    secondaryCta: { href: `${EMAIL_SITE}/events-list`, label: 'View events' },
    includeThisWeekEvents: true,
    includePersonaSection: true,
  }
}

function pillCta(href: string, label: string, variant: 'primary' | 'ghost' = 'primary'): string {
  if (variant === 'ghost') {
    return `<a href="${href}" style="display:inline-block;padding:8px 14px;font-family:${EMAIL_FONT};font-size:13px;line-height:18px;font-weight:700;color:#0f766e;text-decoration:none;border:2px solid #0f766e;border-radius:999px;background-color:#ffffff;" rel="noopener noreferrer">${escapeHtml(label)}</a>`
  }
  return `<a href="${href}" style="display:inline-block;padding:10px 18px;font-family:${EMAIL_FONT};font-size:13px;line-height:18px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;background-color:#0f766e;" rel="noopener noreferrer">${escapeHtml(label)}</a>`
}

function sectionCard(title: string, innerHtml: string, accent = '#0f766e'): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 20px 0;border:1px solid #c5e4dc;">
    <tr>
      <td bgcolor="${accent}" style="background-color:${accent};padding:11px 16px;">
        <p style="margin:0;font-family:${EMAIL_FONT};font-size:12px;line-height:16px;letter-spacing:0.1em;text-transform:uppercase;font-weight:700;color:#ffffff;">${escapeHtml(title)}</p>
      </td>
    </tr>
    <tr>
      <td bgcolor="#f7fdfb" style="background-color:#f7fdfb;padding:16px;">
        ${innerHtml}
      </td>
    </tr>
  </table>`
}

function renderGuideCards(items: NewsletterHighlight[]): string {
  return items
    .map((item) => {
      const href = item.href || `${EMAIL_SITE}/guides/foundation-year`
      const image = item.imageUrl
        ? `<tr>
            <td style="padding:0;line-height:0;font-size:0;">
              <a href="${href}" rel="noopener noreferrer" style="display:block;text-decoration:none;">
                <img src="${item.imageUrl}" alt="${escapeHtml(item.title)}" width="552" style="display:block;width:100%;max-width:552px;height:auto;border:0;" />
              </a>
            </td>
          </tr>`
        : ''
      const link = item.linkLabel
        ? `<p style="margin:12px 0 0 0;text-align:center;">${pillCta(href, item.linkLabel)}</p>`
        : ''
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 14px 0;background-color:#ffffff;border:1px solid #d1e7e3;">
        ${image}
        <tr>
          <td align="center" style="padding:14px 16px 16px 16px;text-align:center;">
            <p style="margin:0 0 6px 0;font-family:${EMAIL_FONT};font-size:16px;line-height:22px;font-weight:700;color:#042f2e;text-align:center;">${escapeHtml(item.title)}</p>
            <p style="margin:0;font-family:${EMAIL_FONT};font-size:13px;line-height:20px;color:#4b5563;text-align:center;">${escapeHtml(item.text)}</p>
            ${link}
          </td>
        </tr>
      </table>`
    })
    .join('')
}

function renderTileRows(items: NewsletterHighlight[], accents: string[]): string {
  return items
    .map((item, index) => {
      const accent = accents[index % accents.length]
      const href = item.href || EMAIL_SITE
      const link = item.linkLabel
        ? `<p style="margin:10px 0 0 0;">${pillCta(href, item.linkLabel, 'ghost')}</p>`
        : ''
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 10px 0;background-color:#ffffff;">
        <tr>
          <td width="6" bgcolor="${accent}" style="background-color:${accent};font-size:0;line-height:0;">&nbsp;</td>
          <td style="padding:12px 14px;">
            <p style="margin:0 0 4px 0;font-family:${EMAIL_FONT};font-size:15px;line-height:20px;font-weight:700;color:#042f2e;">${escapeHtml(item.title)}</p>
            <p style="margin:0;font-family:${EMAIL_FONT};font-size:13px;line-height:19px;color:#4b5563;">${escapeHtml(item.text)}</p>
            ${link}
          </td>
        </tr>
      </table>`
    })
    .join('')
}

export function renderNewsletterEventsHtml(events: NewsletterEvent[]): string {
  const visible = events.filter((event) => event.title.trim())
  if (visible.length === 0) {
    return sectionCard(
      'Your teaching this week',
      `<p style="margin:0 0 12px 0;font-family:${EMAIL_FONT};font-size:14px;line-height:22px;color:#374151;">No sessions are listed for you in the next 7 days. New teaching is added through the week — check the calendar in case something appears.</p>${pillCta(`${EMAIL_SITE}/events-list`, 'Open the events calendar', 'ghost')}`
    )
  }

  const rows = visible
    .map((event) => {
      const place = event.where?.trim()
      const link = event.href
        ? `<p style="margin:8px 0 0 0;">${pillCta(event.href, 'Book / details', 'ghost')}</p>`
        : ''
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 10px 0;background-color:#ffffff;">
        <tr>
          <td width="6" bgcolor="#0f766e" style="background-color:#0f766e;font-size:0;line-height:0;">&nbsp;</td>
          <td style="padding:12px 14px;">
            <p style="margin:0 0 4px 0;font-family:${EMAIL_FONT};font-size:11px;line-height:14px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;color:#0f766e;">${escapeHtml(event.when)}</p>
            <p style="margin:0 0 ${place ? '4px' : '0'} 0;font-family:${EMAIL_FONT};font-size:15px;line-height:21px;font-weight:700;color:#042f2e;">${escapeHtml(event.title)}</p>
            ${place ? `<p style="margin:0;font-family:${EMAIL_FONT};font-size:13px;line-height:19px;color:#6b7280;">${escapeHtml(place)}</p>` : ''}
            ${link}
          </td>
        </tr>
      </table>`
    })
    .join('')

  return sectionCard(
    'Your teaching this week',
    `<p style="margin:0 0 12px 0;font-family:${EMAIL_FONT};font-size:12px;line-height:16px;letter-spacing:0.06em;text-transform:uppercase;font-weight:700;color:#0f766e;">Matched to your year group</p>${rows}`
  )
}

export function renderPersonaSectionHtml(
  kind: NewsletterPersonaKind,
  opts?: { fyGuides?: NewsletterHighlight[]; practice?: NewsletterHighlight[] }
): string {
  if (kind === 'foundation_doctor') {
    const items = (opts?.fyGuides || []).filter((item) => item.title.trim())
    if (items.length === 0) return ''
    return sectionCard('Latest Foundation Year guides', renderGuideCards(items), '#115e59')
  }

  if (kind === 'medical_student') {
    const items = (opts?.practice || sampleStudentPractice()).filter((item) => item.title.trim())
    if (items.length === 0) return ''
    return sectionCard('Practice this week', renderTileRows(items, ['#0f766e', '#0369a1']), '#0e7490')
  }

  return sectionCard(
    'For teaching staff',
    renderTileRows(
      [
        {
          title: 'Teaching portfolio',
          text: 'Log sessions and evidence while it is still fresh.',
          href: `${EMAIL_SITE}/teaching-portfolio`,
          linkLabel: 'Open portfolio',
        },
        {
          title: 'Event calendar',
          text: 'See everything coming up across groups.',
          href: `${EMAIL_SITE}/events-list`,
          linkLabel: 'View events',
        },
      ],
      ['#0f766e', '#334155']
    ),
    '#134e4a'
  )
}

function wrapNewsletterHtml(opts: {
  title: string
  headline: string
  weekLabel: string
  bodyHtml: string
  extraBlocksHtml: string
  ctaPrimary: { href: string; label: string }
  ctaSecondary?: { href: string; label: string }
  reasonLine: string
}): string {
  const year = new Date().getFullYear()
  const privacyUrl = `${EMAIL_SITE}/privacy`
  const unsubscribeUrl = `${EMAIL_SITE}/unsubscribe`
  const preferencesUrl = `${EMAIL_SITE}/email-preferences`
  const preheader = `Your Bleepy round-up for ${opts.weekLabel} — teaching, guides and a few minutes of practice.`

  const secondary = opts.ctaSecondary
    ? `<td style="padding-left:10px;">${pillCta(opts.ctaSecondary.href, opts.ctaSecondary.label, 'ghost')}</td>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#d8efe9;font-family:${EMAIL_FONT};color:#111827;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#d8efe9;">${escapeHtml(preheader)}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:#d8efe9;">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;border-collapse:collapse;background-color:#ffffff;">
          <tr>
            <td bgcolor="#042f2e" style="background-color:#042f2e;padding:16px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td valign="middle">
                    <img src="${EMAIL_SITE}/Bleepy-Logo-1-1.webp" alt="" width="32" height="32" style="display:inline-block;vertical-align:middle;width:32px;height:32px;margin-right:10px;border:0;" />
                    <span style="display:inline-block;vertical-align:middle;font-family:${EMAIL_FONT};font-size:18px;line-height:22px;font-weight:700;color:#ffffff;">Bleepy Weekly</span>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display:inline-block;padding:6px 10px;background-color:#0f766e;color:#ecfdf5;font-family:${EMAIL_FONT};font-size:11px;line-height:14px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">${escapeHtml(opts.weekLabel)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td bgcolor="#0f766e" style="background-color:#0f766e;padding:28px 28px 32px 28px;">
              <p style="margin:0 0 10px 0;font-family:${EMAIL_FONT};font-size:11px;line-height:14px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:#99f6e4;">Your weekly round-up</p>
              <h1 style="margin:0;font-family:${EMAIL_FONT};font-size:28px;line-height:34px;font-weight:700;color:#ffffff;">
                ${escapeHtml(opts.headline)}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px 8px 24px;font-family:${EMAIL_FONT};font-size:15px;line-height:24px;color:#1f2937;">
              ${opts.bodyHtml}
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:4px 0 22px 0;">
                <tr>
                  <td>${pillCta(opts.ctaPrimary.href, opts.ctaPrimary.label)}</td>
                  ${secondary}
                </tr>
              </table>
              ${opts.extraBlocksHtml}
            </td>
          </tr>
          <tr>
            <td bgcolor="#042f2e" style="background-color:#042f2e;padding:26px 24px 22px 24px;">
              <p style="margin:0 0 14px 0;font-family:${EMAIL_FONT};font-size:12px;line-height:18px;color:#ccfbf1;">
                <a href="${privacyUrl}" style="color:#ccfbf1;text-decoration:underline;font-family:${EMAIL_FONT};" rel="noopener noreferrer">Privacy Policy</a>
                &nbsp;|&nbsp;
                <a href="${unsubscribeUrl}" style="color:#ccfbf1;text-decoration:underline;font-family:${EMAIL_FONT};" rel="noopener noreferrer">Unsubscribe</a>
                &nbsp;|&nbsp;
                <a href="${preferencesUrl}" style="color:#ccfbf1;text-decoration:underline;font-family:${EMAIL_FONT};" rel="noopener noreferrer">Manage Email Preferences</a>
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:14px;">
                <tr>
                  <td valign="top" style="font-family:${EMAIL_FONT};font-size:12px;line-height:18px;color:#99f6e4;">
                    Bleepy<br />
                    Medical education for NHS learners
                  </td>
                  <td align="right" valign="top">
                    <p style="margin:0 0 8px 0;font-family:${EMAIL_FONT};font-size:12px;line-height:18px;color:#99f6e4;">Follow Bleepy</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="right" style="border-collapse:collapse;">
                      <tr>
                        <td style="padding:0 0 0 8px;">
                          <a href="${SOCIAL.facebook}" style="display:inline-block;width:28px;height:28px;border-radius:14px;background-color:#0f766e;text-align:center;line-height:28px;" rel="noopener noreferrer" aria-label="Facebook">
                            <img src="${SOCIAL_ICONS.facebook}" alt="Facebook" width="14" height="14" style="display:inline-block;vertical-align:middle;border:0;width:14px;height:14px;" />
                          </a>
                        </td>
                        <td style="padding:0 0 0 8px;">
                          <a href="${SOCIAL.instagram}" style="display:inline-block;width:28px;height:28px;border-radius:14px;background-color:#0f766e;text-align:center;line-height:28px;" rel="noopener noreferrer" aria-label="Instagram">
                            <img src="${SOCIAL_ICONS.instagram}" alt="Instagram" width="14" height="14" style="display:inline-block;vertical-align:middle;border:0;width:14px;height:14px;" />
                          </a>
                        </td>
                        <td style="padding:0 0 0 8px;">
                          <a href="${SOCIAL.x}" style="display:inline-block;width:28px;height:28px;border-radius:14px;background-color:#0f766e;text-align:center;line-height:28px;" rel="noopener noreferrer" aria-label="X">
                            <img src="${SOCIAL_ICONS.x}" alt="X" width="14" height="14" style="display:inline-block;vertical-align:middle;border:0;width:14px;height:14px;" />
                          </a>
                        </td>
                        <td style="padding:0 0 0 8px;">
                          <a href="${SOCIAL.linkedin}" style="display:inline-block;width:28px;height:28px;border-radius:14px;background-color:#0f766e;text-align:center;line-height:28px;" rel="noopener noreferrer" aria-label="LinkedIn">
                            <img src="${SOCIAL_ICONS.linkedin}" alt="LinkedIn" width="14" height="14" style="display:inline-block;vertical-align:middle;border:0;width:14px;height:14px;" />
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 12px 0;font-family:${EMAIL_FONT};font-size:11px;line-height:17px;color:#5eead4;">${escapeHtml(opts.reasonLine)}</p>
              <p style="margin:0 0 16px 0;font-family:${EMAIL_FONT};font-size:11px;line-height:16px;color:#99f6e4;">© ${year} Bleepy. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function defaultPersonaPreview(): NewsletterPersonaPreview {
  return {
    kind: 'foundation_doctor',
    events: sampleNewsletterEvents(),
    fyGuides: sampleFyGuideHighlights(),
    practice: sampleStudentPractice(),
  }
}

export function buildWeeklyNewsletterSubject(data: Pick<WeeklyNewsletterData, 'weekLabel'>): string {
  return `Bleepy Weekly · ${data.weekLabel}`
}

export function buildWeeklyNewsletterEmail(
  data: WeeklyNewsletterData,
  persona: NewsletterPersonaPreview = defaultPersonaPreview()
): {
  subject: string
  html: string
} {
  const primary = data.primaryCta || { href: `${EMAIL_SITE}/dashboard`, label: 'Open Bleepy' }
  const secondary = data.secondaryCta
  const includeEvents = data.includeThisWeekEvents !== false
  const includePersona = data.includePersonaSection !== false

  const eventsHtml = includeEvents
    ? wrapNewsletterSlot(
        NEWSLETTER_SLOTS.events,
        renderNewsletterEventsHtml(persona.events || [])
      )
    : ''

  const personaHtml = includePersona
    ? wrapNewsletterSlot(
        NEWSLETTER_SLOTS.persona,
        renderPersonaSectionHtml(persona.kind, {
          fyGuides: persona.fyGuides,
          practice: persona.practice,
        })
      )
    : ''

  return {
    subject: buildWeeklyNewsletterSubject(data),
    html: wrapNewsletterHtml({
      title: buildWeeklyNewsletterSubject(data),
      headline: data.headline || 'This week on Bleepy',
      weekLabel: data.weekLabel,
      reasonLine:
        'You received this weekly round-up because you have a Bleepy account. You can unsubscribe or manage email preferences using the links below.',
      bodyHtml: greeting(data.name || '{{firstName}}') + p(escapeHtml(data.intro)),
      ctaPrimary: primary,
      ctaSecondary: secondary,
      extraBlocksHtml:
        eventsHtml +
        personaHtml +
        sectionCard(
          'Also on Bleepy',
          renderTileRows(alsoOnBleepyRows(), ['#0f766e', '#0369a1', '#334155']),
          '#0e7490'
        ) +
        (data.closingNote
          ? `<p style="margin:4px 0 16px 0;font-family:${EMAIL_FONT};font-size:13px;line-height:20px;color:#6b7280;">${escapeHtml(data.closingNote)}</p>`
          : '') +
        fallbackUrlNote(primary.href),
    }),
  }
}
