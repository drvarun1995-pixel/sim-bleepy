'use client'

import { useEffect, useState } from 'react'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  BarChart3, 
  Users, 
  Download, 
  Calendar,
  Filter,
  RefreshCw,
  TrendingUp,
  Clock,
  FileText,
  User
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts'

interface UserActivity {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
  lastLogin: string | null
  loginCount: number
  totalAttempts: number
  averageScore: number
  email_verified: boolean
}

interface DownloadActivity {
  id: string
  resource_name: string
  user_email: string
  user_name: string
  download_timestamp: string
  file_size: number
  file_type: string
}

interface AnalyticsData {
  userActivities: UserActivity[]
  downloadActivities: DownloadActivity[]
  totalUsers: number
  totalDownloads: number
  activeUsersToday: number
  downloadsToday: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('7') // days
  const [userFilter, setUserFilter] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [exportingData, setExportingData] = useState(false)
  const [clearingData, setClearingData] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Check if user is admin before allowing access
    checkAdminAccess()
  }, [session, status, router])

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/user/role')
      if (response.ok) {
        const { role } = await response.json()
        
        // Only allow admins to access this page
        if (role !== 'admin') {
          router.push('/dashboard')
          return
        }
        
        await fetchAnalytics()
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Failed to check admin access:', error)
      router.push('/dashboard')
    }
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      const [usersResponse, downloadsResponse] = await Promise.all([
        fetch('/api/admin/users?limit=100'), // Limit to 100 users for better performance
        fetch(`/api/downloads/track?limit=500`) // Limit downloads too
      ])

      const usersData = usersResponse.ok ? await usersResponse.json() : { users: [] }
      const downloadsData = downloadsResponse.ok ? await downloadsResponse.json() : { downloads: [] }

      // Calculate metrics
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      const activeUsersToday = usersData.users.filter((user: UserActivity) => {
        // For now, consider users with attempts as "active"
        return user.totalAttempts > 0
      }).length

      const downloadsToday = downloadsData.downloads.filter((download: DownloadActivity) => {
        const downloadDate = new Date(download.download_timestamp)
        return downloadDate >= today
      }).length

      setData({
        userActivities: usersData.users || [],
        downloadActivities: downloadsData.downloads || [],
        totalUsers: usersData.users?.length || 0,
        totalDownloads: downloadsData.downloads?.length || 0,
        activeUsersToday,
        downloadsToday
      })
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    setRefreshKey(prev => prev + 1)
    fetchAnalytics()
  }

  const handleExportData = async () => {
    try {
      setExportingData(true)
      const response = await fetch('/api/admin/export-login-data')
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `login-tracking-data-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Failed to export data')
        alert('Failed to export data. Please try again.')
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Error exporting data. Please try again.')
    } finally {
      setExportingData(false)
    }
  }

  const handleClearUserData = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to clear login tracking data for ${userEmail}?`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/clear-login-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        alert('Login data cleared successfully')
        fetchAnalytics() // Refresh data
      } else {
        alert('Failed to clear login data')
      }
    } catch (error) {
      console.error('Error clearing login data:', error)
      alert('Error clearing login data')
    }
  }

  const handleClearAllLoginData = async () => {
    if (!confirm('Are you sure you want to clear login tracking data for ALL users? This action cannot be undone.')) {
      return
    }

    try {
      setClearingData(true)
      const response = await fetch('/api/admin/clear-login-data', {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Successfully cleared login data for ${result.count} users`)
        fetchAnalytics() // Refresh data
      } else {
        alert('Failed to clear all login data')
      }
    } catch (error) {
      console.error('Error clearing all login data:', error)
      alert('Error clearing all login data')
    } finally {
      setClearingData(false)
    }
  }

  // Filter data based on date range
  const getFilteredData = () => {
    if (!data) return { userActivities: [], downloadActivities: [] }
    
    const days = parseInt(dateFilter)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    let filteredUsers = data.userActivities
    let filteredDownloads = data.downloadActivities
    
    // Apply date filter
    if (days > 0) {
      filteredUsers = data.userActivities.filter(user => 
        new Date(user.createdAt) >= cutoffDate
      )
      filteredDownloads = data.downloadActivities.filter(download => 
        new Date(download.download_timestamp) >= cutoffDate
      )
    }
    
    // Apply user filter
    if (userFilter) {
      filteredUsers = filteredUsers.filter(user => 
        (user.email?.toLowerCase().includes(userFilter.toLowerCase()) || false) ||
        (user.name?.toLowerCase().includes(userFilter.toLowerCase()) || false)
      )
      filteredDownloads = filteredDownloads.filter(download => 
        (download.user_email?.toLowerCase().includes(userFilter.toLowerCase()) || false) ||
        (download.user_name?.toLowerCase().includes(userFilter.toLowerCase()) || false)
      )
    }
    
    return { userActivities: filteredUsers, downloadActivities: filteredDownloads }
  }

  // Prepare chart data
  const prepareChartData = () => {
    const { userActivities, downloadActivities } = getFilteredData()
    
    // User registration activity over time
    const registrationActivity: Record<string, number> = {}
    userActivities.forEach(user => {
      const date = new Date(user.createdAt).toISOString().split('T')[0]
      registrationActivity[date] = (registrationActivity[date] || 0) + 1
    })
    
    // Download activity over time
    const downloadActivity: Record<string, number> = {}
    downloadActivities.forEach(download => {
      const date = new Date(download.download_timestamp).toISOString().split('T')[0]
      downloadActivity[date] = (downloadActivity[date] || 0) + 1
    })

    // Login activity over time
    const loginActivity: Record<string, number> = {}
    userActivities.forEach(user => {
      if (user.lastLogin) {
        const date = new Date(user.lastLogin).toISOString().split('T')[0]
        loginActivity[date] = (loginActivity[date] || 0) + 1
      }
    })
    
    // Get all unique dates
    const allDates = new Set([
      ...Object.keys(registrationActivity),
      ...Object.keys(downloadActivity),
      ...Object.keys(loginActivity)
    ])
    
    const chartData = Array.from(allDates)
      .sort()
      .slice(-7) // Last 7 days
      .map(date => ({
        date,
        registrations: registrationActivity[date] || 0,
        downloads: downloadActivity[date] || 0,
        logins: loginActivity[date] || 0
      }))
    
    return chartData
  }

  // User role distribution
  const getUserRoleData = () => {
    if (!data) return []
    
    const roleCounts: Record<string, number> = {}
    data.userActivities.forEach(user => {
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1
    })
    
    return Object.entries(roleCounts).map(([role, count]) => ({
      name: role.charAt(0).toUpperCase() + role.slice(1),
      value: count
    }))
  }

  // File type distribution
  const getFileTypeData = () => {
    const { downloadActivities } = getFilteredData()
    
    const typeCounts: Record<string, number> = {}
    downloadActivities.forEach(download => {
      const type = download.file_type || 'unknown'
      typeCounts[type] = (typeCounts[type] || 0) + 1
    })
    
    // Map MIME types to user-friendly names
    const getFriendlyName = (mimeType: string) => {
      const typeMap: Record<string, string> = {
        'application/pdf': 'PDF',
        'application/msword': 'Word Document',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
        'application/vnd.ms-excel': 'Excel Spreadsheet',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
        'application/vnd.ms-powerpoint': 'PowerPoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
        'text/plain': 'Text File',
        'text/csv': 'CSV File',
        'image/jpeg': 'JPEG Image',
        'image/png': 'PNG Image',
        'image/gif': 'GIF Image',
        'video/mp4': 'MP4 Video',
        'audio/mpeg': 'MP3 Audio',
        'application/zip': 'ZIP Archive',
        'application/x-zip-compressed': 'ZIP Archive',
        'unknown': 'Unknown'
      }
      
      return typeMap[mimeType] || mimeType.split('/')[1]?.toUpperCase() || 'Other'
    }
    
    return Object.entries(typeCounts).map(([type, count]) => ({
      name: getFriendlyName(type),
      value: count
    }))
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayoutClient role="admin">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="flex gap-2">
              <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
          </div>
          
          {/* Stats cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg border">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
          
          {/* Charts skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
              <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
              <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </DashboardLayoutClient>
    )
  }

  const { userActivities, downloadActivities } = getFilteredData()
  const chartData = prepareChartData()
  const userRoleData = getUserRoleData()
  const fileTypeData = getFileTypeData()

  return (
    <DashboardLayoutClient role="admin">
      <div className="space-y-6 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">
              User activity, login tracking, and download analytics
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleExportData} 
              variant="outline" 
              className="flex items-center gap-2"
              disabled={exportingData}
            >
              <Download className="h-4 w-4" />
              {exportingData ? 'Exporting...' : 'Export Data'}
            </Button>
            <Button 
              onClick={handleClearAllLoginData} 
              variant="outline" 
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
              disabled={clearingData}
            >
              <FileText className="h-4 w-4" />
              {clearingData ? 'Clearing...' : 'Clear All Login Data'}
            </Button>
            <Button onClick={refreshData} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Date Range:</label>
                <select 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="border rounded px-3 py-1 text-sm"
                >
                  <option value="1">Last 24 hours</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="0">All time</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">User Filter:</label>
                <Input
                  type="text"
                  placeholder="Search by email or name..."
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{data?.totalUsers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Today</p>
                  <p className="text-2xl font-bold text-gray-900">{data?.activeUsersToday || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Download className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Downloads</p>
                  <p className="text-2xl font-bold text-gray-900">{data?.totalDownloads || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Downloads Today</p>
                  <p className="text-2xl font-bold text-gray-900">{data?.downloadsToday || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Over Time (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="registrations" stroke="#8884d8" strokeWidth={2} name="Registrations" />
                  <Line type="monotone" dataKey="logins" stroke="#ff7300" strokeWidth={2} name="Logins" />
                  <Line type="monotone" dataKey="downloads" stroke="#82ca9d" strokeWidth={2} name="Downloads" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* User Role Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>User Role Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userRoleData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      fontSize={12}
                    >
                      {userRoleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Download Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Download by File Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={fileTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Downloads */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Downloads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {downloadActivities.slice(0, 10).map((download) => (
                  <div key={download.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Download className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{download.resource_name}</p>
                      <p className="text-xs text-gray-600">{download.user_email}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(download.download_timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
                {downloadActivities.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No downloads found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Activity Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Activity ({userActivities.length} users)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-w-full">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">User</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Last Login</th>
                    <th className="text-left p-2">Logins</th>
                    <th className="text-left p-2">Attempts</th>
                    <th className="text-left p-2">Avg Score</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userActivities.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <span className="font-medium">{user.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="p-2 text-gray-600">{user.email}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'educator' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'ctf' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-2 text-gray-600">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                      </td>
                      <td className="p-2 text-gray-600">{user.loginCount}</td>
                      <td className="p-2 text-gray-600">{user.totalAttempts}</td>
                      <td className="p-2 text-gray-600">{user.averageScore}%</td>
                      <td className="p-2">
                        <Button
                          onClick={() => handleClearUserData(user.id, user.email)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 h-7 px-2"
                        >
                          Clear
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {userActivities.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayoutClient>
  )
}
