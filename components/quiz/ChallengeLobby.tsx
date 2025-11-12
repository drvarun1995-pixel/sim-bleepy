'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, Play, Users, Clock, LogOut } from 'lucide-react'
import QRCode from 'qrcode'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { ChallengeSettings } from '@/components/quiz/ChallengeSettings'
import { toast } from 'sonner'

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
}

export function ChallengeLobby({ code, isHost, initialChallenge, initialParticipants }: ChallengeLobbyProps) {
  const router = useRouter()
  const [challenge, setChallenge] = useState<Challenge | null>(initialChallenge || null)
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants || [])
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [countdown, setCountdown] = useState(300) // 5 minutes - will be synced based on challenge.created_at
  const [ready, setReady] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
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
  
  // Update refs when props change
  useEffect(() => {
    codeRef.current = code
    isHostRef.current = isHost
  }, [code, isHost])

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
    }
  }, []) // Only run once on mount - initial data only

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
          setParticipants(data.participants)
        } else if (data.participants === null || data.participants === undefined) {
          // If participants is null/undefined, set to empty array
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
        console.log(`[Lobby ${currentCode}] ✅ SSE connection opened successfully!`, {
          readyState: eventSource.readyState,
          url: eventSource.url
        })
        // SSE will send updates automatically, no need to fetch immediately
        // The parent component already fetched initial data
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
          console.log(`[Lobby ${msgCode}] SSE message received:`, data.type, {
            participantsCount: data.participants?.length || 0,
            challengeStatus: data.challenge?.status,
            participants: data.participants?.map((p: any) => ({ id: p.id, userId: p.user_id, name: p.users?.name }))
          })
          
          if (data.type === 'lobby_update') {
            // IMPORTANT: Update participants FIRST (before checking status)
            // This ensures participants are always up-to-date
            if (!hasRedirectedRef.current) {
              if (data.participants !== undefined) {
                if (Array.isArray(data.participants)) {
                  console.log(`[Lobby ${msgCode}] Updating participants:`, data.participants.length, 'participants')
                  // Always update participants - they change when players join/leave
                  setParticipants(data.participants)
                } else {
                  console.log(`[Lobby ${msgCode}] Participants is not an array, clearing`)
                  // If not an array, set to empty array
                  setParticipants([])
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
    
    // Poll as backup (every 3 seconds) - only if SSE fails
    console.log(`[Lobby ${code}] Setting up polling interval (3s) as backup`)
    pollingIntervalRef.current = setInterval(() => {
      // Use refs to get current values without causing re-renders
      const currentCode = codeRef.current
      const currentIsHost = isHostRef.current
      
      // Only poll if SSE is not connected AND we haven't redirected
      if (!hasRedirectedRef.current && currentCode) {
        const sseState = sseEventSourceRef.current?.readyState
        // Only poll if SSE is closed (not connecting or open)
        if (sseState === EventSource.CLOSED) {
          console.log(`[Lobby ${currentCode}] Polling fallback: SSE closed, fetching lobby data`)
          fetchLobbyData()
        }
      }
    }, 3000) // 3 seconds - polling is just a backup
    
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

  const allReady = participants.length > 0 && participants.every(p => p.status === 'ready')
  const canStart = isHost && (allReady || countdown === 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Exit Button */}
      <div className="relative">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Challenge Lobby</h1>
          <div className="text-4xl font-mono font-bold text-blue-600">{code}</div>
        </div>
        <button
          onClick={handleExit}
          disabled={isLeaving}
          className="absolute top-0 right-0 text-sm text-gray-600 hover:text-gray-800 underline px-3 py-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Exit Lobby</span>
          <span className="sm:hidden">Exit</span>
        </button>
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

      {/* Challenge Settings (Visible to All, Editable by Host Only) */}
      {challenge && (
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
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Players ({participants.length}/8)
        </h2>
        {participants.length === 0 && (
          <p className="text-gray-500 text-center py-4">No participants yet. Waiting for players to join...</p>
        )}
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
                  {participant.users?.name || participant.user_id || 'Unknown'}
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
    </div>
  )
}

