'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  Calendar,
  User,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  compareAnnouncementsByDateDesc,
  formatAnnouncementDate,
  getAllAnnouncements,
} from '@/lib/announcements'

const PRIORITY_CONFIG = {
  low: {
    icon: Info,
    label: 'Info',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    bgColor: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-700',
  },
  normal: {
    icon: Bell,
    label: 'Normal',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    bgColor: 'bg-gray-50 border-gray-200',
    textColor: 'text-gray-700',
  },
  high: {
    icon: AlertTriangle,
    label: 'High',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    bgColor: 'bg-orange-50 border-orange-200',
    textColor: 'text-orange-700',
  },
  urgent: {
    icon: AlertCircle,
    label: 'Urgent',
    color: 'bg-red-100 text-red-800 border-red-200',
    bgColor: 'bg-red-50 border-red-200',
    textColor: 'text-red-700',
  },
}

interface DisplayAnnouncement {
  id: string
  title: string
  content: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  author_name: string
  created_at: string
  expires_at?: string | null
  is_feature_announcement?: boolean
  feature_icon?: typeof Bell
}

const PLATFORM_ANNOUNCEMENTS: DisplayAnnouncement[] = getAllAnnouncements()

export default function AnnouncementsPage() {
  const router = useRouter()
  const { status } = useSession()
  const [visibleCount, setVisibleCount] = useState(6)
  const [cmsAnnouncements, setCmsAnnouncements] = useState<DisplayAnnouncement[]>([])

  useEffect(() => {
    if (status !== 'authenticated') {
      setCmsAnnouncements([])
      return
    }

    let cancelled = false
    fetch('/api/announcements/dashboard')
      .then((response) => (response.ok ? response.json() : { announcements: [] }))
      .then((data) => {
        if (!cancelled) {
          setCmsAnnouncements(data.announcements || [])
        }
      })
      .catch((error) => {
        console.error('Error fetching personal announcements:', error)
      })

    return () => {
      cancelled = true
    }
  }, [status])

  const sortedAnnouncements = useMemo(() => {
    const platformIds = new Set(PLATFORM_ANNOUNCEMENTS.map((item) => item.id))
    const extraCms = cmsAnnouncements.filter((item) => !platformIds.has(item.id))
    return [...PLATFORM_ANNOUNCEMENTS, ...extraCms].sort(compareAnnouncementsByDateDesc)
  }, [cmsAnnouncements])

  const getPriorityConfig = (priority: string) => {
    return PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal
  }

  const visibleAnnouncements = sortedAnnouncements.slice(0, visibleCount)
  const hasMore = visibleCount < sortedAnnouncements.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl">
        <div className="text-center sm:text-left mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-purple-100 rounded-full mb-4">
            <Bell className="h-7 w-7 sm:h-8 sm:w-8 text-purple-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            Announcements
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto sm:mx-0">
            Stay updated with the latest features, improvements, and news from the Bleepy platform
          </p>
        </div>

        <div className="max-w-3xl mx-auto sm:max-w-none mb-8 sm:mb-12">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-purple-100 shadow-lg p-4 sm:p-6 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 text-center sm:text-left">
              <div className="p-2.5 sm:p-3 bg-purple-100 rounded-2xl text-purple-700 shrink-0">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm uppercase tracking-wide text-purple-600 font-semibold">
                  16 Aug 2026 • Foundation Year
                </p>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-0.5">
                  New Foundation Year On-call Guides
                </h2>
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed text-center sm:text-left">
              Public FY guides now cover chest pain, hypotension, GCS, hyponatraemia, breathlessness, seizures and
              tachycardia. Signed-in Basildon doctors also have hypoglycaemia, DKA, upper GI bleed and bradycardia.
              Articles are easier to scan, with search and links between related topics.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
              <Button asChild className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white">
                <Link href="/guides/foundation-year">View FY guides</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto border-purple-200 bg-white text-gray-900 hover:bg-purple-50 hover:text-gray-900 hover:border-purple-300"
              >
                <Link href="/guides/foundation-year/on-calls">On-call guides</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {visibleAnnouncements.map((announcement) => {
            const priorityConfig = getPriorityConfig(announcement.priority)
            const FeatureIcon = announcement.feature_icon || priorityConfig.icon
            const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date()

            return (
              <Card
                key={announcement.id}
                className={`${priorityConfig.bgColor} hover:shadow-lg transition-shadow duration-300 min-w-0 ${
                  isExpired ? 'opacity-60' : ''
                }`}
              >
                <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <FeatureIcon className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 ${priorityConfig.textColor}`} />
                      <Badge className={`${priorityConfig.color} text-xs`}>
                        {priorityConfig.label}
                      </Badge>
                      {announcement.is_feature_announcement && (
                        <Badge variant="outline" className="text-xs">
                          New Feature
                        </Badge>
                      )}
                      {isExpired && (
                        <Badge variant="outline" className="text-xs">
                          Expired
                        </Badge>
                      )}
                    </div>
                    <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                  </div>
                  <CardTitle className={`text-base sm:text-lg leading-snug break-words ${priorityConfig.textColor}`}>
                    {announcement.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <div
                    className={`announcement-content text-sm ${priorityConfig.textColor} mb-4 whitespace-pre-line break-words`}
                    dangerouslySetInnerHTML={{ __html: announcement.content }}
                  />
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1 min-w-0">
                      <User className="h-3 w-3 shrink-0" />
                      <span className="truncate">{announcement.author_name}</span>
                    </div>
                    <span className="shrink-0">{formatAnnouncementDate(announcement.created_at)}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {hasMore && (
          <div className="text-center mt-8 sm:mt-12 px-4">
            <Button
              onClick={() => setVisibleCount((prev) => prev + 6)}
              variant="outline"
              className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg font-medium bg-white hover:bg-gray-50 border-2 border-purple-200 hover:border-purple-300 text-purple-700 hover:text-purple-800"
            >
              Load More Announcements
              <ArrowLeft className="h-5 w-5 ml-2 rotate-90" />
            </Button>
            <p className="text-xs sm:text-sm text-gray-500 mt-3">
              Showing {Math.min(visibleCount, sortedAnnouncements.length)} of {sortedAnnouncements.length} announcements
            </p>
          </div>
        )}

        <div className="text-center mt-10 sm:mt-16">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 mx-auto text-gray-900 hover:text-gray-900 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
