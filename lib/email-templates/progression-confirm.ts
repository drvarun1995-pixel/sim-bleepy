const FONT = "Arial, Helvetica, 'Segoe UI', Roboto, sans-serif"
const SITE = 'https://sim.bleepy.co.uk'

export function buildProgressionConfirmEmail(params: {
  name: string
  fromLabel: string
  toLabel: string
}): { subject: string; html: string } {
  const first = (params.name || 'there').trim().split(/\s+/)[0] || 'there'
  const subject = `Your Bleepy year has been updated`
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:${FONT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" style="max-width:600px;border-collapse:collapse;background:#ffffff;">
          <tr>
            <td style="background:#111827;padding:18px 28px;font-family:${FONT};font-size:18px;font-weight:700;color:#ffffff;">
              Bleepy
            </td>
          </tr>
          <tr>
            <td style="background:#0f766e;padding:18px 28px;font-family:${FONT};font-size:20px;font-weight:700;color:#ffffff;">
              Your year has been updated
            </td>
          </tr>
          <tr>
            <td style="padding:28px;font-family:${FONT};font-size:15px;line-height:24px;color:#1f2937;">
              <p style="margin:0 0 14px 0;">Hi ${first},</p>
              <p style="margin:0 0 14px 0;">
                Your Bleepy learner stage has been moved from
                <strong>${params.fromLabel}</strong> to <strong>${params.toLabel}</strong>.
              </p>
              <p style="margin:0 0 14px 0;">
                Please check this is correct. If it is not, contact your medical education team or
                <a href="${SITE}/contact" style="color:#1d4ed8;">support</a>.
              </p>
              <p style="margin:18px 0 0 0;">
                <a href="${SITE}/dashboard" style="display:inline-block;padding:12px 20px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700;border-radius:8px;">Open your account</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  return { subject, html }
}
