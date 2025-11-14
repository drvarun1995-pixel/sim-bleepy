'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, Play, Users, Clock, LogOut, Copy, Share2, Wifi, WifiOff, User, AlertCircle, Loader2, Mail, Sparkles, UserX } from 'lucide-react'
import QRCode from 'qrcode'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { ChallengeSettings } from '@/components/quiz/ChallengeSettings'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { playSound } from '@/lib/quiz/sounds'

interface Participant {
  id: string
  user_id: string
  status: string
  users?: {
    name: string
    profile_picture_url?: string | null
  }
}

interface Challenge {
  id: string
  code: string
  status: string
  host_id: string
  selected_categories?: string[] | null
  selected_difficulties?: string[] | null
  question_count?: number
  time_limit?: number
  created_at?: string // ISO timestamp
}

interface ChallengeLobbyProps {
  code: string
  isHost: boolean
  initialChallenge?: Challenge | null
  initialParticipants?: Participant[]
  currentUserId?: string | null
  currentParticipantId?: string | null
}

export function ChallengeLobby({
  code,
  isHost,
  initialChallenge,
  initialParticipants,
  currentUserId,
  currentParticipantId,
}: ChallengeLobbyProps) {
  const router = useRouter()
  const [challenge, setChallenge] = useState<Challenge | null>(initialChallenge || null)
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants || [])
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [countdown, setCountdown] = useState(300) // 5 minutes - will be synced based on challenge.created_at
  const [ready, setReady] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting')
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [participantUpdateKey, setParticipantUpdateKey] = useState(0) // For animation triggers
  const [participantToRemove, setParticipantToRemove] = useState<Participant | null>(null)
  const [removingParticipant, setRemovingParticipant] = useState(false)
  const previousParticipantsRef = useRef<Participant[]>([])
  const previousReadyCountRef = useRef(0)
  const shareMenuRef = useRef<HTMLDivElement>(null)
  const sseEventSourceRef = useRef<EventSource | null>(null)
  const hasRedirectedRef = useRef(false)
  const qrCodeFetchedRef = useRef(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef = useRef(false)
  const challengeStatusRef = useRef<string | null>(initialChallenge?.status || null)
  const currentCodeRef = useRef<string | null>(null) // Track the current code to detect actual changes
  // Store code and isHost in refs so they're accessible in callbacks without causing re-renders
  const codeRef = useRef(code)
  const isHostRef = useRef(isHost)
  const currentUserIdRef = useRef<string | null>(currentUserId || null)
  const viewerParticipantIdRef = useRef<string | null>(currentParticipantId || null)
  const hasBeenParticipantRef = useRef<boolean>(!!currentParticipantId)
  
  // Helper functions
  const getInitials = (name: string): string => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const getAvatarColor = (userId: string): string => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-yellow-500', 'bg-indigo-500', 'bg-red-500', 'bg-teal-500'
    ]
    // Simple hash function to get consistent color for user
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} Copied!`, {
        description: `The ${label.toLowerCase()} has been copied to your clipboard.`,
        duration: 3000,
      })
    } catch (error) {
      toast.error('Failed to Copy', {
        description: 'Please try again or copy manually.',
        duration: 3000,
      })
    }
  }

  const getWaitingMessage = (): string => {
    const currentCount = participants.length
    const needed = 8 - currentCount
    const readyCount = participants.filter(p => p.status === 'ready').length
    
    if (currentCount === 0) {
      return 'Waiting for players to join...'
    } else if (currentCount < 8) {
      if (needed === 1) {
        return 'Waiting for 1 more player...'
      }
      return `Waiting for ${needed} more players...`
    } else if (readyCount < currentCount) {
      const notReady = currentCount - readyCount
      if (notReady === 1) {
        return 'Waiting for 1 player to be ready...'
      }
      return `Waiting for ${notReady} players to be ready...`
    } else {
      return 'All players ready!'
    }
  }

  const removeParticipantFromState = (participantId: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== participantId))
    previousParticipantsRef.current = previousParticipantsRef.current.filter((p) => p.id !== participantId)
    previousReadyCountRef.current = previousParticipantsRef.current.filter(p => p.status === 'ready').length
  }

  const handleConfirmKick = async () => {
    if (!participantToRemove) return
    setRemovingParticipant(true)
    try {
      const response = await fetch(`/api/quiz/challenges/${code}/participants/${participantToRemove.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'Failed to remove participant')
      }
      removeParticipantFromState(participantToRemove.id)
      toast.success('Participant removed', {
        description: `${participantToRemove.users?.name || 'Player'} has been removed from the lobby.`,
      })
    } catch (error: any) {
      toast.error('Failed to remove participant', {
        description: error?.message || 'Please try again.',
      })
    } finally {
      setRemovingParticipant(false)
      setParticipantToRemove(null)
    }
  }

  const getJoinLink = (): string => {
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/games/challenge/${code}`
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Join my Challenge!')
    const body = encodeURIComponent(`Join my challenge using code: ${code}\n\nOr use this link: ${getJoinLink()}`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
    setShowShareMenu(false)
  }

  // Update refs when props change
  useEffect(() => {
    codeRef.current = code
    isHostRef.current = isHost
  }, [code, isHost])

  useEffect(() => {
    currentUserIdRef.current = currentUserId || null
  }, [currentUserId])

  useEffect(() => {
    if (currentParticipantId) {
      viewerParticipantIdRef.current = currentParticipantId
      hasBeenParticipantRef.current = true
    }
  }, [currentParticipantId])

  // Update challenge status ref when challenge changes
  useEffect(() => {
    if (challenge?.status) {
      challengeStatusRef.current = challenge.status
    }
  }, [challenge?.status])

  // Initialize challenge and participants from props if provided
  useEffect(() => {
    console.log(`[Lobby ${code}] Initializing with:`, {
      hasInitialChallenge: !!initialChallenge,
      hasInitialParticipants: initialParticipants !== undefined,
      participantsCount: initialParticipants?.length || 0,
      participants: initialParticipants?.map((p: any) => ({ id: p.id, userId: p.user_id, name: p.users?.name }))
    })
    
    if (initialChallenge) {
      setChallenge(initialChallenge)
      challengeStatusRef.current = initialChallenge.status || null
    }
    // Always update participants from initial props if provided (even if empty array)
    if (initialParticipants !== undefined) {
      console.log(`[Lobby ${code}] Setting initial participants:`, initialParticipants.length)
      setParticipants(initialParticipants)
      previousParticipantsRef.current = initialParticipants
      previousReadyCountRef.current = initialParticipants.filter(p => p.status === 'ready').length
    }
  }, [code, initialChallenge, initialParticipants]) // Update when props change

  // Detect if viewer gets removed from lobby (kicked)
  useEffect(() => {
    if (isHost || hasRedirectedRef.current) {
      return
    }

    const viewerId = currentUserIdRef.current
    if (!viewerId) {
      return
    }

    const match = participants.find((participant) => participant.user_id === viewerId)

    if (match) {
      if (viewerParticipantIdRef.current !== match.id) {
        viewerParticipantIdRef.current = match.id
      }
      hasBeenParticipantRef.current = true
      return
    }

    if (hasBeenParticipantRef.current && viewerParticipantIdRef.current) {
      hasRedirectedRef.current = true

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }

      if (sseEventSourceRef.current) {
        try {
          sseEventSourceRef.current.close()
        } catch {
          // ignore
        }
        sseEventSourceRef.current = null
      }

      toast.error('Removed from lobby', {
        description: 'The host removed you from this challenge.',
        duration: 5000,
      })

      setTimeout(() => {
        router.push('/games/challenge')
      }, 1500)
    }
  }, [participants, isHost, router, currentUserId])

  // Fetch QR code function - memoized to prevent recreation
  const fetchQRCode = useCallback(async () => {
    // Only fetch QR code once - it doesn't change during the lobby session
    if (qrCodeFetchedRef.current) {
      return // Already fetched
    }

    qrCodeFetchedRef.current = true

    // Use ref to get current code value
    const currentCode = codeRef.current
    if (!currentCode) {
      console.error('No code available for QR code fetch')
      return
    }

    try {
      const response = await fetch(`/api/quiz/challenges/${currentCode}/qr-code`)
      if (!response.ok) {
        // Fallback to client-side generation if API fails
        const url = `${window.location.origin}/games/challenge/${currentCode}`
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
        const url = `${window.location.origin}/games/challenge/${currentCode}`
        const qr = await QRCode.toDataURL(url)
        setQrCodeUrl(qr)
      } catch (fallbackError) {
        console.error('Error generating QR code fallback:', fallbackError)
      }
    }
  }, []) // No dependencies - uses refs

  // Fetch lobby data function - memoized to prevent recreation
  // This is only used for polling backup and after settings updates
  const fetchLobbyData = useCallback(async () => {
    // Don't fetch if already redirected
    if (hasRedirectedRef.current) {
      return
    }

    // Use ref to get current code value
    const currentCode = codeRef.current
    const currentIsHost = isHostRef.current
    if (!currentCode) {
      console.error('No code available for lobby data fetch')
      return
    }

    try {
      const response = await fetch(`/api/quiz/challenges/${currentCode}`)
      if (!response.ok) {
        // If challenge not found or cancelled, redirect
        if (response.status === 404) {
          if (!hasRedirectedRef.current) {
            hasRedirectedRef.current = true
            if (!currentIsHost) {
              toast.error('Challenge Not Found', {
                description: 'The challenge has been cancelled or no longer exists.',
                duration: 5000,
              })
            }
            router.push('/games/challenge')
          }
        }
        return
      }
      
      const data = await response.json()
      
      // Update challenge status ref
      if (data.challenge?.status) {
        challengeStatusRef.current = data.challenge.status
      }
      
      // Check if challenge was cancelled
      if (data.challenge?.status === 'cancelled' && !hasRedirectedRef.current) {
        hasRedirectedRef.current = true
        
        // Clear polling interval
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        
        // Close SSE connection
        if (sseEventSourceRef.current) {
          try {
            sseEventSourceRef.current.close()
          } catch (error) {
            // Ignore close errors
          }
          sseEventSourceRef.current = null
        }
        
        // Show toast and redirect
        if (!currentIsHost) {
          toast.error('Challenge Cancelled', {
            description: 'The host has left the lobby. The challenge has been cancelled.',
            duration: 5000,
          })
        }
        
        setTimeout(() => {
          router.push('/games/challenge')
        }, 1500)
        return
      }
      
      // Check if challenge has started (status changed to 'active')
      if (data.challenge?.status === 'active' && !hasRedirectedRef.current) {
        hasRedirectedRef.current = true
        
        // Clear polling interval
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        
        // Close SSE connection
        if (sseEventSourceRef.current) {
          try {
            sseEventSourceRef.current.close()
          } catch (error) {
            // Ignore close errors
          }
          sseEventSourceRef.current = null
        }
        
        // Immediately redirect to game page (no delay for faster start)
        router.push(`/games/challenge/${currentCode}/game`)
        return
      }
      
      // Check for cancellation FIRST
      if (data.challenge?.status === 'cancelled' && !hasRedirectedRef.current) {
        hasRedirectedRef.current = true
        
        // Update challenge state
        setChallenge(data.challenge)
        challengeStatusRef.current = 'cancelled'
        
        // Clear participants (all removed when host leaves)
        setParticipants([])
        
        // Clear polling interval
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        
        // Close SSE connection
        if (sseEventSourceRef.current) {
          try {
            sseEventSourceRef.current.close()
          } catch (error) {
            // Ignore close errors
          }
          sseEventSourceRef.current = null
        }
        
        // Show toast and redirect
        if (!currentIsHost) {
          toast.error('Challenge Cancelled', {
            description: 'The host has left the lobby. The challenge has been cancelled.',
            duration: 5000,
          })
        }
        
        setTimeout(() => {
          router.push('/games/challenge')
        }, 1500)
        return
      }
      
      // Check if challenge has started
      if (data.challenge?.status === 'active' && !hasRedirectedRef.current) {
        hasRedirectedRef.current = true
        
        // Update challenge state
        setChallenge(data.challenge)
        challengeStatusRef.current = 'active'
        
        // Clear polling interval
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        
        // Close SSE connection
        if (sseEventSourceRef.current) {
          try {
            sseEventSourceRef.current.close()
          } catch (error) {
            // Ignore close errors
          }
          sseEventSourceRef.current = null
        }
        
        // Immediately redirect to game page
        router.push(`/games/challenge/${currentCode}/game`)
        return
      }
      
      // Only update state if not redirected
      if (!hasRedirectedRef.current) {
        // Update challenge state
        setChallenge((prev) => {
          // Update if status changed or if it's a new challenge
          if (!prev || prev.id !== data.challenge.id || prev.status !== data.challenge.status) {
            if (data.challenge.status) {
              challengeStatusRef.current = data.challenge.status
            }
            return data.challenge
          }
          return prev
        })
        
        // ALWAYS update participants if provided (they change frequently)
        if (data.participants && Array.isArray(data.participants)) {
          console.log(`[Lobby ${currentCode}] fetchLobbyData: Updating participants (isHost: ${currentIsHost}):`, data.participants.length, 'participants', data.participants.map((p: any) => ({ id: p.id, userId: p.user_id, name: p.users?.name })))
          console.log(`[Lobby ${currentCode}] fetchLobbyData: Calling setParticipants with ${data.participants.length} participants (isHost: ${currentIsHost})`)
          // Force update by creating a new array reference
          setParticipants([...data.participants])
          setParticipantUpdateKey(prev => prev + 1) // Trigger animation
          console.log(`[Lobby ${currentCode}] fetchLobbyData: Participants state updated (isHost: ${currentIsHost}), new count: ${data.participants.length}`)
        } else if (data.participants === null || data.participants === undefined) {
          // If participants is null/undefined, set to empty array
          console.log(`[Lobby ${currentCode}] fetchLobbyData: Participants is null/undefined, clearing (isHost: ${currentIsHost})`)
          setParticipants([])
        }
      }
    } catch (error) {
      console.error('Error fetching lobby data:', error)
    }
  }, [router]) // No code/isHost dependencies - uses refs

  // Setup SSE function - memoized to prevent recreation
  const setupSSE = useCallback(() => {
    // Use ref to get current code value
    const currentCode = codeRef.current
    const currentIsHost = isHostRef.current
    
    if (!currentCode) {
      console.error('No code available for SSE setup')
      return
    }
    
    console.log(`[Lobby ${currentCode}] setupSSE called`)
    
    // Don't set up SSE if already redirected
    if (hasRedirectedRef.current) {
      console.log(`[Lobby ${currentCode}] Skipping SSE setup - already redirected`)
      return
    }

    // Close existing connection if any
    if (sseEventSourceRef.current) {
      console.log(`[Lobby ${currentCode}] Closing existing SSE connection`)
      try {
        sseEventSourceRef.current.close()
      } catch (error) {
        // Ignore errors when closing
      }
      sseEventSourceRef.current = null
    }

    const sseUrl = `/api/quiz/challenges/${currentCode}/lobby`
    const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${sseUrl}` : sseUrl
    console.log(`[Lobby ${currentCode}] 🌐 Creating EventSource:`, {
      relativeUrl: sseUrl,
      fullUrl: fullUrl,
      currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A'
    })
    
    try {
      const eventSource = new EventSource(sseUrl)
      sseEventSourceRef.current = eventSource
      console.log(`[Lobby ${currentCode}] EventSource object created:`, {
        readyState: eventSource.readyState,
        url: eventSource.url,
        withCredentials: eventSource.withCredentials,
        CONNECTING: EventSource.CONNECTING,
        OPEN: EventSource.OPEN,
        CLOSED: EventSource.CLOSED
      })
      
      // Log when readyState changes
      const checkState = () => {
        console.log(`[Lobby ${currentCode}] EventSource state check:`, {
          readyState: eventSource.readyState,
          state: eventSource.readyState === EventSource.CONNECTING ? 'CONNECTING' : 
                 eventSource.readyState === EventSource.OPEN ? 'OPEN' : 
                 eventSource.readyState === EventSource.CLOSED ? 'CLOSED' : 'UNKNOWN'
        })
      }
      
      // Check state immediately and after a short delay
      checkState()
      setTimeout(checkState, 100)
      setTimeout(checkState, 500)
      setTimeout(checkState, 1000)

      eventSource.onopen = () => {
        console.log(`[Lobby ${currentCode}] ✅ SSE connection opened successfully! (isHost: ${currentIsHost})`, {
          readyState: eventSource.readyState,
          url: eventSource.url
        })
        setConnectionStatus('connected')
        // SSE will send updates automatically, no need to fetch immediately
        // The parent component already fetched initial data
      }

      eventSource.onerror = (error) => {
        console.error(`[Lobby ${currentCode}] ❌ SSE connection error (isHost: ${currentIsHost}):`, error, {
          readyState: eventSource.readyState,
          url: eventSource.url
        })
        setConnectionStatus('disconnected')
      }

      eventSource.onmessage = (event) => {
        // Don't process messages if already redirected
        if (hasRedirectedRef.current) {
          return
        }

        // Get current values from refs
        const msgCode = codeRef.current
        const msgIsHost = isHostRef.current

        try {
          const data = JSON.parse(event.data)
          console.log(`[Lobby ${msgCode}] SSE message received (isHost: ${msgIsHost}):`, data.type, {
            participantsCount: data.participants?.length || 0,
            challengeStatus: data.challenge?.status,
            participants: data.participants?.map((p: any) => ({ id: p.id, userId: p.user_id, name: p.users?.name })),
            rawData: event.data.substring(0, 200) // First 200 chars for debugging
          })
          
          if (data.type === 'lobby_update') {
            // IMPORTANT: Update participants FIRST (before checking status)
            // This ensures participants are always up-to-date
            if (!hasRedirectedRef.current) {
              if (data.participants !== undefined) {
                if (Array.isArray(data.participants)) {
                  console.log(`[Lobby ${msgCode}] SSE: Updating participants (isHost: ${msgIsHost}):`, data.participants.length, 'participants', data.participants.map((p: any) => ({ id: p.id, userId: p.user_id, name: p.users?.name })))
                  
                  // Detect new participants for sound effect
                  const previousCount = previousParticipantsRef.current.length
                  const newCount = data.participants.length
                  if (newCount > previousCount) {
                    console.log(`[Lobby ${msgCode}] SSE: New participant detected! Previous: ${previousCount}, New: ${newCount}`)
                    playSound.playerJoin()
                  }
                  
                  // Always update participants - they change when players join/leave
                  console.log(`[Lobby ${msgCode}] SSE: Calling setParticipants with ${data.participants.length} participants (isHost: ${msgIsHost})`)
                  // Force update by creating a new array reference
                  setParticipants([...data.participants])
                  setParticipantUpdateKey(prev => prev + 1) // Trigger animation
                  previousParticipantsRef.current = data.participants
                  console.log(`[Lobby ${msgCode}] SSE: Participants state updated (isHost: ${msgIsHost}), new count: ${data.participants.length}`)
                } else {
                  console.log(`[Lobby ${msgCode}] Participants is not an array, clearing`)
                  // If not an array, set to empty array
                  setParticipants([])
                  previousParticipantsRef.current = []
                }
              } else {
                console.log(`[Lobby ${msgCode}] Participants is undefined in SSE message`)
              }
            }
            
            // Check for cancellation AFTER updating participants
            if (data.challenge?.status === 'cancelled' && !hasRedirectedRef.current) {
              hasRedirectedRef.current = true
              
              // Update challenge state
              setChallenge(data.challenge)
              challengeStatusRef.current = 'cancelled'
              
              // Ensure participants are cleared
              setParticipants([])
              
              // Clear polling interval
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
                pollingIntervalRef.current = null
              }
              
              // Close SSE connection immediately
              try {
                eventSource.close()
              } catch (error) {
                // Ignore close errors
              }
              sseEventSourceRef.current = null
              
              // Show toast and redirect
              if (!msgIsHost) {
                toast.error('Challenge Cancelled', {
                  description: 'The host has left the lobby. The challenge has been cancelled.',
                  duration: 5000,
                })
              }
              
              // Redirect all users (including host) to challenge page
              setTimeout(() => {
                router.push('/games/challenge')
              }, 1500)
              return
            }
            
            // Check if challenge has started (status changed to 'active')
            if (data.challenge?.status === 'active' && !hasRedirectedRef.current) {
              hasRedirectedRef.current = true
              
              // Update challenge state
              setChallenge(data.challenge)
              challengeStatusRef.current = 'active'
              
              // Clear polling interval
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
                pollingIntervalRef.current = null
              }
              
              // Close SSE connection immediately
              try {
                eventSource.close()
              } catch (error) {
                // Ignore close errors
              }
              sseEventSourceRef.current = null
              
              // Immediately redirect to game page
              router.push(`/games/challenge/${msgCode}/game`)
              return
            }
            
            // Update challenge state (if not cancelled or active)
            if (data.challenge && !hasRedirectedRef.current) {
              // Always update challenge to get latest settings and status
              if (data.challenge.status) {
                challengeStatusRef.current = data.challenge.status
              }
              // Force update by creating a new object reference
              setChallenge({ ...data.challenge })
              console.log(`[Lobby ${msgCode}] Updated challenge state from SSE:`, {
                time_limit: data.challenge.time_limit,
                question_count: data.challenge.question_count,
                selected_categories: data.challenge.selected_categories,
                selected_difficulties: data.challenge.selected_difficulties,
              })
            }
          } else if (data.type === 'ping') {
            // Keep connection alive - do nothing
          } else if (data.error) {
            // Handle error from server
            console.error('SSE error from server:', data.error)
            // Close connection on error
            try {
              eventSource.close()
            } catch (error) {
              // Ignore close errors
            }
            sseEventSourceRef.current = null
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error)
        }
      }

      eventSource.onerror = (error) => {
        const readyStateText = eventSource.readyState === EventSource.CONNECTING ? 'CONNECTING' : 
                               eventSource.readyState === EventSource.OPEN ? 'OPEN' : 
                               eventSource.readyState === EventSource.CLOSED ? 'CLOSED' : 'UNKNOWN'
        
        console.error(`[Lobby ${currentCode}] ❌ SSE connection error:`, {
          error,
          readyState: eventSource.readyState,
          readyStateText,
          url: eventSource.url,
          hasRedirected: hasRedirectedRef.current
        })
        
        // Update connection status
        if (eventSource.readyState === EventSource.CLOSED) {
          setConnectionStatus('disconnected')
        } else if (eventSource.readyState === EventSource.CONNECTING) {
          setConnectionStatus('connecting')
        }
        
        // If connection is closed and we haven't redirected, it might be a server error
        // Check network tab for more details
        if (eventSource.readyState === EventSource.CLOSED && !hasRedirectedRef.current) {
          console.error(`[Lobby ${currentCode}] SSE connection closed unexpectedly. Check network tab for errors.`)
        }
        
        // Don't close on error - EventSource will attempt to reconnect automatically
        // Only close if we're redirecting
        if (hasRedirectedRef.current) {
          try {
            eventSource.close()
          } catch (closeError) {
            // Ignore close errors
          }
          sseEventSourceRef.current = null
          return
        }
      }
    } catch (error) {
      console.error('Error in SSE setup:', error)
    }
  }, [router]) // No code/isHost dependencies - uses refs

  // Initialize once on mount - fetch QR code, set up SSE, and start polling
  // Use empty dependency array to ensure this only runs once on mount
  // The cleanup will only run when the component actually unmounts
  useEffect(() => {
    // Don't initialize if we don't have a code
    if (!code) {
      console.log(`[Lobby] No code, skipping initialization`)
      return
    }
    
    // Early return if already initialized for this code (prevents double initialization)
    if (isInitializedRef.current && currentCodeRef.current === code) {
      console.log(`[Lobby ${code}] Already initialized for this code, skipping`)
      return
    }
    
    // Don't initialize if we've already redirected (but allow re-initialization on remount)
    // hasRedirectedRef is reset in cleanup, so this check is mainly for preventing
    // initialization during an active redirect
    if (hasRedirectedRef.current) {
      console.log(`[Lobby ${code}] Already redirected, skipping initialization`)
      return
    }
    
    console.log(`[Lobby ${code}] 🚀 Initializing SSE and polling for code:`, code)
    currentCodeRef.current = code
    isInitializedRef.current = true

    // Fetch QR code once (it doesn't change) - only for host
    if (isHostRef.current && !qrCodeFetchedRef.current) {
      console.log(`[Lobby ${code}] Fetching QR code (host)`)
      fetchQRCode()
    }
    
    // Set up SSE for real-time updates (primary method)
    console.log(`[Lobby ${code}] 🚀 Setting up SSE connection`)
    setupSSE()
    
    // Poll as backup (every 5 seconds) - only if SSE is not connected
    // This reduces API calls when SSE is working properly
    console.log(`[Lobby ${code}] Setting up polling interval (5s) as backup`)
    pollingIntervalRef.current = setInterval(() => {
      // Use refs to get current values without causing re-renders
      const currentCode = codeRef.current
      const currentIsHost = isHostRef.current
      
      // Only poll if SSE is not connected AND we haven't redirected
      if (!hasRedirectedRef.current && currentCode) {
        const sseState = sseEventSourceRef.current?.readyState
        // Only poll if SSE is closed (not connecting or open)
        if (sseState === EventSource.CLOSED || sseState === undefined) {
          console.log(`[Lobby ${currentCode}] Polling fallback: SSE disconnected, fetching lobby data`)
          fetchLobbyData()
        }
      }
    }, 5000) // 5 seconds - only poll when SSE is disconnected
    
    // Handle page refresh/close for host - cleanup QR code
    const handlePageHide = (e: PageTransitionEvent) => {
      const currentCode = codeRef.current
      const currentIsHost = isHostRef.current
      if (currentIsHost && challengeStatusRef.current === 'lobby') {
        if (navigator.sendBeacon) {
          try {
            const blob = new Blob([], { type: 'text/plain' })
            navigator.sendBeacon(`/api/quiz/challenges/${currentCode}/leave-beacon`, blob)
          } catch (error) {
            console.error('Error sending beacon:', error)
          }
        }
      }
    }
    
    window.addEventListener('pagehide', handlePageHide)
    
    // Cleanup function - ONLY runs on component unmount (not on re-renders)
    return () => {
      const currentCode = codeRef.current
      console.log(`[Lobby ${currentCode}] 🧹 Cleanup: Component unmounting (not re-render)`)
      
      // DON'T set hasRedirectedRef here - it should only be set when we actually redirect
      // Setting it here prevents re-initialization if the component remounts due to parent state updates
      
      // Clear polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      
      // Close SSE connection
      if (sseEventSourceRef.current) {
        try {
          sseEventSourceRef.current.close()
        } catch (error) {
          // Ignore close errors
        }
        sseEventSourceRef.current = null
      }
      
      // Remove event listener
      window.removeEventListener('pagehide', handlePageHide)
      
      // Reset initialization flag for potential remount
      isInitializedRef.current = false
      currentCodeRef.current = null
      // Reset hasRedirectedRef to allow re-initialization on remount
      // (unless we're actually redirecting, in which case it will be set before cleanup)
      hasRedirectedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // EMPTY dependency array - only run once on mount, cleanup only on actual unmount

  // Sync countdown based on challenge creation time
  useEffect(() => {
    if (!challenge?.created_at) {
      return
    }

    const calculateRemainingTime = () => {
      if (!challenge?.created_at) return 300 // Default to 5 minutes if no created_at
      const createdAt = new Date(challenge.created_at).getTime()
      const now = Date.now()
      const elapsedSeconds = Math.floor((now - createdAt) / 1000)
      const remainingSeconds = Math.max(0, 300 - elapsedSeconds) // 5 minutes = 300 seconds
      return remainingSeconds
    }

    // Set initial countdown based on actual elapsed time
    const initialRemaining = calculateRemainingTime()
    setCountdown(initialRemaining)

    // Update countdown every second based on actual elapsed time (not just decrement)
    const timer = setInterval(() => {
      const remaining = calculateRemainingTime()
      setCountdown(remaining)
      
      // Stop timer if countdown reaches 0
      if (remaining <= 0) {
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [challenge?.created_at])

  // Detect when all players are ready and play sound
  useEffect(() => {
    if (participants.length === 0) return
    
    const readyCount = participants.filter(p => p.status === 'ready').length
    const previousReadyCount = previousReadyCountRef.current
    
    // Play sound when all players become ready (and there's at least 2 players)
    if (readyCount === participants.length && participants.length >= 2 && previousReadyCount < readyCount) {
      playSound.allReady()
    }
    
    previousReadyCountRef.current = readyCount
  }, [participants])

  const handleReady = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`/api/quiz/challenges/${code}/ready`, {
        method: 'POST',
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to mark ready')
      }
      setReady(true)
      toast.success('You are now ready!', {
        description: 'Waiting for other players to be ready.',
        duration: 3000,
      })
    } catch (error: any) {
      console.error('Error marking ready:', error)
      setError(error.message || 'Failed to mark ready. Please try again.')
      playSound.error()
      toast.error('Failed to Mark Ready', {
        description: error.message || 'An error occurred. Please try again.',
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showShareMenu && shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false)
      }
    }
    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showShareMenu])

  const handleStart = async () => {
    try {
      setIsLoading(true)
      setError(null)
      playSound.challengeStart()
      const response = await fetch(`/api/quiz/challenges/${code}/start`, {
        method: 'POST',
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to start challenge')
      }
      router.push(`/games/challenge/${code}/game`)
    } catch (error: any) {
      console.error('Error starting challenge:', error)
      setError(error.message || 'Failed to start challenge. Please try again.')
      playSound.error()
      toast.error('Failed to Start Challenge', {
        description: error.message || 'An error occurred while starting the challenge.',
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExit = () => {
    setShowExitDialog(true)
  }

  const handleConfirmExit = async () => {
    setIsLeaving(true)
    
    // Close SSE connection before leaving
    if (sseEventSourceRef.current) {
      sseEventSourceRef.current.close()
    }
    
    try {
      const response = await fetch(`/api/quiz/challenges/${code}/leave`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to leave challenge')
      
      // Redirect based on whether challenge was cancelled (host) or just left (participant)
      const data = await response.json()
      if (data.cancelled) {
        // Host cancelled - show toast and redirect
        toast.success('Challenge Cancelled', {
          description: 'You have cancelled the challenge. All participants have been removed.',
          duration: 5000,
        })
        router.push('/games/challenge')
      } else {
        // Participant left - redirect
        router.push('/games/challenge')
      }
    } catch (error) {
      console.error('Error leaving challenge:', error)
      setIsLeaving(false)
      setShowExitDialog(false)
      toast.error('Failed to leave challenge', {
        description: 'Please try again.',
        duration: 5000,
      })
    }
  }

  const handleCancelExit = () => {
    setShowExitDialog(false)
  }

  const handleReconnect = () => {
    if (sseEventSourceRef.current) {
      try {
        sseEventSourceRef.current.close()
      } catch (error) {
        // Ignore close errors
      }
      sseEventSourceRef.current = null
    }
    setConnectionStatus('connecting')
    setupSSE()
  }

  const allReady = participants.length > 0 && participants.every(p => p.status === 'ready')
  const readyCount = participants.filter(p => p.status === 'ready').length
  const canStart = isHost && (allReady || countdown === 0)
  const countdownPercentage = (countdown / 300) * 100
  const isCountdownLow = countdown <= 30

  // Loading state
  if (!challenge && !initialChallenge) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading challenge lobby...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Connection Status Indicator */}
      <div className="flex items-center justify-end gap-2 text-sm">
        {connectionStatus === 'connected' && (
          <div className="flex items-center gap-2 text-green-600">
            <Wifi className="w-4 h-4" />
            <span>Connected</span>
          </div>
        )}
        {connectionStatus === 'connecting' && (
          <div className="flex items-center gap-2 text-yellow-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Connecting...</span>
          </div>
        )}
        {connectionStatus === 'disconnected' && (
          <button
            onClick={handleReconnect}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 underline"
          >
            <WifiOff className="w-4 h-4" />
            <span>Reconnect</span>
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header with Exit Button */}
      <div className="flex flex-col sm:relative">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Challenge Lobby</h1>
          <div className="inline-block bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl px-6 py-4 shadow-lg">
            <p className="text-xs sm:text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2">Join Code</p>
            <div className="flex items-center justify-center gap-3">
              <div className="text-4xl sm:text-5xl font-mono font-bold text-blue-600 tracking-wider">{code}</div>
              <button
                onClick={() => copyToClipboard(code, 'Join Code')}
                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                title="Copy join code"
              >
                <Copy className="w-5 h-5 text-blue-600" />
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={handleExit}
          disabled={isLeaving}
          className="mt-4 sm:mt-0 sm:absolute sm:top-0 sm:right-0 mx-auto sm:mx-0 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Exit Lobby</span>
          <span className="sm:hidden">Exit</span>
        </button>
      </div>

      <div className={`grid ${isHost ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-6`}>
        {/* QR Code - Only show for host */}
        {isHost && (
          <div className="bg-white p-6 rounded-lg shadow relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Share Challenge</h2>
              <div className="relative" ref={shareMenuRef}>
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Share options"
                >
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
                {showShareMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border-2 border-gray-200 z-10">
                    <button
                      onClick={() => {
                        copyToClipboard(getJoinLink(), 'Join Link')
                        setShowShareMenu(false)
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-sm"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Join Link
                    </button>
                    <button
                      onClick={shareViaEmail}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-sm"
                    >
                      <Mail className="w-4 h-4" />
                      Share via Email
                    </button>
                  </div>
                )}
              </div>
            </div>
            {qrCodeUrl && (
              <div className="flex justify-center mb-4">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              </div>
            )}
            <div className="text-center text-sm text-gray-600">
              Share this code or scan the QR code to join
            </div>
          </div>
        )}

        {/* Timer */}
        <motion.div 
          className="bg-white p-6 rounded-lg shadow"
          animate={isCountdownLow ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 1, repeat: isCountdownLow ? Infinity : 0 }}
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Countdown
          </h2>
          <div className="space-y-4">
            <div className={`text-4xl font-bold text-center transition-colors ${
              isCountdownLow ? 'text-red-600' : countdown <= 60 ? 'text-yellow-600' : 'text-blue-600'
            }`}>
              {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  isCountdownLow ? 'bg-red-500' : countdown <= 60 ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
                initial={{ width: `${countdownPercentage}%` }}
                animate={{ width: `${countdownPercentage}%` }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Challenge Summary Card - Visible to All */}
      {challenge && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Challenge Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Categories</p>
              <p className="text-sm text-gray-900">
                {challenge.selected_categories && challenge.selected_categories.length > 0
                  ? challenge.selected_categories.join(', ')
                  : 'All Categories'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Difficulty</p>
              <p className="text-sm text-gray-900">
                {challenge.selected_difficulties && challenge.selected_difficulties.length > 0
                  ? challenge.selected_difficulties.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')
                  : 'All Difficulties'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Questions</p>
              <p className="text-sm text-gray-900">{challenge.question_count || 10} Questions</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Time Limit</p>
              <p className="text-sm text-gray-900">{challenge.time_limit || 60}s per question</p>
            </div>
          </div>
        </div>
      )}

      {/* Challenge Settings - Only visible to Host */}
      {challenge && isHost && (
        <ChallengeSettings
          code={code}
          isHost={isHost}
          initialSettings={{
            selected_categories: challenge.selected_categories || [],
            selected_difficulties: challenge.selected_difficulties || [],
            question_count: challenge.question_count || 10,
            time_limit: challenge.time_limit || 60,
          }}
          onSettingsSaved={fetchLobbyData}
        />
      )}

      {/* Participants */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Players ({participants.length}/8)
          </h2>
          {/* Ready Status Progress */}
          {participants.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-green-600">{readyCount}</span>
                <span className="text-gray-500">/{participants.length} Ready</span>
              </div>
              {allReady && participants.length >= 2 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  <Sparkles className="w-5 h-5 text-green-600" />
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Waiting Message */}
        {participants.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 text-center font-medium">
              {getWaitingMessage()}
            </p>
          </div>
        )}

        {/* Empty State */}
        {participants.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium mb-2">No participants yet</p>
            <p className="text-sm text-gray-400">{getWaitingMessage()}</p>
          </div>
        )}

        {/* Participants List */}
        <AnimatePresence mode="popLayout">
          <div className="space-y-2" key={participantUpdateKey}>
            {(() => {
              console.log(`[Lobby ${code}] RENDERING participants (isHost: ${isHost}):`, participants.length, 'participants', participants.map((p: any) => ({ id: p.id, userId: p.user_id, name: p.users?.name })))
              return null
            })()}
            {participants.map((participant, index) => {
              const participantName = participant.users?.name || participant.user_id || 'Unknown'
              const isReady = participant.status === 'ready'
              const participantIsHost = participant.user_id === challenge?.host_id
              
              return (
                <motion.div
                  key={participant.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`flex items-center justify-between p-3 border-2 rounded-lg transition-all ${
                    isReady ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    {participant.users?.profile_picture_url ? (
                      <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden border-2 border-gray-200">
                        <img
                          src={participant.users.profile_picture_url}
                          alt={participantName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to initials if image fails to load
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              parent.className = `${getAvatarColor(participant.user_id)} w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`
                              parent.textContent = getInitials(participantName)
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className={`${getAvatarColor(participant.user_id)} w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
                        {getInitials(participantName)}
                      </div>
                    )}
                    
                    {/* Name and Status */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 truncate" title={participantName}>
                          {participantName}
                        </span>
                        {participantIsHost && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded flex-shrink-0">Host</span>
                        )}
                        {isReady && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded flex-shrink-0"
                          >
                            Ready
                          </motion.span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Icon */}
                  <div className="flex-shrink-0 ml-2 flex items-center gap-2">
                    {isReady ? (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                      >
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      </motion.div>
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400" />
                    )}
                    {isHost && !participantIsHost && (
                      <button
                        type="button"
                        onClick={() => setParticipantToRemove(participant)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                        aria-label={`Remove ${participantName}`}
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </AnimatePresence>

        {/* Ready Progress Bar */}
        {participants.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
              <span>Ready Status</span>
              <span>{readyCount}/{participants.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className="bg-green-500 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${participants.length > 0 ? (readyCount / participants.length) * 100 : 0}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        {!ready && (
          <button
            onClick={handleReady}
            disabled={isLoading}
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Mark Ready
              </>
            )}
          </button>
        )}
        {isHost && (
          <button
            onClick={handleStart}
            disabled={!canStart || isLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Challenge
              </>
            )}
          </button>
        )}
      </div>

      {/* Exit Confirmation Dialog */}
      <ConfirmationDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
        title={isHost ? "Cancel Challenge" : "Leave Challenge"}
        description={
          isHost
            ? "Are you sure you want to cancel this challenge? This will end the challenge for all participants and cannot be undone."
            : "Are you sure you want to leave this challenge? You can rejoin using the same code if the challenge is still in the lobby."
        }
        confirmText={isHost ? "Cancel Challenge" : "Leave Challenge"}
        cancelText="Stay in Lobby"
        variant="warning"
        icon={<LogOut className="h-6 w-6 text-orange-500" />}
        isLoading={isLeaving}
      />

      {/* Kick Participant Dialog */}
      <ConfirmationDialog
        open={!!participantToRemove}
        onOpenChange={(open) => {
          if (!open && !removingParticipant) {
            setParticipantToRemove(null)
          }
        }}
        onConfirm={handleConfirmKick}
        onCancel={() => setParticipantToRemove(null)}
        title="Remove participant?"
        description={
          participantToRemove
            ? `Remove ${participantToRemove.users?.name || 'this player'} from the lobby? They can rejoin if they still have the code.`
            : ''
        }
        confirmText={removingParticipant ? 'Removing…' : 'Remove player'}
        cancelText="Keep player"
        variant="destructive"
        icon={<UserX className="h-6 w-6 text-red-500" />}
        isLoading={removingParticipant}
      />
    </div>
  )
}

