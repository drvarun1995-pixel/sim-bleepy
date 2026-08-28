'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { ConferenceBackLink } from '@/components/conferences/ConferenceBackLink'
import { ConferenceCard } from '@/components/conferences/ConferenceCard'
import type { ConferenceOpportunity } from '@/lib/conferences'

export default function SavedConferencesPage() {
  const router = useRouter()
  const { status } = useSession()
  const [opportunities, setOpportunities] = useState<ConferenceOpportunity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin?callbackUrl=/conferences/saved')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/conferences/saved')
      .then((res) => res.json())
      .then((data) => setOpportunities(data.opportunities || []))
      .finally(() => setLoading(false))
  }, [status])

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading saved opportunities
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ConferenceBackLink />
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5 sm:p-7 shadow-sm">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">Saved opportunities</h1>
        <p className="text-gray-600 mt-2">Track conferences you may submit to. Poster generation will attach here later.</p>
      </div>
      {opportunities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
          You have not saved any conferences yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
          {opportunities.map((opportunity) => (
            <ConferenceCard
              key={opportunity.id}
              opportunity={opportunity}
              href={`/conferences/${opportunity.slug}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
