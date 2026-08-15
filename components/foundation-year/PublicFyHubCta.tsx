'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useSession } from 'next-auth/react'

const HUB_HREF = '/placements/foundation-year'
const SIGNIN_HREF = `/auth/signin?callbackUrl=${encodeURIComponent(HUB_HREF)}`

const buttonClass =
  'mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium px-4 py-2.5'

export function PublicFyHubCta({ variant }: { variant: 'aside' | 'header' }) {
  const { status } = useSession()
  const signedIn = status === 'authenticated'
  const href = signedIn ? HUB_HREF : SIGNIN_HREF

  if (variant === 'header') {
    return (
      <Link href={href} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium px-4 py-2.5">
        {signedIn ? 'Open the full hub' : 'Sign in for the full hub'}
        <ArrowRight className="h-4 w-4" />
      </Link>
    )
  }

  return (
    <aside className="rounded-xl border border-teal-100 bg-teal-50/60 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-teal-950">
        {signedIn ? 'Open the full Foundation Year hub' : 'Want the full Foundation Year hub?'}
      </h2>
      <p className="mt-1 text-sm text-teal-900/80">
        {signedIn
          ? 'Cohort-specific topics, members-only inductions, and your personalised teaching hub.'
          : 'Sign in for cohort-specific topics, members-only inductions, and your personalised teaching hub.'}
      </p>
      <Link href={href} className={buttonClass}>
        {signedIn ? 'Go to hub' : 'Sign in'}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </aside>
  )
}
