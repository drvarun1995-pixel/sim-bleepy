'use client'

import { useState, useEffect } from 'react'
import { Trophy, Target, TrendingUp, Clock, BarChart3, Award, Zap, BookOpen, Activity, Crown } from 'lucide-react'
import { motion } from 'framer-motion'
import { BetaNotice } from '@/components/quiz/BetaNotice'

interface UserStats {
  totalPoints: number
  accuracy: number
  currentStreak: number
  bestStreak: number
  questionsAnswered: number
  correctAnswers: number
  averageTimeSeconds: number
  practiceSessions: number
  challengeSessions: number
  totalSessions: number
  bestCategory: string | null
  lastActivity: string | null
  leaderboardRank: number | null
  totalXp: number
  levelTitle: string
  hasData: boolean
}

export default function StatsPage() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/games/stats')
        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }
        const data = await response.json()
        setStats(data.stats)
      } catch (err: any) {
        console.error('Error loading stats', err)
        setError(err?.message || 'Unable to load stats right now.')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading statistics...</p>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Points',
      value: stats?.totalPoints ?? 0,
      icon: Trophy,
      gradient: 'from-yellow-500 to-orange-500',
      bgGradient: 'from-yellow-50 to-orange-50',
      borderColor: 'border-yellow-200',
    },
    {
      title: 'Accuracy',
      value: `${stats?.accuracy ?? 0}%`,
      icon: Target,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
    },
    {
      title: 'Current Streak',
      value: stats?.currentStreak ?? 0,
      icon: Zap,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Questions Answered',
      value: stats?.questionsAnswered ?? 0,
      icon: BookOpen,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      borderColor: 'border-purple-200',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Beta Notice */}
      <BetaNotice />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Your Statistics
          </h1>
        </div>
        <p className="text-gray-600 text-lg">Track your progress and performance</p>
      </motion.div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.05, y: -5 }}
            className={`bg-gradient-to-br ${stat.bgGradient} p-6 rounded-2xl shadow-lg border-2 ${stat.borderColor}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{stat.title}</h2>
              <div className={`p-2 bg-gradient-to-br ${stat.gradient} rounded-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className={`text-4xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
              {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Additional Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid md:grid-cols-3 gap-6"
      >
        <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <Award className="w-6 h-6 text-purple-600" />
            <h3 className="font-semibold text-gray-800">Best Category</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats?.bestCategory || 'Play more practice to unlock'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Global Rank</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats?.leaderboardRank
              ? `#${stats.leaderboardRank}`
              : stats?.leaderboardOptIn
              ? 'Play a session to earn your first rank'
              : 'Make your profile public to appear'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-gray-800">Avg Time/Question</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats?.averageTimeSeconds ? `${stats.averageTimeSeconds}s` : '–'}
          </p>
        </div>
      </motion.div>

      {/* Activity Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid md:grid-cols-2 gap-6"
      >
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-6 h-6 text-emerald-600" />
            <h3 className="font-semibold text-gray-800">Session Breakdown</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Practice and challenge sessions that count toward your stats.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50">
              <p className="text-sm text-emerald-700">Practice Sessions</p>
              <p className="text-2xl font-bold text-emerald-900">
                {stats?.practiceSessions ?? 0}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50">
              <p className="text-sm text-blue-700">Challenge Sessions</p>
              <p className="text-2xl font-bold text-blue-900">
                {stats?.challengeSessions ?? 0}
              </p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {stats?.lastActivity
              ? `Last activity: ${new Date(stats.lastActivity).toLocaleString()}`
              : 'Start a practice session to see your progress grow.'}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <Crown className="w-6 h-6 text-amber-500" />
            <h3 className="font-semibold text-gray-800">XP & Leaderboards</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Earn XP by completing practice sessions and collecting achievements. Public profiles
            appear on the leaderboard automatically.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-sm font-medium text-amber-800">Total XP</span>
              <span className="text-xl font-bold text-amber-900">{stats?.totalXp ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-200">
              <span className="text-sm font-medium text-indigo-800">Title</span>
              <span className="text-lg font-semibold text-indigo-900">{stats?.levelTitle}</span>
            </div>
            {stats?.leaderboardRank ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 border border-purple-200">
                <span className="text-sm font-medium text-purple-800">Leaderboard Rank</span>
                <span className="text-lg font-semibold text-purple-900">#{stats.leaderboardRank}</span>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Make your profile public and complete practice sessions to join the leaderboard.
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {!stats?.hasData && !loading && !error && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl">
          No stats yet. Complete a practice session or join a challenge to unlock your personal
          dashboard.
        </div>
      )}
    </div>
  )
}

