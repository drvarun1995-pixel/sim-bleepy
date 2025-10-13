'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Event {
  id: string
  title: string
  date: string
  startTime?: string
  endTime?: string
  location?: string
  format?: string
  formatColor?: string
  categories?: Array<{ id: string; name: string; color?: string }>
  [key: string]: any
}

interface PersonalizedCalendarProps {
  events: Event[]
}

export function PersonalizedCalendar({ events }: PersonalizedCalendarProps) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [isAnimating, setIsAnimating] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get first day of month and total days
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  // Create array of dates for the calendar
  const days = useMemo(() => {
    const daysArray: (Date | null)[] = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      daysArray.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      daysArray.push(new Date(year, month, day))
    }
    
    return daysArray
  }, [year, month, daysInMonth, startingDayOfWeek])

  // Map of dates with events
  const eventsByDate = useMemo(() => {
    const map = new Map<string, number>()
    events.forEach(event => {
      const dateKey = new Date(event.date).toDateString()
      map.set(dateKey, (map.get(dateKey) || 0) + 1)
    })
    return map
  }, [events])

  const hasEvents = (date: Date | null) => {
    if (!date) return false
    return eventsByDate.has(date.toDateString())
  }

  const getEventCount = (date: Date | null) => {
    if (!date) return 0
    return eventsByDate.get(date.toDateString()) || 0
  }

  const isToday = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const getSelectedDateEvents = () => {
    if (!selectedDate) return []
    const dateKey = selectedDate.toDateString()
    return events
      .filter(event => new Date(event.date).toDateString() === dateKey)
      .sort((a, b) => {
        // Sort by start time
        const timeA = a.startTime || '00:00';
        const timeB = b.startTime || '00:00';
        return timeA.localeCompare(timeB);
      })
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ""
    const time = new Date(`2000-01-01T${timeString}`)
    return time.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    })
  }

  const isLightColor = (hex: string): boolean => {
    if (!hex || !hex.startsWith('#')) return false
    const color = hex.replace('#', '')
    const r = parseInt(color.substr(0, 2), 16)
    const g = parseInt(color.substr(2, 2), 16)
    const b = parseInt(color.substr(4, 2), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 155
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-base">Your Events Calendar</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/calendar')}
            className="text-xs"
          >
            Full View
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-sm font-semibold text-gray-900">{monthName}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {days.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="aspect-square" />
            }

            const hasEvent = hasEvents(day)
            const eventCount = getEventCount(day)
            const today = isToday(day)

            return (
              <div
                key={day.toISOString()}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all cursor-pointer ${
                  selectedDate && day.toDateString() === selectedDate.toDateString()
                    ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-300'
                    : today
                    ? 'bg-purple-600 text-white font-bold'
                    : hasEvent
                    ? 'bg-purple-100 text-purple-900 font-semibold hover:bg-purple-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => {
                  setIsAnimating(true)
                  setSelectedDate(day)
                  setTimeout(() => setIsAnimating(false), 400)
                }}
              >
                <span>{day.getDate()}</span>
                {hasEvent && !today && !(selectedDate && day.toDateString() === selectedDate.toDateString()) && (
                  <div className="flex justify-center gap-0.5 mt-0.5">
                    {Array.from({ length: Math.min(eventCount, 3) }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 h-1 rounded-full bg-purple-600"
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-purple-600"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-purple-100 border border-purple-300"></div>
            <span>Has Events</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-600 ring-2 ring-blue-300"></div>
            <span>Selected</span>
          </div>
        </div>

        {/* Selected Date Events */}
        {selectedDate && (
          <div className={`mt-4 border-t pt-4 transition-all duration-400 ${
            isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
          }`}>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Events on {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </h4>
            {getSelectedDateEvents().length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No events scheduled</p>
            ) : (
              <div className="space-y-2">
                {getSelectedDateEvents().map((event, index) => (
                  <div
                    key={event.id}
                    className={`p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-all duration-300 ${
                      isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
                    }`}
                    style={{
                      transitionDelay: isAnimating ? '0ms' : `${index * 50}ms`
                    }}
                    onClick={() => router.push(`/events/${event.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h5 className="text-sm font-semibold text-gray-900 flex-1 line-clamp-2">
                        {event.title}
                      </h5>
                      {event.format && (
                        <span
                          className="text-xs px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0"
                          style={{
                            backgroundColor: event.formatColor || '#D1D5DB',
                            color: event.formatColor && isLightColor(event.formatColor) ? '#111827' : '#FFFFFF'
                          }}
                        >
                          {event.format}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {event.startTime && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span>{formatTime(event.startTime)}{event.endTime ? ` - ${formatTime(event.endTime)}` : ''}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                    {event.categories && event.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {event.categories.slice(0, 2).map((cat: any) => (
                          <span
                            key={cat.id}
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: cat.color || '#F3F4F6',
                              color: cat.color && isLightColor(cat.color) ? '#111827' : '#FFFFFF'
                            }}
                          >
                            {cat.name}
                          </span>
                        ))}
                        {event.categories.length > 2 && (
                          <span className="text-xs text-gray-500">+{event.categories.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3"
              onClick={() => router.push('/calendar')}
            >
              View Full Calendar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
