'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Loader2, 
  ArrowLeft,
  XCircle,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
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
  };
}

export default function MyBookingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);

  // Authentication handled by layout

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMyBookings();
    }
  }, [status]);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bookings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      console.log('Fetched bookings:', data);
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    setBookingToCancel(bookingId);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const confirmCancelBooking = async () => {
    if (!bookingToCancel) return;
    
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    try {
      setCancellingId(bookingToCancel);
      setShowCancelModal(false);
      
      const response = await fetch(`/api/bookings/${bookingToCancel}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          cancellation: cancelReason.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      toast.success('Booking cancelled successfully');
      await fetchMyBookings(); // Refresh
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    } finally {
      setCancellingId(null);
      setBookingToCancel(null);
      setCancelReason('');
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    console.log('Delete booking clicked for:', bookingId);
    
    // Find the booking to check its status
    const booking = bookings.find(b => b.id === bookingId);
    
    if (!booking) {
      toast.error('Booking not found');
      return;
    }

    console.log('Booking found:', booking);

    if (!confirm('Are you sure you want to permanently delete this booking from your records? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(bookingId);
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete booking');
      }

      toast.success('Booking deleted successfully', {
        description: 'The booking has been removed from your records.'
      });
      await fetchMyBookings(); // Refresh
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Failed to delete booking');
    } finally {
      setDeletingId(null);
    }
  };

  const isEventPast = (date: string, time: string) => {
    const eventDateTime = new Date(`${date}T${time}`);
    return eventDateTime < new Date();
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    
    const isPast = isEventPast(booking.events.date, booking.events.start_time);
    return filter === 'past' ? isPast : !isPast;
  });

  // Group bookings by status
  const upcomingBookings = filteredBookings.filter(b => 
    !isEventPast(b.events.date, b.events.start_time) && 
    (b.status === 'confirmed' || b.status === 'waitlist')
  );
  const pastBookings = filteredBookings.filter(b => 
    isEventPast(b.events.date, b.events.start_time) || 
    b.status === 'cancelled' || 
    b.status === 'attended' || 
    b.status === 'no-show'
  );

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Enhanced Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left Section: Back Button & Title */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Link 
                href="/dashboard" 
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-all duration-200 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 hover:scale-105 w-fit"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium">Back to Dashboard</span>
              </Link>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">My Bookings</h1>
                <p className="text-gray-600 text-lg">View and manage your event registrations</p>
              </div>
            </div>
            
            {/* Right Section: Filter Buttons */}
            <div className="flex justify-center lg:justify-end">
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg shadow-sm">
                <button
                  onClick={() => setFilter('upcoming')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    filter === 'upcoming'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Upcoming ({upcomingBookings.length})
                </button>
                <button
                  onClick={() => setFilter('past')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    filter === 'past'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Past ({pastBookings.length})
                </button>
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    filter === 'all'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  All ({bookings.length})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No bookings found</p>
              <p className="text-sm text-gray-500 mb-4">
                {filter === 'upcoming' ? 'You don\'t have any upcoming event bookings' : 
                 filter === 'past' ? 'You don\'t have any past event bookings' :
                 'You haven\'t registered for any events yet'}
              </p>
              <Link href="/events-list">
                <Button>Browse Events</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => {
              const isPast = isEventPast(booking.events.date, booking.events.start_time);
              const canCancel = !isPast && (booking.status === 'confirmed' || booking.status === 'waitlist');

              return (
                <Card key={booking.id} className="hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      {/* Event Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {booking.events.title}
                          </h3>
                          <BookingStatusBadge status={booking.status} />
                        </div>

                        {/* Event Details */}
                        <div className="space-y-2 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-purple-600" />
                            <span className="font-medium">
                              {new Date(booking.events.date).toLocaleDateString('en-GB', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-purple-600" />
                            <span>{booking.events.start_time} - {booking.events.end_time}</span>
                          </div>
                        </div>

                        {/* Booking Info */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            Booked on {new Date(booking.booked_at).toLocaleDateString('en-GB')}
                          </span>
                          {booking.checked_in && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Checked In
                            </span>
                          )}
                        </div>

                        {/* Status Messages */}
                        {booking.status === 'waitlist' && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-yellow-800">
                                <p className="font-medium">You're on the waitlist</p>
                                <p className="text-xs mt-1">
                                  We'll notify you if a spot becomes available.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {booking.status === 'cancelled' && booking.cancelled_at && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-start gap-2">
                              <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-red-800">
                                <p className="font-medium">Booking Cancelled</p>
                                <p className="text-xs mt-1">
                                  Cancelled on {new Date(booking.cancelled_at).toLocaleDateString('en-GB')}
                                </p>
                                {booking.cancellation_reason && (
                                  <p className="text-xs mt-2 font-medium">
                                    Reason: {booking.cancellation_reason}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-3 w-full sm:w-auto">
                        <Link href={`/events/${booking.event_id}`}>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full flex items-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Event
                          </Button>
                        </Link>
                        
                        {canCancel && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancellingId === booking.id}
                            className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                          >
                            {cancellingId === booking.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Cancelling...
                              </>
                            ) : (
                              'Cancel Booking'
                            )}
                          </Button>
                        )}
                        
                        {/* Delete button only for cancelled bookings */}
                        {booking.status === 'cancelled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBooking(booking.id)}
                            disabled={deletingId === booking.id}
                            className="w-full border-red-300 text-red-600 hover:bg-red-50"
                          >
                            {deletingId === booking.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Delete Booking
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Cancellation Reason Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Cancel Booking
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for cancelling this booking:
              </p>
              
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Schedule conflict, no longer available, etc."
                className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                maxLength={200}
              />
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                    setBookingToCancel(null);
                  }}
                  className="px-4 py-2"
                >
                  Cancel
                </Button>
                
                <Button
                  onClick={confirmCancelBooking}
                  disabled={!cancelReason.trim()}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Confirm Cancellation
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
