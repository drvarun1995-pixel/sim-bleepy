'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { uploadFile } from '@/utils/apiHelpers'
import { canAccessTeachingResources } from '@/lib/roles'
import {
  DEFAULT_TEACHING_LICENSE_NOTE,
  DEFAULT_TEACHING_LICENSE_SOURCE,
  TEACHING_RESOURCE_CATEGORIES,
  TEACHING_RESOURCES_MAX_FILE_BYTES,
  formatFileSize,
  getTeachingResourceCategory,
  isAllowedPreviewImage,
  isAllowedTeachingFile,
  isCanvaTemplateUrl,
  isTeachingResourceCategory,
  parseTeachingTags,
  type TeachingResourceCategoryId,
} from '@/lib/teaching-resources'

export default function UploadTeachingResourcePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const role = (session?.user as { role?: string } | undefined)?.role || ''

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<TeachingResourceCategoryId>('ppt-files')
  const [tags, setTags] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const categoryInfo = getTeachingResourceCategory(category)
  const parsedTags = useMemo(() => parseTeachingTags(tags), [tags])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/resources-for-teaching/upload')
    }
  }, [status, router])

  useEffect(() => {
    const preventDefaults = (event: DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
    }
    window.addEventListener('dragover', preventDefaults)
    window.addEventListener('drop', preventDefaults)
    return () => {
      window.removeEventListener('dragover', preventDefaults)
      window.removeEventListener('drop', preventDefaults)
    }
  }, [])

  const applyFile = (nextFile: File | null) => {
    if (!nextFile) {
      setFile(null)
      return
    }
    if (!isAllowedTeachingFile(category, nextFile.name)) {
      toast.error(`Use one of these types for ${categoryInfo?.name}: ${categoryInfo?.accept}`)
      return
    }
    if (nextFile.size > TEACHING_RESOURCES_MAX_FILE_BYTES) {
      toast.error('File size exceeds 50MB limit')
      return
    }
    setFile(nextFile)
    if (!title.trim()) {
      setTitle(nextFile.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '))
    }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const canvaOnly = category === 'graphic-templates' && isCanvaTemplateUrl(sourceUrl) && !file
    if ((!file && !canvaOnly) || !title.trim() || !isTeachingResourceCategory(category)) {
      toast.error(
        canvaOnly
          ? 'Title, Canva link, and a preview image are required'
          : 'Title, category, and file are required'
      )
      return
    }
    if (canvaOnly && !preview) {
      toast.error('Canva templates need a preview image')
      return
    }

    const formData = new FormData()
    if (file) formData.append('file', file)
    formData.append('title', title.trim())
    formData.append('description', description.trim())
    formData.append('category', category)
    formData.append('tags', parsedTags.join(','))
    formData.append('licenseSource', DEFAULT_TEACHING_LICENSE_SOURCE)
    formData.append('licenseNote', DEFAULT_TEACHING_LICENSE_NOTE)
    formData.append('sourceUrl', sourceUrl.trim())
    if (preview) formData.append('preview', preview)

    setUploading(true)
    setProgress(0)
    try {
      await uploadFile('/api/teaching-resources/upload', formData, setProgress)
      toast.success('Resource uploaded')
      router.push('/resources-for-teaching')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload resource')
    } finally {
      setUploading(false)
    }
  }

  if (status === 'loading') return <LoadingScreen />
  if (status === 'authenticated' && role && !canAccessTeachingResources(role)) {
    return <LoadingScreen />
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" className="mb-4 px-0 text-slate-600 hover:text-slate-900">
        <Link href="/resources-for-teaching">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Resources for Teaching
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Upload a teaching resource</CardTitle>
          <p className="text-sm text-slate-600">
            Files stay private, logged-in staff only, and hidden from search engines.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={(event) => void submit(event)}>
            <div>
              <Label>Category</Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {TEACHING_RESOURCE_CATEGORIES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCategory(item.id)
                      setFile(null)
                    }}
                    className={`rounded-lg border p-3 text-left ${
                      category === item.id
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Heart murmur teaching slides"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="When and how to use this file"
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="osce, cardiology, murmur"
              />
              {parsedTags.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  {parsedTags.join(' · ')}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="sourceUrl">
                {category === 'graphic-templates' ? 'Canva template link' : 'Source URL (optional)'}
              </Label>
              <Input
                id="sourceUrl"
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder={
                  category === 'graphic-templates'
                    ? 'https://www.canva.com/design/...'
                    : 'https://...'
                }
              />
              {category === 'graphic-templates' && (
                <p className="mt-1 text-xs text-slate-500">
                  Paste the Canva design link. A preview image is required; no zip file is stored.
                </p>
              )}
            </div>

            <div
              onDragOver={() => setIsDragging(true)}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                setIsDragging(false)
                applyFile(event.dataTransfer.files?.[0] || null)
              }}
              className={`rounded-xl border-2 border-dashed p-6 text-center ${
                isDragging ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-slate-50'
              }`}
            >
              <Upload className="mx-auto mb-2 h-6 w-6 text-slate-500" />
              <p className="text-sm font-medium text-slate-800">Drop the file here or browse</p>
              <p className="mt-1 text-xs text-slate-500">
                {categoryInfo?.accept} · up to {formatFileSize(TEACHING_RESOURCES_MAX_FILE_BYTES)}
              </p>
              <Input
                type="file"
                accept={categoryInfo?.accept}
                className="mt-3"
                onChange={(event) => applyFile(event.target.files?.[0] || null)}
              />
              {file && (
                <p className="mt-2 text-sm text-slate-700">
                  {file.name} · {formatFileSize(file.size)}
                </p>
              )}
            </div>

            {(category === 'ppt-files' || category === 'graphic-templates') && (
              <div>
                <Label htmlFor="preview">Preview image (recommended for PPT and design files)</Label>
                <Input
                  id="preview"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.gif"
                  className="mt-2"
                  onChange={(event) => {
                    const next = event.target.files?.[0] || null
                    if (next && !isAllowedPreviewImage(next.name)) {
                      toast.error('Preview must be a JPG, PNG, WEBP, or GIF')
                      return
                    }
                    setPreview(next)
                  }}
                />
                {preview && (
                  <p className="mt-2 text-xs text-slate-500">
                    {preview.name} · {formatFileSize(preview.size)}
                  </p>
                )}
              </div>
            )}

            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Licence: licensed to Bleepy for teaching use on the platform only. Do not
              redistribute these files outside Bleepy.
            </p>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" asChild>
                <Link href="/resources-for-teaching">Cancel</Link>
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={uploading}>
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {uploading ? `Uploading ${progress}%` : 'Upload'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
