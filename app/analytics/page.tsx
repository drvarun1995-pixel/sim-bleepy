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
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
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

// Helper function to format date as dd/mm/yyyy
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

// Helper function to format date with time as dd/mm/yyyy HH:mm
const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('0') // 0 = all time, no filter
  const [userFilter, setUserFilter] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [exportingData, setExportingData] = useState(false)
  const [clearingData, setClearingData] = useState(false)
  const [sortField, setSortField] = useState<string>('lastLogin')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [showClearUserDialog, setShowClearUserDialog] = useState(false)
  const [showClearAllDialog, setShowClearAllDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string } | null>(null)
  const [clearingUserData, setClearingUserData] = useState(false)

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
        
        // Allow admins and meded_team to access this page
        if (role !== 'admin' && role !== 'meded_team') {
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
        fetch('/api/admin/users?limit=1000'), // Increased limit to show more users
        fetch(`/api/downloads/track?limit=500`) // Limit downloads too
      ])

      const usersData = usersResponse.ok ? await usersResponse.json() : { users: [] }
      const downloadsData = downloadsResponse.ok ? await downloadsResponse.json() : { downloads: [] }
      
      console.log('Analytics fetch results:')
      console.log('Users response status:', usersResponse.status)
      console.log('Users data:', usersData)
      console.log('Total users received:', usersData.users?.length || 0)
      console.log('First few users:', usersData.users?.slice(0, 3))
      
      console.log('Downloads response status:', downloadsResponse.status)
      console.log('Downloads data:', downloadsData)
      console.log('Total downloads received:', downloadsData.downloads?.length || 0)
      console.log('First few downloads:', downloadsData.downloads?.slice(0, 3))

      // Calculate metrics
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      const activeUsersToday = usersData.users.filter((user: UserActivity) => {
        // Exclude drvarun1995@gmail.com from active today
        if (user.email?.toLowerCase() === 'drvarun1995@gmail.com') return false
        // Consider users active if they logged in today
        if (!user.lastLogin) return false
        const loginDate = new Date(user.lastLogin)
        return loginDate >= today
      }).length

      const downloadsToday = downloadsData.downloads.filter((download: DownloadActivity) => {
        const downloadDate = new Date(download.download_timestamp)
        const isToday = downloadDate >= today
        console.log(`Download: ${download.resource_name}, Date: ${download.download_timestamp}, DownloadDate: ${downloadDate}, Today: ${today}, IsToday: ${isToday}`)
        return isToday
      }).length
      
      console.log('Total downloads:', downloadsData.downloads.length)
      console.log('Downloads today:', downloadsToday)
      
      // Debug login data
      const usersWithLogins = usersData.users.filter((user: UserActivity) => user.lastLogin)
      console.log('Users with login data:', usersWithLogins.length)
      console.log('Sample login dates:', usersWithLogins.slice(0, 3).map((u: UserActivity) => ({ email: u.email, lastLogin: u.lastLogin })))

      const analyticsData = {
        userActivities: usersData.users || [],
        downloadActivities: downloadsData.downloads || [],
        totalUsers: usersData.users?.length || 0,
        totalDownloads: downloadsData.downloads?.length || 0,
        activeUsersToday,
        downloadsToday
      }
      
      console.log('Setting analytics data:', analyticsData)
      console.log('Download activities count:', analyticsData.downloadActivities.length)
      
      setData(analyticsData)
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

  const handleClearUserClick = (userId: string, userEmail: string) => {
    setSelectedUser({ id: userId, email: userEmail })
    setShowClearUserDialog(true)
  }

  const handleClearUserData = async () => {
    if (!selectedUser) return

    try {
      setClearingUserData(true)
      const response = await fetch('/api/admin/clear-login-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id })
      })

      if (response.ok) {
        setShowClearUserDialog(false)
        setSelectedUser(null)
        fetchAnalytics() // Refresh data
      } else {
        alert('Failed to clear login data')
      }
    } catch (error) {
      console.error('Error clearing login data:', error)
      alert('Error clearing login data')
    } finally {
      setClearingUserData(false)
    }
  }

  const handleClearAllLoginData = async () => {
    try {
      setClearingData(true)
      const response = await fetch('/api/admin/clear-login-data', {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        setShowClearAllDialog(false)
        fetchAnalytics() // Refresh data
        // Show success message
        alert(`Successfully cleared login data for ${result.count} users`)
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

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Filter and sort data based on date range and sorting
  const getFilteredData = () => {
    if (!data) return { userActivities: [], downloadActivities: [] }
    
    const days = parseInt(dateFilter)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    let filteredUsers = data.userActivities
    let filteredDownloads = data.downloadActivities
    
    console.log('Filtering data - Original downloads count:', data.downloadActivities.length)
    console.log('Filtering data - Date filter days:', days)
    console.log('Filtering data - Cutoff date:', cutoffDate)
    
    // Apply date filter
    if (days > 0) {
      filteredUsers = data.userActivities.filter(user => 
        new Date(user.createdAt) >= cutoffDate
      )
      filteredDownloads = data.downloadActivities.filter(download => 
        new Date(download.download_timestamp) >= cutoffDate
      )
    }
    // If days = 0, show all data (no filtering)
    
    // Exclude drvarun1995@gmail.com from the list
    filteredUsers = filteredUsers.filter(user => 
      user.email?.toLowerCase() !== 'drvarun1995@gmail.com'
    )
    
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

    // Apply sorting
    if (sortField && filteredUsers.length > 0) {
      filteredUsers = [...filteredUsers].sort((a, b) => {
        let aValue: any = a[sortField as keyof UserActivity]
        let bValue: any = b[sortField as keyof UserActivity]

        // Handle different data types
        if (sortField === 'createdAt' || sortField === 'lastLogin') {
          // For date fields, use 0 for null values (will sort to bottom when descending)
          // When descending, null values should be at the end
          const aTime = aValue ? new Date(aValue).getTime() : 0
          const bTime = bValue ? new Date(bValue).getTime() : 0
          
          if (sortField === 'lastLogin' && sortDirection === 'desc') {
            // When sorting lastLogin descending, put nulls at the end
            if (!aValue && !bValue) return 0
            if (!aValue) return 1
            if (!bValue) return -1
          }
          
          aValue = aTime
          bValue = bTime
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }
    
    console.log('Filtering data - Filtered downloads count:', filteredDownloads.length)
    console.log('Filtering data - Sample filtered downloads:', filteredDownloads.slice(0, 3))
    
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
    
    // Respect the date filter - if all time (0), show all dates, otherwise show filtered range
    const days = parseInt(dateFilter)
    let filteredDates = Array.from(allDates).sort()
    
    if (days > 0) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0]
      filteredDates = filteredDates.filter(date => date >= cutoffDateStr)
    }
    
    const chartData = filteredDates.map(date => ({
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
      <DashboardLayoutClient role="admin" userName={session?.user?.name || undefined}>
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
    <DashboardLayoutClient role="admin" userName={session?.user?.name || undefined}>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">
              User activity, login tracking, and download analytics
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleExportData} 
              variant="outline" 
              className="flex items-center gap-2 w-full sm:w-auto"
              disabled={exportingData}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{exportingData ? 'Exporting...' : 'Export Data'}</span>
              <span className="sm:hidden">{exportingData ? 'Exporting...' : 'Export'}</span>
            </Button>
            <Button 
              onClick={() => setShowClearAllDialog(true)} 
              variant="outline" 
              className="flex items-center gap-2 text-red-600 hover:text-red-700 w-full sm:w-auto"
              disabled={clearingData}
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">{clearingData ? 'Clearing...' : 'Clear All Login Data'}</span>
              <span className="sm:hidden">{clearingData ? 'Clearing...' : 'Clear All'}</span>
            </Button>
            <Button onClick={refreshData} variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Refresh</span>
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
                  <option value="0">All time</option>
                  <option value="1">Last 24 hours</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
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
              <CardTitle>
              Activity Over Time
              {dateFilter === '0' ? ' (All Time)' :
               dateFilter === '1' ? ' (Last 24 Hours)' :
               dateFilter === '7' ? ' (Last 7 Days)' :
               dateFilter === '30' ? ' (Last 30 Days)' : ' (All Time)'}
            </CardTitle>
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
              <div className="flex items-center justify-between">
                <CardTitle>Recent Downloads</CardTitle>
                <Button onClick={refreshData} variant="outline" size="sm" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </Button>
              </div>
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
                      <p className="text-xs text-gray-600">{download.user_name || download.user_email}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(download.download_timestamp)}
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
                    <th 
                      className="text-left p-2 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        User
                        {sortField === 'name' && (
                          <span className="text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left p-2 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center gap-1">
                        Email
                        {sortField === 'email' && (
                          <span className="text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left p-2 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('role')}
                    >
                      <div className="flex items-center gap-1">
                        Role
                        {sortField === 'role' && (
                          <span className="text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left p-2 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('lastLogin')}
                    >
                      <div className="flex items-center gap-1">
                        Last Login
                        {sortField === 'lastLogin' && (
                          <span className="text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left p-2 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('loginCount')}
                    >
                      <div className="flex items-center gap-1">
                        Logins
                        {sortField === 'loginCount' && (
                          <span className="text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left p-2 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('totalAttempts')}
                    >
                      <div className="flex items-center gap-1">
                        Attempts
                        {sortField === 'totalAttempts' && (
                          <span className="text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left p-2 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('averageScore')}
                    >
                      <div className="flex items-center gap-1">
                        Avg Score
                        {sortField === 'averageScore' && (
                          <span className="text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
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
                        {formatDateTime(user.lastLogin)}
                      </td>
                      <td className="p-2 text-gray-600">{user.loginCount}</td>
                      <td className="p-2 text-gray-600">{user.totalAttempts}</td>
                      <td className="p-2 text-gray-600">{user.averageScore}%</td>
                      <td className="p-2">
                        <Button
                          onClick={() => handleClearUserClick(user.id, user.email)}
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

      {/* Clear User Data Confirmation Dialog */}
      <ConfirmationDialog
        open={showClearUserDialog}
        onOpenChange={setShowClearUserDialog}
        onConfirm={handleClearUserData}
        title="Clear Login Data"
        description={`Are you sure you want to clear login tracking data for ${selectedUser?.email}? This action cannot be undone and will reset their login count and last login timestamp.`}
        confirmText="Clear Data"
        cancelText="Cancel"
        variant="destructive"
        isLoading={clearingUserData}
      />

      {/* Clear All Login Data Confirmation Dialog */}
      <ConfirmationDialog
        open={showClearAllDialog}
        onOpenChange={setShowClearAllDialog}
        onConfirm={handleClearAllLoginData}
        title="Clear All Login Data"
        description="Are you sure you want to clear login tracking data for ALL users? This action cannot be undone and will reset login counts and last login timestamps for all users in the system."
        confirmText="Clear All Data"
        cancelText="Cancel"
        variant="destructive"
        isLoading={clearingData}
      />
    </DashboardLayoutClient>
  )
}
