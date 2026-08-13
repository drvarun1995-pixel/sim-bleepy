'use client'

import { Suspense, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

function UnsubscribeInner() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [already, setAlready] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('This unsubscribe link is missing or incomplete.')
      return
    }

    ;(async () => {
      try {
        const res = await fetch('/api/email-preferences/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Unable to unsubscribe')
        setAlready(!!data.alreadyUnsubscribed)
        setMessage(
          data.message ||
            'You have been unsubscribed from Bleepy marketing emails.'
        )
        setStatus('done')
      } catch (e) {
        setStatus('error')
        setMessage(e instanceof Error ? e.message : 'Unable to unsubscribe')
      }
    })()
  }, [token])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-lg px-4 py-10 sm:py-14">
        <div className="mb-8 flex items-center gap-3">
          <Image src="/Bleepy-Logo-1-1.webp" alt="Bleepy" width={40} height={40} />
          <div>
            <p className="text-lg font-semibold text-slate-900">Bleepy</p>
            <p className="text-sm text-slate-500">Unsubscribe</p>
          </div>
        </div>

        {status === 'loading' && (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Unsubscribing you from marketing emails…
          </div>
        )}

        {status === 'done' && (
          <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-6">
            <CheckCircle className="h-10 w-10 text-teal-700" />
            <h1 className="mt-3 text-2xl font-bold text-slate-900">
              {already ? 'Already unsubscribed' : 'You’re unsubscribed'}
            </h1>
            <p className="mt-2 text-sm text-slate-600">{message}</p>
            <p className="mt-3 text-sm text-slate-500">
              You will no longer receive Bleepy marketing or list emails. Essential account messages
              may still be sent when required.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href={`/email-preferences?token=${encodeURIComponent(token)}`}>
                  Manage preferences
                </Link>
              </Button>
              <Button asChild className="bg-teal-700 hover:bg-teal-800">
                <Link href="/">Go to Bleepy</Link>
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6">
            <AlertCircle className="h-10 w-10 text-red-600" />
            <h1 className="mt-3 text-2xl font-bold text-slate-900">Couldn’t unsubscribe</h1>
            <p className="mt-2 text-sm text-red-800">{message}</p>
            <p className="mt-3 text-sm text-slate-600">
              Try signing in to{' '}
              <Link href="/dashboard/privacy" className="font-medium text-teal-700 underline">
                Privacy settings
              </Link>{' '}
              or email support@bleepy.co.uk.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-slate-500">Loading…</div>
      }
    >
      <UnsubscribeInner />
    </Suspense>
  )
}
