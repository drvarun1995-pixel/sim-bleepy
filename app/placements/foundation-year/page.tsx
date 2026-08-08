'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowLeft, ArrowRight, GraduationCap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { FY_COHORTS, FY_COHORT_META } from '@/lib/foundation-year'

export default function FoundationYearHubPage() {
  const { status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <LoadingScreen message="Loading Foundation Year..." fullScreen={false} />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      <div className="flex items-start gap-4">
        <Link
          href="/placements"
          className="mt-1 inline-flex items-center text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Placements
        </Link>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
          <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Foundation Year</h1>
          <p className="text-gray-600 mt-2 text-base sm:text-lg">
            Practical guides and articles for foundation doctors
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {FY_COHORTS.map((cohort) => {
          const meta = FY_COHORT_META[cohort]
          return (
            <Link key={cohort} href={`/placements/foundation-year/${cohort}`}>
              <Card className="h-full hover:shadow-md transition-shadow border-gray-200 hover:border-teal-300">
                <CardHeader>
                  <CardTitle className="text-xl">{meta.label}</CardTitle>
                  <CardDescription>{meta.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="inline-flex items-center text-sm font-medium text-teal-700">
                    Browse topics
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
