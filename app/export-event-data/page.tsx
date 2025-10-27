'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  Filter, 
  CheckCircle, 
  ArrowLeft,
  Loader2,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { getEvents } from '@/lib/events-api'
import { getCategories, getFormats, getLocations, getOrganizers, getSpeakers } from '@/lib/events-api'
import * as XLSX from 'xlsx'

interface Event {
  id: string
  title: string
  description: string
  date: string
  start_time: string
  end_time: string
  is_all_day: boolean
  hide_time: boolean
  hide_end_time: boolean
  time_notes: string
  location_name: string
  locations?: Array<{ id: string; name: string; address?: string }>
  hide_location: boolean
  organizer_name: string
  hide_organizer: boolean
  organizers?: Array<{ id: string; name: string }>
  allOrganizers?: string[]
  category_name: string
  categories?: Array<{ id: string; name: string; color?: string }>
  format_name: string
  formatColor?: string
  speaker_names: string
  hide_speakers: boolean
  event_link: string
  more_info_link: string
  more_info_target: string
  event_status: string
  booking_enabled: boolean
  booking_capacity: number
  qr_attendance_enabled: boolean
  created_at: string
  updated_at: string
  author?: string
  attendees?: number
  status?: string
}

interface FilterOptions {
  categories: Array<{ id: string; name: string }>
  formats: Array<{ id: string; name: string }>
  locations: Array<{ id: string; name: string }>
  organizers: Array<{ id: string; name: string }>
  speakers: Array<{ id: string; name: string }>
}

const AVAILABLE_COLUMNS = [
  { key: 'title', label: 'Title', required: true },
  { key: 'description', label: 'Description' },
  { key: 'date', label: 'Date', required: true },
  { key: 'start_time', label: 'Start Time' },
  { key: 'end_time', label: 'End Time' },
  { key: 'is_all_day', label: 'All Day' },
  { key: 'time_notes', label: 'Time Notes' },
  { key: 'location_name', label: 'Location' },
  { key: 'organizer_name', label: 'Organizer' },
  { key: 'category_name', label: 'Category' },
  { key: 'format_name', label: 'Format' },
  { key: 'speaker_names', label: 'Speakers' },
  { key: 'event_link', label: 'Event Link' },
  { key: 'more_info_link', label: 'More Info Link' },
  { key: 'event_status', label: 'Status' },
  { key: 'booking_enabled', label: 'Booking Enabled' },
  { key: 'booking_capacity', label: 'Booking Capacity' },
  { key: 'qr_attendance_enabled', label: 'QR Attendance' },
  { key: 'created_at', label: 'Created At' },
  { key: 'updated_at', label: 'Updated At' }
]

const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV', description: 'Comma-separated values' },
  { value: 'xlsx', label: 'Excel', description: 'Microsoft Excel format' },
  { value: 'json', label: 'JSON', description: 'JavaScript Object Notation' }
]

