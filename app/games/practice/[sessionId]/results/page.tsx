'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, RotateCcw, Home } from 'lucide-react'

export default function PracticeResultsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const router = useRouter()
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResults()
  }, [sessionId])

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/quiz/practice/${sessionId}/complete`, {
        method: 'POST',
      })
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />
        <h1 className="text-3xl font-bold">Practice Complete!</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600">{results.score}</div>
          <div className="text-gray-600">Total Points</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{results.correct_count}</div>
            <div className="text-gray-600">Correct</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{results.incorrect_count}</div>
            <div className="text-gray-600">Incorrect</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
          <button
            onClick={() => router.push('/games/practice')}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            <RotateCcw className="w-5 h-5" />
            Practice Again
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

