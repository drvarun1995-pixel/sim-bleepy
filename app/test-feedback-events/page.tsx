'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function TestFeedbackEvents() {
  const [selectedDate, setSelectedDate] = useState('2025-10-26')
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const testDate = async () => {
    setLoading(true)
    try {
      console.log('Testing date:', selectedDate)
      
      // Test the events API
      const response = await fetch(`/api/events/date/${selectedDate}`)
      const data = await response.json()
      
      console.log('API Response:', data)
      setEvents(data.events || [])
      
      // Test the debug API
      const debugResponse = await fetch('/api/events/debug-booking-enabled')
      const debugData = await debugResponse.json()
      setDebugInfo(debugData)
      
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Feedback Events</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Date Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="date">Test Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-48"
              />
            </div>
            <Button onClick={testDate} disabled={loading}>
              {loading ? 'Testing...' : 'Test Date'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Events Found ({events.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="p-3 border rounded">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm text-gray-600">
                    Date: {event.date} | Time: {event.startTime} - {event.endTime}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No events found for this date</p>
          )}
        </CardContent>
      </Card>

      {debugInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>Total Events: {debugInfo.summary?.totalEvents}</div>
              <div>Events with Booking Enabled: {debugInfo.summary?.eventsWithBookingEnabled}</div>
              <div>Events without Booking Enabled: {debugInfo.summary?.eventsWithoutBookingEnabled}</div>
            </div>
            
            {debugInfo.eventsWithBookingEnabled && debugInfo.eventsWithBookingEnabled.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Events with Booking Enabled:</h3>
                <div className="space-y-1">
                  {debugInfo.eventsWithBookingEnabled.map((event: any) => (
                    <div key={event.id} className="text-sm p-2 bg-green-50 rounded">
                      {event.title} - {event.date} ({event.status})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
