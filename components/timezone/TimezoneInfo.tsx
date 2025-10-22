'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, AlertTriangle, Info } from 'lucide-react'
import { getTimezoneDisplayComponent, getUKTimezoneInfo } from '@/lib/timezone-utils'

export function TimezoneInfo() {
  const [timezoneInfo, setTimezoneInfo] = useState(getUKTimezoneInfo())
  const [displayInfo, setDisplayInfo] = useState(getTimezoneDisplayComponent())

  useEffect(() => {
    // Update timezone info every minute
    const interval = setInterval(() => {
      setTimezoneInfo(getUKTimezoneInfo())
      setDisplayInfo(getTimezoneDisplayComponent())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-4">
      {/* Current Timezone Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            UK Timezone Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{displayInfo.currentTimezone}</p>
              <p className="text-sm text-gray-600">
                UTC{timezoneInfo.offset >= 0 ? '+' : ''}{timezoneInfo.offset}
              </p>
            </div>
            <Badge variant={timezoneInfo.isDST ? 'default' : 'secondary'}>
              {timezoneInfo.timezone}
            </Badge>
          </div>
          
          {displayInfo.nextTransition && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <p className="text-sm text-blue-800">{displayInfo.nextTransition}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DST Warning */}
      {displayInfo.warning && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{displayInfo.warning}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export function TimezoneInfoCompact() {
  const [timezoneInfo, setTimezoneInfo] = useState(getUKTimezoneInfo())

  useEffect(() => {
    const interval = setInterval(() => {
      setTimezoneInfo(getUKTimezoneInfo())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Clock className="h-4 w-4" />
      <span>UK Time: {timezoneInfo.timezone}</span>
      <Badge variant="outline" className="text-xs">
        UTC{timezoneInfo.offset >= 0 ? '+' : ''}{timezoneInfo.offset}
      </Badge>
    </div>
  )
}




