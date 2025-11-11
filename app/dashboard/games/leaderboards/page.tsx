'use client'

import { useState, useEffect } from 'react'
import { Trophy, Medal, Award } from 'lucide-react'
import { QUIZ_CATEGORIES, QUIZ_DIFFICULTIES, getDifficultyDisplayName } from '@/lib/quiz/categories'

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

export default function LeaderboardsPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [period, setPeriod] = useState('all_time')
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [period, category, difficulty])

  const fetchLeaderboard = async () => {
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
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />
    return <span className="w-6 h-6 flex items-center justify-center text-gray-500">{rank}</span>
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Leaderboards</h1>
        <p className="text-gray-600">See how you rank against other medical students</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border rounded-lg"
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
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">All Categories</option>
              {QUIZ_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">All Difficulties</option>
              {QUIZ_DIFFICULTIES.map((diff) => (
                <option key={diff} value={diff}>{getDifficultyDisplayName(diff)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      {loading ? (
        <div className="text-center py-12">Loading leaderboard...</div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No entries found</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Player</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correct</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Questions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaderboard.map((entry) => (
                  <tr key={entry.rank} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getRankIcon(entry.rank)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {entry.users?.name || 'Anonymous'}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      {entry.total_points.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {entry.correct_answers}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {entry.total_questions}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {entry.total_questions > 0
                        ? ((entry.correct_answers / entry.total_questions) * 100).toFixed(1)
                        : '0.0'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}


