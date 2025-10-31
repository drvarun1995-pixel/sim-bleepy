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
  ExternalLink,
  QrCode,
  MessageSquare,
  FileText,
  Download,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Booking {
  id: string;
  event_id: string;
  status: 'pending' | 'confirmed' | 'waitlist' | 'cancelled' | 'attended' | 'no-show';
  booked_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
  feedback_completed: boolean;
  feedback_completed_at: string | null;
  certificate_released_at: string | null;
  events: {
    id: string;
    title: string;
    date: string;
    start_time: string;
    end_time: string;
    booking_capacity: number | null;
    location_name?: string;
    location_address?: string;
    qr_attendance_enabled?: boolean;
    auto_generate_certificate?: boolean;
    feedback_required_for_certificate?: boolean;
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);

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

  const handleDeleteBooking = (bookingId: string) => {
    setBookingToDelete(bookingId);
    setShowDeleteModal(true);
  };

  const confirmDeleteBooking = async () => {
    if (!bookingToDelete) return;

    try {
      setDeletingId(bookingToDelete);
      setShowDeleteModal(false);
      
      const response = await fetch(`/api/bookings/${bookingToDelete}`, {
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
      setBookingToDelete(null);
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

  const PAST_STATUSES: Booking['status'][] = ['cancelled', 'attended', 'no-show']
  const UPCOMING_STATUSES: Booking['status'][] = ['confirmed', 'waitlist', 'pending']

  const isBookingPast = (booking: Booking) => {
    const eventHasPassed = isEventPast(booking.events.date, booking.events.start_time);
    const statusMarksPast = PAST_STATUSES.includes(booking.status);
    return eventHasPassed || statusMarksPast;
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    const past = isBookingPast(booking);
    return filter === 'past' ? past : !past;
  });

  const upcomingCount = bookings.filter(b => {
    if (isBookingPast(b)) return false;
    return UPCOMING_STATUSES.includes(b.status);
  }).length;

  const pastCount = bookings.filter(b => isBookingPast(b)).length;

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="space-y-4">
            {/* Back Button - Separate Row */}
            <div>
              <Link 
                href="/dashboard" 
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-all duration-200 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 hover:scale-105 w-fit"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium">Back to Dashboard</span>
              </Link>
            </div>
            
            {/* Title & Filter Buttons Row */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">My Bookings</h1>
                <p className="text-gray-600 text-lg">View and manage your event registrations</p>
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
                    Upcoming ({upcomingCount})
                  </button>
                  <button
                    onClick={() => setFilter('past')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      filter === 'past'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Past ({pastCount})
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
        </div>

        {/* QR Code Scanner Section */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <QrCode className="h-6 w-6" />
              QR Code Scanner
            </CardTitle>
            <CardDescription className="text-blue-700">
              Scan QR codes to mark your attendance at events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Scanner Options */}
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Quick Access</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Use the QR code scanner to mark your attendance at events
                  </p>
                  <div className="space-y-2">
                    <Link 
                      href="/scan-attendance"
                      className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                    >
                      <QrCode className="h-4 w-4" />
                      Open QR Scanner
                    </Link>
                    <p className="text-xs text-gray-500 text-center">
                      You're already logged in - no additional details needed
                    </p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-2">How to Use</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Open Scanner</p>
                        <p className="text-xs text-gray-600">Click "Open QR Scanner" above</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Allow Camera Access</p>
                        <p className="text-xs text-gray-600">Grant camera permission when prompted</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Scan QR Code</p>
                        <p className="text-xs text-gray-600">Point your camera at the event QR code</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        4
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Complete Feedback</p>
                        <p className="text-xs text-gray-600">Check your email for the feedback form</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                            <span>{formatTime(booking.events.start_time)} - {formatTime(booking.events.end_time)}</span>
                          </div>
                          {booking.events.location_name && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-purple-600" />
                              <span>{booking.events.location_name}</span>
                            </div>
                          )}
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
                          {booking.feedback_completed && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <MessageSquare className="h-3 w-3" />
                              Feedback Completed
                            </span>
                          )}
                          {booking.certificate_released_at && (
                            <span className="flex items-center gap-1 text-purple-600">
                              <FileText className="h-3 w-3" />
                              Certificate Ready
                            </span>
                          )}
                        </div>

                        {/* QR Code & Feedback Actions */}
                        {booking.events.qr_attendance_enabled && (
                          <div className="mt-4 space-y-3">
                            {/* QR Code Scanner */}
                            {!booking.checked_in && booking.status === 'confirmed' && (
                              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <QrCode className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-800">
                                    Scan QR Code to Mark Attendance
                                  </span>
                                </div>
                                <Button
                                  onClick={() => router.push('/scan-attendance')}
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <QrCode className="h-4 w-4 mr-1" />
                                  Scan QR Code
                                </Button>
                              </div>
                            )}

                            {/* Feedback Form */}
                            {booking.checked_in && !booking.feedback_completed && (
                              <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="h-4 w-4 text-yellow-600" />
                                  <div>
                                    <span className="text-sm font-medium text-yellow-800">
                                      Complete Feedback Form
                                    </span>
                                    <p className="text-xs text-yellow-700">
                                      Required for certificate generation
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => {
                                    // This would link to the feedback form
                                    // For now, we'll show a placeholder
                                    toast.info('Feedback form will be available after QR scan')
                                  }}
                                  size="sm"
                                  className="bg-yellow-600 hover:bg-yellow-700"
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Complete Feedback
                                </Button>
                              </div>
                            )}

                            {/* Certificate Status */}
                            {booking.feedback_completed && (
                              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-green-600" />
                                  <div>
                                    <span className="text-sm font-medium text-green-800">
                                      {booking.certificate_released_at ? 'Certificate Ready' : 'Certificate Pending'}
                                    </span>
                                    <p className="text-xs text-green-700">
                                      {booking.certificate_released_at 
                                        ? 'Your certificate is available for download'
                                        : 'Certificate will be available after approval'
                                      }
                                    </p>
                                  </div>
                                </div>
                                {booking.certificate_released_at ? (
                                  <Button
                                    onClick={() => router.push('/mycertificates')}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Download className="h-4 w-4 mr-1" />
                                    Download Certificate
                                  </Button>
                                ) : (
                                  <div className="flex items-center gap-1 text-sm text-green-700">
                                    <Star className="h-4 w-4" />
                                    Pending Approval
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Status Messages */}
                        {booking.status === 'pending' && (
                          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
                            <div className="flex items-start gap-2">
                              <Clock className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-orange-800">
                                <p className="font-medium">Awaiting Approval</p>
                                <p className="text-xs mt-1">
                                  Your booking request is pending approval from the event organizer. You'll be notified once it's reviewed.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
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
                            className="w-full flex items-center gap-2 border-blue-600 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-700 hover:text-blue-800 font-medium transition-colors duration-200"
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
                            className="w-full border-orange-600 text-orange-700 bg-orange-50 hover:bg-orange-100 hover:border-orange-700 hover:text-orange-800 font-medium transition-colors duration-200"
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
                            className="w-full border-2 border-red-500 text-red-700 bg-red-50 hover:bg-red-100 hover:border-red-600 hover:text-red-800 font-semibold transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
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

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Delete Booking
                    </h3>
                    <p className="text-red-100 text-sm">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-6">
                  <p className="text-sm text-red-800 font-medium">
                    Are you sure you want to permanently delete this booking from your records?
                  </p>
                </div>
                
                <p className="text-gray-600 text-sm mb-6">
                  This will remove all booking information and history. This action is permanent and cannot be reversed.
                </p>

                {/* Action buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setBookingToDelete(null);
                    }}
                    className="flex-1 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 font-semibold transition-all duration-200"
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    onClick={confirmDeleteBooking}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Delete Permanently
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
