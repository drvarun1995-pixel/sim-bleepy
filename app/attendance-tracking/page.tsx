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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
  List,
  RotateCcw
} from 'lucide-react'
import { toast } from 'sonner'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { useOnboardingTour } from '@/components/onboarding/OnboardingContext'
import { createCompleteAttendanceTrackingTour } from '@/lib/onboarding/steps/attendance-tracking/CompleteAttendanceTrackingTour'

interface Event {
  id: string
  title: string
  date: string
  start_time: string
  end_time: string
  location?: string
  locations?: Array<{ id: string; name: string }>
  category?: string
  categories?: Array<{ id: string; name: string; color?: string }>
  format?: string
  organizer?: string
  organizers?: Array<{ id: string; name: string } | string>
  allOrganizers?: string[]
  speakers?: Array<{ id: string; name: string; role: string } | string> | string
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
  const { startTourWithSteps } = useOnboardingTour()
  
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
  const [sortField, setSortField] = useState<'title' | 'date' | 'location' | 'organizer' | 'speaker'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // State for filter options from Supabase
  const [filterOptions, setFilterOptions] = useState({
    categories: [] as Array<{ id: string; name: string; color: string }>,
    locations: [] as Array<{ id: string; name: string }>,
    organizers: [] as Array<{ id: string; name: string }>,
    formats: [] as Array<{ id: string; name: string; color: string }>,
    speakers: [] as Array<{ id: string; name: string; role: string }>
  });

  // Fetch filter options from Supabase
  const fetchFilterOptions = async () => {
    try {
      const [categoriesRes, locationsRes, organizersRes, formatsRes, speakersRes] = await Promise.all([
        fetch('/api/attendance-tracking/filter-options?type=categories'),
        fetch('/api/attendance-tracking/filter-options?type=locations'),
        fetch('/api/attendance-tracking/filter-options?type=organizers'),
        fetch('/api/attendance-tracking/filter-options?type=formats'),
        fetch('/api/attendance-tracking/filter-options?type=speakers')
      ]);

      const [categoriesData, locationsData, organizersData, formatsData, speakersData] = await Promise.all([
        categoriesRes.json(),
        locationsRes.json(),
        organizersRes.json(),
        formatsRes.json(),
        speakersRes.json()
      ]);

      setFilterOptions({
        categories: categoriesData.data || [],
        locations: locationsData.data || [],
        organizers: organizersData.data || [],
        formats: formatsData.data || [],
        speakers: speakersData.data || []
      });
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  // Get category color from database
  const getCategoryColor = (categoryName: string) => {
    const category = filterOptions.categories.find(cat => cat.name === categoryName);
    return category?.color || '#FCD34D';
  };

  // Get hierarchical categories for dropdown with color coding
  const getHierarchicalCategoriesForDropdown = () => {
    const categoriesMap = new Map<string, string>();
    
    // Use real data from Supabase
    filterOptions.categories.forEach(cat => {
      categoriesMap.set(cat.name, cat.color || '#FCD34D');
    });

    const parentCategories = ['ARU', 'UCL', 'Foundation Year Doctors'];
    const hierarchy: Array<{ name: string; isParent: boolean; color: string }> = [];
    
    parentCategories.forEach(parent => {
      const children = Array.from(categoriesMap.keys()).filter(cat => 
        cat !== parent && cat.includes(parent)
      );
      
      if (categoriesMap.has(parent) || children.length > 0) {
        hierarchy.push({ 
          name: parent, 
          isParent: true, 
          color: categoriesMap.get(parent) || '#FCD34D' 
        });
        
        children.sort().forEach(child => {
          hierarchy.push({ 
            name: child, 
            isParent: false, 
            color: categoriesMap.get(child) || '#FCD34D' 
          });
        });
      }
    });
    
    Array.from(categoriesMap.keys())
      .filter(cat => !hierarchy.some(h => h.name === cat))
      .forEach(cat => {
        hierarchy.push({ 
          name: cat, 
          isParent: false, 
          color: categoriesMap.get(cat) || '#FCD34D' 
        });
      });
    
    return hierarchy;
  };

  // Format color helpers (use database-provided colors from filterOptions)
  const isLightHexColor = (hex: string): boolean => {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) return false
    // Expand shorthand like #abc
    const full = hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex
    const r = parseInt(full.slice(1, 3), 16)
    const g = parseInt(full.slice(3, 5), 16)
    const b = parseInt(full.slice(5, 7), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 155
  }

  const getFormatColorFromOptions = (formatName?: string): string | undefined => {
    if (!formatName) return undefined
    const found = filterOptions.formats.find(f => f.name === formatName)
    return found?.color
  }

  const getFormatBadgeStyle = (formatName?: string): React.CSSProperties => {
    const hex = getFormatColorFromOptions(formatName || '')
    if (!hex) return {}
    const light = isLightHexColor(hex)
    return { backgroundColor: hex, color: light ? '#111827' : '#ffffff' }
  }
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [showRecordsDialog, setShowRecordsDialog] = useState(false)

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem('attendance-view-mode') as 'extended' | 'compact' | null
    const savedSortField = localStorage.getItem('attendance-sort-field') as 'title' | 'date' | 'location' | 'organizer' | 'speaker' | null
    const savedSortDirection = localStorage.getItem('attendance-sort-direction') as 'asc' | 'desc' | null
    
    if (savedViewMode) setViewMode(savedViewMode)
    if (savedSortField) setSortField(savedSortField)
    if (savedSortDirection) setSortDirection(savedSortDirection)
  }, [])

