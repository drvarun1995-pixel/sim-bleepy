'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import {
  Check,
  ChevronDown,
  Download,
  Edit,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  LayoutTemplate,
  Loader2,
  Presentation,
  Search,
  Trash2,
  Upload,
  Volume2,
} from 'lucide-react'
import { TeachingResourcePreview } from '@/components/teaching-resources/TeachingResourcePreview'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { canAccessTeachingResources } from '@/lib/roles'
import { startDownloadFromResponse } from '@/lib/resource-download-error'
import {
  TEACHING_RESOURCE_CATEGORIES,
  extensionOf,
  formatFileSize,
  getTeachingResourceCategory,
  isCanvaTeachingResource,
  type TeachingResourceCategoryId,
  type TeachingResourceRecord,
} from '@/lib/teaching-resources'

const PAGE_SIZE: Record<DisplaySize, number> = {
  small: 20,
  default: 12,
  large: 8,
}
const SORT_STORAGE_KEY = 'teaching-library-sort'
const DISPLAY_STORAGE_KEY = 'teaching-library-display'

type SortMode = 'popular' | 'new'
type DisplaySize = 'small' | 'default' | 'large'

const GRID_CLASS: Record<DisplaySize, string> = {
  small: 'grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  default: 'grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3',
  large: 'grid-cols-1 gap-5',
}

function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T) {
  if (typeof window === 'undefined') return fallback
  const value = window.localStorage.getItem(key)
  return allowed.includes(value as T) ? (value as T) : fallback
}

