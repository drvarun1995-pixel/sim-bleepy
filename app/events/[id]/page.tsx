"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAdmin } from "@/lib/useAdmin";
import { toast } from "sonner";
import { getEventById, deleteEvent as deleteEventFromDB } from "@/lib/events-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventStatusBadge } from "@/components/EventStatusBadge";
import { DeleteEventDialog } from "@/components/ui/confirmation-dialog";
import { ArrowLeft, Calendar, Clock, MapPin, Users, Edit, Trash2, Copy, User, Link, Bookmark, Folder, ArrowRight, Download, Loader2 } from "lucide-react";
import { FlipClockTimer } from "@/components/ui/FlipClockTimer";
import { BookingButton } from "@/components/bookings/BookingButton";
import { CapacityDisplay } from "@/components/bookings/CapacityDisplay";
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
  allLocations: Array<{ id: string; name: string; address?: string }>; // All locations for display
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
  // Booking fields
  bookingEnabled?: boolean;
  bookingCapacity?: number | null;
}

interface LinkedResource {
  id: string;
  title: string;
  category: string;
  file_type: string;
  teaching_date?: string;
  taught_by?: string;
}

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { isAdmin } = useAdmin();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkedResources, setLinkedResources] = useState<LinkedResource[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [bookingStats, setBookingStats] = useState<any>(null);

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
            locationAddress: supabaseEvent.location_address || '',
            latitude: supabaseEvent.location_latitude?.toString(),
            longitude: supabaseEvent.location_longitude?.toString(),
            allLocations: (() => {
              console.log('🔍 RAW Location data from DB:', {
                location_name: supabaseEvent.location_name,
                location_address: supabaseEvent.location_address,
                locations_array: supabaseEvent.locations,
                locations_type: typeof supabaseEvent.locations,
                locations_isArray: Array.isArray(supabaseEvent.locations),
                full_event: supabaseEvent
              });
              
              if (supabaseEvent.locations && Array.isArray(supabaseEvent.locations) && supabaseEvent.locations.length > 0) {
                console.log('✅ Using locations array:', supabaseEvent.locations);
                return supabaseEvent.locations;
              } else if (supabaseEvent.location_name) {
                console.log('⚠️ Using fallback single location');
                return [{ id: supabaseEvent.location_id, name: supabaseEvent.location_name, address: supabaseEvent.location_address }];
              }
              console.log('❌ No location data found');
              return [];
            })(),
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
            eventStatus: supabaseEvent.event_status,
            // Booking fields
            bookingEnabled: supabaseEvent.booking_enabled || false,
            bookingCapacity: supabaseEvent.booking_capacity || null
          };
          setEvent(transformedEvent);

          // Fetch linked resources for this event
          try {
            const response = await fetch(`/api/events/${params.id}/resources`);
            if (response.ok) {
              const data = await response.json();
              setLinkedResources(data.resources || []);
            }
          } catch (error) {
            console.error("Error loading linked resources:", error);
          }
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

  // Fetch booking stats if booking is enabled
  useEffect(() => {
    const fetchBookingStats = async () => {
      if ((event as any)?.bookingEnabled && event?.id) {
        try {
          const response = await fetch(`/api/bookings/stats?eventId=${event.id}`);
          if (response.ok) {
            const data = await response.json();
            const eventStats = data.stats?.find((s: any) => s.event_id === event.id);
            setBookingStats(eventStats || null);
          }
        } catch (error) {
          console.error('Error fetching booking stats:', error);
        }
      }
    };

    fetchBookingStats();
  }, [event?.id, (event as any)?.bookingEnabled]);

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
    
    setIsDeleting(true);
    try {
      await deleteEventFromDB(event.id);
      toast.success('Event deleted successfully');
      router.push('/events');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleDuplicateEvent = async () => {
    if (!event) return;
    
    // Instead of duplicating via API, redirect to add event page with pre-filled data
    const eventData = {
      title: `${event.title} (Copy)`,
      description: event.description,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      isAllDay: event.isAllDay,
      hideTime: event.hideTime,
      hideEndTime: event.hideEndTime,
      timeNotes: event.timeNotes,
      location: event.location, // This is the location name, not ID
      hideLocation: event.hideLocation,
      organizer: event.organizer,
      hideOrganizer: event.hideOrganizer,
      categories: event.categories,
      format: event.format,
      speakers: event.speakers,
      hideSpeakers: event.hideSpeakers,
      eventLink: event.eventLink,
      moreInfoLink: event.moreInfoLink,
      moreInfoTarget: event.moreInfoTarget,
      eventStatus: event.eventStatus
    };

    // Encode the event data as URL parameters
    const encodedData = encodeURIComponent(JSON.stringify(eventData));
    
    // Redirect to add event page with pre-filled data
    window.open(`/event-data?duplicate=${encodedData}`, '_blank');
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
    const now = new Date(); // Current time in browser timezone (London)
    
    // Parse the event date (YYYY-MM-DD format)
    const [year, month, day] = event.date.split('-').map(Number);
    const eventDate = new Date(year, month - 1, day); // Create date in local timezone
    
    // If event has end time, use it; otherwise use start time
    const eventTime = event.endTime || event.startTime;
    
    console.log('🕐 Event Expiration Check:', {
      eventTitle: event.title,
      eventDate: event.date,
      endTime: event.endTime,
      startTime: event.startTime,
      hideTime: event.hideTime,
      isAllDay: event.isAllDay,
      eventTime: eventTime,
      conditionCheck: {
        hasEventTime: !!eventTime,
        isTrimmed: eventTime && eventTime.trim() !== '',
        notHideTime: !event.hideTime,
        notAllDay: !event.isAllDay,
        allConditions: !!(eventTime && eventTime.trim() && !event.hideTime && !event.isAllDay)
      },
      now: now.toISOString(),
      nowLocal: now.toString()
    });
    
    // Use time-based check if event has a specific time (ignore isAllDay flag if we have actual times)
    if (eventTime && eventTime.trim() && !event.hideTime) {
      // Combine date and time - handle both HH:MM and HH:MM:SS formats
      const timeParts = eventTime.split(':');
      const hours = parseInt(timeParts[0]);
      const minutes = parseInt(timeParts[1]);
      eventDate.setHours(hours, minutes, 0, 0);
      
      console.log('✅ Time-based check:', {
        eventDateTime: eventDate.toString(),
        eventDateTime_ISO: eventDate.toISOString(),
        currentTime: now.toString(),
        isExpired: eventDate < now
      });
      
      // Event is expired if the end/start time has passed
      return eventDate < now;
    } else {
      // For all-day events or events without time, consider expired at end of day
      eventDate.setHours(23, 59, 59, 999);
      
      console.log('⚠️ All-day/No-time check:', {
        eventDateTime: eventDate.toString(),
        isExpired: eventDate < now
      });
      
      return eventDate < now;
    }
  };

  // Organize categories hierarchically
  const getHierarchicalCategories = (categories: Array<{ id: string; name: string; color?: string }>) => {
    // Define parent categories
    const parentCategories = ['ARU', 'UCL', 'Foundation Year Doctors'];
    
    const hierarchy: Array<{ name: string; isParent: boolean; color?: string }> = [];
    
    // Group categories by parent
    parentCategories.forEach(parent => {
      const children = categories.filter(cat => 
        cat.name !== parent && cat.name.includes(parent)
      );
      
      // Only add parent if it exists or has children
      const parentCategory = categories.find(cat => cat.name === parent);
      if (parentCategory || children.length > 0) {
        if (parentCategory) {
          hierarchy.push({ name: parent, isParent: true, color: parentCategory.color });
        } else {
          hierarchy.push({ name: parent, isParent: true });
        }
        
        // Add sorted children
        children.sort((a, b) => a.name.localeCompare(b.name)).forEach(child => {
          hierarchy.push({ name: child.name, isParent: false, color: child.color });
        });
      }
    });
    
    // Add any remaining categories that don't fit the hierarchy
    categories
      .filter(cat => !hierarchy.some(h => h.name === cat.name))
      .forEach(cat => {
        hierarchy.push({ name: cat.name, isParent: false, color: cat.color });
      });
    
    return hierarchy;
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <div className="container mx-auto px-4 py-8 max-w-screen-xl">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {/* Action Buttons - Only for Admin Users */}
          {isAdmin && (
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDuplicateEvent}
                disabled={isDuplicating}
                className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 flex-shrink-0"
              >
                <Copy className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{isDuplicating ? 'Duplicating...' : 'Duplicate Event'}</span>
                <span className="sm:hidden">Duplicate</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/event-data?edit=${event.id}`, '_blank')}
                className="flex-shrink-0"
              >
                <Edit className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Edit Event</span>
                <span className="sm:hidden">Edit</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 flex-shrink-0"
              >
                <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Delete Event</span>
                <span className="sm:hidden">Delete</span>
              </Button>
            </div>
          )}
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Event Details */}
          <div className="space-y-4 order-2 lg:order-1">
            {/* ORGANIZER Card - Only show if there's at least one organizer and not hidden */}
            {!event.hideOrganizer && ((event.organizer && event.organizer.trim()) || (event.allOrganizers && event.allOrganizers.length > 0)) && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                {/* Main Organizer */}
                {event.organizer && event.organizer.trim() && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-purple-600" />
                      <div className="text-xs font-bold text-purple-600 uppercase tracking-wide">MAIN ORGANIZER</div>
                    </div>
                    <div className="text-sm text-gray-800 pl-6 mb-4">
                      <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-md">
                        <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                        <span className="text-gray-900 font-semibold">{event.organizer}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Other Organizers - Filter out main organizer from the list */}
                {(() => {
                  const otherOrganizers = event.allOrganizers && event.allOrganizers.length > 0
                    ? event.allOrganizers.filter(org => org !== event.organizer)
                    : [];
                  
                  return otherOrganizers.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 mb-3 pt-3 border-t border-gray-200">
                        <Users className="h-4 w-4 text-purple-500" />
                        <div className="text-xs font-bold text-purple-500 uppercase tracking-wide">OTHER ORGANIZERS</div>
                      </div>
                      <div className="text-sm text-gray-800 space-y-2 pl-6">
                        {otherOrganizers.map((organizer, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                            <span className="text-gray-900 font-medium">{organizer}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* SPEAKERS Card - Only show if speakers exist and not hidden */}
            {!event.hideSpeakers && event.speakers && event.speakers.trim() && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-indigo-600" />
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                    {event.speakers.includes(',') ? 'SPEAKERS' : 'SPEAKER'}
                  </div>
                </div>
                <div className="text-sm text-gray-800 space-y-2 pl-6">
                  {event.speakers.split(',').map((speaker, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      <span className="text-gray-900 font-medium">{speaker.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LOCATION Card - Only show if location exists */}
            {((event.location && event.location.trim()) || (event.allLocations && event.allLocations.length > 0)) && !event.hideLocation && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                {/* Main Location */}
                {event.location && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <div className="text-xs font-bold text-green-600 uppercase tracking-wide">MAIN LOCATION</div>
                    </div>
                    <div className="text-sm text-gray-800 pl-6 mb-4">
                      <div className="font-semibold text-gray-900 mb-1">{event.location}</div>
                      {event.location === 'Virtual' ? (
                        <div className="text-gray-600">Online Event</div>
                      ) : event.locationAddress ? (
                        <div className="text-gray-600">{event.locationAddress}</div>
                      ) : (
                        <div className="text-gray-500 text-xs">Basildon University Hospital</div>
                      )}
                    </div>
                  </>
                )}

                {/* Additional Locations - Show all other locations */}
                {(() => {
                  // Get all locations that are not the main location
                  const otherLocations = event.allLocations && event.allLocations.length > 0
                    ? event.allLocations.filter(loc => loc.name !== event.location)
                    : [];
                  
                  console.log('📍 Checking additional locations:', {
                    allLocations: event.allLocations,
                    allLocations_length: event.allLocations?.length,
                    mainLocation: event.location,
                    otherLocations: otherLocations,
                    otherLocations_length: otherLocations.length
                  });
                  
                  return otherLocations.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 mb-3 pt-3 border-t border-gray-200">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <div className="text-xs font-bold text-green-500 uppercase tracking-wide">OTHER LOCATIONS</div>
                      </div>
                      <div className="pl-6 space-y-2">
                        {otherLocations.map((location, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0"></div>
                            <div className="text-sm text-gray-700">
                              <div className="font-medium">{location.name}</div>
                              {location.address && (
                                <div className="text-xs text-gray-500 mt-0.5">{location.address}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
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
                  {getHierarchicalCategories(event.categories).map((category, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center gap-2 ${category.isParent ? 'font-semibold text-gray-900' : 'text-gray-700 pl-4'}`}
                    >
                      <div 
                        className={`rounded-full ${category.isParent ? 'w-3 h-3' : 'w-2 h-2'}`}
                        style={{ backgroundColor: category.color || '#FCD34D' }}
                      ></div>
                      <span>{category.name}</span>
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
                    <div className="flex items-start gap-2">
                      <Link className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <a 
                          href={event.eventLink} 
                          target={event.moreInfoTarget === 'new' ? '_blank' : '_self'} 
                          className="text-sm text-blue-600 hover:text-blue-800 break-words hover:underline block"
                          rel={event.moreInfoTarget === 'new' ? 'noopener noreferrer' : undefined}
                        >
                          {event.eventLink}
                        </a>
                      </div>
                    </div>
                  )}
                  {event.moreInfoLink && (
                    <div className="flex items-start gap-2">
                      <Link className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <a 
                          href={event.moreInfoLink} 
                          target={event.moreInfoTarget === 'new' ? '_blank' : '_self'} 
                          className="text-sm text-blue-600 hover:text-blue-800 break-words hover:underline block"
                          rel={event.moreInfoTarget === 'new' ? 'noopener noreferrer' : undefined}
                        >
                          {event.moreInfoLink}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Event Content and Map */}
          <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
            {/* Event Title */}
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-4xl font-bold text-gray-900">{event.title}</h1>
              <EventStatusBadge status={event.eventStatus || 'scheduled'} />
            </div>

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

            {/* Animated Flip Clock Countdown Timer */}
            {!event.hideTime && !event.isAllDay && event.startTime && !isEventExpired() && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 shadow-md">
                <div className="text-center mb-4">
                  <div className="text-lg font-semibold text-gray-800 mb-1">Event Starts In</div>
                  <div className="text-sm text-gray-600">Join us for this exciting session!</div>
                </div>
                <FlipClockTimer 
                  startDate={event.date}
                  startTime={event.startTime}
                  size="md"
                  className="justify-center"
                />
              </div>
            )}

            {/* Booking Button */}
            {session && !isEventExpired() && event.bookingEnabled && (
              <>
                <BookingButton
                  eventId={event.id}
                  eventTitle={event.title}
                  eventDate={event.date}
                  eventTime={event.startTime || ''}
                  location={event.location || event.locationAddress}
                />
                <CapacityDisplay 
                  confirmedCount={bookingStats?.confirmed_count || 0}
                  capacity={event.bookingCapacity || null}
                  waitlistCount={bookingStats?.waitlist_count}
                />
              </>
            )}
            
            {/* Event Description */}
            {event.description && (
              <div className="prose prose-lg max-w-none overflow-hidden">
                <div 
                  className="text-lg text-gray-600 leading-relaxed break-words"
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </div>
            )}

            {/* Linked Resources */}
            {linkedResources.length > 0 && (
              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Folder className="h-5 w-5 text-purple-600" />
                      Related Resources
                    </CardTitle>
                    <CardDescription>Materials and files related to this event</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {linkedResources.map((resource) => (
                        <div
                          key={resource.id}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
                          onClick={async () => {
                            if (downloadingId === resource.id) return;
                            
                            setDownloadingId(resource.id);
                            
                            // Show initial toast
                            toast.info('Preparing download...', {
                              description: resource.title,
                              duration: 2000,
                            });
                            
                            try {
                              const response = await fetch(`/api/resources/download/${resource.id}`);
                              
                              if (!response.ok) {
                                throw new Error('Failed to download file');
                              }
                              
                              // Get the blob data
                              const blob = await response.blob();
                              
                              // Get filename from Content-Disposition header
                              const contentDisposition = response.headers.get('Content-Disposition');
                              let filename = resource.title;
                              if (contentDisposition) {
                                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                                if (matches != null && matches[1]) {
                                  filename = decodeURIComponent(matches[1].replace(/['"]/g, ''));
                                }
                              }
                              
                              // Create blob URL and trigger download
                              const blobUrl = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = blobUrl;
                              a.download = filename;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              
                              // Clean up blob URL
                              setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
                              
                              // Show success message
                              toast.success('Download started!', {
                                description: `${filename} is now downloading`,
                                duration: 3000,
                              });
                              
                              // Reset state
                              setTimeout(() => {
                                setDownloadingId(null);
                              }, 1500);
                            } catch (error) {
                              console.error('Download error:', error);
                              toast.error('Download failed', {
                                description: 'Unable to download the file. Please try again.',
                                duration: 4000,
                              });
                              setDownloadingId(null);
                            }
                          }}
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                              {resource.title}
                            </h4>
                            {resource.taught_by && (
                              <p className="text-sm text-gray-600 mt-1">
                                Taught by: {resource.taught_by}
                              </p>
                            )}
                            {resource.teaching_date && (
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(resource.teaching_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                            onClick={async (e) => {
                              e.stopPropagation();
                              
                              if (downloadingId === resource.id) return;
                              
                              setDownloadingId(resource.id);
                              
                              // Show initial toast
                              toast.info('Preparing download...', {
                                description: resource.title,
                                duration: 2000,
                              });
                              
                              try {
                                const response = await fetch(`/api/resources/download/${resource.id}`);
                                
                                if (!response.ok) {
                                  throw new Error('Failed to download file');
                                }
                                
                                // Get the blob data
                                const blob = await response.blob();
                                
                                // Get filename from Content-Disposition header
                                const contentDisposition = response.headers.get('Content-Disposition');
                                let filename = resource.title;
                                if (contentDisposition) {
                                  const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                                  if (matches != null && matches[1]) {
                                    filename = decodeURIComponent(matches[1].replace(/['"]/g, ''));
                                  }
                                }
                                
                                // Create blob URL and trigger download
                                const blobUrl = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = blobUrl;
                                a.download = filename;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                
                                // Clean up blob URL
                                setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
                                
                                // Show success message
                                toast.success('Download started!', {
                                  description: `${filename} is now downloading`,
                                  duration: 3000,
                                });
                                
                                // Reset state
                                setTimeout(() => {
                                  setDownloadingId(null);
                                }, 1500);
                              } catch (error) {
                                console.error('Download error:', error);
                                toast.error('Download failed', {
                                  description: 'Unable to download the file. Please try again.',
                                  duration: 4000,
                                });
                                setDownloadingId(null);
                              }
                            }}
                            disabled={downloadingId === resource.id}
                          >
                            {downloadingId === resource.id ? (
                              <>
                                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="mr-1.5 h-4 w-4" />
                                Download
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Map - Only show if location exists and is not Virtual */}
            {event.location && event.location.trim() && event.location !== 'Virtual' && !event.hideLocation && (
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
      </div>
      
      {/* Delete Confirmation Dialog */}
      <DeleteEventDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteEvent}
        isLoading={isDeleting}
        title={`Delete "${event?.title}"`}
        description={`Are you sure you want to delete "${event?.title}"? This action cannot be undone and will remove all associated data including linked resources.`}
      />
    </div>
  );
}
