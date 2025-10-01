"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getEventById, deleteEvent as deleteEventFromDB } from "@/lib/events-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, MapPin, Users, Edit, Trash2, User, Link } from "lucide-react";

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
  otherLocations: string;
  hideLocation?: boolean;
  organizer: string;
  hideOrganizer?: boolean;
  category: string;
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
            otherLocations: '', // Will be handled by view
            hideLocation: supabaseEvent.hide_location || false,
            organizer: supabaseEvent.organizer_name || '',
            hideOrganizer: supabaseEvent.hide_organizer || false,
            category: supabaseEvent.category_name || '',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{event.title}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={getStatusColor(event.status)}>
                  {event.status}
                </Badge>
                {event.eventStatus && (
                  <Badge variant="default" className="bg-blue-100 text-blue-800 capitalize">
                    {event.eventStatus.replace('-', ' ')}
                  </Badge>
                )}
                {event.category && (
                  <Badge variant="secondary">{event.category}</Badge>
                )}
                {event.format && (
                  <Badge variant="outline">{event.format}</Badge>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/events?edit=${event.id}`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={handleDeleteEvent}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {event.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="text-gray-700 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: event.description }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Time Notes */}
            {event.timeNotes && (
              <Card>
                <CardHeader>
                  <CardTitle>Time Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{event.timeNotes}</p>
                </CardContent>
              </Card>
            )}

            {/* Additional Information */}
            {((event.speakers && !event.hideSpeakers) || event.otherLocations) && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {event.speakers && !event.hideSpeakers && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Speakers</h4>
                      <p className="text-gray-700">{event.speakers}</p>
                    </div>
                  )}
                  {event.otherLocations && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Other Locations</h4>
                      <p className="text-gray-700">{event.otherLocations}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Date & Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Date & Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                {!event.hideTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>
                      {event.isAllDay 
                        ? 'All Day' 
                        : formatTimeRange(event.startTime, event.endTime)
                      }
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location */}
            {event.location && !event.hideLocation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{event.location}</p>
                </CardContent>
              </Card>
            )}

            {/* Event Links */}
            {(event.eventLink || event.moreInfoLink) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link className="h-5 w-5" />
                    Event Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {event.eventLink && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Event Link</h4>
                      <a
                        href={event.eventLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline break-all text-sm"
                      >
                        {event.eventLink}
                      </a>
                    </div>
                  )}
                  {event.moreInfoLink && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">More Information</h4>
                      <a
                        href={event.moreInfoLink}
                        target={event.moreInfoTarget === 'new' ? '_blank' : '_self'}
                        rel={event.moreInfoTarget === 'new' ? 'noopener noreferrer' : undefined}
                        className="text-blue-600 hover:text-blue-800 hover:underline break-all text-sm"
                      >
                        {event.moreInfoLink}
                      </a>
                      <p className="text-xs text-gray-500 mt-1">
                        Opens in {event.moreInfoTarget === 'new' ? 'new window' : 'current window'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Organizer */}
            {event.organizer && !event.hideOrganizer && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Organizer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{event.organizer}</p>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
