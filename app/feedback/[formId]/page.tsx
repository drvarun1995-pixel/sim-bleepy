'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Calendar,
  Clock,
  MapPin
} from 'lucide-react'
import { toast } from 'sonner'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

interface Question {
  id: string
  type: 'rating' | 'text' | 'long_text' | 'yes_no' | 'multiple_choice'
  question: string
  required: boolean
  options?: string[]
  scale?: number
}

interface FeedbackForm {
  id: string
  form_name: string
  form_template: string
  questions: Question[]
  events: {
    id: string
    title: string
    date: string
    start_time: string
    end_time: string
    location_name?: string
  }
}

interface FormResponses {
  [questionId: string]: string | number
}

export default function FeedbackFormPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const formId = params.formId as string
  
  const [feedbackForm, setFeedbackForm] = useState<FeedbackForm | null>(null)
  const [responses, setResponses] = useState<FormResponses>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<{ [questionId: string]: string }>({})

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  // Fetch feedback form
  useEffect(() => {
    if (session && formId) {
      fetchFeedbackForm()
    }
  }, [session, formId])

  const fetchFeedbackForm = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/feedback/forms/${formId}`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Feedback form not found')
          router.push('/my-bookings')
          return
        }
        throw new Error('Failed to fetch feedback form')
      }
      
      const data = await response.json()
      setFeedbackForm(data.feedbackForm)
    } catch (error) {
      console.error('Error fetching feedback form:', error)
      toast.error('Failed to load feedback form')
    } finally {
      setLoading(false)
    }
  }

  const handleResponseChange = (questionId: string, value: string | number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }))
    
    // Clear error for this question
    if (errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: { [questionId: string]: string } = {}
    
    feedbackForm?.questions.forEach(question => {
      if (question.required && !responses[question.id]) {
        newErrors[question.id] = 'This question is required'
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!feedbackForm) return
    
    if (!validateForm()) {
      toast.error('Please fill in all required questions')
      return
    }

    try {
      setSubmitting(true)
      
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackFormId: formId,
          eventId: feedbackForm.events.id,
          responses: responses
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit feedback')
      }

      const result = await response.json()
      setSubmitted(true)
      toast.success('Feedback submitted successfully!')
      
      // Show certificate status
      if (result.details?.autoCertificateGenerated) {
        toast.success('Your certificate has been automatically generated!')
      } else {
        toast.info('Your certificate will be available after manual approval.')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  const renderQuestion = (question: Question) => {
    const hasError = errors[question.id]
    
    return (
      <Card key={question.id} className={`${hasError ? 'border-red-200' : ''}`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">
                {question.question}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {hasError && (
                <p className="text-red-600 text-sm mt-1">{hasError}</p>
              )}
            </div>
            
            {question.type === 'text' && (
              <Input
                value={responses[question.id] || ''}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                placeholder="Your answer..."
                className={hasError ? 'border-red-300' : ''}
              />
            )}
            
            {question.type === 'long_text' && (
              <Textarea
                value={responses[question.id] || ''}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                placeholder="Your answer..."
                rows={4}
                className={hasError ? 'border-red-300' : ''}
              />
            )}
            
            {question.type === 'rating' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">1</span>
                <div className="flex gap-1">
                  {Array.from({ length: question.scale || 5 }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleResponseChange(question.id, i + 1)}
                      className={`w-8 h-8 border-2 rounded flex items-center justify-center text-sm font-medium ${
                        responses[question.id] === i + 1
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <span className="text-sm text-gray-600">{question.scale || 5}</span>
              </div>
            )}
            
            {question.type === 'yes_no' && (
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={question.id}
                    checked={responses[question.id] === 'yes'}
                    onChange={() => handleResponseChange(question.id, 'yes')}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={question.id}
                    checked={responses[question.id] === 'no'}
                    onChange={() => handleResponseChange(question.id, 'no')}
                    className="text-blue-600"
                  />
                  <span className="text-sm">No</span>
                </label>
              </div>
            )}
            
            {question.type === 'multiple_choice' && (
              <div className="space-y-2">
                {(question.options || []).map((option, index) => (
                  <label key={index} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={responses[question.id] === option}
                      onChange={() => handleResponseChange(question.id, option)}
                      className="text-blue-600"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return <LoadingScreen message="Loading Feedback Form..." />
  }

  if (!session) {
    return null
  }

  if (!feedbackForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Form Not Found</h3>
            <p className="text-gray-500 mb-4">
              The feedback form you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push('/my-bookings')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Feedback Submitted!</h3>
            <p className="text-gray-500 mb-6">
              Thank you for your feedback. Your certificate will be available soon.
            </p>
            <div className="space-y-2">
              <Button onClick={() => router.push('/my-bookings')} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to My Bookings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => router.push('/my-bookings')}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Feedback Form</h1>
              <p className="text-gray-600 mt-2">{feedbackForm.form_name}</p>
            </div>
          </div>

          {/* Event Details */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feedbackForm.events.title}
                  </h3>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(feedbackForm.events.date).toLocaleDateString('en-GB')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {feedbackForm.events.start_time} - {feedbackForm.events.end_time}
                    </div>
                    {feedbackForm.events.location_name && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {feedbackForm.events.location_name}
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="bg-blue-100 text-blue-600">
                  {feedbackForm.form_template.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback Form */}
        <div className="space-y-6">
          {feedbackForm.questions.map(renderQuestion)}
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            size="lg"
          >
            {submitting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Important Information</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Please complete all required questions (marked with *)</li>
                  <li>• Your feedback helps us improve our medical education programs</li>
                  <li>• Your certificate will be available after submitting this form</li>
                  <li>• You can access this form anytime from your "My Bookings" page</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


