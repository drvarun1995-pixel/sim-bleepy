'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
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
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { DeletePageDialog } from '@/components/ui/confirmation-dialog'
import { FoundationYearSearch } from '@/components/foundation-year/FoundationYearSearch'
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
  featured_image?: string | null
  status?: 'published' | 'draft'
  display_order: number
  is_active?: boolean
  updated_at?: string
  requires_auth?: boolean | null
}

function imageUrl(path?: string | null) {
  if (!path) return null
  return `/api/placements/images/view?path=${encodeURIComponent(path)}`
}

function formatUpdated(iso?: string) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return null
  }
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

  const publishedCount = useMemo(
    () => pages.filter((p) => p.status === 'published' && p.is_active !== false).length,
    [pages]
  )

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
    <div className="relative w-full max-w-[84rem] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <Button asChild variant="outline" size="sm" className="gap-2 max-w-[calc(100%-6rem)]">
          <Link href={`/placements/foundation-year/${cohort}`}>
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">Back</span>
              <span className="hidden sm:inline">Back to {FY_COHORT_META[cohort].label}</span>
            </span>
          </Link>
        </Button>
        {canManage && (
          <Button asChild className="gap-2 shrink-0">
            <Link href={`/placements/foundation-year/${cohort}/${topicSlug}/add-page`}>
              <Plus className="h-4 w-4" />
              <span className="sm:hidden">Add</span>
              <span className="hidden sm:inline">Add page</span>
            </Link>
          </Button>
        )}
      </div>

      <section className="relative rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-blue-50 shadow-sm">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-teal-200/35 blur-3xl" />
        </div>
        <div className="relative px-4 py-6 sm:px-8 sm:py-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700 sm:text-[11px]">
            {FY_COHORT_META[cohort].label}
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
            {topic.name}
          </h1>
          {topic.description && (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
              {topic.description}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
              <BookOpen className="h-3.5 w-3.5 text-teal-600" />
              {publishedCount} published
            </span>
            {canManage && pages.length !== publishedCount && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                <EyeOff className="h-3.5 w-3.5 text-slate-500" />
                {pages.length - publishedCount} draft
              </span>
            )}
          </div>
          <div className="relative mt-5 min-w-0 sm:mt-6">
            <FoundationYearSearch
              cohort={cohort}
              topicSlug={topicSlug}
              placeholder={`Search in ${topic.name}…`}
              mobilePlaceholder="Search this topic…"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 sm:space-y-5">
        <div className="px-0.5">
          <h2 className="text-lg font-semibold text-slate-900">Guides</h2>
          <p className="mt-1 text-sm text-slate-500">Articles in this topic.</p>
        </div>

        {visiblePages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-12 text-center">
            <FileText className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-700">No articles yet</p>
            <p className="mt-1 text-sm text-slate-500">
              {canManage ? 'Add one with the TipTap editor.' : 'Check back soon.'}
            </p>
            {canManage && (
              <Button asChild className="mt-4 gap-2">
                <Link href={`/placements/foundation-year/${cohort}/${topicSlug}/add-page`}>
                  <Plus className="h-4 w-4" />
                  Add page
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
            {visiblePages.map((page) => {
              const href =
                page.status === 'published'
                  ? `/placements/foundation-year/${cohort}/${topicSlug}/${page.slug}`
                  : `/placements/foundation-year/${cohort}/${topicSlug}/${page.slug}/edit`
              const img = imageUrl(page.featured_image)
              const updated = formatUpdated(page.updated_at)

              return (
                <div
                  key={page.id}
                  className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-teal-300 hover:shadow-md"
                >
                  <Link href={href} className="flex min-w-0 flex-1 flex-col sm:flex-row">
                    <div className="relative h-32 w-full shrink-0 bg-gradient-to-br from-teal-700 to-slate-800 sm:h-auto sm:w-28 md:w-32">
                      {img ? (
                        <img
                          src={img}
                          alt=""
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full min-h-[8rem] items-center justify-center text-white/80 sm:min-h-[7.5rem]">
                          <FileText className="h-7 w-7" />
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-3.5 sm:gap-2 sm:p-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {page.status === 'draft' ? (
                          <Badge variant="secondary" className="gap-1">
                            <EyeOff className="h-3 w-3" />
                            Draft
                          </Badge>
                        ) : (
                          <Badge className="gap-1 bg-teal-600 hover:bg-teal-600">
                            <Eye className="h-3 w-3" />
                            Published
                          </Badge>
                        )}
                        {page.requires_auth ? (
                          <Badge variant="outline" className="border-amber-200 text-amber-800 bg-amber-50">
                            Members only
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-sky-200 text-sky-800 bg-sky-50">
                            Public
                          </Badge>
                        )}
                        {updated && (
                          <span className="text-xs text-slate-500">Updated {updated}</span>
                        )}
                      </div>
                      <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 group-hover:text-teal-900">
                        {page.title}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-teal-700">
                        {page.status === 'published' ? 'Read guide' : 'Open draft'}
                        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>

                  {canManage && (
                    <div className="flex flex-wrap items-center justify-stretch gap-1 border-t border-slate-100 px-2 py-1.5 sm:justify-end">
                      {!page.requires_auth &&
                        page.status === 'published' &&
                        cohort === 'general' && (
                          <Button asChild variant="ghost" size="sm" className="flex-1 gap-1.5 sm:flex-none">
                            <Link
                              href={`/guides/foundation-year/${topicSlug}/${page.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View public
                            </Link>
                          </Button>
                        )}
                      <Button asChild variant="ghost" size="sm" className="flex-1 gap-1.5 sm:flex-none">
                        <Link
                          href={`/placements/foundation-year/${cohort}/${topicSlug}/${page.slug}/edit`}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 gap-1.5 text-red-600 hover:text-red-700 sm:flex-none"
                        onClick={() => setDeletingPage(page)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

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
