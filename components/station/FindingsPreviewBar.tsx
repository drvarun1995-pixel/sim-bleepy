'use client'

import { useEffect, useState } from 'react'
import { FindingsCard } from '@/components/station/FindingsCard'
import { useFindings } from '@/components/station/FindingsProvider'
import { findingsPreviewActions, stationHasFindings } from '@/utils/stationFindings'
import { STATION_DEV_TOOLS } from '@/utils/findingsDiagnostics'
import { cn } from '@/utils'

function previewEnabled(): boolean {
  return STATION_DEV_TOOLS
}

export function FindingsPreviewBar({
  inlineCard = false,
}: {
  inlineCard?: boolean
}) {
  const { stationId, pushPreview, findings, activeId, dismissActive } = useFindings()
  const [show, setShow] = useState(STATION_DEV_TOOLS)

  useEffect(() => {
    setShow(previewEnabled())
  }, [])

  const actions = findingsPreviewActions[stationId]
  if (!show || !stationHasFindings(stationId) || !actions?.length) return null

  const active = findings.find((item) => item.instanceId === activeId) ?? null

  return (
    <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/60 p-3 sm:p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-800">
        Local preview
      </p>
      <p className="mb-3 text-xs text-blue-900/80">
        Test findings cards here without speaking. In a live call, Hume opens the
        same slips when you examine or request a test. This button row is only on
        local/dev — it is not part of the OSCE for learners.
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const selected =
            inlineCard &&
            !!active &&
            (active.requestedCode === action.key || active.code === action.key)

          return (
            <button
              key={`${action.tool}-${action.key}`}
              type="button"
              onClick={() => {
                if (selected) {
                  dismissActive()
                  return
                }
                pushPreview(action)
              }}
              className={cn(
                'min-h-11 rounded-lg border px-3 py-1.5 text-xs font-medium',
                selected
                  ? 'border-blue-700 bg-blue-700 text-white'
                  : 'border-blue-200 bg-white text-blue-900 hover:bg-blue-100'
              )}
            >
              {action.label}
            </button>
          )
        })}
      </div>

      {inlineCard && active ? (
        <div className="mt-4">
          <FindingsCard finding={active} onClose={dismissActive} />
        </div>
      ) : null}
    </div>
  )
}
