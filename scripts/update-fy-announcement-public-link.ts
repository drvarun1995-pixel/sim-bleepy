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
<p>We've added a large set of practical <strong>Foundation Year</strong> guides across Settling at NHS, Working on-calls, Clerking shifts, and Where to seek support.</p>
<p>You can read the public guides without signing in here: <a href="/guides/foundation-year">Foundation Year Guides</a>.</p>
<p>Signed-in members also get the full hub (all cohorts) under Placements, including members-only trust induction content.</p>
`.trim()

async function main() {
  const { data, error } = await sb
    .from('announcements')
    .update({
      content: CONTENT,
      updated_at: new Date().toISOString(),
    })
    .eq('title', TITLE)
    .select('id')
  if (error) throw error
  console.log('Updated announcements:', data?.length || 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
