"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getEventById, deleteEvent as deleteEventFromDB } from "@/lib/events-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, MapPin, Users, Edit, Trash2, User, Link, Bookmark, Folder, ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import GoogleMap component to avoid SSR issues
const GoogleMap = dynamic(() => import("@/components/GoogleMap"), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">Loading map...</div>
});

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  hideTime: boolean;
  hideEndTime: boolean;
  timeNotes: string;
  location: string;
  locationAddress?: string;
  latitude?: string;
  longitude?: string;
  otherLocations: string;
  hideLocation?: boolean;
  organizer: string;
  hideOrganizer?: boolean;
  allOrganizers: string[]; // All organizers for display
  category: string;
  categories: Array<{ id: string; name: string; color?: string }>; // Multiple categories
  format: string;
  speakers: string;
  hideSpeakers?: boolean;
  attendees: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  eventLink?: string;
  moreInfoLink?: string;
  moreInfoTarget?: 'current' | 'new';
  eventStatus?: 'scheduled' | 'rescheduled' | 'postponed' | 'cancelled' | 'moved-online';
}

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        const supabaseEvent = await getEventById(params.id);
        
        if (supabaseEvent) {
          // Transform Supabase event to match the interface
          const transformedEvent: Event = {
            id: supabaseEvent.id,
            title: supabaseEvent.title,
            description: supabaseEvent.description || '',
            date: supabaseEvent.date,
            startTime: supabaseEvent.start_time || '',
            endTime: supabaseEvent.end_time || '',
            isAllDay: supabaseEvent.is_all_day || false,
            hideTime: supabaseEvent.hide_time || false,
            hideEndTime: supabaseEvent.hide_end_time || false,
            timeNotes: supabaseEvent.time_notes || '',
            location: supabaseEvent.location_name || '',
            locationAddress: supabaseEvent.locations?.address || '',
            latitude: supabaseEvent.locations?.latitude?.toString(),
            longitude: supabaseEvent.locations?.longitude?.toString(),
            otherLocations: '', // Will be handled by view
            hideLocation: supabaseEvent.hide_location || false,
            organizer: supabaseEvent.organizer_name || '',
            hideOrganizer: supabaseEvent.hide_organizer || false,
            allOrganizers: supabaseEvent.organizers && supabaseEvent.organizers.length > 0 
              ? supabaseEvent.organizers.map((o: any) => o.name) 
              : (supabaseEvent.organizer_name ? [supabaseEvent.organizer_name] : []),
            category: supabaseEvent.category_name || '',
            categories: supabaseEvent.categories || [], // Multiple categories from junction table
            format: supabaseEvent.format_name || '',
            speakers: supabaseEvent.speakers ? supabaseEvent.speakers.map((s: any) => `${s.name} (${s.role})`).join(', ') : '',
            hideSpeakers: supabaseEvent.hide_speakers || false,
            attendees: supabaseEvent.attendees || 0,
            status: supabaseEvent.event_status || 'scheduled',
            eventLink: supabaseEvent.event_link,
            moreInfoLink: supabaseEvent.more_info_link,
            moreInfoTarget: supabaseEvent.more_info_target,
            eventStatus: supabaseEvent.event_status
          };
          setEvent(transformedEvent);
        } else {
          setEvent(null);
        }
      } catch (error) {
        console.error('Error loading event:', error);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [params.id]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteEvent = async () => {
    if (!event) return;
    
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await deleteEventFromDB(event.id);
      router.push('/events');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
            <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been deleted.</p>
            <Button onClick={() => router.push('/events')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const isEventExpired = () => {
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today;
  };

  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="container mx-auto px-4 py-8 max-w-screen-xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Event Details */}
          <div className="space-y-4">
            {/* ORGANIZER Card */}
            {(event.organizer || (event.allOrganizers && event.allOrganizers.length > 0)) && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                {/* Main Organizer */}
                {event.organizer && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-purple-600" />
                      <div className="text-xs font-bold text-purple-600 uppercase tracking-wide">MAIN ORGANIZER</div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 mb-4 pl-6">
                      <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-md">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        {event.organizer}
                      </div>
                    </div>
                  </>
                )}
                
                {/* Other Organizers */}
                {event.allOrganizers && event.allOrganizers.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mb-3 mt-4 pt-4 border-t border-gray-200">
                      <Users className="h-4 w-4 text-blue-600" />
                      <div className="text-xs font-bold text-blue-600 uppercase tracking-wide">ADDITIONAL ORGANIZERS</div>
                    </div>
                    <div className="text-sm text-gray-800 space-y-2 pl-6">
                      {event.allOrganizers.map((organizer, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span className="text-gray-700">{organizer}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* LOCATION Card */}
            {event.location && !event.hideLocation && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <div className="text-xs font-bold text-green-600 uppercase tracking-wide">LOCATION</div>
                </div>
                <div className="text-sm text-gray-800 pl-6">
                  <div className="font-semibold text-gray-900 mb-1">{event.location}</div>
                  {event.location === 'Virtual' ? (
                    <div className="text-gray-600">Online Event</div>
                  ) : event.locationAddress ? (
                    <div className="text-gray-600">{event.locationAddress}</div>
                  ) : (
                    <div className="text-gray-500 text-xs">Basildon University Hospital</div>
                  )}
                  {event.latitude && event.longitude && (
                    <div className="text-gray-400 text-xs mt-1">
                      {parseFloat(event.latitude).toFixed(4)}, {parseFloat(event.longitude).toFixed(4)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CATEGORY Card */}
            {event.categories && event.categories.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Folder className="h-4 w-4 text-orange-600" />
                  <div className="text-xs font-bold text-orange-600 uppercase tracking-wide">CATEGORIES</div>
                </div>
                <div className="text-sm text-gray-800 space-y-2 pl-6">
                  {event.categories.map((category) => (
                    <div key={category.id} className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: category.color || '#FCD34D' }}
                      ></div>
                      <span className="text-gray-700">{category.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LOCAL TIME Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-blue-600" />
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wide">LOCAL TIME</div>
              </div>
              <div className="text-sm text-gray-800 space-y-2 pl-6">
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 min-w-[80px]">Timezone:</span>
                  <span className="text-gray-900 font-medium">Europe/London</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 min-w-[80px]">Date:</span>
                  <span className="text-gray-900 font-medium">{formatDate(event.date)}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 min-w-[80px]">Time:</span>
                  <span className="text-gray-900 font-medium">
                    {!event.hideTime ? formatTimeRange(event.startTime, event.endTime) : 'All Day'}
                  </span>
                </div>
              </div>
            </div>

            {/* Event Links */}
            {(event.eventLink || event.moreInfoLink) && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">EVENT LINKS</div>
                <div className="space-y-2">
                  {event.eventLink && (
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4 text-gray-600" />
                      <a href={event.eventLink} target={event.moreInfoTarget === 'new' ? '_blank' : '_self'} className="text-sm text-blue-600 hover:text-blue-800">
                        Event Link
                      </a>
                    </div>
                  )}
                  {event.moreInfoLink && (
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4 text-gray-600" />
                      <a href={event.moreInfoLink} target={event.moreInfoTarget === 'new' ? '_blank' : '_self'} className="text-sm text-blue-600 hover:text-blue-800">
                        More Information
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Event Content and Map */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Title */}
            <h1 className="text-4xl font-bold text-gray-900">{event.title}</h1>

            {/* Date, Time, Format Box */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4">
                {/* DATE */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">DATE</div>
                  </div>
                  <div className="text-sm text-gray-800">
                    <div>{formatDate(event.date)}</div>
                    {isEventExpired() && (
                      <div className="text-red-500 font-semibold text-xs mt-1">Expired!</div>
                    )}
                  </div>
                </div>

                {/* TIME */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">TIME</div>
                  </div>
                  <div className="text-sm text-gray-800">
                    {!event.hideTime ? formatTimeRange(event.startTime, event.endTime) : 'All Day'}
                  </div>
                </div>

                {/* FORMAT */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Bookmark className="h-4 w-4 text-gray-600" />
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">FORMAT</div>
                  </div>
                  <div className="text-sm text-gray-800">
                    {event.format || 'Not specified'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Event Description */}
            {event.description && (
              <div className="prose prose-lg max-w-none">
                <div 
                  className="text-lg text-gray-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </div>
            )}

            {/* Map */}
            {event.location !== 'Virtual' && (
              <div className="mt-6">
                <GoogleMap 
                  location={event.location || "Basildon University Hospital, Basildon"}
                  eventTitle={event.title}
                  className="w-full"
                  latitude={event.latitude ? parseFloat(event.latitude) : undefined}
                  longitude={event.longitude ? parseFloat(event.longitude) : undefined}
                />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4 justify-end">
          <Button
            variant="outline"
            onClick={() => router.push(`/event-data?edit=${event.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Event
          </Button>
          <Button
            variant="outline"
            onClick={handleDeleteEvent}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Event
          </Button>
        </div>
      </div>
    </div>
  );
}
