'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  QrCode,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface ScanResult {
  success: boolean
  message: string
  details?: {
    eventTitle?: string
    eventDate?: string
    checkedInAt?: string
    feedbackEmailSent?: boolean
    scanWindowStart?: string
    scanWindowEnd?: string
  }
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}

function SmartAttendancePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [eventId, setEventId] = useState<string | null>(null)

  // Get event ID from URL parameters
  useEffect(() => {
    const event = searchParams.get('event')
    if (event) {
      setEventId(event)
    }
  }, [searchParams])

  // Handle attendance marking
  useEffect(() => {
    if (session && eventId && !scanResult && !isProcessing) {
      markAttendance()
    }
  }, [session, eventId, scanResult, isProcessing])

  const markAttendance = async () => {
    if (!eventId) return

    try {
      setIsProcessing(true)
      
      const response = await fetch('/api/qr-codes/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: eventId
        })
      })

      const result = await response.json()

      if (response.ok) {
        setScanResult({
          success: true,
          message: result.message,
          details: result.details
        })
        toast.success('Attendance marked successfully!')
      } else {
        setScanResult({
          success: false,
          message: result.error,
          details: result.details
        })
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Error marking attendance:', error)
      setScanResult({
        success: false,
        message: 'Failed to mark attendance. Please try again.'
      })
      toast.error('Failed to mark attendance')
    } finally {
      setIsProcessing(false)
    }
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      // Store the current URL to redirect back after login
      const currentUrl = window.location.href
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(currentUrl)}`)
      return
    }
  }, [session, status, router])

  if (status === 'loading' || isProcessing) {
    return <LoadingScreen message={isProcessing ? "Marking your attendance..." : "Loading..."} />
  }

  if (!session) {
    return null // Will redirect to login
  }

  if (!eventId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid QR Code</h2>
            <p className="text-gray-600 mb-6">
              This QR code doesn't contain a valid event ID.
            </p>
            <Button
              onClick={() => router.push('/my-bookings')}
              className="w-full"
            >
              Back to My Bookings
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (scanResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                onClick={() => router.push('/my-bookings')}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to My Bookings
              </Button>
            </div>
          </div>

          {/* Results */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {scanResult.success ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
                {scanResult.success ? 'Attendance Confirmed!' : 'Attendance Failed'}
              </CardTitle>
              <CardDescription>
                {scanResult.success 
                  ? 'Your attendance has been successfully marked' 
                  : 'There was an issue marking your attendance'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Success/Error Status */}
                <div className={`flex items-center gap-2 p-4 rounded-lg ${
                  scanResult.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {scanResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className={`font-medium ${
                      scanResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {scanResult.success ? 'Success!' : 'Error'}
                    </p>
                    <p className={`text-sm ${
                      scanResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {scanResult.message}
                    </p>
                  </div>
                </div>

                {/* Success Details */}
                {scanResult.success && scanResult.details && (
                  <div className="space-y-3">
                    {scanResult.details.eventTitle && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Event:</span>
                        <p className="text-gray-900">{scanResult.details.eventTitle}</p>
                      </div>
                    )}
                    
                    {scanResult.details.eventDate && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Date:</span>
                        <p className="text-gray-900">{scanResult.details.eventDate}</p>
                      </div>
                    )}
                    
                    {scanResult.details.checkedInAt && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Checked in at:</span>
                        <p className="text-gray-900">
                          {new Date(scanResult.details.checkedInAt).toLocaleString('en-GB')}
                        </p>
                      </div>
                    )}
                    
                    {scanResult.details.feedbackEmailSent && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-blue-800">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-medium text-sm">Next Steps</span>
                        </div>
                        <p className="text-blue-700 text-sm mt-1">
                          Check your email for a feedback form link. Complete the feedback to receive your certificate.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Details */}
                {!scanResult.success && scanResult.details && (
                  <div className="space-y-3">
                    {scanResult.details.scanWindowStart && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Scan window starts:</span>
                        <p className="text-gray-900">
                          {new Date(scanResult.details.scanWindowStart).toLocaleString('en-GB')}
                        </p>
                      </div>
                    )}
                    
                    {scanResult.details.scanWindowEnd && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Scan window ends:</span>
                        <p className="text-gray-900">
                          {new Date(scanResult.details.scanWindowEnd).toLocaleString('en-GB')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={() => router.push('/my-bookings')}
                    className="flex-1"
                  >
                    View My Bookings
                  </Button>
                  
                  {scanResult.success && (
                    <Button
                      onClick={() => router.push('/scan-attendance')}
                      variant="outline"
                      className="flex-1"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Scan Another
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // This should not be reached due to the useEffect above
  return <LoadingScreen message="Processing..." />
}

export default SmartAttendancePage
