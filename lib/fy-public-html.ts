import { toPublicGuideArticleHref } from '@/lib/fy-blog-access'

type FyCalloutVariant = 'tip' | 'trap' | 'rule'

const FY_CALLOUT_MATCHERS: Array<{ variant: FyCalloutVariant; re: RegExp }> = [
  { variant: 'trap', re: /^(?:Common\s+)?FY\s+trap\s*:/i },
  { variant: 'rule', re: /^FY\s+paired[- ]?test\s+rule\s*:/i },
  { variant: 'tip', re: /^FY1?\s+tip\s*:/i },
]

/**
 * Promote plain tip/trap/rule paragraphs into muted callout blocks.
 * Skips paragraphs already inside `.fy-callout`.
 */
export function enrichFyCallouts(html: string): string {
  if (!html) return ''

  // Protect existing callouts so inner paragraphs are not re-wrapped.
  const stubs: string[] = []
  let out = html.replace(
    /<(aside|div)\b[^>]*\bfy-callout\b[^>]*>[\s\S]*?<\/\1>/gi,
    (block) => {
      const token = `__FY_CALLOUT_STUB_${stubs.length}__`
      stubs.push(block)
      return token
    }
  )

  out = out.replace(/<p(\b[^>]*)>([\s\S]*?)<\/p>/gi, (full, attrs: string, inner: string) => {
    if (/\bfy-callout\b/i.test(attrs)) return full
    const plain = inner
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const match = FY_CALLOUT_MATCHERS.find((m) => m.re.test(plain))
    if (!match) return full
    return `<aside class="fy-callout fy-callout-${match.variant}" role="note"><p${attrs}>${inner}</p></aside>`
  })

  stubs.forEach((block, i) => {
    out = out.replace(`__FY_CALLOUT_STUB_${i}__`, () => block)
  })
  return out
}

