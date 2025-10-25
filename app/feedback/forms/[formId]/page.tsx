'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  MessageSquare,
  Settings,
  BarChart3
} from 'lucide-react'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

interface FeedbackForm {
  id: string
  form_name: string
  form_template: string
  questions: any[]
  anonymous_enabled: boolean
  active: boolean
  created_at: string
  events: {
    id: string
    title: string
    date: string
    start_time: string
    end_time: string
    location: string
  } | null
  users: {
    id: string
    name: string
  } | null
}

export default function FeedbackFormView() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const formId = params.formId as string

  const [form, setForm] = useState<FeedbackForm | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session && formId) {
      loadFeedbackForm()
    }
  }, [session, formId])

  const loadFeedbackForm = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/feedback/forms/${formId}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Feedback form data received:', data.form)
        setForm(data.form)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to load feedback form')
        router.push('/feedback')
      }
    } catch (error) {
      console.error('Error loading feedback form:', error)
      toast.error('Failed to load feedback form')
      router.push('/feedback')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (!form) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Feedback Form Not Found</h3>
            <p className="text-gray-600 mb-4">The feedback form you're looking for doesn't exist or has been deleted.</p>
            <Button onClick={() => router.push('/feedback')}>
              Back to Feedback Management
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/feedback')}
            className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 transition-all duration-200 hover:scale-105 w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Back to Feedback</span>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{form.form_name}</h1>
          <p className="text-gray-600">Feedback form details and configuration</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Form Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Template</label>
                    <Badge variant="outline" className="mt-1">
                      {form.form_template}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Anonymous Responses</label>
                    <div className="mt-1">
                      {form.anonymous_enabled ? (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <Users className="h-3 w-3" />
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="w-fit">
                          Disabled
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">
                    <Badge variant={form.active ? "default" : "secondary"}>
                      {form.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Created By</label>
                  <p className="text-sm text-gray-900 mt-1">{form.users?.name || 'Unknown'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Created At</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(form.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Questions */}
            <Card>
              <CardHeader>
                <CardTitle>Form Questions</CardTitle>
              </CardHeader>
              <CardContent>
                {form.questions && form.questions.length > 0 ? (
                  <div className="space-y-3">
                    {form.questions.map((question, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            Q{index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{question.question}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              Type: {question.type} | Required: {question.required ? 'Yes' : 'No'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No questions configured for this form.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Event Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.events ? (
                  <>
                    <div>
                      <h3 className="font-medium text-gray-900">{form.events.title}</h3>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(form.events.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          {form.events.start_time} - {form.events.end_time}
                        </span>
                      </div>

                      {form.events.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{form.events.location}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No event associated with this form</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => router.push(`/feedback/analytics?form=${form.id}`)}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => router.push(`/feedback/${form.id}`)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Submit Feedback
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
