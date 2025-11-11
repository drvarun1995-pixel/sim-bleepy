'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ChallengeLobby } from '@/components/quiz/ChallengeLobby'

export default function ChallengeLobbyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const router = useRouter()
  const [challenge, setChallenge] = useState<any>(null)
  const [isHost, setIsHost] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChallenge()
  }, [code])

  const fetchChallenge = async () => {
    try {
      const response = await fetch(`/api/quiz/challenges/${code}`)
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/games/challenge')
          return
        }
        throw new Error('Failed to fetch challenge')
      }
      const data = await response.json()
      setChallenge(data.challenge)
      setIsHost(data.isHost)

      // If challenge is active, redirect to game
      if (data.challenge.status === 'active') {
        router.push(`/games/challenge/${code}/game`)
      }
    } catch (error) {
      console.error('Error fetching challenge:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-join if not already a participant
  useEffect(() => {
    if (challenge && !challenge.userParticipant) {
      fetch(`/api/quiz/challenges/${code}/join`, {
        method: 'POST',
      }).then(() => fetchChallenge())
    }
  }, [challenge, code])

  if (loading) {
    return (
      <div className="text-center py-12">Loading challenge...</div>
    )
  }

  if (!challenge) {
    return null
  }

  return <ChallengeLobby code={code} isHost={isHost} />
}

