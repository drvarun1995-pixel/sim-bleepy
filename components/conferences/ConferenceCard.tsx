'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  FORMATS,
  NATIONS,
  WORK_TYPES,
  WORKFLOW_STATUSES,
  deadlineUrgency,
  formatConferenceDateRange,
  formatDeadline,
  labelFor,
  presentationLabel,
  type ConferenceOpportunity,
} from '@/lib/conferences'
import { Bookmark, CalendarDays, Clock, MapPin } from 'lucide-react'

const statusClass: Record<string, string> = {
  open: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  upcoming: 'bg-sky-50 text-sky-800 border-sky-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
  archived: 'bg-gray-100 text-gray-500 border-gray-200',
}

const urgencyBar: Record<string, string> = {
  urgent: 'bg-red-500',
  soon: 'bg-amber-500',
  ok: 'bg-blue-600',
  closed: 'bg-gray-300',
  none: 'bg-blue-600',
}

function locationSummary(opportunity: ConferenceOpportunity) {
  const place =
    opportunity.city ||
    opportunity.location_text ||
    (opportunity.nation ? labelFor(NATIONS, opportunity.nation) : null)
  const format = opportunity.format ? labelFor(FORMATS, opportunity.format) : null
  return [place, format].filter(Boolean).join(' · ') || 'Location not stated'
}

function saveLabel(opportunity: ConferenceOpportunity) {
  if (!opportunity.save) return null
  if (opportunity.save.workflow_status === 'saved') return 'Saved'
  return labelFor(WORKFLOW_STATUSES, opportunity.save.workflow_status)
}

export function ConferenceCard({
  opportunity,
  href,
}: {
  opportunity: ConferenceOpportunity
  href: string
}) {
  const urgency = deadlineUrgency(opportunity.abstract_deadline)
  const presentation = presentationLabel(opportunity)
  const savedAs = saveLabel(opportunity)
  const extraSpecialties = Math.max(0, opportunity.specialties.length - 2)
  const location = locationSummary(opportunity)

  return (
    <Link href={href} className="block h-full min-h-0 group">
      <article className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all group-hover:border-blue-300 group-hover:shadow-md group-hover:-translate-y-0.5">
        <div className={`absolute inset-y-0 left-0 w-1 ${urgencyBar[urgency] || urgencyBar.ok}`} />
        <div className="flex flex-1 flex-col p-5 pl-6">
          <div className="flex items-center justify-between gap-2">
            <Badge className={`${statusClass[opportunity.listing_status] || statusClass.upcoming} capitalize`}>
              {opportunity.listing_status}
            </Badge>
            {savedAs ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700">
                <Bookmark className="h-3.5 w-3.5 fill-current" />
                {savedAs}
              </span>
            ) : null}
          </div>

          <h3
            title={opportunity.name}
            className="mt-3 min-h-[2.9rem] font-[family-name:var(--font-space-grotesk)] text-[1.2rem] font-bold leading-snug tracking-tight text-slate-900 line-clamp-2 group-hover:text-blue-800"
          >
            {opportunity.name}
          </h3>
          <p className="mt-1 truncate text-sm text-slate-500" title={opportunity.organising_body || undefined}>
            {opportunity.organising_body || 'Organiser not stated'}
          </p>

          <div className="mt-3 flex max-h-7 min-h-7 flex-wrap gap-1.5 overflow-hidden">
            {opportunity.specialties.slice(0, 2).map((spec) => (
              <Badge key={spec.id} variant="outline" className="font-normal bg-slate-50 text-slate-700">
                {spec.name}
              </Badge>
            ))}
            {extraSpecialties > 0 ? (
              <Badge variant="outline" className="font-normal bg-slate-50 text-slate-500">
                +{extraSpecialties}
              </Badge>
            ) : null}
            {presentation !== 'Not stated' ? (
              <Badge variant="secondary" className="font-normal">
                {presentation}
              </Badge>
            ) : null}
          </div>

          <div className="mt-auto space-y-1.5 pt-4 text-sm text-slate-600">
            <p className="flex min-w-0 items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate">{formatConferenceDateRange(opportunity.start_date, opportunity.end_date)}</span>
            </p>
            <p className="flex min-w-0 items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate" title={opportunity.location_text || location}>
                {location}
              </span>
            </p>
            <p
              className={`flex min-w-0 items-center gap-2 ${
                urgency === 'urgent'
                  ? 'text-red-700 font-semibold'
                  : urgency === 'soon'
                    ? 'text-amber-700 font-medium'
                    : 'text-slate-800'
              }`}
            >
              <Clock className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {opportunity.deadline_not_stated
                  ? 'Deadline not stated'
                  : formatDeadline(opportunity.abstract_deadline)}
              </span>
            </p>
          </div>

          <div className="mt-3 min-h-[2.35rem] border-t border-slate-100 pt-3">
            {opportunity.eligible_work_types?.length ? (
              <p className="truncate text-xs text-slate-500">
                {opportunity.eligible_work_types.map((type) => labelFor(WORK_TYPES, type)).join(' · ')}
              </p>
            ) : null}
          </div>
        </div>
      </article>
    </Link>
  )
}
