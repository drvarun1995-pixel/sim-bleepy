'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Copy,
  BarChart3,
  Users,
  Calendar,
  Tag,
  ArrowLeft,
  Share2,
  Lock
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
  }
}

export default function FeedbackTemplatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { canManageEvents, loading: roleLoading } = useRole()
  
  const [templates, setTemplates] = useState<FeedbackTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<FeedbackTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sharingFilter, setSharingFilter] = useState('all')
  const [showInactive, setShowInactive] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<FeedbackTemplate | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  // Fetch templates
  useEffect(() => {
    if (session && canManageEvents) {
      fetchTemplates()
    }
  }, [session, canManageEvents])

  // Filter templates
  useEffect(() => {
    let filtered = templates

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }


    // Sharing filter
    if (sharingFilter !== 'all') {
      if (sharingFilter === 'shared') {
        filtered = filtered.filter(template => template.is_shared)
      } else if (sharingFilter === 'own') {
        filtered = filtered.filter(template => !template.is_shared)
      }
    }

    // Active filter
    if (!showInactive) {
      filtered = filtered.filter(template => template.is_active)
    }

    setFilteredTemplates(filtered)
  }, [templates, searchQuery, sharingFilter, showInactive])

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

  const confirmDeleteTemplate = (template: FeedbackTemplate) => {
    setTemplateToDelete(template)
    setShowDeleteDialog(true)
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


  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="container mx-auto px-4 py-8">
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Feedback Templates</h1>
        <p className="text-gray-600">Create and manage reusable feedback form templates</p>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          

          <Select value={sharingFilter} onValueChange={setSharingFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by sharing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Templates</SelectItem>
              <SelectItem value="shared">Shared Only</SelectItem>
              <SelectItem value="own">My Templates</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => setShowInactive(!showInactive)}
            variant={showInactive ? "default" : "outline"}
            className="w-full sm:w-auto"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showInactive ? 'Hide Inactive' : 'Show Inactive'}
          </Button>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
          </div>
          
          <Button onClick={() => router.push('/feedback/templates/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Template
          </Button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className={`${!template.is_active ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {template.description || 'No description provided'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {template.is_system_template && (
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      System
                    </Badge>
                  )}
                  {template.is_shared && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
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
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <BarChart3 className="h-4 w-4" />
                    {template.question_count} questions
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {template.usage_count} uses
                  </div>
                </div>

                {/* Creator */}
                <div className="text-sm text-gray-500">
                  Created by {template.users.name} ({template.users.role})
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/feedback/templates/${template.id}`)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicateTemplate(template)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  
                  {!template.is_system_template && session && (
                    (session.user.role === 'admin') || 
                    (['meded_team', 'ctf', 'educator'].includes(session.user.role || '') && template.users.id === session.user.id)
                  ) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleSharing(template)}
                      className={template.is_shared ? "text-green-600 hover:text-green-700" : "text-gray-600 hover:text-gray-700"}
                      title={template.is_shared ? "Unshare template" : "Share template"}
                    >
                      {template.is_shared ? <Share2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </Button>
                  )}
                  
                  {!template.is_system_template && session && (
                    (session.user.role === 'admin') || 
                    (['meded_team', 'ctf', 'educator'].includes(session.user.role || '') && template.users.id === session.user.id)
                  ) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/feedback/templates/${template.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {!template.is_system_template && session && session.user.role === 'admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => confirmDeleteTemplate(template)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {searchQuery || sharingFilter !== 'all' || showInactive 
              ? 'No templates match your filters'
              : 'No templates found'
            }
          </div>
          <Button onClick={() => router.push('/feedback/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Template
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
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
