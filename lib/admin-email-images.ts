import { supabaseAdmin } from '@/utils/supabase'
import { signEmailImageToken } from '@/lib/secure-file-access'
import { PRODUCTION_SITE_ORIGIN } from '@/lib/site-url'
import type { EmailAttachment } from '@/lib/email'

export const EMAIL_BUCKET_ID = 'email-files'
export const EMAIL_DRAFT_PREFIX = 'admin-email-drafts'
export const EMAIL_FINAL_PREFIX = 'admin-emails'

/**
 * TipTap highlight / theme tokens → solid hex for email clients
 * (Gmail/Outlook ignore CSS custom properties).
 */
const EMAIL_CSS_VAR_HEX: Record<string, string> = {
  '--tt-color-highlight-yellow': '#fef9c3',
  '--tt-color-highlight-green': '#dcfce7',
  '--tt-color-highlight-blue': '#e0f2fe',
  '--tt-color-highlight-purple': '#f3e8ff',
  '--tt-color-highlight-red': '#ffe4e6',
  '--tt-color-highlight-gray': '#f8f8f7',
  '--tt-color-highlight-brown': '#f4eeee',
  '--tt-color-highlight-orange': '#fbecdd',
  '--tt-color-highlight-pink': '#fcf1f6',
  '--tt-color-highlight-yellow-contrast': '#fbe604',
  '--tt-color-highlight-green-contrast': '#c7fad8',
  '--tt-color-highlight-blue-contrast': '#ceeafd',
  '--tt-color-highlight-purple-contrast': '#e4ccff',
  '--tt-color-highlight-red-contrast': '#ffccd0',
  '--tt-color-highlight-gray-contrast': 'rgba(84, 72, 49, 0.15)',
  '--tt-color-highlight-brown-contrast': 'rgba(210, 162, 141, 0.35)',
  '--tt-color-highlight-orange-contrast': 'rgba(224, 124, 57, 0.27)',
  '--tt-color-highlight-pink-contrast': 'rgba(225, 136, 179, 0.27)',
  '--tt-bg-color': '#ffffff',
  '--tt-bg-color-contrast': '#e5e7eb',
}

function resolveCssVarToken(token: string): string | null {
  const cleaned = token.trim().replace(/^var\(/i, '').replace(/\)$/, '').trim()
  const name = cleaned.split(',')[0]?.trim()
  if (!name?.startsWith('--')) return null
  return EMAIL_CSS_VAR_HEX[name] || null
}

/** Replace CSS variables and ensure <mark> highlights have solid inline backgrounds. */
export function prepareEmailHtmlStyles(html: string): string {
  if (!html) return html

  let updated = html.replace(
    /var\(\s*(--[a-zA-Z0-9-_]+)(?:\s*,[^)]+)?\s*\)/gi,
    (full, name: string) => EMAIL_CSS_VAR_HEX[name] || full
  )

  updated = updated.replace(/<mark\b([^>]*)>/gi, (full, attrs: string) => {
    const dataColor = attrs.match(/data-color=["']([^"']+)["']/i)?.[1]
    let color =
      (dataColor && (resolveCssVarToken(dataColor) || (!dataColor.includes('var(') ? dataColor : null))) ||
      null

    const styleMatch = attrs.match(/style=["']([^"']*)["']/i)
    const existingStyle = styleMatch?.[1] || ''

    if (!color) {
      const bgMatch = existingStyle.match(/background(?:-color)?\s*:\s*([^;]+)/i)
      if (bgMatch) {
        const raw = bgMatch[1].trim()
        color = resolveCssVarToken(raw) || (!raw.includes('var(') ? raw : null)
      }
    }

    if (!color) color = EMAIL_CSS_VAR_HEX['--tt-color-highlight-yellow']

    let nextStyle = existingStyle
      .replace(/background(?:-color)?\s*:\s*[^;]+;?/gi, '')
      .trim()
    if (nextStyle && !nextStyle.endsWith(';')) nextStyle += ';'
    nextStyle += `background-color: ${color};`

    if (styleMatch) {
      return `<mark${attrs.replace(styleMatch[0], `style="${nextStyle}"`)}>`
    }
    return `<mark${attrs} style="${nextStyle}">`
  })

  return updated
}

/** Never put localhost / preview hosts in outbound email HTML. */
export function getEmailAssetBaseUrl(preferred?: string | null): string {
  const candidate = (preferred || process.env.NEXT_PUBLIC_APP_URL || '').trim()
  if (
    !candidate ||
    /localhost|127\.0\.0\.1|0\.0\.0\.0|vercel\.app/i.test(candidate)
  ) {
    return PRODUCTION_SITE_ORIGIN
  }
  return candidate.replace(/\/$/, '')
}

