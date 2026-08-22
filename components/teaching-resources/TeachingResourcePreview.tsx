'use client'

import { useEffect, useState } from 'react'
import { Presentation, Volume2 } from 'lucide-react'
import type { TeachingPreviewKind } from '@/lib/teaching-resources'

type TeachingResourcePreviewProps = {
  kind: TeachingPreviewKind
  url?: string | null
  title: string
  className?: string
  compact?: boolean
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
      <div className={`flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-900 px-4 ${className}`}>
        <Volume2 className="h-8 w-8 text-sky-300" />
        {!compact && (
          <audio src={url} controls className="w-full max-w-md" preload="metadata" />
        )}
        {compact && <span className="text-xs text-slate-300">Audio preview</span>}
      </div>
    )
  }

  return (
    <div className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-100 text-slate-500 ${className}`}>
      <Presentation className="h-8 w-8" />
      <span className="text-xs font-medium">Preview after download</span>
    </div>
  )
}
