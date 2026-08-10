'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { AttendanceTrackingNotice } from '@/components/attendance/AttendanceTrackingNotice'
import { WALK_IN_DESIGNATION_OPTIONS } from '@/lib/walk-in-shared'

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
    duplicate?: boolean
    isGuest?: boolean
    guestDesignation?: string
    registrationSource?: string
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
  const [hasAttemptedMarking, setHasAttemptedMarking] = useState(false)
  const [walkInAllowed, setWalkInAllowed] = useState<boolean | null>(null)
  const [eventTitle, setEventTitle] = useState<string | null>(null)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [designationKey, setDesignationKey] = useState('')
  const [designationOther, setDesignationOther] = useState('')
  const [guestSubmitting, setGuestSubmitting] = useState(false)

  useEffect(() => {
    const event = searchParams.get('event')
    if (event) {
      setEventId(event)
    }
  }, [searchParams])

  // Load walk-in flag for unauthenticated visitors
  useEffect(() => {
    if (!eventId || status === 'loading') return
    if (session) {
      setWalkInAllowed(null)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/qr-codes/scan/guest?eventId=${encodeURIComponent(eventId)}`)
        const data = await res.json()
        if (cancelled) return
        if (res.ok) {
          setWalkInAllowed(!!data.allowWalkInRegistration)
          setEventTitle(data.eventTitle || null)
        } else {
          setWalkInAllowed(false)
        }
      } catch {
        if (!cancelled) setWalkInAllowed(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [eventId, session, status])

  // Authenticated auto-scan
  useEffect(() => {
    if (session && eventId && !scanResult && !isProcessing && !hasAttemptedMarking) {
      setHasAttemptedMarking(true)
      markAttendance()
    }
  }, [session, eventId, scanResult, isProcessing, hasAttemptedMarking])

  // Redirect to login only when walk-in is not allowed
  useEffect(() => {
    if (status === 'loading' || session) return
    if (!eventId) return
    if (walkInAllowed === null) return
    if (walkInAllowed === false) {
      const currentUrl = window.location.href
      router.replace(`/auth/signin?callbackUrl=${encodeURIComponent(currentUrl)}`)
    }
  }, [session, status, router, eventId, walkInAllowed])

  const markAttendance = async () => {
    if (!eventId) return

    try {
      setIsProcessing(true)

      const response = await fetch('/api/qr-codes/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      })

      const result = await response.json()

      if (response.ok) {
        setScanResult({
          success: true,
          message: result.message,
          details: result.details,
        })
        if (!result.message.includes('already')) {
          toast.success('Attendance marked successfully!')
        }
      } else {
        setScanResult({
          success: false,
          message: result.error,
          details: result.details,
        })
        if (!String(result.error || '').includes('already')) {
          toast.error(result.error)
        }
      }
    } catch (error) {
      console.error('Error marking attendance:', error)
      setScanResult({
        success: false,
        message: 'Failed to mark attendance. Please try again.',
      })
      toast.error('Failed to mark attendance')
    } finally {
      setIsProcessing(false)
    }
  }

  const submitGuestCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventId) return

    if (!guestName.trim() || !guestEmail.trim() || !designationKey) {
      toast.error('Please enter your name, email, and designation')
      return
    }
    if (designationKey === 'other' && !designationOther.trim()) {
      toast.error('Please specify your designation')
      return
    }

    try {
      setGuestSubmitting(true)
      const response = await fetch('/api/qr-codes/scan/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          name: guestName.trim(),
          email: guestEmail.trim(),
          designationKey,
          designationOther: designationOther.trim(),
        }),
      })
      const result = await response.json()

      if (response.ok) {
        setScanResult({
          success: true,
          message: result.message,
          details: result.details,
        })
        if (!result.details?.duplicate) {
          toast.success('Checked in successfully!')
        }
      } else {
        setScanResult({
          success: false,
          message: result.error || 'Check-in failed',
          details: result.details,
        })
        toast.error(result.error || 'Check-in failed')
      }
    } catch (error) {
      console.error('Guest check-in error:', error)
      toast.error('Failed to check in')
    } finally {
      setGuestSubmitting(false)
    }
  }

  if (!eventId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid QR Code</h2>
            <p className="text-gray-600 mb-6">
              This QR code doesn&apos;t contain a valid event ID.
            </p>
            <Button onClick={() => router.push('/')} className="w-full">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Guest form (not logged in, walk-in allowed)
  if (!session && status !== 'loading' && walkInAllowed && !scanResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
        <div className="max-w-lg mx-auto px-4 py-10">
          <div className="mb-6">
            <AttendanceTrackingNotice />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Walk-in check-in</CardTitle>
              <CardDescription>
                {eventTitle
                  ? `Check in to ${eventTitle} without signing in`
                  : 'Enter your details to check in without signing in'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitGuestCheckIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="guest-name">Name</Label>
                  <Input
                    id="guest-name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Your full name"
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest-email">Email</Label>
                  <Input
                    id="guest-email"
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest-designation">Designation</Label>
                  <select
                    id="guest-designation"
                    value={designationKey}
                    onChange={(e) => setDesignationKey(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select designation</option>
                    {WALK_IN_DESIGNATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {designationKey === 'other' && (
                  <div className="space-y-2">
                    <Label htmlFor="guest-designation-other">Please specify</Label>
                    <Input
                      id="guest-designation-other"
                      value={designationOther}
                      onChange={(e) => setDesignationOther(e.target.value)}
                      placeholder="e.g. Physician Associate, Nurse"
                      required
                    />
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={guestSubmitting}>
                  {guestSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking in...
                    </>
                  ) : (
                    'Check in as guest'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const currentUrl = window.location.href
                    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(currentUrl)}`)
                  }}
                >
                  Sign in instead
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (status === 'loading' || isProcessing || (!session && walkInAllowed === null)) {
    return (
      <LoadingScreen
        message={isProcessing ? 'Marking your attendance...' : 'Loading...'}
      />
    )
  }

  if (!session && !walkInAllowed) {
    return null
  }

  if (scanResult) {
    const isDuplicate = !!(scanResult.success && scanResult.details?.duplicate)
    const isGuest = !!scanResult.details?.isGuest
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(session ? '/my-bookings' : '/')}
              className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 transition-all duration-200 hover:scale-105 w-fit"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">{session ? 'Back to My Bookings' : 'Back to Home'}</span>
            </Button>
            <div className="mb-6">
              <AttendanceTrackingNotice />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {scanResult.success
                  ? isDuplicate
                    ? 'Attendance Already Marked'
                    : isGuest
                      ? 'Guest Check-in Confirmed'
                      : 'Attendance Confirmed!'
                  : 'Attendance Failed'}
              </h1>
              <p className="text-gray-600 text-lg">
                {scanResult.success
                  ? isDuplicate
                    ? 'You have already marked attendance for this event.'
                    : isGuest
                      ? 'You’re checked in. Sign up or sign in with this email later for certificates and feedback.'
                      : 'Your attendance has been successfully marked'
                  : 'There was an issue marking your attendance'}
              </p>
            </div>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {scanResult.success ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
                {scanResult.success ? (isDuplicate ? 'Already Marked' : 'Success!') : 'Error'}
              </CardTitle>
              <CardDescription>{scanResult.message}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  className={`flex items-center gap-2 p-4 rounded-lg ${
                    scanResult.success
                      ? isDuplicate
                        ? 'bg-yellow-50 border border-yellow-200'
                        : 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {scanResult.success ? (
                    <CheckCircle
                      className={`h-5 w-5 ${isDuplicate ? 'text-yellow-600' : 'text-green-600'}`}
                    />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p
                      className={`font-medium ${
                        scanResult.success
                          ? isDuplicate
                            ? 'text-yellow-800'
                            : 'text-green-800'
                          : 'text-red-800'
                      }`}
                    >
                      {scanResult.success ? (isDuplicate ? 'Already Marked' : 'Success!') : 'Error'}
                    </p>
                    <p
                      className={`text-sm ${
                        scanResult.success
                          ? isDuplicate
                            ? 'text-yellow-700'
                            : 'text-green-700'
                          : 'text-red-700'
                      }`}
                    >
                      {scanResult.message}
                    </p>
                  </div>
                </div>

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
                    {scanResult.details.guestDesignation && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Designation:</span>
                        <p className="text-gray-900">{scanResult.details.guestDesignation}</p>
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
                  </div>
                )}

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  {session ? (
                    <Button onClick={() => router.push('/my-bookings')} className="flex-1">
                      Go to My Bookings
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => router.push('/auth/signin')}
                        className="flex-1"
                      >
                        Sign in for certificates
                      </Button>
                      <Button variant="outline" onClick={() => router.push('/')} className="flex-1">
                        Done
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return <LoadingScreen message="Marking your attendance..." />
}

export default function SmartAttendancePageWithSuspense() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <SmartAttendancePage />
    </Suspense>
  )
}
