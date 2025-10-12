'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import dynamic from 'next/dynamic'
import { Trophy, Star, TrendingUp, Target } from 'lucide-react'
import { LazyWrapper } from '@/components/LazyWrapper'

// Lazy load heavy components
const LevelProgress = dynamic(() => import('@/components/gamification/LevelProgress').then(mod => ({ default: mod.LevelProgress })), {
  loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
})

const GamificationStats = dynamic(() => import('@/components/gamification/GamificationStats').then(mod => ({ default: mod.GamificationStats })), {
  loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
})

const AchievementGallery = dynamic(() => import('@/components/gamification/AchievementGallery').then(mod => ({ default: mod.AchievementGallery })), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
})

const Leaderboard = dynamic(() => import('@/components/gamification/Leaderboard').then(mod => ({ default: mod.Leaderboard })), {
  loading: () => <div className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>
})

export default function GamificationDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'leaderboard'>('overview')

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return <LoadingScreen message="Loading gamification..." />
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Trophy className="h-8 w-8 mr-3 text-yellow-500" />
              Gamification Hub
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track your progress, earn achievements, and compete with peers
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Star },
              { id: 'achievements', label: 'Achievements', icon: Trophy },
              { id: 'leaderboard', label: 'Leaderboard', icon: TrendingUp }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Level Progress */}
              <LevelProgress />

              {/* Quick Stats Grid */}
              <GamificationStats />

              {/* Recent Achievements */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                  Recent Achievements
                </h3>
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Complete scenarios to earn achievements!</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <AchievementGallery />
          )}

          {activeTab === 'leaderboard' && (
            <Leaderboard />
          )}
        </div>
      </div>
  )
}
