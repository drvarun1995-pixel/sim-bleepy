'use client'

import { useState, useEffect } from 'react'
import { Trophy, Target, TrendingUp, Clock, BarChart3, Award, Zap, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import { BetaNotice } from '@/components/quiz/BetaNotice'

export default function StatsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch user statistics
    // This would call an API endpoint to get aggregated stats
    setTimeout(() => {
      setStats({
        totalPoints: 0,
        accuracy: 0,
        streak: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        averageTime: 0,
        bestCategory: 'N/A',
        rank: 'N/A',
      })
      setLoading(false)
    }, 500)
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
      value: stats?.totalPoints || 0,
      icon: Trophy,
      gradient: 'from-yellow-500 to-orange-500',
      bgGradient: 'from-yellow-50 to-orange-50',
      borderColor: 'border-yellow-200',
    },
    {
      title: 'Accuracy',
      value: `${stats?.accuracy || 0}%`,
      icon: Target,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
    },
    {
      title: 'Current Streak',
      value: stats?.streak || 0,
      icon: Zap,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Questions Answered',
      value: stats?.questionsAnswered || 0,
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
          <p className="text-2xl font-bold text-gray-900">{stats?.bestCategory || 'N/A'}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Global Rank</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.rank || 'N/A'}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-gray-800">Avg Time/Question</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.averageTime || 0}s</p>
        </div>
      </motion.div>
    </div>
  )
}

