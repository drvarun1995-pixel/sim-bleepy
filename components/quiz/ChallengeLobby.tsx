'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, Play, Users, Clock } from 'lucide-react'
import QRCode from 'qrcode'

interface Participant {
  id: string
  user_id: string
  status: string
  users?: {
    name: string
    email: string
  }
}

interface Challenge {
  id: string
  code: string
  status: string
  host_id: string
}

interface ChallengeLobbyProps {
  code: string
  isHost: boolean
}

export function ChallengeLobby({ code, isHost }: ChallengeLobbyProps) {
  const router = useRouter()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [countdown, setCountdown] = useState(300) // 5 minutes
  const [ready, setReady] = useState(false)

  useEffect(() => {
    fetchQRCode()
    fetchLobbyData()
    const interval = setInterval(fetchLobbyData, 2000)
    return () => clearInterval(interval)
  }, [code])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => setCountdown(prev => prev - 1), 1000)
      return () => clearInterval(timer)
    }
  }, [countdown])

  const fetchQRCode = async () => {
    try {
      const response = await fetch(`/api/quiz/challenges/${code}/qr-code`)
      if (!response.ok) {
        // Fallback to client-side generation if API fails
        const url = `${window.location.origin}/games/challenge/${code}`
        const qr = await QRCode.toDataURL(url)
        setQrCodeUrl(qr)
        return
      }
      const data = await response.json()
      setQrCodeUrl(data.qrCodeUrl)
    } catch (error) {
      console.error('Error fetching QR code:', error)
      // Fallback to client-side generation
      try {
        const url = `${window.location.origin}/games/challenge/${code}`
        const qr = await QRCode.toDataURL(url)
        setQrCodeUrl(qr)
      } catch (fallbackError) {
        console.error('Error generating QR code fallback:', fallbackError)
      }
    }
  }

  const fetchLobbyData = async () => {
    try {
      const response = await fetch(`/api/quiz/challenges/${code}`)
      if (!response.ok) throw new Error('Failed to fetch challenge')
      const data = await response.json()
      setChallenge(data.challenge)
      setParticipants(data.participants || [])
    } catch (error) {
      console.error('Error fetching lobby data:', error)
    }
  }

  const handleReady = async () => {
    try {
      const response = await fetch(`/api/quiz/challenges/${code}/ready`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to mark ready')
      setReady(true)
    } catch (error) {
      console.error('Error marking ready:', error)
    }
  }

  const handleStart = async () => {
    try {
      const response = await fetch(`/api/quiz/challenges/${code}/start`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to start challenge')
      router.push(`/games/challenge/${code}/game`)
    } catch (error) {
      console.error('Error starting challenge:', error)
    }
  }

  const allReady = participants.length > 0 && participants.every(p => p.status === 'ready')
  const canStart = isHost && (allReady || countdown === 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Challenge Lobby</h1>
        <div className="text-4xl font-mono font-bold text-blue-600">{code}</div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* QR Code */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Share Challenge</h2>
          {qrCodeUrl && (
            <div className="flex justify-center mb-4">
              <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
            </div>
          )}
          <div className="text-center text-sm text-gray-600">
            Share this code or scan the QR code to join
          </div>
        </div>

        {/* Timer */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Countdown
          </h2>
          <div className="text-4xl font-bold text-center">
            {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Players ({participants.length}/8)
        </h2>
        <div className="space-y-2">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                {participant.status === 'ready' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
                <span className="font-medium">
                  {participant.users?.name || 'Unknown'}
                </span>
                {participant.user_id === challenge?.host_id && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Host</span>
                )}
              </div>
              <span className="text-sm text-gray-600">
                {participant.status === 'ready' ? 'Ready' : 'Waiting...'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        {!ready && (
          <button
            onClick={handleReady}
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
          >
            Mark Ready
          </button>
        )}
        {isHost && (
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            <Play className="w-5 h-5" />
            Start Challenge
          </button>
        )}
      </div>
    </div>
  )
}

