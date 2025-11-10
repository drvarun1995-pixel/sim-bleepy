'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History, Calendar } from 'lucide-react'

type AllowedRole = 'admin' | 'meded_team'

interface ChangelogEntry {
  date: string
  title: string
  highlights: string[]
}

const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    date: '2025-11-10',
    title: 'Connections Beta Launch',
    highlights: [
      'Released redesigned Connections dashboard with Suggestions-first tabs, centred cards and integrated profile visibility banner.',
      'Launched standalone Friends (Beta) and Mentors (Beta) hubs with dedicated metrics and inline public-profile toggles.',
      'Hardened moderation: connection reports feed contact inbox, send acknowledgements, and `connection_events` now runs under RLS policies.',
    ],
  },
  {
    date: '2025-11-09',
    title: 'Reporting & Social UX Polish',
    highlights: [
      'Added `ProfileVisibilityCallout` component so users can publish their profile from social pages in one click.',
      'Refined connection hover states, mobile spacing, button colours and quick search UX; ensured suggestions only show public/message-enabled profiles.',
      'Delivered SWR-powered `/api/network/search`, Outlook-friendly report emails, and auto-prefilled contact category deep links.',
    ],
  },
  {
    date: '2025-11-08',
    title: 'Profile Privacy & Avatar Refresh',
    highlights: [
      'Introduced public/private profile toggle with stable public slugs and dashboard layout parity.',
      'Added avatar library with pending selection state and automatic Supabase cleanup when switching assets.',
      'MedEd onboarding now skips academic fields and emails admins for potential role upgrades.'
    ]
  },
  {
    date: '2025-11-08',
    title: 'Homepage & Analytics Metrics Alignment',
    highlights: [
      'Homepage cohort cards now surface live Supabase student counts for ARU, UCL and FY doctors.',
      'Active student totals use a 30-day activity window consistent with analytics reporting.',
      'Privacy, terms and cookie pages refreshed to reflect zero retention and avatar storage changes.'
    ]
  },
  {
    date: '2025-11-07',
    title: 'Hume EVI Zero Retention Safeguards',
    highlights: [
      'Forced chatHistory=false on every EVI session and stored transcripts locally only.',
      'Added automated cleanup jobs for sessions, transcripts and API usage data.',
      'Updated GDPR documentation and cron authentication logic for certificate/feedback jobs.'
    ]
  },
  {
    date: '2025-11-06',
    title: 'Placements Gallery Mobile Fixes',
    highlights: [
      'Replaced lightbox with custom portal overlay that stays centered across mobile and iOS.',
      'Added image retry flows, bounds checks and scroll locking for a stable viewing experience.',
      'Streamlined dashboard sidebar permissions for MedEd Team alongside analytics UX tweaks.'
    ]
  },
  {
    date: '2025-11-05',
    title: 'Placements Publishing Suite',
    highlights: [
      'Moved placements into dedicated storage with RLS, Tiptap editor enhancements and Excel paste support.',
      'Shipped professional layouts, breadcrumbs, specialty badges and responsive design improvements.',
      'Added download API routes, image cleanup routines and polished hero experiences.'
    ]
  },
  {
    date: '2025-11-04',
    title: 'Onboarding Tour Resilience',
    highlights: [
      'Stabilised onboarding tour selectors, manual triggers and Supabase admin updates.',
      'Refreshed product links and social icons across marketing pages.',
      'Adjusted event status badges and profile tours to avoid regressions during replays.'
    ]
  },
  {
    date: '2025-11-03',
    title: 'Cohorts Intelligence & System Logs',
    highlights: [
      'Built cohorts dashboard with sorting, year filters, rolling charts and email-domain inference.',
      'Launched admin logs centre with role-gated access, bulk deletion and test log generation.',
      'Instrumented cron tasks, analytics queries and cohort APIs for better reliability.'
    ]
  },
  {
    date: '2025-11-02',
    title: 'Workflow 3 Feedback Gate',
    highlights: [
      'Linked feedback completion to certificate release with cron orchestration and cooldowns.',
      'Enhanced teaching/file request notifications and admin email templates.',
      'Refined analytics active-user logic and QR scan guardrails.'
    ]
  },
  {
    date: '2025-11-01',
    title: 'Certificate Rendering Hardening',
    highlights: [
      'Bundled Inter fonts, server-side canvas rendering and debug overlays for pixel-perfect output.',
      'Queued certificate cron runs from attendance scans and improved template save UX.',
      'Documented rendering pipeline, removed debug artifacts and tightened template placeholders.'
    ]
  },
  {
    date: '2025-10-31',
    title: 'Automation & Mobile UX',
    highlights: [
      'Preserved attended status across QR workflows while refining cron scheduling and logging.',
      'Optimised mobile layouts for QR, feedback and booking pages with consistent styling.',
      'Expanded debugging for certificate jobs, organiser data and auto-generated assets.'
    ]
  },
  {
    date: '2025-10-29',
    title: 'Attendance Tracking & Feedback Templates',
    highlights: [
      'Shipped attendance tracking dashboards, exports and realtime scan counters.',
      'Launched feedback template management with sharing, delete dialogs and analytics.',
      'Stabilised QR scans, feedback persistence and event hierarchy filters.'
    ]
  },
  {
    date: '2025-10-27',
    title: 'Exports & Live QR Boards',
    highlights: [
      'Delivered data exports with advanced filters and improved table transformations.',
      'Added realtime QR dashboards with fullscreen mode and SSE cleanup.',
      'Improved event deletion flows, certificate previews and analytics typing.'
    ]
  },
  {
    date: '2025-10-25',
    title: 'Feedback System & Builder Persistence',
    highlights: [
      'Rolled out feedback forms with anonymous toggle, QR integration and analytics views.',
      'Persisted event builder state in localStorage to guard against accidental refresh.',
      'Enhanced Smart Bulk Upload with organiser/location AI fixes and responsive layouts.'
    ]
  },
  {
    date: '2025-10-24',
    title: 'QR Attendance & Auto Certificates',
    highlights: [
      'Implemented QR code scanner pages, fullscreen mode and real-time scan updates.',
      'Connected QR scans to automated certificate, feedback and email flows.',
      'Removed deprecated Resend code, added cron GET support and hardened TypeScript contracts.'
    ]
  },
  {
    date: '2025-10-23',
    title: 'Certificate Workflow Launch',
    highlights: [
      'Released drag-and-drop template builder with thumbnail optimisation and search.',
      'Enabled bulk generation, resend emails and secure storage linked to bookings.',
      'Polished admin modals, inline email styles and dashboard layout glitches.'
    ]
  },
  {
    date: '2025-10-17',
    title: 'Event Booking Platform',
    highlights: [
      'Launched booking lifecycle with capacity, waitlist, cancellation reasons and approvals.',
      'Added My Bookings, admin management, countdown timers and role-aware access.',
      'Prevented critical event changes once bookings or QR scans exist.'
    ]
  },
  {
    date: '2025-10-16',
    title: 'Calendar Subscriptions & Admin Onboarding',
    highlights: [
      'Introduced Google, Outlook and Apple calendar feeds with deep links and mobile support.',
      'Streamlined admin-created user onboarding with branded emails and password flows.',
      'Refreshed email templates, week-files widgets and download tracking instrumentation.'
    ]
  },
  {
    date: '2025-10-14',
    title: 'MedEd Team Permissions',
    highlights: [
      'Added MedEd Team and CTF roles with tailored navigation, RLS policies and approvals.',
      'Stabilised leaderboard RLS, download tracking and admin confirmation dialogs.',
      'Refined analytics layout, calendar colours and week-files display.'
    ]
  },
  {
    date: '2025-10-13',
    title: 'IMT Portfolio Rollout',
    highlights: [
      'Delivered evidence categories, subfolders, scoring rubrics and download/export tools.',
      'Implemented file renaming, mobile responsiveness and diagnostic utilities.',
      'Restricted access to authorised roles with improved error handling and logging.'
    ]
  },
  {
    date: '2025-10-12',
    title: 'Contact & Support Centre',
    highlights: [
      'Launched contact form with reCAPTCHA, admin inbox and message triage tools.',
      'Synced mobile navigation with desktop for consistent user journeys.',
      'Published educator dashboard guidance and RLS fixes for cohort data.'
    ]
  },
  {
    date: '2025-10-09',
    title: 'Announcements & Email Automation',
    highlights: [
      'Released announcements CMS, dashboard widget and public announcements hub.',
      'Refined search overlays, presentations layout and audio notification defaults.',
      'Automated approval and role-change emails with diagnostics and retry logic.'
    ]
  },
  {
    date: '2025-10-08',
    title: 'Resource Library & Analytics',
    highlights: [
      'Created downloads hub with uploads, filters, pagination and event mapping.',
      'Integrated Google Analytics with exclusion lists and suspense-safe components.',
      'Improved calendar routing, marketing navigation and search quick actions.'
    ]
  },
  {
    date: '2025-10-06',
    title: 'Formats, Calendar & Homepage Polish',
    highlights: [
      'Shipped formats explorer with pagination, multi-select filters and preference storage.',
      'Enhanced calendar with new styling, expiration logic and dark-mode accents.',
      'Optimised homepage layout, weather widget, download tracking and event filters.'
    ]
  },
  {
    date: '2025-10-05',
    title: 'Personalised Onboarding & Dashboards',
    highlights: [
      'Rolled out multi-step onboarding with role, university, specialty and interest capture.',
      'Rebuilt dashboard widgets for Today/This Week with cohort-aware filtering.',
      'Enforced profile completion reminders and updated middleware safeguards.'
    ]
  },
  {
    date: '2025-10-04',
    title: 'Admin Workspace & Responsive Sidebar',
    highlights: [
      'Introduced collapsible dashboard sidebar with role-grouped navigation.',
      'Embedded admin event management into dashboard with pagination and hydration fixes.',
      'Improved event filters, calendar dots and mobile responsiveness across views.'
    ]
  },
  {
    date: '2025-10-01',
    title: 'Events & Calendar Platform',
    highlights: [
      'Delivered event builder with multi-speaker, organiser, category and location support.',
      'Synced calendar, events list and detail pages with Google Places enrichment.',
      'Shipped bulk Excel import with duplicate detection and timezone-aware scheduling.'
    ]
  },
  {
    date: '2025-09-27',
    title: 'Compliance & Gamification Rollout',
    highlights: [
      'Implemented GDPR toolset: consent capture, data exports and Word-format DSAR output.',
      'Launched XP, achievements, leaderboards and audit logging for governance.',
      'Secured admin routes, email verification and notification workflows.'
    ]
  },
  {
    date: '2025-09-23',
    title: 'Admin Analytics Overhaul',
    highlights: [
      'Built live admin dashboards with simulator analytics, cost telemetry and user stats.',
      'Added troubleshooting endpoints, dynamic exports and framer-motion driven UX.',
      'Standardised NextAuth session handling and service-role access patterns.'
    ]
  },
  {
    date: '2025-09-21',
    title: 'Analytics & Hume Stabilisation',
    highlights: [
      'Completed educator dashboard charts, KPIs and cohort comparisons.',
      'Resolved Hume EVI behavioural quirks, audio management and transcript auto-scroll.',
      'Aligned station data contracts to eliminate dashboard TypeScript issues.'
    ]
  },
  {
    date: '2025-09-14',
    title: 'Bleepy Simulator Launch',
    highlights: [
      'Shipped Hume EVI-powered OSCE stations with medical chat UX and analytics foundations.',
      'Established NextAuth authentication, password resets and verification flows.',
      'Laid groundwork for admin dashboards, transcripts and production deployments.'
    ]
  }
]

