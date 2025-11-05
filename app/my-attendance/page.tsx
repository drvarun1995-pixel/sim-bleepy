'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Users, 
  FileText,
  Search,
  ExternalLink,
  QrCode,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import Link from 'next/link';

interface AttendanceRecord {
  scanId: string;
  scannedAt: string;
  event: {
    id: string;
    title: string;
    description?: string;
    date: string;
    startTime: string;
    endTime: string;
    eventStatus: string;
    format: {
      id: string;
      name: string;
    } | null;
    locations: Array<{ id: string; name: string; address?: string }>;
    organizers: Array<{ id: string; name: string }>;
    speakers: Array<{ id: string; name: string; role: string }>;
    hideLocation: boolean;
    hideOrganizer: boolean;
  };
}

export default function MyAttendancePage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMyAttendance();
    }
  }, [status]);

  useEffect(() => {
    // Filter records based on search query
    if (searchQuery.trim() === '') {
      setFilteredRecords(attendanceRecords);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = attendanceRecords.filter(record => 
        record.event.title.toLowerCase().includes(query) ||
        record.event.format?.name.toLowerCase().includes(query) ||
        record.event.locations.some(loc => loc.name.toLowerCase().includes(query)) ||
        record.event.organizers.some(org => org.name.toLowerCase().includes(query)) ||
        record.event.speakers.some(speaker => speaker.name.toLowerCase().includes(query))
      );
      setFilteredRecords(filtered);
    }
  }, [searchQuery, attendanceRecords]);

  const fetchMyAttendance = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/my-attendance');
      
      if (!response.ok) {
        throw new Error('Failed to fetch attendance');
      }

      const data = await response.json();
      setAttendanceRecords(data.attendanceRecords || []);
      setFilteredRecords(data.attendanceRecords || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingScreen message="Loading your attendance records..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Attendance Tracking</h1>
              <p className="text-gray-600 mt-2">
                View all events where you've scanned the QR code for attendance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <QrCode className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by event title, format, location, organizer, or speaker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-900">{attendanceRecords.length}</div>
              <div className="text-sm text-gray-600">Total Events Attended</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-900">{filteredRecords.length}</div>
              <div className="text-sm text-gray-600">Filtered Results</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-900">
                {new Set(attendanceRecords.map(r => r.event.date)).size}
              </div>
              <div className="text-sm text-gray-600">Unique Dates</div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Records */}
        {filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? 'No matching records found' : 'No attendance records yet'}
              </h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Your scanned QR codes will appear here once you attend events'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <Card key={record.scanId} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Event Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <Link href={`/events/${record.event.id}`}>
                            <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                              {record.event.title}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <QrCode className="h-3 w-3 mr-1" />
                              Attended
                            </Badge>
                            {record.event.eventStatus && record.event.eventStatus !== 'scheduled' && (
                              <Badge variant="outline">
                                {record.event.eventStatus}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Link href={`/events/${record.event.id}`}>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Event
                          </Button>
                        </Link>
                      </div>

                      {/* Event Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {/* Date & Time */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">Event Date:</span>
                            <span>{formatDate(record.event.date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">Time:</span>
                            <span>
                              {formatTime(record.event.startTime)} - {formatTime(record.event.endTime)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <QrCode className="h-4 w-4" />
                            <span className="font-medium">Scanned At:</span>
                            <span>{formatDateTime(record.scannedAt)}</span>
                          </div>
                        </div>

                        {/* Format, Location, Organizer */}
                        <div className="space-y-2">
                          {record.event.format && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FileText className="h-4 w-4" />
                              <span className="font-medium">Format:</span>
                              <span>{record.event.format.name}</span>
                            </div>
                          )}
                          {record.event.locations.length > 0 && !record.event.hideLocation && (
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mt-0.5" />
                              <div className="flex-1">
                                <span className="font-medium">Location:</span>
                                <div className="mt-1">
                                  {record.event.locations.map((loc, idx) => (
                                    <div key={loc.id}>
                                      {loc.name}
                                      {loc.address && <span className="text-gray-500"> - {loc.address}</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          {record.event.organizers.length > 0 && !record.event.hideOrganizer && (
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                              <User className="h-4 w-4 mt-0.5" />
                              <div className="flex-1">
                                <span className="font-medium">Organizer:</span>
                                <div className="mt-1">
                                  {record.event.organizers.map((org, idx) => (
                                    <div key={org.id}>{org.name}</div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          {record.event.speakers.length > 0 && (
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                              <Users className="h-4 w-4 mt-0.5" />
                              <div className="flex-1">
                                <span className="font-medium">Speakers:</span>
                                <div className="mt-1">
                                  {record.event.speakers.map((speaker, idx) => (
                                    <div key={speaker.id}>
                                      {speaker.name}
                                      {speaker.role && <span className="text-gray-500"> - {speaker.role}</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
}

