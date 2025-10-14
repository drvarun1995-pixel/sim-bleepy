'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Mail, 
  MessageSquare, 
  Eye, 
  EyeOff,
  CheckCircle, 
  Clock,
  Archive,
  Reply,
  ArrowLeft,
  User,
  Calendar,
  Tag,
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { useRole } from '@/lib/useRole'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  category: string
  message: string
  status: 'new' | 'read' | 'replied' | 'archived'
  admin_notes?: string
  replied_at?: string
  created_at: string
  updated_at: string
}

const STATUS_CONFIG = {
  new: {
    icon: Clock,
    label: 'New',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    bgColor: 'bg-blue-50 border-blue-200'
  },
  read: {
    icon: Eye,
    label: 'Read',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    bgColor: 'bg-yellow-50 border-yellow-200'
  },
  replied: {
    icon: CheckCircle,
    label: 'Replied',
    color: 'bg-green-100 text-green-800 border-green-200',
    bgColor: 'bg-green-50 border-green-200'
  },
  archived: {
    icon: Archive,
    label: 'Archived',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    bgColor: 'bg-gray-50 border-gray-200'
  }
}

const CATEGORY_CONFIG = {
  general: { label: 'General Inquiry', color: 'bg-blue-100 text-blue-800' },
  support: { label: 'Technical Support', color: 'bg-red-100 text-red-800' },
  feedback: { label: 'Feedback', color: 'bg-green-100 text-green-800' },
  partnership: { label: 'Partnership', color: 'bg-purple-100 text-purple-800' },
  media: { label: 'Media Inquiry', color: 'bg-orange-100 text-orange-800' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-800' }
}

export default function ContactMessagesPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { canViewContactMessages, role, loading: roleLoading } = useRole()
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [filteredMessages, setFilteredMessages] = useState<ContactMessage[]>([])
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null)

  // Check if user has permission to view contact messages
  useEffect(() => {
    if (status === 'loading' || roleLoading) return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (!canViewContactMessages) {
      toast.error('Access denied. Admin, MedEd Team, or CTF role required.')
      router.push('/dashboard')
      return
    }
  }, [session, status, canViewContactMessages, roleLoading])

  // Fetch contact messages
  useEffect(() => {
    // Only fetch if user is authenticated and has permission
    if (status === 'loading' || roleLoading || !session || !canViewContactMessages) {
      return
    }

    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/admin/contact-messages')
        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages || [])
          setFilteredMessages(data.messages || [])
        } else {
          throw new Error('Failed to fetch messages')
        }
      } catch (error) {
        console.error('Error fetching contact messages:', error)
        toast.error('Failed to load contact messages')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()
  }, [status, roleLoading, session, canViewContactMessages])

  // Filter messages
  useEffect(() => {
    let filtered = [...messages]

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(msg => msg.status === statusFilter)
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(msg => msg.category === categoryFilter)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(msg => 
        msg.name.toLowerCase().includes(query) ||
        msg.email.toLowerCase().includes(query) ||
        msg.subject.toLowerCase().includes(query) ||
        msg.message.toLowerCase().includes(query)
      )
    }

    setFilteredMessages(filtered)
  }, [messages, statusFilter, categoryFilter, searchQuery])

  const updateMessageStatus = useCallback(async (messageId: string, newStatus: string, notes?: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch('/api/admin/contact-messages', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: messageId,
          status: newStatus,
          admin_notes: notes
        }),
      })

      if (response.ok) {
        // Update local state
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                status: newStatus as any,
                admin_notes: notes || msg.admin_notes,
                updated_at: new Date().toISOString()
              }
            : msg
        ))
        
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(prev => prev ? {
            ...prev,
            status: newStatus as any,
            admin_notes: notes || prev.admin_notes,
            updated_at: new Date().toISOString()
          } : null)
        }

        toast.success('Message updated successfully')
      } else {
        throw new Error('Failed to update message')
      }
    } catch (error) {
      console.error('Error updating message:', error)
      toast.error('Failed to update message')
    } finally {
      setIsUpdating(false)
    }
  }, [selectedMessage])

  const confirmDelete = useCallback((messageId: string) => {
    setMessageToDelete(messageId)
    setDeleteDialogOpen(true)
  }, [])

  const deleteMessage = useCallback(async () => {
    if (!messageToDelete) return

    setIsUpdating(true)
    try {
      const response = await fetch('/api/admin/contact-messages', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: messageToDelete
        }),
      })

      if (response.ok) {
        // Remove from local state
        setMessages(prev => prev.filter(msg => msg.id !== messageToDelete))
        
        // Clear selected message if it was deleted
        if (selectedMessage?.id === messageToDelete) {
          setSelectedMessage(null)
        }

        toast.success('Message deleted successfully')
        setDeleteDialogOpen(false)
        setMessageToDelete(null)
      } else {
        throw new Error('Failed to delete message')
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      toast.error('Failed to delete message')
    } finally {
      setIsUpdating(false)
    }
  }, [messageToDelete, selectedMessage])

  const handleStatusChange = useCallback((messageId: string, newStatus: string) => {
    updateMessageStatus(messageId, newStatus)
  }, [updateMessageStatus])

  const handleAddNotes = useCallback((messageId: string) => {
    if (adminNotes.trim()) {
      updateMessageStatus(messageId, selectedMessage?.status || 'read', adminNotes.trim())
      setAdminNotes('')
    }
  }, [adminNotes, selectedMessage, updateMessageStatus])

  const getStatusConfig = useCallback((status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.new
  }, [])

  const getCategoryConfig = useCallback((category: string) => {
    return CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.other
  }, [])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  if (isLoading || roleLoading) {
    return <LoadingScreen message="Loading contact messages..." />
  }

  if (!canViewContactMessages) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex">
      {/* Dashboard Sidebar */}
      <DashboardSidebar 
        role={(role as 'student' | 'educator' | 'admin' | 'meded_team' | 'ctf') || 'student'} 
        userName={session?.user?.name || 'User'}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <h1 className="text-lg font-semibold text-gray-900">Contact Messages</h1>
            </div>
            <div className="w-10"></div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 p-4 sm:p-6">
          {/* Header */}
          <div className="mb-8">
            {/* Breadcrumb Navigation */}
            <div className="mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>

            {/* Main Header */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* Title Section */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <MessageSquare className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      Contact Messages
                    </h1>
                    <p className="text-gray-600 text-lg">
                      Manage and respond to contact form submissions
                    </p>
                  </div>
                </div>
                
                {/* Message Count Badge */}
                <div className="flex justify-center lg:justify-end">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl px-6 py-4 shadow-md">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {filteredMessages.length}
                        </div>
                        <div className="text-sm font-medium text-gray-600">
                          {filteredMessages.length === 1 ? 'Message' : 'Messages'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Messages List */}
              <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
                {/* Filters */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="read">Read</SelectItem>
                            <SelectItem value="replied">Replied</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Category</Label>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All categories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Search</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search messages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Messages */}
                <div className="space-y-4">
                  {filteredMessages.length === 0 ? (
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                      <CardContent className="p-12 text-center">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages found</h3>
                        <p className="text-gray-600">
                          {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                            ? 'Try adjusting your filters or search query.'
                            : 'No contact messages have been submitted yet.'
                          }
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredMessages.map((message) => {
                      const statusConfig = getStatusConfig(message.status)
                      const categoryConfig = getCategoryConfig(message.category)
                      const StatusIcon = statusConfig.icon

                      return (
                        <Card 
                          key={message.id}
                          className={`shadow-lg border-0 backdrop-blur-sm cursor-pointer transition-all duration-200 hover:shadow-xl ${
                            selectedMessage?.id === message.id 
                              ? 'bg-purple-50 border-2 border-purple-200' 
                              : 'bg-white/80'
                          }`}
                          onClick={() => setSelectedMessage(message)}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="font-semibold text-gray-900 truncate">
                                    {message.subject}
                                  </h3>
                                  <Badge className={`text-xs ${statusConfig.color}`}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {statusConfig.label}
                                  </Badge>
                                  <Badge variant="outline" className={`text-xs ${categoryConfig.color}`}>
                                    {categoryConfig.label}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <User className="h-4 w-4 mr-1" />
                                    {message.name}
                                  </div>
                                  <div className="flex items-center">
                                    <Mail className="h-4 w-4 mr-1" />
                                    {message.email}
                                  </div>
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {formatDate(message.created_at)}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-700 line-clamp-2">
                              {message.message}
                            </p>
                          </CardContent>
                        </Card>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Message Details */}
              <div className="lg:col-span-1 order-1 lg:order-2">
                {selectedMessage ? (
                  <div className="space-y-6">
                    {/* Message Details */}
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                              {selectedMessage.subject}
                            </CardTitle>
                            <div className="flex items-center space-x-2 mb-3">
                              <Badge className={`text-xs ${getStatusConfig(selectedMessage.status).color}`}>
                                {(() => {
                                  const StatusIcon = getStatusConfig(selectedMessage.status).icon;
                                  return <StatusIcon className="h-3 w-3 mr-1" />;
                                })()}
                                {getStatusConfig(selectedMessage.status).label}
                              </Badge>
                              <Badge variant="outline" className={`text-xs ${getCategoryConfig(selectedMessage.category).color}`}>
                                {getCategoryConfig(selectedMessage.category).label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">From</Label>
                            <p className="text-sm text-gray-900">{selectedMessage.name}</p>
                            <p className="text-sm text-gray-600">{selectedMessage.email}</p>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Date</Label>
                            <p className="text-sm text-gray-900">{formatDate(selectedMessage.created_at)}</p>
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700">Message</Label>
                            <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                {selectedMessage.message}
                              </p>
                            </div>
                          </div>

                          {selectedMessage.admin_notes && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Admin Notes</Label>
                              <div className="mt-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                  {selectedMessage.admin_notes}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Status Actions */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">Update Status</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              variant={selectedMessage.status === 'read' ? 'default' : 'outline'}
                              onClick={() => handleStatusChange(selectedMessage.id, 'read')}
                              disabled={isUpdating}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Read
                            </Button>
                            <Button
                              size="sm"
                              variant={selectedMessage.status === 'replied' ? 'default' : 'outline'}
                              onClick={() => handleStatusChange(selectedMessage.id, 'replied')}
                              disabled={isUpdating}
                            >
                              <Reply className="h-4 w-4 mr-1" />
                              Replied
                            </Button>
                            <Button
                              size="sm"
                              variant={selectedMessage.status === 'archived' ? 'default' : 'outline'}
                              onClick={() => handleStatusChange(selectedMessage.id, 'archived')}
                              disabled={isUpdating}
                            >
                              <Archive className="h-4 w-4 mr-1" />
                              Archive
                            </Button>
                          </div>
                        </div>

                        {/* Admin Notes */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Add Admin Notes</Label>
                          <Textarea
                            placeholder="Add notes about this message..."
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            className="min-h-[80px] resize-none"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddNotes(selectedMessage.id)}
                            disabled={!adminNotes.trim() || isUpdating}
                            className="w-full"
                          >
                            Add Notes
                          </Button>
                        </div>

                        {/* Delete Message */}
                        <div className="pt-4 border-t border-gray-200">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => confirmDelete(selectedMessage.id)}
                            disabled={isUpdating}
                            className="w-full"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete Message
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-12 text-center">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a message</h3>
                      <p className="text-gray-600">
                        Choose a message from the list to view details and manage it.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  Delete Message
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-1">
                  This action cannot be undone
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete this contact message? This action will permanently remove the message and cannot be undone.
            </p>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isUpdating}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteMessage}
              disabled={isUpdating}
              className="flex-1"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
