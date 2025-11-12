'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChallengeLobby } from '@/components/quiz/ChallengeLobby'
import { toast } from 'sonner'

export default function ChallengeLobbyPage() {
  const params = useParams()
  const code = params.code as string
  const router = useRouter()
  const [challenge, setChallenge] = useState<any>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const [isHost, setIsHost] = useState(false)
  const [loading, setLoading] = useState(true)
  const joinAttemptedRef = useRef(false)

  const fetchChallenge = useCallback(async () => {
    if (!code || typeof code !== 'string') {
      setLoading(false)
      return
    }

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
      console.log(`[LobbyPage ${code}] Fetched challenge data:`, {
        challengeId: data.challenge?.id,
        status: data.challenge?.status,
        isHost: data.isHost,
        userParticipant: data.userParticipant,
        participantsCount: data.participants?.length || 0,
        participants: data.participants?.map((p: any) => ({ id: p.id, userId: p.user_id, name: p.users?.name }))
      })
      
      // Merge userParticipant into challenge object for easier access
      const challengeWithUserParticipant = {
        ...data.challenge,
        userParticipant: data.userParticipant
      }
      
      setChallenge(challengeWithUserParticipant)
      setIsHost(data.isHost)
      // Store participants for passing to lobby component
      setParticipants(data.participants || [])

      // If challenge is cancelled, redirect with toast
      if (data.challenge.status === 'cancelled') {
        if (!data.isHost) {
          toast.error('Challenge Cancelled', {
            description: 'The host has left the lobby. The challenge has been cancelled.',
            duration: 5000,
          })
        }
        router.push('/games/challenge')
        return
      }

      // If challenge is active, redirect to game
      if (data.challenge.status === 'active') {
        router.push(`/games/challenge/${code}/game`)
        return
      }
    } catch (error) {
      console.error('Error fetching challenge:', error)
    } finally {
      setLoading(false)
    }
  }, [code, router])

  useEffect(() => {
    if (code) {
      fetchChallenge()
    }
  }, [code, fetchChallenge])

  // Auto-join if not already a participant (only if challenge is in lobby)
  useEffect(() => {
    console.log(`[LobbyPage ${code}] Auto-join check:`, {
      hasChallenge: !!challenge,
      userParticipant: challenge?.userParticipant,
      code,
      status: challenge?.status,
      isHost,
      joinAttempted: joinAttemptedRef.current
    })
    
    if (challenge && code && challenge.status === 'lobby' && !isHost && !joinAttemptedRef.current) {
      // Check if user is already a participant
      const isParticipant = challenge.userParticipant !== undefined && challenge.userParticipant !== null
      
      if (!isParticipant) {
        joinAttemptedRef.current = true
        console.log(`[LobbyPage ${code}] ⚡ Auto-joining challenge (non-host, not a participant yet)`)
        
        fetch(`/api/quiz/challenges/${code}/join`, {
          method: 'POST',
        })
          .then((res) => {
            console.log(`[LobbyPage ${code}] Join response status:`, res.status, res.statusText)
            // Handle response - don't throw on 400 if already joined
            if (res.ok) {
              return res.json()
            }
            // If already joined or other expected errors, just return
            return res.json().then((errorData) => {
              console.log(`[LobbyPage ${code}] Join error data:`, errorData)
              // Log but don't show error for expected cases
              if (errorData.alreadyJoined || errorData.error === 'Already joined this challenge') {
                // Expected - user is already a participant
                console.log(`[LobbyPage ${code}] Already joined - this is expected`)
                return { alreadyJoined: true }
              }
              // Other errors - log but continue
              console.warn(`[LobbyPage ${code}] Join challenge warning:`, errorData)
              return null
            })
          })
          .then((joinData) => {
            console.log(`[LobbyPage ${code}] ✅ Join completed:`, joinData)
            // After joining, we should refresh the challenge data to get updated participants
            // But the SSE should handle this, so we'll rely on that
            // However, we can trigger a manual refresh after a short delay to ensure we get the update
            setTimeout(() => {
              console.log(`[LobbyPage ${code}] Refreshing challenge data after join`)
              fetchChallenge()
            }, 500)
          })
          .catch((error) => {
            // Don't show error to user - auto-join failures are expected in some cases
            console.error(`[LobbyPage ${code}] ❌ Auto-join error:`, error)
            joinAttemptedRef.current = false // Reset so we can try again
          })
      } else {
        console.log(`[LobbyPage ${code}] User is already a participant, skipping auto-join`)
      }
    } else {
      if (!challenge) {
        console.log(`[LobbyPage ${code}] No challenge yet, skipping auto-join`)
      } else if (challenge.status !== 'lobby') {
        console.log(`[LobbyPage ${code}] Challenge status is ${challenge.status}, not 'lobby', skipping auto-join`)
      } else if (isHost) {
        console.log(`[LobbyPage ${code}] User is host, skipping auto-join`)
      } else if (joinAttemptedRef.current) {
        console.log(`[LobbyPage ${code}] Join already attempted, skipping`)
      }
    }
  }, [challenge, code, isHost, fetchChallenge])

  if (loading) {
    return (
      <div className="text-center py-12">Loading challenge...</div>
    )
  }

  if (!challenge) {
    return null
  }

  // Pass initial challenge data to lobby to avoid duplicate fetch
  // Use key prop to prevent remounting when state updates
  return <ChallengeLobby key={code} code={code} isHost={isHost} initialChallenge={challenge} initialParticipants={participants} />
}