export default function ExportEventDataPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<Event[]>([])
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    formats: [],
    locations: [],
    organizers: [],
    speakers: []
  })
  
  // Export configuration
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['title', 'date'])
  const [exportFormat, setExportFormat] = useState('csv')
  const [fileName, setFileName] = useState('event-data-export')
  
  // Filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedFormats, setSelectedFormats] = useState<string[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [selectedOrganizers, setSelectedOrganizers] = useState<string[]>([])
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Export progress
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportedCount, setExportedCount] = useState(0)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user) {
      router.push('/auth/signin')
      return
    }

    loadData()
  }, [session, status, router])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load events and filter options in parallel
      const [eventsData, categoriesData, formatsData, locationsData, organizersData, speakersData] = await Promise.all([
        getEvents(),
        getCategories(),
        getFormats(),
        getLocations(),
        getOrganizers(),
        getSpeakers()
      ])

      // Transform events data to match events-list page structure
      const transformedEvents = (eventsData || []).map((event: any) => {
        // Build allOrganizers array from main organizer + additional organizers
        const allOrganizers: string[] = [];
        
        // Add main organizer if it exists
        if (event.organizer_name && event.organizer_name.trim()) {
          allOrganizers.push(event.organizer_name);
        }
        
        // Add additional organizers from the organizers array
        if (event.organizers && Array.isArray(event.organizers)) {
          event.organizers.forEach((org: any) => {
            if (org.name && org.name.trim() && !allOrganizers.includes(org.name)) {
              allOrganizers.push(org.name);
            }
          });
        }
        
        return {
          id: event.id,
          title: event.title,
          description: event.description || '',
          date: event.date,
          start_time: event.start_time || '',
          end_time: event.end_time || '',
          is_all_day: event.is_all_day || false,
          hide_time: event.hide_time || false,
          hide_end_time: event.hide_end_time || false,
          time_notes: event.time_notes || '',
          location_name: event.location_name || event.location_id || '',
          locations: event.locations || [], // Include all locations from junction table
          hide_location: event.hide_location || false,
          organizer_name: event.organizer_name || '',
          hide_organizer: event.hide_organizer || false,
          allOrganizers: allOrganizers, // All organizers for display
          category_name: event.category_name || '',
          categories: event.categories || [],
          format_name: event.format_name || '',
          formatColor: event.format_color || '',
          speaker_names: event.speakers ? event.speakers.map((s: any) => s.name).join(', ') : '',
          hide_speakers: event.hide_speakers || false,
          attendees: event.attendees || 0,
          status: event.status || 'published',
          event_link: event.event_link,
          more_info_link: event.more_info_link,
          more_info_target: event.more_info_target,
          event_status: event.event_status,
          author: event.author_name || 'Unknown',
          organizers: event.organizers || [],
          // Keep original fields for compatibility
          booking_enabled: event.booking_enabled,
          booking_capacity: event.booking_capacity,
          qr_attendance_enabled: event.qr_attendance_enabled,
          created_at: event.created_at,
          updated_at: event.updated_at
        };
      });

      setEvents(transformedEvents)
      setFilterOptions({
        categories: categoriesData || [],
        formats: formatsData || [],
        locations: locationsData || [],
        organizers: organizersData || [],
        speakers: speakersData || []
      })
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load event data')
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = useMemo(() => {
    let filtered = [...events]

    // Apply filters using the same logic as events-list page
    if (searchQuery.trim() !== "") {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(event => {
        const matchesSearch = 
          event.title.toLowerCase().includes(searchLower) ||
          (event.description || '').toLowerCase().includes(searchLower) ||
          (event.location_name || '').toLowerCase().includes(searchLower) ||
          (event.organizer_name || '').toLowerCase().includes(searchLower) ||
          (event.speaker_names || '').toLowerCase().includes(searchLower) ||
          (event.format_name || '').toLowerCase().includes(searchLower);
        
        return matchesSearch;
      });
    }

    // Category filter - match events-list logic exactly
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(event => {
        const hasMatchingCategory = selectedCategories.some(selectedCategory => 
          event.category_name === selectedCategory ||
          (event.categories && event.categories.some((cat: any) => cat.name === selectedCategory))
        );
        return hasMatchingCategory;
      });
    }

    // Format filter - match events-list logic exactly
    if (selectedFormats.length > 0) {
      filtered = filtered.filter(event => {
        const hasMatchingFormat = selectedFormats.some(selectedFormat => 
          event.format_name === selectedFormat
        );
        return hasMatchingFormat;
      });
    }

    // Location filter - match events-list logic exactly
    if (selectedLocations.length > 0) {
      filtered = filtered.filter(event => {
        const hasMatchingLocation = selectedLocations.some(selectedLocation => 
          event.location_name === selectedLocation ||
          (event.locations && event.locations.some((loc: any) => loc.name === selectedLocation))
        );
        return hasMatchingLocation;
      });
    }

    // Organizer filter - match events-list logic exactly
    if (selectedOrganizers.length > 0) {
      filtered = filtered.filter(event => {
        const hasMatchingOrganizer = selectedOrganizers.some(selectedOrganizer => 
          event.organizer_name === selectedOrganizer ||
          (event.organizers && event.organizers.some((org: any) => org.name === selectedOrganizer)) ||
          (event.allOrganizers && event.allOrganizers.includes(selectedOrganizer))
        );
        return hasMatchingOrganizer;
      });
    }

    // Speaker filter - match events-list logic exactly
    if (selectedSpeakers.length > 0) {
      filtered = filtered.filter(event => {
        const eventSpeakers = (event.speaker_names || '').split(',').map((s: string) => s.trim());
        const hasMatchingSpeaker = selectedSpeakers.some(selectedSpeaker => 
          eventSpeakers.includes(selectedSpeaker)
        );
        return hasMatchingSpeaker;
      });
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(event => event.event_status === statusFilter)
    }

    if (dateFrom) {
      filtered = filtered.filter(event => event.date >= dateFrom)
    }

    if (dateTo) {
      filtered = filtered.filter(event => event.date <= dateTo)
    }

    return filtered
  }, [events, searchQuery, selectedCategories, selectedFormats, selectedLocations, selectedOrganizers, selectedSpeakers, statusFilter, dateFrom, dateTo])

  const handleColumnToggle = (columnKey: string) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnKey)) {
        return prev.filter(key => key !== columnKey)
      } else {
        return [...prev, columnKey]
      }
    })
  }

  const handleSelectAllColumns = () => {
    setSelectedColumns(AVAILABLE_COLUMNS.map(col => col.key))
  }

  const handleDeselectAllColumns = () => {
    setSelectedColumns(AVAILABLE_COLUMNS.filter(col => col.required).map(col => col.key))
  }

  const clearFilters = () => {
    setSelectedCategories([])
    setSelectedFormats([])
    setSelectedLocations([])
    setSelectedOrganizers([])
    setSelectedSpeakers([])
    setStatusFilter('all')
    setDateFrom('')
    setDateTo('')
    setSearchQuery('')
  }

  // Multi-select helper functions
  const handleMultiSelectToggle = (
    value: string, 
    selectedValues: string[], 
    setSelectedValues: (values: string[]) => void
  ) => {
    if (selectedValues.includes(value)) {
      setSelectedValues(selectedValues.filter(v => v !== value))
    } else {
      setSelectedValues([...selectedValues, value])
    }
  }

  const handleSelectAll = (
    allValues: string[], 
    setSelectedValues: (values: string[]) => void
  ) => {
    setSelectedValues(allValues)
  }

  const handleDeselectAll = (
    setSelectedValues: (values: string[]) => void
  ) => {
    setSelectedValues([])
  }

  const exportData = async () => {
    if (selectedColumns.length === 0) {
      toast.error('Please select at least one column to export')
      return
    }

    if (filteredEvents.length === 0) {
      toast.error('No events match the selected filters')
      return
    }

    setIsExporting(true)
    setExportProgress(0)
    setExportedCount(0)

    try {
      // Prepare data for export
      const exportData = filteredEvents.map(event => {
        const row: any = {}
        selectedColumns.forEach(column => {
          const columnConfig = AVAILABLE_COLUMNS.find(col => col.key === column)
          if (columnConfig) {
            row[columnConfig.label] = event[column as keyof Event] || ''
          }
        })
        return row
      })

      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 100)

      // Generate file based on format
      let blob: Blob
      let mimeType: string
      let fileExtension: string

      switch (exportFormat) {
        case 'csv':
          const csvContent = generateCSV(exportData)
          blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
          mimeType = 'text/csv'
          fileExtension = 'csv'
          break
        case 'xlsx':
          // Generate proper Excel file using xlsx library
          const worksheet = XLSX.utils.json_to_sheet(exportData)
          const workbook = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Events')
          const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
          blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          fileExtension = 'xlsx'
          break
        case 'json':
          const jsonContent = JSON.stringify(exportData, null, 2)
          blob = new Blob([jsonContent], { type: 'application/json' })
          mimeType = 'application/json'
          fileExtension = 'json'
          break
        default:
          throw new Error('Unsupported export format')
      }

      // Complete progress
      clearInterval(progressInterval)
      setExportProgress(100)
      setExportedCount(filteredEvents.length)

      // Download file
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${fileName}.${fileExtension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`Successfully exported ${filteredEvents.length} events to ${exportFormat.toUpperCase()}`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
      setExportProgress(0)
      setExportedCount(0)
    }
  }

  const generateCSV = (data: any[]) => {
    if (data.length === 0) return ''
    
    const headers = selectedColumns.map(column => {
      const columnConfig = AVAILABLE_COLUMNS.find(col => col.key === column)
      return columnConfig?.label || column
    })
    
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || ''
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ]
    
    return csvRows.join('\n')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading event data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Export Event Data</h1>
            <p className="text-gray-600">Select columns and filters to export your event data</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Column Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Select Columns to Export
              </CardTitle>
              <CardDescription>
                Choose which columns to include in your export. Title and Date are required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={handleSelectAllColumns}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeselectAllColumns}>
                  Deselect All
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_COLUMNS.map((column) => (
                  <div key={column.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.key}
                      checked={selectedColumns.includes(column.key)}
                      onCheckedChange={() => handleColumnToggle(column.key)}
                      disabled={column.required}
                    />
                    <Label 
                      htmlFor={column.key} 
                      className={`text-sm ${column.required ? 'font-semibold text-gray-900' : 'text-gray-700'}`}
                    >
                      {column.label}
                      {column.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Apply Filters
              </CardTitle>
              <CardDescription>
                Filter events before exporting. All filters are optional.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search */}
                <div>
                  <Label htmlFor="search">Search Events</Label>
                  <Input
                    id="search"
                    placeholder="Search by title, description, location, or organizer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateFrom">From Date</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateTo">To Date</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>

                {/* Multi-select Filters */}
                <div className="space-y-4">
                  {/* Category Filter */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Categories</Label>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleSelectAll(filterOptions.categories.map(c => c.name), setSelectedCategories)}
                        >
                          Select All
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeselectAll(setSelectedCategories)}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                      {filterOptions.categories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={selectedCategories.includes(category.name)}
                            onCheckedChange={() => handleMultiSelectToggle(category.name, selectedCategories, setSelectedCategories)}
                          />
                          <Label htmlFor={`category-${category.id}`} className="text-sm">
                            {category.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {selectedCategories.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedCategories.map((category) => (
                          <Badge key={category} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Format Filter */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Formats</Label>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleSelectAll(filterOptions.formats.map(f => f.name), setSelectedFormats)}
                        >
                          Select All
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeselectAll(setSelectedFormats)}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                      {filterOptions.formats.map((format) => (
                        <div key={format.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`format-${format.id}`}
                            checked={selectedFormats.includes(format.name)}
                            onCheckedChange={() => handleMultiSelectToggle(format.name, selectedFormats, setSelectedFormats)}
                          />
                          <Label htmlFor={`format-${format.id}`} className="text-sm">
                            {format.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {selectedFormats.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedFormats.map((format) => (
                          <Badge key={format} variant="secondary" className="text-xs">
                            {format}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Location Filter */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Locations</Label>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleSelectAll(filterOptions.locations.map(l => l.name), setSelectedLocations)}
                        >
                          Select All
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeselectAll(setSelectedLocations)}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                      {filterOptions.locations.map((location) => (
                        <div key={location.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`location-${location.id}`}
                            checked={selectedLocations.includes(location.name)}
                            onCheckedChange={() => handleMultiSelectToggle(location.name, selectedLocations, setSelectedLocations)}
                          />
                          <Label htmlFor={`location-${location.id}`} className="text-sm">
                            {location.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {selectedLocations.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedLocations.map((location) => (
                          <Badge key={location} variant="secondary" className="text-xs">
                            {location}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Organizer Filter */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Organizers</Label>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleSelectAll(filterOptions.organizers.map(o => o.name), setSelectedOrganizers)}
                        >
                          Select All
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeselectAll(setSelectedOrganizers)}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                      {filterOptions.organizers.map((organizer) => (
                        <div key={organizer.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`organizer-${organizer.id}`}
                            checked={selectedOrganizers.includes(organizer.name)}
                            onCheckedChange={() => handleMultiSelectToggle(organizer.name, selectedOrganizers, setSelectedOrganizers)}
                          />
                          <Label htmlFor={`organizer-${organizer.id}`} className="text-sm">
                            {organizer.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {selectedOrganizers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedOrganizers.map((organizer) => (
                          <Badge key={organizer} variant="secondary" className="text-xs">
                            {organizer}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Speaker Filter */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Speakers</Label>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleSelectAll(filterOptions.speakers.map(s => s.name), setSelectedSpeakers)}
                        >
                          Select All
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeselectAll(setSelectedSpeakers)}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                      {filterOptions.speakers.map((speaker) => (
                        <div key={speaker.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`speaker-${speaker.id}`}
                            checked={selectedSpeakers.includes(speaker.name)}
                            onCheckedChange={() => handleMultiSelectToggle(speaker.name, selectedSpeakers, setSelectedSpeakers)}
                          />
                          <Label htmlFor={`speaker-${speaker.id}`} className="text-sm">
                            {speaker.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {selectedSpeakers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedSpeakers.map((speaker) => (
                          <Badge key={speaker} variant="secondary" className="text-xs">
                            {speaker}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" onClick={clearFilters} className="w-full">
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Settings & Preview */}
        <div className="space-y-6">
          {/* Export Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fileName">File Name</Label>
                <Input
                  id="fileName"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="event-data-export"
                />
              </div>

              <div>
                <Label htmlFor="format">Export Format</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPORT_FORMATS.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{format.label}</span>
                          <span className="text-sm text-gray-500">- {format.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={exportData} 
                disabled={isExporting || selectedColumns.length === 0}
                className="w-full"
                size="lg"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Selected Columns:</span>
                  <Badge variant="secondary">{selectedColumns.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Events to Export:</span>
                  <Badge variant="secondary">{filteredEvents.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Export Format:</span>
                  <Badge variant="outline">{exportFormat.toUpperCase()}</Badge>
                </div>
              </div>

              {isExporting && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Export Progress</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} className="h-2" />
                  {exportedCount > 0 && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Exported {exportedCount} events
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
