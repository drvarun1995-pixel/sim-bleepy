'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BookingStats } from '@/components/bookings/BookingStats';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  Loader2, 
  Users,
  ArrowLeft,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface BookingStatItem {
  event_id: string;
  title: string;
  date: string;
  start_time: string;
  booking_capacity: number | null;
  confirmed_count: number;
  waitlist_count: number;
  cancelled_count: number;
  attended_count: number;
  no_show_count: number;
  available_slots: number | null;
  booking_status: 'available' | 'almost_full' | 'full' | 'unlimited';
}

export default function BookingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BookingStatItem[]>([]);
  const [overallStats, setOverallStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'almost_full' | 'full' | 'unlimited'>('all');
  const [filterDate, setFilterDate] = useState<'all' | 'upcoming' | 'past'>('all');

  // Check authentication and authorization
  useEffect(() => {
    console.log('Bookings page - Session status:', status);
    console.log('Bookings page - Session data:', session);
    console.log('Bookings page - User role:', (session?.user as any)?.role);
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      console.log('Bookings page - Checking role:', userRole);
      console.log('Bookings page - Allowed roles:', ['admin', 'meded_team', 'ctf', 'educator']);
      console.log('Bookings page - Role check result:', ['admin', 'meded_team', 'ctf', 'educator'].includes(userRole));
      
      if (!['admin', 'meded_team', 'ctf', 'educator'].includes(userRole)) {
        console.log('Bookings page - Access denied for role:', userRole);
        toast.error('Access Denied', {
          description: 'You do not have permission to access this page.'
        });
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchBookingStats();
    }
  }, [status]);

  const fetchBookingStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bookings/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch booking statistics');
      }

      const data = await response.json();
      setStats(data.stats || []);
      setOverallStats(data.overall || null);
    } catch (error) {
      console.error('Error fetching booking stats:', error);
      toast.error('Failed to load booking statistics');
    } finally {
      setLoading(false);
    }
  };

  const filteredStats = stats.filter(stat => {
    // Search filter
    const matchesSearch = stat.title.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = filterStatus === 'all' || stat.booking_status === filterStatus;

    // Date filter
    let matchesDate = true;
    if (filterDate !== 'all') {
      const eventDate = new Date(stat.date);
      const now = new Date();
      matchesDate = filterDate === 'upcoming' ? eventDate >= now : eventDate < now;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleExport = () => {
    // Export to CSV
    const headers = ['Event', 'Date', 'Time', 'Capacity', 'Confirmed', 'Waitlist', 'Cancelled', 'Attended', 'No Show', 'Status'];
    const rows = filteredStats.map(stat => [
      stat.title,
      new Date(stat.date).toLocaleDateString(),
      stat.start_time,
      stat.booking_capacity || 'Unlimited',
      stat.confirmed_count,
      stat.waitlist_count,
      stat.cancelled_count,
      stat.attended_count,
      stat.no_show_count,
      stat.booking_status
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-export-${new Date().toISOString().split('T')[0]}.csv`;
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Event Bookings</h1>
              <p className="text-gray-600 mt-1">Manage all event registrations and bookings</p>
            </div>
          </div>
          <Button onClick={handleExport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Overall Statistics */}
        {overallStats && (
          <BookingStats
            summary={{
              total: overallStats.totalConfirmedBookings + overallStats.totalWaitlistBookings,
              confirmed: overallStats.totalConfirmedBookings,
              waitlist: overallStats.totalWaitlistBookings,
              cancelled: overallStats.totalCancelledBookings,
              attended: overallStats.totalAttendedBookings,
              noShow: 0,
              capacity: null,
              availableSlots: null
            }}
          />
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search events..."
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
                <option value="available">Available</option>
                <option value="almost_full">Almost Full</option>
                <option value="full">Full</option>
                <option value="unlimited">Unlimited</option>
              </select>

              {/* Date Filter */}
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Events</option>
                <option value="upcoming">Upcoming Events</option>
                <option value="past">Past Events</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <div className="space-y-4">
          {filteredStats.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No events with bookings found</p>
              </CardContent>
            </Card>
          ) : (
            filteredStats.map((stat) => (
              <Card key={stat.event_id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{stat.title}</h3>
                        <Badge className={
                          stat.booking_status === 'full' ? 'bg-red-100 text-red-700' :
                          stat.booking_status === 'almost_full' ? 'bg-orange-100 text-orange-700' :
                          stat.booking_status === 'unlimited' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }>
                          {stat.booking_status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(stat.date).toLocaleDateString('en-GB', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}</span>
                        </div>
                        <span>{stat.start_time}</span>
                      </div>

                      {/* Quick Stats */}
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-gray-500">Confirmed:</span>
                          <span className="font-semibold text-green-600 ml-2">{stat.confirmed_count}</span>
                        </div>
                        {stat.waitlist_count > 0 && (
                          <div>
                            <span className="text-gray-500">Waitlist:</span>
                            <span className="font-semibold text-yellow-600 ml-2">{stat.waitlist_count}</span>
                          </div>
                        )}
                        {stat.booking_capacity && (
                          <div>
                            <span className="text-gray-500">Capacity:</span>
                            <span className="font-semibold text-blue-600 ml-2">
                              {stat.confirmed_count} / {stat.booking_capacity}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center gap-2">
                      <Link href={`/bookings/${stat.event_id}`}>
                        <Button className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


