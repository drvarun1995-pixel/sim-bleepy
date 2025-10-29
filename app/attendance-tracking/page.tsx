'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Users, 
  Calendar, 
  Clock, 
  QrCode, 
  Download, 
  Eye, 
  Search,
  Filter,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  UserCheck,
  UserX,
  Folder,
  Sparkles,
  Mic,
  MapPin,
  UserCircle,
  LayoutGrid,
  List
} from 'lucide-react'
import { toast } from 'sonner'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

interface Event {
  id: string
  title: string
  date: string
  start_time: string
  end_time: string
  location?: string
  status: string
  qr_attendance_enabled: boolean
  qr_code?: {
    id: string
    active: boolean
    scan_window_start: string
    scan_window_end: string
    created_at: string
    scan_count: number
  }
  attendance_stats?: {
    total_scans: number
    successful_scans: number
    failed_scans: number
    unique_attendees: number
    attendance_rate?: number
  }
}

interface AttendanceRecord {
  id: string
  user_id: string
  user_name: string
  user_email: string
  scanned_at: string
  scan_success: boolean
  failure_reason?: string
  booking_status?: string
}

export default function AttendanceTrackingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [formatFilter, setFormatFilter] = useState('all')
  const [speakerFilter, setSpeakerFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [organizerFilter, setOrganizerFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'extended' | 'compact'>('compact')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [showRecordsDialog, setShowRecordsDialog] = useState(false)

  // Fetch events
  useEffect(() => {
    if (session) {
      fetchEvents()
    }
  }, [session])

  // Filter events
  useEffect(() => {
    let filtered = events

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => {
        if (statusFilter === 'with-qr') return event.qr_code
        if (statusFilter === 'without-qr') return !event.qr_code
        if (statusFilter === 'active') return event.qr_code?.active
        if (statusFilter === 'inactive') return event.qr_code && !event.qr_code.active
        if (statusFilter === 'completed') return event.status === 'completed'
        if (statusFilter === 'upcoming') return event.status === 'published'
        return true
      })
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(event => {
        return event.category === categoryFilter ||
               (event.categories && event.categories.some(cat => cat.name === categoryFilter))
      })
    }

    // Format filter
    if (formatFilter !== 'all') {
      filtered = filtered.filter(event => event.format === formatFilter)
    }

    // Location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(event => {
        return event.location === locationFilter ||
               (event.locations && event.locations.some(loc => loc.name === locationFilter))
      })
    }

    // Organizer filter
    if (organizerFilter !== 'all') {
      filtered = filtered.filter(event => {
        return event.organizer === organizerFilter ||
               (event.organizers && event.organizers.some(org => org.name === organizerFilter)) ||
               (event.allOrganizers && event.allOrganizers.includes(organizerFilter))
      })
    }

    // Speaker filter
    if (speakerFilter !== 'all') {
      filtered = filtered.filter(event => {
        const speakers = event.speakers || ''
        if (typeof speakers !== 'string') return false
        const eventSpeakers = speakers.split(',').map(s => s.trim())
        return eventSpeakers.includes(speakerFilter)
      })
    }

    setFilteredEvents(filtered)
  }, [events, searchQuery, statusFilter, categoryFilter, formatFilter, locationFilter, organizerFilter, speakerFilter])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      
      // Fetch events with QR attendance enabled
      const response = await fetch('/api/events')
      if (!response.ok) throw new Error('Failed to fetch events')
      
      const eventsData = await response.json()
      const eventsWithQRAttendance = eventsData.filter((event: Event) => event.qr_attendance_enabled)
      
      // Fetch QR code data and attendance stats for each event
      const eventsWithQR = await Promise.all(
        eventsWithQRAttendance.map(async (event: Event) => {
          try {
            // Get QR code data
            const qrResponse = await fetch(`/api/qr-codes/${event.id}`)
            let qrCode = null
            if (qrResponse.ok) {
              const qrData = await qrResponse.json()
              qrCode = {
                id: qrData.qrCode.id,
                active: qrData.qrCode.active,
                scan_window_start: qrData.qrCode.scanWindowStart,
                scan_window_end: qrData.qrCode.scanWindowEnd,
                created_at: qrData.qrCode.createdAt,
                scan_count: qrData.qrCode.scanCount
              }
            }

            // Get attendance records for stats
            const attendanceResponse = await fetch(`/api/attendance/${event.id}`)
            let attendanceStats = null
            if (attendanceResponse.ok) {
              const attendanceData = await attendanceResponse.json()
              attendanceStats = attendanceData.stats
            }

            return { 
              ...event, 
              qr_code: qrCode,
              attendance_stats: attendanceStats
            }
          } catch (error) {
            console.error(`Failed to fetch data for event ${event.id}:`, error)
            return event
          }
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

  const fetchAttendanceRecords = async (eventId: string) => {
    try {
      setLoadingRecords(true)
      
      const response = await fetch(`/api/attendance/${eventId}`)
      if (!response.ok) throw new Error('Failed to fetch attendance records')
      
      const data = await response.json()
      setAttendanceRecords(data.records || [])
    } catch (error) {
      console.error('Error fetching attendance records:', error)
      toast.error('Failed to fetch attendance records')
    } finally {
      setLoadingRecords(false)
    }
  }

  const handleViewAttendance = (event: Event) => {
    setSelectedEvent(event)
    setShowRecordsDialog(true)
    fetchAttendanceRecords(event.id)
  }

  const handleExportAttendance = async (event: Event) => {
    try {
      const response = await fetch(`/api/attendance/${event.id}/export`)
      if (!response.ok) throw new Error('Failed to export attendance data')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance-${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${event.date}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Attendance data exported successfully!')
    } catch (error) {
      console.error('Error exporting attendance:', error)
      toast.error('Failed to export attendance data')
    }
  }

  const handleViewModeChange = (mode: 'extended' | 'compact') => {
    setViewMode(mode)
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
      if (isNaN(date.getTime())) return 'Invalid date'
      return date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Invalid date'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch (error) {
      return 'Invalid date'
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading Attendance Tracking..." />
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
                onClick={() => router.push('/qr-codes')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium">Back to QR Codes</span>
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Tracking</h1>
            <p className="text-gray-600 mt-2">
              Track and manage attendance for events with QR code attendance enabled
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
      <div className="mb-6 space-y-4">
        {/* Search and Status Row */}
        <div className="flex flex-col sm:flex-row gap-4">
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="with-qr">With QR Code</SelectItem>
                <SelectItem value="without-qr">Without QR Code</SelectItem>
                <SelectItem value="active">Active QR Codes</SelectItem>
                <SelectItem value="inactive">Inactive QR Codes</SelectItem>
                <SelectItem value="completed">Completed Events</SelectItem>
                <SelectItem value="upcoming">Upcoming Events</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Additional Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Category Filter */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Category:</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-orange-500" />
                  <SelectValue placeholder="All Categories" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Array.from(new Set(events.flatMap(event => 
                  event.categories ? event.categories.map(cat => cat.name) : [event.category]
                ))).map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Format Filter */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Format:</label>
            <Select value={formatFilter} onValueChange={setFormatFilter}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                  <SelectValue placeholder="All Formats" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                {Array.from(new Set(events.map(event => event.format).filter(Boolean))).map(format => (
                  <SelectItem key={format} value={format}>{format}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Speaker Filter */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Speaker:</label>
            <Select value={speakerFilter} onValueChange={setSpeakerFilter}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-orange-500" />
                  <SelectValue placeholder="All Speakers" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Speakers</SelectItem>
                {Array.from(new Set(events.flatMap(event => {
                  const speakers = event.speakers || ''
                  if (typeof speakers !== 'string') return []
                  return speakers.split(',').map(s => s.trim()).filter(Boolean)
                }))).map(speaker => (
                  <SelectItem key={speaker} value={speaker}>{speaker}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Location:</label>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  <SelectValue placeholder="All Locations" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {Array.from(new Set(events.flatMap(event => 
                  event.locations ? event.locations.map(loc => loc.name) : [event.location].filter(Boolean)
                ))).map(location => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Organizer Filter */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Organizer:</label>
            <Select value={organizerFilter} onValueChange={setOrganizerFilter}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-orange-500" />
                  <SelectValue placeholder="All Organizers" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizers</SelectItem>
                {Array.from(new Set(events.flatMap(event => 
                  event.organizers ? event.organizers.map(org => org.name) : [event.organizer, ...(event.allOrganizers || [])].filter(Boolean)
                ))).map(organizer => (
                  <SelectItem key={organizer} value={organizer}>{organizer}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Events ({filteredEvents.length})</h2>
        </div>
        
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => handleViewModeChange('extended')}
              className={`px-3 py-2 flex items-center gap-2 text-sm font-medium transition-all ${
                viewMode === 'extended'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Extended</span>
            </button>
            <button
              onClick={() => handleViewModeChange('compact')}
              className={`px-3 py-2 flex items-center gap-2 text-sm font-medium transition-all border-l ${
                viewMode === 'compact'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
              }`}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Compact</span>
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="grid gap-6">
        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
              <p className="text-gray-500">
                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || formatFilter !== 'all' || speakerFilter !== 'all' || locationFilter !== 'all' || organizerFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No events with QR attendance enabled found.'
                }
              </p>
            </CardContent>
          </Card>
        ) : viewMode === 'extended' ? (
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <Card key={event.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                        {getStatusBadge(event)}
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(event.date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {event.start_time} - {event.end_time}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <QrCode className="h-4 w-4" />
                            {event.location}
                          </div>
                        )}
                      </div>

                      {/* Attendance Stats */}
                      {event.attendance_stats && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">Successful Scans</span>
                            </div>
                            <p className="text-lg font-bold text-green-900">{event.attendance_stats.successful_scans}</p>
                          </div>
                          <div className="bg-red-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <UserX className="h-4 w-4 text-red-600" />
                              <span className="text-sm font-medium text-red-800">Failed Scans</span>
                            </div>
                            <p className="text-lg font-bold text-red-900">{event.attendance_stats.failed_scans}</p>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">Unique Attendees</span>
                            </div>
                            <p className="text-lg font-bold text-blue-900">{event.attendance_stats.unique_attendees}</p>
                          </div>
                          <div className="bg-purple-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4 text-purple-600" />
                              <span className="text-sm font-medium text-purple-800">Total Scans</span>
                            </div>
                            <p className="text-lg font-bold text-purple-900">{event.attendance_stats.total_scans}</p>
                          </div>
                        </div>
                      )}

                      {event.qr_code && (
                        <div className="text-sm text-gray-600">
                          <p>
                            <strong>Scan Window:</strong> {formatDateTime(event.qr_code.scan_window_start)} - {formatDateTime(event.qr_code.scan_window_end)}
                          </p>
                          <p>
                            <strong>QR Code Created:</strong> {formatDateTime(event.qr_code.created_at)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        onClick={() => handleViewAttendance(event)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Records
                      </Button>
                      <Button
                        onClick={() => handleExportAttendance(event)}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Compact Table Header */}
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
                  <div className="col-span-4">Event</div>
                  <div className="col-span-2">Date & Time</div>
                  <div className="col-span-2">Location</div>
                  <div className="col-span-2">Attendance</div>
                  <div className="col-span-2">Actions</div>
                </div>
              </CardContent>
            </Card>

            {/* Compact Table Rows */}
            {filteredEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Event Name and Status */}
                    <div className="col-span-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                        {getStatusBadge(event)}
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="col-span-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1 mb-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(event.date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.start_time} - {event.end_time}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="col-span-2 text-sm text-gray-600">
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <QrCode className="h-3 w-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Attendance Stats */}
                    <div className="col-span-2 text-sm">
                      {event.attendance_stats ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <UserCheck className="h-3 w-3 text-green-600" />
                            <span className="text-green-600 font-medium">{event.attendance_stats.successful_scans}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-blue-600" />
                            <span className="text-blue-600 font-medium">{event.attendance_stats.unique_attendees}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No data</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => handleViewAttendance(event)}
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => handleExportAttendance(event)}
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Attendance Records Dialog */}
      <Dialog open={showRecordsDialog} onOpenChange={setShowRecordsDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Attendance Records - {selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              Detailed attendance records for this event
            </DialogDescription>
          </DialogHeader>
          
          {loadingRecords ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading attendance records...
            </div>
          ) : (
            <div className="space-y-4">
              {attendanceRecords.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No attendance records found for this event.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attendanceRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {record.scan_success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium">{record.user_name}</p>
                          <p className="text-sm text-gray-500">{record.user_email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatDateTime(record.scanned_at)}
                        </p>
                        {!record.scan_success && record.failure_reason && (
                          <p className="text-xs text-red-600">{record.failure_reason}</p>
                        )}
                        {record.booking_status && (
                          <Badge variant="outline" className="text-xs">
                            {record.booking_status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
