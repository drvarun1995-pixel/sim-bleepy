'use client'

import { useEffect, useState } from 'react'
import { Trophy, Medal, Award, Crown, TrendingUp } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  currentLevel: number
  totalXp: number
  isCurrentUser: boolean
}

interface LeaderboardData {
  type: string
  period: {
    start: string
    end: string
  }
  leaderboard: LeaderboardEntry[]
  currentUser: {
    rank: number
    score: number
  }
}

export function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('weekly_xp')

  useEffect(() => {
    fetchLeaderboard()
  }, [selectedType])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/gamification/leaderboard?type=${selectedType}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setLeaderboardData(data)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-orange-500" />
      default:
        return <span className="text-sm font-bold text-gray-500">#{rank}</span>
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600'
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500'
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-orange-600'
      default:
        return 'bg-gray-100 dark:bg-gray-700'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'weekly_xp':
        return 'Weekly XP'
      case 'monthly_xp':
        return 'Monthly XP'
      case 'total_xp':
        return 'All Time XP'
      case 'streak':
        return 'Daily Streak'
      default:
        return type
    }
  }

  const formatScore = (score: number, type: string) => {
    if (type === 'streak') {
      return `${score} days`
    }
    return score.toLocaleString() + ' XP'
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!leaderboardData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-500 dark:text-gray-400">Unable to load leaderboard</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <TrendingUp className="h-6 w-6 mr-2 text-blue-500" />
            Leaderboard
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {getTypeLabel(selectedType)} • {leaderboardData.period?.start || 'All Time'} to {leaderboardData.period?.end || 'Present'}
          </p>
        </div>
      </div>

      {/* Type Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['weekly_xp', 'monthly_xp', 'total_xp', 'streak'].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedType === type
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {getTypeLabel(type)}
          </button>
        ))}
      </div>

      {/* Current User Rank */}
      {leaderboardData.currentUser && leaderboardData.currentUser.rank && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-bold">
                {leaderboardData.currentUser.rank}
              </div>
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">Your Rank</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {formatScore(leaderboardData.currentUser.score, selectedType)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {leaderboardData.currentUser.rank === 1 ? '🥇 First Place!' :
                 leaderboardData.currentUser.rank === 2 ? '🥈 Second Place!' :
                 leaderboardData.currentUser.rank === 3 ? '🥉 Third Place!' :
                 `Rank #${leaderboardData.currentUser.rank}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="space-y-3">
        {leaderboardData.leaderboard.map((entry, index) => (
          <div
            key={entry.userId}
            className={`flex items-center space-x-4 p-3 rounded-lg transition-all duration-200 ${
              entry.isCurrentUser
                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                : index < 3
                ? getRankColor(entry.rank)
                : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {/* Rank */}
            <div className="flex-shrink-0">
              {getRankIcon(entry.rank)}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className={`font-medium truncate ${
                  entry.isCurrentUser
                    ? 'text-blue-900 dark:text-blue-100'
                    : index < 3
                    ? 'text-white'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {entry.name}
                  {entry.isCurrentUser && (
                    <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                      You
                    </span>
                  )}
                </p>
              </div>
              {index < 3 && (
                <p className="text-xs font-semibold text-white drop-shadow-sm">
                  {entry.rank === 1 ? 'Champion' : entry.rank === 2 ? 'Runner-up' : 'Third Place'}
                </p>
              )}
            </div>

            {/* Score */}
            <div className="flex-shrink-0 text-right">
              <p className={`font-bold ${
                entry.isCurrentUser
                  ? 'text-blue-900 dark:text-blue-100'
                  : index < 3
                  ? 'text-white'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {formatScore(entry.totalXp, selectedType)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {leaderboardData.leaderboard.length === 0 && (
        <div className="text-center py-8">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No leaderboard data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Complete some scenarios to see your rank!
          </p>
        </div>
      )}
    </div>
  )
}
