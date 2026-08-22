'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Pause, Play, Presentation, Volume2 } from 'lucide-react'
import type { TeachingPreviewKind } from '@/lib/teaching-resources'

const AUDIO_PLAY_EVENT = 'teaching-resource-audio-play'

type TeachingResourcePreviewProps = {
  kind: TeachingPreviewKind
  url?: string | null
  title: string
  className?: string
  compact?: boolean
}

function InlineAudioPreview({
  url,
  title,
  compact,
  className,
}: {
  url: string
  title: string
  compact: boolean
  className: string
}) {
  const playerId = useId()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => setPlaying(false)
    const handlePause = () => setPlaying(false)
    const handlePlay = () => {
      setPlaying(true)
      window.dispatchEvent(new CustomEvent(AUDIO_PLAY_EVENT, { detail: playerId }))
    }
    const handleOtherPlay = (event: Event) => {
      const otherId = (event as CustomEvent<string>).detail
      if (otherId !== playerId) audio.pause()
    }

    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('play', handlePlay)
    window.addEventListener(AUDIO_PLAY_EVENT, handleOtherPlay)
    return () => {
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('play', handlePlay)
      window.removeEventListener(AUDIO_PLAY_EVENT, handleOtherPlay)
    }
  }, [playerId, url])

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      try {
        await audio.play()
      } catch {
        setPlaying(false)
      }
    } else {
      audio.pause()
    }
  }

  if (!compact) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-900 px-4 ${className}`}
      >
        <Volume2 className="h-8 w-8 text-sky-300" />
        <audio src={url} controls className="w-full max-w-md" preload="metadata" />
      </div>
    )
  }

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-900 px-3 ${className}`}
    >
      <audio ref={audioRef} src={url} preload="metadata" />
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          void toggle()
        }}
        aria-label={playing ? `Pause ${title}` : `Play ${title}`}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg transition hover:scale-105 hover:bg-slate-100"
      >
        {playing ? <Pause className="h-6 w-6" /> : <Play className="ml-0.5 h-6 w-6" />}
      </button>
      <span className="text-xs font-medium text-slate-300">
        {playing ? 'Playing preview' : 'Play preview'}
      </span>
    </div>
  )
}

export function TeachingResourcePreview({
  kind,
  url,
  title,
  className = '',
  compact = false,
}: TeachingResourcePreviewProps) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [url])

  if (url && !failed && (kind === 'image' || kind === 'thumbnail')) {
    return (
      <img
        src={url}
        alt={title}
        className={`h-full w-full object-cover ${className}`}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    )
  }

  if (url && !failed && kind === 'video') {
    return (
      <video
        src={url}
        className={`h-full w-full object-cover ${className}`}
        muted
        playsInline
        preload="metadata"
        controls={!compact}
      />
    )
  }

  if (url && !failed && kind === 'audio') {
    return (
      <InlineAudioPreview url={url} title={title} compact={compact} className={className} />
    )
  }

  return (
    <div className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-100 text-slate-500 ${className}`}>
      <Presentation className="h-8 w-8" />
      <span className="text-xs font-medium">Preview after download</span>
    </div>
  )
}
