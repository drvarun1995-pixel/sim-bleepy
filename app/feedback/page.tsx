'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  BarChart3, 
  Users, 
  MessageSquare,
  Settings,
  CalendarDays,
  Clock,
  MapPin,
  Search,
  X,
  Sparkles,
  QrCode,
  Maximize
} from 'lucide-react'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog'
import { useOnboardingTour } from '@/components/onboarding/OnboardingContext'
import { createCompleteFeedbackTour } from '@/lib/onboarding/steps/feedback/CompleteFeedbackTour'
import { MultipleChoiceQuestionFields } from '@/components/feedback/MultipleChoiceQuestionFields'

interface FeedbackForm {
  id: string
  form_name: string
  form_template: string
  questions: any[]
  active: boolean
  anonymous_enabled: boolean
  created_at: string
  event_id: string
  qr_code_image_url?: string | null
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

interface SavedFeedbackTemplate {
  id: string
  name: string
  questions: any[]
  is_system_template?: boolean
  is_shared?: boolean
  anonymous_enabled?: boolean
}

function templateLabel(value?: string) {
  if (!value) return 'Custom'
  const labels: Record<string, string> = {
    workshop: 'Workshop',
    seminar: 'Seminar',
    clinical_skills: 'Clinical skills',
    custom: 'Custom',
  }
  return labels[value] || value.replace(/_/g, ' ')
}

function FormQuestionPreview({ questions }: { questions: any[] }) {
  const list = Array.isArray(questions) ? questions : []
  const shown = list.slice(0, 3)
  const extra = list.length - shown.length

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      {shown.length === 0 ? (
        <p className="text-xs text-slate-400">No questions yet</p>
      ) : (
        <ol className="space-y-1.5 text-xs text-slate-600">
          {shown.map((question, index) => (
            <li key={question.id || index} className="flex gap-2">
              <span className="shrink-0 font-medium text-slate-400">{index + 1}.</span>
              <span className="line-clamp-1">{question.question || 'Untitled question'}</span>
            </li>
          ))}
          {extra > 0 && <li className="text-slate-400">+{extra} more</li>}
        </ol>
      )}
    </div>
  )
}

