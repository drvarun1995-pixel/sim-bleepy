'use client'

import { useMemo, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import { useRole } from '@/lib/useRole'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  buildGraduateEmailHtml,
  buildGraduateEmailSubject,
} from '@/lib/email-templates/graduate-alumni'

const SITE = 'https://sim.bleepy.co.uk'

/**
 * Temporary preview for the graduate / alumni email template.
 * Route: /emails/templates/graduate-preview
 */
export default function GraduateEmailTemplatePreviewPage() {
  const { data: session, status } = useSession()
  const { role, loading: roleLoading, canSendAdminEmails } = useRole()
  const router = useRouter()
  const [actionUrls, setActionUrls] = useState<{
    preferencesUrl?: string
    unsubscribeUrl?: string
  }>({})

  useEffect(() => {
    if (status === 'loading' || roleLoading) return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    if (!canSendAdminEmails) {
      router.push('/dashboard')
      return
    }

    fetch('/api/email-preferences/my-links')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.preferencesUrl && data?.unsubscribeUrl) {
          setActionUrls({
            preferencesUrl: data.preferencesUrl,
            unsubscribeUrl: data.unsubscribeUrl,
          })
        }
      })
      .catch(() => {})
  }, [session, status, roleLoading, canSendAdminEmails, router])

  const sample = useMemo(
    () => ({
      name: session?.user?.name || 'Alex Example',
      university: 'ARU',
      lastStageLabel: 'ARU Year 5',
      cohortLabel: '25-26',
      recommendUrl: `${SITE}/share`,
      feedbackUrl: `${SITE}/site-feedback?source=graduate-email`,
      preferencesUrl: actionUrls.preferencesUrl,
      unsubscribeUrl: actionUrls.unsubscribeUrl,
    }),
    [session?.user?.name, actionUrls]
  )

  const subject = buildGraduateEmailSubject(sample)
  const html = buildGraduateEmailHtml(sample)

  if (status === 'loading' || roleLoading || !role) {
    return <LoadingScreen message="Loading template preview…" />
  }

  if (!canSendAdminEmails) return null

  return (
    <DashboardLayoutClient
      role={role as any}
      userName={session?.user?.name || session?.user?.email || undefined}
    >
      <div className="mx-auto w-full max-w-4xl space-y-6 px-1 sm:px-0">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Graduate email template</h1>
            <Badge variant="secondary">Temporary preview</Badge>
          </div>
          <p className="text-sm text-slate-600">
            Draft for when a student / FY is marked graduated. Unsubscribe / preferences links in
            this preview are signed for your account so you can test them.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subject</CardTitle>
            <CardDescription className="text-slate-800 font-medium text-sm">
              {subject}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inbox preview</CardTitle>
            <CardDescription>
              Sample: {sample.lastStageLabel}, cohort {sample.cohortLabel}
              {actionUrls.unsubscribeUrl
                ? ' · live preference links loaded'
                : ' · loading preference links…'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100 p-3 sm:p-6">
              <iframe
                title="Graduate email preview"
                className="h-[720px] w-full rounded-md border border-slate-200 bg-white"
                srcDoc={html}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayoutClient>
  )
}
