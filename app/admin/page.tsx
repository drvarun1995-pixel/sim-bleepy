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

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dailyUsage, setDailyUsage] = useState<DailyUsageData[]>([])
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([])
  const [newsletterAnalytics, setNewsletterAnalytics] = useState<NewsletterAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if user is admin
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
      setError(null)

      // Fetch daily usage data
      const usageResponse = await fetch('/api/analytics/daily-usage?days=30')
      if (!usageResponse.ok) throw new Error('Failed to fetch daily usage')
      const usageData = await usageResponse.json()
      setDailyUsage(usageData.data)

      // Fetch recent attempts
      const attemptsResponse = await fetch('/api/analytics/recent-attempts?limit=50')
      if (!attemptsResponse.ok) throw new Error('Failed to fetch recent attempts')
      const attemptsData = await attemptsResponse.json()
      setRecentAttempts(attemptsData.data)

      // Fetch newsletter analytics
      const newsletterResponse = await fetch('/api/admin/newsletter-analytics')
      if (newsletterResponse.ok) {
        const newsletterData = await newsletterResponse.json()
        setNewsletterAnalytics(newsletterData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getBandColor = (band?: string) => {
    switch (band?.toLowerCase()) {
      case 'pass':
        return 'bg-green-100 text-green-800'
      case 'fail':
        return 'bg-red-100 text-red-800'
      case 'distinction':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!mounted || status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
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
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
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
              <p><strong>Admin Emails:</strong> {debugInfo.adminEmails?.join(', ')}</p>
            </div>
          </div>
        )}

        {/* Daily Usage Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Usage (Last 30 Days)</h2>
          <div className="space-y-4">
            {dailyUsage.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No usage data available</p>
            ) : (
              dailyUsage.map((day) => (
                <div key={day.date} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-900">
                    {formatDate(day.date)}
                  </div>
                  <div className="flex space-x-4">
                    {day.stations.map((station) => (
                      <div key={station.slug} className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{station.count}</div>
                        <div className="text-sm text-gray-500 capitalize">
                          {station.slug.replace('-', ' ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Newsletter Analytics */}
        {newsletterAnalytics && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Newsletter Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">{newsletterAnalytics.totalSignups}</div>
                <div className="text-sm text-gray-600">Total Subscribers</div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {newsletterAnalytics.analytics.reduce((sum, day) => sum + day.daily_signups, 0)}
                </div>
                <div className="text-sm text-gray-600">Last 30 Days</div>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {Object.keys(newsletterAnalytics.sourceCounts).length}
                </div>
                <div className="text-sm text-gray-600">Sources</div>
              </div>
            </div>
            
            {/* Source Breakdown */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Signups by Source</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(newsletterAnalytics.sourceCounts).map(([source, count]) => (
                  <div key={source} className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-gray-900">{count}</div>
                    <div className="text-sm text-gray-600 capitalize">{source}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Signups */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Signups</h3>
              <div className="space-y-2">
                {newsletterAnalytics.recentSignups.slice(0, 5).map((signup, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{signup.email}</div>
                      <div className="text-sm text-gray-500 capitalize">{signup.source}</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTime(signup.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Attempts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Attempts</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Station
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Band
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No attempts found
                    </td>
                  </tr>
                ) : (
                  recentAttempts.map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(attempt.startTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {attempt.station.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{attempt.user.name}</div>
                          <div className="text-gray-500">{attempt.user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {attempt.duration ? `${Math.round(attempt.duration / 60)}m` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attempt.overallBand ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBandColor(attempt.overallBand)}`}>
                            {attempt.overallBand}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
