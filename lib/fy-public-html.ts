/** Rewrite placement image paths in FY HTML for the public image view API. */
export function rewriteFyContentImages(html: string): string {
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

  return out
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
