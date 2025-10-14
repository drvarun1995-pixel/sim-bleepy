'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'

interface DailyUsageData {
  date: string
  stations: Array<{
    slug: string
    count: number
  }>
}

interface RecentAttempt {
  id: string
  start_time: string
  end_time?: string
  duration?: number
  overall_band?: string
  station_slug?: string
  scores?: any
  user?: {
    id: string
    email: string
    name: string
  }
  station?: {
    slug: string
    title: string
  }
}

interface NewsletterAnalytics {
  analytics: Array<{
    signup_date: string
    daily_signups: number
    unique_emails: number
    source: string
    weekly_signups: number
    monthly_signups: number
  }>
  totalSignups: number
  sourceCounts: Record<string, number>
  recentSignups: Array<{
    email: string
    source: string
    created_at: string
  }>
}

interface DatabaseTestResult {
  users: number
  stations: number
  attempts: number
  profiles: number
  success: boolean
  error?: string
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [dailyUsage, setDailyUsage] = useState<DailyUsageData[]>([])
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([])
  const [newsletterAnalytics, setNewsletterAnalytics] = useState<NewsletterAnalytics | null>(null)
  const [databaseTest, setDatabaseTest] = useState<DatabaseTestResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Check if user is admin before allowing access
    checkAdminAccess()
  }, [mounted, session, status, router])

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
        
        console.log('Admin access granted for:', session?.user?.email)
        
        // Fetch debug info for display
        fetch('/api/admin/check')
          .then(response => response.json())
          .then(data => setDebugInfo(data))
          .catch(error => console.error('Error fetching admin info:', error))
        
        fetchData()
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Failed to check admin access:', error)
      router.push('/dashboard')
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch all data in parallel for better performance
      const [dailyResponse, attemptsResponse, newsletterResponse, dbResponse] = await Promise.all([
        fetch('/api/analytics/daily-usage?days=30'),
        fetch('/api/analytics/recent-attempts?limit=50'),
        fetch('/api/admin/newsletter-analytics'),
        fetch('/api/admin/test-database')
      ])

      // Process daily usage data
      if (dailyResponse.ok) {
        const dailyData = await dailyResponse.json()
        setDailyUsage(dailyData.analytics || [])
      } else {
        console.error('Failed to fetch daily usage data')
        setDailyUsage([])
      }

      // Process recent attempts data
      if (attemptsResponse.ok) {
        const attemptsData = await attemptsResponse.json()
        setRecentAttempts(attemptsData.attempts || [])
      } else {
        console.error('Failed to fetch recent attempts data')
        setRecentAttempts([])
      }

      // Process newsletter analytics
      if (newsletterResponse.ok) {
        const newsletterData = await newsletterResponse.json()
        setNewsletterAnalytics(newsletterData)
      } else {
        console.error('Failed to fetch newsletter analytics')
        setNewsletterAnalytics(null)
      }

      // Process database test
      if (dbResponse.ok) {
        const dbData = await dbResponse.json()
        setDatabaseTest(dbData)
      } else {
        console.error('Failed to test database connection')
        setDatabaseTest(null)
      }

    } catch (error) {
      console.error('Error fetching admin data:', error)
      // Set empty states on error
      setDailyUsage([])
      setRecentAttempts([])
      setNewsletterAnalytics(null)
      setDatabaseTest(null)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  if (status === 'loading' || !mounted) {
    return <DashboardLayoutClient role="admin">
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <p className="ml-4 text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
      </div>
    </DashboardLayoutClient>
  }

  if (!session?.user) {
    return <DashboardLayoutClient role="admin">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">Please sign in to access the admin dashboard.</p>
        </div>
      </div>
    </DashboardLayoutClient>
  }

  return (
    <DashboardLayoutClient role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Welcome back, {session?.user?.name}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchData}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
            >
              Refresh Data
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
        {/* Debug Information */}
        {debugInfo && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Debug Information</h3>
            <div className="text-xs text-yellow-700 dark:text-yellow-300">
              <p><strong>Email:</strong> {debugInfo.email}</p>
              <p><strong>Is Admin:</strong> {debugInfo.isAdmin ? 'Yes' : 'No'}</p>
              <p><strong>User ID:</strong> {debugInfo.userId}</p>
              <p><strong>Profile Role:</strong> {debugInfo.profileRole}</p>
            </div>
          </div>
        )}

        {/* Database Test Results */}
        {databaseTest && (
          <div className={`border rounded-lg p-4 ${databaseTest.success ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'}`}>
            <h3 className={`text-sm font-medium mb-2 ${databaseTest.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
              Database Connection Test
            </h3>
            <div className={`text-xs ${databaseTest.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              <p><strong>Users:</strong> {databaseTest.users}</p>
              <p><strong>Stations:</strong> {databaseTest.stations}</p>
              <p><strong>Attempts:</strong> {databaseTest.attempts}</p>
              <p><strong>Profiles:</strong> {databaseTest.profiles}</p>
              {databaseTest.error && <p><strong>Error:</strong> {databaseTest.error}</p>}
            </div>
          </div>
        )}

        {/* Daily Usage Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Daily Usage (Last 30 Days)</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading usage data...</p>
            </div>
          ) : dailyUsage.length > 0 ? (
            <div className="space-y-2">
              {dailyUsage.slice(0, 10).map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="font-medium text-gray-900 dark:text-white">{day.date}</span>
                  <div className="flex space-x-4">
                    {day.stations.map((station, stationIndex) => (
                      <span key={stationIndex} className="text-sm text-gray-600 dark:text-gray-400">
                        {station.slug}: {station.count}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No usage data available</p>
          )}
        </div>

        {/* Recent Attempts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Attempts</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading attempts...</p>
            </div>
          ) : recentAttempts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Station</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {recentAttempts.slice(0, 10).map((attempt) => (
                    <tr key={attempt.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {attempt.user?.name || 'Unknown User'} ({attempt.user?.email || 'No email'})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {attempt.station?.title || attempt.station_slug || 'Unknown Station'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {attempt.duration ? formatDuration(attempt.duration) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          attempt.overall_band === 'PASS' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : attempt.overall_band === 'FAIL'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {attempt.overall_band || 'INCOMPLETE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(attempt.start_time)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No attempts found</p>
          )}
        </div>

        {/* Newsletter Analytics */}
        {newsletterAnalytics && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Newsletter Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Signups</h3>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{newsletterAnalytics.totalSignups}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Sources</h3>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{Object.keys(newsletterAnalytics.sourceCounts).length}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200">Recent Signups</h3>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{newsletterAnalytics.recentSignups.length}</p>
              </div>
            </div>
            
            {newsletterAnalytics.recentSignups.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Recent Signups</h3>
                <div className="space-y-2">
                  {newsletterAnalytics.recentSignups.slice(0, 5).map((signup, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="font-medium text-gray-900 dark:text-white">{signup.email}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{signup.source}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(signup.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayoutClient>
  )
}
