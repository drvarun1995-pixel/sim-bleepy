/**
 * Shared Bleepy system-email chrome (year-progression / graduate look).
 * Safe for client preview pages — no Node-only imports.
 */

export const EMAIL_FONT =
  "Arial, Helvetica, 'Segoe UI', Roboto, sans-serif"

export const EMAIL_SITE = 'https://sim.bleepy.co.uk'

export const SOCIAL = {
  facebook: 'https://www.facebook.com/bleepyuk',
  instagram: 'https://www.instagram.com/bleepyuk',
  linkedin: 'https://www.linkedin.com/company/bleepyuk',
  x: 'https://x.com/bleepyuk',
}

export const SOCIAL_ICONS = {
  facebook:
    'https://cdn-images.mailchimp.com/icons/social-block-v2/outline-light-facebook-48.png',
  instagram:
    'https://cdn-images.mailchimp.com/icons/social-block-v2/outline-light-instagram-48.png',
  x: 'https://cdn-images.mailchimp.com/icons/social-block-v2/outline-light-twitter-48.png',
  linkedin:
    'https://cdn-images.mailchimp.com/icons/social-block-v2/outline-light-linkedin-48.png',
}

export function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** True when HTML is already a full email document (Bleepy chrome), not Tiptap body fragment. */
export function isCompleteEmailHtml(html: string): boolean {
  const trimmed = String(html || '').trim()
  return /^<!DOCTYPE html/i.test(trimmed) || /^<html[\s>]/i.test(trimmed)
}

export function personalizeEmailPlaceholders(
  html: string,
  name: string | null | undefined
): string {
  return String(html || '').replace(/\{\{\s*firstName\s*\}\}/g, escapeHtml(firstName(name)))
}

export function firstName(name: string | null | undefined): string {
  return (name || 'there').trim().split(/\s+/)[0] || 'there'
}

export type EmailCta = {
  href: string
  label: string
  variant?: 'primary' | 'secondary'
}

export type WrapEmailOptions = {
  title: string
  headline: string
  subheadline?: string
  bodyHtml: string
  ctas?: EmailCta[]
  extraBlocksHtml?: string
  footerKind: 'learner' | 'admin'
  privacyUrl?: string
  unsubscribeUrl?: string
  preferencesUrl?: string
  reasonLine?: string
}

function ctaCell(cta: EmailCta): string {
  if (cta.variant === 'secondary') {
    return `<td align="center" style="border-radius:10px;border:2px solid #0f766e;background-color:#ffffff;">
      <a href="${cta.href}" style="display:inline-block;padding:12px 24px;font-family:${EMAIL_FONT};font-size:15px;line-height:20px;font-weight:700;color:#0f766e;text-decoration:none;border-radius:10px;" rel="noopener noreferrer">${escapeHtml(cta.label)}</a>
    </td>`
  }
  return `<td align="center" style="border-radius:10px;background-color:#0f766e;">
    <a href="${cta.href}" style="display:inline-block;padding:14px 26px;font-family:${EMAIL_FONT};font-size:15px;line-height:20px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;" rel="noopener noreferrer">${escapeHtml(cta.label)}</a>
  </td>`
}

export function infoBanner(title: string, innerHtml: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 16px 0;">
    <tr>
      <td style="background-color:#ccfbf1;padding:10px 14px;">
        <p style="margin:0;font-family:${EMAIL_FONT};font-size:14px;line-height:20px;font-weight:700;color:#111827;">${escapeHtml(title)}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:12px 2px 0 2px;">
        <div style="font-family:${EMAIL_FONT};font-size:14px;line-height:22px;color:#374151;">${innerHtml}</div>
      </td>
    </tr>
  </table>`
}

export function featureRows(
  items: Array<{ title: string; text: string; href?: string; linkLabel?: string }>
): string {
  const rows = items
    .map((item, index) => {
      const link =
        item.href && item.linkLabel
          ? `<a href="${item.href}" style="color:#1d4ed8;text-decoration:underline;font-family:${EMAIL_FONT};font-size:13px;" rel="noopener noreferrer">${escapeHtml(item.linkLabel)}</a>`
          : ''
      const border = index === items.length - 1 ? 'none' : '1px solid #e5e7eb'
      return `<tr>
        <td style="padding:12px 0;border-bottom:${border};">
          <p style="margin:0 0 4px 0;font-family:${EMAIL_FONT};font-size:14px;line-height:20px;font-weight:700;color:#111827;">${escapeHtml(item.title)}</p>
          <p style="margin:0 0 ${link ? '6px' : '0'} 0;font-family:${EMAIL_FONT};font-size:13px;line-height:19px;color:#4b5563;">${escapeHtml(item.text)}</p>
          ${link}
        </td>
      </tr>`
    })
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 16px 0;">${rows}</table>`
}

