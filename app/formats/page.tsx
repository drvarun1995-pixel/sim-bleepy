"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getEvents } from "@/lib/events-api";
import { filterEventsByProfile } from "@/lib/event-filtering";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, UserCircle, Mic, Sparkles, ChevronDown, Check, Filter } from "lucide-react";

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

  // Apply format filter (both mobile and desktop use multi-select)
  const filteredEvents = profileFilteredEvents.filter(event => {
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

  // Sort events by date
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    if (a.startTime && b.startTime) {
      return a.startTime.localeCompare(b.startTime);
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
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
              <h2 className="text-base font-semibold text-gray-900">Filter by Format</h2>
            </div>
            
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
                  <span className="text-xs text-gray-500">({profileFilteredEvents.length})</span>
                </button>

                {/* Format Options */}
                {getUniqueFormats().map(([format, color]) => {
                  const count = profileFilteredEvents.filter(e => e.format === format).length;
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
                <h2 className="text-lg font-semibold text-gray-900">Filter by Format</h2>
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
                Show All ({profileFilteredEvents.length})
              </Button>
              {getUniqueFormats().map(([format, color]) => {
                const count = profileFilteredEvents.filter(e => e.format === format).length;
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
        <div className="space-y-4">
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
          ) : (
            sortedEvents.map((event) => (
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
            ))
          )}
        </div>

        {/* Results Summary */}
        {sortedEvents.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {sortedEvents.length} event{sortedEvents.length !== 1 ? 's' : ''}
            {selectedFormats.size > 0 && ` for ${selectedFormats.size} selected format${selectedFormats.size > 1 ? 's' : ''}`}
          </div>
        )}
      </div>
    </div>
  );
}

