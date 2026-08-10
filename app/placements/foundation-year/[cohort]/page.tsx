'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  GraduationCap,
  Layers,
  Loader2,
  Plus,
  Sparkles,
  Stethoscope,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
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
  display_order: number
  is_active: boolean
  page_count?: number
}

const COHORT_ICON: Record<FyCohort, typeof GraduationCap> = {
  general: Layers,
  basildon: Building2,
  fy1: Stethoscope,
  fy2: GraduationCap,
}

const COHORT_ACCENT: Record<FyCohort, string> = {
  general: 'from-teal-500 to-cyan-600',
  basildon: 'from-amber-500 to-orange-600',
  fy1: 'from-blue-500 to-indigo-600',
  fy2: 'from-violet-500 to-purple-600',
}

export default function FoundationYearCohortPage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const cohortParam = params.cohort as string

  const [loading, setLoading] = useState(true)
  const [topics, setTopics] = useState<FyTopic[]>([])
  const [userRole, setUserRole] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [topicName, setTopicName] = useState('')
  const [topicDescription, setTopicDescription] = useState('')

  const cohort = isFyCohort(cohortParam) ? cohortParam : null
  const meta = cohort ? FY_COHORT_META[cohort] : null
  const canManage = canManageFoundationYear(userRole)

  useEffect(() => {
    if (!cohort) {
      router.replace('/placements/foundation-year')
      return
    }

    if (status === 'authenticated') {
      fetchData()
    }
  }, [status, cohort])

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
      const list: FyTopic[] = topicsData.topics || []

      const withCounts = await Promise.all(
        list.map(async (topic) => {
          try {
            const pagesUrl = `/api/placements/foundation-year/pages?cohort=${cohort}&topicSlug=${topic.slug}${
              includeInactive ? '&includeInactive=true' : ''
            }`
            const pagesRes = await fetch(pagesUrl)
            const pagesData = pagesRes.ok ? await pagesRes.json() : { pages: [] }
            return { ...topic, page_count: pagesData.pages?.length || 0 }
          } catch {
            return { ...topic, page_count: 0 }
          }
        })
      )

      setTopics(withCounts)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load topics')
    } finally {
      setLoading(false)
    }
  }

  const visibleTopics = useMemo(
    () => (canManage ? topics : topics.filter((t) => t.is_active)),
    [topics, canManage]
  )

  const totalArticles = useMemo(
    () => visibleTopics.reduce((sum, t) => sum + (t.page_count || 0), 0),
    [visibleTopics]
  )

  const handleCreateTopic = async () => {
    if (!cohort || !topicName.trim()) {
      toast.error('Topic name is required')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/placements/foundation-year/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cohort,
          name: topicName.trim(),
          description: topicDescription.trim() || null,
          display_order: topics.length + 1,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create topic')
      }

      toast.success('Topic created')
      setShowAddDialog(false)
      setTopicName('')
      setTopicDescription('')
      await fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create topic')
    } finally {
      setSaving(false)
    }
  }

  if (!cohort || !meta || status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <LoadingScreen message="Loading topics..." fullScreen={false} />
      </div>
    )
  }

  const Icon = COHORT_ICON[cohort]

  return (
    <div className="relative w-full max-w-[84rem] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <Button asChild variant="outline" size="sm" className="gap-2 max-w-full">
          <Link href="/placements/foundation-year">
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">Back</span>
              <span className="hidden sm:inline">Back to Foundation Year</span>
            </span>
          </Link>
        </Button>
        {canManage && (
          <Button onClick={() => setShowAddDialog(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">Add topic</span>
          </Button>
        )}
      </div>

      <section className="relative rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-blue-50 shadow-sm">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-teal-200/40 blur-3xl" />
        </div>
        <div className="relative px-4 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${COHORT_ACCENT[cohort]} text-white shadow-lg sm:h-14 sm:w-14`}
            >
              <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700 sm:text-[11px]">
                <Sparkles className="h-3.5 w-3.5" />
                Foundation Year
              </div>
              <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
                {meta.label}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                {meta.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                  <Layers className="h-3.5 w-3.5 text-teal-600" />
                  {visibleTopics.length} topic{visibleTopics.length === 1 ? '' : 's'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                  <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                  {totalArticles} guide{totalArticles === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>
          <div className="relative mt-5 min-w-0 sm:mt-6">
            <FoundationYearSearch
              cohort={cohort}
              placeholder={`Search ${meta.label} guides…`}
              mobilePlaceholder={`Search ${meta.shortLabel}…`}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 sm:space-y-5">
        <div className="px-0.5">
          <h2 className="text-lg font-semibold text-slate-900">Topics</h2>
          <p className="mt-1 text-sm text-slate-500">
            Open a topic to browse its Foundation Year guides.
          </p>
        </div>

        {visibleTopics.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-12 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-700">No topics yet</p>
            <p className="mt-1 text-sm text-slate-500">
              {canManage ? 'Add the first topic to get started.' : 'Check back soon.'}
            </p>
            {canManage && (
              <Button onClick={() => setShowAddDialog(true)} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Add topic
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
            {visibleTopics.map((topic) => (
              <Link
                key={topic.id}
                href={`/placements/foundation-year/${cohort}/${topic.slug}`}
                className="group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition active:scale-[0.99] hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md sm:p-5"
              >
                <div className="mb-3 flex items-start justify-between gap-3 sm:mb-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  {!topic.is_active && canManage && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Inactive
                    </span>
                  )}
                </div>
                <h3 className="text-base font-semibold leading-snug text-slate-900 sm:text-lg">
                  {topic.name}
                </h3>
                {topic.description && (
                  <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-600">
                    {topic.description}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 sm:mt-5">
                  <span className="text-xs font-medium text-slate-500">
                    {topic.page_count || 0} article{(topic.page_count || 0) === 1 ? '' : 's'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 transition group-hover:gap-1.5">
                    Open
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add topic</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="topic-name">Name</Label>
              <Input
                id="topic-name"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="e.g. Working on-calls"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic-description">Description</Label>
              <Textarea
                id="topic-description"
                value={topicDescription}
                onChange={(e) => setTopicDescription(e.target.value)}
                placeholder="Short summary of this topic"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleCreateTopic} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
