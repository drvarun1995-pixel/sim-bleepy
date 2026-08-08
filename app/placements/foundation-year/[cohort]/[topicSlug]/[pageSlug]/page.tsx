'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit,
  FileText,
  GraduationCap,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import {
  FY_COHORT_META,
  canManageFoundationYear,
  isFyCohort,
  type FyCohort,
} from '@/lib/foundation-year'

interface FyPage {
  id: string
  title: string
  slug: string
  content?: string
  featured_image?: string
  status?: string
  updated_at?: string
  created_at?: string
}

interface FyTopic {
  id: string
  name: string
  slug: string
  cohort: FyCohort
}

interface TocItem {
  id: string
  text: string
}

export default function FoundationYearArticlePage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const cohortParam = params.cohort as string
  const topicSlug = params.topicSlug as string
  const pageSlug = params.pageSlug as string

  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState<FyPage | null>(null)
  const [topic, setTopic] = useState<FyTopic | null>(null)
  const [userRole, setUserRole] = useState('')
  const [processedHtml, setProcessedHtml] = useState('')
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null)
  const [tableOfContents, setTableOfContents] = useState<TocItem[]>([])
  const [showTOC, setShowTOC] = useState(true)
  const [readingProgress, setReadingProgress] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  const cohort = isFyCohort(cohortParam) ? cohortParam : null

  const processContent = (html: string): { html: string; toc: TocItem[] } => {
    if (!html) return { html: '', toc: [] }

    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html

    tempDiv.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src')
      if (!src || src.includes('/api/placements/images/view')) return

      let storagePath = ''
      if (src.includes('/storage/v1/object/')) {
        const pathMatch = src.match(
          /\/storage\/v1\/object\/(?:public|sign)\/placements\/(.+?)(?:\?|$)/
        )
        if (pathMatch) storagePath = decodeURIComponent(pathMatch[1])
      } else if (src.startsWith('foundation-year/') || src.includes('/images/')) {
        storagePath = src
      }

      if (storagePath) {
        img.setAttribute(
          'src',
          `/api/placements/images/view?path=${encodeURIComponent(storagePath)}`
        )
      }
    })

    const toc: TocItem[] = []
    tempDiv.querySelectorAll('h2').forEach((heading, index) => {
      const text = (heading.textContent || '').trim()
      const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      heading.id = id
      ;(heading as HTMLElement).style.scrollMarginTop = '120px'
      if (text) toc.push({ id, text })
    })

    return { html: tempDiv.innerHTML, toc }
  }

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollable = documentHeight - windowHeight
      if (scrollable <= 0) {
        setReadingProgress(0)
        return
      }
      setReadingProgress(Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [page])

  useEffect(() => {
    if (!cohort) {
      router.replace('/placements/foundation-year')
      return
    }
    if (status === 'authenticated') {
      fetchPage()
    }
  }, [status, cohort, topicSlug, pageSlug])

  const fetchPage = async () => {
    try {
      setLoading(true)

      const profileRes = await fetch('/api/user/profile')
      let role = ''
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        role = profileData.user?.role || ''
        setUserRole(role)
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

      const includeInactive = canManageFoundationYear(role)
      const pagesRes = await fetch(
        `/api/placements/foundation-year/pages?cohort=${cohort}&topicSlug=${topicSlug}${
          includeInactive ? '&includeInactive=true' : ''
        }`
      )
      if (!pagesRes.ok) throw new Error('Failed to fetch pages')
      const pagesData = await pagesRes.json()
      const foundPage = (pagesData.pages || []).find((p: FyPage) => p.slug === pageSlug)

      if (!foundPage) {
        toast.error('Page not found')
        router.push(`/placements/foundation-year/${cohort}/${topicSlug}`)
        return
      }

      if (foundPage.status !== 'published' && !canManageFoundationYear(role)) {
        toast.error('This page is not published yet')
        router.push(`/placements/foundation-year/${cohort}/${topicSlug}`)
        return
      }

      setPage(foundPage)
      const processed = processContent(foundPage.content || '')
      setProcessedHtml(processed.html)
      setTableOfContents(processed.toc)

      if (foundPage.featured_image) {
        setFeaturedImageUrl(
          `/api/placements/images/view?path=${encodeURIComponent(foundPage.featured_image)}`
        )
      } else {
        setFeaturedImageUrl(null)
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to load page')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading || !page || !topic || !cohort) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <LoadingScreen message="Loading article..." fullScreen={false} />
      </div>
    )
  }

  const updatedLabel = page.updated_at
    ? new Date(page.updated_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <div className="relative w-full max-w-[84rem] mx-auto space-y-5">
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-blue-600 transition-[width] duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
          <Link href="/placements/foundation-year" className="hover:text-teal-700">
            Foundation Year
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            href={`/placements/foundation-year/${cohort}`}
            className="hover:text-teal-700"
          >
            {FY_COHORT_META[cohort].label}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            href={`/placements/foundation-year/${cohort}/${topicSlug}`}
            className="hover:text-teal-700"
          >
            {topic.name}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-800 font-medium truncate max-w-[180px] sm:max-w-none">
            {page.title}
          </span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={`/placements/foundation-year/${cohort}/${topicSlug}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to {topic.name}
            </Button>
          </Link>
          {canManageFoundationYear(userRole) && (
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link
                href={`/placements/foundation-year/${cohort}/${topicSlug}/${pageSlug}/edit`}
              >
                <Edit className="h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
        </div>

      {featuredImageUrl ? (
        <div className="relative w-full overflow-hidden rounded-2xl bg-slate-900">
          <img
            src={featuredImageUrl}
            alt={page.title}
            className="w-full max-h-[320px] object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 px-5 sm:px-7 pb-6 pt-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium text-white mb-3">
              <GraduationCap className="h-3.5 w-3.5" />
              {FY_COHORT_META[cohort].label} · {topic.name}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight drop-shadow">
              {page.title}
            </h1>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium text-teal-700">
            {FY_COHORT_META[cohort].label} · {topic.name}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            {page.title}
          </h1>
        </div>
      )}

      {updatedLabel && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          Updated {updatedLabel}
        </div>
      )}

      <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm overflow-hidden p-0">
        <CardContent className="p-5 sm:p-8">
            {tableOfContents.length > 0 && (
              <div className="mb-8 rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50/80 to-blue-50/60 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => setShowTOC(!showTOC)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-teal-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-teal-100 text-teal-700">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <h2 className="text-base font-semibold text-gray-900">
                      Table of Contents
                    </h2>
                    <span className="text-xs text-gray-500">
                      ({tableOfContents.length} sections)
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-600 transition-transform ${
                      showTOC ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    showTOC ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <nav className="px-5 pb-4 pt-1 space-y-1">
                    {tableOfContents.map((item, index) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          scrollToHeading(item.id)
                          if (window.innerWidth < 1024) {
                            setTimeout(() => setShowTOC(false), 250)
                          }
                        }}
                        className="group block w-full text-left px-4 py-2.5 rounded-md text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm hover:text-teal-800 border-l-2 border-teal-200 hover:border-teal-500 transition-all"
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="text-teal-500 text-xs font-mono font-semibold min-w-[24px]">
                            {String(index + 1).padStart(2, '0')}.
                          </span>
                          <span className="flex-1">{item.text}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            )}

            {processedHtml ? (
              <article
                ref={contentRef}
                className="fy-article-content placements-content prose prose-lg max-w-none prose-headings:scroll-mt-28 prose-headings:text-slate-900 prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-teal-100 prose-h3:text-xl prose-h3:mt-8 prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-slate-900 prose-blockquote:border-teal-400 prose-blockquote:bg-teal-50/50 prose-blockquote:py-1 prose-blockquote:rounded-r-lg"
                dangerouslySetInnerHTML={{ __html: processedHtml }}
              />
            ) : (
              <div className="flex items-center gap-2 text-gray-500 py-12 justify-center">
                <FileText className="h-5 w-5" />
                No content yet.
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
