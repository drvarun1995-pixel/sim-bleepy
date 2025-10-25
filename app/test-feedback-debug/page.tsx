'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestFeedbackDebug() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testEventLookup = async () => {
    setLoading(true)
    try {
      // First, get events for today
      const eventsResponse = await fetch('/api/events/date/2025-10-26')
      const eventsData = await eventsResponse.json()
      
      console.log('Events from date API:', eventsData)
      
      if (eventsData.events && eventsData.events.length > 0) {
        const eventIds = eventsData.events.map((e: any) => e.id)
        
        // Test the feedback forms API lookup
        const testResponse = await fetch('/api/feedback/forms/test-event-lookup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ eventIds })
        })
        
        const testData = await testResponse.json()
        console.log('Test lookup result:', testData)
        setTestResult(testData)
      } else {
        setTestResult({ error: 'No events found for date' })
      }
    } catch (error) {
      console.error('Test error:', error)
      setTestResult({ error: error instanceof Error ? error.message : String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Feedback Debug Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Event Lookup</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testEventLookup} disabled={loading}>
            {loading ? 'Testing...' : 'Test Event Lookup'}
          </Button>
        </CardContent>
      </Card>

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Test Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
