'use client'

import { Suspense, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

type Prefs = {
  emailMasked: string
  name: string | null
  marketing_consent: boolean
  analytics_consent: boolean
}

function EmailPreferencesInner() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [marketing, setMarketing] = useState(true)
  const [analytics, setAnalytics] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('This preferences link is missing or incomplete.')
      setLoading(false)
      return
    }

    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/email-preferences?token=${encodeURIComponent(token)}`)
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Unable to load preferences')
        setPrefs(data)
        setMarketing(!!data.marketing_consent)
        setAnalytics(!!data.analytics_consent)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to load preferences')
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  const save = async () => {
    if (!token) return
    setSaving(true)
    try {
      const res = await fetch('/api/email-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          marketing_consent: marketing,
          analytics_consent: analytics,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setPrefs((prev) =>
        prev
          ? {
              ...prev,
              marketing_consent: data.marketing_consent,
              analytics_consent: data.analytics_consent,
            }
          : prev
      )
      toast.success('Preferences saved')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const unsubscribeNow = async () => {
    if (!token) return
    setSaving(true)
    try {
      const res = await fetch('/api/email-preferences/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to unsubscribe')
      setMarketing(false)
      toast.success(data.message || 'Unsubscribed')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to unsubscribe')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-lg px-4 py-10 sm:py-14">
        <div className="mb-8 flex items-center gap-3">
          <Image src="/Bleepy-Logo-1-1.webp" alt="Bleepy" width={40} height={40} />
          <div>
            <p className="text-lg font-semibold text-slate-900">Bleepy</p>
            <p className="text-sm text-slate-500">Email preferences</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading your preferences…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-800">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Link not valid</p>
                <p className="mt-1">{error}</p>
                <p className="mt-3 text-red-700">
                  Sign in and manage preferences from{' '}
                  <Link href="/dashboard/privacy" className="underline">
                    Privacy settings
                  </Link>
                  , or contact support@bleepy.co.uk.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900">Manage email preferences</h1>
            <p className="mt-2 text-sm text-slate-600">
              {prefs?.name ? `Hi ${prefs.name} — ` : ''}
              preferences for <span className="font-medium text-slate-800">{prefs?.emailMasked}</span>.
              No login required for this link.
            </p>

            <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Label htmlFor="marketing" className="text-base font-semibold text-slate-900">
                    Marketing & product emails
                  </Label>
                  <p className="mt-1 text-sm text-slate-500">
                    Updates, teaching announcements, and similar platform emails from Bleepy.
                    Transactional messages (e.g. security) may still be sent.
                  </p>
                </div>
                <Switch id="marketing" checked={marketing} onCheckedChange={setMarketing} />
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-start justify-between gap-4">
                <div>
                  <Label htmlFor="analytics" className="text-base font-semibold text-slate-900">
                    Analytics cookies / usage insights
                  </Label>
                  <p className="mt-1 text-sm text-slate-500">
                    Helps us understand how the site is used so we can improve it.
                  </p>
                </div>
                <Switch id="analytics" checked={analytics} onCheckedChange={setAnalytics} />
              </div>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <Button
                  type="button"
                  className="bg-teal-700 hover:bg-teal-800"
                  disabled={saving}
                  onClick={save}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving…' : 'Save preferences'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving || !marketing}
                  onClick={unsubscribeNow}
                >
                  Unsubscribe from marketing
                </Button>
              </div>
            </div>

            {!marketing && (
              <p className="mt-4 flex items-start gap-2 text-sm text-teal-800">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                You are opted out of marketing emails and will be excluded from those mailing lists.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function EmailPreferencesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-slate-500">Loading…</div>
      }
    >
      <EmailPreferencesInner />
    </Suspense>
  )
}