export function roleChangeCards(fromLabel: string, toLabel: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:4px 0 8px 0;">
    <tr>
      <td width="46%" valign="middle" style="background-color:#f3f4f6;padding:16px 12px;text-align:center;">
        <p style="margin:0 0 6px 0;font-family:${EMAIL_FONT};font-size:11px;line-height:14px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;color:#6b7280;">From</p>
        <p style="margin:0;font-family:${EMAIL_FONT};font-size:18px;line-height:24px;font-weight:700;color:#4b5563;">${escapeHtml(fromLabel)}</p>
      </td>
      <td width="8%" align="center" valign="middle" style="font-family:${EMAIL_FONT};font-size:22px;line-height:24px;font-weight:700;color:#0f766e;">→</td>
      <td width="46%" valign="middle" style="background-color:#ccfbf1;padding:16px 12px;text-align:center;">
        <p style="margin:0 0 6px 0;font-family:${EMAIL_FONT};font-size:11px;line-height:14px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;color:#0f766e;">To</p>
        <p style="margin:0;font-family:${EMAIL_FONT};font-size:18px;line-height:24px;font-weight:700;color:#0f766e;">${escapeHtml(toLabel)}</p>
      </td>
    </tr>
  </table>`
}

export function detailBlock(rows: Array<{ label: string; value: string }>): string {
  const items = rows
    .map(
      (row) => `<tr>
        <td style="padding:8px 0;font-family:${EMAIL_FONT};font-size:13px;font-weight:700;color:#6b7280;width:140px;vertical-align:top;">${escapeHtml(row.label)}</td>
        <td style="padding:8px 0;font-family:${EMAIL_FONT};font-size:14px;line-height:21px;color:#111827;">${row.value}</td>
      </tr>`
    )
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 16px 0;">${items}</table>`
}

