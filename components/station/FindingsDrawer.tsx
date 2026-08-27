'use client'

import { useEffect, useState } from 'react'
import { FindingsCard } from '@/components/station/FindingsCard'
import { StationMuteButton } from '@/components/station/StationMuteButton'
import { useFindings } from '@/components/station/FindingsProvider'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils'
import { useVoice } from '@humeai/voice-react'

export function FindingsTray() {
  const { findings, activeId, setActiveId, dismissActive } = useFindings()
  if (!findings.length) return null

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Results
      </span>
      {findings.map((item) => {
        const selected = item.instanceId === activeId
        return (
          <button
            key={item.instanceId}
            type="button"
            onClick={() => (selected ? dismissActive() : setActiveId(item.instanceId))}
            className={cn(
              'min-h-9 rounded-full px-3 py-1 text-xs font-medium transition-colors',
              selected
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            )}
          >
            {item.title}
          </button>
        )
      })}
    </div>
  )
}

export function FindingsDrawer() {
  const { findings, activeId, setActiveId, dismissActive } = useFindings()
  const { status } = useVoice()
  const active = findings.find((item) => item.instanceId === activeId) ?? null
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const sync = () => setIsDesktop(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  if (!active) return null

  const tabs =
    findings.length > 1 ? (
      <div className="flex flex-wrap gap-1">
        {findings.map((item) => (
          <button
            key={item.instanceId}
            type="button"
            onClick={() =>
              item.instanceId === active.instanceId
                ? dismissActive()
                : setActiveId(item.instanceId)
            }
            className={
              item.instanceId === active.instanceId
                ? 'rounded-md bg-slate-800 px-2 py-1 text-[11px] font-medium text-white'
                : 'rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-200'
            }
          >
            {item.title}
          </button>
        ))}
      </div>
    ) : null

  if (isDesktop) {
    return (
      <aside className="sticky top-24 flex min-w-0 flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Findings
        </p>
        {tabs}
        <FindingsCard finding={active} onClose={dismissActive} />
      </aside>
    )
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-slate-900/25 animate-in fade-in duration-150"
        aria-label="Hide findings card"
        onClick={dismissActive}
      />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="pointer-events-auto flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          style={{ maxHeight: 'min(80vh, 36rem)' }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2 pt-3">
            {tabs ? <div className="mb-2">{tabs}</div> : null}
            <FindingsCard finding={active} onClose={dismissActive} />
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-white px-3 py-2">
            {status.value === 'connected' ? (
              <StationMuteButton />
            ) : (
              <span className="text-xs text-slate-500">Preview</span>
            )}
            <Button
              type="button"
              onClick={dismissActive}
              className="min-h-11 bg-slate-100 px-4 text-xs text-slate-800 hover:bg-slate-200"
            >
              Hide card
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
