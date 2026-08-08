'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft,
  Edit,
  Eye,
  EyeOff,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { DeletePageDialog } from '@/components/ui/confirmation-dialog'
import {
  FY_COHORT_META,
  canManageFoundationYear,
  isFyCohort,
  type FyCohort,
} from '@/lib/foundation-year'

interface FyTopic {
  id: string
  cohort: FyCohort
  name: string
  slug: string
  description?: string
}

interface FyPage {
  id: string
  title: string
  slug: string
  content?: string
  status?: 'published' | 'draft'
  display_order: number
  is_active?: boolean
}

export default function FoundationYearTopicPage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const cohortParam = params.cohort as string
  const topicSlug = params.topicSlug as string

  const [loading, setLoading] = useState(true)
  const [topic, setTopic] = useState<FyTopic | null>(null)
  const [pages, setPages] = useState<FyPage[]>([])
  const [userRole, setUserRole] = useState('')
  const [deletingPage, setDeletingPage] = useState<FyPage | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const cohort = isFyCohort(cohortParam) ? cohortParam : null
  const canManage = canManageFoundationYear(userRole)

  useEffect(() => {
    if (!cohort) {
      router.replace('/placements/foundation-year')
      return
    }
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status, cohort, topicSlug])

  const fetchData = async () => {
    try {
      setLoading(true)

      const profileRes = await fetch('/api/user/profile')
      let role = ''
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        role = profileData.user?.role || ''
        setUserRole(role)
      }

      const includeInactive = canManageFoundationYear(role)
      const topicsRes = await fetch(
        `/api/placements/foundation-year/topics?cohort=${cohort}${
          includeInactive ? '&includeInactive=true' : ''
        }`
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

      const pagesRes = await fetch(
        `/api/placements/foundation-year/pages?cohort=${cohort}&topicSlug=${topicSlug}${
          includeInactive ? '&includeInactive=true' : ''
        }`
      )
      if (pagesRes.ok) {
        const pagesData = await pagesRes.json()
        setPages(pagesData.pages || [])
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to load topic')
    } finally {
      setLoading(false)
    }
  }

  const visiblePages = useMemo(() => {
    if (canManage) return pages
    return pages.filter((p) => p.status === 'published' && p.is_active !== false)
  }, [pages, canManage])

  const confirmDelete = async () => {
    if (!deletingPage) return
    try {
      setIsDeleting(true)
      const response = await fetch(
        `/api/placements/foundation-year/pages/${deletingPage.id}`,
        { method: 'DELETE' }
      )
      if (!response.ok) throw new Error('Failed to delete page')
      toast.success('Page deleted')
      setDeletingPage(null)
      setPages((prev) => prev.filter((p) => p.id !== deletingPage.id))
    } catch {
      toast.error('Failed to delete page')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!cohort || status === 'loading' || loading || !topic) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <LoadingScreen message="Loading topic..." fullScreen={false} />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/placements/foundation-year/${cohort}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {FY_COHORT_META[cohort].label}
        </Link>
        {canManage && (
          <Button asChild className="gap-2">
            <Link href={`/placements/foundation-year/${cohort}/${topicSlug}/add-page`}>
              <Plus className="h-4 w-4" />
              Add page
            </Link>
          </Button>
        )}
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">{topic.name}</h1>
        {topic.description && (
          <p className="text-gray-600 mt-2">{topic.description}</p>
        )}
      </div>

      {visiblePages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No articles yet{canManage ? ' — add one with the TipTap editor.' : '.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visiblePages.map((page) => (
            <Card key={page.id} className="border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-4 w-4 text-teal-600 flex-shrink-0" />
                      <span className="truncate">{page.title}</span>
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-2">
                      {page.status === 'draft' ? (
                        <Badge variant="secondary" className="gap-1">
                          <EyeOff className="h-3 w-3" />
                          Draft
                        </Badge>
                      ) : (
                        <Badge className="gap-1 bg-teal-600">
                          <Eye className="h-3 w-3" />
                          Published
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {page.status === 'published' ? (
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={`/placements/foundation-year/${cohort}/${topicSlug}/${page.slug}`}
                        >
                          View
                        </Link>
                      </Button>
                    ) : canManage ? (
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={`/placements/foundation-year/${cohort}/${topicSlug}/${page.slug}/edit`}
                        >
                          Preview / Edit
                        </Link>
                      </Button>
                    ) : null}
                    {canManage && (
                      <>
                        <Button asChild variant="ghost" size="icon">
                          <Link
                            href={`/placements/foundation-year/${cohort}/${topicSlug}/${page.slug}/edit`}
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingPage(page)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <DeletePageDialog
        open={!!deletingPage}
        onOpenChange={(open) => !open && setDeletingPage(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title={deletingPage ? `Delete "${deletingPage.title}"` : 'Delete Page'}
        description={
          deletingPage
            ? `Are you sure you want to delete "${deletingPage.title}"? This cannot be undone.`
            : 'Are you sure you want to delete this page?'
        }
      />
    </div>
  )
}
