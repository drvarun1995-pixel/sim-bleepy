'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  QrCode, 
  Calendar, 
  Clock, 
  Users, 
  Download, 
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Trash2,
  List,
  Maximize,
  Minimize,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { useRole } from '@/lib/useRole'

interface QRCodeData {
  id: string
  eventId: string
  qrCodeImageUrl: string
  scanWindowStart: string
  scanWindowEnd: string
  active: boolean
  scanCount?: number
}

interface Event {
  id: string
  title: string
  date: string
  start_time: string
  end_time: string
  location_name?: string
  auto_generate_certificate: boolean
  feedback_required_for_certificate: boolean
}

export default function QRCodeDisplayPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const { canManageEvents, loading: roleLoading } = useRole()
  
  const [qrCode, setQrCode] = useState<QRCodeData | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editScanStart, setEditScanStart] = useState('')
  const [editScanEnd, setEditScanEnd] = useState('')
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
  const [regenerateScanStart, setRegenerateScanStart] = useState('')
  const [regenerateScanEnd, setRegenerateScanEnd] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [realtimeScanCount, setRealtimeScanCount] = useState<number | null>(null)
  const [sseConnected, setSseConnected] = useState(false)
  const [realtimeAttendees, setRealtimeAttendees] = useState<Array<{id: string, user_name: string, scanned_at: string}>>([])

  const eventId = params.eventId as string

  // Check permissions
  useEffect(() => {
    if (status === 'loading' || roleLoading) return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (!canManageEvents) {
      toast.error('Access denied. MedEd Team, CTF, or Admin role required.')
      router.push('/dashboard')
      return
    }
  }, [session, status, canManageEvents, roleLoading, router])

  // Fetch QR code and event data
  useEffect(() => {
    if (session && canManageEvents && eventId) {
      fetchQRCodeData()
    }
  }, [session, canManageEvents, eventId])

  // Set up real-time scan count updates
  useEffect(() => {
    if (!session || !canManageEvents || !eventId || !qrCode) return

    console.log('🔄 Setting up real-time scan count updates for event:', eventId)
    
    const eventSource = new EventSource(`/api/qr-codes/${eventId}/realtime`)
    
    eventSource.onopen = () => {
      console.log('📡 SSE connection opened')
      setSseConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        console.log('📡 Raw SSE message received:', event.data)
        const data = JSON.parse(event.data)
        console.log('📡 Parsed SSE data:', data)
        
        if (data.type === 'scan_count_update') {
          console.log('📊 Received scan count update:', data.scanCount)
          setRealtimeScanCount(data.scanCount)
        } else if (data.type === 'attendees_update') {
          console.log('👥 Received attendees update:', data.attendees)
          console.log('👥 Debug info:', data.debug)
          setRealtimeAttendees(data.attendees || [])
        } else if (data.type === 'ping') {
          // Keep connection alive
          console.log('🏓 Received ping')
        } else {
          console.log('❓ Unknown SSE message type:', data.type)
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error)
        console.error('Raw data that failed to parse:', event.data)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      setSseConnected(false)
      
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('🔄 Attempting to reconnect SSE...')
          eventSource.close()
          // The useEffect will run again and create a new connection
        }
      }, 5000)
    }

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up SSE connection')
      eventSource.close()
      setSseConnected(false)
    }
  }, [session, canManageEvents, eventId, qrCode])


  const fetchQRCodeData = async () => {
    try {
      setLoading(true)
      
      // Fetch QR code data
      const qrResponse = await fetch(`/api/qr-codes/${eventId}`)
      if (!qrResponse.ok) {
        if (qrResponse.status === 404) {
          toast.error('QR code not found for this event')
          router.push('/qr-codes')
          return
        }
        throw new Error('Failed to fetch QR code')
      }
      
      const qrData = await qrResponse.json()
      console.log('🔍 QR Code data received:', qrData)
      setQrCode(qrData.qrCode)
      
      // Fetch event data
      const eventResponse = await fetch('/api/events')
      if (!eventResponse.ok) throw new Error('Failed to fetch events')
      
      const eventsData = await eventResponse.json()
      const eventData = eventsData.find((e: Event) => e.id === eventId)
      console.log('🔍 Event data found for QR page:', eventData)
      console.log('🔍 auto_generate_certificate value:', eventData?.auto_generate_certificate)
      console.log('🔍 feedback_required_for_certificate value:', eventData?.feedback_required_for_certificate)
      setEvent(eventData)
      
      // Fetch attendees data
      console.log('🔍 About to fetch attendees for QR code ID:', qrData.qrCode.id)
      await fetchAttendeesData(qrData.qrCode.id)
      
    } catch (error) {
      console.error('Error fetching QR code data:', error)
      toast.error('Failed to fetch QR code data')
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendeesData = async (qrCodeId: string) => {
    try {
      console.log('👥 Frontend: Fetching attendees for QR code ID:', qrCodeId)
      const response = await fetch(`/api/qr-codes/attendees/${qrCodeId}`)
      console.log('👥 Frontend: Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('👥 Frontend: Attendees data received:', data)
        setRealtimeAttendees(data.attendees || [])
      } else {
        const errorData = await response.json()
        console.error('👥 Frontend: Error response:', errorData)
      }
    } catch (error) {
      console.error('Error fetching attendees data:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchQRCodeData()
    setRefreshing(false)
  }

  const handleDownload = () => {
    if (!qrCode?.qrCodeImageUrl) return
    
    // Open QR code in new tab/page
    window.open(qrCode.qrCodeImageUrl, '_blank')
  }



  const handleFullscreen = async () => {
    if (!qrCode?.qrCodeImageUrl) return
    
    if (!isFullscreen) {
      // Enter fullscreen
      try {
        const element = document.documentElement
        if (element.requestFullscreen) {
          await element.requestFullscreen()
        } else if ((element as any).webkitRequestFullscreen) {
          await (element as any).webkitRequestFullscreen()
        } else if ((element as any).msRequestFullscreen) {
          await (element as any).msRequestFullscreen()
        }
        setIsFullscreen(true)
      } catch (error) {
        console.error('Error entering fullscreen:', error)
        // Fallback to overlay fullscreen
        setIsFullscreen(true)
      }
    } else {
      // Exit fullscreen
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen()
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen()
        }
        setIsFullscreen(false)
      } catch (error) {
        console.error('Error exiting fullscreen:', error)
        setIsFullscreen(false)
      }
    }
  }

  const handleDeleteQR = () => {
    setShowDeleteDialog(true)
  }

  const confirmDeleteQR = async () => {
    try {
      setDeleting(true)
      
      const response = await fetch('/api/qr-codes/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: eventId
        }),
      })

      if (response.ok) {
        toast.success('QR code deleted successfully')
        setShowDeleteDialog(false)
        router.push('/qr-codes')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to delete QR code')
      }
    } catch (error) {
      console.error('Error deleting QR code:', error)
      toast.error('Failed to delete QR code')
    } finally {
      setDeleting(false)
    }
  }

  const handleRegenerateQR = () => {
    if (event) {
      // Set default scan window to event start/end time
      const eventStart = new Date(`${event.date}T${event.start_time}`)
      const eventEnd = new Date(`${event.date}T${event.end_time}`)
      
      setRegenerateScanStart(eventStart.toISOString().slice(0, 16))
      setRegenerateScanEnd(eventEnd.toISOString().slice(0, 16))
      setShowRegenerateDialog(true)
    }
  }

  const confirmRegenerateQR = async () => {
    try {
      setRegenerating(true)
      
      const response = await fetch('/api/qr-codes/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: eventId,
          scanWindowStart: regenerateScanStart,
          scanWindowEnd: regenerateScanEnd
        })
      })

      if (response.ok) {
        const data = await response.json()
        setQrCode(data.qrCode)
        toast.success('QR code regenerated successfully')
        setShowRegenerateDialog(false)
        // Refresh the QR code data
        await fetchQRCodeData()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to regenerate QR code')
      }
    } catch (error) {
      console.error('Error regenerating QR code:', error)
      toast.error('Failed to regenerate QR code')
    } finally {
      setRegenerating(false)
    }
  }

  const handleEditQR = () => {
    if (qrCode) {
      // Convert ISO strings to datetime-local format
      const startDate = new Date(qrCode.scanWindowStart)
      const endDate = new Date(qrCode.scanWindowEnd)
      
      setEditScanStart(startDate.toISOString().slice(0, 16))
      setEditScanEnd(endDate.toISOString().slice(0, 16))
      setShowEditDialog(true)
    }
  }

  const confirmEditQR = async () => {
    try {
      setEditing(true)
      
      const response = await fetch('/api/qr-codes/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: eventId,
          scanWindowStart: editScanStart,
          scanWindowEnd: editScanEnd
        })
      })

      if (response.ok) {
        const data = await response.json()
        setQrCode(data.qrCode)
        toast.success('QR code scan window updated successfully')
        setShowEditDialog(false)
        // Refresh the QR code data
        await fetchQRCodeData()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to update QR code')
      }
    } catch (error) {
      console.error('Error updating QR code:', error)
      toast.error('Failed to update QR code')
    } finally {
      setEditing(false)
    }
  }

  const getStatusInfo = () => {
    if (!qrCode) return { status: 'inactive', message: 'QR code not found', color: 'text-red-600' }
    
    if (!qrCode.active) {
      return { status: 'inactive', message: 'QR code is deactivated', color: 'text-red-600' }
    }
    
    const now = new Date()
    const scanStart = new Date(qrCode.scanWindowStart)
    const scanEnd = new Date(qrCode.scanWindowEnd)
    
    if (now < scanStart) {
      return { 
        status: 'scheduled', 
        message: `Scanning starts at ${scanStart.toLocaleString('en-GB')}`, 
        color: 'text-yellow-600' 
      }
    }
    
    if (now > scanEnd) {
      return { 
        status: 'expired', 
        message: `Scanning expired at ${scanEnd.toLocaleString('en-GB')}`, 
        color: 'text-gray-600' 
      }
    }
    
    return { 
      status: 'active', 
      message: 'QR code is active and ready for scanning', 
      color: 'text-green-600' 
    }
  }

  const formatDateTime = (dateTime: string | undefined | null) => {
    try {
      if (!dateTime) {
        return 'No date set'
      }
      
      const date = new Date(dateTime)
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateTime)
        return 'Invalid Date'
      }
      return date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Error formatting date:', dateTime, error)
      return 'Invalid Date'
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading QR Code..." />
  }

  if (!qrCode || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">QR Code Not Found</h3>
            <p className="text-gray-500 mb-4">
              No QR code found for this event.
            </p>
            <Button onClick={() => router.push('/qr-codes')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to QR Codes
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <img
            src={qrCode?.qrCodeImageUrl}
            alt="QR Code"
            className="max-w-none max-h-none rounded-lg shadow-2xl"
            style={{ 
              width: '90vw', 
              height: '90vh', 
              objectFit: 'contain' 
            }}
          />
          <div className="absolute top-4 right-4">
            <Button
              onClick={handleFullscreen}
              variant="outline"
              size="sm"
              className="bg-white/90 hover:bg-white shadow-lg text-gray-700 hover:text-gray-900"
            >
              <Minimize className="h-4 w-4 mr-2" />
              Exit Fullscreen
            </Button>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          {/* Navigation and Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <Button
              onClick={() => router.push(`/bookings/${eventId}`)}
              className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 transition-all duration-200 hover:scale-105 w-fit"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Back to Event Bookings</span>
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={refreshing}
                className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-gray-50 text-gray-700 hover:text-gray-900"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={handleEditQR}
                variant="outline"
                size="sm"
                className="bg-white/80 backdrop-blur-sm border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                disabled={!qrCode}
              >
                <QrCode className="h-4 w-4 mr-2" />
                Edit QR Code
              </Button>
              <Button
                onClick={() => router.push('/qr-codes')}
                variant="outline"
                size="sm"
                className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-gray-50 text-gray-700 hover:text-gray-900"
              >
                <List className="h-4 w-4 mr-2" />
                Show All QR Codes
              </Button>
              <Button
                onClick={() => router.push(`/events/${eventId}`)}
                variant="outline"
                size="sm"
                className="bg-white/80 backdrop-blur-sm border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Show Event
              </Button>
            </div>
          </div>
          
          {/* Title Section */}
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              QR Code Display
            </h1>
            <p className="text-xl text-gray-600 font-medium">{event.title}</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className={`w-3 h-3 rounded-full ${statusInfo.status === 'active' ? 'bg-green-500' : statusInfo.status === 'scheduled' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.message}
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Attendance Section */}
        <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Users className="h-5 w-5" />
              Live Attendance
              {sseConnected && (
                <div className="flex items-center gap-1 ml-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Real-time updates active"></div>
                  <span className="text-xs text-green-600 font-normal">Live</span>
                </div>
              )}
            </CardTitle>
            <CardDescription className="text-green-600">
              Real-time list of attendees who have scanned the QR code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {realtimeAttendees.length} attendees
                  </div>
                  <div className="text-sm text-gray-600">
                    {realtimeScanCount !== null ? realtimeScanCount : (qrCode.scanCount || 0)} total scans
                  </div>
                </div>
              </div>
              
              {realtimeAttendees.length > 0 ? (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {realtimeAttendees.map((attendee, index) => (
                    <div key={attendee.id} className="flex items-center justify-between bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-medium text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{attendee.user_name}</p>
                          <p className="text-xs text-gray-500">
                            Scanned at {new Date(attendee.scanned_at).toLocaleString('en-GB')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Verified</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No attendees yet</p>
                  <p className="text-sm">Scan the QR code to appear here</p>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700">
                      <strong>To test:</strong> Use a mobile device to scan the QR code, or visit the scanning page
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Make sure you have a booking for this event and the QR code is active
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Display */}
          <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <QrCode className="h-5 w-5 text-blue-600" />
                QR Code
              </CardTitle>
              <CardDescription className="text-gray-600">
                Scan this code to mark attendance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                {qrCode.qrCodeImageUrl ? (
                  <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center shadow-inner">
                    <img
                      src={qrCode.qrCodeImageUrl}
                      alt="QR Code"
                      className="max-w-full h-auto rounded-lg shadow-lg"
                      style={{ 
                        maxWidth: '280px', 
                        maxHeight: '280px' 
                      }}
                    />
                  </div>
                ) : (
                  <div className="bg-gray-100 p-8 rounded-lg">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">QR code image not available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Calendar className="h-5 w-5 text-purple-600" />
                Event Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">{event.title}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-700">
                      {new Date(event.date).toLocaleDateString('en-GB', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-700">{event.start_time} - {event.end_time}</span>
                  </div>
                  {event.location_name && (
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 flex items-center justify-center text-blue-600">
                        📍
                      </div>
                      <span className="text-gray-700">{event.location_name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-green-600" />
                  Scan Window
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Starts:</span>
                    <span className="font-medium text-gray-900">
                      {qrCode?.scanWindowStart ? formatDateTime(qrCode.scanWindowStart) : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Ends:</span>
                    <span className="font-medium text-gray-900">
                      {qrCode?.scanWindowEnd ? formatDateTime(qrCode.scanWindowEnd) : 'Not set'}
                    </span>
                  </div>
                </div>
              </div>

              {event.auto_generate_certificate ? (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-purple-100 text-purple-600 border-purple-300">
                      Auto-Certificate Enabled
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {event.feedback_required_for_certificate 
                      ? "Certificates will be automatically generated after feedback completion."
                      : "Certificates will be sent out once the event ends."
                    }
                  </p>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
                      QR Attendance Only
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Attendance will be tracked via QR code. Certificates will not be automatically generated.
                  </p>
                </div>
              )}

              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-gray-600" />
                  Actions
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleFullscreen}
                    variant="outline"
                    size="sm"
                    className="bg-white/80 hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-900 text-sm font-medium sm:text-sm text-xs"
                  >
                    {isFullscreen ? (
                      <Minimize className="h-4 w-4 mr-1" />
                    ) : (
                      <Maximize className="h-4 w-4 mr-1" />
                    )}
                    {isFullscreen ? 'Exit' : 'Fullscreen'}
                  </Button>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    size="sm"
                    className="bg-white/80 hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-900 text-sm font-medium sm:text-sm text-xs"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    onClick={handleRegenerateQR}
                    variant="outline"
                    size="sm"
                    className="bg-white/80 hover:bg-orange-50 text-orange-600 hover:text-orange-700 border-orange-300 text-sm font-medium sm:text-sm text-xs"
                    disabled={regenerating}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    {regenerating ? 'Regenerating...' : 'Regenerate'}
                  </Button>
                  <Button
                    onClick={handleDeleteQR}
                    variant="outline"
                    size="sm"
                    className="bg-white/80 hover:bg-red-50 text-red-600 hover:text-red-700 border-red-300 text-sm font-medium sm:text-sm text-xs"
                    disabled={deleting}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {deleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-700">
              <AlertCircle className="h-5 w-5" />
              Instructions for Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 border border-indigo-200">
              <ol className="space-y-4 text-sm text-gray-700">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                  <span>Students should open their camera app or QR code scanner</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                  <span>Point the camera at this QR code</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                  <span>Tap the notification or link that appears</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</div>
                  <span>They will be redirected to mark their attendance</span>
                </li>
                {event.auto_generate_certificate ? (
                  event.feedback_required_for_certificate ? (
                    <>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">5</div>
                        <span>After scanning, they will receive a feedback form via email</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">6</div>
                        <span>They must complete the feedback form to receive their certificate</span>
                      </li>
                    </>
                  ) : (
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">5</div>
                      <span>Their certificate will be automatically generated and sent via email once the event ends</span>
                    </li>
                  )
                ) : (
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">5</div>
                    <span>Their attendance will be recorded for this event</span>
                  </li>
                )}
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete QR Code</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the QR code for "{event?.title}"? This action cannot be undone and will also remove the QR code image from storage.
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteQR}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white hover:text-white"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete QR Code
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Regenerate QR Code Dialog */}
        <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Regenerate QR Code</DialogTitle>
              <DialogDescription>
                Set the scan window for the new QR code. Students can only scan during this time period.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="regenerateScanStart">Scan Window Start</Label>
                <Input
                  id="regenerateScanStart"
                  type="datetime-local"
                  value={regenerateScanStart}
                  onChange={(e) => setRegenerateScanStart(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="regenerateScanEnd">Scan Window End</Label>
                <Input
                  id="regenerateScanEnd"
                  type="datetime-local"
                  value={regenerateScanEnd}
                  onChange={(e) => setRegenerateScanEnd(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRegenerateDialog(false)}
                disabled={regenerating}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmRegenerateQR}
                disabled={regenerating}
                className="bg-orange-600 hover:bg-orange-700 text-white hover:text-white"
              >
                {regenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  'Regenerate QR Code'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit QR Code Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit QR Code Scan Window</DialogTitle>
              <DialogDescription>
                Update the scan window for this QR code. Students can only scan during this time period.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="scanStart">Scan Window Start</Label>
                <Input
                  id="scanStart"
                  type="datetime-local"
                  value={editScanStart}
                  onChange={(e) => setEditScanStart(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="scanEnd">Scan Window End</Label>
                <Input
                  id="scanEnd"
                  type="datetime-local"
                  value={editScanEnd}
                  onChange={(e) => setEditScanEnd(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={editing}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmEditQR}
                disabled={editing}
                className="bg-blue-600 hover:bg-blue-700 text-white hover:text-white"
              >
                {editing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update QR Code'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
