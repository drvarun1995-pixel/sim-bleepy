'use client'

import { useEffect, useState } from 'react'
import { Trophy, Medal, Star, Heart, Users, Clock, Zap, Target } from 'lucide-react'

interface Achievement {
  id: string
  code: string
  name: string
  description: string
  icon: string
  category: string
  xp_reward: number
  badge_color: string
  isEarned: boolean
  earnedAt: string | null
  progress: number
}

interface AchievementStats {
  completed: number
  total: number
  completionRate: number
}

interface AchievementData {
  achievements: Record<string, Achievement[]>
  stats: AchievementStats
}

export function AchievementGallery() {
  const [achievementData, setAchievementData] = useState<AchievementData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    fetchAchievements()
  }, [])

  const fetchAchievements = async () => {
    try {
      const response = await fetch('/api/gamification/achievements')
      if (response.ok) {
        const data = await response.json()
        
        // Transform the API data to match component expectations
        const transformedData = {
          achievements: {
            earned: data.earned || [],
            available: data.available || []
          },
          stats: {
            completed: data.earned?.length || 0,
            total: data.available?.length || 0,
            completionRate: data.available?.length > 0 ? ((data.earned?.length || 0) / data.available.length) * 100 : 0
          }
        }
        
        setAchievementData(transformedData)
      }
    } catch (error) {
      console.error('Error fetching achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'completion':
        return <Target className="h-5 w-5" />
      case 'skill':
        return <Star className="h-5 w-5" />
      case 'social':
        return <Users className="h-5 w-5" />
      case 'special':
        return <Zap className="h-5 w-5" />
      default:
        return <Trophy className="h-5 w-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'completion':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'skill':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'social':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'special':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!achievementData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-500 dark:text-gray-400">Unable to load achievements</p>
      </div>
    )
  }

  const categories = ['all', ...Object.keys(achievementData.achievements)]
  const allAchievements = Object.values(achievementData.achievements).flat()
  const filteredAchievements = selectedCategory === 'all' 
    ? allAchievements 
    : achievementData.achievements[selectedCategory] || []

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
            Achievements
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {achievementData.stats.completed} of {achievementData.stats.total} earned ({achievementData.stats.completionRate}%)
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Overall Progress</span>
          <span>{achievementData.stats.completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="h-2 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full transition-all duration-500"
            style={{ width: `${achievementData.stats.completionRate}%` }}
          ></div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredAchievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
              achievement.isEarned
                ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
            }`}
          >
            {/* Achievement Icon */}
            <div className="text-center mb-3">
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-2xl ${
                  achievement.isEarned
                    ? 'bg-yellow-100 dark:bg-yellow-900/50'
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                {achievement.icon}
              </div>
            </div>

            {/* Achievement Info */}
            <div className="text-center">
              <h4 className={`font-semibold text-sm mb-1 ${
                achievement.isEarned
                  ? 'text-yellow-800 dark:text-yellow-200'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {achievement.name}
              </h4>
              <p className={`text-xs mb-2 ${
                achievement.isEarned
                  ? 'text-yellow-700 dark:text-yellow-300'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {achievement.description}
              </p>

              {/* XP Reward */}
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                achievement.isEarned
                  ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
              }`}>
                <Star className="h-3 w-3 mr-1" />
                {achievement.xp_reward} XP
              </div>

              {/* Category Badge */}
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                getCategoryColor(achievement.category)
              }`}>
                {getCategoryIcon(achievement.category)}
                <span className="ml-1 capitalize">{achievement.category}</span>
              </div>

              {/* Earned Date */}
              {achievement.isEarned && achievement.earnedAt && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                  Earned {new Date(achievement.earnedAt).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Earned Badge */}
            {achievement.isEarned && (
              <div className="absolute top-2 right-2">
                <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Trophy className="h-3 w-3 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-8">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No achievements found</p>
        </div>
      )}
    </div>
  )
}
