'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trophy, Medal, Award, Crown } from 'lucide-react'
import { QUIZ_DIFFICULTIES, getDifficultyDisplayName } from '@/lib/quiz/categories'
import { motion } from 'framer-motion'
import { BetaNotice } from '@/components/quiz/BetaNotice'
import { useQuizCategories } from '@/hooks/useQuizCategories'

interface LeaderboardEntry {
  rank: number
  total_points: number
  correct_answers: number
  total_questions: number
  users?: {
    name: string
    email: string
  }
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) {
    return <Trophy className="w-6 h-6 text-yellow-500" />
  }
  if (rank === 2) {
    return <Medal className="w-6 h-6 text-gray-400" />
  }
  if (rank === 3) {
    return <Award className="w-6 h-6 text-amber-600" />
  }
  return <span className="w-6 h-6 flex items-center justify-center text-gray-500">{rank}</span>
}

export default function LeaderboardsPage() {
  const { categories, loading: categoriesLoading } = useQuizCategories()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [period, setPeriod] = useState('all_time')
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('period', period)
      if (category) params.append('category', category)
      if (difficulty) params.append('difficulty', difficulty)

      const response = await fetch(`/api/quiz/leaderboards?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch leaderboard')
      const data = await response.json()
      setLeaderboard(data.leaderboard || [])
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }, [period, category, difficulty])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  const renderLeaderboardContent = () => {
    if (loading) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leaderboard...</p>
        </motion.div>
      )
    }

    if (leaderboard.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border-2 border-dashed border-yellow-300"
        >
          <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-semibold">No entries found</p>
          <p className="text-gray-500 text-sm mt-2">Be the first to appear on the leaderboard!</p>
        </motion.div>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-yellow-200"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-yellow-50 to-orange-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Correct
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Questions
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Accuracy
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaderboard.map((entry, index) => {
                const accuracy =
                  entry.total_questions > 0
                    ? (entry.correct_answers / entry.total_questions) * 100
                    : 0
                const accuracyClass =
                  accuracy >= 80
                    ? 'bg-green-100 text-green-800'
                    : accuracy >= 60
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                const rankBgClass =
                  entry.rank === 1
                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                    : entry.rank === 2
                    ? 'bg-gradient-to-br from-gray-400 to-gray-600'
                    : entry.rank === 3
                    ? 'bg-gradient-to-br from-amber-500 to-amber-700'
                    : 'bg-gradient-to-br from-blue-400 to-blue-600'
                const rowBgClass =
                  entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50/50 to-orange-50/50' : ''

                return (
                  <motion.tr
                    key={entry.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className={`hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 transition-colors ${rowBgClass}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <RankIcon rank={entry.rank} />
                        {entry.rank > 3 && (
                          <span className="text-gray-600 font-semibold">#{entry.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${rankBgClass}`}
                        >
                          {(entry.users?.name || 'A')[0].toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900">
                          {entry.users?.name || 'Anonymous'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                        {entry.total_points.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                      {entry.correct_answers}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {entry.total_questions}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${accuracyClass}`}>
                        {accuracy.toFixed(1)}%
                      </span>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Beta Notice */}
      <BetaNotice />
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl">
            <Crown className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            Leaderboards
          </h1>
        </div>
        <p className="text-gray-600 text-lg">See how you rank against other medical students</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-white to-yellow-50 p-6 rounded-2xl shadow-lg border-2 border-yellow-200 space-y-4"
      >
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border-2 border-yellow-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white"
            >
              <option value="all_time">All Time</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2 border-2 border-yellow-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="px-4 py-2 border-2 border-yellow-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white"
            >
              <option value="">All Difficulties</option>
              {QUIZ_DIFFICULTIES.map((diff) => (
                <option key={diff} value={diff}>
                  {getDifficultyDisplayName(diff)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {renderLeaderboardContent()}
    </div>
  )
}
