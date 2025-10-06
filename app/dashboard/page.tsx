'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getEvents } from '@/lib/events-api'
import { filterEventsByProfile, getTodayEvents, getThisWeekEvents, getThisMonthEvents, getUpcomingEvents, sortEventsByDate } from '@/lib/event-filtering'
import { ProfileIncompleteAlert } from '@/components/dashboard/ProfileIncompleteAlert'
import { TodayEvents } from '@/components/dashboard/TodayEvents'
import { WeeklyEvents } from '@/components/dashboard/WeeklyEvents'
import { PersonalizedCalendar } from '@/components/dashboard/PersonalizedCalendar'
import { QuickStats } from '@/components/dashboard/QuickStats'
import { Button } from '@/components/ui/button'
import { Sparkles, Calendar, Stethoscope, BarChart3, Trophy, Settings } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  name: string
  role: string
  role_type?: string
  university?: string
  study_year?: string
  foundation_year?: string
  hospital_trust?: string
  specialty?: string
  profile_completed?: boolean
  interests?: string[]
  show_all_events?: boolean
}

interface Event {
  id: string
  title: string
  description?: string
  date: string
  startTime: string
  endTime: string
  location?: string
  categories?: Array<{ id: string; name: string; color?: string }>
  format?: string
  formatColor?: string
  [key: string]: any
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [allEvents, setAllEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch user profile and events
  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch user profile
      const profileResponse = await fetch('/api/user/profile')
      const profileData = await profileResponse.json()
      
      if (profileData.user) {
        setUserProfile(profileData.user)
      }

      // Fetch all events
      const eventsData = await getEvents()
      
      // Transform events to match interface
      const transformedEvents = eventsData.map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        date: event.date,
        startTime: event.start_time || '',
        endTime: event.end_time || '',
        location: event.location_name || '',
        categories: event.categories || [],
        category: event.category_name || '',
        format: event.format_name || '',
        formatColor: event.format_color || '',
        isAllDay: event.is_all_day || false,
        hideTime: event.hide_time || false,
        hideEndTime: event.hide_end_time || false,
        timeNotes: event.time_notes || '',
        hideLocation: event.hide_location || false,
        organizer: event.organizer_name || '',
        hideOrganizer: event.hide_organizer || false,
        speakers: event.speakers ? event.speakers.map((s: any) => s.name).join(', ') : '',
        hideSpeakers: event.hide_speakers || false,
        attendees: event.attendees || 0,
        status: event.status || 'published',
        eventLink: event.event_link,
        moreInfoLink: event.more_info_link,
        moreInfoTarget: event.more_info_target,
        eventStatus: event.event_status,
        author: event.author_name || 'Unknown'
      }))

      setAllEvents(transformedEvents)

      // Filter events based on user profile
      if (profileData.user && profileData.user.profile_completed) {
        const filtered = filterEventsByProfile(transformedEvents, profileData.user)
        setFilteredEvents(filtered)
      } else {
        // If profile not completed, show all events
        setFilteredEvents(transformedEvents)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!session?.user) {
    return <div>Please sign in to access the dashboard.</div>
  }

  // Get today's, weekly, monthly, and upcoming events
  const sortedEvents = sortEventsByDate(filteredEvents)
  const upcomingEvents = getUpcomingEvents(sortedEvents)
  const todayEvents = getTodayEvents(sortedEvents) // Show all events for today, including expired
  const weekEvents = getThisWeekEvents(upcomingEvents)
  const thisMonthEvents = getThisMonthEvents(upcomingEvents)

  // Get user display name and title
  const getUserTitle = () => {
    if (!userProfile?.profile_completed || !userProfile?.role_type) {
      return ''
    }

    const parts: string[] = []
    
    // Add year and university for students
    if (userProfile.role_type === 'medical_student' && userProfile.study_year && userProfile.university) {
      parts.push(`Year ${userProfile.study_year}`)
      parts.push(userProfile.university)
      parts.push('Medical Student')
    }
    // Add foundation year for FY doctors
    else if (userProfile.role_type === 'foundation_doctor' && userProfile.foundation_year) {
      parts.push(userProfile.foundation_year)
      parts.push('Foundation Doctor')
    }
    // Add role name for others
    else {
      const roleName = userProfile.role_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      parts.push(roleName)
    }

    return parts.join(' - ')
  }

  const quickLinks = [
    {
      title: 'Calendar',
      description: 'View all upcoming events',
      icon: Calendar,
      href: '/calendar',
      color: 'bg-blue-500'
    },
    {
      title: 'Stations',
      description: 'Practice with AI patients',
      icon: Stethoscope,
      href: '/stations',
      color: 'bg-purple-500'
    },
    {
      title: 'Overview',
      description: 'View your performance',
      icon: BarChart3,
      href: '/dashboard/overview',
      color: 'bg-green-500'
    },
    {
      title: 'Gamification',
      description: 'Track achievements',
      icon: Trophy,
      href: '/dashboard/gamification',
      color: 'bg-yellow-500'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Profile Incomplete Alert */}
      {!userProfile?.profile_completed && <ProfileIncompleteAlert />}

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-6 w-6" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                Welcome back, {session.user.name || 'User'}!
              </h1>
            </div>
            {getUserTitle() && (
              <p className="text-purple-100 text-sm sm:text-base md:text-lg font-medium">
                {getUserTitle()}
              </p>
            )}
            <p className="text-purple-200 text-xs sm:text-sm md:text-base mt-2">
              {userProfile?.profile_completed 
                ? 'Here are your personalized events and training sessions'
                : 'Complete your profile to see personalized recommendations'}
            </p>
          </div>
          {!userProfile?.profile_completed && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/onboarding/profile')}
              className="hidden sm:flex"
            >
              <Settings className="h-4 w-4 mr-2" />
              Complete Profile
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStats
        todayCount={todayEvents.length}
        weekCount={weekEvents.length}
        monthCount={thisMonthEvents.length}
        upcomingCount={upcomingEvents.length}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Today's Events */}
        <div className="lg:col-span-2 space-y-6">
          <TodayEvents events={todayEvents} loading={loading} />
          
          {/* Quick Links */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Access</h2>
            <div className="grid grid-cols-2 gap-4">
              {quickLinks.map((link) => (
                <a
                  key={link.title}
                  href={link.href}
                  className="group bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-purple-300"
                >
                  <div className={`${link.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                    <link.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {link.title}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {link.description}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Weekly Events & Calendar */}
        <div className="space-y-6">
          <WeeklyEvents events={weekEvents} loading={loading} />
          <PersonalizedCalendar events={upcomingEvents} />
        </div>
      </div>

      {/* Profile Personalization Tips */}
      {userProfile?.profile_completed && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-green-900 mb-1">
                Your Dashboard is Personalized!
              </h3>
              <p className="text-sm text-green-800 mb-3">
                You're seeing events specifically for {getUserTitle()}. 
                {userProfile.interests && userProfile.interests.length > 0 && 
                  ` We're also prioritizing content matching your ${userProfile.interests.length} selected interests.`
                }
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/${userProfile.role}/profile`)}
                  className="bg-white text-xs"
                >
                  Update Preferences
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/calendar')}
                  className="bg-white text-xs"
                >
                  View All Events
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}