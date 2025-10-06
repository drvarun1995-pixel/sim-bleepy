"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getEvents } from "@/lib/events-api";
import { useAdmin } from "@/lib/useAdmin";
import { filterEventsByProfile } from "@/lib/event-filtering";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Plus, Search, Clock, MapPin, Users, Folder, UserCircle, Mic, Sparkles, RotateCcw, Filter } from "lucide-react";
import Calendar from "@/components/Calendar";

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
  locations?: Array<{ id: string; name: string; address?: string }>; // All locations from junction table
  hideLocation?: boolean;
  organizer: string;
  hideOrganizer?: boolean;
  category: string;
  categories: Array<{ id: string; name: string; color?: string }>; // Multiple categories
  format: string;
  formatColor?: string; // Format color from database
  speakers: string;
  hideSpeakers?: boolean;
  attendees: number;
  status: 'draft' | 'published' | 'cancelled';
  eventLink?: string;
  moreInfoLink?: string;
  moreInfoTarget?: 'current' | 'new';
  eventStatus?: 'scheduled' | 'rescheduled' | 'postponed' | 'cancelled' | 'moved-online';
  author?: string;
  organizers?: Array<{ id: string; name: string }>; // Raw organizers array from junction table
}

export default function EventsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { isAdmin } = useAdmin();
  const [events, setEvents] = useState<Event[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showPersonalizedOnly, setShowPersonalizedOnly] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [organizerFilter, setOrganizerFilter] = useState("all");
  const [speakerFilter, setSpeakerFilter] = useState("all");
  

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
        // If user has completed profile and hasn't explicitly set show_all_events, default to personalized
        if (data.user.profile_completed && data.user.show_all_events !== undefined) {
          setShowPersonalizedOnly(!data.user.show_all_events);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

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
          location: event.location_name || event.location_id || '',
          otherLocations: '',
          locations: event.locations || [], // Include all locations from junction table
          hideLocation: event.hide_location || false,
          organizer: event.organizer_name || '',
          hideOrganizer: event.hide_organizer || false,
          category: event.category_name || '',
          categories: event.categories || [], // Multiple categories from junction table
          format: event.format_name || '',
          formatColor: event.format_color || '', // Format color from database
          speakers: event.speakers ? event.speakers.map((s: any) => s.name).join(', ') : '',
          hideSpeakers: event.hide_speakers || false,
          attendees: event.attendees || 0,
          status: event.status || 'published',
          eventLink: event.event_link,
          moreInfoLink: event.more_info_link,
          moreInfoTarget: event.more_info_target,
          eventStatus: event.event_status,
          author: event.author_name || 'Unknown',
          // Preserve raw organizers array for filtering
          organizers: event.organizers || []
        }));

        
        setEvents(transformedEvents);
        console.log('Events loaded in events page:', transformedEvents.length, transformedEvents);
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
    return Array.from(new Set(allSpeakers)).sort();
  };

  const getUniqueLocations = () => {
    // Get locations from the main location field
    const mainLocations = events.map(event => event.location).filter(Boolean);
    
    // Also get locations from the locations array (junction table)
    const junctionLocations = events.flatMap(event => 
      event.locations ? event.locations.map(loc => loc.name) : []
    ).filter(Boolean);
    
    // Combine both sources and remove duplicates
    const allLocations = [...mainLocations, ...junctionLocations];
    return Array.from(new Set(allLocations)).sort();
  };

  const getUniqueOrganizers = () => {
    // Get organizers from the main organizer field
    const mainOrganizers = events.map(event => event.organizer).filter(Boolean);
    
    // Also get organizers from the organizers array
    const junctionOrganizers = events.flatMap(event => 
      event.organizers ? event.organizers.map(org => org.name) : []
    ).filter(Boolean);
    
    // Combine both sources and remove duplicates
    const allOrganizers = [...mainOrganizers, ...junctionOrganizers];
    return Array.from(new Set(allOrganizers)).sort();
  };

  const getUniqueCategories = () => {
    // Get categories from the main category field
    const mainCategories = events.map(event => event.category).filter(Boolean);
    
    // Also get categories from the categories array
    const junctionCategories = events.flatMap(event => 
      event.categories ? event.categories.map(cat => cat.name) : []
    ).filter(Boolean);
    
    // Combine both sources and remove duplicates
    const allCategories = [...mainCategories, ...junctionCategories];
    return Array.from(new Set(allCategories)).sort();
  };

  // Get hierarchical categories for dropdown with color coding
  const getHierarchicalCategoriesForDropdown = () => {
    // Get all unique categories with their colors
    const categoriesMap = new Map<string, string>(); // name -> color
    
    events.forEach(event => {
      if (event.category) {
        categoriesMap.set(event.category, '#FCD34D');
      }
      if (event.categories && event.categories.length > 0) {
        event.categories.forEach(cat => {
          categoriesMap.set(cat.name, cat.color || '#FCD34D');
        });
      }
    });

    // Define parent categories
    const parentCategories = ['ARU', 'UCL', 'Foundation Year Doctors'];
    
    const hierarchy: Array<{ name: string; isParent: boolean; color: string }> = [];
    
    // Build hierarchy
    parentCategories.forEach(parent => {
      const children = Array.from(categoriesMap.keys()).filter(cat => 
        cat !== parent && cat.includes(parent)
      );
      
      // Only add parent if it exists or has children
      if (categoriesMap.has(parent) || children.length > 0) {
        hierarchy.push({ 
          name: parent, 
          isParent: true, 
          color: categoriesMap.get(parent) || '#FCD34D' 
        });
        
        // Add sorted children
        children.sort().forEach(child => {
          hierarchy.push({ 
            name: child, 
            isParent: false, 
            color: categoriesMap.get(child) || '#FCD34D' 
          });
        });
      }
    });
    
    // Add any remaining categories that don't fit the hierarchy
    Array.from(categoriesMap.keys())
      .filter(cat => !hierarchy.some(h => h.name === cat))
      .forEach(cat => {
        hierarchy.push({ 
          name: cat, 
          isParent: false, 
          color: categoriesMap.get(cat) || '#FCD34D' 
        });
      });
    
    return hierarchy;
  };

  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setFormatFilter("all");
    setLocationFilter("all");
    setOrganizerFilter("all");
    setSpeakerFilter("all");
  };

  const isAnyFilterActive = () => {
    return searchQuery.trim() !== "" ||
           categoryFilter !== "all" ||
           formatFilter !== "all" ||
           locationFilter !== "all" ||
           organizerFilter !== "all" ||
           speakerFilter !== "all";
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

  // Step 1: Apply profile-based filtering (if user has completed profile and wants personalized view)
  const profileFilteredEvents = (showPersonalizedOnly && userProfile?.profile_completed) 
    ? filterEventsByProfile(events, userProfile) as Event[]
    : events;

  // Step 2: Apply manual filters on top of profile filtering
  const filteredEvents = profileFilteredEvents.filter(event => {
    // Text search filter
    if (searchQuery.trim() !== "") {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        event.title.toLowerCase().includes(searchLower) ||
        (event.description || '').toLowerCase().includes(searchLower) ||
        (event.location || '').toLowerCase().includes(searchLower) ||
        (event.organizer || '').toLowerCase().includes(searchLower) ||
        (event.speakers || '').toLowerCase().includes(searchLower) ||
        (event.format || '').toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Category filter - check both main category and categories array
    if (categoryFilter !== "all") {
      const hasMatchingCategory = 
        event.category === categoryFilter ||
        (event.categories && event.categories.some(cat => cat.name === categoryFilter));
      
      if (!hasMatchingCategory) return false;
    }

    // Format filter
    if (formatFilter !== "all" && event.format !== formatFilter) {
      return false;
    }

    // Location filter
    if (locationFilter !== "all") {
      const hasMatchingLocation = 
        event.location === locationFilter ||
        (event.locations && event.locations.some(loc => loc.name === locationFilter));
      
      if (!hasMatchingLocation) return false;
    }

    // Organizer filter - check both main organizer and organizers array
    if (organizerFilter !== "all") {
      const hasMatchingOrganizer = 
        event.organizer === organizerFilter ||
        (event.organizers && event.organizers.some((org: any) => org.name === organizerFilter));
      
      if (!hasMatchingOrganizer) return false;
    }

    // Speaker filter
    if (speakerFilter !== "all") {
      const eventSpeakers = (event.speakers || '').split(',').map((s: string) => s.trim());
      if (!eventSpeakers.includes(speakerFilter)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900">All Events</h1>
              <p className="text-gray-600 text-sm md:text-lg mt-1 md:mt-2">
                {showPersonalizedOnly && userProfile?.profile_completed
                  ? `Showing events for ${userProfile.role_type === 'medical_student' && userProfile.university && userProfile.study_year
                      ? `${userProfile.university} Year ${userProfile.study_year}`
                      : userProfile.role_type === 'foundation_doctor' && userProfile.foundation_year
                      ? userProfile.foundation_year
                      : 'you'}`
                  : 'Manage all your training events'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
              {isAdmin && (
                <Button onClick={handleAddEvent} className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
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
                    You're viewing events filtered for your profile. 
                    {userProfile.role_type === 'medical_student' && userProfile.university && userProfile.study_year && (
                      ` Showing ${userProfile.university} Year ${userProfile.study_year} events only.`
                    )}
                    {userProfile.role_type === 'foundation_doctor' && userProfile.foundation_year && (
                      ` Showing ${userProfile.foundation_year} events only.`
                    )}
                    {' '}Click "All Events" above to see everything, or update your preferences in Profile Settings.
                  </p>
                </div>
              </div>
            </div>
          )}

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
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="all">Categories</SelectItem>
                        {getHierarchicalCategoriesForDropdown().map((category, index) => (
                          <SelectItem 
                            key={index} 
                            value={category.name}
                            className={category.isParent ? 'font-semibold' : ''}
                          >
                            <div className={`flex items-center gap-2 ${category.isParent ? '' : 'pl-4'}`}>
                              <div 
                                className={`rounded-full ${category.isParent ? 'w-3 h-3' : 'w-2 h-2'}`}
                                style={{ backgroundColor: category.color }}
                              ></div>
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
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
                      {getUniqueLocations().map((location, index) => (
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
                        {getUniqueOrganizers().map((organizer, index) => (
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
                        {getUniqueValues('format').sort().map((format, index) => (
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
                      variant={isAnyFilterActive() ? "default" : "outline"}
                      onClick={resetFilters}
                      className={`flex items-center gap-2 w-full sm:w-auto ${
                        isAnyFilterActive() 
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
                          : ""
                      }`}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset {isAnyFilterActive() && "Filters"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        {/* Calendar */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Calendar showEventsList={true} maxEventsToShow={5} events={filteredEvents} />
        </div>
    </div>
  );
}
