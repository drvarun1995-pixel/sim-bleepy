'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import {
  Download,
  Edit,
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
import { Textarea } from '@/components/ui/textarea'
import { canAccessTeachingResources } from '@/lib/roles'
import { startDownloadFromResponse } from '@/lib/resource-download-error'
import {
  TEACHING_RESOURCE_CATEGORIES,
  formatFileSize,
  getTeachingResourceCategory,
  type TeachingResourceCategoryId,
  type TeachingResourceRecord,
} from '@/lib/teaching-resources'

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

  const visibleResources = useMemo(
    () => (category === 'all' ? resources : resources.filter((item) => item.category === category)),
    [resources, category]
  )

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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">Resources</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Resources for Teaching
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            PPT files, graphic templates, clinical sounds, sound effects, and photos for
            CTFs, MedEd, educators, and admins. Licensed to Bleepy via Envato.
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/resources-for-teaching/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload resource
          </Link>
        </Button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by file name, title, or tags"
          className="h-11 bg-white pl-10"
        />
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
              Upload Envato assets under the Bleepy licence, or try a different category or search.
            </p>
            <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700">
              <Link href="/resources-for-teaching/upload">Upload the first file</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleResources.map((resource) => {
            const categoryInfo = getTeachingResourceCategory(resource.category)
            return (
              <Card key={resource.id} className="overflow-hidden">
                <button
                  type="button"
                  className="block h-44 w-full overflow-hidden bg-slate-100"
                  onClick={() => void openPreview(resource)}
                >
                  <TeachingResourcePreview
                    kind={resource.preview_kind}
                    url={resource.preview_url}
                    title={resource.title}
                    compact
                  />
                </button>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-slate-900">{resource.title}</h2>
                      <p className="mt-1 text-xs text-slate-500">
                        {resource.file_name} · {formatFileSize(resource.file_size)}
                      </p>
                    </div>
                    {categoryInfo && (
                      <Badge variant="outline" className={categoryInfo.tint}>
                        {categoryInfo.name}
                      </Badge>
                    )}
                  </div>
                  {resource.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {resource.tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSearchQuery(tag)}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-500">
                    {resource.license_source === 'envato' ? 'Envato · Licensed to Bleepy' : resource.license_source}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => void openPreview(resource)}>
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => void downloadResource(resource)}
                      disabled={downloadingId === resource.id}
                    >
                      {downloadingId === resource.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Download
                    </Button>
                    {canManage(resource) && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
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
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleting(resource)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(open) => !open && (setPreview(null), setPreviewUrl(null))}>
        <DialogContent className="max-w-3xl">
          {preview && (
            <>
              <DialogHeader>
                <DialogTitle>{preview.title}</DialogTitle>
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
                {preview.file_name} · {formatFileSize(preview.file_size)} ·{' '}
                {preview.license_note || 'Licensed to Bleepy via Envato'}
              </p>
              <div className="flex justify-end">
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => void downloadResource(preview)}
                  disabled={downloadingId === preview.id}
                >
                  {downloadingId === preview.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download
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
