'use client'

import { useState, useEffect } from 'react'
import { Trophy, Target, TrendingUp, Clock } from 'lucide-react'

export default function StatsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch user statistics
    // This would call an API endpoint to get aggregated stats
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="text-center py-12">Loading statistics...</div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Your Statistics</h1>
        <p className="text-gray-600">Track your progress and performance</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h2 className="text-lg font-semibold">Total Points</h2>
          </div>
          <div className="text-3xl font-bold">0</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-8 h-8 text-green-500" />
            <h2 className="text-lg font-semibold">Accuracy</h2>
          </div>
          <div className="text-3xl font-bold">0%</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            <h2 className="text-lg font-semibold">Current Streak</h2>
          </div>
          <div className="text-3xl font-bold">0</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-8 h-8 text-purple-500" />
            <h2 className="text-lg font-semibold">Questions Answered</h2>
          </div>
          <div className="text-3xl font-bold">0</div>
        </div>
      </div>
    </div>
  )
}


