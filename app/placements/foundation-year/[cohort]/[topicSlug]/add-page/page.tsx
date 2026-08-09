'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  Loader2,
  Save,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { TiptapSimpleEditor } from '@/components/ui/tiptap-simple-editor'
import {
  canManageFoundationYear,
  fyImageScope,
  isFyCohort,
  slugify,
  type FyCohort,
} from '@/lib/foundation-year'

interface FyTopic {
  id: string
  name: string
  slug: string
  cohort: FyCohort
}

export default function AddFoundationYearPage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const cohortParam = params.cohort as string
  const topicSlug = params.topicSlug as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [topic, setTopic] = useState<FyTopic | null>(null)
  const [pageTitle, setPageTitle] = useState('')
  const [pageContent, setPageContent] = useState('')
  const [generatedSlug, setGeneratedSlug] = useState('')
  const [isSaved, setIsSaved] = useState(false)
  const [featuredImage, setFeaturedImage] = useState<string | null>(null)
  const [featuredImagePath, setFeaturedImagePath] = useState<string | null>(null)
  const [uploadingFeaturedImage, setUploadingFeaturedImage] = useState(false)
  const [showFeaturedImage, setShowFeaturedImage] = useState(false)
  const [pageStatus, setPageStatus] = useState<'published' | 'draft'>('draft')

  const isSavedRef = useRef(false)
  const pageContentRef = useRef(pageContent)

  const cohort = isFyCohort(cohortParam) ? cohortParam : null
  const imageScope = cohort && topicSlug ? fyImageScope(cohort, topicSlug) : ''

  useEffect(() => {
    if (!cohort) {
      router.replace('/placements/foundation-year')
      return
    }
    if (status === 'authenticated') {
      fetchTopic()
    }
  }, [status, cohort, topicSlug])

  useEffect(() => {
    setGeneratedSlug(pageTitle ? slugify(pageTitle, 'page') : '')
  }, [pageTitle])

  useEffect(() => {
    isSavedRef.current = isSaved
  }, [isSaved])

  useEffect(() => {
    pageContentRef.current = pageContent
  }, [pageContent])

  const fetchTopic = async () => {
    try {
      setLoading(true)
      const profileRes = await fetch('/api/user/profile')
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        if (!canManageFoundationYear(profileData.user?.role)) {
          toast.error('You do not have permission to add pages')
          router.push(`/placements/foundation-year/${cohort}/${topicSlug}`)
          return
        }
      }

      const topicsRes = await fetch(
        `/api/placements/foundation-year/topics?cohort=${cohort}&includeInactive=true`
      )
      if (!topicsRes.ok) throw new Error('Failed to fetch topics')
      const topicsData = await topicsRes.json()
      const found = (topicsData.topics || []).find((t: FyTopic) => t.slug === topicSlug)
      if (!found) {
        toast.error('Topic not found')
        router.push(`/placements/foundation-year/${cohort}`)
        return
      }
      setTopic(found)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load topic')
    } finally {
      setLoading(false)
    }
  }

  const cleanupImages = useCallback(() => {
    if (isSavedRef.current) return

    const imagePaths: string[] = []
    if (pageContentRef.current) {
      const imgRegex = /<img[^>]+src="([^"]+)"/g
      let match
      while ((match = imgRegex.exec(pageContentRef.current)) !== null) {
        const pathMatch = match[1].match(/\/api\/placements\/images\/view\?path=([^&"']+)/)
        if (pathMatch) imagePaths.push(decodeURIComponent(pathMatch[1]))
      }
    }
    if (featuredImagePath) imagePaths.push(featuredImagePath)

    if (imagePaths.length > 0) {
      const data = JSON.stringify({ imagePaths })
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/placements/images/cleanup',
          new Blob([data], { type: 'application/json' })
        )
      } else {
        fetch('/api/placements/images/cleanup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true,
        }).catch(() => {})
      }
    }
  }, [featuredImagePath])

  useEffect(() => {
    if (isSaved) return
    const handleBeforeUnload = () => {
      if (!isSavedRef.current) cleanupImages()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (!isSavedRef.current) cleanupImages()
    }
  }, [isSaved, cleanupImages])

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !generatedSlug || !imageScope) {
      if (!generatedSlug) toast.error('Please enter a page title first')
      return
    }

    try {
      setUploadingFeaturedImage(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('specialtySlug', imageScope)
      formData.append('pageSlug', generatedSlug)
      formData.append('isFeatured', 'true')

      const response = await fetch('/api/placements/images', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload image')
      }
      const data = await response.json()
      setFeaturedImage(data.url)
      setFeaturedImagePath(data.path)
      toast.success('Featured image uploaded')
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image')
    } finally {
      setUploadingFeaturedImage(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleRemoveFeaturedImage = async () => {
    if (featuredImagePath) {
      await fetch('/api/placements/images/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePaths: [featuredImagePath] }),
      }).catch(() => {})
    }
    setFeaturedImage(null)
    setFeaturedImagePath(null)
  }

  const handleSave = async () => {
    if (!topic || !pageTitle.trim()) {
      toast.error('Please fill in the title')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/placements/foundation-year/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_id: topic.id,
          title: pageTitle.trim(),
          content: pageContent,
          display_order: 0,
          featured_image: featuredImagePath,
          status: pageStatus,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create page')
      }

      const data = await response.json()
      const finalSlug = data.page?.slug || generatedSlug

      if (featuredImagePath && finalSlug && !featuredImagePath.includes(`/${finalSlug}/`)) {
        const newPath = `${imageScope}/${finalSlug}/images/featured.webp`
        await fetch(`/api/placements/foundation-year/pages/${data.page.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featured_image: newPath }),
        }).catch(() => {})
      }

      isSavedRef.current = true
      setIsSaved(true)
      toast.success('Page created successfully')
      setTimeout(() => {
        router.push(`/placements/foundation-year/${cohort}/${topicSlug}`)
      }, 100)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create page')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    cleanupImages()
    router.push(`/placements/foundation-year/${cohort}/${topicSlug}`)
  }

  if (status === 'loading' || loading) {
    return <LoadingScreen message="Loading..." />
  }

  if (!topic || !cohort) {
    return null
  }

  return (
    <div className="relative w-full max-w-[84rem] mx-auto space-y-5 sm:space-y-6 min-w-0 overflow-x-hidden px-0 sm:px-0">
      <div>
        <Button asChild variant="outline" size="sm" className="mb-4 gap-2">
          <Link href={`/placements/foundation-year/${cohort}/${topicSlug}`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sm:hidden">Back</span>
            <span className="hidden sm:inline">Back to {topic.name}</span>
          </Link>
        </Button>
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 shadow-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add New Page</h1>
            <p className="text-gray-600 mt-1">
              Create an article in <span className="font-semibold">{topic.name}</span>
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-teal-600" />
            Page Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="pageTitle">Title *</Label>
            <Input
              id="pageTitle"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              placeholder="Enter page title..."
            />
            {generatedSlug && (
              <p className="text-xs text-gray-500">
                URL: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{generatedSlug}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showFeaturedImage"
                checked={showFeaturedImage}
                onCheckedChange={(checked) => {
                  setShowFeaturedImage(checked as boolean)
                  if (!checked && featuredImagePath) handleRemoveFeaturedImage()
                }}
              />
              <Label htmlFor="showFeaturedImage" className="cursor-pointer">
                Add Featured Image
              </Label>
            </div>
            {showFeaturedImage && (
              <div className="mt-3">
                {featuredImage ? (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                    <img src={featuredImage} alt="Featured" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveFeaturedImage}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <ImageIcon className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                    <Label
                      htmlFor="featuredImage"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md"
                    >
                      {uploadingFeaturedImage ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Upload Featured Image
                        </>
                      )}
                    </Label>
                    <input
                      id="featuredImage"
                      type="file"
                      accept="image/*"
                      onChange={handleFeaturedImageUpload}
                      disabled={uploadingFeaturedImage || !pageTitle}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              {pageStatus === 'published' ? (
                <Eye className="h-4 w-4 text-green-600" />
              ) : (
                <EyeOff className="h-4 w-4 text-gray-400" />
              )}
              Status
            </Label>
            <Select
              value={pageStatus}
              onValueChange={(value: 'published' | 'draft') => setPageStatus(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <TiptapSimpleEditor
              value={pageContent}
              onChange={setPageContent}
              placeholder="Enter page content..."
              specialtySlug={imageScope}
              pageSlug={generatedSlug || undefined}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Page
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
