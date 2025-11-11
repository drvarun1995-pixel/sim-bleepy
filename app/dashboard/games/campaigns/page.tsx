'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Lock, CheckCircle2, Star } from 'lucide-react'

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
      <div className="p-4 lg:p-8">
        <div className="text-center py-12">Loading campaigns...</div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Campaigns</h1>
        <p className="text-gray-600">Progress through structured learning paths</p>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No campaigns available yet
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              onClick={() => router.push(`/dashboard/games/campaigns/${campaign.id}`)}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-4">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <h2 className="text-xl font-semibold">{campaign.title}</h2>
              </div>
              <p className="text-gray-600">{campaign.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


