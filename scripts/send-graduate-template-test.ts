/**
 * One-off: send the graduate / progression email template to a test inbox.
 * $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/send-graduate-template-test.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

async function main() {
  const TO = process.env.TO || 'drvarun1995@gmail.com'
  const { supabaseAdmin } = await import('@/utils/supabase')
  const { sendCustomHtmlEmail } = await import('@/lib/email')
  const { buildGraduateEmailForUser } = await import('@/lib/email-templates/graduate-alumni-send')
  const {
    buildGraduateEmailHtml,
    buildGraduateEmailSubject,
  } = await import('@/lib/email-templates/graduate-alumni')

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email, name, university')
    .eq('email', TO)
    .maybeSingle()

  let subject: string
  let html: string

  if (user?.id && user.email) {
    const mail = buildGraduateEmailForUser({
      userId: user.id,
      email: user.email,
      name: user.name || 'Varun',
      university: user.university,
      lastStageLabel: 'ARU Year 5',
      cohortLabel: '25-26',
    })
    subject = mail.subject
    html = mail.html
    console.log('Using signed preference/unsubscribe links for', user.email)
  } else {
    const sample = {
      name: 'Varun',
      lastStageLabel: 'ARU Year 5',
      cohortLabel: '25-26',
    }
    subject = buildGraduateEmailSubject(sample)
    html = buildGraduateEmailHtml(sample)
    console.log('No matching user row — sending with default footer links')
  }

  const result = await sendCustomHtmlEmail(TO, `[TEST] ${subject}`, html)
  console.log('Sent to', TO, result)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
