'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Bookmark, BookmarkCheck, Clock, ExternalLink, Loader2, MapPin, CalendarDays } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConferenceBackLink } from '@/components/conferences/ConferenceBackLink'
import {
  CAREER_LEVELS,
  FORMATS,
  NATIONS,
  RECOGNITION_LEVELS,
  WORK_TYPES,
  WORKFLOW_STATUSES,
  deadlineUrgency,
  formatConferenceDate,
  formatDeadline,
  isGenericListingUrl,
  labelFor,
  presentationLabel,
  type ConferenceOpportunity,
  type WorkflowStatus,
} from '@/lib/conferences'

export default function ConferenceDetailPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const { status } = useSession()
  const [opportunity, setOpportunity] = useState<ConferenceOpportunity | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push(`/auth/signin?callbackUrl=/conferences/${params.slug}`)
  }, [status, router, params.slug])

  useEffect(() => {
    if (status !== 'authenticated' || !params.slug) return
    setLoading(true)
    fetch(`/api/conferences/${params.slug}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then((data) => setOpportunity(data.opportunity))
      .catch(() => setOpportunity(null))
      .finally(() => setLoading(false))
  }, [params.slug, status])

  async function save(workflow_status: WorkflowStatus = 'saved') {
    if (!opportunity) return
    setSaving(true)
    try {
      const res = await fetch(`/api/conferences/${opportunity.slug}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not save')
      setOpportunity({ ...opportunity, save: data.save })
      toast.success('Saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  async function unsave() {
    if (!opportunity) return
    setSaving(true)
    try {
      const res = await fetch(`/api/conferences/${opportunity.slug}/save`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Could not remove')
      setOpportunity({ ...opportunity, save: null })
      toast.success('Removed from saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not remove')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Redirecting to sign in
      </div>
    )
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading opportunity
      </div>
    )
  }

  if (!opportunity) {
    return (
      <div className="space-y-4">
        <ConferenceBackLink />
        <p className="text-gray-600">This opportunity is not available.</p>
      </div>
    )
  }

  const urgency = deadlineUrgency(opportunity.abstract_deadline)
  const eventDates = `${formatConferenceDate(opportunity.start_date)}${
    opportunity.end_date && opportunity.end_date !== opportunity.start_date
      ? ` – ${formatConferenceDate(opportunity.end_date)}`
      : ''
  }`

  return (
    <div className="space-y-6">
      <ConferenceBackLink />

      <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-5 sm:p-7 shadow-sm space-y-5">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-blue-600" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-blue-700">{opportunity.organising_body || 'Organiser not stated'}</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900 break-words">{opportunity.name}</h1>
          </div>
          <Badge className={`capitalize shrink-0 ${urgency === 'urgent' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
            {opportunity.listing_status}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {opportunity.specialties.map((spec) => (
            <Badge key={spec.id} variant="outline">{spec.name}</Badge>
          ))}
          <Badge variant="secondary">{presentationLabel(opportunity)}</Badge>
          {opportunity.format ? <Badge variant="outline">{labelFor(FORMATS, opportunity.format)}</Badge> : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          <p className="flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2 text-gray-700">
            <CalendarDays className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
            {eventDates}
          </p>
          <p className={`flex items-start gap-2 rounded-xl px-3 py-2 ${urgency === 'urgent' ? 'bg-red-50 text-red-700 font-semibold' : urgency === 'soon' ? 'bg-amber-50 text-amber-800' : 'bg-gray-50 text-gray-800'}`}>
            <Clock className="h-4 w-4 mt-0.5 shrink-0" />
            {opportunity.deadline_not_stated ? 'Deadline not stated' : formatDeadline(opportunity.abstract_deadline)}
          </p>
          <p className="flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2 text-gray-700">
            <MapPin className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
            {opportunity.location_text || opportunity.city || labelFor(NATIONS, opportunity.nation)}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
          {opportunity.save ? (
            <>
              <Button variant="outline" onClick={unsave} disabled={saving} className="w-full sm:w-auto">
                <BookmarkCheck className="h-4 w-4" />
                Saved
              </Button>
              <select
                className="w-full sm:w-auto rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={opportunity.save.workflow_status}
                disabled={saving}
                onChange={(e) => save(e.target.value as WorkflowStatus)}
              >
                {WORKFLOW_STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </>
          ) : (
            <Button onClick={() => save('saved')} disabled={saving} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" />}
              Save opportunity
            </Button>
          )}
          {opportunity.official_page_url && !isGenericListingUrl(opportunity.official_page_url) ? (
            <Button asChild className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
              <a
                href={opportunity.official_page_url}
                {...(opportunity.official_page_url.startsWith('mailto:')
                  ? {}
                  : { target: '_blank', rel: 'noopener noreferrer' })}
              >
                Meeting page {opportunity.official_page_url.startsWith('mailto:') ? null : <ExternalLink className="h-4 w-4" />}
              </a>
            </Button>
          ) : null}
          {opportunity.submission_page_url && !isGenericListingUrl(opportunity.submission_page_url) ? (
            <Button asChild className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white">
              <a href={opportunity.submission_page_url} target="_blank" rel="noopener noreferrer">
                Submit abstract <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          ) : null}
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Fact title="Recognition" value={labelFor(RECOGNITION_LEVELS, opportunity.recognition_level)} />
        <Fact title="Eligible work" value={opportunity.eligible_work_types.length ? opportunity.eligible_work_types.map((t) => labelFor(WORK_TYPES, t)).join(', ') : 'Not stated'} />
        <Fact title="Career level" value={opportunity.eligible_career_levels.length ? opportunity.eligible_career_levels.map((t) => labelFor(CAREER_LEVELS, t)).join(', ') : 'Not stated'} />
        <Fact title="Abstract word limit" value={opportunity.abstract_word_limit ? String(opportunity.abstract_word_limit) : 'Not stated'} />
        <Fact title="Last verified (UK)" value={formatDeadline(opportunity.last_verified_at)} />
      </div>

      {opportunity.submission_requirements ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">Submission requirements</h2>
          <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{opportunity.submission_requirements}</p>
        </section>
      ) : null}
      {opportunity.prize_info ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">Prizes</h2>
          <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{opportunity.prize_info}</p>
        </section>
      ) : null}
      {opportunity.publication_info ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">Publication</h2>
          <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{opportunity.publication_info}</p>
        </section>
      ) : null}

      <p className="text-xs text-gray-500">
        Bleepy does not submit abstracts. Use the official conference links. A poster maker will later reuse these requirements.
      </p>
    </div>
  )
}

function Fact({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-1 text-sm text-gray-900">{value}</p>
    </div>
  )
}
