'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, Search, Calendar, User, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'

interface TeachingRequest {
  id: string
  userEmail: string
  userName: string
  topic: string
  description: string
  preferredDate: string
  preferredTime: string
  duration: string
  categories: string[]
  format: string
  additionalInfo: string
  status: 'pending' | 'in-progress' | 'completed' | 'rejected'
  createdAt: string
  updatedAt: string
}

export default function AdminTeachingRequestsPage() {
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const [requests, setRequests] = useState<TeachingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'student' | 'educator' | 'admin' | 'meded_team' | 'ctf' | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [deletingRequest, setDeletingRequest] = useState<string | null>(null)
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!session?.user?.email) return
      
      try {
        const response = await fetch('/api/user/role')
        if (response.ok) {
          const data = await response.json()
          if (data.role) {
            setUserRole(data.role)
            
            // Check if user has access to this page
            if (!['admin', 'ctf', 'educator', 'meded_team'].includes(data.role)) {
              router.push('/dashboard')
              toast.error('Access denied', {
                description: 'You do not have permission to view this page.'
              })
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
      }
    }

    if (sessionStatus === 'authenticated') {
      fetchUserRole()
    }
  }, [session, sessionStatus, router])

  useEffect(() => {
    if (userRole && ['admin', 'ctf', 'educator', 'meded_team'].includes(userRole)) {
      fetchRequests()
      fetchCategories()
    }
  }, [userRole])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/teaching-requests')
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      } else {
        throw new Error('Failed to fetch requests')
      }
    } catch (error) {
      console.error('Error fetching teaching requests:', error)
      toast.error('Failed to load teaching requests')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleStatusUpdate = async (requestId: string, newStatus: TeachingRequest['status']) => {
    try {
      setUpdatingStatus(requestId)
      
      const response = await fetch(`/api/admin/teaching-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to update status')
      }

      const data = await response.json()
      
      // Update local state with the response data
      setRequests(prev => prev.map(req => 
        req.id === requestId ? data.request : req
      ))
      
      const statusLabels = {
        'pending': 'Pending',
        'in-progress': 'In Progress',
        'completed': 'Completed',
        'rejected': 'Rejected'
      }
      
      toast.success(`Request marked as ${statusLabels[newStatus]}`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status', {
        description: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingRequest(requestId)
      
      const response = await fetch(`/api/admin/teaching-requests/${requestId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to delete request')
      }

      // Remove from local state
      setRequests(prev => prev.filter(req => req.id !== requestId))
      
      toast.success('Request deleted successfully')
    } catch (error) {
      console.error('Error deleting request:', error)
      toast.error('Failed to delete request', {
        description: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setDeletingRequest(null)
    }
  }

  const getStatusColor = (status: TeachingRequest['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryNames = (categoryIds: string[]) => {
    return categoryIds.map(id => {
      const category = categories.find(c => c.id === id)
      return category?.name || id
    }).join(', ')
  }

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (sessionStatus === 'loading' || !userRole) {
    return (
      <DashboardLayoutClient role={userRole} userName={session?.user?.name as string | undefined}>
        <div className="container mx-auto px-4 py-4 sm:py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayoutClient>
    )
  }

  if (!['admin', 'ctf', 'educator', 'meded_team'].includes(userRole)) {
    return null
  }

  return (
    <DashboardLayoutClient role={userRole} userName={session?.user?.name as string | undefined}>
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Teaching Request Messages</h1>
              <p className="text-gray-600">Manage teaching event requests from users</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="border-gray-200 focus:border-purple-300 focus:ring-purple-200">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No teaching requests found</h3>
              <p className="text-gray-600">
                {requests.length === 0 
                  ? "No teaching requests have been submitted yet."
                  : "No requests match your current filters."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {request.topic}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <User className="h-4 w-4" />
                            <span>{request.userName}</span>
                            <span className="text-gray-400">•</span>
                            <span>{request.userEmail}</span>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(request.status)} text-xs`}>
                          {request.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs">
                            {getCategoryNames(request.categories)}
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs">
                            {request.duration}
                          </span>
                        </div>
                        
                        {request.preferredDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Preferred: {format(new Date(request.preferredDate), 'MMM d, yyyy')}
                              {request.preferredTime && ` at ${request.preferredTime}`}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Requested {format(new Date(request.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                        
                        <p className="text-gray-700 mt-2">{request.description}</p>
                        
                        {request.additionalInfo && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-600">
                              <strong>Additional Info:</strong> {request.additionalInfo}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {updatingStatus === request.id || deletingRequest === request.id ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{deletingRequest === request.id ? 'Deleting...' : 'Updating...'}</span>
                        </div>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(request.id, 'pending')}
                            disabled={request.status === 'pending'}
                            className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 disabled:opacity-50 flex-shrink-0"
                            title="Mark as Pending"
                          >
                            <AlertCircle className="h-4 w-4" />
                            <span className="ml-1 hidden sm:inline">Pending</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(request.id, 'in-progress')}
                            disabled={request.status === 'in-progress'}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 disabled:opacity-50 flex-shrink-0"
                            title="Mark as In Progress"
                          >
                            <Loader2 className="h-4 w-4" />
                            <span className="ml-1 hidden sm:inline">In Progress</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(request.id, 'completed')}
                            disabled={request.status === 'completed'}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 disabled:opacity-50 flex-shrink-0"
                            title="Mark as Completed"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span className="ml-1 hidden sm:inline">Complete</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(request.id, 'rejected')}
                            disabled={request.status === 'rejected'}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 flex-shrink-0"
                            title="Mark as Rejected"
                          >
                            <XCircle className="h-4 w-4" />
                            <span className="ml-1 hidden sm:inline">Reject</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRequest(request.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 flex-shrink-0"
                            title="Delete Request"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="ml-1 hidden sm:inline">Delete</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayoutClient>
  )
}