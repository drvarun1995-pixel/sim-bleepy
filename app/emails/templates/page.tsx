'use client'

import { useMemo, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import { useRole } from '@/lib/useRole'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SAMPLE_SYSTEM_EMAILS, type BuiltEmail } from '@/lib/email-templates/system'
import {
  buildGraduateEmailHtml,
  buildGraduateEmailSubject,
} from '@/lib/email-templates/graduate-alumni'
import { buildProgressionConfirmEmail } from '@/lib/email-templates/progression-confirm'
import { EMAIL_SITE } from '@/lib/email-templates/layout'

/**
 * Temporary preview hub for restyled system emails.
 * Route: /emails/templates
 */
export default function EmailTemplatesPreviewPage() {
  const { data: session, status } = useSession()
  const { role, loading: roleLoading, canSendAdminEmails } = useRole()
  const router = useRouter()
  const [selectedId, setSelectedId] = useState('verify')

  useEffect(() => {
    if (status === 'loading' || roleLoading) return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    if (!canSendAdminEmails) {
      router.push('/dashboard')
    }
  }, [session, status, roleLoading, canSendAdminEmails, router])

  const templates = useMemo((): BuiltEmail[] => {
    const name = session?.user?.name || 'Alex Example'
    const graduate = {
      id: 'graduate',
      label: 'Graduate / alumni',
      group: 'learner' as const,
      subject: buildGraduateEmailSubject({ name }),
      html: buildGraduateEmailHtml({
        name,
        university: 'ARU',
        lastStageLabel: 'ARU Year 5',
        cohortLabel: '25-26',
        recommendUrl: `${EMAIL_SITE}/share`,
        feedbackUrl: `${EMAIL_SITE}/site-feedback?source=graduate-email`,
      }),
    }
    const progression = {
      id: 'progression',
      label: 'Year updated',
      group: 'learner' as const,
      ...buildProgressionConfirmEmail({
        name,
        fromLabel: 'ARU Year 4',
        toLabel: 'ARU Year 5',
      }),
    }
    return [graduate, progression, ...SAMPLE_SYSTEM_EMAILS]
  }, [session?.user?.name])

  const selected = templates.find((t) => t.id === selectedId) || templates[0]
  const learners = templates.filter((t) => t.group === 'learner')
  const admins = templates.filter((t) => t.group === 'admin')

  if (status === 'loading' || roleLoading || !role) {
    return <LoadingScreen message="Loading template preview…" />
  }

  if (!canSendAdminEmails) return null

  return (
    <DashboardLayoutClient
      role={role as any}
      userName={session?.user?.name || session?.user?.email || undefined}
    >
      <div className="mx-auto w-full max-w-5xl space-y-6 px-1 sm:px-0">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">System email templates</h1>
            <Badge variant="secondary">Temporary preview</Badge>
          </div>
          <p className="text-sm text-slate-600">
            Review each restyled template one by one. These are not sent from this page. Do not
            bulk-send 25-26.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Choose a template</CardTitle>
            <CardDescription>Learner-facing first, then admin/internal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Learner
              </p>
              <div className="flex flex-wrap gap-2">
                {learners.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      selected.id === t.id
                        ? 'border-teal-700 bg-teal-50 text-teal-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Admin / internal
              </p>
              <div className="flex flex-wrap gap-2">
                {admins.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      selected.id === t.id
                        ? 'border-teal-700 bg-teal-50 text-teal-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subject</CardTitle>
            <CardDescription className="text-slate-800 font-medium text-sm">
              {selected.subject}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inbox preview</CardTitle>
            <CardDescription>{selected.label}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100 p-3 sm:p-6">
              <iframe
                title={`${selected.label} email preview`}
                className="h-[780px] w-full rounded-md border border-slate-200 bg-white"
                srcDoc={selected.html}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayoutClient>
  )
}
