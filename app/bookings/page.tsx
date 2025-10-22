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
  Clock,
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
  const [filterBookings, setFilterBookings] = useState<'all' | 'with_bookings' | 'no_bookings'>('all');

  // Authorization is handled by the layout component

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

    // Bookings filter
    let matchesBookings = true;
    if (filterBookings !== 'all') {
      const totalBookings = stat.confirmed_count + stat.waitlist_count + stat.cancelled_count + stat.attended_count + stat.no_show_count;
      matchesBookings = filterBookings === 'with_bookings' ? totalBookings > 0 : totalBookings === 0;
    }

    return matchesSearch && matchesStatus && matchesDate && matchesBookings;
  });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}${ampm}`;
  };

  const handleExport = () => {
    // Export to CSV
    const headers = ['Event', 'Date', 'Time', 'Capacity', 'Confirmed', 'Waitlist', 'Cancelled', 'Attended', 'No Show', 'Status'];
    const rows = filteredStats.map(stat => [
      stat.title,
      new Date(stat.date).toLocaleDateString(),
      formatTime(stat.start_time),
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Enhanced Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="space-y-4">
            {/* Back Button - Separate Row */}
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 transition-all duration-200 hover:scale-105 w-fit"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium">Back to Dashboard</span>
              </Button>
            </div>
            
            {/* Title & Export Button Row */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Event Bookings</h1>
                <p className="text-gray-600 text-lg">Manage all event registrations and bookings</p>
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
        </div>

        {/* Overall Statistics */}
        {overallStats && (
          <div className="mb-8">
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
          </div>
        )}

        {/* Enhanced Filters */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-8">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

              {/* Bookings Filter */}
              <select
                value={filterBookings}
                onChange={(e) => setFilterBookings(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Events</option>
                <option value="with_bookings">With Bookings</option>
                <option value="no_bookings">No Bookings</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <div className="space-y-6">
          {filteredStats.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No events with bookings found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredStats.map((stat) => (
                <Card key={stat.event_id} className="hover:shadow-xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      {/* Left Section: Event Details */}
                      <div className="flex-1 space-y-4">
                        {/* Title and Status */}
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold text-gray-900">{stat.title}</h3>
                          <Badge className={`px-3 py-1 text-xs font-semibold ${
                            stat.booking_status === 'full' ? 'bg-red-100 text-red-700 border-red-200' :
                            stat.booking_status === 'almost_full' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                            stat.booking_status === 'unlimited' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            'bg-green-100 text-green-700 border-green-200'
                          }`}>
                            {stat.booking_status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        
                        {/* Date and Time */}
                        <div className="flex items-center gap-6 text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">{new Date(stat.date).toLocaleDateString('en-GB', { 
                              weekday: 'short',
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-purple-600" />
                            <span className="font-medium">{formatTime(stat.start_time)}</span>
                          </div>
                        </div>

                        {/* Booking Statistics */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <div className="text-sm text-green-700 font-medium">Confirmed</div>
                            <div className="text-lg font-bold text-green-800">{stat.confirmed_count}</div>
                          </div>
                          {stat.attended_count > 0 && (
                            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                              <div className="text-sm text-emerald-700 font-medium">Attended</div>
                              <div className="text-lg font-bold text-emerald-800">{stat.attended_count}</div>
                            </div>
                          )}
                          {stat.no_show_count > 0 && (
                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                              <div className="text-sm text-orange-700 font-medium">No Show</div>
                              <div className="text-lg font-bold text-orange-800">{stat.no_show_count}</div>
                            </div>
                          )}
                          {stat.waitlist_count > 0 && (
                            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                              <div className="text-sm text-yellow-700 font-medium">Waitlist</div>
                              <div className="text-lg font-bold text-yellow-800">{stat.waitlist_count}</div>
                            </div>
                          )}
                          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                            <div className="text-sm text-red-700 font-medium">Cancelled</div>
                            <div className="text-lg font-bold text-red-800">{stat.cancelled_count}</div>
                          </div>
                          {stat.booking_capacity && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <div className="text-sm text-blue-700 font-medium">Capacity</div>
                              <div className="text-lg font-bold text-blue-800">
                                {stat.confirmed_count} / {stat.booking_capacity}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Section: Action Button */}
                      <div className="flex items-center justify-center lg:justify-end">
                        <Link href={`/bookings/${stat.event_id}`}>
                          <Button className="flex items-center gap-3 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                            <Eye className="h-5 w-5" />
                            <span className="hidden sm:inline">View Details</span>
                            <span className="sm:hidden">View</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


