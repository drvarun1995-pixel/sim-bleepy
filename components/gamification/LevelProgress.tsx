'use client'

import { useEffect, useState } from 'react'
import { Trophy, Star, Zap } from 'lucide-react'

interface LevelData {
  currentLevel: number
  totalXp: number
  xpForNext: number
  progress: number
  title: string
  levelProgress: number
}

export function LevelProgress() {
  const [levelData, setLevelData] = useState<LevelData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLevelData()
  }, [])

  const fetchLevelData = async () => {
    try {
      const response = await fetch('/api/gamification/levels')
      if (response.ok) {
        const data = await response.json()
        setLevelData(data)
      }
    } catch (error) {
      console.error('Error fetching level data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (!levelData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-500 dark:text-gray-400">Unable to load level data</p>
      </div>
    )
  }

  const getLevelIcon = (level: number) => {
    if (level >= 10) return <Trophy className="h-6 w-6 text-yellow-500" />
    if (level >= 7) return <Star className="h-6 w-6 text-blue-500" />
    if (level >= 4) return <Zap className="h-6 w-6 text-green-500" />
    return <Star className="h-6 w-6 text-gray-500" />
  }

  const getLevelColor = (level: number) => {
    if (level >= 10) return 'from-yellow-400 to-yellow-600'
    if (level >= 7) return 'from-blue-400 to-blue-600'
    if (level >= 4) return 'from-green-400 to-green-600'
    return 'from-gray-400 to-gray-600'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getLevelIcon(levelData.currentLevel)}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Level {levelData.currentLevel}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {levelData.title}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {levelData.totalXp.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total XP</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Progress to Level {levelData.currentLevel + 1}</span>
          <span>{levelData.xpForNext} XP to go</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 bg-gradient-to-r ${getLevelColor(levelData.currentLevel)} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${levelData.progress}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {levelData.progress.toFixed(1)}% complete
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {levelData.currentLevel}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Current Level</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {levelData.xpForNext}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">XP to Next</p>
        </div>
      </div>
    </div>
  )
}
