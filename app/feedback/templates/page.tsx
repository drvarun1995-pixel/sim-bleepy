'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Copy,
  Users,
  ArrowLeft,
  MessageSquare,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { useRole } from '@/lib/useRole'
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog'

interface FeedbackTemplate {
  id: string
  name: string
  description: string
  category: string
  questions: any[]
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
  } | {
    id: string
    name: string
    role: string
  }[] | null
}

function creatorOf(template: FeedbackTemplate) {
  const users = template.users
  if (!users) return { id: '', name: 'Unknown', role: '' }
  if (Array.isArray(users)) return users[0] || { id: '', name: 'Unknown', role: '' }
  return users
}

function QuestionPreview({ questions }: { questions: any[] }) {
  const list = Array.isArray(questions) ? questions : []
  const shown = list.slice(0, 4)
  const extra = list.length - shown.length

  return (
    <div className="mb-3 h-40 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3">
      {shown.length === 0 ? (
        <div className="flex h-full items-center justify-center text-slate-400">
          <MessageSquare className="h-8 w-8" />
        </div>
      ) : (
        <ol className="space-y-1.5 text-xs text-slate-600">
          {shown.map((question, index) => (
            <li key={question.id || index} className="flex gap-2">
              <span className="shrink-0 font-medium text-slate-400">{index + 1}.</span>
              <span className="line-clamp-1">{question.question || 'Untitled question'}</span>
            </li>
          ))}
          {extra > 0 && (
            <li className="text-slate-400">+{extra} more</li>
          )}
        </ol>
      )}
    </div>
  )
}

