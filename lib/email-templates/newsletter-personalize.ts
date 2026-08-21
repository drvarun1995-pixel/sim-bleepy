/**
 * Server-only: load this week's events and FY guides, then personalize a newsletter.
 */

import 'server-only'
import { supabaseAdmin } from '@/utils/supabase'
import {
  filterEventsByProfile,
  getThisWeekEvents,
  sortEventsByDate,
} from '@/lib/event-filtering'
import { listAllPublicFyPages } from '@/lib/fy-public-guides'
import { publicGuidePath } from '@/lib/fy-blog-access'
import { EMAIL_SITE } from '@/lib/email-templates/layout'
import { ARU_STUDY_YEARS, UCL_STUDY_YEARS } from '@/lib/study-years'
import {
  NEWSLETTER_SLOTS,
  fyGuideEmailImageUrl,
  isPersonalizedNewsletterHtml,
  newsletterPersonaKind,
  renderNewsletterEventsHtml,
  renderPersonaSectionHtml,
  sampleStudentPractice,
  setNewsletterSlot,
  type NewsletterEvent,
  type NewsletterHighlight,
  type NewsletterPersonaKind,
} from '@/lib/email-templates/newsletter'

type WeekEvent = {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  location?: string
  categories?: Array<{ id: string; name: string }>
  category?: string
  hideTime?: boolean
  isAllDay?: boolean
  eventStatus?: string | null
}

export type NewsletterRecipientProfile = {
  name?: string | null
  role?: string | null
  role_type?: string | null
  university?: string | null
  study_year?: string | null
  foundation_year?: string | null
  show_all_events?: boolean | null
  academic_status?: string | null
}

export type NewsletterWeekContent = {
  events: WeekEvent[]
  fyGuides: NewsletterHighlight[]
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function parseCategories(raw: unknown): Array<{ id: string; name: string }> {
  if (!raw) return []
  const value = typeof raw === 'string' ? (() => {
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  })() : raw
  if (!Array.isArray(value)) return []
  return value
    .map((item) => ({
      id: String(item?.id || item?.category_id || ''),
      name: String(item?.name || ''),
    }))
    .filter((item) => item.name)
}

function formatEventWhen(event: WeekEvent): string {
  const date = new Date(`${event.date}T12:00:00`)
  const day = Number.isNaN(date.getTime())
    ? event.date
    : date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  if (event.isAllDay || event.hideTime) return day
  const time = String(event.startTime || '').slice(0, 5)
  return time ? `${day} · ${time}` : day
}

function toNewsletterEvent(event: WeekEvent): NewsletterEvent {
  return {
    title: event.title,
    when: formatEventWhen(event),
    where: event.location || '',
    href: `${EMAIL_SITE}/events/${event.id}`,
  }
}

export async function loadNewsletterWeekContent(): Promise<NewsletterWeekContent> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekEnd = new Date(today)
  weekEnd.setDate(today.getDate() + 7)

  const [{ data, error }, publicPages] = await Promise.all([
    supabaseAdmin
      .from('events_with_details')
      .select('*')
      .eq('status', 'published')
      .gte('date', isoDate(today))
      .lt('date', isoDate(weekEnd))
      .order('date', { ascending: true }),
    listAllPublicFyPages().catch((err) => {
      console.error('Newsletter: failed to load public FY guides', err)
      return []
    }),
  ])

  if (error) {
    console.error('Newsletter: failed to load this week’s events', error)
  }

  const events: WeekEvent[] = (data || [])
    .filter((row) => {
      const status = String(row.event_status || '').toLowerCase()
      return !['cancelled', 'canceled'].includes(status)
    })
    .map((row) => {
      const locations = Array.isArray(row.locations) ? row.locations : []
      const locationName =
        row.hide_location
          ? ''
          : row.location_name || locations[0]?.name || ''
      return {
        id: String(row.id),
        title: String(row.title || 'Teaching session'),
        date: String(row.date || ''),
        startTime: String(row.start_time || ''),
        endTime: String(row.end_time || ''),
        location: locationName,
        categories: parseCategories(row.categories),
        category: row.category_name || '',
        hideTime: Boolean(row.hide_time),
        isAllDay: Boolean(row.is_all_day),
        eventStatus: row.event_status || null,
      }
    })

  const latestPublic = [...publicPages].sort((a, b) => {
    const aTime = Date.parse(a.created_at || a.updated_at || '') || 0
    const bTime = Date.parse(b.created_at || b.updated_at || '') || 0
    return bTime - aTime
  })

  const fyGuides: NewsletterHighlight[] = latestPublic.slice(0, 3).map((page) => ({
    title: page.title,
    text: page.topic_name ? `${page.topic_name} · Foundation Year guide` : 'Foundation Year guide',
    href: `${EMAIL_SITE}${publicGuidePath(page.topic_slug, page.slug)}`,
    linkLabel: 'Read the guide',
    imageUrl: fyGuideEmailImageUrl(page.topic_slug, page.slug),
  }))

  return { events, fyGuides }
}

