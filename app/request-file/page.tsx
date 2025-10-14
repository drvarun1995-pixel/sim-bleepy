'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, ArrowLeft, Send, Calendar, Clock, MapPin, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Event {
  id: string
  title: string
  description?: string
  date: string
  startTime: string
  endTime: string
  location?: string
  format?: string
  categories?: Array<{ id: string; name: string; color?: string }>
  hasFiles?: boolean
}

export default function RequestFilePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [eventsLoading, setEventsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [userRole, setUserRole] = useState<'student' | 'educator' | 'admin' | 'meded_team' | 'ctf' | undefined>(undefined)
  const [formData, setFormData] = useState({
    fileName: '',
    description: '',
    additionalInfo: ''
  })

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!session?.user?.email) return
      
      try {
        const response = await fetch('/api/user/role')
        if (response.ok) {
          const data = await response.json()
          if (data.role) {
            setUserRole(data.role)
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
      }
    }

    if (status === 'authenticated') {
      fetchUserRole()
    }
  }, [session, status])

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const handleDateChange = async (date: string) => {
    setSelectedDate(date)
    setSelectedEvent(null)
    
    if (!date) {
      setEvents([])
      return
    }

    try {
      setEventsLoading(true)
      const response = await fetch(`/api/events/date/${date}`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      } else {
        setEvents([])
        toast.error('Failed to load events for this date')
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      setEvents([])
      toast.error('Failed to load events for this date')
    } finally {
      setEventsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedEvent) {
      toast.error('Please select a teaching event')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/requests/file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          eventId: selectedEvent.id,
          eventTitle: selectedEvent.title,
          eventDate: selectedEvent.date,
          userEmail: session?.user?.email,
          userName: session?.user?.name
        }),
      })

      if (response.ok) {
        toast.success('File request submitted successfully!', {
          description: `Your request for files related to "${selectedEvent.title}" has been submitted.`
        })
        router.push('/downloads')
      } else {
        throw new Error('Failed to submit request')
      }
    } catch (error) {
      console.error('Error submitting file request:', error)
      toast.error('Failed to submit request', {
        description: 'Please try again or contact support if the issue persists.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ''
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <DashboardLayoutClient role={userRole}>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayoutClient>
    )
  }

  // Don't render if not authenticated
  if (status === 'unauthenticated') {
    return null
  }

  return (
    <DashboardLayoutClient role={userRole}>
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Downloads
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100">
            <FileText className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Request Teaching Files</h1>
            <p className="text-gray-600">Request files for a specific teaching event</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {/* Event Selection */}
        <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-gray-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Select Teaching Event
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label htmlFor="eventDate" className="text-sm font-medium">
                Event Date *
              </Label>
              <Input
                id="eventDate"
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                required
                className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                style={{ 
                  WebkitAppearance: 'none',
                  colorScheme: 'light'
                }}
              />
            </div>

            {/* Events List */}
            {selectedDate && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Teaching Events on {format(new Date(selectedDate), 'MMM d, yyyy')}</Label>
                {eventsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
                    ))}
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No teaching events found for this date</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedEvent?.id === event.id
                            ? 'border-purple-300 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-200 hover:bg-purple-25'
                        }`}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
                            
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                              {event.startTime && (
                                <div className="flex items-center gap-1.5 text-gray-600">
                                  <div className="p-1 rounded bg-green-50 flex-shrink-0">
                                    <Clock className="h-3 w-3 text-green-600" />
                                  </div>
                                  <span className="font-medium whitespace-nowrap">{formatTime(event.startTime)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {event.hasFiles && (
                            <div className="flex-shrink-0">
                              <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Has Files
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Form */}
        <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-gray-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              File Request Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedEvent ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Selected Event Info */}
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-2">Selected Event:</h3>
                  <p className="text-purple-800">{selectedEvent.title}</p>
                  <p className="text-sm text-purple-600">
                    {format(new Date(selectedEvent.date), 'MMM d, yyyy')} at {formatTime(selectedEvent.startTime)}
                  </p>
                </div>

                {/* File Name */}
                <div className="space-y-2">
                  <Label htmlFor="fileName" className="text-sm font-medium">
                    File Name or Title *
                  </Label>
                  <Input
                    id="fileName"
                    value={formData.fileName}
                    onChange={(e) => handleInputChange('fileName', e.target.value)}
                    placeholder="e.g., Cardiology Grand Round Slides"
                    required
                    className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Please describe the specific files you're looking for from this teaching session..."
                    required
                    rows={4}
                    className="border-gray-200 focus:border-purple-300 focus:ring-purple-200 resize-none"
                  />
                </div>

                {/* Additional Information */}
                <div className="space-y-2">
                  <Label htmlFor="additionalInfo" className="text-sm font-medium">
                    Additional Information
                  </Label>
                  <Textarea
                    id="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                    placeholder="Any additional details or special requirements..."
                    rows={3}
                    className="border-gray-200 focus:border-purple-300 focus:ring-purple-200 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="w-full sm:flex-1 order-2 sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !formData.fileName || !formData.description}
                    className="w-full sm:flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 order-1 sm:order-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        <span className="hidden sm:inline">Submitting...</span>
                        <span className="sm:hidden">Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Submit Request</span>
                        <span className="sm:hidden">Submit</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Teaching Event</h3>
                <p className="text-gray-600">
                  Choose a date and select a teaching event to request files for that session.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </DashboardLayoutClient>
  )
}