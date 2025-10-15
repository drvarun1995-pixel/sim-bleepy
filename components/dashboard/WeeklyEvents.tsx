'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { EventStatusBadge } from '@/components/EventStatusBadge'
import { mapCategoriesForDashboard } from '@/lib/category-mapping'

interface Event {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  location?: string
  categories?: Array<{ id: string; name: string; color?: string }>
  eventStatus?: 'scheduled' | 'rescheduled' | 'postponed' | 'cancelled' | 'moved-online'
}

interface WeeklyEventsProps {
  events: Event[]
  loading?: boolean
}

export function WeeklyEvents({ events, loading }: WeeklyEventsProps) {
  const router = useRouter()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ''
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes}${ampm}`
  }

  const isToday = (dateString: string) => {
    const today = new Date()
    const eventDate = new Date(dateString)
    return today.toDateString() === eventDate.toDateString()
  }

  const isTomorrow = (dateString: string) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const eventDate = new Date(dateString)
    return tomorrow.toDateString() === eventDate.toDateString()
  }

  const getDateLabel = (dateString: string) => {
    if (isToday(dateString)) return 'Today'
    if (isTomorrow(dateString)) return 'Tomorrow'
    return formatDate(dateString)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-4">No events this week</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/calendar')}
            >
              Browse All Events
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-purple-100">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b-2 border-purple-100">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            <span className="text-gray-900">This Week</span>
          </div>
          <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm">
            {events.length} upcoming
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {events.slice(0, 8).map((event, index) => (
            <div
              key={event.id}
              className="group relative p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
              onClick={() => router.push(`/events/${event.id}`)}
            >
              {/* Gradient accent on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative flex items-start gap-3">
                {/* Date Badge */}
                <div className="flex-shrink-0 w-16 text-center">
                  <div className="text-xs font-semibold text-blue-600">
                    {getDateLabel(event.date)}
                  </div>
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className="font-bold text-gray-900 text-sm group-hover:text-purple-600 transition-colors leading-relaxed">
                      {event.title}
                    </h4>
                    <EventStatusBadge status={event.eventStatus || 'scheduled'} className="text-xs" />
                  </div>
                  
                  {/* Date, Time, and Location with consistent styling */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                    {event.startTime && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <div className="p-1 rounded bg-green-50 flex-shrink-0">
                          <Clock className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="font-medium whitespace-nowrap">{formatTime(event.startTime)}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <div className="p-1 rounded bg-orange-50 flex-shrink-0">
                          <MapPin className="h-3 w-3 text-orange-600" />
                        </div>
                        <span className="font-medium break-words min-w-0">{event.location}</span>
                      </div>
                    )}
                    {event.categories && event.categories.length > 0 && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                        <div className="flex flex-wrap gap-1">
                          {mapCategoriesForDashboard(event.categories || []).map((category) => (
                            <Badge
                              key={`${event.id}-${category.id}`}
                              variant="outline"
                              className="text-[10px] px-2 py-0.5 font-medium"
                              style={{
                                backgroundColor: category.color ? `${category.color}15` : undefined,
                                borderColor: category.color || undefined,
                                color: category.color || undefined
                              }}
                            >
                              {category.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
              </div>
            </div>
          ))}
        </div>
        {events.length > 8 && (
          <Button
            variant="outline"
            className="w-full mt-4 border-2 border-purple-300 text-purple-700 hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600 hover:text-white hover:border-purple-600 transition-all shadow-sm hover:shadow-md"
            onClick={() => router.push('/events-list')}
          >
            View all {events.length} events
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
