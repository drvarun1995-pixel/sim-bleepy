'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface DailyUsageData {
  date: string
  stations: Array<{
    slug: string
    count: number
  }>
}

interface RecentAttempt {
  id: string
  startTime: string
  endTime?: string
  duration?: number
  overallBand?: string
  scores?: any
  user: {
    id: string
    email: string
    name: string
  }
  station: {
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

    const checkAdminStatus = async () => {
      if (status === 'loading') return

      if (!session?.user?.email) {
        router.push('/auth/signin')
        return
      }

      try {
        const response = await fetch('/api/admin/check')
        const data = await response.json()
        
        setDebugInfo(data)
        
        if (!data.isAdmin) {
          console.log('Admin check failed:', data)
          router.push('/dashboard')
          return
        }

        console.log('Admin access granted for:', data.email)
        fetchData()
      } catch (error) {
        console.error('Error checking admin status:', error)
        router.push('/dashboard')
      }
    }

    checkAdminStatus()
  }, [mounted, session, status, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch daily usage
      const dailyResponse = await fetch('/api/analytics/daily-usage?days=30')
      if (dailyResponse.ok) {
        const dailyData = await dailyResponse.json()
        setDailyUsage(dailyData.analytics || [])
      }

      // Fetch recent attempts
      const attemptsResponse = await fetch('/api/analytics/recent-attempts?limit=50')
      if (attemptsResponse.ok) {
        const attemptsData = await attemptsResponse.json()
        setRecentAttempts(attemptsData.attempts || [])
      }

      // Fetch newsletter analytics
      const newsletterResponse = await fetch('/api/admin/newsletter-analytics')
      if (newsletterResponse.ok) {
        const newsletterData = await newsletterResponse.json()
        setNewsletterAnalytics(newsletterData)
      }

      // Test database connection
      const dbResponse = await fetch('/api/admin/test-database')
      if (dbResponse.ok) {
        const dbData = await dbResponse.json()
        setDatabaseTest(dbData)
      }

    } catch (error) {
      console.error('Error fetching admin data:', error)
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
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
      </div>
    </div>
  }

  if (!session?.user) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600">Please sign in to access the admin dashboard.</p>
      </div>
    </div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back, {session?.user?.name}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchData}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Refresh Data
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug Information */}
        {debugInfo && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Information</h3>
            <div className="text-xs text-yellow-700">
              <p><strong>Email:</strong> {debugInfo.email}</p>
              <p><strong>Is Admin:</strong> {debugInfo.isAdmin ? 'Yes' : 'No'}</p>
              <p><strong>User ID:</strong> {debugInfo.userId}</p>
              <p><strong>Profile Role:</strong> {debugInfo.profileRole}</p>
            </div>
          </div>
        )}

        {/* Database Test Results */}
        {databaseTest && (
          <div className={`border rounded-lg p-4 mb-6 ${databaseTest.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <h3 className={`text-sm font-medium mb-2 ${databaseTest.success ? 'text-green-800' : 'text-red-800'}`}>
              Database Connection Test
            </h3>
            <div className={`text-xs ${databaseTest.success ? 'text-green-700' : 'text-red-700'}`}>
              <p><strong>Users:</strong> {databaseTest.users}</p>
              <p><strong>Stations:</strong> {databaseTest.stations}</p>
              <p><strong>Attempts:</strong> {databaseTest.attempts}</p>
              <p><strong>Profiles:</strong> {databaseTest.profiles}</p>
              {databaseTest.error && <p><strong>Error:</strong> {databaseTest.error}</p>}
            </div>
          </div>
        )}

        {/* Daily Usage Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Usage (Last 30 Days)</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading usage data...</p>
            </div>
          ) : dailyUsage.length > 0 ? (
            <div className="space-y-2">
              {dailyUsage.slice(0, 10).map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">{day.date}</span>
                  <div className="flex space-x-4">
                    {day.stations.map((station, stationIndex) => (
                      <span key={stationIndex} className="text-sm text-gray-600">
                        {station.slug}: {station.count}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No usage data available</p>
          )}
        </div>

        {/* Recent Attempts */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Attempts</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading attempts...</p>
            </div>
          ) : recentAttempts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Station</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentAttempts.slice(0, 10).map((attempt) => (
                    <tr key={attempt.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {attempt.user.name} ({attempt.user.email})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {attempt.station.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {attempt.duration ? formatDuration(attempt.duration) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          attempt.overallBand === 'PASS' 
                            ? 'bg-green-100 text-green-800' 
                            : attempt.overallBand === 'FAIL'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {attempt.overallBand || 'INCOMPLETE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(attempt.startTime)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No attempts found</p>
          )}
        </div>

        {/* Newsletter Analytics */}
        {newsletterAnalytics && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Newsletter Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800">Total Signups</h3>
                <p className="text-2xl font-bold text-blue-900">{newsletterAnalytics.totalSignups}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-800">Sources</h3>
                <p className="text-2xl font-bold text-green-900">{Object.keys(newsletterAnalytics.sourceCounts).length}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-purple-800">Recent Signups</h3>
                <p className="text-2xl font-bold text-purple-900">{newsletterAnalytics.recentSignups.length}</p>
              </div>
            </div>
            
            {newsletterAnalytics.recentSignups.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Signups</h3>
                <div className="space-y-2">
                  {newsletterAnalytics.recentSignups.slice(0, 5).map((signup, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="font-medium">{signup.email}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{signup.source}</span>
                        <span className="text-xs text-gray-500">{formatTime(signup.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
