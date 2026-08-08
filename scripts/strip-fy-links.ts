/**
 * Remove <a> hyperlinks from all Foundation Year page HTML (keep text).
 * Run: $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/strip-fy-links.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function stripLinks(html: string): string {
  // Iteratively unwrap anchors (handles nested cases)
  let out = html
  let prev = ''
  while (out !== prev) {
    prev = out
    out = out.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1')
  }
  return out
}

async function main() {
  const { data: pages, error } = await supabase
    .from('fy_pages')
    .select('id, title, content')

  if (error) throw error

  let updated = 0
  for (const page of pages || []) {
    const original = page.content || ''
    const cleaned = stripLinks(original)
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
    console.log('Stripped links:', page.title)
  }

  console.log(`Done. Updated ${updated} page(s).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
