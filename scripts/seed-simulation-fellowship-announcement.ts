/**
 * Create a Simulation Fellowship announcement visible only to admin and CTF.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/seed-simulation-fellowship-announcement.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

config({ path: '.env.local' })

const TITLE = 'Simulation Fellowship checklist'
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  const { data: author, error: authorErr } = await sb
    .from('users')
    .select('id, email')
    .eq('email', 'drvarun1995@gmail.com')
    .maybeSingle()
  if (authorErr) throw authorErr
  if (!author?.id) throw new Error('Admin author not found')

  const { data: existing, error: existingErr } = await sb
    .from('announcements')
    .select('id')
    .eq('title', TITLE)
    .maybeSingle()
  if (existingErr) throw existingErr

  const payload = {
    title: TITLE,
    content: `<p>The Simulation Fellowship checklist is now live for CTF and admin users. Upload evidence against each requirement, then export a ZIP pack when you need it for sign-off.</p><p><a href="/simulation-fellowship">Open Simulation Fellowship</a></p>`,
    author_id: author.id,
    target_audience: {
      type: 'specific',
      roles: ['admin', 'ctf', 'clinical_teaching_fellow'],
      years: [],
      universities: [],
    },
    priority: 'high',
    is_active: true,
    expires_at: null,
    updated_at: new Date().toISOString(),
  }

  if (existing?.id) {
    const { error } = await sb.from('announcements').update(payload).eq('id', existing.id)
    if (error) throw error
    console.log(`updated ${existing.id}`)
    return
  }

  const { data, error } = await sb
    .from('announcements')
    .insert({ id: randomUUID(), ...payload })
    .select('id')
    .single()
  if (error) throw error
  console.log(`created ${data.id}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
