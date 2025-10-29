'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
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
  ArrowLeft,
  Save,
  X,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { useRole } from '@/lib/useRole'

interface Question {
  id: string
  type: string
  question: string
  required: boolean
  options?: string[]
  scale?: number
}

interface FeedbackTemplate {
  id: string
  name: string
  description: string
  category: string
  questions: Question[]
  is_system_template: boolean
  is_active: boolean
  is_shared: boolean
  shared_at?: string
  usage_count: number
  question_count: number
  created_at: string
  updated_at: string
  users: {
    id: string
    name: string
    role: string
  }
}

export default function EditTemplatePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const { canManageEvents, loading: roleLoading } = useRole()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState<FeedbackTemplate | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [templateCategory, setTemplateCategory] = useState('custom')
  const [questions, setQuestions] = useState<Question[]>([])
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [showQuestionForm, setShowQuestionForm] = useState(false)

  const templateId = params.templateId as string

  // Check permissions - but don't return early to avoid hooks order issues
  const isLoading = status === 'loading' || roleLoading
  const isUnauthorized = !session
  // Check if user has permission to manage events (admin, meded_team, ctf, or educator for their own templates)
  const userRole = session?.user?.role
  const hasEventManagementPermission = userRole === 'admin' || userRole === 'meded_team' || userRole === 'ctf' || userRole === 'educator'
  const isAccessDenied = session && !hasEventManagementPermission

  useEffect(() => {
    if (isUnauthorized) {
      router.push('/auth/signin')
      return
    }

    if (isAccessDenied) {
      toast.error('Access denied. MedEd Team, CTF, or Admin role required.')
      router.push('/dashboard')
      return
    }

    if (templateId) {
      fetchTemplate()
    }
  }, [templateId, isUnauthorized, isAccessDenied, router])

  const fetchTemplate = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/feedback/templates/${templateId}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch template')
      }

      const data = await response.json()
      setTemplate(data.template)
      setTemplateName(data.template.name)
      setTemplateDescription(data.template.description)
      setTemplateCategory(data.template.category)
      setQuestions(data.template.questions || [])
    } catch (error) {
      console.error('Error fetching template:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch template')
      router.push('/feedback/templates')
    } finally {
      setLoading(false)
    }
  }

  const questionTypes = [
    { value: 'rating', label: 'Rating Scale' },
    { value: 'text', label: 'Short Text' },
    { value: 'long_text', label: 'Long Text' },
    { value: 'yes_no', label: 'Yes/No' },
    { value: 'multiple_choice', label: 'Multiple Choice' }
  ]

  const categories = [
    { value: 'workshop', label: 'Workshop' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'clinical_skills', label: 'Clinical Skills' },
    { value: 'custom', label: 'Custom' }
  ]

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q${Date.now()}`,
      type: 'text',
      question: '',
      required: false,
      options: []
    }
    setEditingQuestion(newQuestion)
    setShowQuestionForm(true)
  }

  const editQuestion = (question: Question) => {
    setEditingQuestion({ ...question })
    setShowQuestionForm(true)
  }

  const saveQuestion = () => {
    if (!editingQuestion || !editingQuestion.question.trim()) {
      toast.error('Please enter a question')
      return
    }

    if (editingQuestion.type === 'multiple_choice' && (!editingQuestion.options || editingQuestion.options.length < 2)) {
      toast.error('Multiple choice questions must have at least 2 options')
      return
    }

    const updatedQuestions = [...questions]
    const existingIndex = updatedQuestions.findIndex(q => q.id === editingQuestion.id)
    
    if (existingIndex >= 0) {
      updatedQuestions[existingIndex] = editingQuestion
    } else {
      updatedQuestions.push(editingQuestion)
    }

    setQuestions(updatedQuestions)
    setEditingQuestion(null)
    setShowQuestionForm(false)
  }

  const deleteQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId))
  }

  const addOption = () => {
    if (editingQuestion) {
      setEditingQuestion({
        ...editingQuestion,
        options: [...(editingQuestion.options || []), '']
      })
    }
  }

  const updateOption = (index: number, value: string) => {
    if (editingQuestion && editingQuestion.options) {
      const newOptions = [...editingQuestion.options]
      newOptions[index] = value
      setEditingQuestion({
        ...editingQuestion,
        options: newOptions
      })
    }
  }

  const removeOption = (index: number) => {
    if (editingQuestion && editingQuestion.options) {
      const newOptions = editingQuestion.options.filter((_, i) => i !== index)
      setEditingQuestion({
        ...editingQuestion,
        options: newOptions
      })
    }
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name')
      return
    }

    if (questions.length === 0) {
      toast.error('Please add at least one question')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/feedback/templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription,
          category: templateCategory,
          questions: questions
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update template')
      }

      toast.success('Template updated successfully')
      router.push(`/feedback/templates/${templateId}`)
    } catch (error) {
      console.error('Error updating template:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update template')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (isUnauthorized || isAccessDenied) {
    return <LoadingScreen />
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (!template) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Template Not Found</h1>
          <p className="text-gray-600 mb-4">The requested template could not be found.</p>
          <Button onClick={() => router.push('/feedback/templates')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push(`/feedback/templates/${templateId}`)}
          className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 transition-all duration-200 hover:scale-105 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-medium">Back to Template</span>
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Template</h1>
        <p className="text-gray-600">Modify your feedback template</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Template Settings */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Template Settings</CardTitle>
              <CardDescription>Configure your template details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Describe this template"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={templateCategory} onValueChange={setTemplateCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={handleSaveTemplate}
                  disabled={saving || !templateName.trim() || questions.length === 0}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Questions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Questions ({questions.length})</CardTitle>
                  <CardDescription>Add questions to your feedback template</CardDescription>
                </div>
                <Button onClick={addQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No questions added yet</p>
                  <p className="text-sm">Click "Add Question" to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{index + 1}</Badge>
                            <Badge className="bg-blue-100 text-blue-800">
                              {questionTypes.find(t => t.value === question.type)?.label}
                            </Badge>
                            {question.required && (
                              <Badge className="bg-red-100 text-red-800">Required</Badge>
                            )}
                          </div>
                          <p className="font-medium">{question.question}</p>
                          {question.type === 'multiple_choice' && question.options && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">Options:</p>
                              <ul className="text-sm text-gray-600 ml-4">
                                {question.options.map((option, i) => (
                                  <li key={i}>• {option}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editQuestion(question)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteQuestion(question.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Question Form Modal */}
      {showQuestionForm && editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {questions.find(q => q.id === editingQuestion.id) ? 'Edit Question' : 'Add Question'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="questionType">Question Type</Label>
                <Select 
                  value={editingQuestion.type} 
                  onValueChange={(value) => setEditingQuestion({...editingQuestion, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {questionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="questionText">Question Text *</Label>
                <Input
                  id="questionText"
                  value={editingQuestion.question}
                  onChange={(e) => setEditingQuestion({...editingQuestion, question: e.target.value})}
                  placeholder="Enter your question"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={editingQuestion.required}
                  onChange={(e) => setEditingQuestion({...editingQuestion, required: e.target.checked})}
                />
                <Label htmlFor="required">Required question</Label>
              </div>

              {editingQuestion.type === 'multiple_choice' && (
                <div>
                  <Label>Options</Label>
                  <div className="space-y-2">
                    {(editingQuestion.options || []).map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                </div>
              )}

              {editingQuestion.type === 'rating' && (
                <div>
                  <Label htmlFor="scale">Rating Scale</Label>
                  <Select 
                    value={editingQuestion.scale?.toString() || '5'} 
                    onValueChange={(value) => setEditingQuestion({...editingQuestion, scale: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">1-3</SelectItem>
                      <SelectItem value="5">1-5</SelectItem>
                      <SelectItem value="7">1-7</SelectItem>
                      <SelectItem value="10">1-10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingQuestion(null)
                  setShowQuestionForm(false)
                }}
              >
                Cancel
              </Button>
              <Button onClick={saveQuestion}>
                {questions.find(q => q.id === editingQuestion.id) ? 'Update' : 'Add'} Question
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
