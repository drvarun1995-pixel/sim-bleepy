'use client'

import { Volume2, VolumeX } from 'lucide-react'
import { useVoice } from '@humeai/voice-react'
import { cn } from '@/utils'

export function StationMuteButton({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const { isMuted, mute, unmute } = useVoice()

  return (
    <button
      type="button"
      onClick={() => (isMuted ? unmute() : mute())}
      aria-pressed={isMuted}
      aria-label={isMuted ? 'Patient is muted. Click to unmute.' : 'Patient voice is on. Click to mute.'}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-colors',
        isMuted
          ? 'border-red-700 bg-red-600 text-white hover:bg-red-700'
          : 'border-emerald-700 bg-emerald-50 text-emerald-900 hover:bg-emerald-100',
        className
      )}
    >
      {isMuted ? (
        <VolumeX className="h-4 w-4 shrink-0" />
      ) : (
        <Volume2 className="h-4 w-4 shrink-0" />
      )}
      {compact ? (
        <span>{isMuted ? 'Muted' : 'Voice on'}</span>
      ) : (
        <span className="leading-tight text-left">
          {isMuted ? 'Muted' : 'Voice on'}
          <span className="block text-[11px] font-medium opacity-90">
            {isMuted ? 'Patient cannot be heard · click to unmute' : 'You can hear the patient · click to mute'}
          </span>
        </span>
      )}
    </button>
  )
}
