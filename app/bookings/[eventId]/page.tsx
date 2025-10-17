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
  status: 'confirmed' | 'waitlist' | 'cancelled' | 'attended' | 'no-show';
  booked_at: string;
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
}

export default function EventBookingsPage({ params }: { params: { eventId: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'waitlist' | 'cancelled' | 'attended' | 'no-show'>('all');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

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

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete booking');
      }

      toast.success('Booking deleted successfully');
      await fetchBookings(); // Refresh
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Failed to delete booking');
    }
  };

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Booked At', 'Checked In'];
    const rows = filteredBookings.map(booking => [
      booking.users.name,
      booking.users.email,
      booking.users.role,
      booking.status,
      new Date(booking.booked_at).toLocaleString(),
      booking.checked_in ? 'Yes' : 'No'
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/bookings')}
              className="flex items-center gap-2 mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to All Bookings
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
            <div className="flex items-center gap-4 text-gray-600 mt-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(event.date).toLocaleDateString('en-GB')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{event.start_time} - {event.end_time}</span>
              </div>
            </div>
          </div>
          <Button onClick={handleExport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Statistics */}
        {summary && (
          <BookingStats summary={summary} />
        )}

        {/* Filters */}
        <Card>
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
                          <div className="flex items-center justify-end gap-2">
                            {/* Quick Actions */}
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
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteBooking(booking.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
    </div>
  );
}

