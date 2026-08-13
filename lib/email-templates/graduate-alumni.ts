/**
 * Temporary graduate / alumni email template (preview + future send).
 * Professional layout inspired by clinical publisher email footers.
 *
 * Keep this module free of next/headers / Node-only deps — the preview page
 * imports it from a Client Component.
 */

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

const FONT =
  "Arial, Helvetica, 'Segoe UI', Roboto, sans-serif"

const SITE = 'https://sim.bleepy.co.uk'
const SOCIAL = {
  facebook: 'https://www.facebook.com/bleepyuk',
  instagram: 'https://www.instagram.com/bleepyuk',
  linkedin: 'https://www.linkedin.com/company/bleepyuk',
  x: 'https://x.com/bleepyuk',
}

/** Light outline icons (Mailchimp social pack) — readable on dark footers */
const SOCIAL_ICONS = {
  facebook:
    'https://cdn-images.mailchimp.com/icons/social-block-v2/outline-light-facebook-48.png',
  instagram:
    'https://cdn-images.mailchimp.com/icons/social-block-v2/outline-light-instagram-48.png',
  x: 'https://cdn-images.mailchimp.com/icons/social-block-v2/outline-light-twitter-48.png',
  linkedin:
    'https://cdn-images.mailchimp.com/icons/social-block-v2/outline-light-linkedin-48.png',
}

export function buildGraduateEmailSubject(data: Pick<GraduateEmailData, 'name'>): string {
  const first = (data.name || 'there').trim().split(/\s+/)[0] || 'there'
  return `Congratulations ${first} — thank you for being part of Bleepy`
}

function linkStyle(color = '#1d4ed8') {
  return `color:${color};text-decoration:underline;font-family:${FONT};`
}

