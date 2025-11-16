import { supabaseAdmin } from '@/utils/supabase'

export const ANNOUNCEMENT_BUCKET_ID = 'announcements'
export const ANNOUNCEMENT_DRAFT_PREFIX = 'announcement-drafts'
export const ANNOUNCEMENT_FINAL_PREFIX = 'announcements'

export function extractAnnouncementImagePaths(html: string): string[] {
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

export async function promoteAnnouncementImages(params: {
  draftId?: string | null
  html: string
  announcementId: string
}): Promise<{ html: string; movedPaths: Record<string, string> }> {
  const { draftId, html, announcementId } = params
  if (!draftId) {
    return { html, movedPaths: {} }
  }

  const draftPrefix = `${ANNOUNCEMENT_DRAFT_PREFIX}/${draftId}/`
  const pathsInHtml = extractAnnouncementImagePaths(html).filter((path) =>
    path.startsWith(draftPrefix)
  )

  if (pathsInHtml.length === 0) {
    // No images to promote, but clean up empty draft folder
    try {
      await deleteAnnouncementDraftFolder(draftId)
    } catch (error) {
      console.error(`Error cleaning up empty draft folder for ${draftId}:`, error)
    }
    return { html, movedPaths: {} }
  }

  const uniquePaths = Array.from(new Set(pathsInHtml))
  const pathMap: Record<string, string> = {}

  for (const originalPath of uniquePaths) {
    const relative = originalPath.slice(draftPrefix.length)
    if (!relative) continue
    const destination = `${ANNOUNCEMENT_FINAL_PREFIX}/${announcementId}/${relative}`

    const { error } = await supabaseAdmin.storage
      .from(ANNOUNCEMENT_BUCKET_ID)
      .move(originalPath, destination)

    if (error) {
      throw new Error(`Failed to move announcement image ${originalPath}: ${error.message}`)
    }

    pathMap[originalPath] = destination
  }

  // Clean up remaining draft folder (removes any orphaned files)
  try {
    await deleteAnnouncementDraftFolder(draftId)
  } catch (error) {
    console.error(`Error cleaning up draft folder after promotion for ${draftId}:`, error)
    // Don't fail promotion if cleanup fails
  }

  const updatedHtml = replacePathsInHtml(html, pathMap)
  return { html: updatedHtml, movedPaths: pathMap }
}

async function listFilesRecursive(prefix: string): Promise<string[]> {
  let files: string[] = []
  let page = 0
  const pageSize = 100

  while (true) {
    const { data, error } = await supabaseAdmin.storage
      .from(ANNOUNCEMENT_BUCKET_ID)
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

export async function deleteAnnouncementImageFolder(announcementId: string) {
  if (!announcementId) return
  const prefix = `${ANNOUNCEMENT_FINAL_PREFIX}/${announcementId}`
  try {
    const filesToDelete = await listFilesRecursive(prefix)
    if (filesToDelete.length > 0) {
      const { error: removeError } = await supabaseAdmin.storage.from(ANNOUNCEMENT_BUCKET_ID).remove(filesToDelete)
      if (removeError) {
        console.error(`Failed to delete files for announcement ${announcementId}:`, removeError)
      }
    }
  } catch (error) {
    console.error(`Error cleaning up announcement image folder for ${announcementId}:`, error)
  }
}

export async function deleteAnnouncementDraftFolder(draftId: string) {
  if (!draftId) return
  const prefix = `${ANNOUNCEMENT_DRAFT_PREFIX}/${draftId}`
  try {
    const filesToDelete = await listFilesRecursive(prefix)
    if (filesToDelete.length > 0) {
      const { error: removeError } = await supabaseAdmin.storage.from(ANNOUNCEMENT_BUCKET_ID).remove(filesToDelete)
      if (removeError) {
        console.error(`Failed to delete draft files for ${draftId}:`, removeError)
      }
    }
  } catch (error) {
    console.error(`Error cleaning up announcement draft folder for ${draftId}:`, error)
  }
}

