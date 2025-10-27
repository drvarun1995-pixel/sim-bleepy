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
  Trash2,
  Award,
  QrCode,
  Users
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
  certificates?: {
    id: string;
    sent_via_email: boolean;
    email_sent_at: string | null;
    email_error_message: string | null;
    generated_at: string;
  }[];
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
  const [qrCode, setQrCode] = useState<any>(null);
  const [loadingQR, setLoadingQR] = useState(false);

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
      loadQRCode();
    }
  }, [status, params.eventId]);

  const loadQRCode = async (retryCount = 0) => {
    setLoadingQR(true);
    try {
      const response = await fetch(`/api/qr-codes/${params.eventId}`);
      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
      } else if (response.status === 404) {
        // QR code doesn't exist yet - this is normal
        setQrCode(null);
        
        // If this is a new event and no QR code exists, try to auto-generate
        if (retryCount === 0) {
          console.log('🔄 No QR code found, attempting auto-generation...');
          try {
            const autoGenResponse = await fetch('/api/qr-codes/auto-generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ eventId: params.eventId })
            });
            
            if (autoGenResponse.ok) {
              console.log('✅ Auto-generation successful, retrying load...');
              // Wait a moment and retry
              setTimeout(() => loadQRCode(1), 1000);
              return;
            }
          } catch (autoGenError) {
            console.log('⚠️ Auto-generation failed:', autoGenError);
          }
        }
      }
    } catch (error) {
      console.error('Error loading QR code:', error);
      setQrCode(null);
    } finally {
      setLoadingQR(false);
    }
  };

  const generateQRCode = async () => {
    setLoadingQR(true);
    try {
      console.log('🧪 Testing auto-generation for event:', params.eventId);
      
      const response = await fetch('/api/qr-codes/test-auto-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: params.eventId
        })
      });

      console.log('🧪 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🧪 Response data:', data);
        setQrCode(data.qrCode);
        toast.success('QR code generated successfully');
        await loadQRCode(); // Refresh the QR code data
      } else {
        const errorData = await response.json();
        console.error('🧪 Error response:', errorData);
        toast.error(errorData.error || 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setLoadingQR(false);
    }
  };

  const regenerateQRCode = async () => {
    setLoadingQR(true);
    try {
      const response = await fetch('/api/qr-codes/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: params.eventId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
        toast.success('QR code regenerated successfully');
        await loadQRCode(); // Refresh the QR code data
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to regenerate QR code');
      }
    } catch (error) {
      console.error('Error regenerating QR code:', error);
      toast.error('Failed to regenerate QR code');
    } finally {
      setLoadingQR(false);
    }
  };

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

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.users.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.users.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      setUpdatingStatus(bookingId);
      
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update booking status');
      }

      toast.success('Booking status updated successfully');
      await fetchBookings(); // Refresh
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    setBookingToCancel(bookingId);
    setShowCancelModal(true);
  };

  const confirmCancelBooking = async () => {
    if (!bookingToCancel) return;

    try {
      setUpdatingStatus(bookingToCancel);
      setShowCancelModal(false);
      
      const response = await fetch(`/api/bookings/${bookingToCancel}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'cancelled',
          cancellation: cancelReason
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
    // Export to CSV
    const headers = ['Name', 'Email', 'Status', 'Booked At', 'Checked In', 'Notes'];
    const rows = filteredBookings.map(booking => [
      booking.users.name,
      booking.users.email,
      booking.status,
      new Date(booking.booked_at).toLocaleDateString(),
      booking.checked_in ? 'Yes' : 'No',
      booking.notes || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${event?.title || 'event'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Bookings exported successfully');
  };

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
    <div className="space-y-6">
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
            
            {/* Right Section: Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center lg:justify-end gap-3">
              <Button
                onClick={qrCode ? () => router.push(`/qr-codes/${params.eventId}`) : generateQRCode}
                className="flex items-center gap-3 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 hover:from-orange-700 hover:via-red-700 hover:to-pink-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                disabled={loadingQR}
              >
                <QrCode className="h-5 w-5" />
                <span>{loadingQR ? 'Loading...' : qrCode ? 'View QR Code' : 'Generate QR Code'}</span>
              </Button>
              {qrCode && (
                <Button 
                  onClick={regenerateQRCode}
                  variant="outline"
                  className="flex items-center gap-3 border-2 border-orange-300 text-orange-700 hover:text-orange-800 hover:bg-orange-50 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  disabled={loadingQR}
                >
                  <QrCode className="h-5 w-5" />
                  <span>{loadingQR ? 'Regenerating...' : 'Regenerate QR'}</span>
                </Button>
              )}
              <Button 
                onClick={() => router.push(`/certificates/generate?event=${params.eventId}`)}
                className="flex items-center gap-3 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <Award className="h-5 w-5" />
                <span>Generate Certificates</span>
              </Button>
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

      {/* Enhanced Filters */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-8">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="waitlist">Waitlist</option>
              <option value="cancelled">Cancelled</option>
              <option value="attended">Attended</option>
              <option value="no-show">No Show</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Bookings ({filteredBookings.length})
          </CardTitle>
          <CardDescription>
            Manage all bookings for this event
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
                <p>Try adjusting your filters or search terms.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-full bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Table Header */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-2">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Name</h3>
                    </div>
                    <div className="col-span-2">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Email</h3>
                    </div>
                    <div className="col-span-1">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Status</h3>
                    </div>
                    <div className="col-span-1">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Booked</h3>
                    </div>
                    <div className="col-span-1">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Checked In</h3>
                    </div>
                    <div className="col-span-1">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Certificates</h3>
                    </div>
                    <div className="col-span-1">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Email Sent</h3>
                    </div>
                    <div className="col-span-3">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Actions</h3>
                      <p className="text-xs text-gray-500 mt-1 font-normal">Delete only available after cancellation</p>
                    </div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200">
                  {filteredBookings.map((booking, index) => (
                    <div 
                      key={booking.id} 
                      className={`px-6 py-4 hover:bg-gray-50 transition-colors duration-150 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      }`}
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Name Column */}
                        <div className="col-span-2">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {booking.users.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {booking.users.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {booking.users.role}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Email Column */}
                        <div className="col-span-2">
                          <p className="text-sm text-gray-900 truncate">{booking.users.email}</p>
                        </div>

                        {/* Status Column */}
                        <div className="col-span-1">
                          <BookingStatusBadge status={booking.status} />
                        </div>

                        {/* Booked At Column */}
                        <div className="col-span-1">
                          <p className="text-sm text-gray-900">
                            {new Date(booking.booked_at).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Checked In Column */}
                        <div className="col-span-1">
                          {booking.checked_in ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">Yes</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-gray-400">
                              <XCircle className="h-4 w-4" />
                              <span className="text-sm">No</span>
                            </div>
                          )}
                        </div>

                        {/* Certificates Column */}
                        <div className="col-span-1">
                          {booking.certificates && booking.certificates.length > 0 ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <Award className="h-4 w-4" />
                              <span className="text-sm font-medium">Generated</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-gray-400">
                              <XCircle className="h-4 w-4" />
                              <span className="text-sm">None</span>
                            </div>
                          )}
                        </div>

                        {/* Email Sent Column */}
                        <div className="col-span-1">
                          {booking.certificates && booking.certificates.length > 0 ? (
                            booking.certificates.some(cert => cert.sent_via_email) ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">Yes</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-yellow-600">
                                <XCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">Pending</span>
                              </div>
                            )
                          ) : (
                            <div className="flex items-center gap-1 text-gray-400">
                              <XCircle className="h-4 w-4" />
                              <span className="text-sm">N/A</span>
                            </div>
                          )}
                        </div>

                        {/* Actions Column */}
                        <div className="col-span-3">
                          <div className="flex items-center gap-2">
                            <select
                              value={booking.status}
                              onChange={(e) => handleStatusUpdate(booking.id, e.target.value)}
                              disabled={updatingStatus === booking.id}
                              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="waitlist">Waitlist</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="attended">Attended</option>
                              <option value="no-show">No Show</option>
                            </select>
                            
                            {booking.status !== 'cancelled' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelBooking(booking.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              >
                                Cancel
                              </Button>
                            )}
                            
                            {booking.status === 'cancelled' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteBooking(booking.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancellation Reason Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cancel Booking
            </h3>
            <div className="mb-4">
              <Label htmlFor="cancelReason">Reason for cancellation (optional)</Label>
              <Input
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter reason for cancellation..."
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmCancelBooking}
                className="bg-red-600 hover:bg-red-700"
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Cancelled Booking
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to permanently delete this cancelled booking? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setBookingToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteBooking}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}