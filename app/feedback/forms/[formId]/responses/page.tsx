'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { useRole } from '@/lib/useRole'

import {
  ArrowLeft,
  BarChart3,
  Download,
  MessageSquare,
  Star,
  Users,
  Calendar,
  Clock
} from 'lucide-react'

interface Question {
  id: string
  question: string
  type: string
  required?: boolean
  scale?: number
}

interface ResponseRow {
  id: string
  completedAt: string
  createdAt: string
  user: {
    id: string | null
    name: string
    email: string | null
  }
  responses: Record<string, string | number>
  event: {
    id: string
    title: string
    date: string
    startTime: string
    endTime: string
  } | null
}

interface QuestionSummary {
  question: string
  type: string
  responses: Array<string | number>
  averageRating?: number | null
}

interface Summary {
  totalResponses: number
  averageRating: number | null
  ratingDistribution: Record<string, number>
  questionSummaries: Record<string, QuestionSummary>
}

interface ApiPayload {
  form: {
    id: string
    formName: string
    formTemplate: string
    questions: Question[]
    anonymousEnabled: boolean
    eventId: string | null
    createdAt: string
  }
  responses: ResponseRow[]
  summary: Summary
}

export default function FeedbackFormResponsesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const formId = params.formId as string
  const { canManageEvents, loading: roleLoading } = useRole()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [payload, setPayload] = useState<ApiPayload | null>(null)

  const questions = payload?.form.questions ?? []
  const responses = payload?.responses ?? []
  const questionSummaries = useMemo(() => {
    if (!payload) return []
    return Object.entries(payload.summary.questionSummaries).map(([id, summary]) => ({
      id,
      ...summary
    }))
  }, [payload])

  useEffect(() => {
    if (status === 'loading' || roleLoading) {
      return
    }

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (!canManageEvents) {
      toast.error('Access denied. Admin, MedEd Team, or CTF role required.')
      router.push('/dashboard')
      return
    }

    fetchResponses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, roleLoading, canManageEvents, formId])

  const fetchResponses = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/feedback/forms/${formId}/responses`)

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to fetch responses')
      }

      const data = await res.json()
      setPayload(data)
    } catch (error: any) {
      console.error('Failed to load feedback responses:', error)
      toast.error(error.message || 'Failed to load feedback responses')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleExport = () => {
    if (!payload) return

    const rows = responses.map((row) => {
      const base: Record<string, string | number | null> = {
        Respondent: row.user?.name || 'Anonymous',
        Email: row.user?.email || '',
        'Completed At': new Date(row.completedAt).toLocaleString('en-GB'),
        Event: row.event?.title || ''
      }

      questions.forEach((question) => {
        const value = row.responses[question.id]
        base[question.question] = value ?? ''
      })

      return base
    })

    if (rows.length === 0) {
      toast.info('No responses to export yet.')
      return
    }

    const headers = Object.keys(rows[0])
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((header) => {
        const raw = row[header] ?? ''
        const value = typeof raw === 'string' ? raw : String(raw)
        return `"${value.replace(/"/g, '""')}"`
      }).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${payload.form.formName.replace(/\s+/g, '-').toLowerCase()}-responses.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const renderRatingStars = (value: number, max = 5) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: max }).map((_, index) => (
          <Star
            key={index}
            className={`h-3.5 w-3.5 ${index < value ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return <LoadingScreen message="Loading feedback responses..." />
  }

  if (!payload) {
    return (
      <div className="p-6">
        <div className="max-w-3xl mx-auto text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Feedback responses unavailable</h2>
          <p className="text-gray-600 mb-6">We couldn’t load the responses for this feedback form. Please try again.</p>
          <Button onClick={fetchResponses} variant="outline">Retry</Button>
        </div>
      </div>
    )
  }

  const summary = payload.summary
  const anonymous = payload.form.anonymousEnabled

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/feedback/forms/${formId}`)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Form
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{payload.form.formName}</h1>
              <p className="text-gray-600 flex items-center gap-2 mt-1">
                <BarChart3 className="h-4 w-4" /> Form-specific feedback analytics
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRefreshing(true)
                fetchResponses()
              }}
              disabled={refreshing}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />Export CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Responses</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalResponses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.averageRating !== null ? `${summary.averageRating}/5` : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Response Visibility</p>
                  <p className="text-2xl font-bold text-gray-900">{anonymous ? 'Anonymous' : 'Named'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Form Template</p>
                <Badge variant="outline" className="w-fit">{payload.form.formTemplate}</Badge>
                <p className="text-xs text-gray-500">Created {new Date(payload.form.createdAt).toLocaleDateString('en-GB')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
              <CardDescription>Breakdown of rating-type answers across all responses</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(summary.ratingDistribution).length === 0 ? (
                <p className="text-sm text-gray-500">No rating responses yet.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(summary.ratingDistribution).map(([rating, count]) => (
                    <div
                      key={rating}
                      className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm"
                    >
                      <p className="text-sm font-medium text-gray-600">Rating {rating}</p>
                      <p className="text-xl font-bold text-gray-900">{count}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Linked Event</CardTitle>
              <CardDescription>Event associated with this feedback form</CardDescription>
            </CardHeader>
            <CardContent>
              {responses[0]?.event ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(responses[0].event.date).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{responses[0].event.startTime} – {responses[0].event.endTime}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{responses[0].event.title}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No event responses yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mb-10">
          <Card>
            <CardHeader>
              <CardTitle>Question Insights</CardTitle>
              <CardDescription>Aggregated metrics per question</CardDescription>
            </CardHeader>
            <CardContent>
              {questionSummaries.length === 0 ? (
                <p className="text-sm text-gray-500">No questions configured for this form.</p>
              ) : (
                <div className="space-y-4">
                  {questionSummaries.map((summary) => (
                    <div key={summary.id} className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <p className="font-medium text-gray-900">{summary.question}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">{summary.type}</p>
                        </div>
                        {summary.type === 'rating' && summary.averageRating !== undefined && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Average</span>
                            <span className="text-lg font-semibold text-gray-900">{summary.averageRating ?? 'N/A'}</span>
                          </div>
                        )}
                      </div>

                      {summary.type === 'text' || summary.type === 'long_text' ? (
                        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                          {summary.responses.length === 0 ? (
                            <p className="text-sm text-gray-500">No responses yet.</p>
                          ) : (
                            summary.responses.map((response, index) => (
                              <div key={index} className="p-3 rounded-md bg-gray-50 text-sm text-gray-700">
                                {String(response)}
                              </div>
                            ))
                          )}
                        </div>
                      ) : summary.type === 'yes_no' ? (
                        <div className="mt-4 flex gap-4">
                          {['yes', 'no'].map((option) => {
                            const count = summary.responses.filter((value) => String(value).toLowerCase() === option).length
                            return (
                              <div key={option} className="p-3 rounded-md bg-gray-100 text-sm text-gray-700">
                                <span className="font-semibold capitalize">{option}</span>: {count}
                              </div>
                            )
                          })}
                        </div>
                      ) : summary.type === 'rating' ? (
                        <div className="mt-4 flex flex-wrap gap-3 items-center">
                          {summary.responses.length === 0 ? (
                            <p className="text-sm text-gray-500">No ratings yet.</p>
                          ) : (
                            summary.responses.map((value, index) => (
                              <div key={index} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                                {renderRatingStars(Number(value) || 0)}
                                <span>{value}</span>
                              </div>
                            ))
                          )}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Individual Responses</CardTitle>
            <CardDescription>
              Detailed responses for each submission{anonymous ? ' (identities hidden due to anonymous mode).' : '.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {responses.length === 0 ? (
              <p className="text-sm text-gray-500">No responses collected yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[160px]">Respondent</TableHead>
                    <TableHead className="min-w-[160px]">Completed At</TableHead>
                    {questions.map((question) => (
                      <TableHead key={question.id} className="min-w-[180px]">{question.question}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{response.user?.name || 'Anonymous'}</span>
                          {response.user?.email && (
                            <span className="text-xs text-gray-500">{response.user.email}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-700">{new Date(response.completedAt).toLocaleString('en-GB')}</div>
                      </TableCell>
                      {questions.map((question) => {
                        const value = response.responses[question.id]
                        let display: ReactNode = value ?? '—'

                        if (value !== undefined && value !== null) {
                          if (question.type === 'rating') {
                            const numeric = Number(value)
                            display = (
                              <div className="flex flex-col gap-1">
                                <span>{numeric}/5</span>
                                {renderRatingStars(numeric)}
                              </div>
                            )
                          } else if (question.type === 'yes_no') {
                            display = String(value).toLowerCase() === 'yes' ? 'Yes' : 'No'
                          } else {
                            display = String(value)
                          }
                        }

                        return (
                          <TableCell key={question.id}>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                              {display}
                            </div>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

