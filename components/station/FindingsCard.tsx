'use client'

import { X } from 'lucide-react'
import type { FindingFlag, FindingKind, StationFinding } from '@/utils/stationFindings'
import { cn } from '@/utils'

const KIND_STYLES: Record<
  FindingKind,
  { band: string; pill: string; label: string }
> = {
  examination: {
    band: 'bg-teal-700',
    pill: 'bg-teal-50 text-teal-800',
    label: 'Examination',
  },
  observations: {
    band: 'bg-emerald-700',
    pill: 'bg-emerald-50 text-emerald-800',
    label: 'Observations',
  },
  labs: {
    band: 'bg-blue-800',
    pill: 'bg-blue-50 text-blue-800',
    label: 'Laboratory',
  },
  imaging: {
    band: 'bg-indigo-800',
    pill: 'bg-indigo-50 text-indigo-800',
    label: 'Imaging',
  },
  unavailable: {
    band: 'bg-slate-500',
    pill: 'bg-slate-100 text-slate-700',
    label: 'Unavailable',
  },
}

function flagClass(flag?: FindingFlag): string {
  if (flag === 'abnormal') return 'text-rose-700 font-semibold'
  if (flag === 'trace') return 'text-amber-700 font-medium'
  if (flag === 'info') return 'text-blue-800'
  return 'text-slate-600'
}

function formatOpenedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/London',
    })
  } catch {
    return ''
  }
}

export function FindingsCard({
  finding,
  onClose,
}: {
  finding: StationFinding
  onClose?: () => void
}) {
  const kind = KIND_STYLES[finding.kind]

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className={cn('h-2 w-full', kind.band)} />
      <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-3">
        <div className="min-w-0">
          <span
            className={cn(
              'inline-block rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
              kind.pill
            )}
          >
            {kind.label}
          </span>
          <h3 className="mt-2 text-base font-semibold text-gray-900">
            {finding.title}
          </h3>
          <p className="text-xs text-slate-500">
            {finding.patientName} · {finding.patientLine} ·{' '}
            {formatOpenedAt(finding.openedAt)}
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Hide findings card"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      <div className="px-4 pb-3">
        {finding.imageSrc ? (
          <div
            className={cn(
              'overflow-hidden rounded-lg border border-slate-200 bg-slate-50',
              finding.showReport === false ? '' : 'mb-3'
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={finding.imageSrc}
              alt={finding.imageAlt || finding.title}
              className="h-auto w-full"
            />
          </div>
        ) : null}
        {finding.showReport !== false ? (
          <>
            <table className="w-full text-sm">
              <tbody>
                {finding.rows.map((row) => (
                  <tr key={row.label} className="border-t border-slate-100">
                    <th className="py-2 pr-3 text-left font-medium text-slate-700">
                      {row.label}
                    </th>
                    <td className={cn('py-2 text-right', flagClass(row.flag))}>
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : null}
      </div>
    </article>
  )
}
