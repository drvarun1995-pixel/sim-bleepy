'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Loader2,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/placements/foundation-year"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Foundation Year
        </Link>
        {canManage && (
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add topic
          </Button>
        )}
      </div>

      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{meta.label}</h1>
          <p className="text-gray-600 mt-1">{meta.description}</p>
        </div>
      </div>

      {visibleTopics.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No topics yet{canManage ? ' — add the first one.' : '.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleTopics.map((topic) => (
            <Link
              key={topic.id}
              href={`/placements/foundation-year/${cohort}/${topic.slug}`}
            >
              <Card className="h-full hover:shadow-md transition-shadow border-gray-200 hover:border-teal-300">
                <CardHeader>
                  <CardTitle className="text-lg">{topic.name}</CardTitle>
                  {topic.description && (
                    <CardDescription>{topic.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="inline-flex items-center text-sm text-gray-600 gap-1">
                    <BookOpen className="h-4 w-4" />
                    {topic.page_count || 0} article{(topic.page_count || 0) === 1 ? '' : 's'}
                  </div>
                  <span className="inline-flex items-center text-sm font-medium text-teal-700">
                    Open
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
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
          <DialogFooter>
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
