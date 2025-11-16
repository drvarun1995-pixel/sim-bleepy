import { supabaseAdmin } from '@/utils/supabase'

export const EMAIL_BUCKET_ID = 'email-files'
export const EMAIL_DRAFT_PREFIX = 'admin-email-drafts'
export const EMAIL_FINAL_PREFIX = 'admin-emails'

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
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  
  // Handle various URL patterns that might appear in the HTML
  let updated = html
  
  // First, replace any existing absolute URLs pointing to Vercel or localhost with production domain
  updated = updated.replaceAll(
    /src="https?:\/\/[^"]*vercel\.app[^"]*\/api\/admin\/emails\/images\/view\?([^"]+)"/g,
    `src="${normalizedBase}/api/admin/emails/images/view?$1"`
  )
  updated = updated.replaceAll(
    /src="https?:\/\/localhost[^"]*\/api\/admin\/emails\/images\/view\?([^"]+)"/g,
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