function plainHeadingText(inner: string): string {
  return inner
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Wrap "How to …" / "Step-by-Step" sections so CSS can number steps consistently.
 */
export function enrichFyHowTo(html: string): string {
  if (!html) return ''

  const stubs: string[] = []
  let out = html.replace(
    /<section\b[^>]*\bfy-howto\b[^>]*>[\s\S]*?<\/section>/gi,
    (block) => {
      const token = `__FY_HOWTO_STUB_${stubs.length}__`
      stubs.push(block)
      return token
    }
  )

  out = out.replace(
    /<(h2|h3)(\b[^>]*)>([\s\S]*?)<\/\1>([\s\S]*?)(?=<h2\b|$)/gi,
    (full, tag: string, attrs: string, titleInner: string, body: string) => {
      if (/\bfy-howto\b/i.test(attrs)) return full
      const titleText = plainHeadingText(titleInner)
      const isHowTo =
        /^How to\b/i.test(titleText) ||
        (/\bStep-by-Step\b/i.test(titleText) && /\bHow\b/i.test(titleText))
      if (!isHowTo) return full

      const h3Count = (body.match(/<h3\b/gi) || []).length
      const stepCount = (body.match(/\bStep\s*\d+/gi) || []).length
      const olCount = (body.match(/<ol\b/gi) || []).length
      if (h3Count < 1 && stepCount < 2 && olCount < 1) return full

      // Keep sections bounded — skip enormous dumps without clear step markers.
      if (body.length > 12000 && h3Count < 2 && stepCount < 2) return full

      return `<section class="fy-howto"><${tag}${attrs}>${titleInner}</${tag}>${body}</section>`
    }
  )

  stubs.forEach((block, i) => {
    out = out.replace(`__FY_HOWTO_STUB_${i}__`, () => block)
  })
  return out
}

/** Strip WordPress Ultimate Blocks chrome so public/placements HTML matches clean FY guides. */
export function sanitizeFyImportedHtml(html: string): string {
  if (!html) return ''
  let out = html

  const removeBalanced = (source: string, start: number): string | null => {
    if (source[start] !== '<') return null
    const tagMatch = source.slice(start).match(/^<\/?([a-zA-Z][\w:-]*)/)
    if (!tagMatch || source[start + 1] === '/') return null
    const tag = tagMatch[1].toLowerCase()
    let i = start
    let depth = 0
    while (i < source.length) {
      const next = source.indexOf('<', i)
      if (next === -1) return null
      const slice = source.slice(next)
      const open = slice.match(new RegExp(`^<${tag}\\b[^>]*>`, 'i'))
      const close = slice.match(new RegExp(`^</${tag}\\s*>`, 'i'))
      const selfClosing = slice.match(new RegExp(`^<${tag}\\b[^>]*/>`, 'i'))
      if (selfClosing) {
        if (depth === 0) return source.slice(0, start) + source.slice(next + selfClosing[0].length)
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
        if (depth === 0) return source.slice(0, start) + source.slice(i)
        continue
      }
      i = next + 1
    }
    return null
  }

  const removeRoots = (re: RegExp) => {
    let guard = 0
    while (guard < 60) {
      guard += 1
      const match = out.match(re)
      if (!match || match.index === undefined) break
      const next = removeBalanced(out, match.index)
      if (!next || next === out) {
        out = out.slice(0, match.index) + out.slice(match.index + match[0].length)
        continue
      }
      out = next
    }
  }

  removeRoots(/<div\b[^>]*(?:class=["'][^"']*\bub_divider\b|id=["']ub_divider_)[^>]*>/i)
  removeRoots(/<div\b[^>]*(?:class=["'][^"']*\bub-button\b|id=["']ub-button-)[^>]*>/i)
  removeRoots(/<div\b[^>]*class=["'][^"']*\bwp-block-ub-(?:divider|button)\b[^"']*["'][^>]*>/i)

  out = out.replace(
    /<(h[1-6])\b([^>]*)\b(?:ub_advanced_heading|wp-block-ub-advanced-heading)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
    (_m, tag: string, pre: string, post: string, inner: string) => {
      const attrs = `${pre} ${post}`
      const idMatch = attrs.match(/\bid=["']([^"']+)["']/i)
      const text = inner
        .replace(/<\/?strong>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
      if (!text) return ''
      return idMatch ? `<${tag} id="${idMatch[1]}">${text}</${tag}>` : `<${tag}>${text}</${tag}>`
    }
  )

  out = out.replace(
    /<(h[1-6])\b([^>]*style=["'][^"']*background-color:\s*#000000[^"']*["'][^>]*)>([\s\S]*?)<\/\1>/gi,
    (_m, tag: string, attrs: string, inner: string) => {
      const idMatch = attrs.match(/\bid=["']([^"']+)["']/i)
      const text = inner
        .replace(/<\/?strong>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
      if (!text) return ''
      return idMatch ? `<${tag} id="${idMatch[1]}">${text}</${tag}>` : `<${tag}>${text}</${tag}>`
    }
  )

  out = out.replace(/<a\b[^>]*>\s*Download This Sheet\s*<\/a>/gi, '')
  return enrichFyHowTo(enrichFyCallouts(out))
}

/** Rewrite placement image paths in FY HTML for the public image view API. */
export function rewriteFyContentImages(html: string, fallbackAlt?: string): string {
  if (!html) return ''
  let out = sanitizeFyImportedHtml(html)

  out = out.replace(
    /src=["'](\/storage\/v1\/object\/(?:public|sign)\/placements\/([^"']+))["']/gi,
    (_m, _full, path) =>
      `src="/api/placements/images/view?path=${encodeURIComponent(path)}"`
  )

  out = out.replace(
    /src=["'](foundation-year\/[^"']+)["']/gi,
    (_m, path) =>
      `src="/api/placements/images/view?path=${encodeURIComponent(path)}"`
  )

  // Absolute supabase URLs
  out = out.replace(
    /src=["'](https?:\/\/[^"']+\/storage\/v1\/object\/(?:public|sign)\/placements\/([^"']+))["']/gi,
    (_m, _full, path) =>
      `src="/api/placements/images/view?path=${encodeURIComponent(path)}"`
  )

  // Public surface: keep article interlinks on /guides (not login-walled /placements)
  out = out.replace(
    /href=(["'])([^"']+)\1/gi,
    (full, quote: string, href: string) => {
      const rewritten = toPublicGuideArticleHref(href)
      if (!rewritten || rewritten === href) return full
      return `href=${quote}${rewritten}${quote}`
    }
  )

  return enrichFyContentImages(out, fallbackAlt)
}

/**
 * Ensure inline FY images have alt + dimensions (CLS) and lazy-load attributes.
 * Existing alt/width/height are preserved.
 */
export function enrichFyContentImages(html: string, fallbackAlt = 'Guide illustration'): string {
  if (!html) return ''
  return html.replace(/<img\b([^>]*)\/?>/gi, (_full, rawAttrs: string) => {
    // CMS/WordPress often emits self-closing <img ... />. Strip lone `/` tokens
    // before appending attrs — otherwise we produce `... / width="800"` which browsers
    // rewrite on parse and triggers React hydration mismatches (#418/#423/#425).
    let attrs = (rawAttrs || '')
      .replace(/\s\/(?=\s|$)/g, '')
      .replace(/\s*\/\s*$/, '')
      .trimEnd()

    if (!/\balt\s*=/i.test(attrs)) {
      attrs += ` alt="${fallbackAlt.replace(/"/g, '&quot;')}"`
    } else {
      // Replace empty alt="" with a useful fallback for SEO
      attrs = attrs.replace(/\balt=(["'])\s*\1/i, `alt="${fallbackAlt.replace(/"/g, '&quot;')}"`)
    }

    if (!/\bwidth\s*=/i.test(attrs)) {
      attrs += ' width="800"'
    }
    if (!/\bheight\s*=/i.test(attrs)) {
      attrs += ' height="450"'
    }
    if (!/\bloading\s*=/i.test(attrs)) {
      attrs += ' loading="lazy"'
    }
    if (!/\bdecoding\s*=/i.test(attrs)) {
      attrs += ' decoding="async"'
    }
    if (!/\bsizes\s*=/i.test(attrs)) {
      attrs += ' sizes="(max-width: 768px) 100vw, 800px"'
    }

    return `<img ${attrs.trim()}>`
  })
}

export function stripHtmlToDescription(html: string, max = 160): string {
  // Prefer the first paragraph as the meta description (common SEO pattern for guides).
  const firstP = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1]
  const source = firstP ?? html
  const text = source
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trim()}…`
}

/** Allowlisted widths for `/api/placements/images/view?w=` (public FY thumbs). */
export const FY_IMAGE_WIDTHS = [320, 640, 960, 1280] as const
export type FyImageWidth = (typeof FY_IMAGE_WIDTHS)[number]

export function featuredImageViewUrl(
  path?: string | null,
  width?: FyImageWidth
): string | null {
  if (!path) return null
  const base = `/api/placements/images/view?path=${encodeURIComponent(path)}`
  return width ? `${base}&w=${width}` : base
}
