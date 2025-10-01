"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getEvents } from "@/lib/events-api";
import { useAdmin } from "@/lib/useAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Plus, Search, Clock, MapPin, Users, ChevronLeft, ChevronRight, Folder, UserCircle, Mic, Sparkles, RotateCcw } from "lucide-react";

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
  status: 'draft' | 'published' | 'cancelled';
  eventLink?: string;
  moreInfoLink?: string;
  moreInfoTarget?: 'current' | 'new';
  eventStatus?: 'scheduled' | 'rescheduled' | 'postponed' | 'cancelled' | 'moved-online';
  author?: string;
}

export default function EventsPage() {
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [organizerFilter, setOrganizerFilter] = useState("all");
  const [speakerFilter, setSpeakerFilter] = useState("all");
  
  // Calendar states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date | null>(new Date());

  // Load events from Supabase on component mount
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const supabaseEvents = await getEvents();
        
        // Transform Supabase events to match the interface
        const transformedEvents = supabaseEvents.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description || '',
          date: event.date,
          startTime: event.start_time || '',
          endTime: event.end_time || '',
          isAllDay: event.is_all_day || false,
          hideTime: event.hide_time || false,
          hideEndTime: event.hide_end_time || false,
          timeNotes: event.time_notes || '',
          location: event.location_name || '',
          otherLocations: '',
          hideLocation: event.hide_location || false,
          organizer: event.organizer_name || '',
          hideOrganizer: event.hide_organizer || false,
          category: event.category_name || '',
          format: event.format_name || '',
          speakers: event.speakers ? event.speakers.map((s: any) => s.name).join(', ') : '',
          hideSpeakers: event.hide_speakers || false,
          attendees: event.attendees || 0,
          status: event.status || 'published',
          eventLink: event.event_link,
          moreInfoLink: event.more_info_link,
          moreInfoTarget: event.more_info_target,
          eventStatus: event.event_status,
          author: event.author_name || 'Unknown'
        }));

        
        setEvents(transformedEvents);
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };

    loadEvents();
  }, []);

  const handleAddEvent = () => {
    router.push('/event-data?tab=add-event');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "";
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUniqueValues = (key: keyof Event) => {
    return Array.from(new Set(events.map(event => event[key]).filter(Boolean)));
  };

  const getUniqueSpeakers = () => {
    const allSpeakers = events.flatMap(event => 
      event.speakers ? event.speakers.split(',').map(s => s.trim()) : []
    ).filter(Boolean);
    return Array.from(new Set(allSpeakers));
  };

  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setFormatFilter("all");
    setLocationFilter("all");
    setOrganizerFilter("all");
    setSpeakerFilter("all");
    setCalendarSelectedDate(new Date());
  };

  const getFormatColor = (formatName: string, formatColor?: string): string => {
    // If a specific format color is provided, use it
    if (formatColor) {
      // Determine if the color is light or dark to set appropriate text color
      const isLightColor = (hex: string) => {
        const color = hex.replace('#', '');
        const r = parseInt(color.substr(0, 2), 16);
        const g = parseInt(color.substr(2, 2), 16);
        const b = parseInt(color.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 155;
      };
      
      const textColor = isLightColor(formatColor) ? 'text-gray-900' : 'text-white';
      return `bg-[${formatColor}] ${textColor}`;
    }
    
    if (!formatName) return 'bg-gray-300 text-gray-900';
    
    // Fallback: Use pattern matching for flexible color assignment
    const formatLower = formatName.toLowerCase();
    
    // Core Teaching - Green/Teal
    if (formatLower.includes('core teaching')) {
      return 'bg-[#96CEB4] text-gray-900';
    }
    
    // Grand Round - Pink
    if (formatLower.includes('grand round')) {
      return 'bg-[#FF9FF3] text-gray-900';
    }
    
    // Twilight Teaching - Yellow
    if (formatLower.includes('twilight teaching')) {
      return 'bg-[#F8B500] text-gray-900';
    }
    
    // Portfolio Drop-in - Magenta
    if (formatLower.includes('portfolio drop-in')) {
      return 'bg-[#C44569] text-white';
    }
    
    // OSCE Revision - Orange
    if (formatLower.includes('osce revision')) {
      return 'bg-[#FF9F43] text-white';
    }
    
    // UCL Mock OSCE - Purple
    if (formatLower.includes('[ucl]') || formatLower.includes('mock osce') || formatLower.includes('cpsa')) {
      return 'bg-purple-600 text-white';
    }
    
    // Bedside Teaching - Teal/Cyan
    if (formatLower.includes('bedside teaching')) {
      return 'bg-[#4ECDC4] text-gray-900';
    }
    
    // Induction - Purple
    if (formatLower.includes('induction')) {
      return 'bg-purple-500 text-white';
    }
    
    // Pharmacy Teaching - Green
    if (formatLower.includes('pharmacy') || formatLower.includes('prescribing')) {
      return 'bg-[#2ED573] text-gray-900';
    }
    
    // Virtual Reality - Purple
    if (formatLower.includes('virtual reality')) {
      return 'bg-[#6C5CE7] text-white';
    }
    
    // Hub days - Blue
    if (formatLower.includes('hub')) {
      return 'bg-[#54A0FF] text-white';
    }
    
    // Clinical Skills - Cyan
    if (formatLower.includes('clinical skills')) {
      return 'bg-[#45B7D1] text-white';
    }
    
    // Exams & Mocks - Yellow
    if (formatLower.includes('exam') || formatLower.includes('mock')) {
      return 'bg-[#FECA57] text-gray-900';
    }
    
    // O&G, Obs & Gynae - Cyan
    if (formatLower.includes('o&g') || formatLower.includes('obs') || formatLower.includes('gynae')) {
      return 'bg-[#00D2D3] text-white';
    }
    
    // Paeds Practice - Red/Orange
    if (formatLower.includes('paed')) {
      return 'bg-[#FF6348] text-white';
    }
    
    // A-E Practice - Red
    if (formatLower.includes('a-e') || formatLower.includes('a+e')) {
      return 'bg-[#FF686B] text-white';
    }
    
    // Default gray for unmatched formats
    return 'bg-[#778CA3] text-white';
  };

  const getEventColor = (event: Event): string => {
    // If event has format, use that for color
    if (event.format) {
      // Try to get format color from event data if available
      return getFormatColor(event.format);
    }
    return 'bg-gray-300 text-gray-900';
  };

  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'TH';
    switch (day % 10) {
      case 1: return 'ST';
      case 2: return 'ND';
      case 3: return 'RD';
      default: return 'TH';
    }
  };

  const getSelectedDateEvents = () => {
    if (!calendarSelectedDate) return [];
    
    // Get events for the selected date
    const year = calendarSelectedDate.getFullYear();
    const month = String(calendarSelectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(calendarSelectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    let filtered = events.filter(event => event.date === dateString);
    
    // Apply other filters (but not date filter)
    if (searchQuery.trim()) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.organizer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(event => event.category === categoryFilter);
    }

    if (formatFilter !== "all") {
      filtered = filtered.filter(event => event.format === formatFilter);
    }

    if (locationFilter !== "all") {
      filtered = filtered.filter(event => event.location === locationFilter);
    }

    if (organizerFilter !== "all") {
      filtered = filtered.filter(event => event.organizer === organizerFilter);
    }

    if (speakerFilter !== "all") {
      filtered = filtered.filter(event => event.speakers.includes(speakerFilter));
    }
    
    return filtered;
  };

  // Calendar helper functions
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    let startingDayOfWeek = firstDay.getDay();
    // Convert to Monday-based week (0 = Monday, 6 = Sunday)
    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getEventsForDate = (date: Date) => {
    // Format date as YYYY-MM-DD in local timezone to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    // Use full events array for calendar display, not filtered events
    return events.filter(event => event.date === dateString);
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900">All Events</h1>
              <p className="text-gray-600 text-sm md:text-lg mt-1 md:mt-2">Manage all your training events</p>
            </div>
            {isAdmin && (
              <Button onClick={handleAddEvent} className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Filter Section */}
          <Card className="mb-6">
            <CardContent className="p-4 md:p-6">
              <div className="space-y-4">
                {/* Filter Dropdowns - Responsive Layout */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                  <div className="w-full">
                    <label className="text-sm text-gray-600 mb-1 block">Category:</label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-orange-500" />
                          <SelectValue placeholder="Category" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Category</SelectItem>
                        {getUniqueValues('category').map((category, index) => (
                          <SelectItem key={index} value={String(category)}>{String(category)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full">
                    <label className="text-sm text-gray-600 mb-1 block">Location:</label>
                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                      <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-orange-500" />
                          <SelectValue placeholder="Location" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Location</SelectItem>
                        {getUniqueValues('location').map((location, index) => (
                          <SelectItem key={index} value={String(location)}>{String(location)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full">
                    <label className="text-sm text-gray-600 mb-1 block">Organizer:</label>
                    <Select value={organizerFilter} onValueChange={setOrganizerFilter}>
                      <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2">
                          <UserCircle className="h-4 w-4 text-orange-500" />
                          <SelectValue placeholder="Organizer" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Organizer</SelectItem>
                        {getUniqueValues('organizer').map((organizer, index) => (
                          <SelectItem key={index} value={String(organizer)}>{String(organizer)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full">
                    <label className="text-sm text-gray-600 mb-1 block">Speaker:</label>
                    <Select value={speakerFilter} onValueChange={setSpeakerFilter}>
                      <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2">
                          <Mic className="h-4 w-4 text-orange-500" />
                          <SelectValue placeholder="Speaker" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Speaker</SelectItem>
                        {getUniqueSpeakers().map((speaker, index) => (
                          <SelectItem key={index} value={speaker}>{speaker}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full">
                    <label className="text-sm text-gray-600 mb-1 block">Format:</label>
                    <Select value={formatFilter} onValueChange={setFormatFilter}>
                      <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-orange-500" />
                          <SelectValue placeholder="Format" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Format</SelectItem>
                        {getUniqueValues('format').map((format, index) => (
                          <SelectItem key={index} value={String(format)}>{String(format)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Search Box with Label */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 md:gap-4">
                  <div className="flex-1">
                    <label className="text-sm text-gray-600 mb-1 block">Text:</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-500" />
                      <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Button 
                      variant="outline" 
                      onClick={resetFilters}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="text-gray-500 hover:text-gray-700 text-xs md:text-sm"
                >
                  <ChevronLeft className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline">{monthNames[currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1].toUpperCase()}</span>
                </Button>
                
                <CardTitle className="text-base md:text-xl font-bold text-gray-800">
                  {monthNames[currentDate.getMonth()].toUpperCase()} {currentDate.getFullYear()}
                </CardTitle>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="text-gray-500 hover:text-gray-700 text-xs md:text-sm"
                >
                  <span className="hidden md:inline">{monthNames[currentDate.getMonth() === 11 ? 0 : currentDate.getMonth() + 1].toUpperCase()}</span>
                  <ChevronRight className="h-4 w-4 md:ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-0 mb-1">
                {daysOfWeek.map(day => (
                  <div key={day} className="p-2 text-center text-xs font-bold text-gray-600 bg-gray-100 border border-gray-200">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-0">
                {days.map((day, index) => {
                  if (!day) {
                    return <div key={index} className="p-0 aspect-square border border-gray-200 bg-gray-50"></div>;
                  }

                  const dayEvents = getEventsForDate(day);
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isSelected = calendarSelectedDate && day.toDateString() === calendarSelectedDate.toDateString();

                  return (
                    <div
                      key={index}
                      onClick={() => {
                        setCalendarSelectedDate(day);
                      }}
                      className={`p-0 aspect-square text-left transition-colors border border-gray-200 cursor-pointer overflow-hidden ${
                        isSelected
                          ? 'bg-blue-50'
                          : isToday
                          ? 'bg-yellow-50'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      {/* Date number at top */}
                      <div className={`mb-0 ${isToday ? 'p-1' : 'pt-1 px-1'}`}>
                        <div
                          className={`text-sm md:text-sm font-bold transition-all ${
                            isToday
                              ? 'bg-orange-500 text-white rounded-full w-7 h-7 md:w-8 md:h-8 flex items-center justify-center mx-auto'
                              : 'text-gray-700 text-center'
                          }`}
                        >
                          {day.getDate()}
                        </div>
                      </div>
                      
                      {/* Show dots for events on mobile/tablet, full event tiles on desktop */}
                      {dayEvents.length > 0 && (
                        <>
                          {/* Mobile/Tablet: Show dots */}
                          <div className="flex justify-center gap-1 md:hidden mt-1">
                            {dayEvents.slice(0, 3).map((_, i) => (
                              <div key={i} className="w-1 h-1 rounded-full bg-orange-500"></div>
                            ))}
                          </div>
                          
                          {/* Desktop: Show event tiles like screenshot */}
                          <div className="hidden md:block">
                            {dayEvents.map(event => (
                              <div
                                key={event.id}
                                className={`text-[11px] leading-snug px-2 py-2 cursor-pointer hover:opacity-90 transition-opacity ${getEventColor(event)}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/events/${event.id}`);
                                }}
                                title={event.title}
                              >
                                {event.title}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Date Events - Mobile/Tablet View */}
          {calendarSelectedDate && (
            <Card className="mb-6 md:hidden">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">
                    EVENTS FOR{' '}
                    <span className="inline-flex items-center justify-center bg-orange-500 text-white rounded-full px-3 py-1 mx-1">
                      {calendarSelectedDate.getDate()}
                      <span className="text-xs ml-0.5">{getOrdinalSuffix(calendarSelectedDate.getDate())}</span>
                    </span>{' '}
                    {monthNames[calendarSelectedDate.getMonth()].toUpperCase()}
                  </h3>
                </div>

                {getSelectedDateEvents().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No events scheduled for this date
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getSelectedDateEvents().map((event) => (
                      <div
                        key={event.id}
                        className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => router.push(`/events/${event.id}`)}
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <Clock className="h-4 w-4 text-orange-500 mt-1 flex-shrink-0" />
                            <div className="text-sm text-orange-500 font-medium">
                              {event.isAllDay 
                                ? "All day" 
                                : `${formatTime(event.startTime)}${event.endTime ? ` - ${formatTime(event.endTime)}` : ''}`
                              }
                            </div>
                          </div>
                          
                          <h4 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                            {event.title}
                            {event.format && (
                              <span className={`inline-block w-3 h-3 rounded-full ${getEventColor(event).split(' ')[0]}`}></span>
                            )}
                          </h4>
                          
                          {event.location && !event.hideLocation && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Events List - Desktop Only - Show events for selected date */}
          {calendarSelectedDate && (
            <Card className="hidden md:block">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Events for {monthNames[calendarSelectedDate.getMonth()]} {calendarSelectedDate.getDate()}, {calendarSelectedDate.getFullYear()} ({getSelectedDateEvents().length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getSelectedDateEvents().length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                    <p className="text-gray-500 mb-6">
                      No events scheduled for this date
                    </p>
                    {isAdmin && (
                      <Button onClick={handleAddEvent} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Event
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getSelectedDateEvents().map((event) => (
                    <div
                      key={event.id}
                      className="border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/events/${event.id}`)}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                            <Badge className={getStatusColor(event.status)}>
                              {event.status}
                            </Badge>
                          </div>
                          <div 
                            className="text-gray-600 mb-3 prose prose-sm max-w-none line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: event.description }}
                          />
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <CalendarIcon className="h-4 w-4" />
                              <span>{formatDate(event.date)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>
                                {event.isAllDay 
                                  ? "All day" 
                                  : `${formatTime(event.startTime)}${event.endTime ? ` - ${formatTime(event.endTime)}` : ''}`
                                }
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{event.location || "TBD"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Users className="h-4 w-4" />
                              <span>{event.attendees || 0} attendees</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right space-y-1">
                            <div>
                              <div className="text-sm text-gray-500">Organizer</div>
                              <div className="font-medium">{event.organizer}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Author</div>
                              <div className="font-medium text-sm">{event.author}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">{event.format}</Badge>
                            <Badge variant="outline">{event.category}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          )}
        </div>
      </div>
    </div>
  );
}