function contentTypeForPath(path: string): string {
  if (path.endsWith('.png')) return 'image/png'
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg'
  if (path.endsWith('.gif')) return 'image/gif'
  return 'image/webp'
}

/**
 * Embed admin email images as Graph inline CID attachments so inboxes do not
 * need to fetch localhost (or auth-gated) image URLs.
 */
export async function inlineAdminEmailImages(html: string): Promise<{
  html: string
  attachments: EmailAttachment[]
}> {
  if (!html) return { html, attachments: [] }

  const srcRegex =
    /(<img\b[^>]*?\bsrc=["'])([^"']*\/api\/admin\/emails\/images\/view\?[^"']+)(["'][^>]*>)/gi
  const matches = Array.from(html.matchAll(srcRegex))
  if (matches.length === 0) return { html, attachments: [] }

  const pathToCid = new Map<string, string>()
  const attachments: EmailAttachment[] = []
  let updated = html
  let index = 0

  for (const match of matches) {
    const fullSrc = match[2]
    let pathParam: string | null = null
    try {
      const query = fullSrc.includes('?') ? fullSrc.slice(fullSrc.indexOf('?') + 1) : ''
      pathParam = new URLSearchParams(query).get('path')
    } catch {
      pathParam = null
    }
    if (!pathParam) continue

    let storagePath = pathParam
    try {
      storagePath = decodeURIComponent(pathParam)
    } catch {
      storagePath = pathParam
    }

    let contentId = pathToCid.get(storagePath)
    if (!contentId) {
      const { data, error } = await supabaseAdmin.storage
        .from(EMAIL_BUCKET_ID)
        .download(storagePath)

      if (error || !data) {
        console.error('Failed to inline email image:', storagePath, error)
        continue
      }

      const buffer = Buffer.from(await data.arrayBuffer())
      contentId = `bleepy-email-img-${index++}`
      pathToCid.set(storagePath, contentId)
      attachments.push({
        name: storagePath.split('/').pop() || `${contentId}.webp`,
        contentType: contentTypeForPath(storagePath),
        contentBytes: buffer.toString('base64'),
        contentId,
        isInline: true,
      })
    }

    updated = updated.replaceAll(fullSrc, `cid:${contentId}`)
  }

  return { html: updated, attachments }
}

export function extractEmailImagePaths(html: string): string[] {
  if (!html) return []
  const matches = Array.from(html.matchAll(/path=([^"&]+)/g))
  const paths = matches
    .map((match) => {
      try {
        return decodeURIComponent(match[1])
      } catch {
        return match[1]
      }
    })
    .filter(Boolean)
  return Array.from(new Set(paths))
}

function replacePathsInHtml(html: string, pathMap: Record<string, string>): string {
  let updated = html
  Object.entries(pathMap).forEach(([oldPath, newPath]) => {
    const encodedOld = encodeURIComponent(oldPath)
    const encodedNew = encodeURIComponent(newPath)
    updated = updated.replaceAll(`path=${oldPath}`, `path=${newPath}`)
    updated = updated.replaceAll(`path=${encodedOld}`, `path=${encodedNew}`)
  })
  return updated
}

export async function promoteAdminEmailImages(params: {
  draftId?: string | null
  html: string
  logId: string
}): Promise<{ html: string; movedPaths: Record<string, string> }> {
  const { draftId, html, logId } = params
  if (!draftId) {
    return { html, movedPaths: {} }
  }

  const draftPrefix = `${EMAIL_DRAFT_PREFIX}/${draftId}/`
  const pathsInHtml = extractEmailImagePaths(html).filter((path) =>
    path.startsWith(draftPrefix)
  )

  if (pathsInHtml.length === 0) {
    return { html, movedPaths: {} }
  }

  const uniquePaths = Array.from(new Set(pathsInHtml))
  const pathMap: Record<string, string> = {}

  for (const originalPath of uniquePaths) {
    const relative = originalPath.slice(draftPrefix.length)
    if (!relative) continue
    const destination = `${EMAIL_FINAL_PREFIX}/${logId}/${relative}`

    const { error } = await supabaseAdmin.storage
      .from(EMAIL_BUCKET_ID)
      .move(originalPath, destination)

    if (error) {
      throw new Error(`Failed to move email image ${originalPath}: ${error.message}`)
    }

    pathMap[originalPath] = destination
  }

  const updatedHtml = replacePathsInHtml(html, pathMap)
  return { html: updatedHtml, movedPaths: pathMap }
}

export function absolutizeEmailImageUrls(html: string, baseUrl: string): string {
  if (!baseUrl) return html
  const normalizedBase = getEmailAssetBaseUrl(baseUrl)
  
  // Handle various URL patterns that might appear in the HTML
  let updated = html
  
  // First, replace any existing absolute URLs pointing to Vercel or localhost with production domain
  updated = updated.replaceAll(
    /src="https?:\/\/[^"]*vercel\.app[^"]*\/api\/admin\/emails\/images\/view\?([^"]+)"/g,
    `src="${normalizedBase}/api/admin/emails/images/view?$1"`
  )
  updated = updated.replaceAll(
    /src="https?:\/\/(?:localhost|127\.0\.0\.1)[^"]*\/api\/admin\/emails\/images\/view\?([^"]+)"/gi,
    `src="${normalizedBase}/api/admin/emails/images/view?$1"`
  )
  
  // Pattern 1: src="/api/admin/emails/images/view?path=..."
  updated = updated.replaceAll(
    /src="\/api\/admin\/emails\/images\/view\?/g,
    `src="${normalizedBase}/api/admin/emails/images/view?`
  )
  
  // Pattern 2: src='/api/admin/emails/images/view?path=...'
  updated = updated.replaceAll(
    /src='\/api\/admin\/emails\/images\/view\?/g,
    `src='${normalizedBase}/api/admin/emails/images/view?`
  )
  
  // Pattern 3: src= relative paths that start with /api/admin/emails/images/view
  updated = updated.replaceAll(
    /src="([^"]*\/api\/admin\/emails\/images\/view\?)/g,
    (match, path) => {
      if (path.startsWith('http')) {
        // If it's already absolute but not pointing to production, replace it
        if (!path.includes('sim.bleepy.co.uk')) {
          const urlMatch = path.match(/\/api\/admin\/emails\/images\/view\?([^"]+)/)
          if (urlMatch) {
            return `src="${normalizedBase}/api/admin/emails/images/view?${urlMatch[1]}`
          }
        }
        return match
      }
      return `src="${normalizedBase}${path.startsWith('/') ? '' : '/'}${path}`
    }
  )

  // Attach per-path HMAC tokens so inbox clients can load images without a session
  updated = updated.replace(
    /((?:src=["'])(?:https?:\/\/[^"']*)?\/api\/admin\/emails\/images\/view\?)([^"']+)/gi,
    (match, prefix, query) => {
      if (/[?&]token=/.test(`?${query}`)) return match
      const params = new URLSearchParams(query)
      const path = params.get('path')
      if (!path) return match
      let decoded = path
      try {
        decoded = decodeURIComponent(path)
      } catch {
        decoded = path
      }
      params.set('token', signEmailImageToken(decoded))
      return `${prefix}${params.toString()}`
    }
  )
  
  return updated
}

async function listFilesRecursive(prefix: string): Promise<string[]> {
  let files: string[] = []
  let page = 0
  const pageSize = 100

  while (true) {
    const { data, error } = await supabaseAdmin.storage
      .from(EMAIL_BUCKET_ID)
      .list(prefix, { limit: pageSize, offset: page * pageSize })

    if (error) {
      console.error(`Failed to list files for prefix ${prefix}:`, error)
      break
    }

    if (!data || data.length === 0) {
      break
    }

    for (const item of data) {
      if (item.metadata && typeof item.metadata.size === 'number') {
        files.push(prefix ? `${prefix}/${item.name}` : item.name)
      } else {
        const childPrefix = prefix ? `${prefix}/${item.name}` : item.name
        const childFiles = await listFilesRecursive(childPrefix)
        files = files.concat(childFiles)
      }
    }

    if (data.length < pageSize) {
      break
    }

    page++
  }

  return files
}

export async function deleteAdminEmailImageFolder(logId: string) {
  if (!logId) return
  const prefix = `${EMAIL_FINAL_PREFIX}/${logId}`
  try {
    const filesToDelete = await listFilesRecursive(prefix)
    if (filesToDelete.length > 0) {
      const { error: removeError } = await supabaseAdmin.storage.from(EMAIL_BUCKET_ID).remove(filesToDelete)
      if (removeError) {
        console.error(`Failed to delete files for log ${logId}:`, removeError)
      }
    }
  } catch (error) {
    console.error(`Error cleaning up email image folder for log ${logId}:`, error)
  }
}

