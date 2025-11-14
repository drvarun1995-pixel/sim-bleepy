'use client'

import { useState } from 'react'
import Link from 'next/link'
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
  Sparkles,
  Zap,
  Shield,
  Search,
  Filter,
  Download,
  Upload
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getAllAnnouncements, type BleepyAnnouncement } from '@/lib/announcements'

const PRIORITY_CONFIG = {
  low: {
    icon: Info,
    label: 'Info',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    bgColor: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-700'
  },
  normal: {
    icon: Bell,
    label: 'Normal',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    bgColor: 'bg-gray-50 border-gray-200',
    textColor: 'text-gray-700'
  },
  high: {
    icon: AlertTriangle,
    label: 'High',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    bgColor: 'bg-orange-50 border-orange-200',
    textColor: 'text-orange-700'
  },
  urgent: {
    icon: AlertCircle,
    label: 'Urgent',
    color: 'bg-red-100 text-red-800 border-red-200',
    bgColor: 'bg-red-50 border-red-200',
    textColor: 'text-red-700'
  }
}

// Get all announcements from the shared utility
const BLEEPY_ANNOUNCEMENTS = getAllAnnouncements()

export default function BleepyAnnouncementsPage() {
  const router = useRouter()
  const [visibleCount, setVisibleCount] = useState(6)

  const getPriorityConfig = (priority: string) => {
    return PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal
  }

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 6)
  }

  const visibleAnnouncements = BLEEPY_ANNOUNCEMENTS.slice(0, visibleCount)
  const hasMore = visibleCount < BLEEPY_ANNOUNCEMENTS.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <Bell className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bleepy Announcements
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Stay updated with the latest features, improvements, and news from the Bleepy platform
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-12">
          <div className="bg-white rounded-2xl border border-purple-100 shadow-lg p-6 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-purple-100 rounded-2xl text-purple-700">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-wide text-purple-600 font-semibold">Fresh this week</p>
                <h2 className="text-2xl font-bold text-gray-900">Challenge Mode music & synced leaderboards</h2>
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Hosts can choose looping background music that follows every player from lobby to scoreboard, while each
              participant can mute or adjust the volume locally. We also clarified that a single public profile toggle
              now controls visibility on both simulator and quiz leaderboards across the site.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
                <Link href="/games/challenge">See the lobby update</Link>
              </Button>
              <Button asChild variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                <Link href="/profile">Review profile visibility</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Announcements Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleAnnouncements.map((announcement) => {
            const priorityConfig = getPriorityConfig(announcement.priority)
            const FeatureIcon = announcement.feature_icon
            
            return (
              <Card 
                key={announcement.id} 
                className={`${priorityConfig.bgColor} hover:shadow-lg transition-all duration-300 hover:scale-105`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <FeatureIcon className={`h-5 w-5 ${priorityConfig.textColor}`} />
                      <Badge className={`${priorityConfig.color} text-xs`}>
                        {priorityConfig.label}
                      </Badge>
                    </div>
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <CardTitle className={`text-lg ${priorityConfig.textColor}`}>
                    {announcement.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-sm ${priorityConfig.textColor} mb-4 whitespace-pre-line`}>
                    {announcement.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{announcement.author_name}</span>
                    </div>
                    <span>{new Date(announcement.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center mt-12">
            <Button 
              onClick={handleLoadMore}
              variant="outline"
              className="px-8 py-3 text-lg font-medium bg-white hover:bg-gray-50 border-2 border-purple-200 hover:border-purple-300 text-purple-700 hover:text-purple-800 transition-all duration-300"
            >
              Load More Announcements
              <ArrowLeft className="h-5 w-5 ml-2 rotate-90" />
            </Button>
            <p className="text-sm text-gray-500 mt-3">
              Showing {visibleCount} of {BLEEPY_ANNOUNCEMENTS.length} announcements
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex items-center space-x-2 mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
