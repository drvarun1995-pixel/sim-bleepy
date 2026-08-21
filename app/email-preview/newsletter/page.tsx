'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  buildWeeklyNewsletterEmail,
  defaultWeeklyNewsletter,
} from '@/lib/email-templates/newsletter'

const PERSONA_LINKS = [
  { id: 'fy1', label: 'FY1' },
  { id: 'fy2', label: 'FY2' },
  { id: 'aru-4', label: 'ARU Y4' },
  { id: 'ucl-6', label: 'UCL Y6' },
]

function WeeklyNewsletterPreviewInner() {
  const searchParams = useSearchParams()
  const view = PERSONA_LINKS.some((item) => item.id === searchParams.get('view'))
    ? searchParams.get('view') || 'fy1'
    : 'fy1'
  const fallback = useMemo(() => buildWeeklyNewsletterEmail(defaultWeeklyNewsletter()), [])
  const [html, setHtml] = useState(fallback.html)
  const [subject, setSubject] = useState(fallback.subject)
  const [personaLabel, setPersonaLabel] = useState(view)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetch('/api/admin/emails/newsletter-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: view }),
    })
      .then(async (response) => {
        if (!response.ok) return null
        return response.json()
      })
      .then((json) => {
        if (!active || !json) return
        setHtml(json.html || fallback.html)
        setSubject(json.subject || fallback.subject)
        setPersonaLabel(json.personaLabel || view)
      })
      .catch(() => {
        if (!active) return
        setHtml(fallback.html)
        setSubject(fallback.subject)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [view, fallback.html, fallback.subject])

  return (
    <div className="min-h-screen bg-[#e5e7eb]">
      <div className="mx-auto max-w-[720px] px-3 py-6 sm:px-4">
        <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Live preview</p>
          <h1 className="mt-1 text-lg font-semibold text-slate-900">Bleepy Weekly newsletter</h1>
          <p className="mt-1 text-sm text-slate-600">
            Teaching is matched to the selected year group using the same rules as the dashboard.
            Foundation doctors also see FY guides; students see OSCE / games instead.
          </p>
          <p className="mt-2 truncate text-sm text-slate-500">
            <span className="font-medium text-slate-700">Subject:</span> {subject}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PERSONA_LINKS.map((item) => (
              <Link
                key={item.id}
                href={`/email-preview/newsletter?view=${item.id}`}
                className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-semibold ${
                  view === item.id
                    ? 'bg-teal-700 text-white'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {loading ? 'Updating preview…' : `Viewing as ${personaLabel}.`}
          </p>
          <div className="mt-3">
            <Link
              href="/emails/newsletter"
              className="inline-flex items-center rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-800"
            >
              Open newsletter editor
            </Link>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <iframe
            title="Weekly newsletter email preview"
            srcDoc={html}
            className="h-[2200px] w-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  )
}

export default function WeeklyNewsletterPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#e5e7eb] p-6 text-sm text-slate-600">Loading preview…</div>
      }
    >
      <WeeklyNewsletterPreviewInner />
    </Suspense>
  )
}
