/**
 * Create a public announcement about new Foundation Year resources.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/create-fy-resources-announcement.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const TITLE = 'New Foundation Year guides & resources'

const CONTENT = `
<p>We've added a large set of practical <strong>Foundation Year</strong> guides across Settling at NHS, Working on-calls, Clerking shifts, and Where to seek support — now available under General, FY1, and FY2.</p>
<p>Highlights include:</p>
<ul>
  <li>On-call essentials (what on-call shifts involve, NHS bleep system, DNAR/DNACPR)</li>
  <li>Clerking &amp; clinical skills (ABG, AKI, ECG, IV cannulas, VTE, bladder scan, delusion types)</li>
  <li>Settling into NHS life (jobs, CPD, ALS, pensions, banking, discounts, audits, MRCP tips)</li>
  <li>Basildon Trust Induction for starters (members-only)</li>
  <li>MDT staff roles — who to ask for help</li>
</ul>
<p>Browse them here: <a href="/placements/foundation-year">Foundation Year hub</a>.</p>
`.trim()

async function main() {
  // Prefer an admin author; fall back to any user with a create-capable role
  const { data: author } = await sb
    .from('users')
    .select('id, email, role, name')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle()

  if (!author?.id) {
    throw new Error('No admin user found to attribute the announcement')
  }

  // Avoid duplicate if already created with same title recently
  const { data: existing } = await sb
    .from('announcements')
    .select('id, title, created_at, is_active')
    .eq('title', TITLE)
    .order('created_at', { ascending: false })
    .limit(1)

  if (existing?.length) {
    console.log('Announcement already exists:', existing[0])
    // Ensure active
    await sb
      .from('announcements')
      .update({
        content: CONTENT,
        is_active: true,
        priority: 'high',
        target_audience: {
          type: 'all',
          roles: [],
          years: [],
          universities: [],
          specialties: [],
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing[0].id)
    console.log('Updated existing announcement content.')
    return
  }

  const { data, error } = await sb
    .from('announcements')
    .insert({
      title: TITLE,
      content: CONTENT,
      author_id: author.id,
      target_audience: {
        type: 'all',
        roles: [],
        years: [],
        universities: [],
        specialties: [],
      },
      priority: 'high',
      is_active: true,
      expires_at: null,
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
