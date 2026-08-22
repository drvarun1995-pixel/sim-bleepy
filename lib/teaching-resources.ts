export const TEACHING_RESOURCES_BUCKET = 'teaching-resources'
export const TEACHING_RESOURCES_MAX_FILE_BYTES = 50 * 1024 * 1024
export const TEACHING_RESOURCES_MAX_PREVIEW_BYTES = 8 * 1024 * 1024

export const DEFAULT_TEACHING_LICENSE_SOURCE = 'envato'
export const DEFAULT_TEACHING_LICENSE_NOTE =
  'Licensed to Bleepy. For teaching use on Bleepy only — do not redistribute outside the platform.'

export const TEACHING_RESOURCE_CATEGORY_IDS = [
  'ppt-files',
  'graphic-templates',
  'clinical-sounds',
  'sound-effects',
  'photos',
] as const

export type TeachingResourceCategoryId = (typeof TEACHING_RESOURCE_CATEGORY_IDS)[number]

export type TeachingPreviewKind = 'image' | 'audio' | 'video' | 'thumbnail' | 'none'

export type TeachingResourceCategory = {
  id: TeachingResourceCategoryId
  name: string
  description: string
  accept: string
  extensions: string[]
  accent: string
  tint: string
}

export const TEACHING_RESOURCE_CATEGORIES: TeachingResourceCategory[] = [
  {
    id: 'ppt-files',
    name: 'PPT Files',
    description: 'Slide decks ready to drop into a session',
    accept: '.ppt,.pptx,.pdf,.key',
    extensions: ['ppt', 'pptx', 'pdf', 'key'],
    accent: '#ea580c',
    tint: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  {
    id: 'graphic-templates',
    name: 'Graphic templates',
    description: 'Canva templates for posters, social cards, and teaching graphics',
    accept: '.psd,.ai,.eps,.svg,.png,.jpg,.jpeg,.webp,.pdf,.zip,.fig',
    extensions: ['psd', 'ai', 'eps', 'svg', 'png', 'jpg', 'jpeg', 'webp', 'pdf', 'zip', 'fig'],
    accent: '#7c3aed',
    tint: 'bg-violet-50 text-violet-800 border-violet-200',
  },
  {
    id: 'clinical-sounds',
    name: 'Clinical Sounds',
    description: 'Heart, lung, and other clinical audio for teaching',
    accept: '.mp3,.wav,.ogg,.m4a,.aac,.flac',
    extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'],
    accent: '#0d9488',
    tint: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  {
    id: 'sound-effects',
    name: 'Sound effects',
    description: 'UI, atmosphere, and session sound effects',
    accept: '.mp3,.wav,.ogg,.m4a,.aac,.flac',
    extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'],
    accent: '#2563eb',
    tint: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  {
    id: 'photos',
    name: 'Photos',
    description: 'Stock and teaching photography',
    accept: '.jpg,.jpeg,.png,.webp,.gif,.tif,.tiff',
    extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'tif', 'tiff'],
    accent: '#db2777',
    tint: 'bg-pink-50 text-pink-800 border-pink-200',
  },
]

const MIME_BY_EXT: Record<string, string> = {
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  pdf: 'application/pdf',
  key: 'application/vnd.apple.keynote',
  psd: 'image/vnd.adobe.photoshop',
  ai: 'application/postscript',
  eps: 'application/postscript',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  zip: 'application/zip',
  fig: 'application/octet-stream',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  flac: 'audio/flac',
}

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'tif', 'tiff'])
const AUDIO_EXTS = new Set(['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'])
const VIDEO_EXTS = new Set(['mp4', 'mov', 'webm'])
const PREVIEW_IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif'])

export type TeachingResourceRecord = {
  id: string
  title: string
  description: string | null
  category: TeachingResourceCategoryId
  file_name: string
  file_size: number
  file_type: string
  tags: string[]
  license_source: string | null
  license_note: string | null
  source_url: string | null
  uploaded_by: string | null
  uploaded_by_name: string | null
  download_count: number
  created_at: string
  updated_at: string
  has_inline_preview: boolean
  preview_kind: TeachingPreviewKind
  preview_url?: string | null
  is_canva_template?: boolean
  open_url?: string | null
}

