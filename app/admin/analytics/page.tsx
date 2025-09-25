'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { BarChart3, TrendingUp, Users, Activity } from 'lucide-react'

interface AnalyticsData {
  dailyUsage: Array<{
    date: string
    stations?: Array<{
      slug: string
      count: number
    }>
  }>
  recentAttempts: Array<{
    id: string
    start_time: string
    end_time?: string
    duration?: number
    overall_band?: string
    station_slug?: string
    user?: {
      id: string
      email: string
      name: string
    }
    station?: {
      slug: string
      title: string
    }
    scores?: any
  }>
  totalUsers: number
  totalAttempts: number
  averageScore: number
}

export default function AdminAnalytics() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user?.email) {
      router.push('/auth/signin')
      return
    }

    // Check admin status
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/admin/check')
        const data = await response.json()
        
        if (!data.isAdmin) {
          router.push('/dashboard')
          return
        }

        fetchAnalytics()
      } catch (error) {
        console.error('Error checking admin status:', error)
        router.push('/dashboard')
      }
    }

    checkAdmin()
  }, [session, status, router])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [dailyResponse, attemptsResponse, usersResponse] = await Promise.all([
        fetch('/api/analytics/daily-usage?days=30'),
        fetch('/api/analytics/recent-attempts?limit=100'),
        fetch('/api/admin/users')
      ])

      // Parse responses
      const dailyData = dailyResponse.ok ? await dailyResponse.json() : { analytics: [] }
      const attemptsData = attemptsResponse.ok ? await attemptsResponse.json() : { attempts: [] }
      const usersData = usersResponse.ok ? await usersResponse.json() : { users: [] }

      // Calculate real metrics
      const totalUsers = usersData.users?.length || 0
      const totalAttempts = attemptsData.attempts?.length || 0
      
      // Calculate average score from recent attempts
      const completedAttempts = attemptsData.attempts?.filter((attempt: any) => 
        attempt.overall_band && attempt.scores
      ) || []
      
      const averageScore = completedAttempts.length > 0 
        ? completedAttempts.reduce((sum: number, attempt: any) => {
            const scores = attempt.scores as any
            return sum + (scores?.overall_pct || 0)
          }, 0) / completedAttempts.length
        : 0

      setAnalytics({
        dailyUsage: dailyData.analytics || [],
        recentAttempts: attemptsData.attempts || [],
        totalUsers,
        totalAttempts,
        averageScore: Math.round(averageScore * 10) / 10
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
      // Set empty data on error
      setAnalytics({
        dailyUsage: [],
        recentAttempts: [],
        totalUsers: 0,
        totalAttempts: 0,
        averageScore: 0
      })
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

  if (status === 'loading') {
    return <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    </AdminLayout>
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Usage statistics and performance metrics
            </p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
          >
            Refresh Data
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : analytics?.totalUsers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Attempts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : analytics?.totalAttempts}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : `${analytics?.averageScore}%`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Usage */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Daily Usage (Last 30 Days)</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading usage data...</p>
            </div>
          ) : analytics?.dailyUsage && analytics.dailyUsage.length > 0 ? (
            <div className="space-y-2">
              {analytics.dailyUsage.slice(0, 10).map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="font-medium text-gray-900 dark:text-white">{day.date}</span>
                  <div className="flex flex-wrap gap-2">
                    {day.stations && day.stations.length > 0 ? (
                      day.stations.map((station, stationIndex) => (
                        <span key={stationIndex} className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-600 px-2 py-1 rounded">
                          {station.slug}: {station.count}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">No activity</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No usage data available</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading activity...</p>
            </div>
          ) : analytics?.recentAttempts && analytics.recentAttempts.length > 0 ? (
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
                  {analytics.recentAttempts.slice(0, 10).map((attempt) => (
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
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent activity found</p>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
