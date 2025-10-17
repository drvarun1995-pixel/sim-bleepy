'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, ArrowRight, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { EventStatusBadge } from '@/components/EventStatusBadge'
import { mapCategoriesForDashboard } from '@/lib/category-mapping'
import { CountdownTimer } from '@/components/ui/CountdownTimer'

interface Event {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  location?: string
  categories?: Array<{ id: string; name: string; color?: string }>
  format?: string
  formatColor?: string
  eventStatus?: 'scheduled' | 'rescheduled' | 'postponed' | 'cancelled' | 'moved-online'
}

interface TodayEventsProps {
  events: Event[]
  loading?: boolean
}

export function TodayEvents({ events, loading }: TodayEventsProps) {
  const router = useRouter()

  const formatTime = (time: string) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Today's Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
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
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Today's Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-4">No events scheduled for today</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/calendar')}
            >
              View Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Today's Events
          </div>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.slice(0, 5).map((event, index) => (
            <div
              key={event.id}
              className="group p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => router.push(`/events/${event.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {event.startTime && (
                      <div className="flex items-center gap-2 text-purple-600 font-semibold text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatTime(event.startTime)}</span>
                        </div>
                        <CountdownTimer 
                          startDate={event.date}
                          startTime={event.startTime}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                      {event.title}
                    </h3>
                    <EventStatusBadge status={event.eventStatus || 'scheduled'} className="text-xs" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    {event.location && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <div className="p-1 rounded bg-orange-50 flex-shrink-0">
                          <MapPin className="h-3 w-3 text-orange-600" />
                        </div>
                        <span className="font-medium break-words min-w-0">{event.location}</span>
                      </div>
                    )}
                    {(() => {
                      const mappedEventCategories = mapCategoriesForDashboard(event.categories || [])
                      return mappedEventCategories.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {mappedEventCategories.map((category) => (
                            <Badge
                              key={`${event.id}-${category.id}`}
                              variant="outline"
                              className="text-xs"
                              style={{
                                backgroundColor: category.color ? `${category.color}20` : undefined,
                                borderColor: category.color || undefined,
                                color: category.color || undefined
                              }}
                            >
                              {category.name}
                            </Badge>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
        {events.length > 5 && (
          <Button
            variant="ghost"
            className="w-full mt-3 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            onClick={() => router.push('/calendar')}
          >
            View all {events.length} events
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
