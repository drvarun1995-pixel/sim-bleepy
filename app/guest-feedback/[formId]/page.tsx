'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { MultipleChoiceInput } from '@/components/feedback/MultipleChoiceInput'
import {
  finalizeMcAnswer,
  isMultipleChoice,
  validateQuestionAnswer,
  type FeedbackQuestion,
} from '@/lib/feedback/questions'

interface Question {
  id: string
  type: 'rating' | 'text' | 'long_text' | 'yes_no' | 'multiple_choice'
  question: string
  required: boolean
  options?: string[]
  scale?: number
  allowMultiple?: boolean
  allowOther?: boolean
  otherPlaceholder?: string
}

interface FeedbackForm {
  id: string
  form_name: string
  questions: Question[]
  anonymous_enabled?: boolean
  certificatesEnabled?: boolean
  events: {
    id: string
    title: string
    date: string
    start_time: string
    end_time: string
    location_name?: string
  }
}

export default function GuestFeedbackFormPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const formId = params.formId as string
  const token = searchParams.get('token') || ''

  const [feedbackForm, setFeedbackForm] = useState<FeedbackForm | null>(null)
  const [responses, setResponses] = useState<Record<string, string | number | string[]>>({})
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!formId) {
      setLoadError('This feedback link is invalid or incomplete.')
      setLoading(false)
      return
    }

    ;(async () => {
      try {
        setLoading(true)
        const url = token
          ? `/api/feedback/forms/${formId}?guestToken=${encodeURIComponent(token)}`
          : `/api/feedback/forms/${formId}`
        const res = await fetch(url)
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Unable to load feedback form')
        }
        const data = await res.json()
        const form = data.feedbackForm || data.form
        if (!token && !form?.anonymous_enabled) {
          throw new Error('This feedback link is invalid or incomplete.')
        }
        setFeedbackForm(form)
        if (data.alreadySubmitted) {
          setAlreadySubmitted(true)
        }
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Unable to load feedback form')
      } finally {
        setLoading(false)
      }
    })()
  }, [formId, token])

  const handleResponseChange = (questionId: string, value: string | number | string[]) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }))
    if (errors[questionId]) {
      setErrors((prev) => ({ ...prev, [questionId]: '' }))
    }
  }

  const validateForm = () => {
    if (!feedbackForm) return false
    const next: Record<string, string> = {}
    for (const q of feedbackForm.questions) {
      const error = validateQuestionAnswer(q as FeedbackQuestion, responses[q.id], otherTexts[q.id])
      if (error) next[q.id] = error
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async () => {
    if (!feedbackForm) return
    if (!token && !feedbackForm.anonymous_enabled) return
    if (!validateForm()) {
      toast.error('Please fill in all required questions')
      return
    }

    const payload: Record<string, string | number | string[]> = {}
    for (const q of feedbackForm.questions) {
      payload[q.id] = isMultipleChoice(q)
        ? (finalizeMcAnswer(q as FeedbackQuestion, responses[q.id], otherTexts[q.id]) as string | string[])
        : responses[q.id]
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackFormId: formId,
          eventId: feedbackForm.events.id,
          responses: payload,
          guestToken: token || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        if (err.alreadySubmitted || err.code === 'ALREADY_SUBMITTED' || res.status === 409) {
          setAlreadySubmitted(true)
          toast.error('You have already submitted feedback for this event')
          return
        }
        throw new Error(err.error || 'Failed to submit feedback')
      }
      const result = await res.json()
      setSubmitted(true)
      toast.success('Feedback submitted successfully!')
      if (result.details?.autoCertificateGenerated) {
        toast.success('Your certificate will be emailed when ready.')
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4.25rem)] w-full items-center justify-center bg-slate-50">
        <LoadingScreen message="Loading feedback form..." fullScreen={false} />
      </div>
    )
  }

  if (loadError || !feedbackForm) {
    return (
      <div className="flex min-h-[calc(100vh-4.25rem)] w-full items-center justify-center bg-slate-50 px-4 py-10">
        <Card className="w-full max-w-xl">
          <CardContent className="py-12 text-center">
            <XCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
            <h1 className="text-lg font-semibold text-slate-900">Feedback unavailable</h1>
            <p className="mt-2 text-sm text-slate-600">
              {loadError || 'This feedback form could not be loaded.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted || alreadySubmitted) {
    return (
      <div className="flex min-h-[calc(100vh-4.25rem)] w-full items-center justify-center bg-slate-50 px-4 py-10">
        <Card className="w-full max-w-xl">
          <CardContent className="py-12 text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
            <h1 className="text-lg font-semibold text-slate-900">
              {submitted ? 'Thank you' : 'Feedback already submitted'}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {submitted ? (
                <>
                  Your feedback for <strong>{feedbackForm.events.title}</strong> has been
                  submitted. No account sign-in is required.
                </>
              ) : (
                <>
                  You have already given feedback for{' '}
                  <strong>{feedbackForm.events.title}</strong>. Only one submission is
                  allowed per person.
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{feedbackForm.form_name || 'Event feedback'}</CardTitle>
            <CardDescription>
              {feedbackForm.events.title}
              {feedbackForm.events.date ? ` · ${feedbackForm.events.date}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            You checked in as a walk-in guest. Complete this form without creating an account.
          </CardContent>
        </Card>

        <div className="space-y-4">
          {feedbackForm.questions.map((question) => {
            const hasError = !!errors[question.id]
            return (
              <Card key={question.id} className={hasError ? 'border-red-200' : ''}>
                <CardContent className="space-y-3 p-4">
                  <Label className="text-sm font-medium">
                    {question.question}
                    {question.required && <span className="ml-1 text-red-500">*</span>}
                  </Label>
                  {hasError && <p className="text-sm text-red-600">{errors[question.id]}</p>}

                  {question.type === 'text' && (
                    <Input
                      value={(responses[question.id] as string) || ''}
                      onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    />
                  )}
                  {question.type === 'long_text' && (
                    <Textarea
                      rows={4}
                      value={(responses[question.id] as string) || ''}
                      onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    />
                  )}
                  {question.type === 'rating' && (
                    <div className="flex gap-1">
                      {Array.from({ length: question.scale || 5 }, (_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleResponseChange(question.id, i + 1)}
                          className={`h-8 w-8 rounded border-2 text-sm font-medium ${
                            responses[question.id] === i + 1
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                  {question.type === 'yes_no' && (
                    <div className="flex gap-4">
                      {['yes', 'no'].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name={question.id}
                            checked={responses[question.id] === opt}
                            onChange={() => handleResponseChange(question.id, opt)}
                          />
                          {opt === 'yes' ? 'Yes' : 'No'}
                        </label>
                      ))}
                    </div>
                  )}
                  {question.type === 'multiple_choice' && (
                    <MultipleChoiceInput
                      question={question}
                      value={responses[question.id]}
                      otherText={otherTexts[question.id] || ''}
                      onChange={(value) => handleResponseChange(question.id, value)}
                      onOtherTextChange={(text) =>
                        setOtherTexts((prev) => ({ ...prev, [question.id]: text }))
                      }
                    />
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit feedback'}
          </Button>
        </div>
      </div>
    </div>
  )
}
