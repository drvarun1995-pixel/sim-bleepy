/**
 * Move a few general posts that fit "Where to seek support" out of Settling,
 * so that category is not nearly empty. Then run copy-fy-pages-to-cohorts.ts.
 *
 * Moves (general only):
 *   - medical-indemnity-insurance → where-to-seek-support
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/rebalance-fy-support-topic.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const MOVES: Array<{ slug: string; from: string; to: string }> = [
  {
    slug: 'medical-indemnity-insurance',
    from: 'settling-at-nhs',
    to: 'where-to-seek-support',
  },
]

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function topicId(cohort: string, slug: string) {
  const { data, error } = await sb
    .from('fy_topics')
    .select('id')
    .eq('cohort', cohort)
    .eq('slug', slug)
    .single()
  if (error || !data) throw new Error(`Missing topic ${cohort}/${slug}`)
  return data.id as string
}

async function main() {
  for (const move of MOVES) {
    const fromId = await topicId('general', move.from)
    const toId = await topicId('general', move.to)
    const { data: page, error } = await sb
      .from('fy_pages')
      .select('id, title, topic_id')
      .eq('topic_id', fromId)
      .eq('slug', move.slug)
      .maybeSingle()
    if (error) throw error
    if (!page) {
      console.log(`skip (not in ${move.from}): ${move.slug}`)
      continue
    }
    const { error: upErr } = await sb
      .from('fy_pages')
      .update({ topic_id: toId, updated_at: new Date().toISOString() })
      .eq('id', page.id)
    if (upErr) throw upErr
    console.log(`moved ${move.slug}: ${move.from} → ${move.to}`)
  }
  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
