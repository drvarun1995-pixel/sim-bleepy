'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Event {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  location?: string
  categories?: Array<{ id: string; name: string; color?: string }>
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

  const formatTime = (time: string) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>This Week</span>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            {events.length} upcoming
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {events.slice(0, 8).map((event) => (
            <div
              key={event.id}
              className="group p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 cursor-pointer"
              onClick={() => router.push(`/events/${event.id}`)}
            >
              <div className="flex items-start gap-3">
                {/* Date Badge */}
                <div className="flex-shrink-0 w-16 text-center">
                  <div className="text-xs font-semibold text-blue-600">
                    {getDateLabel(event.date)}
                  </div>
                  {event.startTime && (
                    <div className="text-xs text-gray-600">
                      {formatTime(event.startTime)}
                    </div>
                  )}
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors truncate">
                    {event.title}
                  </h4>
                  {event.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>

                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
        {events.length > 8 && (
          <Button
            variant="ghost"
            className="w-full mt-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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
