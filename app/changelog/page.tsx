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
    date: '2025-11-08',
    title: 'Profile Privacy & Avatar Refresh',
    highlights: [
      'Introduced public/private profile toggle with stable public slugs and dashboard layout parity.',
      'Added avatar library with pending selection state and automatic Supabase cleanup when switching assets.',
      'MedEd Team onboarding now skips academic fields and emails admins for potential role upgrades.'
    ]
  },
  {
    date: '2025-11-08',
    title: 'Homepage & Analytics Metrics Alignment',
    highlights: [
      'Homepage cohort cards now surface live Supabase student counts for ARU, UCL and FY doctors.',
      'Active student totals use a 30-day activity window consistent with analytics reporting.',
      'Legal pages refreshed to reflect GDPR posture, avatar storage location and zero retention guarantees.'
    ]
  },
  {
    date: '2025-11-07',
    title: 'Hume EVI Zero Retention Safeguards',
    highlights: [
      'Disabled platform-side chat storage by forcing chatHistory=false on every Hume EVI connection.',
      'Persisted full transcripts locally in Supabase attempts so only Bleepy stores session history.',
      'Documentation and privacy terms now emphasise local-only retention for audio and chat logs.'
    ]
  },
  {
    date: '2025-11-06',
    title: 'Placements Gallery Mobile Fixes',
    highlights: [
      'Rebuilt placement lightbox to stay centered with body-scroll lock across iOS and Android.',
      'Improved image error handling with retry prompts instead of disappearing assets.',
      'Smoothed navigation controls for multi-image carousels on narrow viewports.'
    ]
  },
  {
    date: '2025-10-23',
    title: 'Certificate Workflow Launch',
    highlights: [
      'Released drag-and-drop certificate template builder with precise scaling and alignment tools.',
      'Enabled bulk certificate generation with secure Supabase storage and quick export.',
      'Applied role-based controls so educators and admins govern certificate distribution.'
    ]
  },
  {
    date: '2025-10-17',
    title: 'Event Bookings & Safeguards',
    highlights: [
      'Rolled out end-to-end booking lifecycle with capacity, waitlists and attendance tracking.',
      'Added cancellation windows, manual approvals and publish guards for high-demand sessions.',
      'Delivered participant dashboards so users can manage upcoming and past event bookings.'
    ]
  },
  {
    date: '2025-10-11',
    title: 'AI Bulk Event Import',
    highlights: [
      'Excel uploads now auto-extract event metadata with AI assistance and duplicate detection.',
      'Inline review screen streamlines edits before publishing large batches.',
      'Multi-select support for categories, organisers and speakers accelerates onboarding.'
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
          Last updated on 08 Nov 2025. For earlier milestones, refer to the legacy announcement archive.
        </p>
      </div>
    </DashboardLayoutClient>
  )
}

