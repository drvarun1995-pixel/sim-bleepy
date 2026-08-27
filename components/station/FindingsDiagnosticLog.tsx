'use client'

import { useState } from 'react'
import { useFindings } from '@/components/station/FindingsProvider'
import { stationHasFindings } from '@/utils/stationFindings'
import { STATION_DEV_TOOLS } from '@/utils/findingsDiagnostics'

export function FindingsDiagnosticLog() {
  const {
    stationId,
    diagnosticLog,
    copyDiagnosticLog,
    clearDiagnosticLog,
  } = useFindings()
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(true)

  if (!STATION_DEV_TOOLS || !stationHasFindings(stationId)) return null

  const copy = async () => {
    await copyDiagnosticLog()
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="text-left text-xs font-semibold uppercase tracking-wide text-amber-900"
        >
          Findings diagnostic log ({diagnosticLog.length})
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copy}
            className="min-h-9 rounded-md border border-amber-400 bg-white px-3 text-xs font-medium text-amber-950"
          >
            {copied ? 'Copied' : 'Copy log'}
          </button>
          <button
            type="button"
            onClick={clearDiagnosticLog}
            className="min-h-9 rounded-md border border-amber-200 bg-amber-100 px-3 text-xs font-medium text-amber-900"
          >
            Clear
          </button>
        </div>
      </div>
      <p className="mt-1 text-xs text-amber-900/80">
        Each spoken line is scored by our matcher. Each Hume tool call is logged even if we
        ignore it. Copy this after a run if a card opens when it should not.
      </p>
      {open ? (
        <div className="mt-3 max-h-80 overflow-auto rounded-lg border border-amber-200 bg-white">
          {diagnosticLog.length === 0 ? (
            <p className="p-3 text-xs text-amber-900/70">Waiting for speech or tool calls.</p>
          ) : (
            <table className="w-full text-left text-[11px] leading-snug text-amber-950">
              <thead className="sticky top-0 bg-amber-100">
                <tr>
                  <th className="px-2 py-1 font-semibold">#</th>
                  <th className="px-2 py-1 font-semibold">Kind</th>
                  <th className="px-2 py-1 font-semibold">Line / tool</th>
                  <th className="px-2 py-1 font-semibold">Decision</th>
                </tr>
              </thead>
              <tbody>
                {diagnosticLog.map((event) => (
                  <tr key={event.seq} className="border-t border-amber-100 align-top">
                    <td className="px-2 py-1 font-mono">{event.seq}</td>
                    <td className="px-2 py-1">
                      {event.kind}
                      {event.speaker ? `/${event.speaker}` : ''}
                    </td>
                    <td className="px-2 py-1">
                      {event.hume ? (
                        <span>
                          Hume {event.hume.name} → {event.hume.code}
                          <span className="block text-amber-800/80">{event.hume.params}</span>
                        </span>
                      ) : (
                        event.text || '—'
                      )}
                      {event.diagnosis ? (
                        <span className="block text-amber-800/80">
                          matcher: {event.diagnosis.reason}
                          {event.diagnosis.investigationHit
                            ? ` hit=${event.diagnosis.investigationHit}`
                            : ''}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-2 py-1 font-medium">
                      {event.decision}
                      {event.opened ? (
                        <span className="block text-emerald-800">opened {event.opened}</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : null}
    </div>
  )
}
