'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Search, Calendar, User, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Trash2, Lock, Eye, EyeOff, Save, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'

interface FileRequest {
  id: string
  userEmail: string
  userName: string
  fileName: string
  description: string
  additionalInfo: string
  eventId: string
  eventTitle: string
  eventDate: string
  status: 'pending' | 'in-progress' | 'completed' | 'rejected'
  createdAt: string
  updatedAt: string
}

export default function AdminFileRequestsPage() {
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const [requests, setRequests] = useState<FileRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'student' | 'educator' | 'admin' | 'meded_team' | 'ctf' | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [deletingRequest, setDeletingRequest] = useState<string | null>(null)
  
  // Download password management states
  const [passwordSectionOpen, setPasswordSectionOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStatus, setPasswordStatus] = useState<{ configured: boolean; lastUpdated: string | null; updatedBy: string | null; password: string | null } | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [loadingPasswordStatus, setLoadingPasswordStatus] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

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
      // Only fetch password status for admin, meded_team, or ctf
      if (['admin', 'meded_team', 'ctf'].includes(userRole)) {
        fetchPasswordStatus()
      }
    }
  }, [userRole])

  const fetchPasswordStatus = async () => {
    try {
      setLoadingPasswordStatus(true)
      const response = await fetch('/api/platform/download-password')
      if (response.ok) {
        const data = await response.json()
        setPasswordStatus(data)
      } else {
        console.error('Failed to fetch password status')
      }
    } catch (error) {
      console.error('Error fetching password status:', error)
    } finally {
      setLoadingPasswordStatus(false)
    }
  }

  const handleSavePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    try {
      setSavingPassword(true)
      const response = await fetch('/api/platform/download-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update password')
      }

      toast.success('Download password updated successfully')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSectionOpen(false)
      fetchPasswordStatus()
    } catch (error) {
      console.error('Error saving password:', error)
      toast.error('Failed to update password', {
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setSavingPassword(false)
    }
  }

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/file-requests')
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      } else {
        throw new Error('Failed to fetch requests')
      }
    } catch (error) {
      console.error('Error fetching file requests:', error)
      toast.error('Failed to load file requests')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (requestId: string, newStatus: FileRequest['status']) => {
    try {
      setUpdatingStatus(requestId)
      
      const response = await fetch(`/api/admin/file-requests/${requestId}`, {
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
      
      const response = await fetch(`/api/admin/file-requests/${requestId}`, {
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

  const getStatusColor = (status: FileRequest['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">File Request Messages</h1>
              <p className="text-gray-600">Manage file requests from users</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

        {/* Download Password Management Section - Only for Admin, MedEd Team, and CTF */}
        {['admin', 'meded_team', 'ctf'].includes(userRole) && (
          <Card className="mb-6 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Lock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Download Password Management
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Set and manage the password required for downloading documents from Downloads and Placements pages
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPasswordSectionOpen(!passwordSectionOpen)}
                  className="border-purple-200 hover:bg-purple-100 hover:text-gray-900 text-gray-700"
                >
                  {passwordSectionOpen ? 'Hide' : 'Manage'}
                </Button>
              </div>
            </CardHeader>

            {passwordSectionOpen && (
              <CardContent className="space-y-4 pt-4">
                {/* Password Status */}
                {loadingPasswordStatus ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading password status...</span>
                  </div>
                ) : passwordStatus ? (
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">
                        Password is configured
                      </span>
                    </div>
                    {passwordStatus.lastUpdated && (
                      <p className="text-xs text-gray-600 ml-6 mb-2">
                        Last updated: {format(new Date(passwordStatus.lastUpdated), 'PPp')}
                        {passwordStatus.updatedBy && ` by ${passwordStatus.updatedBy}`}
                      </p>
                    )}
                    {passwordStatus.password && (
                      <div className="bg-white border border-gray-300 rounded-lg p-3 mt-2">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-gray-700">
                            Current Password:
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                          >
                            {showCurrentPassword ? (
                              <>
                                <EyeOff className="h-3 w-3" />
                                Hide
                              </>
                            ) : (
                              <>
                                <Eye className="h-3 w-3" />
                                Show
                              </>
                            )}
                          </button>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2 font-mono text-sm">
                          {showCurrentPassword ? (
                            <span className="text-gray-900">{passwordStatus.password}</span>
                          ) : (
                            <span className="text-gray-400">••••••••</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(passwordStatus.password || '')
                            toast.success('Password copied to clipboard')
                          }}
                          className="mt-2 text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                        >
                          <Copy className="h-3 w-3" />
                          Copy Password
                        </button>
                      </div>
                    )}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2">
                      <p className="text-xs text-blue-800">
                        <strong>Note:</strong> The password is stored securely. You can view it above or change it by entering a new password below.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-900">
                        Password not configured
                      </span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1 ml-6">
                      Please set a password to protect document downloads.
                    </p>
                  </div>
                )}

                {/* Password Form */}
                <div className="space-y-4 bg-white rounded-lg p-4 border border-purple-200">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {passwordStatus?.configured ? 'Change Password' : 'Set Password'}
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min. 6 characters)"
                        className="pr-10"
                        disabled={savingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="pr-10"
                        disabled={savingPassword}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !savingPassword) {
                            handleSavePassword()
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    <p className="font-medium mb-1">Important Information</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>This password will be required for all document downloads</li>
                      <li>Only medical students should have access to this password</li>
                      <li>Password must be at least 6 characters long</li>
                      <li>Make sure to distribute the password securely to authorized users</li>
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSavePassword}
                      disabled={savingPassword || !newPassword || !confirmPassword}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {savingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Password
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setNewPassword('')
                        setConfirmPassword('')
                        setPasswordSectionOpen(false)
                      }}
                      disabled={savingPassword}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

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
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No file requests found</h3>
              <p className="text-gray-600">
                {requests.length === 0 
                  ? "No file requests have been submitted yet."
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
                            {request.fileName}
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
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Event: {request.eventTitle}</span>
                          <span className="text-gray-400">•</span>
                          <span>{format(new Date(request.eventDate), 'MMM d, yyyy')}</span>
                        </div>
                        
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