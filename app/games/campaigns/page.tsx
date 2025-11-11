'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Lock, CheckCircle2, Star, Sparkles, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { BetaNotice } from '@/components/quiz/BetaNotice'

interface Campaign {
  id: string
  title: string
  description: string
  icon_url?: string
}

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/quiz/campaigns')
      if (!response.ok) throw new Error('Failed to fetch campaigns')
      const data = await response.json()
      setCampaigns(data.campaigns || [])
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    )
  }

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
          <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
            <Trophy className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Campaigns
          </h1>
        </div>
        <p className="text-gray-600 text-lg">Progress through structured learning paths and unlock achievements</p>
      </motion.div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200"
        >
          <Star className="w-6 h-6 text-purple-600 mb-2" />
          <p className="font-semibold text-purple-900">Unlock Sections</p>
          <p className="text-sm text-purple-700">Complete to progress</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-xl border border-pink-200"
        >
          <TrendingUp className="w-6 h-6 text-pink-600 mb-2" />
          <p className="font-semibold text-pink-900">Track Progress</p>
          <p className="text-sm text-pink-700">See your mastery</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200"
        >
          <Sparkles className="w-6 h-6 text-orange-600 mb-2" />
          <p className="font-semibold text-orange-900">Master Topics</p>
          <p className="text-sm text-orange-700">Achieve 80%+ accuracy</p>
        </motion.div>
      </div>

      {/* Campaigns Grid */}
      {campaigns.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-dashed border-purple-300"
        >
          <Trophy className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-semibold">No campaigns available yet</p>
          <p className="text-gray-500 text-sm mt-2">Check back soon for new learning paths!</p>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.05, y: -5 }}
              onClick={() => router.push(`/games/campaigns/${campaign.id}`)}
              className="bg-gradient-to-br from-white to-purple-50 p-6 rounded-2xl shadow-lg border-2 border-purple-200 hover:shadow-2xl transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{campaign.title}</h2>
                  <p className="text-gray-600 text-sm leading-relaxed">{campaign.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-purple-600 font-medium mt-4">
                <span>View Campaign</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

