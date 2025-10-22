'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { 
  Calendar, 
  Users, 
  MapPin, 
  Search, 
  Plus,
  Award,
  Clock,
  Building,
  ArrowLeft,
  Home
} from 'lucide-react'
import { toast } from 'sonner'

interface EventWithBookings {
  id: string
  title: string
  description?: string
  date: string
  start_time?: string
  end_time?: string
  time_notes?: string
  location_id?: string
  locations?: {
    name: string
  }
  organizer_id?: string
  category_id?: string
  format_id?: string
  status?: string
  event_link?: string
  booking_enabled?: boolean
  booking_count: number
  checked_in_count: number
}

export default function SelectEventPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<EventWithBookings[]>([])
  const [filteredEvents, setFilteredEvents] = useState<EventWithBookings[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    // Filter events based on search query
    if (searchQuery.trim() === '') {
      setFilteredEvents(events)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = events.filter(event => 
        event.title.toLowerCase().includes(query)
        // Note: description and location not available in stats view
      )
      setFilteredEvents(filtered)
    }
  }, [searchQuery, events])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()

      // Use the same view as the bookings page to ensure consistency
      const { data: eventsData, error: eventsError } = await supabase
        .from('event_booking_stats')
        .select(`
          event_id,
          title,
          date,
          start_time,
          end_time,
          booking_capacity,
          confirmed_count,
          attended_count,
          total_bookings,
          booking_status
        `)
        .order('date', { ascending: false })
        .limit(50)

      if (eventsError) throw eventsError

      if (!eventsData) {
        setEvents([])
        return
      }

      // Transform the data to match our interface
      const eventsWithBookings = eventsData.map((event) => ({
        id: event.event_id,
        title: event.title,
        description: '', // Not available in the stats view
        date: event.date,
        start_time: event.start_time,
        end_time: event.end_time,
        time_notes: '', // Not available in the stats view
        location_id: '', // Not available in the stats view
        locations: { name: '' }, // Not available in the stats view
        organizer_id: '', // Not available in the stats view
        category_id: '', // Not available in the stats view
        format_id: '', // Not available in the stats view
        status: 'published', // Events in this view are published
        event_link: '', // Not available in the stats view
        booking_enabled: true, // All events in this view have booking enabled
        booking_count: event.total_bookings || 0,
        checked_in_count: event.attended_count || 0
      }))

      setEvents(eventsWithBookings)

    } catch (error) {
      console.error('Error loading events:', error)
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCertificate = (eventId: string) => {
    router.push(`/certificates/image-builder?event=${eventId}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return ''
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="ghost" size="sm" className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 transition-all duration-200 hover:scale-105 w-fit">
            <Link href="/certificates">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Back to Certificates</span>
            </Link>
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Certificate</h1>
              <p className="text-gray-600">Select an event with booking enabled to create certificates for attendees</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search events by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {events.length === 0 ? 'No events with booking enabled found' : 'No events match your search'}
              </h3>
              <p className="text-sm text-gray-500 text-center max-w-md mb-4">
                {events.length === 0 
                  ? 'No published events with booking enabled found. Only events that have booking configuration enabled are shown here.'
                  : 'Try adjusting your search terms.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 mb-2">
                        {event.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {formatDate(event.date)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Event Details */}
                  <div className="space-y-2 text-sm">
                    {event.start_time && event.end_time && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatTime(event.start_time)} - {formatTime(event.end_time)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Booking Stats */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">
                        {event.booking_count} attendee{event.booking_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        {event.checked_in_count} checked in
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => handleCreateCertificate(event.id)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Certificates
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Award className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Certificate Creation Process</h3>
                <p className="text-sm text-blue-700">
                  Select an event to open the certificate builder where you can design and customize certificates 
                  for all attendees. Only events with booking enabled and registered attendees are shown here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
