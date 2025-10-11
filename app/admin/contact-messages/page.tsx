'use client'

import { useState, useEffect } from 'react'
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
  Search
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

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
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [filteredMessages, setFilteredMessages] = useState<ContactMessage[]>([])
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  // Check if user is admin
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    // You might want to add an admin check here
    // For now, we'll assume the user has access to this page
  }, [session, status, router])

  // Fetch contact messages
  useEffect(() => {
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
  }, [])

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

  const updateMessageStatus = async (messageId: string, newStatus: string, notes?: string) => {
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
  }

  const handleStatusChange = (messageId: string, newStatus: string) => {
    updateMessageStatus(messageId, newStatus)
  }

  const handleAddNotes = (messageId: string) => {
    if (adminNotes.trim()) {
      updateMessageStatus(messageId, selectedMessage?.status || 'read', adminNotes.trim())
      setAdminNotes('')
    }
  }

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.new
  }

  const getCategoryConfig = (category: string) => {
    return CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.other
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading contact messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Contact Messages</h1>
              </div>
              <p className="text-gray-600">
                Manage and respond to contact form submissions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-sm">
                {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Messages List */}
          <div className="lg:col-span-2 space-y-4">
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
          <div className="lg:col-span-1">
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
  )
}
