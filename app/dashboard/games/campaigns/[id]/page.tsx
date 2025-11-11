'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Unlock, CheckCircle2, Star, Play } from 'lucide-react'

interface Section {
  id: string
  title: string
  description: string
  status: 'locked' | 'unlocked' | 'in_progress' | 'completed' | 'mastered'
  question_ids: string[]
  userProgress?: any
}

export default function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSections()
  }, [id])

  const fetchSections = async () => {
    try {
      const response = await fetch(`/api/quiz/campaigns/${id}/sections`)
      if (!response.ok) throw new Error('Failed to fetch sections')
      const data = await response.json()
      setSections(data.sections || [])
    } catch (error) {
      console.error('Error fetching sections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartSection = async (sectionId: string) => {
    try {
      const response = await fetch(`/api/quiz/campaigns/sections/${sectionId}/start`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to start section')
      router.push(`/dashboard/games/campaigns/sections/${sectionId}`)
    } catch (error) {
      console.error('Error starting section:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="text-center py-12">Loading campaign...</div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Campaign Sections</h1>
      </div>

      <div className="space-y-4">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className={`bg-white p-6 rounded-lg shadow ${
              section.status === 'locked' ? 'opacity-60' : 'hover:shadow-lg'
            } transition-shadow`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {section.status === 'locked' && <Lock className="w-5 h-5 text-gray-400" />}
                  {section.status === 'unlocked' && <Unlock className="w-5 h-5 text-green-600" />}
                  {section.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                  {section.status === 'mastered' && <Star className="w-5 h-5 text-yellow-500" />}
                  <h2 className="text-xl font-semibold">{section.title}</h2>
                </div>
                <p className="text-gray-600 mb-2">{section.description}</p>
                <p className="text-sm text-gray-500">
                  {section.question_ids.length} questions
                </p>
              </div>
              <div>
                {section.status === 'locked' ? (
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                  >
                    Locked
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartSection(section.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Play className="w-4 h-4" />
                    {section.status === 'in_progress' ? 'Continue' : 'Start'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


