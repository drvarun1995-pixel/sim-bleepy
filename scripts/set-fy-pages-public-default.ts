/**
 * Set requires_auth=false on all FY pages except hard-coded members-only slugs.
 * Run: $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/set-fy-pages-public-default.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { FY_MEMBERS_ONLY_SLUGS } from '../lib/fy-blog-access'

config({ path: '.env.local' })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  const members = [...FY_MEMBERS_ONLY_SLUGS]

  const { data: locked, error: lockErr } = await sb
    .from('fy_pages')
    .update({ requires_auth: true, updated_at: new Date().toISOString() })
    .in('slug', members)
    .select('id, slug')

  if (lockErr) throw lockErr
  console.log('Forced members-only:', locked?.length || 0)

  const { data: pages, error } = await sb.from('fy_pages').select('id, slug, requires_auth')
  if (error) throw error

  let updated = 0
  for (const page of pages || []) {
    if (FY_MEMBERS_ONLY_SLUGS.has(page.slug)) continue
    if (page.requires_auth === false) continue
    const { error: upErr } = await sb
      .from('fy_pages')
      .update({ requires_auth: false, updated_at: new Date().toISOString() })
      .eq('id', page.id)
    if (upErr) throw upErr
    updated += 1
  }

  console.log(`Set public (requires_auth=false): ${updated}`)
  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
