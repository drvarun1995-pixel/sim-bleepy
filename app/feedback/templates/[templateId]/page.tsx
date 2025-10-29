'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  Users,
  Calendar,
  Settings,
  Share2,
  Lock
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

export default function ViewTemplatePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const { canManageEvents, loading: roleLoading } = useRole()
  
  const [loading, setLoading] = useState(true)
  const [template, setTemplate] = useState<FeedbackTemplate | null>(null)
  const [deleting, setDeleting] = useState(false)

  const templateId = params.templateId as string

  // Check permissions - but don't return early to avoid hooks order issues
  const isLoading = status === 'loading' || roleLoading
  const isUnauthorized = !session
  const isAccessDenied = session && !canManageEvents

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
    } catch (error) {
      console.error('Error fetching template:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch template')
      router.push('/feedback/templates')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!template) return

    if (!confirm(`Are you sure you want to delete "${template.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeleting(true)
      const response = await fetch(`/api/feedback/templates/${templateId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete template')
      }

      toast.success('Template deleted successfully')
      router.push('/feedback/templates')
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete template')
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleSharing = async () => {
    if (!template) return

    try {
      const response = await fetch(`/api/feedback/templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_shared: !template.is_shared
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update sharing status')
      }

      const data = await response.json()
      setTemplate(data.template)
      toast.success(template.is_shared ? 'Template unshared successfully' : 'Template shared successfully')
    } catch (error) {
      console.error('Error toggling sharing:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update sharing status')
    }
  }

  const getQuestionTypeLabel = (type: string) => {
    const types = {
      'rating': 'Rating Scale',
      'text': 'Short Text',
      'long_text': 'Long Text',
      'yes_no': 'Yes/No',
      'multiple_choice': 'Multiple Choice'
    }
    return types[type as keyof typeof types] || type
  }

  const canEdit = template && session && (
    session.user.role === 'admin' || 
    (['meded_team', 'ctf', 'educator'].includes(session.user.role || '') && 
     template.users.id === session.user.id)
  )

  const canDelete = template && session && session.user.role === 'admin' && !template.is_system_template

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
          onClick={() => router.push('/feedback/templates')}
          className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 transition-all duration-200 hover:scale-105 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-medium">Back to Templates</span>
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{template.name}</h1>
            <p className="text-gray-600 mb-4">{template.description}</p>
            
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-blue-100 text-blue-800">
                {template.category}
              </Badge>
              {template.is_system_template && (
                <Badge className="bg-purple-100 text-purple-800">
                  System Template
                </Badge>
              )}
              {template.is_shared && (
                <Badge className="bg-green-100 text-green-800">
                  <Share2 className="h-3 w-3 mr-1" />
                  Shared
                </Badge>
              )}
              {!template.is_active && (
                <Badge variant="outline" className="text-gray-500">
                  Inactive
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <Button
                variant="outline"
                onClick={() => router.push(`/feedback/templates/${templateId}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            
            {!template.is_system_template && canEdit && (
              <Button
                variant="outline"
                onClick={handleToggleSharing}
                className={template.is_shared ? "text-green-600 hover:text-green-700" : "text-gray-600 hover:text-gray-700"}
                title={template.is_shared ? "Unshare template" : "Share template"}
              >
                {template.is_shared ? <Share2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </Button>
            )}
            
            {canDelete && (
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Template Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Created by:</span>
                <span className="font-medium">{template.users.name}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Created:</span>
                <span className="font-medium">
                  {new Date(template.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Questions:</span>
                <span className="font-medium">{template.question_count}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Usage:</span>
                <span className="font-medium">{template.usage_count} times</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Questions Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Questions Preview</CardTitle>
              <CardDescription>
                {template.question_count} question{template.question_count !== 1 ? 's' : ''} in this template
              </CardDescription>
            </CardHeader>
            <CardContent>
              {template.questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No questions in this template</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {template.questions.map((question, index) => (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <Badge className="bg-blue-100 text-blue-800">
                            {getQuestionTypeLabel(question.type)}
                          </Badge>
                          {question.required && (
                            <Badge className="bg-red-100 text-red-800">Required</Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="font-medium mb-2">{question.question}</p>
                      
                      {question.type === 'rating' && question.scale && (
                        <p className="text-sm text-gray-600">
                          Scale: 1 to {question.scale}
                        </p>
                      )}
                      
                      {question.type === 'multiple_choice' && question.options && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 mb-1">Options:</p>
                          <ul className="text-sm text-gray-600 ml-4">
                            {question.options.map((option, i) => (
                              <li key={i}>• {option}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