export function wrapEmailHtml(opts: WrapEmailOptions): string {
  const year = new Date().getFullYear()
  const privacyUrl = opts.privacyUrl || `${EMAIL_SITE}/privacy`
  const unsubscribeUrl = opts.unsubscribeUrl || `${EMAIL_SITE}/unsubscribe`
  const preferencesUrl = opts.preferencesUrl || `${EMAIL_SITE}/email-preferences`
  const ctas = opts.ctas || []

  const ctaRow =
    ctas.length === 0
      ? ''
      : `<tr>
          <td align="center" style="padding:18px 28px 10px 28px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 auto;">
              <tr>
                ${ctas
                  .map((cta, i) => `${i > 0 ? '<td width="12" style="font-size:0;line-height:0;">&nbsp;</td>' : ''}${ctaCell(cta)}`)
                  .join('')}
              </tr>
            </table>
          </td>
        </tr>`

  const extra = opts.extraBlocksHtml
    ? `<tr>
        <td style="padding:8px 28px 8px 28px;">
          <div style="height:3px;line-height:3px;background-color:#0f766e;font-size:0;">&nbsp;</div>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 28px 8px 28px;">${opts.extraBlocksHtml}</td>
      </tr>`
    : ''

  const learnerFooterLinks = `<p style="margin:0 0 14px 0;font-family:${EMAIL_FONT};font-size:12px;line-height:18px;color:#e5e7eb;">
    <a href="${privacyUrl}" style="color:#e5e7eb;text-decoration:underline;font-family:${EMAIL_FONT};" rel="noopener noreferrer">Privacy Policy</a>
    &nbsp;|&nbsp;
    <a href="${unsubscribeUrl}" style="color:#e5e7eb;text-decoration:underline;font-family:${EMAIL_FONT};" rel="noopener noreferrer">Unsubscribe</a>
    &nbsp;|&nbsp;
    <a href="${preferencesUrl}" style="color:#e5e7eb;text-decoration:underline;font-family:${EMAIL_FONT};" rel="noopener noreferrer">Manage Email Preferences</a>
  </p>`

  const adminFooterLinks = `<p style="margin:0 0 14px 0;font-family:${EMAIL_FONT};font-size:12px;line-height:18px;color:#e5e7eb;">
    <a href="${privacyUrl}" style="color:#e5e7eb;text-decoration:underline;font-family:${EMAIL_FONT};" rel="noopener noreferrer">Privacy Policy</a>
    &nbsp;|&nbsp;
    Internal notification
  </p>`

  const reason =
    opts.reasonLine ||
    (opts.footerKind === 'admin'
      ? 'You received this because you are a Bleepy administrator.'
      : 'You received this message because you have a Bleepy account.')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:${EMAIL_FONT};color:#111827;-webkit-font-smoothing:antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;border-collapse:collapse;background-color:#ffffff;">
          <tr>
            <td style="background-color:#111827;padding:18px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td valign="middle" style="font-family:${EMAIL_FONT};font-size:18px;line-height:22px;font-weight:700;color:#ffffff;">
                    <img src="${EMAIL_SITE}/Bleepy-Logo-1-1.webp" alt="" width="28" height="28" style="display:inline-block;vertical-align:middle;width:28px;height:28px;margin-right:10px;border:0;" />
                    <span style="display:inline-block;vertical-align:middle;">Bleepy</span>
                  </td>
                  <td align="right" valign="middle" style="font-family:${EMAIL_FONT};font-size:12px;line-height:16px;color:#9ca3af;">
                    Medical Education
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#0f766e;padding:22px 28px;">
              <h1 style="margin:0;font-family:${EMAIL_FONT};font-size:22px;line-height:30px;font-weight:700;color:#ffffff;">
                ${escapeHtml(opts.headline)}
              </h1>
              ${
                opts.subheadline
                  ? `<p style="margin:8px 0 0 0;font-family:${EMAIL_FONT};font-size:14px;line-height:20px;color:#ccfbf1;">${escapeHtml(opts.subheadline)}</p>`
                  : ''
              }
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px 28px;font-family:${EMAIL_FONT};font-size:15px;line-height:24px;color:#1f2937;">
              ${opts.bodyHtml}
            </td>
          </tr>
          ${ctaRow}
          ${extra}
          <tr>
            <td style="background-color:#1f2937;padding:26px 28px 22px 28px;">
              ${opts.footerKind === 'learner' ? learnerFooterLinks : adminFooterLinks}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:14px;">
                <tr>
                  <td valign="top" style="font-family:${EMAIL_FONT};font-size:12px;line-height:18px;color:#d1d5db;">
                    Bleepy<br />
                    Medical Education platform for NHS learners
                  </td>
                  <td align="right" valign="top">
                    <p style="margin:0 0 8px 0;font-family:${EMAIL_FONT};font-size:12px;line-height:18px;color:#d1d5db;">Follow Bleepy</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="right" style="border-collapse:collapse;">
                      <tr>
                        <td style="padding:0 0 0 8px;">
                          <a href="${SOCIAL.facebook}" style="display:inline-block;width:28px;height:28px;border-radius:14px;background-color:#4b5563;text-align:center;line-height:28px;" rel="noopener noreferrer" aria-label="Facebook">
                            <img src="${SOCIAL_ICONS.facebook}" alt="Facebook" width="14" height="14" style="display:inline-block;vertical-align:middle;border:0;width:14px;height:14px;" />
                          </a>
                        </td>
                        <td style="padding:0 0 0 8px;">
                          <a href="${SOCIAL.instagram}" style="display:inline-block;width:28px;height:28px;border-radius:14px;background-color:#4b5563;text-align:center;line-height:28px;" rel="noopener noreferrer" aria-label="Instagram">
                            <img src="${SOCIAL_ICONS.instagram}" alt="Instagram" width="14" height="14" style="display:inline-block;vertical-align:middle;border:0;width:14px;height:14px;" />
                          </a>
                        </td>
                        <td style="padding:0 0 0 8px;">
                          <a href="${SOCIAL.x}" style="display:inline-block;width:28px;height:28px;border-radius:14px;background-color:#4b5563;text-align:center;line-height:28px;" rel="noopener noreferrer" aria-label="X">
                            <img src="${SOCIAL_ICONS.x}" alt="X" width="14" height="14" style="display:inline-block;vertical-align:middle;border:0;width:14px;height:14px;" />
                          </a>
                        </td>
                        <td style="padding:0 0 0 8px;">
                          <a href="${SOCIAL.linkedin}" style="display:inline-block;width:28px;height:28px;border-radius:14px;background-color:#4b5563;text-align:center;line-height:28px;" rel="noopener noreferrer" aria-label="LinkedIn">
                            <img src="${SOCIAL_ICONS.linkedin}" alt="LinkedIn" width="14" height="14" style="display:inline-block;vertical-align:middle;border:0;width:14px;height:14px;" />
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 12px 0;font-family:${EMAIL_FONT};font-size:11px;line-height:17px;color:#9ca3af;">${escapeHtml(reason)}</p>
              <p style="margin:0 0 14px 0;font-family:${EMAIL_FONT};font-size:11px;line-height:17px;color:#d1d5db;">
                <a href="${EMAIL_SITE}/guides/foundation-year" style="color:#d1d5db;text-decoration:underline;" rel="noopener noreferrer">Foundation Year</a>
                &nbsp;|&nbsp;
                <a href="${EMAIL_SITE}/events-list" style="color:#d1d5db;text-decoration:underline;" rel="noopener noreferrer">Events</a>
                &nbsp;|&nbsp;
                <a href="${EMAIL_SITE}/games" style="color:#d1d5db;text-decoration:underline;" rel="noopener noreferrer">Games</a>
                &nbsp;|&nbsp;
                <a href="${EMAIL_SITE}/stations" style="color:#d1d5db;text-decoration:underline;" rel="noopener noreferrer">OSCE Stations</a>
                &nbsp;|&nbsp;
                <a href="${EMAIL_SITE}/contact" style="color:#d1d5db;text-decoration:underline;" rel="noopener noreferrer">Contact</a>
              </p>
              <p style="margin:0 0 16px 0;font-family:${EMAIL_FONT};font-size:11px;line-height:16px;color:#9ca3af;">© ${year} Bleepy. All rights reserved.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td valign="middle" style="padding-right:10px;">
                    <img src="${EMAIL_SITE}/Bleepy-Logo-1-1.webp" alt="" width="24" height="24" style="display:block;width:24px;height:24px;border:0;" />
                  </td>
                  <td valign="middle" style="font-family:${EMAIL_FONT};font-size:13px;line-height:18px;font-weight:700;color:#ffffff;">Bleepy</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
<script>
function bleepyCopy(text, el, evt) {
  if (evt) { evt.preventDefault(); evt.stopPropagation(); }
  function mark(msg) {
    var hint = document.getElementById('bleepy-copy-status') || document.getElementById('bleepy-copy-hint');
    if (hint) hint.textContent = msg;
  }
  if (el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      mark('Copied to clipboard.');
    }).catch(function () {
      mark('Selected — press Ctrl+C (or Cmd+C) to copy.');
    });
  } else {
    mark('Selected — press Ctrl+C (or Cmd+C) to copy.');
  }
  return false;
}
</script>
</body>
</html>`
}

export function p(html: string): string {
  return `<p style="margin:0 0 14px 0;font-family:${EMAIL_FONT};font-size:15px;line-height:24px;color:#1f2937;">${html}</p>`
}

export function greeting(name: string): string {
  return `<p style="margin:0 0 16px 0;font-family:${EMAIL_FONT};font-size:16px;line-height:24px;color:#111827;">Hi ${escapeHtml(firstName(name))},</p>`
}

export function copyableText(value: string): string {
  const safe = escapeHtml(value)
  const js = JSON.stringify(value)
  return `<span role="button" tabindex="0" onclick="return bleepyCopy(${js}, this, event);" onkeydown="if(event.key==='Enter'||event.key===' '){return bleepyCopy(${js}, this, event);}" style="cursor:pointer;word-break:break-all;-webkit-user-select:all;user-select:all;font-family:Consolas,Monaco,monospace;font-size:13px;line-height:18px;font-weight:700;color:#111827;text-decoration:underline;text-decoration-style:dotted;">${safe}</span>`
}

export function fallbackUrlNote(url: string): string {
  const safeUrl = escapeHtml(url)
  const jsUrl = JSON.stringify(url)
  return `<p style="margin:0 0 8px 0;font-family:${EMAIL_FONT};font-size:13px;line-height:20px;color:#6b7280;">If the button does not work, use this link:</p>
    <p style="margin:0;">
      <a href="${safeUrl}" onclick="return bleepyCopy(${jsUrl}, this, event);" style="cursor:pointer;word-break:break-all;-webkit-user-select:all;user-select:all;font-family:Consolas,Monaco,monospace;font-size:12px;line-height:18px;color:#1d4ed8;text-decoration:underline;">${safeUrl}</a>
    </p>
    <p id="bleepy-copy-hint" style="margin:6px 0 0 0;font-family:${EMAIL_FONT};font-size:12px;line-height:18px;color:#6b7280;">Click to copy. If that does not work, paste the link into your browser.</p>`
}

export function bulletList(items: string[]): string {
  return `<ul style="margin:0 0 14px 0;padding-left:20px;font-family:${EMAIL_FONT};font-size:15px;line-height:24px;color:#1f2937;">${items
    .map((item) => `<li style="margin-bottom:6px;">${item}</li>`)
    .join('')}</ul>`
}
