'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Calendar as CalendarIcon } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

/**
 * Session-aware hero buttons. Default to the guest CTA so first paint
 * (and Lighthouse) never wait on useSession().
 */
export function HomeHeroCtas() {
  const { status } = useSession()
  const signedIn = status === 'authenticated'

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center max-w-md sm:max-w-none mx-auto">
      <Link href={signedIn ? '/dashboard' : '/auth/signin'} className="bleepy-hero-cta">
        <Button size="sm" className="bleepy-btn-primary bleepy-hero-cta-btn px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold group border-0 h-auto w-full sm:w-auto">
          {signedIn ? 'Go to Dashboard' : 'Get Started Free'}
          <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </Link>
      <Link href="#calendar" className="bleepy-hero-cta bleepy-hero-cta-delay">
        <Button size="sm" className="bleepy-btn-ghost bleepy-hero-cta-btn px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold h-auto w-full sm:w-auto">
          <CalendarIcon className="mr-1.5 h-4 w-4" />
          View Teaching Calendar
        </Button>
      </Link>
    </div>
  )
}