export default function FeedbackPage() {
  const { data: session } = useSession()

  const router = useRouter()
  const { startTourWithSteps } = useOnboardingTour()
  
  const [feedbackForms, setFeedbackForms] = useState<FeedbackForm[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
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
        setTemplateChoice(form.form_template || 'custom')
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
  const [savedTemplates, setSavedTemplates] = useState<SavedFeedbackTemplate[]>([])
  const [templateChoice, setTemplateChoice] = useState('custom')

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
    options: [] as string[],
    allowMultiple: false,
    allowOther: false,
    otherPlaceholder: ''
  })

  useEffect(() => {
    if (session) {
      loadFeedbackForms()
      loadEvents()
      loadSavedTemplates()
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

  const loadSavedTemplates = async () => {
    try {
      const response = await fetch('/api/feedback/templates?limit=100')
      if (response.ok) {
        const data = await response.json()
        setSavedTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error loading feedback templates:', error)
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
    setTemplateChoice(form.form_template || 'custom')
    
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
        { question: 'Would you recommend this workshop to others?', type: 'yes_no', required: true }
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
    setTemplateChoice(template)
    if (template.startsWith('saved:')) {
      const saved = savedTemplates.find((item) => item.id === template.slice(6))
      setFormData({
        ...formData,
        form_template: 'custom',
        form_name: formData.form_name.trim() ? formData.form_name : (saved?.name || formData.form_name),
        questions: (Array.isArray(saved?.questions) ? saved.questions : []).map((question: any, index: number) => ({
          ...question,
          id: question.id || `q${index + 1}`,
          type: question.type === 'yesno' ? 'yes_no' : question.type
        })),
        anonymous_enabled: Boolean((saved as any)?.anonymous_enabled)
      })
      return
    }
    setFormData({ ...formData, form_template: template, questions: generateDefaultQuestions(template) })
  }

  const addQuestion = () => {
    setEditingQuestion(null)
    setQuestionData({ question: '', type: 'text', required: false, options: [], allowMultiple: false, allowOther: false, otherPlaceholder: '' })
    setShowQuestionEditor(true)
  }

  const editQuestion = (question: any, index: number) => {
    setEditingQuestion({ ...question, index })
    setQuestionData({
      question: question.question,
      type: question.type,
      required: question.required,
      options: question.options || [],
      allowMultiple: Boolean(question.allowMultiple),
      allowOther: Boolean(question.allowOther),
      otherPlaceholder: question.otherPlaceholder || ''
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
      ...(questionData.type === 'multiple_choice' && {
        options: questionData.options,
        allowMultiple: questionData.allowMultiple,
        allowOther: questionData.allowOther,
        otherPlaceholder: questionData.otherPlaceholder,
      })
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
    setQuestionData({ question: '', type: 'text', required: false, options: [], allowMultiple: false, allowOther: false, otherPlaceholder: '' })
  }

  const deleteQuestion = (index: number) => {
    const updatedQuestions = formData.questions.filter((_, i) => i !== index)
    setFormData({ ...formData, questions: updatedQuestions })
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
          setTemplateChoice('custom')
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

  const filteredForms = feedbackForms.filter((form) => {
    const query = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !query ||
      form.form_name.toLowerCase().includes(query) ||
      (form.events?.title || '').toLowerCase().includes(query)
    if (!matchesSearch) return false
    if (statusFilter === 'active') return form.active !== false
    if (statusFilter === 'inactive') return form.active === false
    return true
  })

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Feedback</h1>
            <p className="mt-1 text-slate-600">Create forms for events, reuse templates, and review responses</p>
          </div>
          <Button
            onClick={() => {
              const userRole = session?.user?.role || 'meded_team'
              const feedbackSteps = createCompleteFeedbackTour({
                role: userRole as any
              })
              if (startTourWithSteps) {
                startTourWithSteps(feedbackSteps)
              }
            }}
            variant="secondary"
            className="hidden lg:flex items-center justify-center gap-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-900"
          >
            <Sparkles className="h-4 w-4" />
            Start Feedback Tour
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" data-tour="feedback-buttons">
          <button type="button" onClick={() => setShowCreateForm(true)} className="text-left">
            <Card className="h-full border-slate-200 p-0 transition hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
                  <Plus className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900">Create form</h3>
                  <p className="text-sm text-slate-600">Attach a form to an event</p>
                </div>
              </CardContent>
            </Card>
          </button>
          <button type="button" onClick={() => router.push('/feedback/templates')} className="text-left">
            <Card className="h-full border-slate-200 p-0 transition hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500 text-white">
                  <Settings className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900">Templates</h3>
                  <p className="text-sm text-slate-600">Yours and shared question sets</p>
                </div>
              </CardContent>
            </Card>
          </button>
          <button type="button" onClick={() => router.push('/feedback/analytics')} className="text-left">
            <Card className="h-full border-slate-200 p-0 transition hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900">Analytics</h3>
                  <p className="text-sm text-slate-600">Ratings and response rates</p>
                </div>
              </CardContent>
            </Card>
          </button>
          <button type="button" onClick={() => router.push('/feedback/responses')} className="text-left">
            <Card className="h-full border-slate-200 p-0 transition hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900">Responses</h3>
                  <p className="text-sm text-slate-600">Browse and export answers</p>
                </div>
              </CardContent>
            </Card>
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by form or event name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 bg-white pl-10"
              aria-label="Search feedback forms"
            />
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-full bg-slate-100 p-1 sm:w-auto">
            {([
              ['all', 'All'],
              ['active', 'Active'],
              ['inactive', 'Inactive'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  statusFilter === value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
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
                        value={templateChoice}
                        onChange={(e) => handleTemplateChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <optgroup label="Starters">
                          <option value="workshop">Workshop</option>
                          <option value="seminar">Seminar</option>
                          <option value="clinical_skills">Clinical Skills</option>
                          <option value="custom">Blank custom</option>
                        </optgroup>
                        {savedTemplates.length > 0 && (
                          <optgroup label="Saved templates">
                            {savedTemplates.map((template) => (
                              <option key={template.id} value={`saved:${template.id}`}>
                                {template.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      {savedTemplates.length === 0 && (
                        <p className="mt-1 text-xs text-slate-500">
                          Saved templates from Template Management will appear here.
                        </p>
                      )}
                      {formData.form_template === 'custom' && formData.questions.length === 0 && (
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
                      Anonymous (no login, do not store who answered)
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
        <div data-tour="feedback-forms-list">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">Your forms</h2>
            <p className="text-sm text-slate-600">
              {filteredForms.length} form{filteredForms.length === 1 ? '' : 's'}
              {searchQuery || statusFilter !== 'all' ? ' in this view' : ''}
            </p>
          </div>
          {filteredForms.length === 0 ? (
            <Card className="border-slate-200 p-0">
              <CardContent className="py-16 text-center">
                <MessageSquare className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                <h3 className="text-lg font-semibold text-slate-900">No feedback forms in this view</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try a different search or switch All / Active / Inactive.'
                    : 'Create a form and attach it to an event to start collecting responses.'}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreateForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create form
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredForms.map((form) => (
                <Card key={form.id} className="flex h-full flex-col border-slate-200 p-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                  <CardContent className="flex flex-1 flex-col p-4">
                    <div className="mb-3">
                      <h3 className="line-clamp-1 text-lg font-semibold text-slate-900">{form.form_name}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                          {templateLabel(form.form_template)}
                        </span>
                        {form.anonymous_enabled && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                            <Users className="h-3 w-3" />
                            Anonymous
                          </span>
                        )}
                        {form.active === false && (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>

                    {form.events && (
                      <div className="mb-3 rounded-lg border border-slate-100 bg-white p-3 text-sm">
                        <p className="line-clamp-1 font-medium text-slate-900">{form.events.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(form.events.date).toLocaleDateString('en-GB')}
                          </span>
                          {form.events.start_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {form.events.start_time}
                            </span>
                          )}
                          {form.events.location_name && (
                            <span className="flex min-w-0 items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{form.events.location_name}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <FormQuestionPreview questions={form.questions || []} />

                    {form.qr_code_image_url ? (
                      <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2">
                        <img
                          src={form.qr_code_image_url}
                          alt={`Feedback QR for ${form.form_name}`}
                          className="h-16 w-16 shrink-0 rounded border bg-white object-contain"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1 text-xs font-medium text-slate-700">
                            <QrCode className="h-3.5 w-3.5" />
                            Feedback QR
                          </p>
                          <button
                            type="button"
                            className="mt-1 inline-flex items-center gap-1 text-xs text-blue-700 hover:underline"
                            onClick={() => router.push(`/feedback/forms/${form.id}/display`)}
                          >
                            <Maximize className="h-3 w-3" />
                            Show on screen
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-slate-400">
                        Feedback QR not generated yet. Run the form QR SQL, then refresh.
                      </p>
                    )}

                    <p className="mt-3 text-xs text-slate-500">
                      {form.questions?.length || 0} questions · Created {new Date(form.created_at).toLocaleDateString('en-GB')}
                    </p>

                    <div className="mt-auto flex gap-2 pt-4">
                      <Button
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={() => router.push(`/feedback/forms/${form.id}/responses`)}
                      >
                        <BarChart3 className="mr-1 h-3.5 w-3.5" />
                        Responses
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEditForm(form)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => confirmDeleteForm(form)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

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
                      setQuestionData({ question: '', type: 'text', required: false, options: [], allowMultiple: false, allowOther: false, otherPlaceholder: '' })
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
                    <MultipleChoiceQuestionFields
                      value={questionData}
                      onChange={(next) => setQuestionData({ ...questionData, ...next, options: next.options || [] })}
                    />
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
                        setQuestionData({ question: '', type: 'text', required: false, options: [], allowMultiple: false, allowOther: false, otherPlaceholder: '' })
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
