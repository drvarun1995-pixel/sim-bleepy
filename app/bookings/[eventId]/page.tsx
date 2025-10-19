'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookingStats } from '@/components/bookings/BookingStats';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { 
  ArrowLeft, 
  Loader2, 
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  Download,
  Search,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Booking {
  id: string;
  status: 'pending' | 'confirmed' | 'waitlist' | 'cancelled' | 'attended' | 'no-show';
  booked_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
  confirmation_checkbox_1_checked: boolean;
  confirmation_checkbox_2_checked: boolean;
  notes: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  users: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface Event {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  booking_capacity: number | null;
  booking_enabled: boolean;
  booking_button_label: string;
  booking_deadline_hours: number;
  allow_waitlist: boolean;
  location_name?: string;
  location_address?: string;
}

export default function EventBookingsPage({ params }: { params: { eventId: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'waitlist' | 'cancelled' | 'attended' | 'no-show'>('all');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);

  // Check authentication and authorization
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (!['admin', 'meded_team', 'ctf', 'educator'].includes(userRole)) {
        toast.error('Access Denied', {
          description: 'You do not have permission to access this page.'
        });
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchBookings();
    }
  }, [status, params.eventId]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bookings/event/${params.eventId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.bookings || []);
      setEvent(data.event || null);
      setSummary(data.summary || null);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string, checkedIn?: boolean) => {
    try {
      setUpdatingStatus(bookingId);
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          checked_in: checkedIn
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update booking');
      }

      toast.success('Booking updated successfully');
      await fetchBookings(); // Refresh
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}${ampm}`;
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
      setUpdatingStatus(bookingToCancel);
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
      await fetchBookings(); // Refresh
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    } finally {
      setUpdatingStatus(null);
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
      setUpdatingStatus(bookingToDelete);
      setShowDeleteModal(false);
      
      // Admins perform hard delete with ?hard=true query parameter
      const response = await fetch(`/api/bookings/${bookingToDelete}?hard=true`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete booking');
      }

      toast.success('Booking permanently deleted');
      await fetchBookings(); // Refresh
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Failed to delete booking');
    } finally {
      setUpdatingStatus(null);
      setBookingToDelete(null);
    }
  };

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Booked At', 'Checked In', 'Cancellation Reason'];
    const rows = filteredBookings.map(booking => [
      booking.users.name,
      booking.users.email,
      booking.users.role,
      booking.status,
      new Date(booking.booked_at).toLocaleString(),
      booking.checked_in ? 'Yes' : 'No',
      booking.cancellation_reason || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event?.title}-bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Bookings exported successfully');
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.users.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.users.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Event not found</p>
          <Button onClick={() => router.push('/bookings')}>
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Enhanced Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left Section: Back Button & Event Info */}
            <div className="flex flex-col gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/bookings')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 transition-all duration-200 hover:scale-105 w-fit"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium">Back to All Bookings</span>
              </Button>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{event.title}</h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">{new Date(event.date).toLocaleDateString('en-GB', { 
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">{formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
                  </div>
                  {event.location_name && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-green-600" />
                      <span className="font-medium">{event.location_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right Section: Export Button */}
            <div className="flex justify-center lg:justify-end">
              <Button 
                onClick={handleExport} 
                className="flex items-center gap-3 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <Download className="h-5 w-5" />
                <span>Export CSV</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {summary && (
          <div className="mb-8">
            <BookingStats summary={summary} />
          </div>
        )}

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Approval</option>
                <option value="confirmed">Confirmed</option>
                <option value="waitlist">Waitlist</option>
                <option value="cancelled">Cancelled</option>
                <option value="attended">Attended</option>
                <option value="no-show">No Show</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Bookings ({filteredBookings.length})</CardTitle>
            <CardDescription>Manage all bookings for this event</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No bookings found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Name</th>
                      <th className="text-left p-3 font-semibold">Email</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                      <th className="text-left p-3 font-semibold">Booked At</th>
                      <th className="text-left p-3 font-semibold">Checked In</th>
                      <th className="text-left p-3 font-semibold">Cancellation Reason</th>
                      <th className="text-right p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => (
                      <tr 
                        key={booking.id} 
                        className={`border-b hover:bg-gray-50 ${booking.deleted_at ? 'bg-red-50 opacity-60' : ''}`}
                      >
                        <td className="p-3">
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {booking.users.name}
                              {booking.deleted_at && (
                                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                                  Deleted by User
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{booking.users.role}</div>
                          </div>
                        </td>
                        <td className="p-3 text-sm">{booking.users.email}</td>
                        <td className="p-3">
                          <BookingStatusBadge status={booking.status} size="sm" />
                        </td>
                        <td className="p-3 text-sm">
                          {new Date(booking.booked_at).toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="p-3">
                          {booking.checked_in ? (
                            <span className="flex items-center gap-1 text-green-600 text-sm">
                              <CheckCircle className="h-4 w-4" />
                              Yes
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-gray-400 text-sm">
                              <XCircle className="h-4 w-4" />
                              No
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {booking.cancellation_reason ? (
                            <div className="text-sm text-gray-600 max-w-xs">
                              <div className="truncate" title={booking.cancellation_reason}>
                                {booking.cancellation_reason}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-2">
                            {/* Quick Actions */}
                            {booking.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                                  disabled={updatingStatus === booking.id}
                                  className="text-xs bg-green-600 hover:bg-green-700 text-white border-0"
                                >
                                  {updatingStatus === booking.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    'Approve'
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancelBooking(booking.id)}
                                  disabled={updatingStatus === booking.id}
                                  className="text-xs border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 hover:text-red-700"
                                >
                                  {updatingStatus === booking.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    'Reject'
                                  )}
                                </Button>
                              </>
                            )}
                            {booking.status === 'confirmed' && !booking.checked_in && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(booking.id, 'attended', true)}
                                disabled={updatingStatus === booking.id}
                                className="text-xs"
                              >
                                {updatingStatus === booking.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Mark Attended'
                                )}
                              </Button>
                            )}
                            {booking.status === 'waitlist' && summary?.availableSlots > 0 && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                                disabled={updatingStatus === booking.id}
                                className="text-xs"
                              >
                                {updatingStatus === booking.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Confirm'
                                )}
                              </Button>
                            )}
                            
                            {/* Cancel button for active bookings (but not pending - they have Reject) */}
                            {(booking.status === 'confirmed' || booking.status === 'waitlist') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelBooking(booking.id)}
                                disabled={updatingStatus === booking.id}
                                className="text-xs border-orange-600 text-orange-700 bg-orange-50 hover:bg-orange-100 hover:border-orange-700 hover:text-orange-800 font-medium"
                              >
                                {updatingStatus === booking.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Cancel'
                                )}
                              </Button>
                            )}
                            
                            {/* Delete button for cancelled and attended bookings (admin only) */}
                            {(booking.status === 'cancelled' || booking.status === 'attended') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteBooking(booking.id)}
                                disabled={updatingStatus === booking.id}
                                className="text-xs border-2 border-red-500 text-red-700 bg-red-50 hover:bg-red-100 hover:border-red-600 hover:text-red-800 font-semibold transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                              >
                                {updatingStatus === booking.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
                  Are you sure you want to permanently delete this booking?
                </p>
              </div>
              
              <p className="text-gray-600 text-sm mb-6">
                This will permanently remove all booking information from the database. This action is irreversible.
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