export default function FeedbackTemplatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { canManageEvents, loading: roleLoading } = useRole()

  const [templates, setTemplates] = useState<FeedbackTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('yours')
  const [showInactive, setShowInactive] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<FeedbackTemplate | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  useEffect(() => {
    if (session && canManageEvents) {
      fetchTemplates()
    }
  }, [session, canManageEvents])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/feedback/templates?includeInactive=true')
      if (!response.ok) throw new Error('Failed to fetch templates')
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to fetch templates')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/feedback/templates/${templateToDelete.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete template')
      }

      toast.success('Template deleted successfully')
      setShowDeleteDialog(false)
      setTemplateToDelete(null)
      fetchTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete template')
    } finally {
      setDeleting(false)
    }
  }

  const handleDuplicateTemplate = async (template: FeedbackTemplate) => {
    try {
      const response = await fetch('/api/feedback/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          description: template.description,
          category: template.category,
          questions: template.questions
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to duplicate template')
      }

      toast.success('Template duplicated successfully')
      fetchTemplates()
    } catch (error) {
      console.error('Error duplicating template:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to duplicate template')
    }
  }

  const handleToggleSharing = async (template: FeedbackTemplate) => {
    try {
      const response = await fetch(`/api/feedback/templates/${template.id}`, {
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

      toast.success(template.is_shared ? 'Template unshared successfully' : 'Template shared successfully')
      fetchTemplates()
    } catch (error) {
      console.error('Error toggling sharing:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update sharing status')
    }
  }

  const isOwnTemplate = (template: FeedbackTemplate) =>
    creatorOf(template).id === session?.user?.id

  const canManageTemplate = (template: FeedbackTemplate) => {
    if (template.is_system_template) return false
    if (session?.user?.role === 'admin') return true
    return ['meded_team', 'ctf', 'educator'].includes(session?.user?.role || '') && isOwnTemplate(template)
  }

  const searched = templates.filter((template) => {
    const query = searchQuery.trim().toLowerCase()
    if (!showInactive && !template.is_active) return false
    if (!query) return true
    return (
      template.name.toLowerCase().includes(query) ||
      (template.description || '').toLowerCase().includes(query)
    )
  })

  const userTemplates = searched.filter(isOwnTemplate)
  const sharedTemplates = searched.filter(
    (template) => template.is_shared && !isOwnTemplate(template)
  )

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/feedback')}
            className="mb-4 flex w-fit items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-blue-600 transition-all duration-200 hover:scale-105 hover:bg-blue-100 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Back to Feedback</span>
          </Button>
          <h1 className="mb-2 text-3xl font-bold text-slate-900">Feedback Templates</h1>
          <p className="text-slate-600">
            Your templates stay in one place. Templates shared by other people sit in a separate tab.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showInactive ? 'default' : 'outline'}
                onClick={() => setShowInactive(!showInactive)}
              >
                <Filter className="mr-2 h-4 w-4" />
                {showInactive ? 'Hide inactive' : 'Show inactive'}
              </Button>
              <Button onClick={() => router.push('/feedback/templates/create')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 sm:w-[420px]">
              <TabsTrigger
                value="yours"
                className="rounded-lg py-2 data-[state=active]:bg-white data-[state=active]:text-blue-800 data-[state=active]:shadow-sm"
              >
                <Edit className="mr-2 h-4 w-4" />
                Yours ({userTemplates.length})
              </TabsTrigger>
              <TabsTrigger
                value="shared"
                className="rounded-lg py-2 data-[state=active]:bg-white data-[state=active]:text-teal-800 data-[state=active]:shadow-sm"
              >
                <Users className="mr-2 h-4 w-4" />
                Shared with you ({sharedTemplates.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="yours" className="mt-0">
              <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                Templates you created. Sharing one keeps it here — it does not move into Shared with you.
              </div>
              {userTemplates.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="mb-4 h-16 w-16 text-slate-300" />
                    <h3 className="mb-2 text-lg font-semibold text-slate-700">
                      {searchQuery ? 'No matching templates' : 'No templates yet'}
                    </h3>
                    <p className="mb-4 max-w-sm text-center text-sm text-slate-500">
                      {searchQuery
                        ? 'Try a different search term'
                        : 'Create a reusable question set, then pick it when you create a feedback form.'}
                    </p>
                    {!searchQuery && (
                      <Button onClick={() => router.push('/feedback/templates/create')}>
                        Create Template
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {userTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className={`border-slate-200 transition-all hover:shadow-lg ${
                        !template.is_active ? 'opacity-60' : ''
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="line-clamp-1 text-lg">{template.name}</CardTitle>
                        <CardDescription className="line-clamp-2 text-xs">
                          {template.description || 'No description'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <QuestionPreview questions={template.questions} />
                        <div className="mb-3 text-sm text-slate-600">
                          <div className="flex items-center justify-between">
                            <span>{template.question_count || template.questions?.length || 0} questions</span>
                            <span className="text-xs text-slate-400">{template.usage_count || 0} uses</span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                              Your template
                            </span>
                            {template.is_shared && (
                              <span className="rounded-full bg-violet-100 px-2 py-1 text-xs text-violet-700">
                                Shared with others
                              </span>
                            )}
                            {template.is_system_template && (
                              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">
                                System
                              </span>
                            )}
                            {!template.is_active && (
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                                Inactive
                              </span>
                            )}
                          </div>
                        </div>
                        {canManageTemplate(template) && (
                          <label className="mb-3 flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={template.is_shared || false}
                              onChange={() => handleToggleSharing(template)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-slate-700">Share with others</span>
                          </label>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => router.push(`/feedback/templates/${template.id}/edit`)}
                            disabled={!canManageTemplate(template)}
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDuplicateTemplate(template)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          {session?.user?.role === 'admin' && !template.is_system_template && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => {
                                setTemplateToDelete(template)
                                setShowDeleteDialog(true)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="shared" className="mt-0">
              <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
                Templates other people have shared. Use or copy one — a copy will then appear under Yours.
              </div>
              {sharedTemplates.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="mb-4 h-16 w-16 text-slate-300" />
                    <h3 className="mb-2 text-lg font-semibold text-slate-700">No shared templates</h3>
                    <p className="max-w-sm text-center text-sm text-slate-500">
                      Templates shared by other users will appear here. Yours stay in the Yours tab even if you share them.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {sharedTemplates.map((template) => {
                    const creator = creatorOf(template)
                    return (
                      <Card key={template.id} className="border-slate-200 transition-all hover:shadow-lg">
                        <CardHeader className="pb-3">
                          <CardTitle className="line-clamp-1 text-lg">{template.name}</CardTitle>
                          <CardDescription className="line-clamp-2 text-xs">
                            {template.description || `Shared by ${creator.name}`}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <QuestionPreview questions={template.questions} />
                          <div className="mb-3 text-sm text-slate-600">
                            <div className="flex items-center justify-between">
                              <span>{template.question_count || template.questions?.length || 0} questions</span>
                              <span className="text-xs text-slate-400">{template.usage_count || 0} uses</span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-teal-100 px-2 py-1 text-xs text-teal-700">
                                Shared with you
                              </span>
                              {creator.name && (
                                <span className="text-xs text-slate-500">by {creator.name}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-teal-600 hover:bg-teal-700"
                              asChild
                            >
                              <Link href={`/feedback/templates/${template.id}`}>
                                <Eye className="mr-1 h-3 w-3" />
                                View
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDuplicateTemplate(template)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setTemplateToDelete(null)
        }}
        onConfirm={handleDeleteTemplate}
        title="Delete Template"
        description="Are you sure you want to delete this template? This action cannot be undone and will remove the template from all events using it."
        itemName={templateToDelete?.name}
        isLoading={deleting}
        confirmText="Delete Template"
        cancelText="Cancel"
      />
    </div>
  )
}
