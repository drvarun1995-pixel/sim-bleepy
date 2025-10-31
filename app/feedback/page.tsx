'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Calendar, 
  Check, 
  Edit, 
  Trash2, 
  Eye, 
  BarChart3, 
  Users, 
  UserCheck,
  MessageSquare,
  Settings,
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Filter,
  Search,
  X
} from 'lucide-react'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog'

interface FeedbackForm {
  id: string
  form_name: string
  form_template: string
  questions: any[]
  active: boolean
  anonymous_enabled: boolean
  created_at: string
  event_id: string
  events?: {
    id: string
    title: string
    date: string
    start_time?: string
    location_name?: string
  }
}

interface Event {
  id: string
  title: string
  date: string
  start_time?: string
  location_name?: string
  status: string
}

export default function FeedbackPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [feedbackForms, setFeedbackForms] = useState<FeedbackForm[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingForm, setEditingForm] = useState<FeedbackForm | null>(null)
  const searchParams = useSearchParams()

  // Open editor if editForm is provided in URL
  useEffect(() => {
    const editFormId = searchParams?.get('editForm')
    if (!editFormId) return
    const loadForm = async () => {
      try {
        const res = await fetch(`/api/feedback/forms/${editFormId}`)
        if (!res.ok) return
        const data = await res.json()
        const form = data.feedbackForm
        if (!form) return
        setEditingForm(form)
        setFormData({
          form_name: form.form_name,
          form_template: form.form_template,
          anonymous_enabled: form.anonymous_enabled || false,
          questions: form.questions || []
        })
        if (form.events) {
          setSelectedDate(form.events.date)
          setSelectedEventIds(new Set([form.events.id]))
          setEvents([{ ...form.events, status: 'published' }])
        }
        setShowCreateForm(true)
      } catch {}
    }
    loadForm()
  }, [searchParams])
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set())
  const [selectedDate, setSelectedDate] = useState('')
  const [eventsLoading, setEventsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [formToDelete, setFormToDelete] = useState<FeedbackForm | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Form creation state
  const [formData, setFormData] = useState({
    form_name: '',
    form_template: 'custom',
    anonymous_enabled: false,
    questions: [] as any[]
  })

  // Question management state
  const [showQuestionEditor, setShowQuestionEditor] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [questionData, setQuestionData] = useState({
    question: '',
    type: 'text',
    required: false,
    options: [] as string[]
  })

  useEffect(() => {
    if (session) {
      loadFeedbackForms()
      loadEvents()
    }
  }, [session])



  const loadFeedbackForms = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/feedback/forms')
      if (response.ok) {
        const data = await response.json()
        setFeedbackForms(data.forms || [])
      }
    } catch (error) {
      console.error('Error loading feedback forms:', error)
      toast.error('Failed to load feedback forms')
    } finally {
      setLoading(false)
    }
  }

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/events')
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error loading events:', error)
    }
  }

  const handleDateChange = async (date: string) => {
    console.log('Date selected:', date)
    setSelectedDate(date)
    setSelectedEventIds(new Set())
    
    if (!date) {
      setEvents([])
      return
    }

    try {
      setEventsLoading(true)
      console.log('Fetching events for date:', date)
      const response = await fetch(`/api/events/date/${date}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('API Response:', data)
        console.log('Events loaded for date:', date, 'Count:', data.events?.length || 0)
        
        // Events are already filtered by the API to only include those with booking enabled
        const events = data.events || []
        setEvents(events)
        
        if (events.length === 0) {
          console.log('No events found for date:', date)
          toast.info('No events with booking enabled found for this date')
        }
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch events:', response.status, response.statusText, errorData)
        toast.error('Failed to load events for this date')
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error('Failed to load events for this date')
    } finally {
      setEventsLoading(false)
    }
  }

  const toggleEventSelection = (eventId: string) => {
    const newSelection = new Set(selectedEventIds)
    if (newSelection.has(eventId)) {
      newSelection.delete(eventId)
    } else {
      newSelection.add(eventId)
    }
    setSelectedEventIds(newSelection)
  }

  const handleEditForm = (form: FeedbackForm) => {
    setEditingForm(form)
    setFormData({
      form_name: form.form_name,
      form_template: form.form_template,
      anonymous_enabled: form.anonymous_enabled || false,
      questions: form.questions || []
    })
    
    // Load the event associated with this form
    if (form.events) {
      setSelectedDate(form.events.date)
      setSelectedEventIds(new Set([form.events.id]))
      setEvents([{ ...form.events, status: 'published' }])
    }
    
    setShowCreateForm(true)
  }

  // Question management functions
  const generateDefaultQuestions = (template: string) => {
    const defaultQuestions: { [key: string]: any[] } = {
      workshop: [
        { question: 'How would you rate the overall quality of this workshop?', type: 'rating', required: true },
        { question: 'What did you find most valuable about this workshop?', type: 'text', required: false },
        { question: 'What could be improved in future workshops?', type: 'text', required: false },
        { question: 'Would you recommend this workshop to others?', type: 'yesno', required: true }
      ],
      seminar: [
        { question: 'How would you rate the speaker\'s presentation?', type: 'rating', required: true },
        { question: 'Was the content relevant to your needs?', type: 'rating', required: true },
        { question: 'What topics would you like to see covered in future seminars?', type: 'text', required: false },
        { question: 'How likely are you to attend future seminars?', type: 'rating', required: true }
      ],
      clinical_skills: [
        { question: 'How confident do you feel in applying these clinical skills?', type: 'rating', required: true },
        { question: 'What aspects of the training were most helpful?', type: 'text', required: false },
        { question: 'What additional support would be beneficial?', type: 'text', required: false },
        { question: 'Rate the practical hands-on experience', type: 'rating', required: true }
      ],
      custom: []
    }
    return defaultQuestions[template] || []
  }

  const handleTemplateChange = (template: string) => {
    const questions = generateDefaultQuestions(template)
    setFormData({ ...formData, form_template: template, questions })
  }

  const addQuestion = () => {
    setEditingQuestion(null)
    setQuestionData({ question: '', type: 'text', required: false, options: [] })
    setShowQuestionEditor(true)
  }

  const editQuestion = (question: any, index: number) => {
    setEditingQuestion({ ...question, index })
    setQuestionData({
      question: question.question,
      type: question.type,
      required: question.required,
      options: question.options || []
    })
    setShowQuestionEditor(true)
  }

  const saveQuestion = () => {
    if (!questionData.question.trim()) {
      toast.error('Please enter a question')
      return
    }

    const newQuestion = {
      question: questionData.question,
      type: questionData.type,
      required: questionData.required,
      ...(questionData.type === 'multiple_choice' && { options: questionData.options })
    }

    const updatedQuestions = [...formData.questions]
    
    if (editingQuestion && editingQuestion.index !== undefined) {
      updatedQuestions[editingQuestion.index] = newQuestion
    } else {
      updatedQuestions.push(newQuestion)
    }

    setFormData({ ...formData, questions: updatedQuestions })
    setShowQuestionEditor(false)
    setEditingQuestion(null)
    setQuestionData({ question: '', type: 'text', required: false, options: [] })
  }

  const deleteQuestion = (index: number) => {
    const updatedQuestions = formData.questions.filter((_, i) => i !== index)
    setFormData({ ...formData, questions: updatedQuestions })
  }

  const addOption = () => {
    setQuestionData({ ...questionData, options: [...questionData.options, ''] })
  }

  const updateOption = (index: number, value: string) => {
    const updatedOptions = [...questionData.options]
    updatedOptions[index] = value
    setQuestionData({ ...questionData, options: updatedOptions })
  }

  const removeOption = (index: number) => {
    const updatedOptions = questionData.options.filter((_, i) => i !== index)
    setQuestionData({ ...questionData, options: updatedOptions })
  }

  const handleCreateForm = async () => {
    if (!formData.form_name.trim()) {
      toast.error('Please enter a form name')
      return
    }

    if (selectedEventIds.size === 0) {
      toast.error('Please select at least one event')
      return
    }

    // Validate that at least one question is provided for custom forms
    if (formData.form_template === 'custom' && formData.questions.length === 0) {
      toast.error('Please add at least one question to the feedback form')
      return
    }

    try {
      const url = editingForm ? `/api/feedback/forms/${editingForm.id}` : '/api/feedback/forms'
      const method = editingForm ? 'PUT' : 'POST'
      
      const requestData = {
        ...formData,
        event_ids: Array.from(selectedEventIds)
      }
      
      console.log('📤 Sending feedback form request:', {
        url,
        method,
        data: requestData,
        selectedEventIds: Array.from(selectedEventIds),
        availableEvents: events.map(e => ({ id: e.id, title: e.title }))
      })
      
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        toast.success(editingForm ? 'Feedback form updated successfully!' : 'Feedback form created successfully!')
        setShowCreateForm(false)
        setEditingForm(null)
        
        // Only reset formData if we're creating a new form, not editing
        if (!editingForm) {
          setFormData({
            form_name: '',
            form_template: 'custom',
            anonymous_enabled: false,
            questions: []
          })
          setSelectedEventIds(new Set())
          setSelectedDate('')
        }
        
        loadFeedbackForms()
      } else {
        const error = await response.json()
        toast.error(error.error || `Failed to ${editingForm ? 'update' : 'create'} feedback form`)
      }
    } catch (error) {
      console.error('Error creating feedback form:', error)
      toast.error('Failed to create feedback form')
    }
  }

  const handleDeleteForm = async () => {
    if (!formToDelete) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/feedback/forms/${formToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Feedback form deleted successfully!')
        setShowDeleteDialog(false)
        setFormToDelete(null)
        loadFeedbackForms()
      } else {
        toast.error('Failed to delete feedback form')
      }
    } catch (error) {
      console.error('Error deleting feedback form:', error)
      toast.error('Failed to delete feedback form')
    } finally {
      setDeleting(false)
    }
  }

  const confirmDeleteForm = (form: FeedbackForm) => {
    setFormToDelete(form)
    setShowDeleteDialog(true)
  }

  const filteredForms = feedbackForms.filter(form =>
    form.form_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (form.events?.title && form.events.title.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/bookings')}
            className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 transition-all duration-200 hover:scale-105 w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Back to Bookings</span>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Feedback Management</h1>
          <p className="text-gray-600 mb-8">Create and manage feedback forms for events</p>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search feedback forms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <select 
                value={selectedTemplate} 
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="hidden w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Templates</option>
                <option value="workshop">Workshop</option>
                <option value="seminar">Seminar</option>
                <option value="clinical_skills">Clinical Skills</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              <Button
                variant="outline"
                onClick={() => router.push('/feedback/analytics')}
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/feedback/templates')}
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Settings className="h-4 w-4" />
                Template Management
              </Button>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                Create Feedback Form
              </Button>
            </div>
          </div>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingForm ? 'Edit Feedback Form' : 'Create Feedback Form'}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCreateForm(false)
                      setEditingForm(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Form Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="form_name">Form Name</Label>
                      <Input
                        id="form_name"
                        value={formData.form_name}
                        onChange={(e) => setFormData({ ...formData, form_name: e.target.value })}
                        placeholder="Enter form name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="form_template">Template</Label>
                      <select
                        value={formData.form_template}
                        onChange={(e) => handleTemplateChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="workshop">Workshop</option>
                        <option value="seminar">Seminar</option>
                        <option value="clinical_skills">Clinical Skills</option>
                        <option value="custom">Custom</option>
                      </select>
                      {formData.form_template === 'custom' && (
                        <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                          <span className="font-medium">⚠️ Required:</span>
                          Add at least one question for custom forms
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Anonymous Option */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="anonymous_enabled"
                      checked={formData.anonymous_enabled}
                      onChange={(e) => {
                        setFormData({ ...formData, anonymous_enabled: e.target.checked })
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="anonymous_enabled" className="text-sm">
                      Allow anonymous feedback
                    </Label>
                    <span className="text-xs text-gray-500 ml-2">
                      ({formData.anonymous_enabled ? 'Enabled' : 'Disabled'})
                    </span>
                  </div>

                  {/* Questions Management */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-medium">Questions ({formData.questions.length})</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addQuestion}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Question
                      </Button>
                    </div>

                    {formData.questions.length > 0 ? (
                      <div className="space-y-3">
                        {formData.questions.map((question, index) => (
                          <div key={index} className="p-3 border rounded-lg bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-medium text-gray-600">Q{index + 1}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {question.type}
                                  </Badge>
                                  {question.required && (
                                    <Badge variant="secondary" className="text-xs">
                                      Required
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-900 mb-2">{question.question}</p>
                                {question.options && question.options.length > 0 && (
                                  <div className="text-xs text-gray-600">
                                    Options: {question.options.join(', ')}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editQuestion(question, index)}
                                  title="Edit Question"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteQuestion(index)}
                                  title="Delete Question"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No questions added yet</p>
                        <p className="text-xs">Click "Add Question" to get started</p>
                      </div>
                    )}
                  </div>

                  {/* Event Selection */}
                  <div>
                    <Label>Select Events</Label>
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <Input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => handleDateChange(e.target.value)}
                          className="w-48"
                        />
                      </div>

                      {eventsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : selectedDate && events.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                          {events.map((event) => (
                            <div
                              key={event.id}
                              onClick={() => toggleEventSelection(event.id)}
                              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedEventIds.has(event.id)
                                  ? 'border-blue-500 bg-blue-100'
                                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-gray-900">{event.title}</p>
                                  <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                                    <div className="flex items-center gap-1">
                                      <CalendarDays className="h-3 w-3" />
                                      {new Date(event.date).toLocaleDateString()}
                                    </div>
                                    {event.start_time && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {event.start_time}
                                      </div>
                                    )}
                                    {event.location_name && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {event.location_name}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {selectedEventIds.has(event.id) && (
                                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : selectedDate ? (
                        <p className="text-gray-500 text-sm py-4">No events found for this date</p>
                      ) : (
                        <p className="text-gray-500 text-sm py-4">Select a date to view events</p>
                      )}

                      {selectedEventIds.size > 0 && (
                        <p className="text-sm text-blue-600 mt-2">
                          {selectedEventIds.size} event{selectedEventIds.size > 1 ? 's' : ''} selected
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateForm}>
                      {editingForm ? 'Update Feedback Form' : 'Create Feedback Form'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Forms List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map((form) => (
            <Card key={form.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {form.form_name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {form.form_template}
                      </Badge>
                      {form.anonymous_enabled && (
                        <Badge variant="secondary" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          Anonymous
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/feedback/forms/${form.id}`)}
                      title="View Form"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditForm(form)}
                      title="Edit Form"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => confirmDeleteForm(form)}
                      title="Delete Form"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {form.events && (
                  <div className="mb-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                      <Calendar className="h-3 w-3" />
                      <span className="font-medium">Event:</span>
                    </div>
                    <p className="text-sm text-gray-900 font-medium">{form.events.title}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span>{new Date(form.events.date).toLocaleDateString()}</span>
                      {form.events.start_time && <span>{form.events.start_time}</span>}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{form.questions?.length || 0} questions</span>
                  <span className="text-xs">
                    Created {new Date(form.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredForms.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback forms found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'Try adjusting your search criteria' : 'Create your first feedback form to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Feedback Form
              </Button>
            )}
          </div>
        )}

        {/* Question Editor Modal */}
        {showQuestionEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingQuestion ? 'Edit Question' : 'Add Question'}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowQuestionEditor(false)
                      setEditingQuestion(null)
                      setQuestionData({ question: '', type: 'text', required: false, options: [] })
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Question Text */}
                  <div>
                    <Label htmlFor="question_text">Question</Label>
                    <Textarea
                      id="question_text"
                      value={questionData.question}
                      onChange={(e) => setQuestionData({ ...questionData, question: e.target.value })}
                      placeholder="Enter your question here..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  {/* Question Type */}
                  <div>
                    <Label htmlFor="question_type">Question Type</Label>
                    <select
                      id="question_type"
                      value={questionData.type}
                      onChange={(e) => setQuestionData({ ...questionData, type: e.target.value, options: [] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                    >
                      <option value="text">Text Input</option>
                      <option value="textarea">Long Text</option>
                      <option value="rating">Rating (1-5)</option>
                      <option value="yesno">Yes/No</option>
                      <option value="multiple_choice">Multiple Choice</option>
                    </select>
                  </div>

                  {/* Multiple Choice Options */}
                  {questionData.type === 'multiple_choice' && (
                    <div>
                      <Label>Options</Label>
                      <div className="space-y-2 mt-2">
                        {questionData.options.map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={option}
                              onChange={(e) => updateOption(index, e.target.value)}
                              placeholder={`Option ${index + 1}`}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(index)}
                              title="Remove Option"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addOption}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Required Checkbox */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="question_required"
                      checked={questionData.required}
                      onCheckedChange={(checked) => 
                        setQuestionData({ ...questionData, required: checked as boolean })
                      }
                    />
                    <Label htmlFor="question_required" className="text-sm">
                      This question is required
                    </Label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowQuestionEditor(false)
                        setEditingQuestion(null)
                        setQuestionData({ question: '', type: 'text', required: false, options: [] })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={saveQuestion}>
                      {editingQuestion ? 'Update Question' : 'Add Question'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setFormToDelete(null)
        }}
        onConfirm={handleDeleteForm}
        title="Delete Feedback Form"
        description="Are you sure you want to delete this feedback form? This action cannot be undone and will remove all associated responses."
        itemName={formToDelete?.form_name}
        isLoading={deleting}
        confirmText="Delete Form"
        cancelText="Cancel"
      />
    </div>
  )
}
