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
import { getCategories, getFormats, getLocations, getOrganizers } from '@/lib/events-api'

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
  hide_location: boolean
  organizer_name: string
  hide_organizer: boolean
  category_name: string
  format_name: string
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
}

interface FilterOptions {
  categories: Array<{ id: string; name: string }>
  formats: Array<{ id: string; name: string }>
  locations: Array<{ id: string; name: string }>
  organizers: Array<{ id: string; name: string }>
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
    organizers: []
  })
  
  // Export configuration
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['title', 'date'])
  const [exportFormat, setExportFormat] = useState('csv')
  const [fileName, setFileName] = useState('event-data-export')
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedFormat, setSelectedFormat] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [selectedOrganizer, setSelectedOrganizer] = useState('all')
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
      const [eventsData, categoriesData, formatsData, locationsData, organizersData] = await Promise.all([
        getEvents(),
        getCategories(),
        getFormats(),
        getLocations(),
        getOrganizers()
      ])

      setEvents(eventsData || [])
      setFilterOptions({
        categories: categoriesData || [],
        formats: formatsData || [],
        locations: locationsData || [],
        organizers: organizersData || []
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

    // Apply filters
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location_name.toLowerCase().includes(query) ||
        event.organizer_name.toLowerCase().includes(query)
      )
    }

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category_name === selectedCategory)
    }

    if (selectedFormat && selectedFormat !== 'all') {
      filtered = filtered.filter(event => event.format_name === selectedFormat)
    }

    if (selectedLocation && selectedLocation !== 'all') {
      filtered = filtered.filter(event => event.location_name === selectedLocation)
    }

    if (selectedOrganizer && selectedOrganizer !== 'all') {
      filtered = filtered.filter(event => event.organizer_name === selectedOrganizer)
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
  }, [events, searchQuery, selectedCategory, selectedFormat, selectedLocation, selectedOrganizer, statusFilter, dateFrom, dateTo])

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
    setSelectedCategory('all')
    setSelectedFormat('all')
    setSelectedLocation('all')
    setSelectedOrganizer('all')
    setStatusFilter('all')
    setDateFrom('')
    setDateTo('')
    setSearchQuery('')
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
          // For Excel, we'll use a simple CSV for now (you can integrate a proper Excel library later)
          const excelContent = generateCSV(exportData)
          blob = new Blob([excelContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
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

                {/* Dropdown Filters */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {filterOptions.categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="format">Format</Label>
                    <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Formats" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Formats</SelectItem>
                        {filterOptions.formats.map((format) => (
                          <SelectItem key={format.id} value={format.name}>
                            {format.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Locations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {filterOptions.locations.map((location) => (
                          <SelectItem key={location.id} value={location.name}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="organizer">Organizer</Label>
                    <Select value={selectedOrganizer} onValueChange={setSelectedOrganizer}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Organizers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Organizers</SelectItem>
                        {filterOptions.organizers.map((organizer) => (
                          <SelectItem key={organizer.id} value={organizer.name}>
                            {organizer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
