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
  MapPin,
  Star,
  MessageSquare
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
  formName: string
  formTemplate: string
  questions: Question[]
  active: boolean
  createdAt: string
  events: {
    id: string
    title: string
    date: string
    start_time: string
    end_time: string
    location_name: string
  }
}

interface Event {
  id: string
  title: string
  date: string
  start_time: string
  end_time: string
  location_name: string
}

interface FormResponses {
  [questionId: string]: string | number
}

export default function EventFeedbackPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const eventId = params.eventId as string
  
  const [feedbackForm, setFeedbackForm] = useState<FeedbackForm | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [responses, setResponses] = useState<FormResponses>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<{ [questionId: string]: string }>({})
  const [showDefaultForm, setShowDefaultForm] = useState(false)

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  // Fetch feedback form and event details
  useEffect(() => {
    if (session && eventId) {
      fetchFeedbackData()
    }
  }, [session, eventId])

  const fetchFeedbackData = async () => {
    try {
      setLoading(true)
      
      // First, get event details
      const eventResponse = await fetch(`/api/events/${eventId}`)
      if (eventResponse.ok) {
        const eventData = await eventResponse.json()
        setEvent(eventData)
      }

      // Try to get feedback form for this event
      const formResponse = await fetch(`/api/feedback/forms/event/${eventId}`)
      if (formResponse.ok) {
        const formData = await formResponse.json()
        setFeedbackForm(formData.feedbackForm)
      } else if (formResponse.status === 404) {
        // No feedback form exists, show default form
        setShowDefaultForm(true)
      } else {
        throw new Error('Failed to fetch feedback form')
      }
    } catch (error) {
      console.error('Error fetching feedback data:', error)
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
    
    const questionsToValidate = feedbackForm?.questions || getDefaultQuestions()
    
    questionsToValidate.forEach(question => {
      if (question.required && (!responses[question.id] || responses[question.id] === '')) {
        newErrors[question.id] = 'This question is required'
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const getDefaultQuestions = (): Question[] => {
    return [
      {
        id: 'q1',
        type: 'rating',
        question: 'How would you rate this event overall?',
        required: true,
        scale: 5
      },
      {
        id: 'q2',
        type: 'rating',
        question: 'How clear was the content presented?',
        required: true,
        scale: 5
      },
      {
        id: 'q3',
        type: 'long_text',
        question: 'What did you find most valuable about this event?',
        required: false
      },
      {
        id: 'q4',
        type: 'long_text',
        question: 'How could this event be improved?',
        required: false
      },
      {
        id: 'q5',
        type: 'text',
        question: 'Any additional comments or suggestions?',
        required: false
      }
    ]
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields')
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
          feedbackFormId: feedbackForm?.id || 'default',
          eventId: eventId,
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
        toast.success('Your certificate has been generated and sent to your email!')
      } else {
        toast.info('Your certificate will be available after approval.')
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
                <span className="text-sm text-gray-600">Poor</span>
                <div className="flex gap-1">
                  {Array.from({ length: question.scale || 5 }, (_, i) => i + 1).map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleResponseChange(question.id, rating)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                        responses[question.id] === rating
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                <span className="text-sm text-gray-600">Excellent</span>
              </div>
            )}
            
            {question.type === 'yes_no' && (
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={question.id}
                    value="yes"
                    checked={responses[question.id] === 'yes'}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={question.id}
                    value="no"
                    checked={responses[question.id] === 'no'}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm">No</span>
                </label>
              </div>
            )}
            
            {question.type === 'multiple_choice' && question.options && (
              <div className="space-y-2">
                {question.options.map((option, index) => (
                  <label key={index} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={responses[question.id] === option}
                      onChange={(e) => handleResponseChange(question.id, e.target.value)}
                      className="h-4 w-4 text-blue-600"
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

  if (status === 'loading' || loading) {
    return <LoadingScreen message="Loading feedback form..." />
  }

  if (!session) {
    return null
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-6">
              Your feedback has been submitted successfully.
            </p>
            <Button
              onClick={() => router.push('/my-bookings')}
              className="w-full"
            >
              Back to My Bookings
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const questionsToRender = feedbackForm?.questions || getDefaultQuestions()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => router.push('/my-bookings')}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Bookings
            </Button>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {feedbackForm?.formName || 'Event Feedback'}
            </h1>
            <p className="text-gray-600 mt-2">
              Please share your thoughts about this event
            </p>
          </div>
        </div>

        {/* Event Details */}
        {event && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Date</p>
                    <p className="text-gray-900">{new Date(event.date).toLocaleDateString('en-GB')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Time</p>
                    <p className="text-gray-900">{event.start_time} - {event.end_time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Location</p>
                    <p className="text-gray-900">{event.location_name}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feedback Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Feedback Questions
            </CardTitle>
            <CardDescription>
              {showDefaultForm && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium text-sm">Using Default Feedback Form</span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-1">
                    A custom feedback form hasn't been created for this event yet. Please use the default questions below.
                  </p>
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {questionsToRender.map(renderQuestion)}
              
              <div className="flex gap-4 pt-6">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Feedback'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
