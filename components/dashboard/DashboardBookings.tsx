'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Loader2, 
  ExternalLink,
  Ticket
} from 'lucide-react';
import Link from 'next/link';

interface Booking {
  id: string;
  event_id: string;
  status: 'confirmed' | 'waitlist' | 'cancelled' | 'attended' | 'no-show';
  booked_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  checked_in: boolean;
  events: {
    id: string;
    title: string;
    date: string;
    start_time: string;
    end_time: string;
    booking_capacity: number | null;
    location_name?: string;
    location_address?: string;
  };
}

export function DashboardBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bookings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      if (data.success) {
        // Get upcoming bookings (confirmed or waitlist, not cancelled)
        const upcomingBookings = data.bookings
          .filter((booking: Booking) => 
            (booking.status === 'confirmed' || booking.status === 'waitlist') &&
            !isEventPast(booking.events.date, booking.events.start_time)
          )
          .slice(0, 3); // Show only the next 3 upcoming bookings
        
        setBookings(upcomingBookings);
      } else {
        throw new Error(data.error || 'Failed to fetch bookings');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const isEventPast = (date: string, time: string) => {
    const eventDateTime = new Date(`${date}T${time}`);
    return eventDateTime < new Date();
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}${ampm}`;
  };

  if (loading) {
    return (
      <Card data-tour="my-bookings">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-purple-600" />
            My Upcoming Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card data-tour="my-bookings">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-purple-600" />
            My Upcoming Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={fetchBookings} variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 font-medium transition-colors duration-200">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-tour="my-bookings">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-purple-600" />
            My Upcoming Bookings
          </CardTitle>
          <Link href="/my-bookings">
            <Button variant="outline" size="sm" className="text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 font-medium transition-colors duration-200">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No upcoming bookings</p>
            <Link href="/events">
              <Button variant="outline" size="sm" className="text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-800 hover:border-gray-400 font-medium transition-colors duration-200">
                Browse Events
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-2 truncate">
                      {booking.events.title}
                    </h4>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">
                          {new Date(booking.events.date).toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">{formatTime(booking.events.start_time)}</span>
                      </div>
                      {booking.events.location_name && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span className="truncate">{booking.events.location_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <BookingStatusBadge status={booking.status} />
                    <Link href={`/events/${booking.event_id}`}>
                      <Button variant="outline" size="sm" className="text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 font-medium transition-colors duration-200">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            
            {bookings.length >= 3 && (
              <div className="text-center pt-4">
                <Link href="/my-bookings">
                  <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-medium transition-colors duration-200">
                    View all bookings →
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
