'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, BookOpen, Target, Award, Clock, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

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
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Game Analytics
          </h1>
          <p className="text-gray-600 mt-2">Track performance and engagement metrics</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <BarChart3 className="w-5 h-5" />
          <span>Last updated: Just now</span>
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

