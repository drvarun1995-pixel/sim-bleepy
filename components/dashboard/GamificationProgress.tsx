'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Trophy, Star, Zap, Target, Award, TrendingUp } from 'lucide-react'

interface GamificationData {
  level: {
    current_level: number
    total_xp: number
    level_progress: number
    title: string
  }
  achievements: number
  streak: {
    current_streak: number
    longest_streak: number
  }
  recentXP: Array<{
    xp_amount: number
    transaction_type: string
    description: string
    created_at: string
  }>
}

export function GamificationProgress() {
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGamificationData = async () => {
      try {
        const response = await fetch('/api/user/gamification')
        if (response.ok) {
          const data = await response.json()
          console.log('Gamification API response:', data) // Debug log
          setGamificationData(data.gamification || data)
        }
      } catch (error) {
        console.error('Error fetching gamification data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGamificationData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!gamificationData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Start Your Journey
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Complete your first clinical scenario to begin earning XP and leveling up!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { level, achievements, streak, recentXP } = gamificationData
  
  // Add null checks and fallback values
  const safeLevel = level || { 
    current_level: 1, 
    total_xp: 0, 
    level_progress: 0, 
    title: 'Medical Student' 
  }
  const safeAchievements = achievements || 0
  const safeStreak = streak || { current_streak: 0, longest_streak: 0 }
  const safeRecentXP = recentXP || []
  
  const xpToNextLevel = 100 - (safeLevel.level_progress * 100)

  return (
    <div className="space-y-6">
      {/* Level and XP Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Level {safeLevel.current_level}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {safeLevel.title}
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {safeLevel.total_xp} XP
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to Level {safeLevel.current_level + 1}</span>
              <span>{Math.round(safeLevel.level_progress * 100)}%</span>
            </div>
            <Progress value={safeLevel.level_progress * 100} className="h-2" />
            <p className="text-xs text-gray-500">
              {xpToNextLevel} XP needed for next level
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Achievements</p>
                <p className="text-2xl font-bold">{safeAchievements}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Streak</p>
                <p className="text-2xl font-bold">{safeStreak.current_streak} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Best Streak</p>
                <p className="text-2xl font-bold">{safeStreak.longest_streak} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent XP Activity */}
      {safeRecentXP.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {safeRecentXP.slice(0, 5).map((xp, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium">{xp.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(xp.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    +{xp.xp_amount} XP
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
