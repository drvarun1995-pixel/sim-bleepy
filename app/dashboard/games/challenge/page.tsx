'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, QrCode, ArrowRight } from 'lucide-react'

export default function ChallengePage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/quiz/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_count: 10,
        }),
      })
      if (!response.ok) throw new Error('Failed to create challenge')
      const data = await response.json()
      router.push(`/dashboard/games/challenge/${data.challenge.code}`)
    } catch (error) {
      console.error('Error creating challenge:', error)
      alert('Failed to create challenge')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = () => {
    if (code.length === 6) {
      router.push(`/dashboard/games/challenge/${code}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold mb-2">Challenge Mode</h1>
        <p className="text-gray-600">Compete with friends in real-time challenges</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Challenge */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Create Challenge</h2>
          <p className="text-gray-600 mb-4">
            Create a new challenge and invite others to join
          </p>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            {loading ? 'Creating...' : 'Create Challenge'}
          </button>
        </div>

        {/* Join Challenge */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Join Challenge</h2>
          <p className="text-gray-600 mb-4">
            Enter a 6-digit code to join an existing challenge
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter code"
              className="flex-1 px-4 py-2 border rounded-lg text-center text-2xl font-mono"
              maxLength={6}
            />
            <button
              onClick={handleJoin}
              disabled={code.length !== 6}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


