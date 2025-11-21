'use client'

import { useMemo } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { Music2, Volume2, VolumeX } from 'lucide-react'
import { usePracticeMusic } from '@/components/quiz/PracticeAudioProvider'

interface PracticeMusicControlsProps {
  className?: string
}

export function PracticeMusicControls({ className }: PracticeMusicControlsProps) {
  const { playbackEnabled, togglePlayback, volume, setVolume, activeTrack } = usePracticeMusic()
  const isMobile = useIsMobile()

  const trackLabel = useMemo(() => {
    if (!activeTrack) {
      return 'Music Off'
    }
    return `${activeTrack.title}`
  }, [activeTrack])

  return (
    <div
      className={`flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-4 py-2 shadow-sm ${className ?? ''}`}
    >
      <Music2 className="w-4 h-4 text-indigo-600" />
      <div className="text-sm text-slate-700 max-w-[140px] truncate">{trackLabel}</div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={togglePlayback}
          className={`rounded-full p-2 transition ${
            playbackEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
          }`}
          aria-label={playbackEnabled ? 'Mute music' : 'Enable music'}
        >
          {playbackEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
        {isMobile && (
          <span className="text-xs text-slate-500">
            Adjust device volume for loudness
          </span>
        )}
      </div>
      {!isMobile && (
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          className="h-2 w-24 cursor-pointer accent-indigo-600"
          aria-label="Music volume"
        />
      )}
    </div>
  )
}

