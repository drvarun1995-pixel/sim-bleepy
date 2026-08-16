/**
 * Reformat published FY guide HTML: split long paragraphs and turn
 * comma / semicolon lists into scannable bullets.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/format-all-fy-readable.ts
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/format-all-fy-readable.ts --apply
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { formatReadableHtml } from '../lib/fy-readable-html'

config({ path: '.env.local' })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function countScanLists(html: string) {
  return (html.match(/<(?:ul|ol) class="fy-scan-list">/g) || []).length
}

async function main() {
  const apply = process.argv.includes('--apply')
  const { data: pages, error } = await sb
    .from('fy_pages')
    .select('id, slug, title, content')
    .eq('status', 'published')
    .eq('is_active', true)

  if (error) throw error

  let changed = 0
  let listsAdded = 0
  const samples: string[] = []

  for (const page of pages || []) {
    const original = page.content || ''
    const next = formatReadableHtml(original)
    if (next === original) continue

    const added = countScanLists(next) - countScanLists(original)
    changed += 1
    listsAdded += Math.max(0, added)

    if (samples.length < 12) {
      samples.push(`${page.slug} (+${added} lists, ${next.length - original.length} chars)`)
    }

    console.log(`${apply ? '✓' : '~'} ${page.slug} (+${added} lists)`)

    if (!apply) continue

    const { error: upErr } = await sb
      .from('fy_pages')
      .update({ content: next, updated_at: new Date().toISOString() })
      .eq('id', page.id)
    if (upErr) throw upErr
  }

  console.log(
    `\n${apply ? 'Applied' : 'Dry run'}: pagesChanged=${changed}/${pages?.length || 0} scanListsAdded=${listsAdded}`
  )
  if (samples.length) {
    console.log('Examples:')
    for (const line of samples) console.log(`  ${line}`)
  }
  if (!apply && changed) {
    console.log('\nRe-run with --apply to write these changes.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