export function buildGraduateEmailHtml(data: GraduateEmailData): string {
  const firstName = (data.name || 'there').trim().split(/\s+/)[0] || 'there'
  const recommendUrl = data.recommendUrl || `${SITE}/share`
  const feedbackUrl =
    data.feedbackUrl || `${SITE}/site-feedback?source=graduate-email`
  const dashboardUrl = data.dashboardUrl || `${SITE}/dashboard`
  const privacyUrl = data.privacyUrl || `${SITE}/privacy`
  // Prefer per-recipient signed URLs from buildEmailActionUrls when sending
  const unsubscribeUrl = data.unsubscribeUrl || `${SITE}/unsubscribe`
  const preferencesUrl = data.preferencesUrl || `${SITE}/email-preferences`
  const year = new Date().getFullYear()

  const stageDetail = data.lastStageLabel
    ? `${data.lastStageLabel}${data.cohortLabel ? ` · cohort ${data.cohortLabel}` : ''}`
    : data.cohortLabel
      ? `cohort ${data.cohortLabel}`
      : 'your student / foundation pathway'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Thank you from Bleepy</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:${FONT};color:#111827;-webkit-font-smoothing:antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;border-collapse:collapse;background-color:#ffffff;">

          <!-- Top brand bar -->
          <tr>
            <td style="background-color:#111827;padding:18px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td valign="middle" style="font-family:${FONT};font-size:18px;line-height:22px;font-weight:700;color:#ffffff;">
                    <img src="${SITE}/Bleepy-Logo-1-1.webp" alt="" width="28" height="28" style="display:inline-block;vertical-align:middle;width:28px;height:28px;margin-right:10px;border:0;" />
                    <span style="display:inline-block;vertical-align:middle;">Bleepy</span>
                  </td>
                  <td align="right" valign="middle" style="font-family:${FONT};font-size:12px;line-height:16px;color:#9ca3af;">
                    Medical Education
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Headline strip -->
          <tr>
            <td style="background-color:#0f766e;padding:22px 28px;">
              <h1 style="margin:0;font-family:${FONT};font-size:22px;line-height:30px;font-weight:700;color:#ffffff;">
                Congratulations and thank you
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 28px 8px 28px;">
              <p style="margin:0 0 16px 0;font-family:${FONT};font-size:16px;line-height:24px;color:#111827;">
                Hi ${firstName},
              </p>
              <p style="margin:0 0 14px 0;font-family:${FONT};font-size:15px;line-height:24px;color:#1f2937;">
                You have completed your time as <strong>${stageDetail}</strong> on Bleepy.
              </p>
              <p style="margin:0 0 14px 0;font-family:${FONT};font-size:15px;line-height:24px;color:#1f2937;">
                Your account remains available, including certificates, attendance history and previous learning records. You will no longer be included in active student or foundation year groups for cohort tools and new teaching emails.
              </p>
              <p style="margin:0 0 6px 0;font-family:${FONT};font-size:15px;line-height:24px;color:#1f2937;">
                If Bleepy helped you, please consider recommending it to a colleague or junior doctor starting placement — and share brief feedback so we can improve for the next cohort.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:22px 28px 10px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 auto;">
                <tr>
                  <td align="center" style="border-radius:10px;background-color:#0f766e;">
                    <a href="${recommendUrl}" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:15px;line-height:20px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;" rel="noopener noreferrer">Share Bleepy</a>
                  </td>
                  <td width="12" style="font-size:0;line-height:0;">&nbsp;</td>
                  <td align="center" style="border-radius:10px;border:2px solid #0f766e;background-color:#ffffff;">
                    <a href="${feedbackUrl}" style="display:inline-block;padding:12px 24px;font-family:${FONT};font-size:15px;line-height:20px;font-weight:700;color:#0f766e;text-decoration:none;border-radius:10px;" rel="noopener noreferrer">Send feedback</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:4px 28px 8px 28px;">
              <a href="${dashboardUrl}" style="font-family:${FONT};font-size:14px;line-height:20px;font-weight:600;color:#0f766e;text-decoration:underline;" rel="noopener noreferrer">Open your Bleepy account</a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:24px 28px 0 28px;">
              <div style="height:3px;line-height:3px;background-color:#0f766e;font-size:0;">&nbsp;</div>
            </td>
          </tr>

          <!-- Info banner block (publisher-style) -->
          <tr>
            <td style="padding:20px 28px 8px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td style="background-color:#ccfbf1;padding:10px 14px;">
                    <p style="margin:0;font-family:${FONT};font-size:14px;line-height:20px;font-weight:700;color:#111827;">
                      Stay connected with Bleepy
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 2px 0 2px;">
                    <p style="margin:0;font-family:${FONT};font-size:14px;line-height:22px;color:#374151;">
                      Follow updates for medical students and foundation doctors on
                      <a href="${SOCIAL.instagram}" style="${linkStyle()}" rel="noopener noreferrer">@bleepyuk</a>
                      and keep access to guides at
                      <a href="${SITE}" style="${linkStyle()}" rel="noopener noreferrer">sim.bleepy.co.uk</a>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px 8px 28px;">
              <div style="height:3px;line-height:3px;background-color:#0f766e;font-size:0;">&nbsp;</div>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 28px 28px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td style="background-color:#ccfbf1;padding:10px 14px;">
                    <p style="margin:0;font-family:${FONT};font-size:14px;line-height:20px;font-weight:700;color:#111827;">
                      Resources
                    </p>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-top:14px;">
                <tr>
                  <td width="33%" valign="top" style="padding:0 10px 0 0;">
                    <p style="margin:0 0 6px 0;font-family:${FONT};font-size:14px;line-height:20px;font-weight:700;color:#111827;">Foundation Year guides</p>
                    <p style="margin:0 0 8px 0;font-family:${FONT};font-size:13px;line-height:19px;color:#4b5563;">Practical ward and on-call resources for FY doctors.</p>
                    <a href="${SITE}/guides/foundation-year" style="${linkStyle()};font-size:13px;" rel="noopener noreferrer">Explore now</a>
                  </td>
                  <td width="33%" valign="top" style="padding:0 10px;">
                    <p style="margin:0 0 6px 0;font-family:${FONT};font-size:14px;line-height:20px;font-weight:700;color:#111827;">Teaching calendar</p>
                    <p style="margin:0 0 8px 0;font-family:${FONT};font-size:13px;line-height:19px;color:#4b5563;">Browse sessions and keep learning with your trust.</p>
                    <a href="${SITE}/events-list" style="${linkStyle()};font-size:13px;" rel="noopener noreferrer">View events</a>
                  </td>
                  <td width="33%" valign="top" style="padding:0 0 0 10px;">
                    <p style="margin:0 0 6px 0;font-family:${FONT};font-size:14px;line-height:20px;font-weight:700;color:#111827;">Your certificates</p>
                    <p style="margin:0 0 8px 0;font-family:${FONT};font-size:13px;line-height:19px;color:#4b5563;">Download records from teaching you attended.</p>
                    <a href="${SITE}/mycertificates" style="${linkStyle()};font-size:13px;" rel="noopener noreferrer">Open certificates</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Professional dark footer -->
          <tr>
            <td style="background-color:#1f2937;padding:26px 28px 22px 28px;">
              <p style="margin:0 0 14px 0;font-family:${FONT};font-size:12px;line-height:18px;color:#e5e7eb;">
                <a href="${privacyUrl}" style="color:#e5e7eb;text-decoration:underline;font-family:${FONT};" rel="noopener noreferrer">Privacy Policy</a>
                &nbsp;|&nbsp;
                <a href="${unsubscribeUrl}" style="color:#e5e7eb;text-decoration:underline;font-family:${FONT};" rel="noopener noreferrer">Unsubscribe</a>
                &nbsp;|&nbsp;
                <a href="${preferencesUrl}" style="color:#e5e7eb;text-decoration:underline;font-family:${FONT};" rel="noopener noreferrer">Manage Email Preferences</a>
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:14px;">
                <tr>
                  <td valign="top" style="font-family:${FONT};font-size:12px;line-height:18px;color:#d1d5db;">
                    Bleepy<br />
                    Medical Education platform for NHS learners
                  </td>
                  <td align="right" valign="top">
                    <p style="margin:0 0 8px 0;font-family:${FONT};font-size:12px;line-height:18px;color:#d1d5db;">
                      Follow Bleepy
                    </p>
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

              <p style="margin:0 0 12px 0;font-family:${FONT};font-size:11px;line-height:17px;color:#9ca3af;">
                You received this message because your Bleepy learner status was updated to graduated.
              </p>

              <p style="margin:0 0 14px 0;font-family:${FONT};font-size:11px;line-height:17px;color:#d1d5db;">
                <a href="${SITE}/guides/foundation-year" style="color:#d1d5db;text-decoration:underline;" rel="noopener noreferrer">Foundation Year</a>
                &nbsp;|&nbsp;
                <a href="${SITE}/events-list" style="color:#d1d5db;text-decoration:underline;" rel="noopener noreferrer">Events</a>
                &nbsp;|&nbsp;
                <a href="${SITE}/games" style="color:#d1d5db;text-decoration:underline;" rel="noopener noreferrer">Games</a>
                &nbsp;|&nbsp;
                <a href="${SITE}/stations" style="color:#d1d5db;text-decoration:underline;" rel="noopener noreferrer">OSCE Stations</a>
                &nbsp;|&nbsp;
                <a href="${SITE}/contact" style="color:#d1d5db;text-decoration:underline;" rel="noopener noreferrer">Contact</a>
              </p>

              <p style="margin:0 0 16px 0;font-family:${FONT};font-size:11px;line-height:16px;color:#9ca3af;">
                © ${year} Bleepy. All rights reserved.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td valign="middle" style="padding-right:10px;">
                    <img src="${SITE}/Bleepy-Logo-1-1.webp" alt="" width="24" height="24" style="display:block;width:24px;height:24px;border:0;" />
                  </td>
                  <td valign="middle" style="font-family:${FONT};font-size:13px;line-height:18px;font-weight:700;color:#ffffff;">
                    Bleepy
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <p style="margin:14px 0 0 0;font-family:${FONT};font-size:11px;line-height:16px;color:#9ca3af;text-align:center;">
          Temporary template preview — not sent automatically yet.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}
