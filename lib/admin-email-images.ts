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
  return html.replaceAll(
    /src="\/api\/admin\/emails\/images\/view\?/g,
    `src="${normalizedBase}/api/admin/emails/images/view?`
  )
}

export async function deleteAdminEmailImageFolder(logId: string) {
  if (!logId) return
  const prefix = `${EMAIL_FINAL_PREFIX}/${logId}`
  try {
    const filesToDelete: string[] = []
    let page = 0
    const pageSize = 100
    while (true) {
      const { data, error } = await supabaseAdmin.storage
        .from(EMAIL_BUCKET_ID)
        .list(prefix, { limit: pageSize, offset: page * pageSize })
      if (error) {
        console.error(`Failed to list files for log ${logId}:`, error)
        break
      }
      if (!data || data.length === 0) break
      data.forEach((file) => filesToDelete.push(`${prefix}/${file.name}`))
      if (data.length < pageSize) break
      page++
    }
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

