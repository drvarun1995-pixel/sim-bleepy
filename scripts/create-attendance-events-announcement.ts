/**
 * Create a public announcement covering Aug 2026 attendance / event tooling updates.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/create-attendance-events-announcement.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const TITLE = 'Attendance Analytics, Guest Walk-ins & Smarter Event Tools'

const CONTENT = `
<p>We've shipped a major set of improvements for attendance, guest flows, and event management:</p>
<ul>
  <li><strong>Attendance analytics</strong> — dedicated per-event page with funnels, charts, no-shows, search/filters, and show-rate badges that include guest walk-ins</li>
  <li><strong>Walk-ins &amp; certificates</strong> — walk-in check-in is gated under QR attendance; certificates can be issued when booking <em>or</em> QR is enabled</li>
  <li><strong>Guest links</strong> — signed guest feedback and certificate pages, with original-size PNG certificate attachments in email</li>
  <li><strong>Safer QR &amp; feedback</strong> — expired QR codes are blocked before guests fill the form; feedback-gated certificate wording is clearer in invite emails</li>
  <li><strong>Event editor safeguards</strong> — unsaved-leave confirmation on Add/Edit Event and Smart Bulk Upload; bulk upload now auto-matches formats from Excel</li>
  <li><strong>Event Data cleanup</strong> — bulk delete for organisers and locations (same pattern as speakers)</li>
  <li><strong>System logs</strong> — /logs entries are automatically deleted after 14 days</li>
</ul>
`.trim()

async function main() {
  const { data: author } = await sb
    .from('users')
    .select('id, email, role, name')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle()

  if (!author?.id) {
    throw new Error('No admin user found to attribute the announcement')
  }

  const { data: existing } = await sb
    .from('announcements')
    .select('id, title, created_at, is_active')
    .eq('title', TITLE)
    .order('created_at', { ascending: false })
    .limit(1)

  const payload = {
    content: CONTENT,
    is_active: true,
    priority: 'high' as const,
    target_audience: {
      type: 'all',
      roles: [],
      years: [],
      universities: [],
      specialties: [],
    },
    updated_at: new Date().toISOString(),
  }

  if (existing?.length) {
    await sb.from('announcements').update(payload).eq('id', existing[0].id)
    console.log('Updated existing announcement:', existing[0].id)
    return
  }

  const { data, error } = await sb
    .from('announcements')
    .insert({
      title: TITLE,
      author_id: author.id,
      expires_at: null,
      ...payload,
    })
    .select('id, title, created_at')
    .single()

  if (error) throw error
  console.log('Created announcement:', data)
  console.log(`Author: ${author.name || author.email} (${author.role})`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
