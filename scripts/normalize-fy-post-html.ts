/**
 * Normalize Foundation Year HTML to match clean FY guide formatting:
 * - Convert Ultimate Blocks black advanced headings → plain h2/h3
 * - Remove Ultimate Blocks dividers and buttons (e.g. Download This Sheet)
 * - Strip leftover WP decorative wrappers / empty blocks
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/normalize-fy-post-html.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

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
      if (depth === 0) return html.slice(0, start) + html.slice(next + selfClosing[0].length)
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
      if (depth === 0) return html.slice(0, start) + html.slice(i)
      continue
    }
    i = next + 1
  }
  return null
}

function removeAllMatchingRoots(html: string, openTagRe: RegExp, max = 80): string {
  let out = html
  let guard = 0
  while (guard < max) {
    guard += 1
    const match = out.match(openTagRe)
    if (!match || match.index === undefined) break
    const next = removeBalancedElement(out, match.index)
    if (next === null || next === out) {
      // Fallback: delete just the opening tag match span if unbalanced
      out = out.slice(0, match.index) + out.slice(match.index + match[0].length)
      continue
    }
    out = next
  }
  return out
}

function normalizeHeading(tag: string, innerHtml: string, existingId?: string): string {
  const text = innerHtml
    .replace(/<\/?strong>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return ''
  const idAttr = existingId ? ` id="${existingId.replace(/"/g, '')}"` : ''
  return `<${tag}${idAttr}>${text}</${tag}>`
}

function normalizeFyHtml(html: string): string {
  let out = html

  // Remove Ultimate Blocks dividers
  out = removeAllMatchingRoots(
    out,
    /<div\b[^>]*(?:class=["'][^"']*\bub_divider\b[^"']*["']|id=["']ub_divider_[^"']+["'])[^>]*>/i
  )
  out = removeAllMatchingRoots(
    out,
    /<div\b[^>]*class=["'][^"']*\bwp-block-ub-divider\b[^"']*["'][^>]*>/i
  )

  // Remove Ultimate Blocks buttons (Download This Sheet, etc.)
  out = removeAllMatchingRoots(
    out,
    /<div\b[^>]*(?:class=["'][^"']*\bub-button\b[^"']*["']|id=["']ub-button-[^"']+["'])[^>]*>/i
  )
  out = removeAllMatchingRoots(
    out,
    /<div\b[^>]*class=["'][^"']*\bwp-block-ub-button\b[^"']*["'][^>]*>/i
  )

  // Convert advanced headings → clean h2/h3 (preserve level; default h3)
  out = out.replace(
    /<(h[1-6])\b([^>]*)\b(?:ub_advanced_heading|wp-block-ub-advanced-heading)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
    (_m, tag: string, pre: string, post: string, inner: string) => {
      const attrs = `${pre} ${post}`
      const idMatch = attrs.match(/\bid=["']([^"']+)["']/i)
      // Keep semantic level but prefer h2 for former styled section bars if they're thick checklist sections
      return normalizeHeading(tag.toLowerCase(), inner, idMatch?.[1])
    }
  )

  // Also catch advanced headings without matching class on rare markup
  out = out.replace(
    /<(h[1-6])\b([^>]*style=["'][^"']*background-color:\s*#000000[^"']*["'][^>]*)>([\s\S]*?)<\/\1>/gi,
    (_m, tag: string, attrs: string, inner: string) => {
      const idMatch = attrs.match(/\bid=["']([^"']+)["']/i)
      return normalizeHeading(tag.toLowerCase(), inner, idMatch?.[1])
    }
  )

  // Strip leftover divider lines if any orphaned
  out = out.replace(/<div\b[^>]*class=["'][^"']*\bub_divider_line\b[^"']*["'][^>]*>\s*<\/div>/gi, '')
  out = out.replace(/<div\b[^>]*class=["'][^"']*\bub_divider_wrapper\b[^"']*["'][^>]*>\s*<\/div>/gi, '')

  // Remove empty Ultimate Blocks remnants mentioning Download
  out = out.replace(
    /<a\b[^>]*>\s*Download This Sheet\s*<\/a>/gi,
    ''
  )

  // Normalize common WP paragraph/list/heading classes → plain tags (keep content)
  out = out.replace(
    /<(p|h[1-6]|ol|ul|li)\b([^>]*?)\sclass=["'][^"']*\bwp-block-[^"']*["']([^>]*)>/gi,
    (_m, tag: string, pre: string, post: string) => {
      const attrs = `${pre}${post}`.replace(/\s+/g, ' ').trim()
      // Drop empty class leftovers; keep id
      const idMatch = attrs.match(/\bid=["']([^"']+)["']/i)
      return idMatch ? `<${tag} id="${idMatch[1]}">` : `<${tag}>`
    }
  )

  // Unwrap scrubtales / entry-content wrappers while keeping children
  out = out.replace(
    /<div\b[^>]*class=["'][^"']*\b(?:entry-content|single-content|scrubtales-content)\b[^"']*["'][^>]*>/gi,
    ''
  )
  // Best-effort close leftover wrappers at end — remove orphan closing divs that became excess
  // Don't aggressively strip all closing divs; only collapse empty divs
  out = out.replace(/<div\b[^>]*>\s*<\/div>/gi, '')
  out = out.replace(/<p\b[^>]*>\s*<\/p>/gi, '')
  out = out.replace(/\n{3,}/g, '\n\n')

  return out.trim()
}

function needsNormalize(html: string): boolean {
  return /ub_advanced_heading|ub_divider|ub-button|wp-block-ub-|background-color:\s*#000000|Download This Sheet/i.test(
    html
  )
}

async function main() {
  const { data: pages, error } = await sb
    .from('fy_pages')
    .select('id, slug, title, content')
    .eq('is_active', true)
  if (error) throw error

  let updated = 0
  for (const page of pages || []) {
    const content = page.content || ''
    if (!needsNormalize(content)) continue

    const next = normalizeFyHtml(content)
    if (next === content) {
      console.log(`~ no change after normalize: ${page.slug}`)
      continue
    }

    const { error: upErr } = await sb
      .from('fy_pages')
      .update({ content: next, updated_at: new Date().toISOString() })
      .eq('id', page.id)
    if (upErr) throw upErr

    updated += 1
    const beforeDiv = (content.match(/ub_divider/g) || []).length
    const afterDiv = (next.match(/ub_divider/g) || []).length
    const beforeHead = (content.match(/ub_advanced_heading/g) || []).length
    const afterHead = (next.match(/ub_advanced_heading/g) || []).length
    const beforeBtn = (content.match(/ub-button|Download This Sheet/gi) || []).length
    const afterBtn = (next.match(/ub-button|Download This Sheet/gi) || []).length
    console.log(
      `✓ ${page.slug}  headings ${beforeHead}→${afterHead}  dividers ${beforeDiv}→${afterDiv}  buttons ${beforeBtn}→${afterBtn}`
    )
  }

  console.log(`\nUpdated ${updated} page(s).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
