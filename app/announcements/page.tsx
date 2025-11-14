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
  Music2,
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
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    )
  }

  // Redirect to sign in if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Card className="max-w-md w-full">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <Lock className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Sign In Required</CardTitle>
                <CardDescription className="text-gray-600">
                  You need to be signed in to view announcements.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => router.push('/auth/signin')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Sign In
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.back()}
                  className="w-full"
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center space-x-3">
                <Bell className="h-10 w-10 text-purple-600" />
                <span>Bleepy Announcements</span>
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Stay updated with the latest features, improvements, and news from Bleepy
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-100 text-purple-700">
                <Music2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-wide text-purple-600 font-semibold">Games hub</p>
                <h2 className="text-2xl font-bold text-gray-900">Practice, Challenge, Campaigns & Stats</h2>
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              The redesigned /games hub now spotlights solo practice, multiplayer challenges with background music, long-form
              campaigns, refreshed leaderboards, and a stats page that explains exactly how XP and public profiles work.
              Use it as your launchpad for every quiz mode.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
                <Link href="/games">Explore the games hub</Link>
              </Button>
              <Button asChild variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                <Link href="/games/help">Read the help guide</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Announcements Grid */}
        {announcements.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No announcements yet</h3>
            <p className="text-gray-600">Check back later for updates!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {announcements.map((announcement) => {
              const config = PRIORITY_CONFIG[announcement.priority]
              const IconComponent = config.icon
              const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date()

              return (
                <Card 
                  key={announcement.id} 
                  className={`${config.bgColor} ${config.textColor} hover:shadow-lg transition-shadow duration-200 ${
                    isExpired ? 'opacity-60' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3 mb-2">
                      <IconComponent className="h-5 w-5" />
                      <Badge className={`${config.color} text-sm font-medium`}>
                        {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                      </Badge>
                      {announcement.is_feature_announcement && (
                        <Badge variant="outline" className="text-xs">
                          🎉 New Feature
                        </Badge>
                      )}
                      {isExpired && (
                        <Badge variant="outline" className="text-xs">
                          Expired
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg leading-tight">
                      {announcement.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed mb-4 line-clamp-4">
                      {announcement.content}
                    </p>
                    <div className="flex items-center justify-between text-xs opacity-75">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{announcement.author_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(announcement.created_at), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      {announcement.expires_at && (
                        <div className="text-xs opacity-60">
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
