'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface EventWithAutoCert {
  id: string
  title: string
  templateId: string
  bookingsCount: number
}

interface Certificate {
  id: string
  eventId: string
  userId: string
  generatedAt: string
  hasUrl: boolean
  hasFilename: boolean
}

interface TestResult {
  status: number
  ok: boolean
  data: any
}

interface DebugData {
  summary: {
    eventsWithAutoCert: number
    existingCertificates: number
    testResult: TestResult | null
  }
  events: EventWithAutoCert[]
  certificates: Certificate[]
}

export default function DebugCertificatesPage() {
  const { data: session, status } = useSession()
  const [debugData, setDebugData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDebug = async () => {
    if (!session?.user) {
      toast.error('Please log in to run debug')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/certificates/test-auto-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to run debug')
      }

      const data = await response.json()
      setDebugData(data)
      toast.success('Debug completed successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      toast.error('Debug failed: ' + errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      runDebug()
    }
  }, [status])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-700">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600">Please log in to access this debug page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificate Generation Debug</h1>
              <p className="text-gray-600">Debug certificate auto-generation issues</p>
            </div>
            <Button
              onClick={runDebug}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Running Debug...' : 'Run Debug'}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Debug Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Debug Results */}
        {debugData && (
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Debug Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {debugData.summary.eventsWithAutoCert}
                    </div>
                    <div className="text-sm text-blue-800">Events with Auto-Cert</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {debugData.summary.existingCertificates}
                    </div>
                    <div className="text-sm text-green-800">Existing Certificates</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {debugData.summary.testResult ? 'Tested' : 'No Test'}
                    </div>
                    <div className="text-sm text-purple-800">Auto-Generate Test</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Events with Auto-Certificate */}
            <Card>
              <CardHeader>
                <CardTitle>Events with Auto-Certificate Enabled</CardTitle>
                <CardDescription>
                  Events that should automatically generate certificates after feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                {debugData.events.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Events Found</h3>
                    <p className="text-gray-600">
                      No events have auto-certificate generation enabled. 
                      <br />
                      Enable it in Event Data → Booking Configuration → Auto-generate certificates.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {debugData.events.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{event.title}</div>
                          <div className="text-sm text-gray-600">
                            Template ID: {event.templateId}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {event.bookingsCount} bookings
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Existing Certificates */}
            <Card>
              <CardHeader>
                <CardTitle>Existing Certificates</CardTitle>
                <CardDescription>
                  Certificates that have been generated in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {debugData.certificates.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Certificates Found</h3>
                    <p className="text-gray-600">
                      No certificates have been generated yet. This could be why preview images are not working.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {debugData.certificates.map((cert) => (
                      <div key={cert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">Certificate {cert.id.slice(0, 8)}...</div>
                          <div className="text-sm text-gray-600">
                            Event: {cert.eventId.slice(0, 8)}... | User: {cert.userId.slice(0, 8)}...
                          </div>
                          <div className="text-xs text-gray-500">
                            Generated: {new Date(cert.generatedAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={cert.hasUrl ? "default" : "destructive"}>
                            {cert.hasUrl ? 'Has URL' : 'No URL'}
                          </Badge>
                          <Badge variant={cert.hasFilename ? "default" : "destructive"}>
                            {cert.hasFilename ? 'Has File' : 'No File'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test Result */}
            {debugData.summary.testResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Auto-Generate Test Result</CardTitle>
                  <CardDescription>
                    Result of testing the auto-generate route
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={debugData.summary.testResult.ok ? "default" : "destructive"}>
                        Status: {debugData.summary.testResult.status}
                      </Badge>
                      <Badge variant={debugData.summary.testResult.ok ? "default" : "destructive"}>
                        {debugData.summary.testResult.ok ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(debugData.summary.testResult.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
