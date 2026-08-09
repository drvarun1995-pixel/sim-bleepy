/**
 * Remove WordPress lazy-load SVG placeholder <img> tags from FY page HTML.
 * Run: $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/strip-fy-svg-placeholders.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function stripSvgPlaceholders(html: string): string {
  let out = html
  // Remove img tags whose src is a blank SVG data URI (Jetpack/WP lazy-load spacers)
  out = out.replace(
    /<img\b[^>]*src=["']data:image\/svg\+xml[^"']*["'][^>]*>/gi,
    ''
  )
  // Empty wp-block-image / p wrappers left behind
  out = out.replace(/<div\b[^>]*class="[^"]*wp-block-image[^"]*"[^>]*>\s*<\/div>/gi, '')
  out = out.replace(/<p\b[^>]*>\s*<\/p>/gi, '')
  return out
}

async function main() {
  const { data: pages, error } = await supabase.from('fy_pages').select('id, title, content')
  if (error) throw error

  let updated = 0
  for (const page of pages || []) {
    const original = page.content || ''
    const cleaned = stripSvgPlaceholders(original)
    if (cleaned === original) continue

    const { error: updateError } = await supabase
      .from('fy_pages')
      .update({ content: cleaned, updated_at: new Date().toISOString() })
      .eq('id', page.id)

    if (updateError) {
      console.error('Failed', page.title, updateError.message)
      continue
    }
    updated += 1
    const removed = (original.match(/data:image\/svg\+xml/gi) || []).length
    console.log(`Cleaned ${removed} placeholder(s): ${page.title}`)
  }

  console.log(`Done. Updated ${updated} page(s).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
