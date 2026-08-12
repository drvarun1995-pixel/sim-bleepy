/**
 * Rename visible "FY1" → "FY" in Foundation Year page titles and body HTML.
 * Protects href/src attribute values so URL slugs like fy1-* stay intact.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/rename-fy1-to-fy-copy.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function rewriteVisibleFy1(text: string): string {
  if (!text) return text
  const protectedChunks: string[] = []
  let out = text.replace(/((?:href|src)=["'][^"']*["'])/gi, (m) => {
    const i = protectedChunks.length
    protectedChunks.push(m)
    return `@@FYPROT${i}@@`
  })

  out = out
    .replace(/\bFoundation Year 1\b/gi, 'Foundation Year')
    .replace(/\bFY1\b/g, 'FY')

  out = out.replace(/@@FYPROT(\d+)@@/g, (_, i) => protectedChunks[Number(i)] || '')
  return out
}

async function main() {
  const { data: pages, error } = await sb
    .from('fy_pages')
    .select('id, slug, title, content')
    .eq('is_active', true)
  if (error) throw error

  let updated = 0
  for (const page of pages || []) {
    const nextTitle = rewriteVisibleFy1(page.title || '')
    const nextContent = rewriteVisibleFy1(page.content || '')
    if (nextTitle === page.title && nextContent === (page.content || '')) continue

    const { error: upErr } = await sb
      .from('fy_pages')
      .update({
        title: nextTitle,
        content: nextContent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', page.id)
    if (upErr) throw upErr
    updated += 1
    console.log(`✓ ${page.slug}`)
    if (nextTitle !== page.title) console.log(`  title: ${page.title} → ${nextTitle}`)
  }

  console.log(`\nUpdated ${updated} page(s).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
