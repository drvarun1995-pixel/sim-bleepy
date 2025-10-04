'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Event {
  id: string
  date: string
  [key: string]: any
}

interface PersonalizedCalendarProps {
  events: Event[]
}

export function PersonalizedCalendar({ events }: PersonalizedCalendarProps) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())

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
                  today
                    ? 'bg-purple-600 text-white font-bold'
                    : hasEvent
                    ? 'bg-purple-100 text-purple-900 font-semibold hover:bg-purple-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => router.push(`/calendar?date=${day.toISOString()}`)}
              >
                <span>{day.getDate()}</span>
                {hasEvent && !today && (
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
        </div>
      </CardContent>
    </Card>
  )
}
