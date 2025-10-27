'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Eye, 
  Save, 
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { useRole } from '@/lib/useRole'

interface Question {
  id: string
  type: 'rating' | 'text' | 'long_text' | 'yes_no' | 'multiple_choice'
  question: string
  required: boolean
  options?: string[] // For multiple choice
  scale?: number // For rating
}

interface Event {
  id: string
  title: string
  date: string
  start_time: string
  end_time: string
  booking_enabled: boolean
}

export default function FeedbackFormBuilderPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { canManageEvents, loading: roleLoading } = useRole()
  
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [formName, setFormName] = useState('')
  const [formTemplate, setFormTemplate] = useState<'workshop' | 'seminar' | 'clinical_skills' | 'custom'>('custom')
  const [questions, setQuestions] = useState<Question[]>([])
  const [previewMode, setPreviewMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check permissions
  useEffect(() => {
    if (status === 'loading' || roleLoading) return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (!canManageEvents) {
      toast.error('Access denied. MedEd Team, CTF, or Admin role required.')
      router.push('/dashboard')
      return
    }
  }, [session, status, canManageEvents, roleLoading, router])

  // Fetch events
  useEffect(() => {
    if (session && canManageEvents) {
      fetchEvents()
    }
  }, [session, canManageEvents])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/events')
      if (!response.ok) throw new Error('Failed to fetch events')
      
      const eventsData = await response.json()
      const eventsWithBooking = eventsData.filter((event: Event) => event.booking_enabled)
      setEvents(eventsWithBooking)
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error('Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q${Date.now()}`,
      type: 'text',
      question: '',
      required: false
    }
    setQuestions([...questions, newQuestion])
  }

  const removeQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId))
  }

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    ))
  }

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId)
    if (question && question.options) {
      updateQuestion(questionId, {
        options: [...question.options, '']
      })
    } else {
      updateQuestion(questionId, {
        options: ['']
      })
    }
  }

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId)
    if (question && question.options) {
      const newOptions = [...question.options]
      newOptions[optionIndex] = value
      updateQuestion(questionId, { options: newOptions })
    }
  }

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId)
    if (question && question.options) {
      const newOptions = question.options.filter((_, index) => index !== optionIndex)
      updateQuestion(questionId, { options: newOptions })
    }
  }

  const loadTemplate = (template: 'workshop' | 'seminar' | 'clinical_skills') => {
    let templateQuestions: Question[] = []
    
    if (template === 'workshop') {
      templateQuestions = [
        {
          id: 'q1',
          type: 'rating',
          question: 'How would you rate this workshop overall?',
          required: true,
          scale: 5
        },
        {
          id: 'q2',
          type: 'rating',
          question: 'How relevant was the content to your learning needs?',
          required: true,
          scale: 5
        },
        {
          id: 'q3',
          type: 'text',
          question: 'What was the most valuable thing you learned?',
          required: false
        },
        {
          id: 'q4',
          type: 'long_text',
          question: 'How could this workshop be improved?',
          required: false
        },
        {
          id: 'q5',
          type: 'yes_no',
          question: 'Would you recommend this workshop to others?',
          required: true
        }
      ]
    } else if (template === 'seminar') {
      templateQuestions = [
        {
          id: 'q1',
          type: 'rating',
          question: 'How would you rate this seminar?',
          required: true,
          scale: 5
        },
        {
          id: 'q2',
          type: 'rating',
          question: 'How clear was the presentation?',
          required: true,
          scale: 5
        },
        {
          id: 'q3',
          type: 'text',
          question: 'What key insights did you gain?',
          required: false
        },
        {
          id: 'q4',
          type: 'long_text',
          question: 'Any suggestions for future seminars?',
          required: false
        }
      ]
    } else if (template === 'clinical_skills') {
      templateQuestions = [
        {
          id: 'q1',
          type: 'rating',
          question: 'How would you rate this clinical skills session?',
          required: true,
          scale: 5
        },
        {
          id: 'q2',
          type: 'rating',
          question: 'How confident do you feel with these skills now?',
          required: true,
          scale: 5
        },
        {
          id: 'q3',
          type: 'text',
          question: 'What skills would you like more practice with?',
          required: false
        },
        {
          id: 'q4',
          type: 'long_text',
          question: 'How could the practical elements be improved?',
          required: false
        }
      ]
    }
    
    setQuestions(templateQuestions)
    setFormTemplate(template)
  }

  const handleSave = async () => {
    if (!selectedEventId) {
      toast.error('Please select an event')
      return
    }
    
    if (!formName.trim()) {
      toast.error('Please enter a form name')
      return
    }
    
    if (questions.length === 0) {
      toast.error('Please add at least one question')
      return
    }
    
    // Validate questions
    const invalidQuestions = questions.filter(q => !q.question.trim())
    if (invalidQuestions.length > 0) {
      toast.error('Please fill in all question text')
      return
    }

    try {
      setSaving(true)
      
      const requestData = {
        eventId: selectedEventId,
        form_name: formName.trim(),
        form_template: formTemplate,
        customQuestions: formTemplate === 'custom' ? questions : undefined,
        questions: formTemplate === 'custom' ? questions : undefined  // Also send as 'questions' for compatibility
      }
      
      console.log('📤 Sending feedback form request:', {
        url: '/api/feedback/forms',
        method: 'POST',
        data: requestData,
        selectedEventIds: [selectedEventId],
        availableEvents: events
      })
      
      const response = await fetch('/api/feedback/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ Feedback form creation error:', {
          status: response.status,
          statusText: response.statusText,
          error: error
        })
        throw new Error(error.error || 'Failed to create feedback form')
      }

      toast.success('Feedback form created successfully!')
      router.push('/feedback/forms')
    } catch (error) {
      console.error('Error creating feedback form:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create feedback form')
    } finally {
      setSaving(false)
    }
  }

  const renderQuestionBuilder = (question: Question) => (
    <Card key={question.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2 text-gray-400">
            <GripVertical className="h-4 w-4" />
            <span className="text-sm font-medium">Q{questions.indexOf(question) + 1}</span>
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Question Type:</Label>
              <Select
                value={question.type}
                onValueChange={(value) => updateQuestion(question.id, { type: value as Question['type'] })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Short Text</SelectItem>
                  <SelectItem value="long_text">Long Text</SelectItem>
                  <SelectItem value="rating">Rating Scale</SelectItem>
                  <SelectItem value="yes_no">Yes/No</SelectItem>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor={`question-${question.id}`}>Question Text:</Label>
              <Textarea
                id={`question-${question.id}`}
                value={question.question}
                onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                placeholder="Enter your question here..."
                className="mt-1"
              />
            </div>
            
            {question.type === 'rating' && (
              <div>
                <Label htmlFor={`scale-${question.id}`}>Rating Scale (1-10):</Label>
                <Input
                  id={`scale-${question.id}`}
                  type="number"
                  min="1"
                  max="10"
                  value={question.scale || 5}
                  onChange={(e) => updateQuestion(question.id, { scale: parseInt(e.target.value) })}
                  className="w-20 mt-1"
                />
              </div>
            )}
            
            {question.type === 'multiple_choice' && (
              <div>
                <Label>Options:</Label>
                <div className="space-y-2 mt-1">
                  {(question.options || []).map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(question.id, index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => removeOption(question.id, index)}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    onClick={() => addOption(question.id)}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Required question</span>
              </label>
            </div>
          </div>
          
          <Button
            onClick={() => removeQuestion(question.id)}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderPreview = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{formName || 'Feedback Form'}</h3>
        <p className="text-gray-600">Preview of your feedback form</p>
      </div>
      
      {questions.map((question, index) => (
        <Card key={question.id}>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">
                  {index + 1}. {question.question}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
              </div>
              
              {question.type === 'text' && (
                <Input placeholder="Your answer..." disabled />
              )}
              
              {question.type === 'long_text' && (
                <Textarea placeholder="Your answer..." disabled />
              )}
              
              {question.type === 'rating' && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">1</span>
                  <div className="flex gap-1">
                    {Array.from({ length: question.scale || 5 }, (_, i) => (
                      <div key={i} className="w-6 h-6 border border-gray-300 rounded"></div>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">{question.scale || 5}</span>
                </div>
              )}
              
              {question.type === 'yes_no' && (
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" disabled />
                    <span className="text-sm">Yes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" disabled />
                    <span className="text-sm">No</span>
                  </label>
                </div>
              )}
              
              {question.type === 'multiple_choice' && (
                <div className="space-y-2">
                  {(question.options || []).map((option, optionIndex) => (
                    <label key={optionIndex} className="flex items-center gap-2">
                      <input type="radio" disabled />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  if (loading) {
    return <LoadingScreen message="Loading Feedback Form Builder..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/feedback/forms')}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create Feedback Form</h1>
                <p className="text-gray-600 mt-2">
                  Build a custom feedback form for your event
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setPreviewMode(!previewMode)}
                variant="outline"
                size="sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
            </div>
          </div>
        </div>

        {!previewMode ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Form Settings</CardTitle>
                <CardDescription>
                  Configure your feedback form
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="event">Select Event:</Label>
                  <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an event..." />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title} - {new Date(event.date).toLocaleDateString('en-GB')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="formName">Form Name:</Label>
                  <Input
                    id="formName"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Workshop Feedback Form"
                  />
                </div>
                
                <div>
                  <Label htmlFor="template">Template:</Label>
                  <Select value={formTemplate} onValueChange={(value) => {
                    setFormTemplate(value as any)
                    if (value !== 'custom') {
                      loadTemplate(value as any)
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Form</SelectItem>
                      <SelectItem value="workshop">Workshop Template</SelectItem>
                      <SelectItem value="seminar">Seminar Template</SelectItem>
                      <SelectItem value="clinical_skills">Clinical Skills Template</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Question Builder */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Questions</CardTitle>
                      <CardDescription>
                        Add and configure your feedback questions
                      </CardDescription>
                    </div>
                    <Button onClick={addQuestion} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {questions.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Yet</h3>
                      <p className="text-gray-500 mb-4">
                        Add your first question to get started
                      </p>
                      <Button onClick={addQuestion}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Question
                      </Button>
                    </div>
                  ) : (
                    <div>
                      {questions.map(renderQuestionBuilder)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Preview Mode */
          <Card>
            <CardContent className="p-6">
              {renderPreview()}
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        {!previewMode && (
          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving || !selectedEventId || !formName.trim() || questions.length === 0}
              size="lg"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating Form...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Feedback Form
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}


