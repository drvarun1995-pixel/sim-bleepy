'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TiptapSimpleEditor } from '@/components/ui/tiptap-simple-editor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { DeleteMessageDialog } from '@/components/ui/confirmation-dialog'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/utils'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  EyeOff,
  AlertCircle, 
  Users, 
  GraduationCap, 
  Calendar as CalendarIcon,
  Plus,
  X,
  Clock,
  User,
  Settings,
  Shield
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

interface TargetAudience {
  type: 'all' | 'specific'
  roles: string[]
  years: string[]
  universities: string[]
  specialties?: string[]
}

interface Announcement {
  id: string
  title: string
  content: string
  author_id: string
  author_name: string
  target_audience: TargetAudience
  priority: 'low' | 'normal' | 'high' | 'urgent'
  is_active: boolean
  expires_at: string | null
  created_at: string
  updated_at: string
}

const ROLE_OPTIONS = [
  { value: 'medical_student', label: 'Medical Student' },
  { value: 'foundation_doctor', label: 'Foundation Year Doctor' },
  { value: 'clinical_fellow', label: 'Clinical Fellow' },
  { value: 'specialty_doctor', label: 'Specialty Doctor' },
  { value: 'registrar', label: 'Registrar' },
  { value: 'consultant', label: 'Consultant' }
]

const YEAR_OPTIONS = [
  { value: '1', label: 'Year 1' },
  { value: '2', label: 'Year 2' },
  { value: '3', label: 'Year 3' },
  { value: '4', label: 'Year 4' },
  { value: '5', label: 'Year 5' },
  { value: '6', label: 'Year 6' },
  { value: 'FY1', label: 'FY1 (Foundation Year 1)' },
  { value: 'FY2', label: 'FY2 (Foundation Year 2)' }
]

const UNIVERSITY_OPTIONS = [
  { value: 'ARU', label: 'Anglia Ruskin University (ARU)' },
  { value: 'UCL', label: 'University College London (UCL)' }
]

const PRIORITY_OPTIONS = [
  { 
    value: 'low', 
    label: 'Low', 
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    dotColor: 'bg-slate-400',
    description: 'General information'
  },
  { 
    value: 'normal', 
    label: 'Normal', 
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500',
    description: 'Important updates'
  },
  { 
    value: 'high', 
    label: 'High', 
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
    description: 'Time-sensitive'
  },
  { 
    value: 'urgent', 
    label: 'Urgent', 
    color: 'bg-red-100 text-red-700 border-red-200',
    dotColor: 'bg-red-500',
    description: 'Immediate action required'
  }
]

