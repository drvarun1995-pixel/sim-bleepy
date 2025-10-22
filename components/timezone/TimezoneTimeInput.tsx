'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Clock, AlertTriangle } from 'lucide-react'
import { adjustEventTimeForDST, formatDateWithTimezone, getUKTimezoneInfo } from '@/lib/timezone-utils'

interface TimezoneTimeInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  date: string // Event date in YYYY-MM-DD format
  className?: string
}

export function TimezoneTimeInput({ label, value, onChange, date, className }: TimezoneTimeInputProps) {
  const [timezoneInfo, setTimezoneInfo] = useState(getUKTimezoneInfo())
  const [warning, setWarning] = useState<string | null>(null)

  useEffect(() => {
    // Check for DST warnings when time or date changes
    if (value && date) {
      const eventDate = new Date(date)
      const result = adjustEventTimeForDST(eventDate, value)
      setWarning(result.warning || null)
    } else {
      setWarning(null)
    }
  }, [value, date])

  useEffect(() => {
    // Update timezone info every minute
    const interval = setInterval(() => {
      setTimezoneInfo(getUKTimezoneInfo())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className={className}>
      <Label htmlFor={`time-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        {label}
        <Badge variant="outline" className="ml-2 text-xs">
          {timezoneInfo.timezone}
        </Badge>
      </Label>
      <div className="flex items-center gap-2">
        <Input
          id={`time-${label.toLowerCase().replace(/\s+/g, '-')}`}
          type="time"
          value={value}
          onChange={handleTimeChange}
          className="flex-1"
        />
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>UK Time</span>
        </div>
      </div>
      
      {warning && (
        <Alert className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">{warning}</AlertDescription>
        </Alert>
      )}
      
      {value && date && (
        <div className="mt-1 text-xs text-gray-600">
          <span>Event time: {formatDateWithTimezone(new Date(`${date}T${value}`), false)}</span>
        </div>
      )}
    </div>
  )
}

interface TimezoneDateTimeDisplayProps {
  date: string
  time: string
  timezone?: string
}

export function TimezoneDateTimeDisplay({ date, time, timezone }: TimezoneDateTimeDisplayProps) {
  const [timezoneInfo, setTimezoneInfo] = useState(getUKTimezoneInfo())

  useEffect(() => {
    const interval = setInterval(() => {
      setTimezoneInfo(getUKTimezoneInfo())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  if (!date || !time) return null

  const eventDateTime = new Date(`${date}T${time}`)
  const formattedDateTime = formatDateWithTimezone(eventDateTime, true)

  return (
    <div className="flex items-center gap-2 text-sm">
      <Clock className="h-4 w-4 text-gray-500" />
      <span className="font-medium">{formattedDateTime}</span>
      {timezone && (
        <Badge variant="outline" className="text-xs">
          {timezone}
        </Badge>
      )}
    </div>
  )
}