function sortTeachingResources(items: TeachingResourceRecord[], sort: SortMode) {
  return [...items].sort((a, b) => {
    if (sort === 'popular') {
      const downloads = (b.download_count || 0) - (a.download_count || 0)
      if (downloads !== 0) return downloads
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

function licenseLabel(note?: string | null) {
  const cleaned = String(note || '')
    .replace(/\s*via Envato\.?/gi, '.')
    .replace(/\bEnvato\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+\./g, '.')
    .trim()
  return cleaned || 'Licensed to Bleepy. For teaching use on Bleepy only.'
}

const CATEGORY_ICONS = {
  'ppt-files': Presentation,
  'graphic-templates': LayoutTemplate,
  'clinical-sounds': Volume2,
  'sound-effects': Volume2,
  photos: ImageIcon,
} as const

export default function ResourcesForTeachingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const role = (session?.user as { role?: string } | undefined)?.role || ''
  const userId = (session?.user as { id?: string } | undefined)?.id

  const [resources, setResources] = useState<TeachingResourceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState<TeachingResourceCategoryId | 'all'>('all')
  const [preview, setPreview] = useState<TeachingResourceRecord | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [editing, setEditing] = useState<TeachingResourceRecord | null>(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', tags: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<TeachingResourceRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE.default)
  const [sort, setSort] = useState<SortMode>('popular')
  const [displaySize, setDisplaySize] = useState<DisplaySize>('default')
  const [sortOpen, setSortOpen] = useState(false)
  const [displayOpen, setDisplayOpen] = useState(false)
  const [compactSearch, setCompactSearch] = useState(true)

  useEffect(() => {
    setSort(readStored(SORT_STORAGE_KEY, ['popular', 'new'] as const, 'popular'))
    setDisplaySize(readStored(DISPLAY_STORAGE_KEY, ['small', 'default', 'large'] as const, 'default'))
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)')
    const apply = () => setCompactSearch(media.matches)
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/resources-for-teaching')
    }
  }, [status, router])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (status !== 'authenticated') return

    const controller = new AbortController()
    const load = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (debouncedSearch) params.set('search', debouncedSearch)
        const response = await fetch(`/api/teaching-resources?${params.toString()}`, {
          credentials: 'include',
          signal: controller.signal,
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load teaching resources')
        }
        setResources(data.resources || [])
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        toast.error(error instanceof Error ? error.message : 'Failed to load teaching resources')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [status, debouncedSearch])

  const visibleResources = useMemo(() => {
    const filtered =
      category === 'all' ? resources : resources.filter((item) => item.category === category)
    return sortTeachingResources(filtered, sort)
  }, [resources, category, sort])

  const shownResources = visibleResources.slice(0, visibleCount)
  const hasMore = visibleCount < visibleResources.length
  const missingPreviewIds = shownResources
    .filter((item) => item.has_inline_preview && !item.preview_url)
    .map((item) => item.id)
    .join(',')

  useEffect(() => {
    setVisibleCount(PAGE_SIZE[displaySize])
  }, [category, debouncedSearch, sort, displaySize])

  useEffect(() => {
    if (visibleCount > visibleResources.length && visibleResources.length > 0) {
      setVisibleCount(visibleResources.length)
    }
  }, [visibleCount, visibleResources.length])

  useEffect(() => {
    if (!missingPreviewIds) return
    const ids = missingPreviewIds.split(',')
    const controller = new AbortController()
    const loadPreviews = async () => {
      try {
        const response = await fetch('/api/teaching-resources/preview-urls', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
          signal: controller.signal,
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok || !data.urls) return
        const urls = data.urls as Record<string, string>
        setResources((current) =>
          current.map((item) => (urls[item.id] ? { ...item, preview_url: urls[item.id] } : item))
        )
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
      }
    }
    void loadPreviews()
    return () => controller.abort()
  }, [missingPreviewIds])

  const counts = useMemo(() => {
    const next: Record<string, number> = { all: resources.length }
    for (const item of resources) {
      next[item.category] = (next[item.category] || 0) + 1
    }
    return next
  }, [resources])

  const openPreview = async (resource: TeachingResourceRecord) => {
    setPreview(resource)
    setPreviewUrl(resource.preview_url || null)
    if (!resource.has_inline_preview) return
    try {
      const response = await fetch(`/api/teaching-resources/preview/${resource.id}`, {
        credentials: 'include',
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok && data.url) {
        setPreviewUrl(data.url)
      }
    } catch {
      // Keep the list preview URL if a fresh signed URL cannot be loaded.
    }
  }

  const canManage = (resource: TeachingResourceRecord) => {
    if (role === 'admin' || role === 'meded_team') return true
    if (userId && resource.uploaded_by === userId) return true
    const name = session?.user?.name
    const email = session?.user?.email
    return (
      !!resource.uploaded_by_name &&
      (resource.uploaded_by_name === name || resource.uploaded_by_name === email)
    )
  }

  const downloadResource = async (resource: TeachingResourceRecord) => {
    setDownloadingId(resource.id)
    try {
      const response = await fetch(`/api/teaching-resources/download/${resource.id}`, {
        credentials: 'include',
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to download file')
      }
      await startDownloadFromResponse(response, resource.file_name)
      setResources((current) =>
        current.map((item) =>
          item.id === resource.id
            ? { ...item, download_count: item.download_count + 1 }
            : item
        )
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to download file')
    } finally {
      setDownloadingId(null)
    }
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const response = await fetch(`/api/teaching-resources/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          tags: editForm.tags,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Failed to update resource')
      setResources((current) =>
        current.map((item) =>
          item.id === editing.id
            ? {
                ...item,
                title: editForm.title.trim(),
                description: editForm.description.trim() || null,
                tags: editForm.tags
                  .split(',')
                  .map((tag) => tag.trim().toLowerCase())
                  .filter(Boolean),
              }
            : item
        )
      )
      setEditing(null)
      toast.success('Resource updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update resource')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/teaching-resources/${deleting.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Failed to delete resource')
      setResources((current) => current.filter((item) => item.id !== deleting.id))
      if (preview?.id === deleting.id) setPreview(null)
      setDeleting(null)
      toast.success('Resource deleted')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete resource')
    } finally {
      setIsDeleting(false)
    }
  }

  if (status === 'loading') return <LoadingScreen />
  if (status === 'authenticated' && role && !canAccessTeachingResources(role)) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">Resources</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Resources for Teaching
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            PPT files, Canva graphic templates, clinical sounds, sound effects, and photos for
            CTFs, MedEd, educators, and admins. Licensed to Bleepy for teaching use.
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/resources-for-teaching/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload resource
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={`rounded-xl border p-4 text-left transition ${
            category === 'all'
              ? 'border-blue-400 bg-blue-50 shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <p className="text-sm font-semibold text-slate-900">All files</p>
          <p className="mt-1 text-xs text-slate-500">{counts.all || 0} items</p>
        </button>
        {TEACHING_RESOURCE_CATEGORIES.map((item) => {
          const Icon = CATEGORY_ICONS[item.id]
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={`rounded-xl border p-4 text-left transition ${
                category === item.id
                  ? 'border-blue-400 bg-blue-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <Icon className="mb-2 h-5 w-5" style={{ color: item.accent }} />
              <p className="text-sm font-semibold text-slate-900">{item.name}</p>
              <p className="mt-1 text-xs text-slate-500">{counts[item.id] || 0} items</p>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={compactSearch ? 'Search titles or tags' : 'Search by file name, title, or tags'}
            className="h-11 bg-white pl-10 placeholder:text-slate-500"
            aria-label="Search by file name, title, or tags"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Popover open={sortOpen} onOpenChange={setSortOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex h-11 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:gap-2 sm:px-4"
              >
                Sort
                <ChevronDown className={`h-4 w-4 text-slate-500 transition ${sortOpen ? 'rotate-180' : ''}`} />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 rounded-xl p-1.5">
              {([
                ['popular', 'Popular'],
                ['new', 'New'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setSort(value)
                    window.localStorage.setItem(SORT_STORAGE_KEY, value)
                    setSortOpen(false)
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm ${
                    sort === value
                      ? 'bg-blue-50 font-medium text-blue-800'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {label}
                  {sort === value && <Check className="h-4 w-4" />}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <Popover open={displayOpen} onOpenChange={setDisplayOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                title="Display size"
                className="hidden h-11 w-14 items-center justify-center gap-1 rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:inline-flex"
              >
                <DisplaySizeIcon size={displaySize} />
                <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition ${displayOpen ? 'rotate-180' : ''}`} />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 rounded-xl p-3">
              <p className="mb-2 text-sm font-medium text-slate-700">Display size</p>
              <div className="grid grid-cols-3 rounded-full bg-slate-100 p-1">
                {([
                  ['small', 'Small'],
                  ['default', 'Default'],
                  ['large', 'Large'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setDisplaySize(value)
                      window.localStorage.setItem(DISPLAY_STORAGE_KEY, value)
                      setDisplayOpen(false)
                    }}
                    className={`rounded-full px-2 py-1.5 text-xs font-medium transition ${
                      displaySize === value
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading teaching resources…
        </div>
      ) : visibleResources.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Presentation className="mx-auto mb-3 h-10 w-10 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900">No files in this view</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Upload a file, or try a different category or search.
            </p>
            <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700">
              <Link href="/resources-for-teaching/upload">Upload the first file</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={`grid ${GRID_CLASS[displaySize]}`}>
          {shownResources.map((resource) => {
            const categoryInfo = getTeachingResourceCategory(resource.category)
            const isCanva = isCanvaTeachingResource(resource)
            const fileExt = isCanva ? 'Canva' : extensionOf(resource.file_name).toUpperCase()
            return (
              <Card
                key={resource.id}
                className="group overflow-hidden border-slate-200 p-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div
                  className={`relative overflow-hidden bg-slate-100 ${
                    displaySize === 'large' ? 'aspect-[21/9]' : 'aspect-[16/10]'
                  }`}
                >
                  {resource.preview_kind === 'audio' ? (
                    <TeachingResourcePreview
                      kind={resource.preview_kind}
                      url={resource.preview_url}
                      title={resource.title}
                      compact
                    />
                  ) : (
                    <button
                      type="button"
                      className="absolute inset-0 block"
                      onClick={() => void openPreview(resource)}
                    >
                      <TeachingResourcePreview
                        kind={resource.preview_kind}
                        url={resource.preview_url}
                        title={resource.title}
                        compact
                        className="transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10 opacity-70 transition group-hover:opacity-100" />
                    </button>
                  )}
                  {categoryInfo && (
                    <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-sm bg-black/70 px-2 py-1 text-[11px] font-medium leading-none tracking-wide text-white">
                      {categoryInfo.name}
                    </span>
                  )}
                  <div className="absolute right-2.5 top-2.5 flex flex-col gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                    <button
                      type="button"
                      title="Preview"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900/85 text-white shadow-md backdrop-blur-sm hover:bg-neutral-900"
                      onClick={() => void openPreview(resource)}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title={isCanva ? 'Open in Canva' : 'Download'}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900/85 text-white shadow-md backdrop-blur-sm hover:bg-neutral-900 disabled:opacity-60"
                      onClick={() => void downloadResource(resource)}
                      disabled={downloadingId === resource.id}
                    >
                      {downloadingId === resource.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isCanva ? (
                        <ExternalLink className="h-4 w-4" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <CardContent className={displaySize === 'small' ? 'p-3' : 'p-4'}>
                  <div
                    className={
                      displaySize === 'small'
                        ? 'space-y-2'
                        : 'flex items-start justify-between gap-3'
                    }
                  >
                    <div className="min-w-0">
                      <h2
                        title={resource.title}
                        className={
                          displaySize === 'small'
                            ? 'text-[13px] font-semibold leading-snug text-slate-900'
                            : 'line-clamp-2 text-[15px] font-semibold leading-snug text-slate-900'
                        }
                      >
                        {resource.title}
                      </h2>
                      <p className="mt-1.5 text-xs text-slate-500">
                        {[
                          fileExt,
                          isCanva ? null : formatFileSize(resource.file_size),
                          `${resource.download_count} ${isCanva ? 'open' : 'download'}${resource.download_count === 1 ? '' : 's'}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    {canManage(resource) && (
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          title="Edit"
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          onClick={() => {
                            setEditing(resource)
                            setEditForm({
                              title: resource.title,
                              description: resource.description || '',
                              tags: resource.tags.join(', '),
                            })
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          onClick={() => setDeleting(resource)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {!loading && visibleResources.length > 0 && (
        <div className="flex flex-col items-center gap-3 pt-2">
          <p className="text-sm text-slate-500">
            Showing {shownResources.length} of {visibleResources.length}
          </p>
          {hasMore && (
            <Button
              type="button"
              variant="outline"
              className="min-w-[10rem]"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE[displaySize])}
            >
              Load more
            </Button>
          )}
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(open) => !open && (setPreview(null), setPreviewUrl(null))}>
        <DialogContent className="max-w-3xl">
          {preview && (
            <>
              <DialogHeader>
                <DialogTitle className="leading-snug">{preview.title}</DialogTitle>
              </DialogHeader>
              <div className="overflow-hidden rounded-lg bg-slate-100">
                <div className="max-h-[28rem] min-h-[16rem]">
                  <TeachingResourcePreview
                    kind={preview.preview_kind}
                    url={previewUrl}
                    title={preview.title}
                  />
                </div>
              </div>
              {preview.description && (
                <p className="text-sm text-slate-600">{preview.description}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {preview.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                {isCanvaTeachingResource(preview)
                  ? `Canva template · ${licenseLabel(preview.license_note)}`
                  : `${preview.file_name} · ${formatFileSize(preview.file_size)} · ${licenseLabel(preview.license_note)}`}
              </p>
              <div className="flex justify-end">
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => void downloadResource(preview)}
                  disabled={downloadingId === preview.id}
                >
                  {downloadingId === preview.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : isCanvaTeachingResource(preview) ? (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {isCanvaTeachingResource(preview) ? 'Open in Canva' : 'Download'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit resource</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-tags">Tags</Label>
              <Input
                id="edit-tags"
                value={editForm.tags}
                onChange={(event) => setEditForm((current) => ({ ...current, tags: event.target.value }))}
                placeholder="heart sound, murmur, teaching"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => void saveEdit()} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete teaching resource?"
        description={
          deleting
            ? `This will permanently delete “${deleting.title}” and its file from storage.`
            : ''
        }
        confirmText="Delete file"
        variant="destructive"
        onConfirm={() => void confirmDelete()}
        isLoading={isDeleting}
      />
    </div>
  )
}

function DisplaySizeIcon({ size }: { size: DisplaySize }) {
  if (size === 'large') {
    return <span className="block h-4 w-4 rounded-[2px] border-2 border-current" />
  }
  if (size === 'small') {
    return (
      <span className="grid h-4 w-4 grid-cols-3 gap-[2px]">
        {Array.from({ length: 6 }).map((_, index) => (
          <span key={index} className="rounded-[1px] bg-current" />
        ))}
      </span>
    )
  }
  return (
    <span className="grid h-4 w-4 grid-cols-2 gap-[2px]">
      {Array.from({ length: 4 }).map((_, index) => (
        <span key={index} className="rounded-[1px] bg-current" />
      ))}
    </span>
  )
}
