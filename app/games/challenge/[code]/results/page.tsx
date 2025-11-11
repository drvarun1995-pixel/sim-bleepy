'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Medal, Award, RotateCcw, Home } from 'lucide-react'

export default function ChallengeResultsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const router = useRouter()
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResults()
  }, [code])

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/quiz/challenges/${code}/results`)
      if (!response.ok) throw new Error('Failed to fetch results')
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Error fetching results:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">Loading results...</div>
    )
  }

  if (!results) {
    return (
      <div className="text-center py-12">No results found</div>
    )
  }

  const { participants } = results
  const sortedParticipants = [...participants].sort((a: any, b: any) => b.final_score - a.final_score)

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-8 h-8 text-yellow-500" />
    if (rank === 2) return <Medal className="w-8 h-8 text-gray-400" />
    if (rank === 3) return <Award className="w-8 h-8 text-amber-600" />
    return <span className="text-lg font-bold text-gray-500">#{rank}</span>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />
        <h1 className="text-3xl font-bold">Challenge Complete!</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
        <h2 className="text-2xl font-semibold">Final Rankings</h2>
        <div className="space-y-4">
          {sortedParticipants.map((participant: any, index: number) => {
            const rank = index + 1
            return (
              <div
                key={participant.id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  rank === 1 ? 'bg-yellow-50 border-2 border-yellow-500' :
                  rank === 2 ? 'bg-gray-50 border-2 border-gray-400' :
                  rank === 3 ? 'bg-amber-50 border-2 border-amber-600' :
                  'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  {getRankIcon(rank)}
                  <div>
                    <div className="font-semibold">
                      {participant.users?.name || 'Anonymous'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {participant.correct_answers}/{participant.questions_answered} correct
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {participant.final_score.toLocaleString()}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
          <button
            onClick={() => router.push('/games/challenge')}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            <RotateCcw className="w-5 h-5" />
            New Challenge
          </button>
          <button
            onClick={() => router.push('/games')}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
          >
            <Home className="w-5 h-5" />
            Back to Games
          </button>
        </div>
      </div>
    </div>
  )
}