  // Fetch events and filter options
  useEffect(() => {
    if (session) {
      fetchEvents()
      fetchFilterOptions()
    }
  }, [session])

  // Filter events
  useEffect(() => {

    let filtered = events

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.location && event.location.toLowerCase().includes(searchQuery.toLowerCase()))
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
      filtered = filtered.filter(event => {
        const formatName = typeof event.format === 'string' ? event.format : (event as any).format?.name || ''
        return formatName === formatFilter
      })
    }

    // Location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(event => {
        // Check main location field first (string or object with name)
        const mainLocation = typeof (event as any).location === 'string' 
          ? (event as any).location 
          : (event as any).location?.name
        if (mainLocation === locationFilter) return true
        // Then check locations array
        if (event.locations && event.locations.some(loc => loc.name === locationFilter)) return true
        return false
      })
    }

    // Organizer filter
    if (organizerFilter !== 'all') {
      filtered = filtered.filter(event => {
        // Check main organizer field first (string or object with name)
        const mainOrganizer = typeof (event as any).organizer === 'string' 
          ? (event as any).organizer 
          : (event as any).organizer?.name
        if (mainOrganizer === organizerFilter) return true
        // Then check organizers array
        if (event.organizers && event.organizers.some(org => {
          const orgName = typeof org === 'string' ? org : (org as any)?.name || ''
          return orgName === organizerFilter
        })) return true
        // Then check allOrganizers array
        if (event.allOrganizers && event.allOrganizers.includes(organizerFilter)) return true
        return false
      })
    }

    // Speaker filter
    if (speakerFilter !== 'all') {
      filtered = filtered.filter(event => {
        if (!event.speakers) return false
        
        if (Array.isArray(event.speakers)) {
          // Handle array of objects or strings
          return event.speakers.some(speaker => {
            const speakerName = typeof speaker === 'string' ? speaker : (speaker as any)?.name || ''
            return speakerName === speakerFilter
          })
        } else if (typeof event.speakers === 'string') {
          // Handle comma-separated string
          const eventSpeakers = event.speakers.split(',').map(s => s.trim())
          return eventSpeakers.includes(speakerFilter)
        }
        
        return false
      })
    }

    // Sort the filtered events
    const sortedFiltered = sortEvents(filtered)
    setFilteredEvents(sortedFiltered)
  }, [events, searchQuery, statusFilter, categoryFilter, formatFilter, locationFilter, organizerFilter, speakerFilter, sortField, sortDirection])

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('attendance-view-mode', viewMode)
  }, [viewMode])

  useEffect(() => {
    localStorage.setItem('attendance-sort-field', sortField)
  }, [sortField])

  useEffect(() => {
    localStorage.setItem('attendance-sort-direction', sortDirection)
  }, [sortDirection])

  // Sort events
  const sortEvents = (events: Event[]) => {
    return [...events].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'date':
          aValue = new Date(a.date).getTime()
          bValue = new Date(b.date).getTime()
          break
        case 'location':
          aValue = (a.location || a.locations?.[0]?.name || '').toLowerCase()
          bValue = (b.location || b.locations?.[0]?.name || '').toLowerCase()
          break
        case 'organizer':
          const aOrganizer = a.organizer || (a.organizers?.[0] && typeof a.organizers[0] === 'object' ? a.organizers[0].name : a.organizers?.[0]) || ''
          const bOrganizer = b.organizer || (b.organizers?.[0] && typeof b.organizers[0] === 'object' ? b.organizers[0].name : b.organizers?.[0]) || ''
          aValue = (typeof aOrganizer === 'string' ? aOrganizer : (aOrganizer as any)?.name || '').toLowerCase()
          bValue = (typeof bOrganizer === 'string' ? bOrganizer : (bOrganizer as any)?.name || '').toLowerCase()
          break
        case 'speaker':
          const aSpeakers = Array.isArray(a.speakers) 
            ? a.speakers.map(s => typeof s === 'string' ? s : (s as any)?.name || '').join(', ')
            : a.speakers || ''
          const bSpeakers = Array.isArray(b.speakers) 
            ? b.speakers.map(s => typeof s === 'string' ? s : (s as any)?.name || '').join(', ')
            : b.speakers || ''
          aValue = aSpeakers.toLowerCase()
          bValue = bSpeakers.toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  const fetchEvents = async () => {
    try {
      setLoading(true)
      
      // Fetch events with QR attendance enabled
      const response = await fetch('/api/events')
      if (!response.ok) throw new Error('Failed to fetch events')
      
      const eventsData = await response.json()

      // Normalize shape to match Events page expectations
      const normalized: Event[] = (eventsData || []).map((e: any) => {
        // Build allOrganizers array: main + additional
        const allOrganizers: string[] = []
        const mainOrg = e.organizer_name || e.organizer || (e.organizer?.name) || ''
        if (mainOrg && String(mainOrg).trim()) allOrganizers.push(String(mainOrg))
        if (Array.isArray(e.organizers)) {
          e.organizers.forEach((org: any) => {
            const name = typeof org === 'string' ? org : org?.name
            if (name && !allOrganizers.includes(name)) allOrganizers.push(name)
          })
        }

        // Speakers -> string
        let speakers: any = e.speakers
        if (Array.isArray(e.speakers)) {
          speakers = e.speakers.map((s: any) => (typeof s === 'string' ? s : s?.name)).filter(Boolean).join(', ')
        }

        return {
          id: e.id,
          title: e.title,
          date: e.date,
          start_time: e.start_time || '',
          end_time: e.end_time || '',
          // main + additional locations
          location: e.location_name || (typeof e.location === 'string' ? e.location : e.location?.name) || '',
          locations: e.locations || [],
          // categories
          category: e.category_name || e.category || '',
          categories: e.categories || [],
          // format
          format: e.format_name || e.format || '',
          // organizers
          organizer: e.organizer_name || (typeof e.organizer === 'string' ? e.organizer : e.organizer?.name) || '',
          organizers: e.organizers || [],
          allOrganizers,
          // speakers
          speakers,
          status: e.status || 'published',
          qr_attendance_enabled: e.qr_attendance_enabled,
        } as Event
      })

      const eventsWithQRAttendance = normalized.filter((event: Event) => event.qr_attendance_enabled)
      
      // Fetch QR code data and attendance stats for each event
      const eventsWithQR = await Promise.all(
        eventsWithQRAttendance.map(async (event: Event) => {
          try {
            // Get QR code data
            const qrResponse = await fetch(`/api/qr-codes/${event.id}`)
            let qrCode: any = null
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
            let attendanceStats: any = null
            if (attendanceResponse.ok) {
              const attendanceData = await attendanceResponse.json()
              attendanceStats = attendanceData.stats
            }

            return { 
              ...event, 
              qr_code: qrCode || undefined,
              attendance_stats: attendanceStats || undefined
            } as Event
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

  const handleSort = (field: 'title' | 'date' | 'location' | 'organizer' | 'speaker') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: 'title' | 'date' | 'location' | 'organizer' | 'speaker') => {
    if (sortField !== field) {
      return (
        <div className="flex flex-col opacity-30">
          <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[4px] border-l-transparent border-r-transparent border-b-gray-400"></div>
          <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-gray-400 mt-0.5"></div>
        </div>
      )
    }
    
    return sortDirection === 'asc' ? (
      <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[4px] border-l-transparent border-r-transparent border-b-gray-600"></div>
    ) : (
      <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-gray-600"></div>
    )
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

  const handleResetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setCategoryFilter('all')
    setFormatFilter('all')
    setSpeakerFilter('all')
    setLocationFilter('all')
    setOrganizerFilter('all')
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
    <TooltipProvider>
      <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
          <div className="flex items-center gap-3">
          <Button
            onClick={fetchEvents}
            variant="outline"
            size="sm"
            className="self-start sm:self-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
            <Button
              onClick={() => {
                const userRole = session?.user?.role || 'meded_team'
                const attendanceTrackingSteps = createCompleteAttendanceTrackingTour({ 
                  role: userRole as any
                })
                if (startTourWithSteps) {
                  startTourWithSteps(attendanceTrackingSteps)
                }
              }}
              variant="secondary"
              className="hidden lg:flex items-center justify-center gap-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-900"
            >
              <Sparkles className="h-4 w-4" />
              Start Attendance Tracking Tour
            </Button>
          </div>
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
                data-tour="attendance-tracking-search"
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

        {/* Filter Dropdowns - Responsive Layout */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4" data-tour="attendance-tracking-filters">
          <div className="w-full">
            <label className="text-sm text-gray-600 mb-1 block">Category:</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-orange-500" />
                  <SelectValue placeholder="Category" />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">Categories</SelectItem>
                {getHierarchicalCategoriesForDropdown().map((category, index) => (
                  <SelectItem 
                    key={index} 
                    value={category.name}
                    className={category.isParent ? 'font-semibold' : ''}
                  >
                    <div className={`flex items-center gap-2 ${category.isParent ? '' : 'pl-4'}`}>
                      <div 
                        className={`rounded-full ${category.isParent ? 'w-3 h-3' : 'w-2 h-2'}`}
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full">
            <label className="text-sm text-gray-600 mb-1 block">Location:</label>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  <SelectValue placeholder="Location" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Location</SelectItem>
                {filterOptions.locations.map((location) => (
                  <SelectItem key={location.id} value={location.name}>{location.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full">
            <label className="text-sm text-gray-600 mb-1 block">Organizer:</label>
            <Select value={organizerFilter} onValueChange={setOrganizerFilter}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-orange-500" />
                  <SelectValue placeholder="Organizer" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Organizer</SelectItem>
                {filterOptions.organizers.map((organizer) => (
                  <SelectItem key={organizer.id} value={organizer.name}>{organizer.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full">
            <label className="text-sm text-gray-600 mb-1 block">Speaker:</label>
            <Select value={speakerFilter} onValueChange={setSpeakerFilter}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-orange-500" />
                  <SelectValue placeholder="Speaker" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Speaker</SelectItem>
                {filterOptions.speakers.map((speaker) => (
                  <SelectItem key={speaker.id} value={speaker.name}>{speaker.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full">
            <label className="text-sm text-gray-600 mb-1 block">Format:</label>
            <Select value={formatFilter} onValueChange={setFormatFilter}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                  <SelectValue placeholder="Format" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Format</SelectItem>
                {filterOptions.formats.map((format) => (
                  <SelectItem key={format.id} value={format.name}>{format.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Events ({filteredEvents.length})</h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 sm:gap-4" data-tour="attendance-tracking-buttons">
          {/* Reset Filters Button */}
          <Button
            onClick={handleResetFilters}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Reset Filters</span>
          </Button>
          
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
      <div className="grid gap-6" data-tour="attendance-tracking-list">
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
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          {getStatusBadge(event)}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1 min-w-[140px]">
                          <Calendar className="h-4 w-4" />
                          {formatDate(event.date)}
                        </div>
                        <div className="flex items-center gap-1 min-w-[150px]">
                          <Clock className="h-4 w-4" />
                          {event.start_time} - {event.end_time}
                        </div>
                        {(() => {
                          const categories = event.categories || [];
                          const mainCategory = event.category;
                          const allCategories = mainCategory ? [mainCategory, ...categories.map(cat => cat.name)] : categories.map(cat => cat.name);
                          const uniqueCategories = Array.from(new Set(allCategories)).filter(Boolean);
                          const displayCategories = uniqueCategories.slice(0, 3);
                          const remainingCount = uniqueCategories.length - 3;
                          
                          if (uniqueCategories.length === 0) return null;
                          
                          return (
                            <div className="flex items-center gap-1 flex-wrap">
                              {displayCategories.map((category, index) => (
                                <div key={index} className="flex items-center gap-1">
                                  <Folder 
                                    className="h-4 w-4" 
                                    style={{ color: getCategoryColor(category) }}
                                  />
                                  <span>{category}</span>
                                </div>
                              ))}
                              {remainingCount > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 hover:underline">
                                      +{remainingCount}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="max-w-xs">
                                      <p className="font-medium mb-1">All Categories:</p>
                                      <div className="space-y-1">
                                        {uniqueCategories.map((cat, index) => (
                                          <div key={index} className="flex items-center gap-1">
                                            <Folder 
                                              className="h-3 w-3" 
                                              style={{ color: getCategoryColor(cat) }}
                                            />
                                            <span className="text-sm">{cat}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          );
                        })()}
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                        )}
                        {event.locations && event.locations.length > 0 && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {event.locations[0].name}
                            {event.locations.length > 1 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 hover:underline">
                                    +{event.locations.length - 1}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="max-w-xs">
                                    <p className="font-medium mb-1">All Locations:</p>
                                    <div className="space-y-1">
                                      {event.locations.map((loc, index) => (
                                        <div key={index} className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3 text-blue-500" />
                                          <span className="text-sm">{loc.name}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
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

                    <div className="flex flex-wrap items-center justify-end gap-2 lg:flex-col lg:items-stretch lg:w-48">
                      <Button
                        onClick={() => handleViewAttendance(event)}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Records
                      </Button>
                      <Button
                        onClick={() => handleExportAttendance(event)}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
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
          <div className="overflow-x-auto">
            <div className="min-w-[900px] bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-14 gap-4 px-4 sm:px-6 py-4 text-xs sm:text-sm font-semibold text-gray-700">
                <div 
                  className="col-span-4 flex items-center gap-2 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort('title')}
                >
                  EVENT
                  {getSortIcon('title')}
                </div>
                <div 
                  className="col-span-2 flex items-center gap-2 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort('date')}
                >
                  DATE & TIME
                  {getSortIcon('date')}
                </div>
                <div 
                  className="col-span-2 flex items-center gap-2 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort('location')}
                >
                  LOCATION
                  {getSortIcon('location')}
                </div>
                <div 
                  className="col-span-2 flex items-center gap-2 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort('organizer')}
                >
                  ORGANIZER
                  {getSortIcon('organizer')}
                </div>
                <div 
                  className="col-span-2 flex items-center gap-2 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort('speaker')}
                >
                  SPEAKER
                  {getSortIcon('speaker')}
                </div>
                <div className="col-span-2">
                  ACTIONS
                </div>
              </div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-gray-200">
              {filteredEvents.map((event) => (
              <div key={event.id} className="hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-14 gap-4 px-4 sm:px-6 py-4 text-sm">
                    {/* Event Column */}
                    <div className="col-span-4">
                      <div className="flex items-start gap-3">
                        {/* Color Bar */}
                        <div 
                          className="w-1 h-12 rounded-full"
                          style={{ 
                            backgroundColor: getCategoryColor(event.category || event.categories?.[0]?.name || '') 
                          }}
                        ></div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{event.title}</h3>
                          <div className="mt-2 space-y-2">
                            {/* Categories */}
                            <div className="flex flex-wrap gap-1">
                              {(() => {
                                const categories = event.categories || [];
                                const mainCategory = event.category;
                                const allCategories = mainCategory ? [mainCategory, ...categories.map(cat => cat.name)] : categories.map(cat => cat.name);
                                const uniqueCategories = Array.from(new Set(allCategories)).filter(Boolean) as string[];
                                const sortedCategories = [...uniqueCategories].sort((a, b) => a.localeCompare(b));
                                const displayCategories = sortedCategories.slice(0, 3);
                                const remainingCount = Math.max(0, sortedCategories.length - 3);
                                
                                return (
                                  <>
                                    {displayCategories.map((category, index) => (
                                      <Badge 
                                        key={index}
                                        className="text-xs px-2 py-1 text-white"
                                        style={{ 
                                          backgroundColor: getCategoryColor(category) 
                                        }}
                                      >
                                        {category}
                                      </Badge>
                                    ))}
                                    {remainingCount > 0 && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="text-xs text-gray-500 px-2 py-1 cursor-pointer hover:text-gray-700 hover:underline">
                                            +{remainingCount}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <div className="max-w-xs">
                                            <p className="font-medium mb-1">All Categories:</p>
                                            <div className="space-y-1">
                                              {sortedCategories.map((cat, idx) => (
                                                <div key={idx} className="flex items-center gap-1">
                                                  <Folder 
                                                    className="h-3 w-3" 
                                                    style={{ color: getCategoryColor(cat) }}
                                                  />
                                                  <span className="text-sm">{cat}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                            
                            {/* Format */}
                            {event.format && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Format:</span>
                                <span
                                  className="text-xs px-2 py-1 rounded"
                                  style={getFormatBadgeStyle(typeof event.format === 'string' ? event.format : (event as any).format?.name)}
                                >
                                  {typeof event.format === 'string' ? event.format : (event as any).format?.name || event.format}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Date & Time Column */}
                    <div className="col-span-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{event.start_time} - {event.end_time}</span>
                      </div>
                    </div>

                    {/* Location Column */}
                    <div className="col-span-2 text-sm text-gray-600">
                      {(() => {
                        const mainLocation = typeof event.location === 'string' 
                          ? event.location 
                          : (event as any).location?.name
                        const additionalLocations = event.locations || []
                        
                        if (mainLocation) {
                          return (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span>{mainLocation}</span>
                              </div>
                              {additionalLocations.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                  <span>{additionalLocations[0].name}</span>
                                  {additionalLocations.length > 1 && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 hover:underline">
                                          +{additionalLocations.length - 1}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="max-w-xs">
                                          <p className="font-medium mb-1">All Locations:</p>
                                          <div className="space-y-1">
                                            {/* Include main location first */}
                                            <div className="flex items-center gap-1">
                                              <MapPin className="h-3 w-3 text-blue-500" />
                                              <span className="text-sm">{mainLocation}</span>
                                            </div>
                                            {additionalLocations.map((loc, index) => (
                                              <div key={index} className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3 text-blue-500" />
                                                <span className="text-sm">{loc.name}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        } else if (additionalLocations.length > 0) {
                          return (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span>{additionalLocations[0].name}</span>
                              {additionalLocations.length > 1 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 hover:underline">
                                      +{additionalLocations.length - 1}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="max-w-xs">
                                      <p className="font-medium mb-1">All Locations:</p>
                                      <div className="space-y-1">
                                        {additionalLocations.map((loc, index) => (
                                          <div key={index} className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3 text-blue-500" />
                                            <span className="text-sm">{loc.name}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          )
                        } else {
                          return <span className="text-gray-400">-</span>
                        }
                      })()}
                    </div>

                    {/* Organizer Column */}
                    <div className="col-span-2 text-sm text-gray-600">
                      {(() => {
                        const mainOrganizer = typeof event.organizer === 'string' 
                          ? event.organizer 
                          : (event as any).organizer?.name
                        const additionalOrganizers = event.organizers || []
                        
                        if (mainOrganizer) {
                          return (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <UserCircle className="h-4 w-4 text-gray-400" />
                                <span>{mainOrganizer}</span>
                              </div>
                              {additionalOrganizers.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <UserCircle className="h-4 w-4 text-gray-400" />
                                  <span>{typeof additionalOrganizers[0] === 'string' ? additionalOrganizers[0] : additionalOrganizers[0]?.name || 'Unknown'}</span>
                                  {additionalOrganizers.length > 1 && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 hover:underline">
                                          +{additionalOrganizers.length - 1}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="max-w-xs">
                                          <p className="font-medium mb-1">All Organizers:</p>
                                          <div className="space-y-1">
                                            {/* Include main organizer first */}
                                            <div className="flex items-center gap-1">
                                              <UserCircle className="h-3 w-3 text-blue-500" />
                                              <span className="text-sm">{mainOrganizer}</span>
                                            </div>
                                            {additionalOrganizers.map((org, index) => (
                                              <div key={index} className="flex items-center gap-1">
                                                <UserCircle className="h-3 w-3 text-blue-500" />
                                                <span className="text-sm">{typeof org === 'string' ? org : org?.name || 'Unknown'}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        } else if (additionalOrganizers.length > 0) {
                          return (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <UserCircle className="h-4 w-4 text-gray-400" />
                                <span>{typeof additionalOrganizers[0] === 'string' ? additionalOrganizers[0] : additionalOrganizers[0]?.name || 'Unknown'}</span>
                              </div>
                              {additionalOrganizers.length > 1 && (
                                <div className="flex items-center gap-2">
                                  <UserCircle className="h-4 w-4 text-gray-400" />
                                  <span>{typeof additionalOrganizers[1] === 'string' ? additionalOrganizers[1] : additionalOrganizers[1]?.name || 'Unknown'}</span>
                                  {additionalOrganizers.length > 2 && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 hover:underline">
                                          +{additionalOrganizers.length - 2}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="max-w-xs">
                                          <p className="font-medium mb-1">All Organizers:</p>
                                          <div className="space-y-1">
                                            {additionalOrganizers.map((org, index) => (
                                              <div key={index} className="flex items-center gap-1">
                                                <UserCircle className="h-3 w-3 text-blue-500" />
                                                <span className="text-sm">{typeof org === 'string' ? org : org?.name || 'Unknown'}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        } else {
                          return <span className="text-gray-400">-</span>
                        }
                      })()}
                    </div>

                    {/* Speaker Column */}
                    <div className="col-span-2 text-sm text-gray-600">
                      {event.speakers ? (
                        <div className="flex items-center gap-2">
                          <Mic className="h-4 w-4 text-gray-400" />
                          <span>
                            {Array.isArray(event.speakers) 
                              ? event.speakers.map(speaker => 
                                  typeof speaker === 'string' ? speaker : speaker?.name || 'Unknown'
                                ).join(', ')
                              : typeof event.speakers === 'string' 
                                ? event.speakers 
                                : 'Unknown'
                            }
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>

                    {/* Actions Column */}
                    <div className="col-span-2 flex flex-col gap-2">
                      <Button
                        onClick={() => handleViewAttendance(event)}
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs w-full"
                        title="View Attendance Records"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Attendance
                      </Button>
                      <Button
                        onClick={() => handleExportAttendance(event)}
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs w-full"
                        title="Export Attendance Data"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>
        )}
      </div>

      {/* Attendance Records Dialog */}
      <Dialog open={showRecordsDialog} onOpenChange={setShowRecordsDialog}>
        <DialogContent className="sm:max-w-4xl w-[95vw] sm:w-auto max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="pr-10">Attendance Records - {selectedEvent?.title}</DialogTitle>
            <DialogDescription className="pr-10">
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
    </TooltipProvider>
  )
}
