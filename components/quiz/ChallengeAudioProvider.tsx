'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode, useCallback } from 'react'
import { challengeMusicTracks, ChallengeMusicTrack, findMusicTrack } from '@/lib/quiz/musicTracks'
import { toast } from 'sonner'

type ChallengeMusicContextValue = {
  currentTrackId: string | null
  activeTrack: ChallengeMusicTrack | null
  availableTracks: ChallengeMusicTrack[]
  playbackEnabled: boolean
  setPlaybackEnabled: (enabled: boolean) => void
  togglePlayback: () => void
  volume: number
  setVolume: (volume: number) => void
  syncTrackFromServer: (trackId: string | null) => void
}

const ChallengeMusicContext = createContext<ChallengeMusicContextValue | null>(null)

const ENABLED_STORAGE_KEY = 'challengeMusicEnabled'
const VOLUME_STORAGE_KEY = 'challengeMusicVolume'

interface ChallengeAudioProviderProps {
  challengeCode: string
  children: ReactNode
}

export function ChallengeAudioProvider({ challengeCode, children }: ChallengeAudioProviderProps) {
  const [trackId, setTrackId] = useState<string | null>(null)
  const [playbackEnabled, setPlaybackEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(ENABLED_STORAGE_KEY) === 'true'
  })
  const [volume, setVolumeState] = useState<number>(() => {
    if (typeof window === 'undefined') return 0.5
    const stored = Number(localStorage.getItem(VOLUME_STORAGE_KEY))
    return Number.isFinite(stored) ? Math.min(Math.max(stored, 0), 1) : 0.5
  })

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const pendingPlayRef = useRef(false)

  useEffect(() => {
    const audio = new Audio()
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = volume
    audioRef.current = audio

    return () => {
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [])

  const attemptPlay = useCallback(async () => {
    if (!audioRef.current || !playbackEnabled) {
      return
    }
    try {
      pendingPlayRef.current = true
      await audioRef.current.play()
    } catch (error) {
      console.warn('[ChallengeAudioProvider] Autoplay blocked', error)
      toast.info('Enable music to hear the lobby soundtrack', {
        description: 'Click the music button to allow playback.',
      })
    } finally {
      pendingPlayRef.current = false
    }
  }, [playbackEnabled])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = volume
    localStorage.setItem(VOLUME_STORAGE_KEY, String(volume))
  }, [volume])

  useEffect(() => {
    localStorage.setItem(ENABLED_STORAGE_KEY, playbackEnabled ? 'true' : 'false')
    if (!playbackEnabled && audioRef.current) {
      audioRef.current.pause()
    } else if (playbackEnabled && trackId) {
      attemptPlay()
    }
  }, [playbackEnabled, trackId, attemptPlay])

  const syncTrackFromServer = useCallback(
    (nextTrackId: string | null) => {
      if (trackId === nextTrackId) {
        return
      }
      setTrackId(nextTrackId)
      if (!audioRef.current) return

      const nextTrack = findMusicTrack(nextTrackId)
      if (!nextTrack) {
        audioRef.current.pause()
        audioRef.current.src = ''
        return
      }

      audioRef.current.src = nextTrack.file
      if (playbackEnabled && !pendingPlayRef.current) {
        attemptPlay()
      }
    },
    [attemptPlay, playbackEnabled, trackId]
  )

  const togglePlayback = useCallback(() => {
    setPlaybackEnabledState((prev) => !prev)
  }, [])

  const setVolume = useCallback((value: number) => {
    const clamped = Math.min(Math.max(value, 0), 1)
    setVolumeState(clamped)
  }, [])

  const activeTrack = useMemo(() => findMusicTrack(trackId), [trackId])

  const value = useMemo<ChallengeMusicContextValue>(
    () => ({
      currentTrackId: trackId,
      activeTrack,
      availableTracks: challengeMusicTracks,
      playbackEnabled,
      setPlaybackEnabled: setPlaybackEnabledState,
      togglePlayback,
      volume,
      setVolume,
      syncTrackFromServer,
    }),
    [activeTrack, playbackEnabled, setVolume, syncTrackFromServer, togglePlayback, trackId, volume]
  )

  return <ChallengeMusicContext.Provider value={value}>{children}</ChallengeMusicContext.Provider>
}

export const useChallengeMusic = (): ChallengeMusicContextValue => {
  const ctx = useContext(ChallengeMusicContext)
  if (!ctx) {
    throw new Error('useChallengeMusic must be used within ChallengeAudioProvider')
  }
  return ctx
}

