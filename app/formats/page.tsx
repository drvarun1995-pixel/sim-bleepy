"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getEvents } from "@/lib/events-api";
import { filterEventsByProfile } from "@/lib/event-filtering";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, UserCircle, Mic, Sparkles, ChevronDown, Check, Filter, LayoutGrid, List, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, RotateCcw } from "lucide-react";

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
  hideLocation?: boolean;
  organizer: string;
  hideOrganizer?: boolean;
  category: string;
  categories: Array<{ id: string; name: string; color?: string }>;
  format: string;
  formatColor?: string;
  speakers: string;
  hideSpeakers?: boolean;
  attendees: number;
  status: 'draft' | 'published' | 'cancelled';
  eventLink?: string;
  moreInfoLink?: string;
  moreInfoTarget?: 'current' | 'new';
  eventStatus?: 'scheduled' | 'rescheduled' | 'postponed' | 'cancelled' | 'moved-online';
  author?: string;
  organizers?: Array<{ id: string; name: string }>;
}

export default function FormatsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showPersonalizedOnly, setShowPersonalizedOnly] = useState(true);
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set());
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<'extended' | 'compact'>('compact');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortBy, setSortBy] = useState<string>('date-asc');
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'expired'>('upcoming');
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  useEffect(() => {
    if (session?.user?.email) {
      fetchUserProfile();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();
      if (response.ok && data.user) {
        setUserProfile(data.user);
        if (data.user.profile_completed && data.user.show_all_events !== undefined) {
          setShowPersonalizedOnly(!data.user.show_all_events);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const supabaseEvents = await getEvents();
        
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
          location: event.location_name || event.location_id || '',
          hideLocation: event.hide_location || false,
          organizer: event.organizer_name || '',
          hideOrganizer: event.hide_organizer || false,
          category: event.category_name || '',
          categories: event.categories || [],
          format: event.format_name || '',
          formatColor: event.format_color || '',
          speakers: event.speakers ? event.speakers.map((s: any) => s.name).join(', ') : '',
          hideSpeakers: event.hide_speakers || false,
          attendees: event.attendees || 0,
          status: event.status || 'published',
          eventLink: event.event_link,
          moreInfoLink: event.more_info_link,
          moreInfoTarget: event.more_info_target,
          eventStatus: event.event_status,
          author: event.author_name || 'Unknown',
          organizers: event.organizers || []
        }));

        setEvents(transformedEvents);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: 'short',
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

  const isLightColor = (hex: string): boolean => {
    if (!hex || !hex.startsWith('#')) return false;
    const color = hex.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
  };

  // Get unique formats with their colors
  const getUniqueFormats = () => {
    const formatsMap = new Map<string, string>();
    events.forEach(event => {
      if (event.format && !formatsMap.has(event.format)) {
        formatsMap.set(event.format, event.formatColor || '#778CA3');
      }
    });
    return Array.from(formatsMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  };

  // Apply personalization filter
  const profileFilteredEvents = (showPersonalizedOnly && userProfile?.profile_completed) 
    ? filterEventsByProfile(events, userProfile) as Event[]
    : events;

  // Helper function to check if event is expired based on date and time (London timezone)
  const isEventExpired = (event: Event) => {
    const now = new Date(); // Current time in browser timezone (London)
    
    // Parse the event date (YYYY-MM-DD format)
    const [year, month, day] = event.date.split('-').map(Number);
    const eventDate = new Date(year, month - 1, day); // Create date in local timezone
    
    // If event has end time, use it; otherwise use start time
    const eventTime = event.endTime || event.startTime;
    
    if (eventTime && eventTime.trim() && !event.hideTime && !event.isAllDay) {
      // Combine date and time - handle both HH:MM and HH:MM:SS formats
      const timeParts = eventTime.split(':');
      const hours = parseInt(timeParts[0]);
      const minutes = parseInt(timeParts[1]);
      eventDate.setHours(hours, minutes, 0, 0);
      
      // Event is expired if the end/start time has passed
      return eventDate < now;
    } else {
      // For all-day events or events without time, consider expired at end of day
      eventDate.setHours(23, 59, 59, 999);
      return eventDate < now;
    }
  };

  // Apply time filter (upcoming/expired/all)
  const timeFilteredEvents = profileFilteredEvents.filter(event => {
    if (timeFilter === 'all') return true;
    if (timeFilter === 'upcoming') {
      return !isEventExpired(event);
    }
    if (timeFilter === 'expired') {
      return isEventExpired(event);
    }
    return true;
  });

  // Apply format filter (both mobile and desktop use multi-select)
  const filteredEvents = timeFilteredEvents.filter(event => {
    // Multiple format selection
    if (selectedFormats.size > 0) {
      return selectedFormats.has(event.format);
    }
    // Show all if no filter selected
    return true;
  });

  // Handler for checkbox toggle
  const toggleFormatSelection = (format: string) => {
    const newSelection = new Set(selectedFormats);
    if (newSelection.has(format)) {
      newSelection.delete(format);
    } else {
      newSelection.add(format);
    }
    setSelectedFormats(newSelection);
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedFormats(new Set());
  };

  // Get count of selected formats
  const getFilterCount = () => {
    return selectedFormats.size;
  };

  // Sort events based on selected sort option
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':
        const dateAsc = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateAsc !== 0) return dateAsc;
        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime);
        }
        return 0;
      
      case 'date-desc':
        const dateDesc = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDesc !== 0) return dateDesc;
        if (b.startTime && a.startTime) {
          return b.startTime.localeCompare(a.startTime);
        }
        return 0;
      
      case 'title-asc':
        return a.title.localeCompare(b.title);
      
      case 'title-desc':
        return b.title.localeCompare(a.title);
      
      case 'format-asc':
        return (a.format || '').localeCompare(b.format || '');
      
      case 'format-desc':
        return (b.format || '').localeCompare(a.format || '');
      
      case 'location-asc':
        return (a.location || '').localeCompare(b.location || '');
      
      case 'location-desc':
        return (b.location || '').localeCompare(a.location || '');
      
      case 'organizer-asc':
        return (a.organizer || '').localeCompare(b.organizer || '');
      
      case 'organizer-desc':
        return (b.organizer || '').localeCompare(a.organizer || '');
      
      case 'speaker-asc':
        return (a.speakers || '').localeCompare(b.speakers || '');
      
      case 'speaker-desc':
        return (b.speakers || '').localeCompare(a.speakers || '');
      
      default:
        return 0;
    }
  });

  // Pagination logic
  const totalEvents = sortedEvents.length;
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(totalEvents / itemsPerPage);
  const startIndex = itemsPerPage === -1 ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === -1 ? totalEvents : startIndex + itemsPerPage;
  const paginatedEvents = sortedEvents.slice(startIndex, endIndex);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem('formatsViewMode');
    const savedItemsPerPage = localStorage.getItem('formatsItemsPerPage');
    const savedSortBy = localStorage.getItem('formatsSortBy');
    const savedTimeFilter = localStorage.getItem('formatsTimeFilter');
    
    if (savedViewMode === 'extended' || savedViewMode === 'compact') {
      setViewMode(savedViewMode);
    }
    
    if (savedItemsPerPage) {
      const items = savedItemsPerPage === 'all' ? -1 : parseInt(savedItemsPerPage);
      if (!isNaN(items)) {
        setItemsPerPage(items);
      }
    }
    
    if (savedSortBy) {
      setSortBy(savedSortBy);
    }
    
    if (savedTimeFilter === 'all' || savedTimeFilter === 'upcoming' || savedTimeFilter === 'expired') {
      setTimeFilter(savedTimeFilter);
    }
  }, []);

  // Check screen size for mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFormats, showPersonalizedOnly, timeFilter]);

  const handleItemsPerPageChange = (value: string) => {
    const items = value === 'all' ? -1 : parseInt(value);
    setItemsPerPage(items);
    setCurrentPage(1);
    // Save to localStorage
    localStorage.setItem('formatsItemsPerPage', value);
  };

  const handleViewModeChange = (mode: 'extended' | 'compact') => {
    setViewMode(mode);
    // Save to localStorage
    localStorage.setItem('formatsViewMode', mode);
  };

  const handleSort = (column: string) => {
    // Toggle between asc and desc, or set to asc if different column
    const currentColumn = sortBy.split('-')[0];
    const currentDirection = sortBy.split('-')[1];
    
    if (currentColumn === column) {
      // Same column - toggle direction
      const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
      const newSortBy = `${column}-${newDirection}`;
      setSortBy(newSortBy);
      localStorage.setItem('formatsSortBy', newSortBy);
    } else {
      // Different column - set to ascending
      const newSortBy = `${column}-asc`;
      setSortBy(newSortBy);
      localStorage.setItem('formatsSortBy', newSortBy);
    }
  };

  const getSortIcon = (column: string) => {
    const currentColumn = sortBy.split('-')[0];
    const currentDirection = sortBy.split('-')[1];
    
    if (currentColumn !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
    }
    
    return currentDirection === 'asc' 
      ? <span className="text-xs">↑</span>
      : <span className="text-xs">↓</span>;
  };

  const handleTimeFilterChange = (filter: 'all' | 'upcoming' | 'expired') => {
    setTimeFilter(filter);
    localStorage.setItem('formatsTimeFilter', filter);
  };

  const resetAllFilters = () => {
    // Clear all filters
    setSelectedFormats(new Set());
    setTimeFilter('upcoming');
    setSortBy('date-asc');
    setCurrentPage(1);
    
    // Clear from localStorage
    localStorage.removeItem('formatsTimeFilter');
    localStorage.removeItem('formatsSortBy');
    // Note: We keep view mode and items per page as those are view preferences, not filters
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Events by Format</h1>
              <p className="text-gray-600 text-lg">
                {showPersonalizedOnly && userProfile?.profile_completed
                  ? `Showing events personalized for ${userProfile.role_type === 'medical_student' && userProfile.university && userProfile.study_year
                      ? `${userProfile.university} Year ${userProfile.study_year}`
                      : userProfile.role_type === 'foundation_doctor' && userProfile.foundation_year
                      ? userProfile.foundation_year
                      : 'you'}`
                  : 'Browse all training events by format'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => handleViewModeChange('extended')}
                  className={`px-3 py-2 flex items-center gap-2 text-sm font-medium transition-all ${
                    viewMode === 'extended'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Extended</span>
                </button>
                <button
                  onClick={() => handleViewModeChange('compact')}
                  className={`px-3 py-2 flex items-center gap-2 text-sm font-medium transition-all border-l ${
                    viewMode === 'compact'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
                  }`}
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Compact</span>
                </button>
              </div>

              {/* Items Per Page Selector */}
              <Select 
                value={itemsPerPage === -1 ? 'all' : itemsPerPage.toString()} 
                onValueChange={handleItemsPerPageChange}
              >
                <SelectTrigger className="w-full sm:w-[130px]">
                  <SelectValue placeholder="Show" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Show 10</SelectItem>
                  <SelectItem value="20">Show 20</SelectItem>
                  <SelectItem value="50">Show 50</SelectItem>
                  <SelectItem value="100">Show 100</SelectItem>
                  <SelectItem value="all">Show All</SelectItem>
                </SelectContent>
              </Select>

              {/* Personalization Toggle */}
              {userProfile?.profile_completed && (
                <Button
                  onClick={() => setShowPersonalizedOnly(!showPersonalizedOnly)}
                  variant={showPersonalizedOnly ? "default" : "outline"}
                  className={`w-full sm:w-auto ${showPersonalizedOnly ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showPersonalizedOnly ? 'My Events' : 'All Events'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Personalization Info Banner */}
        {showPersonalizedOnly && userProfile?.profile_completed && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900">Personalized View Active</h3>
                <p className="text-xs text-blue-700 mt-1">
                  You're viewing events filtered for your profile. Update your preferences in Profile Settings.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Format Filter - Mobile Dropdown */}
        <Card className="mb-6 md:hidden relative">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h2 className="text-base font-semibold text-gray-900">Filters</h2>
            </div>
            
            {/* Time Filter Buttons - Mobile */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => handleTimeFilterChange('upcoming')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeFilter === 'upcoming'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-green-400'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => handleTimeFilterChange('expired')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeFilter === 'expired'
                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-md'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                Expired
              </button>
              <button
                onClick={() => handleTimeFilterChange('all')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeFilter === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-400'
                }`}
              >
                All
              </button>
              <button
                onClick={resetAllFilters}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all bg-white border-2 border-orange-400 text-orange-600 hover:bg-orange-50 hover:border-orange-500 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset All
              </button>
            </div>
            
            <div className="text-xs text-gray-600 mb-3 font-medium">Format:</div>
            
            {/* Dropdown Button */}
            <button
              onClick={() => setShowMobileDropdown(!showMobileDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-purple-400 transition-all"
            >
              <span className="text-sm font-medium text-gray-700">
                {getFilterCount() === 0 
                  ? 'Select Formats' 
                  : `${getFilterCount()} Format${getFilterCount() > 1 ? 's' : ''} Selected`}
              </span>
              <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${showMobileDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Backdrop Overlay */}
            {showMobileDropdown && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMobileDropdown(false)}
              />
            )}

            {/* Dropdown Menu */}
            {showMobileDropdown && (
              <div className="mt-3 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto relative z-50">
                {/* Show All Option */}
                <button
                  onClick={() => {
                    clearAllSelections();
                    setShowMobileDropdown(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                      getFilterCount() === 0 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 border-purple-600' 
                        : 'border-gray-300'
                    }`}>
                      {getFilterCount() === 0 && <Check className="h-4 w-4 text-white" />}
                    </div>
                    <span className="text-sm font-medium text-gray-900">Show All</span>
                  </div>
                  <span className="text-xs text-gray-500">({timeFilteredEvents.length})</span>
                </button>

                {/* Format Options */}
                {getUniqueFormats().map(([format, color]) => {
                  const count = timeFilteredEvents.filter(e => e.format === format).length;
                  const isSelected = selectedFormats.has(format);
                  return (
                    <button
                      key={format}
                      onClick={() => toggleFormatSelection(format)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                          isSelected 
                            ? 'border-purple-600' 
                            : 'border-gray-300'
                        }`}
                        style={{
                          backgroundColor: isSelected ? color : 'transparent'
                        }}
                        >
                          {isSelected && (
                            <Check className={`h-4 w-4 ${isLightColor(color) ? 'text-gray-900' : 'text-white'}`} />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm font-medium text-gray-900">{format}</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">({count})</span>
                    </button>
                  );
                })}

                {/* Apply Button */}
                {getFilterCount() > 0 && (
                  <div className="p-3 border-t border-gray-200 bg-gray-50">
                    <Button
                      onClick={() => setShowMobileDropdown(false)}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      Apply Filters
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Active Filters Display */}
            {getFilterCount() > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {Array.from(selectedFormats).map(format => {
                  const color = getUniqueFormats().find(([f]) => f === format)?.[1] || '#778CA3';
                  return (
                    <span
                      key={format}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: color,
                        color: isLightColor(color) ? '#111827' : '#FFFFFF'
                      }}
                    >
                      {format}
                      <button
                        onClick={() => toggleFormatSelection(format)}
                        className="ml-1 hover:bg-black/10 rounded-full w-4 h-4 flex items-center justify-center text-base font-bold transition-all"
                        title="Remove this filter"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
                <button
                  onClick={clearAllSelections}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-full transition-all"
                >
                  ✕ Clear All
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Format Filter Buttons - Desktop Only */}
        <Card className="mb-6 hidden md:block">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              </div>
              {getFilterCount() > 0 && (
                <Button
                  onClick={clearAllSelections}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-500 hover:text-red-700 font-semibold shadow-sm"
                >
                  ✕ Clear All ({getFilterCount()})
                </Button>
              )}
            </div>

            {/* Time Filter Buttons - Desktop */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <label className="text-sm text-gray-700 font-medium mb-2 block">Time Period:</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleTimeFilterChange('upcoming')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeFilter === 'upcoming'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-green-400'
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => handleTimeFilterChange('expired')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeFilter === 'expired'
                      ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-md'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Expired
                </button>
                <button
                  onClick={() => handleTimeFilterChange('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeFilter === 'all'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  All Events
                </button>
                <button
                  onClick={resetAllFilters}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all bg-white border-2 border-orange-400 text-orange-600 hover:bg-orange-50 hover:border-orange-500 flex items-center gap-2 shadow-sm"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset All
                </button>
              </div>
            </div>

            <label className="text-sm text-gray-700 font-medium mb-2 block">Format:</label>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={clearAllSelections}
                variant={getFilterCount() === 0 ? "default" : "outline"}
                className={`transition-all ${
                  getFilterCount() === 0
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md'
                    : 'hover:bg-gray-100'
                }`}
              >
                Show All ({timeFilteredEvents.length})
              </Button>
              {getUniqueFormats().map(([format, color]) => {
                const count = timeFilteredEvents.filter(e => e.format === format).length;
                const isSelected = selectedFormats.has(format);
                return (
                  <Button
                    key={format}
                    onClick={() => toggleFormatSelection(format)}
                    variant="outline"
                    className="transition-all hover:shadow-md relative"
                    style={{
                      backgroundColor: isSelected ? color : 'transparent',
                      color: isSelected ? (isLightColor(color) ? '#111827' : '#FFFFFF') : '#374151',
                      borderColor: color,
                      borderWidth: '2px',
                      fontWeight: isSelected ? '600' : '500'
                    }}
                  >
                    {isSelected && (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    {format} ({count})
                  </Button>
                );
              })}
            </div>

            {/* Active Filters Display - Desktop */}
            {getFilterCount() > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600 font-medium">Active Filters:</span>
                  {Array.from(selectedFormats).map(format => {
                    const color = getUniqueFormats().find(([f]) => f === format)?.[1] || '#778CA3';
                    return (
                      <span
                        key={format}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium shadow-sm"
                        style={{
                          backgroundColor: color,
                          color: isLightColor(color) ? '#111827' : '#FFFFFF'
                        }}
                      >
                        {format}
                        <button
                          onClick={() => toggleFormatSelection(format)}
                          className="ml-1 hover:bg-black/10 rounded-full w-5 h-5 flex items-center justify-center text-lg font-bold transition-all"
                          title="Remove this filter"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Events List */}
        {sortedEvents.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Found</h3>
                <p className="text-gray-600">
                  {selectedFormats.size === 0 
                    ? "No events available at this time."
                    : selectedFormats.size === 1
                    ? `No events found for ${Array.from(selectedFormats)[0]} format.`
                    : `No events found for the selected formats.`}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'extended' ? (
          <div className="space-y-4">
            {/* Sort Controls for Extended View */}
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-700">Sort by:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleSort('date')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        sortBy.startsWith('date') 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm' 
                          : 'bg-white border border-gray-300 text-gray-700 hover:border-purple-400'
                      }`}
                    >
                      Date {sortBy.startsWith('date') && getSortIcon('date')}
                    </button>
                    <button
                      onClick={() => handleSort('title')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        sortBy.startsWith('title') 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm' 
                          : 'bg-white border border-gray-300 text-gray-700 hover:border-purple-400'
                      }`}
                    >
                      Title {sortBy.startsWith('title') && getSortIcon('title')}
                    </button>
                    <button
                      onClick={() => handleSort('format')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        sortBy.startsWith('format') 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm' 
                          : 'bg-white border border-gray-300 text-gray-700 hover:border-purple-400'
                      }`}
                    >
                      Format {sortBy.startsWith('format') && getSortIcon('format')}
                    </button>
                    <button
                      onClick={() => handleSort('location')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        sortBy.startsWith('location') 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm' 
                          : 'bg-white border border-gray-300 text-gray-700 hover:border-purple-400'
                      }`}
                    >
                      Location {sortBy.startsWith('location') && getSortIcon('location')}
                    </button>
                    <button
                      onClick={() => handleSort('organizer')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        sortBy.startsWith('organizer') 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm' 
                          : 'bg-white border border-gray-300 text-gray-700 hover:border-purple-400'
                      }`}
                    >
                      Organizer {sortBy.startsWith('organizer') && getSortIcon('organizer')}
                    </button>
                    <button
                      onClick={() => handleSort('speaker')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        sortBy.startsWith('speaker') 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm' 
                          : 'bg-white border border-gray-300 text-gray-700 hover:border-purple-400'
                      }`}
                    >
                      Speaker {sortBy.startsWith('speaker') && getSortIcon('speaker')}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {paginatedEvents.map((event) => (
              <Card 
                key={event.id} 
                className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4"
                style={{ borderLeftColor: event.formatColor || '#778CA3' }}
                onClick={() => router.push(`/events/${event.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Event Info */}
                    <div className="flex-1 space-y-3">
                      {/* Title and Format Badge */}
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                          {event.format && (
                            <span 
                              className="inline-block px-3 py-1 rounded-full text-sm font-semibold"
                              style={{
                                backgroundColor: event.formatColor || '#D1D5DB',
                                color: event.formatColor && isLightColor(event.formatColor) ? '#111827' : '#FFFFFF'
                              }}
                            >
                              {event.format}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Event Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                        {/* Date & Time */}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <span className="font-medium">{formatDate(event.date)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span>
                            {event.isAllDay 
                              ? "All day" 
                              : event.hideTime
                              ? (event.timeNotes || "Time TBD")
                              : `${formatTime(event.startTime)}${event.endTime && !event.hideEndTime ? ` - ${formatTime(event.endTime)}` : ''}`
                            }
                          </span>
                        </div>

                        {/* Location */}
                        {!event.hideLocation && event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-red-600 flex-shrink-0" />
                            <span>{event.location}</span>
                          </div>
                        )}

                        {/* Organizer */}
                        {!event.hideOrganizer && event.organizer && (
                          <div className="flex items-center gap-2">
                            <UserCircle className="h-4 w-4 text-purple-600 flex-shrink-0" />
                            <span>{event.organizer}</span>
                          </div>
                        )}

                        {/* Speakers */}
                        {!event.hideSpeakers && event.speakers && (
                          <div className="flex items-center gap-2 md:col-span-2">
                            <Mic className="h-4 w-4 text-orange-600 flex-shrink-0" />
                            <span className="line-clamp-1">{event.speakers}</span>
                          </div>
                        )}
                      </div>

                      {/* Categories */}
                      {event.categories && event.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {event.categories.map((cat) => (
                            <span 
                              key={cat.id}
                              className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: cat.color || '#F3F4F6',
                                color: cat.color && isLightColor(cat.color) ? '#111827' : '#FFFFFF'
                              }}
                            >
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* View Details Button */}
                    <div className="flex items-center">
                      <Button 
                        variant="outline"
                        className="hover:bg-purple-50 hover:border-purple-600 hover:text-purple-600 transition-all"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Compact Table View */
          <Card>
            <CardContent className="p-0">
              <div>
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[70%] sm:w-[30%]" />
                    <col className="hidden md:table-column md:w-[20%]" />
                    <col className="hidden lg:table-column lg:w-[15%]" />
                    <col className="hidden xl:table-column xl:w-[12%]" />
                    <col className="hidden xl:table-column xl:w-[13%]" />
                    <col className="w-[30%] sm:w-[10%]" />
                  </colgroup>
                  <thead className="bg-gray-50 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-2 py-2 sm:px-4 sm:py-3 text-left">
                        <button
                          onClick={() => handleSort('title')}
                          className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-purple-600 transition-colors group"
                        >
                          Event
                          <span className="group-hover:scale-110 transition-transform">
                            {getSortIcon('title')}
                          </span>
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left hidden md:table-cell">
                        <button
                          onClick={() => handleSort('date')}
                          className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-purple-600 transition-colors group"
                        >
                          Date & Time
                          <span className="group-hover:scale-110 transition-transform">
                            {getSortIcon('date')}
                          </span>
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left hidden lg:table-cell">
                        <button
                          onClick={() => handleSort('location')}
                          className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-purple-600 transition-colors group"
                        >
                          Location
                          <span className="group-hover:scale-110 transition-transform">
                            {getSortIcon('location')}
                          </span>
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left hidden xl:table-cell">
                        <button
                          onClick={() => handleSort('organizer')}
                          className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-purple-600 transition-colors group"
                        >
                          Organizer
                          <span className="group-hover:scale-110 transition-transform">
                            {getSortIcon('organizer')}
                          </span>
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left hidden xl:table-cell">
                        <button
                          onClick={() => handleSort('speaker')}
                          className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-purple-600 transition-colors group"
                        >
                          Speaker
                          <span className="group-hover:scale-110 transition-transform">
                            {getSortIcon('speaker')}
                          </span>
                        </button>
                      </th>
                      <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedEvents.map((event) => (
                      <tr 
                        key={event.id} 
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/events/${event.id}`)}
                      >
                        <td className="px-2 py-3 sm:px-4 sm:py-4">
                          <div className="flex items-start gap-1.5 sm:gap-2">
                            <div 
                              className="w-0.5 sm:w-1 h-10 sm:h-12 rounded-full flex-shrink-0"
                              style={{ backgroundColor: event.formatColor || '#778CA3' }}
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-xs sm:text-sm leading-tight">
                                {event.title}
                              </h3>
                              {event.format && (
                                <span 
                                  className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium"
                                  style={{
                                    backgroundColor: event.formatColor || '#D1D5DB',
                                    color: event.formatColor && isLightColor(event.formatColor) ? '#111827' : '#FFFFFF'
                                  }}
                                >
                                  {event.format}
                                </span>
                              )}
                              {/* Mobile: Show date/time below title */}
                              <div className="md:hidden mt-1.5 flex flex-col gap-0.5 text-[10px] text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-2.5 w-2.5 flex-shrink-0" />
                                  <span className="truncate">{formatDate(event.date)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                                  <span className="truncate">
                                    {event.isAllDay 
                                      ? "All day" 
                                      : event.hideTime
                                      ? (event.timeNotes || "TBD")
                                      : `${formatTime(event.startTime)}${event.endTime && !event.hideEndTime ? ` - ${formatTime(event.endTime)}` : ''}`
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <div className="flex flex-col gap-1 text-sm text-gray-900">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-blue-600" />
                              <span className="font-medium">{formatDate(event.date)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Clock className="h-3.5 w-3.5 text-green-600" />
                              <span className="text-xs">
                                {event.isAllDay 
                                  ? "All day" 
                                  : event.hideTime
                                  ? (event.timeNotes || "Time TBD")
                                  : `${formatTime(event.startTime)}${event.endTime && !event.hideEndTime ? ` - ${formatTime(event.endTime)}` : ''}`
                                }
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          {!event.hideLocation && event.location ? (
                            <div className="flex items-center gap-1.5 text-sm text-gray-900">
                              <MapPin className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
                              <span className="truncate" title={event.location}>{event.location}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 hidden xl:table-cell">
                          {!event.hideOrganizer && event.organizer ? (
                            <div className="flex items-center gap-1.5 text-sm text-gray-900">
                              <UserCircle className="h-3.5 w-3.5 text-purple-600 flex-shrink-0" />
                              <span className="truncate" title={event.organizer}>{event.organizer}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 hidden xl:table-cell">
                          {!event.hideSpeakers && event.speakers ? (
                            <div className="flex items-center gap-1.5 text-sm text-gray-900">
                              <Mic className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
                              <span className="truncate" title={event.speakers}>{event.speakers}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-2 py-3 sm:px-4 sm:py-4 text-center">
                          <Button 
                            variant="outline"
                            size="sm"
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-sm hover:shadow-md transition-all font-semibold text-[10px] sm:text-sm px-2 py-1 sm:px-3 sm:py-2 h-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/events/${event.id}`);
                            }}
                          >
                            <span className="hidden sm:inline">View Details</span>
                            <span className="sm:hidden">View</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination Controls */}
        {totalEvents > 0 && itemsPerPage !== -1 && totalPages > 1 && (
          <Card className="mt-6">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col items-center gap-2 sm:gap-4">
                {/* Results Info */}
                <div className="text-xs sm:text-sm text-gray-600 text-center">
                  Showing {startIndex + 1}-{Math.min(endIndex, totalEvents)} of {totalEvents} event{totalEvents !== 1 ? 's' : ''}
                </div>

                {/* Pagination Buttons */}
                <div className="flex items-center justify-center w-full">
                  {/* Mobile: Compact layout */}
                  <div className="flex sm:hidden items-center justify-center" style={{ gap: '0px', maxWidth: '100%' }}>
                    <button
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                      className="disabled:opacity-30 disabled:cursor-not-allowed w-[30px] h-[30px] flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-all flex-shrink-0"
                      title="First"
                    >
                      <ChevronsLeft className="h-3 w-3" />
                    </button>

                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="disabled:opacity-30 disabled:cursor-not-allowed w-[30px] h-[30px] flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-all flex-shrink-0 ml-1"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </button>

                    <div className="flex items-center mx-1">
                      <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-300">
                        {currentPage} / {totalPages}
                      </span>
                    </div>

                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="disabled:opacity-30 disabled:cursor-not-allowed w-[30px] h-[30px] flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-all flex-shrink-0 mr-1"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </button>

                    <button
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="disabled:opacity-30 disabled:cursor-not-allowed w-[30px] h-[30px] flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-all flex-shrink-0"
                      title="Last"
                    >
                      <ChevronsRight className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Desktop: Full layout */}
                  <div className="hidden sm:flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                      className="disabled:opacity-50 disabled:cursor-not-allowed"
                      title="First page"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                      <span className="hidden lg:inline ml-1">First</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden lg:inline ml-1">Prev</span>
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            className={`w-9 h-9 p-0 flex-shrink-0 ${
                              currentPage === pageNum 
                                ? 'text-white border-0' 
                                : ''
                            }`}
                            style={{
                              backgroundColor: currentPage === pageNum ? '#ff6b6b' : 'transparent'
                            }}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="hidden lg:inline mr-1">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Last page"
                    >
                      <span className="hidden lg:inline mr-1">Last</span>
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                

                {/* Page Input - Desktop Only */}
                <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600 w-full justify-center">
                  <span>Go to page:</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= totalPages) {
                        goToPage(page);
                      }
                    }}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span>of {totalPages}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Summary */}
        {totalEvents > 0 && itemsPerPage === -1 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing all {totalEvents} event{totalEvents !== 1 ? 's' : ''}
            {selectedFormats.size > 0 && ` for ${selectedFormats.size} selected format${selectedFormats.size > 1 ? 's' : ''}`}
          </div>
        )}
    </div>
  );
}

