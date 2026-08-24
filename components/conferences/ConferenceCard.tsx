'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  FORMATS,
  NATIONS,
  WORK_TYPES,
  WORKFLOW_STATUSES,
  deadlineUrgency,
  formatConferenceDate,
  formatDeadline,
  labelFor,
  presentationLabel,
  type ConferenceOpportunity,
} from '@/lib/conferences'
import { CalendarDays, Clock, MapPin } from 'lucide-react'

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

export function ConferenceCard({
  opportunity,
  href,
}: {
  opportunity: ConferenceOpportunity
  href: string
}) {
  const urgency = deadlineUrgency(opportunity.abstract_deadline)

  return (
    <Link href={href} className="block h-full group">
      <article className="relative h-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all group-hover:border-blue-300 group-hover:shadow-lg group-hover:-translate-y-0.5">
        <div className={`absolute inset-y-0 left-0 w-1 ${urgencyBar[urgency] || urgencyBar.ok}`} />
        <div className="p-5 pl-6 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-gray-900 leading-snug group-hover:text-blue-700">
              {opportunity.name}
            </h3>
            <Badge className={`${statusClass[opportunity.listing_status] || statusClass.upcoming} shrink-0 capitalize`}>
              {opportunity.listing_status}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{opportunity.organising_body || 'Organiser not stated'}</p>
          <div className="flex flex-wrap gap-1.5">
            {opportunity.specialties.map((spec) => (
              <Badge key={spec.id} variant="outline" className="font-normal bg-gray-50">
                {spec.name}
              </Badge>
            ))}
            <Badge variant="secondary" className="font-normal">
              {presentationLabel(opportunity)}
            </Badge>
          </div>
          <div className="text-sm space-y-1.5 text-gray-600">
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-gray-400" />
              {formatConferenceDate(opportunity.start_date)}
              {opportunity.end_date && opportunity.end_date !== opportunity.start_date
                ? ` – ${formatConferenceDate(opportunity.end_date)}`
                : ''}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
              {opportunity.location_text || opportunity.city || labelFor(NATIONS, opportunity.nation)}
              {opportunity.format ? ` · ${labelFor(FORMATS, opportunity.format)}` : ''}
            </p>
            <p className={`flex items-center gap-2 ${urgency === 'urgent' ? 'text-red-700 font-semibold' : urgency === 'soon' ? 'text-amber-700 font-medium' : 'text-gray-800'}`}>
              <Clock className="h-4 w-4 shrink-0" />
              {opportunity.deadline_not_stated ? 'Deadline not stated' : formatDeadline(opportunity.abstract_deadline)}
            </p>
          </div>
          {opportunity.eligible_work_types?.length ? (
            <p className="text-xs text-gray-500">
              {opportunity.eligible_work_types.map((type) => labelFor(WORK_TYPES, type)).join(' · ')}
            </p>
          ) : null}
          {opportunity.save ? (
            <p className="text-xs font-medium text-blue-700">Saved · {labelFor(WORKFLOW_STATUSES, opportunity.save.workflow_status)}</p>
          ) : null}
        </div>
      </article>
    </Link>
  )
}
