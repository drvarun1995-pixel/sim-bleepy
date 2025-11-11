'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, BookOpen, Target, Award, Clock, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function GameAnalyticsPage() {
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalSessions: 0,
    totalUsers: 0,
    averageScore: 0,
    completionRate: 0,
    averageTime: 0,
  })
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    // Fetch analytics data from API
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/quiz/analytics')
        if (!response.ok) throw new Error('Failed to fetch analytics')
        const data = await response.json()
        setStats(data.stats || {
          totalQuestions: 0,
          totalSessions: 0,
          totalUsers: 0,
          averageScore: 0,
          completionRate: 0,
          averageTime: 0,
        })
      } catch (error) {
        console.error('Error fetching analytics:', error)
        // Keep default values on error
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  const handleClearAnalytics = async () => {
    const confirmed = confirm(
      '⚠️ WARNING: This will permanently delete ALL analytics data!\n\n' +
      'This includes:\n' +
      '• All practice sessions and answers\n' +
      '• All challenges, participants, and answers\n' +
      '• All leaderboards\n' +
      '• All user progress\n\n' +
      'Questions, categories, and campaigns will be preserved.\n\n' +
      'This action CANNOT be undone. Are you sure you want to proceed?'
    )

    if (!confirmed) {
      return
    }

    // Double confirmation
    const doubleConfirmed = confirm(
      'This is your final confirmation. All analytics data will be permanently deleted.\n\n' +
      'Click OK to proceed, or Cancel to abort.'
    )

    if (!doubleConfirmed) {
      return
    }

    setClearing(true)
    try {
      const response = await fetch('/api/quiz/analytics', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to clear analytics')
      }

      // Check if it was a partial success
      if (data.partialSuccess) {
        toast.warning('Analytics partially cleared', {
          description: data.error || 'Some data could not be cleared. Check the console for details.',
          duration: 7000,
        })
        console.error('Partial success details:', data.details)
      } else {
        toast.success('Analytics cleared successfully', {
          description: 'All analytics data has been deleted. Questions, categories, and campaigns have been preserved.',
          duration: 5000,
        })
      }

      // Refresh analytics (will show zeros or updated stats)
      setLoading(true)
      try {
        const fetchResponse = await fetch('/api/quiz/analytics')
        if (fetchResponse.ok) {
          const fetchData = await fetchResponse.json()
          setStats(fetchData.stats || {
            totalQuestions: 0,
            totalSessions: 0,
            totalUsers: 0,
            averageScore: 0,
            completionRate: 0,
            averageTime: 0,
          })
        }
      } catch (fetchError) {
        console.error('Error refreshing analytics:', fetchError)
      } finally {
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Error clearing analytics:', error)
      toast.error('Failed to clear analytics', {
        description: error.message || 'An error occurred while clearing analytics data.',
        duration: 5000,
      })
    } finally {
      setClearing(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Questions',
      value: stats.totalQuestions.toLocaleString(),
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Practice Sessions',
      value: stats.totalSessions.toLocaleString(),
      icon: Clock,
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100',
      borderColor: 'border-green-200',
    },
    {
      title: 'Active Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
    },
    {
      title: 'Average Score',
      value: `${stats.averageScore}%`,
      icon: Target,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'from-orange-50 to-orange-100',
      borderColor: 'border-orange-200',
    },
    {
      title: 'Completion Rate',
      value: `${stats.completionRate}%`,
      icon: CheckCircle2,
      color: 'from-teal-500 to-teal-600',
      bgColor: 'from-teal-50 to-teal-100',
      borderColor: 'border-teal-200',
    },
    {
      title: 'Avg Time/Question',
      value: `${stats.averageTime}s`,
      icon: TrendingUp,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'from-pink-50 to-pink-100',
      borderColor: 'border-pink-200',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Game Analytics
          </h1>
          <p className="text-gray-600 mt-2">Track performance and engagement metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <BarChart3 className="w-5 h-5" />
            <span>Last updated: Just now</span>
          </div>
          <button
            onClick={handleClearAnalytics}
            disabled={clearing}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors font-semibold shadow-sm"
          >
            {clearing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Clearing...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Clear Analytics</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Warning Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-yellow-800">Analytics Data</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Clearing analytics will permanently delete all sessions, answers, leaderboards, and user progress. 
              Questions, categories, and campaigns will be preserved.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.05 }}
            className={`bg-gradient-to-br ${stat.bgColor} p-6 rounded-xl border ${stat.borderColor} shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid md:grid-cols-2 gap-6"
      >
        {/* Performance Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Performance Trends
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Chart visualization coming soon</p>
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            Category Distribution
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Chart visualization coming soon</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

