'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Lock,
  Sparkles,
} from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

interface PublicAnnouncement {
  id: string
  title: string
  content: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  author_name: string
  created_at: string
  expires_at: string | null
  is_feature_announcement?: boolean
}

const PRIORITY_CONFIG = {
  low: {
    icon: Info,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    bgColor: 'bg-slate-50 border-slate-200',
    textColor: 'text-slate-700'
  },
  normal: {
    icon: Bell,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    bgColor: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-700'
  },
  high: {
    icon: AlertTriangle,
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    bgColor: 'bg-amber-50 border-amber-200',
    textColor: 'text-amber-700'
  },
  urgent: {
    icon: AlertCircle,
    color: 'bg-red-100 text-red-700 border-red-200',
    bgColor: 'bg-red-50 border-red-200',
    textColor: 'text-red-700'
  }
}

export default function BleepyAnnouncementsPage() {
  const { data: session, status } = useSession()
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPublicAnnouncements()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status])

  const fetchPublicAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements/public')
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.announcements || [])
      }
    } catch (error) {
      console.error('Error fetching public announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex items-center justify-center py-16 sm:py-20">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex items-center justify-center py-12 sm:py-20">
            <Card className="max-w-md w-full mx-auto">
              <CardHeader className="text-center px-4 sm:px-6">
                <div className="mx-auto mb-4 w-14 h-14 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <Lock className="h-7 w-7 sm:h-8 sm:w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">Sign In Required</CardTitle>
                <CardDescription className="text-gray-600 text-sm sm:text-base">
                  You need to be signed in to view announcements.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-6">
                <Button
                  onClick={() => router.push('/auth/signin')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Sign In
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="w-full text-gray-900 hover:text-gray-900 hover:bg-gray-50"
                >
                  Go Back
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4 sm:mb-6 flex items-center gap-2 text-gray-700 hover:text-gray-900 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span>Back</span>
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-100 mx-auto sm:mx-0">
              <Bell className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600" />
            </div>
            <div className="text-center sm:text-left min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                Bleepy Announcements
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1.5 sm:mt-2 max-w-2xl mx-auto sm:mx-0">
                Stay updated with the latest features, improvements, and news from Bleepy
              </p>
            </div>
          </div>
        </div>

        {/* Featured update */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-purple-100 p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 text-center sm:text-left">
              <div className="p-2.5 sm:p-3 rounded-xl bg-purple-100 text-purple-700 shrink-0">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm uppercase tracking-wide text-purple-600 font-semibold">
                  7 Aug 2026 • Platform refresh
                </p>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-0.5">
                  Homepage, Animations & Mobile Navigation
                </h2>
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed text-center sm:text-left">
              We&apos;ve refreshed the public homepage with Bleepy branding and smoother animations, improved the top
              menu on phones and tablets, and fixed overlap between the global navigation and Dashboard welcome header
              when you&apos;re logged in.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
              <Button asChild className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white">
                <Link href="/">View the homepage</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto border-purple-200 bg-white text-gray-900 hover:bg-purple-50 hover:text-gray-900 hover:border-purple-300"
              >
                <Link href="/games/help">Read the help guide</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Announcements Grid */}
        {announcements.length === 0 ? (
          <div className="text-center py-12 sm:py-20 px-4">
            <Bell className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No announcements yet</h3>
            <p className="text-sm sm:text-base text-gray-600">Check back later for updates!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {announcements.map((announcement) => {
              const config = PRIORITY_CONFIG[announcement.priority]
              const IconComponent = config.icon
              const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date()

              return (
                <Card
                  key={announcement.id}
                  className={`${config.bgColor} ${config.textColor} hover:shadow-lg transition-shadow duration-200 min-w-0 ${
                    isExpired ? 'opacity-60' : ''
                  }`}
                >
                  <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                      <Badge className={`${config.color} text-xs sm:text-sm font-medium`}>
                        {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
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
                    <CardTitle className="text-base sm:text-lg leading-snug break-words">
                      {announcement.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <div
                      className="announcement-content text-sm leading-relaxed mb-4 line-clamp-6 sm:line-clamp-4 break-words overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: announcement.content }}
                    />
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs opacity-75">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <User className="h-3 w-3 shrink-0" />
                          <span className="truncate">{announcement.author_name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(announcement.created_at), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      {announcement.expires_at && (
                        <div className="text-xs opacity-60 shrink-0">
                          Expires {format(new Date(announcement.expires_at), 'MMM d')}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
