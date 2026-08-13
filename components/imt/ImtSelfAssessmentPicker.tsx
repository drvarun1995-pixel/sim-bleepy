'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Save, Target } from 'lucide-react'
import {
  emptyImtScores,
  IMT_SCORE_DOMAINS,
  IMT_SCORE_LADDERS,
  IMT_SCORE_MAX,
  imtScoreTotal,
  type ImtScoreDomain,
  type ImtSelfAssessmentScores,
} from '@/lib/imt-scores'

const UPDATED_2027: ImtScoreDomain[] = ['presentations', 'publications']

export function ImtSelfAssessmentPicker() {
  const [scores, setScores] = useState<ImtSelfAssessmentScores>(emptyImtScores())
  const [savedTotal, setSavedTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch('/api/portfolio/scores')
        const data = await response.json()
        if (!cancelled && data.scores) {
          const next = {
            ...emptyImtScores(),
            ...data.scores,
            total: imtScoreTotal({ ...emptyImtScores(), ...data.scores }),
          }
          setScores(next)
          setSavedTotal(next.total)
        }
      } catch (error) {
        console.error('Failed to load IMT scores', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const total = useMemo(() => imtScoreTotal(scores), [scores])
  const progress = Math.min(100, Math.round((total / IMT_SCORE_MAX) * 100))
  const dirty = savedTotal !== null ? total !== savedTotal : total > 0

  const updateDomain = (key: ImtScoreDomain, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }))
  }

  const save = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/portfolio/scores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scores),
      })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || 'Failed to save scores')
        return
      }
      if (data.scores) {
        const next = { ...emptyImtScores(), ...data.scores }
        setScores(next)
        setSavedTotal(imtScoreTotal(next))
      } else {
        setSavedTotal(total)
      }
      toast.success('Self-assessment scores saved')
    } catch (error) {
      console.error('Failed to save IMT scores', error)
      toast.error('Failed to save scores')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <Target className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">Self-assessment</h2>
            <p className="mt-0.5 text-sm text-slate-600">
              Your working total for 2027. This does not replace the official scoring images above.
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <div className="mb-5">
          <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Progress</span>
            <span>{loading ? '—' : `${progress}%`}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-300"
              style={{ width: loading ? '0%' : `${progress}%` }}
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {IMT_SCORE_DOMAINS.map((domain) => {
            const max = IMT_SCORE_LADDERS[domain.key][IMT_SCORE_LADDERS[domain.key].length - 1]
            const selected = scores[domain.key] ?? 0
            return (
              <div
                key={domain.key}
                className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-[11rem]">
                  <p className="font-medium text-slate-900">{domain.label}</p>
                  <p className="text-xs text-slate-500">
                    Max {max}
                    {UPDATED_2027.includes(domain.key) ? ' · 2027 points' : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {IMT_SCORE_LADDERS[domain.key].map((value) => {
                    const isSelected = selected === value
                    return (
                      <button
                        key={value}
                        type="button"
                        disabled={loading}
                        onClick={() => updateDomain(domain.key, value)}
                        className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold tabular-nums transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'border border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
                        } disabled:opacity-50`}
                      >
                        {value}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total</p>
            <p className="text-2xl font-semibold tabular-nums text-slate-900">
              {loading ? '—' : total}
              <span className="text-base font-medium text-slate-400"> / {IMT_SCORE_MAX}</span>
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Saved on this account so you can come back later. Presentations and publications use the
            2027 ladders.
          </p>
          <Button
            type="button"
            onClick={save}
            disabled={loading || saving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 sm:w-auto"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving…' : dirty ? 'Save scores' : 'Saved'}
          </Button>
        </div>
      </div>
    </section>
  )
}
