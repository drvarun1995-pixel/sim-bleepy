'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X, 
  ChevronDown, 
  ChevronUp,
  Clock,
  User,
  Eye,
  EyeOff
} from 'lucide-react'
import { format } from 'date-fns'

interface Announcement {
  id: string
  title: string
  content: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  author_name: string
  created_at: string
  expires_at: string | null
}

interface AnnouncementsWidgetProps {
  className?: string
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

export function AnnouncementsWidget({ className }: AnnouncementsWidgetProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<Set<string>>(new Set())
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set())
  const [showDismissed, setShowDismissed] = useState(false)
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    fetchAnnouncements()
    fetchUserRole()
    fetchDismissedAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements/dashboard')
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.announcements || [])
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserRole(data.role || '')
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  const fetchDismissedAnnouncements = async () => {
    try {
      const response = await fetch('/api/user/dismissed-announcements')
      if (response.ok) {
        const data = await response.json()
        setDismissedAnnouncements(new Set(data.dismissedAnnouncements || []))
      }
    } catch (error) {
      console.error('Error fetching dismissed announcements:', error)
    }
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedAnnouncements)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedAnnouncements(newExpanded)
  }

  const dismissAnnouncement = async (id: string) => {
    try {
      // Optimistically update UI
      const newDismissed = new Set(dismissedAnnouncements)
      newDismissed.add(id)
      setDismissedAnnouncements(newDismissed)

      // Save to database
      const response = await fetch('/api/user/dismissed-announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ announcementId: id }),
      })

      if (!response.ok) {
        // Revert optimistic update on error
        const revertedDismissed = new Set(dismissedAnnouncements)
        setDismissedAnnouncements(revertedDismissed)
        console.error('Failed to dismiss announcement')
      }
    } catch (error) {
      // Revert optimistic update on error
      const revertedDismissed = new Set(dismissedAnnouncements)
      setDismissedAnnouncements(revertedDismissed)
      console.error('Error dismissing announcement:', error)
    }
  }

  // Filter announcements based on showDismissed state and expiration
  const now = new Date()
  const visibleAnnouncements = showDismissed 
    ? announcements.filter(announcement => 
        dismissedAnnouncements.has(announcement.id) &&
        // For admins, show all dismissed announcements (including expired)
        // For non-admins, only show non-expired dismissed announcements
        (userRole === 'admin' || !announcement.expires_at || new Date(announcement.expires_at) > now)
      )
    : announcements.filter(announcement => 
        !dismissedAnnouncements.has(announcement.id) &&
        // For active announcements, always filter by expiration for all users
        (!announcement.expires_at || new Date(announcement.expires_at) > now)
      )
  
  const hasActiveAnnouncements = announcements.some(announcement => 
    !dismissedAnnouncements.has(announcement.id) &&
    (!announcement.expires_at || new Date(announcement.expires_at) > now)
  )
  const hasDismissedAnnouncements = announcements.some(announcement => 
    dismissedAnnouncements.has(announcement.id) &&
    // For admins, count all dismissed announcements (including expired)
    // For non-admins, only count non-expired dismissed announcements
    (userRole === 'admin' || !announcement.expires_at || new Date(announcement.expires_at) > now)
  )

  if (loading) {
    return (
      <Card className={className} data-tour="announcements">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Announcements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Always show the widget, even if no announcements
  return (
    <Card className={className} data-tour="announcements">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <span>Announcements</span>
          <Badge variant="secondary" className="ml-auto">
            {visibleAnnouncements.length}
          </Badge>
        </CardTitle>
        {hasDismissedAnnouncements && (
          <div className="flex items-center justify-between">
            <CardDescription>
              {showDismissed ? 'Dismissed announcements' : 'Important updates and notifications for you'}
            </CardDescription>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDismissed(!showDismissed)}
              className="text-xs"
            >
              {showDismissed ? 'Show Active' : 'Show Dismissed'}
            </Button>
          </div>
        )}
        {!hasDismissedAnnouncements && (
          <CardDescription>
            Important updates and notifications for you
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleAnnouncements.length === 0 ? (
          <div className="text-center py-4">
            <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              {showDismissed ? 'No dismissed announcements' : 'No announcements'}
            </h3>
            <p className="text-xs text-gray-600">
              {showDismissed 
                ? 'You haven\'t dismissed any announcements yet.'
                : 'There are no announcements to display at the moment.'
              }
            </p>
          </div>
        ) : (
          visibleAnnouncements.map((announcement) => {
            const isExpanded = expandedAnnouncements.has(announcement.id)
            const config = PRIORITY_CONFIG[announcement.priority]
            const IconComponent = config.icon

            return (
              <div
                key={announcement.id}
                className={`p-3 rounded-lg border ${config.bgColor} ${config.textColor}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <IconComponent className="h-3 w-3" />
                      <Badge className={`${config.color} text-xs`}>
                        {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                      </Badge>
                      {announcement.expires_at && new Date(announcement.expires_at) < new Date() && (
                        <Badge variant="outline" className="text-xs">
                          Expired
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-xs mb-1">
                      {announcement.title}
                    </h3>
                    
                    <div className="flex items-center space-x-2 text-xs opacity-75">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{announcement.author_name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(announcement.created_at), 'MMM d')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 ml-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(announcement.id)}
                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>
                    {!showDismissed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissAnnouncement(announcement.id)}
                        className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Content */}
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-gray-200/50">
                    <div className="pt-3">
                      <div 
                        className="announcement-content text-xs text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: announcement.content }}
                      />
                      {userRole === 'admin' && announcement.expires_at && (
                        <div className="mt-3 pt-2 border-t border-gray-200/50">
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <Clock className="h-3 w-3" />
                            <span className="font-medium">Expires on:</span>
                            <span>{format(new Date(announcement.expires_at), 'MMMM d, yyyy')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}