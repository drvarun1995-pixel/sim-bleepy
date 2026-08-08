'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft,
  Edit3,
  Eye,
  EyeOff,
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
  type FyCohort,
} from '@/lib/foundation-year'

interface FyTopic {
  id: string
  name: string
  slug: string
  cohort: FyCohort
}

interface FyPage {
  id: string
  title: string
  slug: string
  content?: string
  featured_image?: string | null
  status?: 'published' | 'draft'
}

export default function EditFoundationYearPage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const cohortParam = params.cohort as string
  const topicSlug = params.topicSlug as string
  const pageSlug = params.pageSlug as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [topic, setTopic] = useState<FyTopic | null>(null)
  const [page, setPage] = useState<FyPage | null>(null)
  const [pageTitle, setPageTitle] = useState('')
  const [pageContent, setPageContent] = useState('')
  const [pageStatus, setPageStatus] = useState<'published' | 'draft'>('draft')
  const [featuredImage, setFeaturedImage] = useState<string | null>(null)
  const [featuredImagePath, setFeaturedImagePath] = useState<string | null>(null)
  const [uploadingFeaturedImage, setUploadingFeaturedImage] = useState(false)
  const [showFeaturedImage, setShowFeaturedImage] = useState(false)

  const cohort = isFyCohort(cohortParam) ? cohortParam : null
  const imageScope = cohort && topicSlug ? fyImageScope(cohort, topicSlug) : ''

  useEffect(() => {
    if (!cohort) {
      router.replace('/placements/foundation-year')
      return
    }
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status, cohort, topicSlug, pageSlug])

  const fetchData = async () => {
    try {
      setLoading(true)

      const profileRes = await fetch('/api/user/profile')
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        if (!canManageFoundationYear(profileData.user?.role)) {
          toast.error('You do not have permission to edit pages')
          router.push(`/placements/foundation-year/${cohort}/${topicSlug}/${pageSlug}`)
          return
        }
      }

      const topicsRes = await fetch(
        `/api/placements/foundation-year/topics?cohort=${cohort}&includeInactive=true`
      )
      if (!topicsRes.ok) throw new Error('Failed to fetch topics')
      const topicsData = await topicsRes.json()
      const foundTopic = (topicsData.topics || []).find((t: FyTopic) => t.slug === topicSlug)
      if (!foundTopic) {
        toast.error('Topic not found')
        router.push(`/placements/foundation-year/${cohort}`)
        return
      }
      setTopic(foundTopic)

      const pagesRes = await fetch(
        `/api/placements/foundation-year/pages?cohort=${cohort}&topicSlug=${topicSlug}&includeInactive=true`
      )
      if (!pagesRes.ok) throw new Error('Failed to fetch pages')
      const pagesData = await pagesRes.json()
      const foundPage = (pagesData.pages || []).find((p: FyPage) => p.slug === pageSlug)
      if (!foundPage) {
        toast.error('Page not found')
        router.push(`/placements/foundation-year/${cohort}/${topicSlug}`)
        return
      }

      setPage(foundPage)
      setPageTitle(foundPage.title)
      setPageContent(foundPage.content || '')
      setPageStatus(foundPage.status || 'draft')
      if (foundPage.featured_image) {
        setFeaturedImagePath(foundPage.featured_image)
        setFeaturedImage(
          `/api/placements/images/view?path=${encodeURIComponent(foundPage.featured_image)}`
        )
        setShowFeaturedImage(true)
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to load page')
    } finally {
      setLoading(false)
    }
  }

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !page || !imageScope) return

    try {
      setUploadingFeaturedImage(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('specialtySlug', imageScope)
      formData.append('pageSlug', page.slug)
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
    if (!page || !pageTitle.trim()) {
      toast.error('Please fill in the title')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/placements/foundation-year/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pageTitle.trim(),
          content: pageContent,
          featured_image: featuredImagePath,
          status: pageStatus,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update page')
      }

      const data = await response.json()
      const nextSlug = data.page?.slug || page.slug
      toast.success('Page updated')
      router.push(`/placements/foundation-year/${cohort}/${topicSlug}/${nextSlug}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update page')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading || !page || !topic || !cohort) {
    return <LoadingScreen message="Loading editor..." />
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      <div>
        <Link href={`/placements/foundation-year/${cohort}/${topicSlug}/${page.slug}`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to article
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Page</h1>
        <p className="text-gray-600 mt-1">{topic.name}</p>
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
            />
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
                Featured Image
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
                      disabled={uploadingFeaturedImage}
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
              pageSlug={page.slug}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/placements/foundation-year/${cohort}/${topicSlug}/${page.slug}`)
              }
            >
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
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