export default function ChangelogPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [allowedRole, setAllowedRole] = useState<AllowedRole | null>(null)
  const [checkingAccess, setCheckingAccess] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    const verifyAccess = async () => {
      try {
        const response = await fetch('/api/user/role')
        if (!response.ok) {
          router.push('/dashboard')
          return
        }

        const { role } = await response.json()
        if (role === 'admin' || role === 'meded_team') {
          setAllowedRole(role)
        } else {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Failed to verify role access for changelog:', error)
        router.push('/dashboard')
      } finally {
        setCheckingAccess(false)
      }
    }

    void verifyAccess()
  }, [router, session, status])

  const formattedEntries = useMemo(
    () =>
      CHANGELOG_ENTRIES.map((entry) => ({
        ...entry,
        formattedDate: new Date(entry.date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      })),
    []
  )

  const isLoading = status === 'loading' || checkingAccess || !allowedRole

  if (isLoading) {
    return (
      <DashboardLayoutClient role={allowedRole ?? 'admin'} userName={session?.user?.name as string | undefined}>
        <div className="flex h-64 items-center justify-center text-gray-600 dark:text-gray-300">
          Checking changelog access…
        </div>
      </DashboardLayoutClient>
    )
  }

  return (
    <DashboardLayoutClient role={allowedRole} userName={session?.user?.name as string | undefined}>
      <div className="space-y-8">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-6 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Platform Changelog</h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Snapshot of the key features and compliance updates delivered across the Bleepy platform.
          </p>
        </header>

        <div className="space-y-6">
          {formattedEntries.map((entry, index) => (
            <Card key={`${entry.date}-${entry.title}`}>
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline" className="flex items-center gap-1 text-xs font-semibold">
                    <Calendar className="h-3.5 w-3.5" />
                    {entry.formattedDate}
                  </Badge>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-300">Release #{formattedEntries.length - index}</span>
                </div>
                <CardTitle className="text-lg text-slate-900 dark:text-white">{entry.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {entry.highlights.map((highlight) => (
                    <li key={highlight} className="flex gap-2 leading-relaxed">
                      <span className="mt-1 text-blue-500">•</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800" />

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Last updated on 10 Nov 2025. For earlier milestones, refer to the legacy announcement archive.
        </p>
      </div>
    </DashboardLayoutClient>
  )
}

