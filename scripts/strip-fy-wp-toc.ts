/**
 * Remove WordPress Easy TOC / similar plugin blocks from FY page HTML.
 * Run: $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/strip-fy-wp-toc.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const TOC_MARKERS = [/ez-toc/i, /id=["']toc_container/i, /lwptoc/i, /class=["'][^"']*toc-container/i]

function hasWpToc(html: string): boolean {
  return TOC_MARKERS.some((re) => re.test(html))
}

/** Remove a balanced element starting at `start` (index of '<'). */
function removeBalancedElement(html: string, start: number): string | null {
  if (html[start] !== '<') return null
  const tagMatch = html.slice(start).match(/^<\/?([a-zA-Z][\w:-]*)/)
  if (!tagMatch || html[start + 1] === '/') return null
  const tag = tagMatch[1].toLowerCase()

  let i = start
  let depth = 0
  while (i < html.length) {
    const next = html.indexOf('<', i)
    if (next === -1) return null
    const slice = html.slice(next)
    const open = slice.match(new RegExp(`^<${tag}\\b[^>]*>`, 'i'))
    const close = slice.match(new RegExp(`^</${tag}\\s*>`, 'i'))
    const selfClosing = slice.match(new RegExp(`^<${tag}\\b[^>]*/>`, 'i'))

    if (selfClosing) {
      if (depth === 0) {
        return html.slice(0, start) + html.slice(next + selfClosing[0].length)
      }
      i = next + selfClosing[0].length
      continue
    }
    if (open) {
      depth += 1
      i = next + open[0].length
      continue
    }
    if (close) {
      depth -= 1
      i = next + close[0].length
      if (depth === 0) {
        return html.slice(0, start) + html.slice(i)
      }
      continue
    }
    i = next + 1
  }
  return null
}

function stripWpToc(html: string): string {
  let out = html

  // Prefer removing the known Easy TOC root container as a balanced div
  const rootPatterns = [
    /<div\b[^>]*\bid=["']ez-toc-container["'][^>]*>/i,
    /<div\b[^>]*\bclass=["'][^"']*\bez-toc(?:-container)?\b[^"']*["'][^>]*>/i,
    /<div\b[^>]*\bid=["']toc_container["'][^>]*>/i,
    /<div\b[^>]*\bclass=["'][^"']*\blwptoc\b[^"']*["'][^>]*>/i,
  ]

  let guard = 0
  while (guard < 20) {
    guard += 1
    let removed = false
    for (const re of rootPatterns) {
      const match = out.match(re)
      if (!match || match.index === undefined) continue
      const next = removeBalancedElement(out, match.index)
      if (next !== null && next !== out) {
        out = next
        removed = true
        break
      }
    }
    if (!removed) break
  }

  // Fallback: strip any remaining ez-toc-labelled blocks / scripts / styles
  out = out.replace(/<script\b[^>]*ez-toc[^>]*>[\s\S]*?<\/script>/gi, '')
  out = out.replace(/<style\b[^>]*ez-toc[^>]*>[\s\S]*?<\/style>/gi, '')
  out = out.replace(/<!--\s*ez-toc[\s\S]*?-->/gi, '')

  // Empty heading anchors injected by Easy TOC
  out = out.replace(
    /<span\b[^>]*class=["'][^"']*\bez-toc-section(?:-end)?\b[^"']*["'][^>]*>\s*<\/span>/gi,
    ''
  )
  // Any remaining ez-toc spans (unwrap if they somehow contain text)
  out = out.replace(
    /<span\b[^>]*class=["'][^"']*\bez-toc-[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi,
    '$1'
  )

  // Clean empty wrappers left behind
  out = out.replace(/<p\b[^>]*>\s*<\/p>/gi, '')
  out = out.replace(/\n{3,}/g, '\n\n')
  return out
}

async function main() {
  const { data: pages, error } = await supabase.from('fy_pages').select('id, title, slug, content')
  if (error) throw error

  console.log(`Scanning ${(pages || []).length} FY page(s)...`)

  const hits: { title: string; slug: string }[] = []
  let updated = 0

  for (const page of pages || []) {
    const original = page.content || ''
    if (!hasWpToc(original)) continue
    hits.push({ title: page.title, slug: page.slug })

    const cleaned = stripWpToc(original)
    if (cleaned === original) {
      console.warn(`Detected TOC markers but strip made no change: ${page.title}`)
      continue
    }
    if (hasWpToc(cleaned)) {
      console.warn(`TOC markers remain after strip: ${page.title}`)
    }

    const { error: updateError } = await supabase
      .from('fy_pages')
      .update({ content: cleaned, updated_at: new Date().toISOString() })
      .eq('id', page.id)

    if (updateError) {
      console.error('Failed', page.title, updateError.message)
      continue
    }
    updated += 1
    console.log(`Removed WP TOC: ${page.title} (${page.slug})`)
  }

  if (hits.length === 0) {
    console.log('No WordPress TOC blocks found in stored FY content.')
  } else {
    console.log(`Found TOC in ${hits.length} page(s); updated ${updated}.`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
