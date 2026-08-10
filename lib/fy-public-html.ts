/** Rewrite placement image paths in FY HTML for the public image view API. */
export function rewriteFyContentImages(html: string, fallbackAlt?: string): string {
  if (!html) return ''
  let out = html

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

  return enrichFyContentImages(out, fallbackAlt)
}

/**
 * Ensure inline FY images have alt + dimensions (CLS) and lazy-load attributes.
 * Existing alt/width/height are preserved.
 */
export function enrichFyContentImages(html: string, fallbackAlt = 'Guide illustration'): string {
  if (!html) return ''
  return html.replace(/<img\b([^>]*)>/gi, (_full, rawAttrs: string) => {
    let attrs = rawAttrs || ''

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

    return `<img${attrs}>`
  })
}

export function stripHtmlToDescription(html: string, max = 155): string {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trim()}…`
}

export function featuredImageViewUrl(path?: string | null): string | null {
  if (!path) return null
  return `/api/placements/images/view?path=${encodeURIComponent(path)}`
}
