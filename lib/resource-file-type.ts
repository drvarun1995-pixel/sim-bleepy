export type ResourceIconType = 'pdf' | 'video' | 'image' | 'document' | 'other'

const DOCUMENT_EXTS = new Set(['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'])
const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'])
const VIDEO_EXTS = new Set(['mp4', 'mov', 'webm', 'avi', 'wmv', 'mkv'])

function extensionOf(fileName?: string | null) {
  const name = (fileName || '').trim()
  const dot = name.lastIndexOf('.')
  if (dot < 0) return ''
  return name.slice(dot + 1).toLowerCase()
}

/** Prefer the real filename so icons stay correct if MIME is stale. */
export function resourceIconType(
  mimeType?: string | null,
  fileName?: string | null
): ResourceIconType {
  const ext = extensionOf(fileName)
  const mime = (mimeType || '').toLowerCase()

  if (ext === 'pdf') return 'pdf'
  if (DOCUMENT_EXTS.has(ext)) return 'document'
  if (IMAGE_EXTS.has(ext)) return 'image'
  if (VIDEO_EXTS.has(ext)) return 'video'

  if (mime.includes('pdf')) return 'pdf'
  if (mime.includes('video')) return 'video'
  if (mime.includes('image')) return 'image'
  if (
    mime.includes('word') ||
    mime.includes('document') ||
    mime.includes('powerpoint') ||
    mime.includes('presentation') ||
    mime.includes('excel') ||
    mime.includes('spreadsheet')
  ) {
    return 'document'
  }
  return 'other'
}