export default function AnnouncementsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [userRole, setUserRole] = useState<'admin' | 'educator' | 'student' | 'meded_team' | 'ctf'>('student')
  const [userId, setUserId] = useState<string>('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal')
  const [isActive, setIsActive] = useState(true)
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [targetAudience, setTargetAudience] = useState<TargetAudience>({
    type: 'all',
    roles: [],
    years: [],
    universities: [],
    specialties: []
  })

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchUserInfo()
      fetchAnnouncements()
    }
  }, [status, session])

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/admin/check')
      if (response.ok) {
        const data = await response.json()
        // Get user profile data from users table
        const profileResponse = await fetch('/api/user/profile')
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          setUserRole(profileData.user?.role || 'student')
          setUserId(profileData.user?.id || '')
        } else {
          // Fallback to admin check data
          setUserRole(data.isAdmin ? 'admin' : 'educator')
          setUserId('')
        }
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements')
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.announcements || [])
      } else {
        const error = await response.json()
        if (error.code === 'TABLE_NOT_FOUND') {
          toast.error('Database setup required. Please run the announcements schema script.')
        } else {
          toast.error(error.message || 'Failed to load announcements')
        }
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    // Clean up draft images if form is closed without saving
    const currentDraftId = draftId
    if (currentDraftId && !editingAnnouncement) {
      // Clean up draft folder asynchronously (don't block form reset)
      fetch(`/api/announcements/drafts/cleanup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: currentDraftId }),
      }).catch((err) => {
        console.error('Failed to cleanup draft folder:', err)
      })
    }
    
    setTitle('')
    setContent('')
    setPriority('normal')
    setIsActive(true)
    setExpiresAt(undefined)
    setDatePickerOpen(false)
    setDraftId(null)
    setTargetAudience({
      type: 'all',
      roles: [],
      years: [],
      universities: [],
      specialties: []
    })
    setEditingAnnouncement(null)
    setShowCreateForm(false)
  }

  const populateFormForEdit = (announcement: Announcement) => {
    setTitle(announcement.title)
    setContent(announcement.content)
    setPriority(announcement.priority)
    setIsActive(announcement.is_active)
    setExpiresAt(announcement.expires_at ? new Date(announcement.expires_at) : undefined)
    setTargetAudience(announcement.target_audience)
    setEditingAnnouncement(announcement)
    setDraftId(null) // No draft for editing existing announcements
    setShowCreateForm(true)
  }

  // Generate draft ID when creating new announcement
  useEffect(() => {
    if (showCreateForm && !editingAnnouncement && !draftId) {
      // Generate UUID using crypto API (available in browsers)
      const generateUUID = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID()
        }
        // Fallback for older browsers
        return `${Date.now()}-${Math.random().toString(36).substring(2)}-${Math.random().toString(36).substring(2)}`
      }
      setDraftId(generateUUID())
    }
  }, [showCreateForm, editingAnnouncement, draftId])

  const handleCreateAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      const isEditing = editingAnnouncement !== null
      const url = isEditing ? `/api/announcements/${editingAnnouncement.id}` : '/api/announcements'
      const method = isEditing ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          target_audience: targetAudience,
          priority,
          is_active: isActive,
          expires_at: expiresAt?.toISOString() || null,
          draftId: isEditing ? null : draftId // Only send draftId for new announcements
        }),
      })

      if (response.ok) {
        toast.success(isEditing ? 'Announcement updated successfully!' : 'Announcement created successfully!')
        resetForm()
        fetchAnnouncements()
      } else {
        const error = await response.json()
        console.error('API Error:', error)
        if (error.code === 'TABLE_NOT_FOUND') {
          toast.error('Database setup required. Please contact your administrator.')
        } else {
          const errorMsg = error.details ? `${error.error}: ${error.details}` : (error.message || error.error || `Failed to ${isEditing ? 'update' : 'create'} announcement`)
          toast.error(errorMsg)
        }
      }
    } catch (error) {
      console.error('Error saving announcement:', error)
      toast.error(`Failed to ${editingAnnouncement ? 'update' : 'create'} announcement`)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !currentStatus
        }),
      })

      if (response.ok) {
        toast.success(`Announcement ${!currentStatus ? 'activated' : 'deactivated'}`)
        fetchAnnouncements()
      } else {
        toast.error('Failed to update announcement')
      }
    } catch (error) {
      console.error('Error updating announcement:', error)
      toast.error('Failed to update announcement')
    }
  }

  const handleDeleteAnnouncement = async (announcement: Announcement) => {
    setDeleteTarget(announcement)
    setShowDeleteDialog(true)
  }

  const confirmDeleteAnnouncement = async () => {
    if (!deleteTarget) return
    
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/announcements/${deleteTarget.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Announcement deleted successfully')
        // Remove the announcement from the local state immediately
        setAnnouncements(prev => prev.filter(a => a.id !== deleteTarget.id))
        // Also refetch to ensure consistency
        await fetchAnnouncements()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete announcement')
      }
    } catch (error) {
      console.error('Error deleting announcement:', error)
      toast.error('Failed to delete announcement')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setDeleteTarget(null)
    }
  }

  const getPriorityBadge = (priority: string) => {
    const option = PRIORITY_OPTIONS.find(p => p.value === priority)
    return (
      <Badge className={option?.color || 'bg-gray-100 text-gray-800'}>
        {option?.label || priority}
      </Badge>
    )
  }

  const formatTargetAudience = (audience: TargetAudience) => {
    if (audience.type === 'all') {
      return 'All Users'
    }
    
    const parts: string[] = []
    if (audience.roles.length > 0) {
      const roleLabels = audience.roles.map(role => 
        ROLE_OPTIONS.find(r => r.value === role)?.label || role
      )
      parts.push(roleLabels.join(', '))
    }
    if (audience.years.length > 0) {
      const yearLabels = audience.years.map(year => 
        YEAR_OPTIONS.find(y => y.value === year)?.label || year
      )
      parts.push(yearLabels.join(', '))
    }
    if (audience.universities.length > 0) {
      const universityLabels = audience.universities.map(university => 
        UNIVERSITY_OPTIONS.find(u => u.value === university)?.label || university
      )
      parts.push(universityLabels.join(', '))
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'Specific Users'
  }

  const canEditAnnouncement = (announcement: Announcement) => {
    // Admins, MedEd team, and CTF can edit all announcements
    if (userRole === 'admin' || userRole === 'meded_team' || userRole === 'ctf') {
      return true
    }
    // Educators can only edit their own announcements
    if (userRole === 'educator') {
      return announcement.author_id === userId
    }
    // Students cannot edit announcements
    return false
  }

  const canDeleteAnnouncement = (announcement: Announcement) => {
    // Admins, MedEd team, and CTF can delete all announcements
    if (userRole === 'admin' || userRole === 'meded_team' || userRole === 'ctf') {
      return true
    }
    // Educators can only delete their own announcements
    if (userRole === 'educator') {
      return announcement.author_id === userId
    }
    // Students cannot delete announcements
    return false
  }

  if (status === 'loading' || loading) {
    return <LoadingScreen message="Loading announcements..." />
  }

  if (!session?.user) {
    return <div>Please sign in to access this page.</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Create and manage announcements for your audience</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center space-x-2 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create Announcement</span>
          <span className="sm:hidden">Create</span>
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
            </CardTitle>
            <CardDescription>
              {editingAnnouncement 
                ? 'Update the announcement details below.'
                : 'Create an announcement that will be displayed on the dashboard for your target audience.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter announcement title"
                  maxLength={255}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center space-x-3 py-1">
                          <div className={`w-3 h-3 rounded-full ${option.dotColor}`}></div>
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-gray-500">{option.description}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <TiptapSimpleEditor
                value={content}
                onChange={(value) => setContent(value)}
                placeholder="Enter announcement content"
                draftId={editingAnnouncement ? undefined : draftId || undefined}
                uploadContext="announcement"
              />
            </div>

            {/* Target Audience */}
            <div className="space-y-4">
              <Label>Target Audience</Label>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={targetAudience.type === 'all'}
                    onCheckedChange={(checked) => 
                      setTargetAudience(prev => ({
                        ...prev,
                        type: checked ? 'all' : 'specific'
                      }))
                    }
                  />
                  <Label>Target all users</Label>
                </div>

                {targetAudience.type === 'specific' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label>Roles</Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                        {ROLE_OPTIONS.map((role) => (
                          <div key={role.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`role-${role.value}`}
                              checked={targetAudience.roles.includes(role.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTargetAudience(prev => ({
                                    ...prev,
                                    roles: [...prev.roles, role.value]
                                  }))
                                } else {
                                  setTargetAudience(prev => ({
                                    ...prev,
                                    roles: prev.roles.filter(r => r !== role.value)
                                  }))
                                }
                              }}
                            />
                            <Label htmlFor={`role-${role.value}`} className="text-sm">
                              {role.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Years</Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                        {YEAR_OPTIONS.map((year) => (
                          <div key={year.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`year-${year.value}`}
                              checked={targetAudience.years.includes(year.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTargetAudience(prev => ({
                                    ...prev,
                                    years: [...prev.years, year.value]
                                  }))
                                } else {
                                  setTargetAudience(prev => ({
                                    ...prev,
                                    years: prev.years.filter(y => y !== year.value)
                                  }))
                                }
                              }}
                            />
                            <Label htmlFor={`year-${year.value}`} className="text-sm">
                              {year.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Universities</Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                        {UNIVERSITY_OPTIONS.map((university) => (
                          <div key={university.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`university-${university.value}`}
                              checked={targetAudience.universities.includes(university.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTargetAudience(prev => ({
                                    ...prev,
                                    universities: [...prev.universities, university.value]
                                  }))
                                } else {
                                  setTargetAudience(prev => ({
                                    ...prev,
                                    universities: prev.universities.filter(u => u !== university.value)
                                  }))
                                }
                              }}
                            />
                            <Label htmlFor={`university-${university.value}`} className="text-sm">
                              {university.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label>Active immediately</Label>
              </div>
              <div className="space-y-2">
                <Label>Expires At (Optional)</Label>
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type="date"
                      value={expiresAt ? expiresAt.toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const dateValue = e.target.value
                        if (dateValue) {
                          // Create date in local timezone to avoid timezone offset issues
                          const [year, month, day] = dateValue.split('-').map(Number)
                          const date = new Date(year, month - 1, day, 23, 59, 59) // End of day
                          console.log('Date picker - Selected date:', dateValue, 'Created Date object:', date)
                          setExpiresAt(date)
                        } else {
                          setExpiresAt(undefined)
                        }
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  {expiresAt && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setExpiresAt(undefined)}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Select a date when this announcement should no longer be visible to users
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-4">
              <Button
                variant="outline"
                onClick={resetForm}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAnnouncement}
                disabled={saving}
                className="w-full sm:w-auto flex items-center justify-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {saving 
                    ? (editingAnnouncement ? 'Updating...' : 'Creating...') 
                    : (editingAnnouncement ? 'Update Announcement' : 'Create Announcement')
                  }
                </span>
                <span className="sm:hidden">
                  {saving 
                    ? (editingAnnouncement ? 'Updating...' : 'Creating...') 
                    : (editingAnnouncement ? 'Update' : 'Create')
                  }
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">All Announcements</h2>
          <div className="text-sm text-gray-600">
            {userRole === 'educator' ? (
              <span className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>You can only edit/delete your own announcements</span>
              </span>
            ) : null}
          </div>
        </div>
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements yet</h3>
              <p className="text-gray-600 mb-4">Create your first announcement to get started.</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className={`${!announcement.is_active ? 'opacity-60' : ''}`}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <CardTitle className="text-lg truncate">{announcement.title}</CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getPriorityBadge(announcement.priority)}
                          {!announcement.is_active && (
                            <Badge variant="outline" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{announcement.author_name}</span>
                          {announcement.author_id === userId && (
                            <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">{format(new Date(announcement.created_at), 'MMM d, yyyy')}</span>
                        </div>
                        {announcement.expires_at && (
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="whitespace-nowrap">Expires {format(new Date(announcement.expires_at), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-end sm:justify-start space-x-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(announcement.id, announcement.is_active)}
                        title={announcement.is_active ? 'Deactivate' : 'Activate'}
                        className="h-8 w-8 p-0"
                      >
                        {announcement.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      {canEditAnnouncement(announcement) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => populateFormForEdit(announcement)}
                          className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0"
                          title="Edit announcement"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      )}
                      {canDeleteAnnouncement(announcement) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAnnouncement(announcement)}
                          className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                          title="Delete announcement"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm mt-3">
                    <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600 truncate">
                      Target: {formatTargetAudience(announcement.target_audience)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div 
                    className="announcement-content text-gray-700 whitespace-pre-wrap break-words"
                    dangerouslySetInnerHTML={{ __html: announcement.content }}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteMessageDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDeleteAnnouncement}
        isLoading={isDeleting}
        title={`Delete "${deleteTarget?.title}"`}
        description={`Are you sure you want to delete this announcement? This action cannot be undone and the announcement will be permanently removed.`}
      />
    </div>
  )
}
