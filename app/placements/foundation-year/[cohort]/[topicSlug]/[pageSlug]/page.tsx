'use client'

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  FileText,
  GraduationCap,
  X,
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
import {
  RelatedPostsCarousel,
  type RelatedFyPost,
} from '@/components/foundation-year/RelatedPostsCarousel'
import { ArticleAfterword } from '@/components/foundation-year/ArticleAfterword'
import { InlineRelatedPosts } from '@/components/foundation-year/InlineRelatedPosts'

const INLINE_RELATED_MARKER = 'data-fy-inline-related'

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
  const [showTOC, setShowTOC] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageLoadError, setImageLoadError] = useState(false)
  const [relatedPosts, setRelatedPosts] = useState<RelatedFyPost[]>([])
  const [nextPost, setNextPost] = useState<RelatedFyPost | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const cohort = isFyCohort(cohortParam) ? cohortParam : null

  const processContent = (html: string): { html: string; toc: TocItem[] } => {
    if (!html) return { html: '', toc: [] }

    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html

    // Drop WordPress Easy TOC / similar plugin blocks — app renders its own TOC
    tempDiv
      .querySelectorAll(
        [
          '#ez-toc-container',
          '.ez-toc-container',
          '.ez-toc',
          '#toc_container',
          '.lwptoc',
          '.toc-container',
          '[id^="ez-toc"]',
          'span.ez-toc-section',
          'span.ez-toc-section-end',
          '[class*="ez-toc-"]',
        ].join(', ')
      )
      .forEach((node) => {
        // Unwrap if the node somehow wraps heading text; otherwise remove
        if (
          node.tagName === 'SPAN' &&
          (node.textContent || '').trim() &&
          node.childNodes.length > 0
        ) {
          const parent = node.parentNode
          if (!parent) {
            node.remove()
            return
          }
          while (node.firstChild) parent.insertBefore(node.firstChild, node)
          parent.removeChild(node)
          return
        }
        node.remove()
      })

    // Remove outbound/incorrect hyperlinks for now; keep visible text
    tempDiv.querySelectorAll('a').forEach((anchor) => {
      const parent = anchor.parentNode
      if (!parent) return
      while (anchor.firstChild) {
        parent.insertBefore(anchor.firstChild, anchor)
      }
      parent.removeChild(anchor)
    })

    tempDiv.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src') || ''
      // Drop leftover WordPress lazy-load SVG placeholders (real image is a sibling)
      if (
        src.startsWith('data:image/svg+xml') ||
        (src.startsWith('data:image') && src.includes('svg'))
      ) {
        const parent = img.parentElement
        img.remove()
        if (
          parent &&
          parent.children.length === 0 &&
          !(parent.textContent || '').trim() &&
          (parent.classList.contains('wp-block-image') || parent.tagName === 'P')
        ) {
          parent.remove()
        }
        return
      }

      if (!src || src.includes('/api/placements/images/view')) {
        img.classList.add('lightbox-image')
        ;(img as HTMLImageElement).style.cursor = 'pointer'
        return
      }

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

      img.classList.add('lightbox-image')
      ;(img as HTMLImageElement).style.cursor = 'pointer'
    })

    // Wrap tables for horizontal scroll on small screens
    tempDiv.querySelectorAll('table').forEach((table) => {
      if (
        table.parentElement?.classList.contains('fy-table-scroll') ||
        table.parentElement?.classList.contains('scroll-table-scroll')
      ) {
        return
      }
      const wrapper = document.createElement('div')
      wrapper.className = 'scroll-table-scroll fy-table-scroll'
      table.parentNode?.insertBefore(wrapper, table)
      wrapper.appendChild(table)
    })

    const toc: TocItem[] = []
    const headings = tempDiv.querySelectorAll('h2')
    headings.forEach((heading, index) => {
      const text = (heading.textContent || '').trim()
      const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      heading.id = id
      ;(heading as HTMLElement).style.scrollMarginTop = '120px'
      if (text) toc.push({ id, text })
    })

    // Marker for a single sparse mid-article related block (before 2nd H2, or mid-content)
    if (!tempDiv.querySelector(`[${INLINE_RELATED_MARKER}]`)) {
      const marker = document.createElement('div')
      marker.setAttribute(INLINE_RELATED_MARKER, 'true')

      if (headings.length >= 2) {
        headings[1].parentNode?.insertBefore(marker, headings[1])
      } else {
        const children = Array.from(tempDiv.children)
        if (children.length >= 6) {
          const mid = Math.floor(children.length / 2)
          children[mid]?.before(marker)
        }
      }
    }

    return { html: tempDiv.innerHTML, toc }
  }

  const contentParts = processedHtml
    ? processedHtml.split(/<div[^>]*data-fy-inline-related[^>]*>\s*<\/div>/i)
    : []
  const hasInlineRelatedSplit = contentParts.length === 2

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

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
    if (!isMounted) return
    if (lightboxOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [lightboxOpen, isMounted])

  const openLightboxFromContainer = (container: HTMLElement, src: string) => {
    const imageSources = Array.from(container.querySelectorAll('img'))
      .map((image) => image.getAttribute('src') || image.currentSrc || '')
      .filter((imageSrc) => imageSrc && !imageSrc.includes('data:'))
    const index = imageSources.indexOf(src)
    if (index === -1) return
    setLightboxImages(imageSources)
    setCurrentImageIndex(index)
    setImageLoadError(false)
    setLightboxOpen(true)
  }

  const handleArticleImageClick = (e: ReactMouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement
    const img = target.closest('img') as HTMLImageElement | null
    const container = contentRef.current
    if (!img || !container || !container.contains(img)) return
    const src = img.getAttribute('src') || img.currentSrc
    if (!src || src.includes('data:')) return
    e.preventDefault()
    e.stopPropagation()
    openLightboxFromContainer(container, src)
  }

  useEffect(() => {
    if (!lightboxOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      else if (e.key === 'ArrowLeft' && currentImageIndex > 0) {
        setCurrentImageIndex((i) => i - 1)
        setImageLoadError(false)
      } else if (e.key === 'ArrowRight' && currentImageIndex < lightboxImages.length - 1) {
        setCurrentImageIndex((i) => i + 1)
        setImageLoadError(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, currentImageIndex, lightboxImages.length])

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

      // Related guides: same topic first, then other topics in this cohort
      try {
        const allTopics: FyTopic[] = topicsData.topics || []
        const related: RelatedFyPost[] = []

        const topicPages: { topic: FyTopic; pages: FyPage[] }[] = []
        await Promise.all(
          allTopics.map(async (t) => {
            const res = await fetch(
              `/api/placements/foundation-year/pages?cohort=${cohort}&topicSlug=${t.slug}`
            )
            if (!res.ok) return
            const data = await res.json()
            topicPages.push({ topic: t, pages: data.pages || [] })
          })
        )

        const sameTopic = topicPages.find((t) => t.topic.slug === topicSlug)
        const otherTopics = topicPages.filter((t) => t.topic.slug !== topicSlug)

        const toRelated = (t: FyTopic, p: FyPage): RelatedFyPost => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          topicSlug: t.slug,
          topicName: t.name,
          featuredImage: p.featured_image || null,
        })

        const pushPage = (t: FyTopic, p: FyPage) => {
          if (p.slug === pageSlug && t.slug === topicSlug) return
          if (p.status && p.status !== 'published') return
          related.push(toRelated(t, p))
        }

        // Next recommended = next published page in same topic by display order
        let recommended: RelatedFyPost | null = null
        if (sameTopic) {
          const ordered = [...sameTopic.pages].filter(
            (p) => !p.status || p.status === 'published'
          )
          const currentIdx = ordered.findIndex((p) => p.slug === pageSlug)
          if (currentIdx >= 0 && currentIdx < ordered.length - 1) {
            recommended = toRelated(sameTopic.topic, ordered[currentIdx + 1])
          }
        }

        sameTopic?.pages.forEach((p) => pushPage(sameTopic.topic, p))
        otherTopics.forEach(({ topic: t, pages }) => {
          pages.forEach((p) => pushPage(t, p))
        })

        // If no next in topic, fall back to first related guide
        if (!recommended && related.length > 0) {
          recommended = related[0]
        }

        setNextPost(recommended)
        setRelatedPosts(related.slice(0, 12))
      } catch {
        setRelatedPosts([])
        setNextPost(null)
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
    <div className="relative w-full max-w-[84rem] mx-auto space-y-5 min-w-0 overflow-x-hidden">
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-blue-600 transition-[width] duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <nav aria-label="Breadcrumb" className="min-w-0 text-sm text-gray-500">
          <ol className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 m-0 p-0 list-none">
            <li className="inline">
              <Link href="/placements/foundation-year" className="hover:text-teal-700">
                Foundation Year
              </Link>
            </li>
            <li className="inline min-w-0">
              <span className="mr-1.5 text-gray-400" aria-hidden="true">
                /
              </span>
              <Link
                href={`/placements/foundation-year/${cohort}`}
                className="hover:text-teal-700"
              >
                {FY_COHORT_META[cohort].label}
              </Link>
            </li>
            <li className="inline min-w-0">
              <span className="mr-1.5 text-gray-400" aria-hidden="true">
                /
              </span>
              <Link
                href={`/placements/foundation-year/${cohort}/${topicSlug}`}
                className="hover:text-teal-700"
              >
                {topic.name}
              </Link>
            </li>
            <li className="inline min-w-0 max-w-full">
              <span className="mr-1.5 text-gray-400" aria-hidden="true">
                /
              </span>
              <span className="font-medium text-gray-800 break-words">
                {page.title}
              </span>
            </li>
          </ol>
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
        <header className="relative w-full overflow-hidden rounded-2xl bg-slate-900 min-h-[14.5rem] sm:min-h-[18rem]">
          <img
            src={featuredImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-slate-900/15" />
          <div className="relative z-10 flex min-h-[14.5rem] flex-col justify-end px-5 py-6 sm:min-h-[18rem] sm:px-8 sm:py-8 md:px-10">
            <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center sm:mx-0 sm:max-w-none sm:items-start sm:text-left">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur-sm sm:mb-4 sm:text-xs sm:normal-case sm:tracking-normal sm:font-medium">
                <GraduationCap className="h-3.5 w-3.5 shrink-0 opacity-90" />
                <span>
                  {FY_COHORT_META[cohort].label} · {topic.name}
                </span>
              </div>
              <h1 className="fy-article-title font-display text-[1.65rem] font-semibold leading-[1.2] tracking-[-0.02em] text-white text-balance sm:text-4xl sm:leading-[1.15] md:text-[2.75rem]">
                {page.title}
              </h1>
              {updatedLabel && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/75 sm:text-sm">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  Updated {updatedLabel}
                </p>
              )}
            </div>
          </div>
        </header>
      ) : (
        <header className="space-y-3 text-center sm:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700 sm:text-sm sm:normal-case sm:tracking-normal sm:font-medium">
            {FY_COHORT_META[cohort].label} · {topic.name}
          </p>
          <h1 className="fy-article-title font-display text-[1.75rem] font-semibold leading-[1.2] tracking-[-0.02em] text-slate-900 text-balance sm:text-4xl md:text-[2.75rem]">
            {page.title}
          </h1>
          {updatedLabel && (
            <p className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-500 sm:justify-start sm:text-sm">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              Updated {updatedLabel}
            </p>
          )}
        </header>
      )}

        <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm overflow-hidden p-0 min-w-0">
          <CardContent className="p-5 sm:p-7 md:p-9 min-w-0">
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
                onClick={handleArticleImageClick}
                className="fy-article-content placements-content prose prose-slate max-w-none sm:prose-lg prose-headings:scroll-mt-28 prose-headings:font-display prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-slate-900 prose-h2:text-[1.35rem] sm:prose-h2:text-3xl prose-h2:mt-9 sm:prose-h2:mt-10 prose-h2:mb-3 sm:prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-teal-100 prose-h3:text-lg sm:prose-h3:text-xl prose-h3:mt-7 sm:prose-h3:mt-8 prose-p:text-slate-700 prose-p:leading-[1.75] prose-li:text-slate-700 prose-li:leading-[1.7] prose-strong:text-slate-900 prose-blockquote:border-teal-400 prose-blockquote:bg-teal-50/50 prose-blockquote:py-1 prose-blockquote:rounded-r-lg"
              >
                {hasInlineRelatedSplit ? (
                  <>
                    <div dangerouslySetInnerHTML={{ __html: contentParts[0] }} />
                    <InlineRelatedPosts
                      posts={relatedPosts.slice(0, 2)}
                      cohort={cohort}
                    />
                    <div dangerouslySetInnerHTML={{ __html: contentParts[1] }} />
                  </>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
                )}
              </article>
            ) : (
              <div className="flex items-center gap-2 text-gray-500 py-12 justify-center">
                <FileText className="h-5 w-5" />
                No content yet.
              </div>
            )}
        </CardContent>
      </Card>

      {/* Distinct afterword + related guides — outside article card */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3 px-1">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-teal-300 to-transparent" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700/80">
            End of article
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-teal-300 to-transparent" />
        </div>

        <ArticleAfterword
          pageId={page.id}
          cohort={cohort}
          topicSlug={topic.slug}
          topicName={topic.name}
          nextPost={nextPost}
        />

        <RelatedPostsCarousel posts={relatedPosts} cohort={cohort} />
      </div>

      {isMounted &&
        lightboxOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center p-3 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={
              lightboxImages.length > 0
                ? `Image ${currentImageIndex + 1} of ${lightboxImages.length}`
                : 'Image viewer'
            }
            onClick={() => setLightboxOpen(false)}
          >
            <div
              className="relative w-full h-full max-w-[min(1100px,100%)] max-h-[calc(100dvh-2rem)] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 sm:top-4 sm:right-4 z-40 bg-black/50 hover:bg-black/70 text-white border border-white/20 rounded-full w-10 h-10 sm:w-12 sm:h-12"
                onClick={() => setLightboxOpen(false)}
                aria-label="Close lightbox"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>

              {lightboxImages.length > 0 &&
              currentImageIndex >= 0 &&
              currentImageIndex < lightboxImages.length ? (
                <>
                  {currentImageIndex > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-1 sm:left-4 z-30 bg-black/50 hover:bg-black/70 text-white border border-white/20 rounded-full w-10 h-10 sm:w-12 sm:h-12"
                      onClick={() => {
                        setCurrentImageIndex((i) => i - 1)
                        setImageLoadError(false)
                      }}
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>
                  )}

                  {!imageLoadError ? (
                    <img
                      src={lightboxImages[currentImageIndex]}
                      alt={`Image ${currentImageIndex + 1} of ${lightboxImages.length}`}
                      className="w-auto h-auto max-w-[min(calc(100vw-2rem),1000px)] max-h-[calc(100dvh-6rem)] object-contain"
                      onError={() => setImageLoadError(true)}
                      onLoad={() => setImageLoadError(false)}
                    />
                  ) : (
                    <div className="text-white text-center p-4 bg-black/50 rounded-lg">
                      <p className="mb-2">Failed to load image</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-white border-white/50 hover:bg-white/10"
                        onClick={() => setImageLoadError(false)}
                      >
                        Retry
                      </Button>
                    </div>
                  )}

                  {currentImageIndex < lightboxImages.length - 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 sm:right-4 z-30 bg-black/50 hover:bg-black/70 text-white border border-white/20 rounded-full w-10 h-10 sm:w-12 sm:h-12"
                      onClick={() => {
                        setCurrentImageIndex((i) => i + 1)
                        setImageLoadError(false)
                      }}
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>
                  )}

                  {lightboxImages.length > 1 && (
                    <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                      {Math.min(currentImageIndex + 1, lightboxImages.length)} /{' '}
                      {lightboxImages.length}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-white text-center p-4">
                  <p>No image available</p>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
