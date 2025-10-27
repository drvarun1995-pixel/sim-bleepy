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
  Minimize
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
      setQrCode(qrData.qrCode)
      
      // Fetch event data
      const eventResponse = await fetch('/api/events')
      if (!eventResponse.ok) throw new Error('Failed to fetch events')
      
      const eventsData = await eventResponse.json()
      const eventData = eventsData.find((e: Event) => e.id === eventId)
      setEvent(eventData)
      
    } catch (error) {
      console.error('Error fetching QR code data:', error)
      toast.error('Failed to fetch QR code data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchQRCodeData()
    setRefreshing(false)
  }

  const handleDownload = () => {
    if (!qrCode?.qrCodeImageUrl) return
    
    const link = document.createElement('a')
    link.href = qrCode.qrCodeImageUrl
    link.download = `qr-code-${event?.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }



  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          {/* Navigation and Action Buttons */}
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={() => router.push(`/bookings/${eventId}`)}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Event Bookings
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={handleEditQR}
                variant="outline"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
                disabled={!qrCode}
              >
                <QrCode className="h-4 w-4 mr-2" />
                Edit QR Code
              </Button>
              <Button
                onClick={() => router.push('/qr-codes')}
                variant="outline"
                size="sm"
              >
                <List className="h-4 w-4 mr-2" />
                Show All QR Codes
              </Button>
            </div>
          </div>
          
          {/* Title Section */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">QR Code Display</h1>
            <p className="text-gray-600 mt-2">{event.title}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code
              </CardTitle>
              <CardDescription>
                Scan this code to mark attendance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                {qrCode.qrCodeImageUrl ? (
                  <div className={`bg-white p-8 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center ${
                    isFullscreen ? 'fixed inset-0 z-50 bg-black bg-opacity-90' : ''
                  }`}>
                    <img
                      src={qrCode.qrCodeImageUrl}
                      alt="QR Code"
                      className={`max-w-full h-auto ${
                        isFullscreen ? 'max-w-none max-h-none w-auto h-auto' : ''
                      }`}
                      style={isFullscreen ? { 
                        width: '90vw', 
                        height: '90vh', 
                        objectFit: 'contain' 
                      } : { 
                        maxWidth: '280px', 
                        maxHeight: '280px' 
                      }}
                    />
                    {isFullscreen && (
                      <div className="absolute top-4 right-4">
                        <Button
                          onClick={handleFullscreen}
                          variant="outline"
                          size="sm"
                          className="bg-white/90 hover:bg-white"
                        >
                          <Minimize className="h-4 w-4 mr-2" />
                          Exit Fullscreen
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-100 p-8 rounded-lg">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">QR code image not available</p>
                  </div>
                )}
                
                <div className="mt-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    {statusInfo.status === 'active' && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {statusInfo.status === 'scheduled' && <Clock className="h-5 w-5 text-yellow-600" />}
                    {statusInfo.status === 'expired' && <XCircle className="h-5 w-5 text-gray-600" />}
                    {statusInfo.status === 'inactive' && <XCircle className="h-5 w-5 text-red-600" />}
                    <span className={`font-medium ${statusInfo.color}`}>
                      {statusInfo.message}
                    </span>
                  </div>
                  
                  {qrCode.scanCount !== undefined && (
                    <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      {qrCode.scanCount} scans
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(event.date).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {event.start_time} - {event.end_time}
                  </div>
                  {event.location_name && (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 flex items-center justify-center">
                        📍
                      </div>
                      {event.location_name}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Scan Window</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Starts:</span>
                    <span className="ml-2 font-medium">
                      {qrCode?.scanWindowStart ? formatDateTime(qrCode.scanWindowStart) : 'Not set'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Ends:</span>
                    <span className="ml-2 font-medium">
                      {qrCode?.scanWindowEnd ? formatDateTime(qrCode.scanWindowEnd) : 'Not set'}
                    </span>
                  </div>
                </div>
              </div>

              {event.auto_generate_certificate && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-purple-100 text-purple-600">
                      Auto-Certificate Enabled
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Certificates will be automatically generated after feedback completion.
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleFullscreen}
                    variant="outline"
                    size="sm"
                  >
                    {isFullscreen ? (
                      <Minimize className="h-4 w-4 mr-2" />
                    ) : (
                      <Maximize className="h-4 w-4 mr-2" />
                    )}
                    {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  </Button>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    onClick={handleRegenerateQR}
                    variant="outline"
                    size="sm"
                    className="text-orange-600 hover:text-orange-700 border-orange-300"
                    disabled={regenerating}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {regenerating ? 'Regenerating...' : 'Regenerate'}
                  </Button>
                  <Button
                    onClick={handleDeleteQR}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 border-red-300"
                    disabled={deleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Instructions for Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Students should open their camera app or QR code scanner</li>
                <li>Point the camera at this QR code</li>
                <li>Tap the notification or link that appears</li>
                <li>They will be redirected to mark their attendance</li>
                <li>After scanning, they will receive a feedback form via email</li>
                <li>They must complete the feedback form to receive their certificate</li>
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
                className="bg-red-600 hover:bg-red-700"
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
                className="bg-orange-600 hover:bg-orange-700"
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
                className="bg-blue-600 hover:bg-blue-700"
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