export function eventsForRecipient(
  weekEvents: WeekEvent[],
  profile: NewsletterRecipientProfile
): NewsletterEvent[] {
  const filtered = filterEventsByProfile(weekEvents, {
    role: profile.role || undefined,
    role_type: profile.role_type || undefined,
    university: profile.university || undefined,
    study_year: profile.study_year || undefined,
    foundation_year: profile.foundation_year || undefined,
    show_all_events: Boolean(profile.show_all_events),
    academic_status: profile.academic_status,
  })
  const thisWeek = getThisWeekEvents(sortEventsByDate(filtered))
  return thisWeek.slice(0, 6).map(toNewsletterEvent)
}

export function personaKindForRecipient(
  profile: NewsletterRecipientProfile
): NewsletterPersonaKind {
  return newsletterPersonaKind(profile)
}

export function personalizeNewsletterHtml(
  html: string,
  profile: NewsletterRecipientProfile,
  week: NewsletterWeekContent
): string {
  if (!isPersonalizedNewsletterHtml(html)) return html

  const kind = personaKindForRecipient(profile)
  let next = html

  if (hasEventsSlot(html)) {
    next = setNewsletterSlot(
      next,
      NEWSLETTER_SLOTS.events,
      renderNewsletterEventsHtml(eventsForRecipient(week.events, profile))
    )
  }

  if (hasPersonaSlot(html)) {
    next = setNewsletterSlot(
      next,
      NEWSLETTER_SLOTS.persona,
      renderPersonaSectionHtml(kind, {
        fyGuides: week.fyGuides,
        practice: sampleStudentPractice(),
      })
    )
  }

  return next
}

function hasEventsSlot(html: string) {
  return html.includes(`<!--BLEEPY:${NEWSLETTER_SLOTS.events}-->`)
}

function hasPersonaSlot(html: string) {
  return html.includes(`<!--BLEEPY:${NEWSLETTER_SLOTS.persona}-->`)
}

export const NEWSLETTER_PREVIEW_PERSONAS: Record<
  string,
  { label: string; profile: NewsletterRecipientProfile }
> = {
  all: {
    label: 'Everyone',
    profile: {
      name: 'Alex Patel',
      role: 'student',
      role_type: 'foundation_doctor',
      foundation_year: 'FY1',
      academic_status: 'active',
    },
  },
  fy1: {
    label: 'FY1 doctor',
    profile: {
      name: 'Alex Patel',
      role: 'student',
      role_type: 'foundation_doctor',
      foundation_year: 'FY1',
      academic_status: 'active',
    },
  },
  fy2: {
    label: 'FY2 doctor',
    profile: {
      name: 'Sam Okonkwo',
      role: 'student',
      role_type: 'foundation_doctor',
      foundation_year: 'FY2',
      academic_status: 'active',
    },
  },
  aru: {
    label: 'ARU Year 4',
    profile: {
      name: 'Jamie Chen',
      role: 'student',
      role_type: 'medical_student',
      university: 'ARU',
      study_year: '4',
      academic_status: 'active',
    },
  },
  ucl: {
    label: 'UCL Year 6',
    profile: {
      name: 'Priya Shah',
      role: 'student',
      role_type: 'medical_student',
      university: 'UCL',
      study_year: '6',
      academic_status: 'active',
    },
  },
  ctf: {
    label: 'CTF',
    profile: {
      name: 'Riya Mayor',
      role: 'ctf',
      role_type: 'clinical_teaching_fellow',
      academic_status: 'active',
    },
  },
  educator: {
    label: 'Educator',
    profile: {
      name: 'Jordan Ellis',
      role: 'educator',
      role_type: 'consultant',
      academic_status: 'active',
    },
  },
  meded: {
    label: 'MedEd Team',
    profile: {
      name: 'Taylor Singh',
      role: 'meded_team',
      role_type: 'meded_team',
      academic_status: 'active',
    },
  },
  'staff-other': {
    label: 'Other staff',
    profile: {
      name: 'Morgan Adeyemi',
      role: 'student',
      role_type: 'registrar',
      academic_status: 'active',
    },
  },
  ...Object.fromEntries(
    ARU_STUDY_YEARS.map((year) => [
      `aru-${year}`,
      {
        label: `ARU Year ${year}`,
        profile: {
          name: 'Jamie Chen',
          role: 'student',
          role_type: 'medical_student',
          university: 'ARU',
          study_year: year,
          academic_status: 'active',
        },
      },
    ])
  ),
  ...Object.fromEntries(
    UCL_STUDY_YEARS.map((year) => [
      `ucl-${year}`,
      {
        label: `UCL Year ${year}`,
        profile: {
          name: 'Priya Shah',
          role: 'student',
          role_type: 'medical_student',
          university: 'UCL',
          study_year: year,
          academic_status: 'active',
        },
      },
    ])
  ),
}