export const CANVA_TEMPLATE_FILE_NAME = 'Canva template'
export const CANVA_TEMPLATE_FILE_TYPE = 'text/uri-list'

export function parseCanvaTemplateUrl(value?: string | null): string | null {
  const raw = String(value || '').trim()
  if (!raw) return null
  try {
    const url = new URL(raw)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    const host = url.hostname.toLowerCase()
    const isCanvaHost = host === 'canva.com' || host.endsWith('.canva.com') || host === 'canva.link'
    if (!isCanvaHost) return null
    if (host === 'canva.link') return url.toString()
    if (!/\/design\//i.test(url.pathname)) return null
    return url.toString()
  } catch {
    return null
  }
}

export function isCanvaTemplateUrl(value?: string | null) {
  return !!parseCanvaTemplateUrl(value)
}

export function teachingResourceOpenUrl(resource: Pick<TeachingResourceRecord, 'source_url' | 'file_type'>) {
  return parseCanvaTemplateUrl(resource.source_url)
}

export function isCanvaTeachingResource(
  resource: Pick<TeachingResourceRecord, 'source_url' | 'file_type' | 'file_name'>
) {
  return (
    !!teachingResourceOpenUrl(resource) ||
    resource.file_type === CANVA_TEMPLATE_FILE_TYPE ||
    resource.file_name === CANVA_TEMPLATE_FILE_NAME
  )
}

export function isTeachingResourceCategory(
  value: string | null | undefined
): value is TeachingResourceCategoryId {
  return !!value && TEACHING_RESOURCE_CATEGORY_IDS.includes(value as TeachingResourceCategoryId)
}

export function getTeachingResourceCategory(id: string) {
  return TEACHING_RESOURCE_CATEGORIES.find((category) => category.id === id)
}

export function extensionOf(fileName?: string | null) {
  const name = (fileName || '').trim()
  const dot = name.lastIndexOf('.')
  if (dot < 0) return ''
  return name.slice(dot + 1).toLowerCase()
}

export function teachingResourceMimeType(fileName: string, fallback?: string | null) {
  const ext = extensionOf(fileName)
  return MIME_BY_EXT[ext] || fallback || 'application/octet-stream'
}

export function isAllowedTeachingFile(categoryId: TeachingResourceCategoryId, fileName: string) {
  const category = getTeachingResourceCategory(categoryId)
  if (!category) return false
  return category.extensions.includes(extensionOf(fileName))
}

export function isAllowedPreviewImage(fileName: string) {
  return PREVIEW_IMAGE_EXTS.has(extensionOf(fileName))
}

export function previewKindFromFile(
  fileName: string,
  mimeType?: string | null,
  hasPreviewImage = false
): TeachingPreviewKind {
  const ext = extensionOf(fileName)
  const mime = (mimeType || '').toLowerCase()
  if (hasPreviewImage) return 'thumbnail'
  if (IMAGE_EXTS.has(ext) || mime.startsWith('image/')) return 'image'
  if (AUDIO_EXTS.has(ext) || mime.startsWith('audio/')) return 'audio'
  if (VIDEO_EXTS.has(ext) || mime.startsWith('video/')) return 'video'
  return 'none'
}

export function teachingPreviewStoragePath(input: {
  fileName?: string | null
  fileType?: string | null
  filePath?: string | null
  previewPath?: string | null
}) {
  const previewPath = (input.previewPath || '').trim()
  if (previewPath) return previewPath
  const kind = previewKindFromFile(input.fileName || '', input.fileType, false)
  if (kind === 'none') return ''
  return (input.filePath || '').trim()
}

export function parseTeachingTags(input: string | string[] | null | undefined): string[] {
  const raw = Array.isArray(input) ? input.join(',') : input || ''
  const seen = new Set<string>()
  const tags: string[] = []
  for (const part of raw.split(/[,;\n]+/)) {
    const tag = part.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 40)
    if (!tag || seen.has(tag)) continue
    seen.add(tag)
    tags.push(tag)
    if (tags.length >= 20) break
  }
  return tags
}

export function formatFileSize(bytes: number) {
  if (!bytes || bytes < 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function sanitizeTeachingSearch(query: string) {
  return query.replace(/[%_,.()"'\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
}

export function downloadFileName(name: string) {
  return name.replace(/[\r\n"]/g, '_').slice(0, 180) || 'download'
}
