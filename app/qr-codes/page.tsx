'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
  Eye, 
  Trash2, 
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { useRole } from '@/lib/useRole'

interface Event {
  id: string
  title: string
  date: string
  start_time: string
  end_time: string
  booking_enabled: boolean
  status: string
  qr_attendance_enabled: boolean
  auto_generate_certificate: boolean
  feedback_required_for_certificate: boolean
  qr_code?: {
    id: string
    active: boolean
    scan_window_start: string
    scan_window_end: string
    created_at: string
    scan_count?: number
  }
}

export default function QRCodeManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { canManageEvents, loading: roleLoading } = useRole()
  
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [scanWindowStart, setScanWindowStart] = useState('')
  const [scanWindowEnd, setScanWindowEnd] = useState('')
  const [generating, setGenerating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null)
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
  const [eventToRegenerate, setEventToRegenerate] = useState<Event | null>(null)
  const [regenerateScanStart, setRegenerateScanStart] = useState('')
  const [regenerateScanEnd, setRegenerateScanEnd] = useState('')

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

  // Fetch events
  useEffect(() => {
    if (session && canManageEvents) {
      fetchEvents()
    }
  }, [session, canManageEvents])

  // Filter events
  useEffect(() => {
    let filtered = events

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => {
        if (statusFilter === 'with-qr') return event.qr_code
        if (statusFilter === 'without-qr') return !event.qr_code
        if (statusFilter === 'active') return event.qr_code?.active
        if (statusFilter === 'inactive') return event.qr_code && !event.qr_code.active
        return true
      })
    }

    setFilteredEvents(filtered)
  }, [events, searchQuery, statusFilter])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      
      // Fetch events with QR attendance enabled
      const response = await fetch('/api/events')
      if (!response.ok) throw new Error('Failed to fetch events')
      
      const eventsData = await response.json()
      const eventsWithQRAttendance = eventsData.filter((event: Event) => event.qr_attendance_enabled)
      
      // Fetch QR code data for each event
      const eventsWithQR = await Promise.all(
        eventsWithQRAttendance.map(async (event: Event) => {
          try {
            const qrResponse = await fetch(`/api/qr-codes/${event.id}`)
            if (qrResponse.ok) {
              const qrData = await qrResponse.json()
              // Map API response to expected format
              const mappedQRCode = {
                id: qrData.qrCode.id,
                active: qrData.qrCode.active,
                scan_window_start: qrData.qrCode.scanWindowStart,
                scan_window_end: qrData.qrCode.scanWindowEnd,
                created_at: qrData.qrCode.createdAt,
                scan_count: qrData.qrCode.scanCount
              }
              return { ...event, qr_code: mappedQRCode }
            }
          } catch (error) {
            console.error(`Failed to fetch QR code for event ${event.id}:`, error)
          }
          return event
        })
      )
      
      setEvents(eventsWithQR)
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error('Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateQR = async () => {
    if (!selectedEvent) return

    try {
      setGenerating(true)
      
      const response = await fetch('/api/qr-codes/auto-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: selectedEvent.id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate QR code')
      }

      toast.success('QR code generated successfully!')
      setShowGenerateDialog(false)
      setSelectedEvent(null)
      setScanWindowStart('')
      setScanWindowEnd('')
      fetchEvents() // Refresh the list
    } catch (error) {
      console.error('Error generating QR code:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate QR code')
    } finally {
      setGenerating(false)
    }
  }

  const handleDeactivateQR = async (eventId: string) => {
    try {
      const response = await fetch(`/api/qr-codes/${eventId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to deactivate QR code')
      }

      toast.success('QR code deactivated successfully!')
      fetchEvents() // Refresh the list
    } catch (error) {
      console.error('Error deactivating QR code:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to deactivate QR code')
    }
  }

  const openGenerateDialog = (event: Event) => {
    setSelectedEvent(event)
    
    // Set default scan window (30 min before to 1 hour after)
    const eventDateTime = new Date(`${event.date}T${event.start_time}`)
    const eventEndDateTime = new Date(`${event.date}T${event.end_time}`)
    
    const defaultStart = new Date(eventDateTime.getTime() - 30 * 60 * 1000)
    const defaultEnd = new Date(eventEndDateTime.getTime() + 60 * 60 * 1000)
    
    setScanWindowStart(defaultStart.toISOString().slice(0, 16))
    setScanWindowEnd(defaultEnd.toISOString().slice(0, 16))
    setShowGenerateDialog(true)
  }

  const handleDeleteQR = (event: Event) => {
    setEventToDelete(event)
    setShowDeleteDialog(true)
  }

  const confirmDeleteQR = async () => {
    if (!eventToDelete) return

    try {
      setDeleting(eventToDelete.id)
      
      const response = await fetch('/api/qr-codes/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: eventToDelete.id
        }),
      })

      if (response.ok) {
        toast.success('QR code deleted successfully')
        setShowDeleteDialog(false)
        setEventToDelete(null)
        await fetchEvents()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to delete QR code')
      }
    } catch (error) {
      console.error('Error deleting QR code:', error)
      toast.error('Failed to delete QR code')
    } finally {
      setDeleting(null)
    }
  }

  const handleRegenerateQR = (event: Event) => {
    // Set default scan window to event start/end time
    const eventStart = new Date(`${event.date}T${event.start_time}`)
    const eventEnd = new Date(`${event.date}T${event.end_time}`)
    
    setRegenerateScanStart(eventStart.toISOString().slice(0, 16))
    setRegenerateScanEnd(eventEnd.toISOString().slice(0, 16))
    setEventToRegenerate(event)
    setShowRegenerateDialog(true)
  }

  const confirmRegenerateQR = async () => {
    if (!eventToRegenerate) return
    
    try {
      setRegenerating(eventToRegenerate.id)
      
      const response = await fetch('/api/qr-codes/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: eventToRegenerate.id,
          scanWindowStart: regenerateScanStart,
          scanWindowEnd: regenerateScanEnd
        })
      })

      if (response.ok) {
        toast.success('QR code regenerated successfully')
        setShowRegenerateDialog(false)
        setEventToRegenerate(null)
        await fetchEvents()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to regenerate QR code')
      }
    } catch (error) {
      console.error('Error regenerating QR code:', error)
      toast.error('Failed to regenerate QR code')
    } finally {
      setRegenerating(null)
    }
  }

  const getStatusBadge = (event: Event) => {
    if (!event.qr_code) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-600">No QR Code</Badge>
    }
    
    if (!event.qr_code.active) {
      return <Badge variant="outline" className="bg-red-100 text-red-600">Inactive</Badge>
    }
    
    const now = new Date()
    const scanStart = new Date(event.qr_code.scan_window_start)
    const scanEnd = new Date(event.qr_code.scan_window_end)
    
    if (now < scanStart) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-600">Scheduled</Badge>
    }
    
    if (now > scanEnd) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-600">Expired</Badge>
    }
    
    return <Badge variant="outline" className="bg-green-100 text-green-600">Active</Badge>
  }

  const formatDateTime = (dateTime: string | undefined | null) => {
    if (!dateTime) return 'No date set'
    
    try {
      const date = new Date(dateTime)
      if (isNaN(date.getTime())) {
        console.log('Invalid date string:', dateTime)
        return 'Invalid date'
      }
      return date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Error formatting date:', error, 'Input:', dateTime)
      return 'Invalid date'
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading QR Code Management..." />
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/bookings')}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 transition-all duration-200 hover:scale-105"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="font-medium">Back to Bookings</span>
                </Button>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">QR Code Management</h1>
              <p className="text-gray-600 mt-2">
                Generate and manage QR codes for event attendance tracking
              </p>
            </div>
            <Button
              onClick={fetchEvents}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Events</option>
              <option value="with-qr">With QR Code</option>
              <option value="without-qr">Without QR Code</option>
              <option value="active">Active QR Codes</option>
              <option value="inactive">Inactive QR Codes</option>
            </select>
          </div>
        </div>

        {/* Events List */}
        <div className="grid gap-6">
          {filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
                <p className="text-gray-500">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No events with booking enabled found.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredEvents.map((event) => (
              <Card key={event.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                        {getStatusBadge(event)}
                        {event.auto_generate_certificate && (
                          <Badge variant="outline" className="bg-purple-100 text-purple-600">
                            Auto-Certificate
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(event.date).toLocaleDateString('en-GB')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {event.start_time} - {event.end_time}
                        </div>
                        {event.qr_code?.scan_count !== undefined && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {event.qr_code.scan_count} scans
                          </div>
                        )}
                      </div>

                      {event.qr_code && (
                        <div className="text-sm text-gray-600">
                          <p>
                            <strong>Scan Window:</strong> {formatDateTime(event.qr_code.scan_window_start)} - {formatDateTime(event.qr_code.scan_window_end)}
                          </p>
                          <p>
                            <strong>Created:</strong> {formatDateTime(event.qr_code.created_at)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {event.qr_code ? (
                        <>
                          <Button
                            onClick={() => router.push(`/qr-codes/${event.id}`)}
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            onClick={() => router.push(`/qr-codes/${event.id}`)}
                            variant="outline"
                            size="sm"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Button
                            onClick={() => handleRegenerateQR(event)}
                            variant="outline"
                            size="sm"
                            className="text-orange-600 hover:text-orange-700"
                            disabled={regenerating === event.id}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            {regenerating === event.id ? 'Regenerating...' : 'Regenerate'}
                          </Button>
                          <Button
                            onClick={() => handleDeleteQR(event)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            disabled={deleting === event.id}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {deleting === event.id ? 'Deleting...' : 'Delete'}
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => openGenerateDialog(event)}
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Generate QR Code
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Generate QR Code Dialog */}
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Generate QR Code</DialogTitle>
              <DialogDescription>
                Create a QR code for "{selectedEvent?.title}" with custom scan window settings.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="scanWindowStart">Scan Window Start</Label>
                <Input
                  id="scanWindowStart"
                  type="datetime-local"
                  value={scanWindowStart}
                  onChange={(e) => setScanWindowStart(e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  When QR code scanning becomes active (default: 30 minutes before event)
                </p>
              </div>
              
              <div>
                <Label htmlFor="scanWindowEnd">Scan Window End</Label>
                <Input
                  id="scanWindowEnd"
                  type="datetime-local"
                  value={scanWindowEnd}
                  onChange={(e) => setScanWindowEnd(e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  When QR code scanning expires (default: 1 hour after event)
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowGenerateDialog(false)}
                disabled={generating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateQR}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Generate QR Code
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete QR Code</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the QR code for "{eventToDelete?.title}"? This action cannot be undone and will also remove the QR code image from storage.
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting !== null}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteQR}
                disabled={deleting !== null}
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
                disabled={regenerating !== null}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmRegenerateQR}
                disabled={regenerating !== null}
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
    </div>
  )
}
