"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getEvents } from "@/lib/events-api";
import { filterEventsByProfile } from "@/lib/event-filtering";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Users, Folder, UserCircle, Mic, Sparkles, RotateCcw, Filter, Calendar as CalendarIcon } from "lucide-react";
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

export default function DashboardEventsPage() {
  const router = useRouter();
  const { data: session } = useSession();
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
      }
    };

    loadEvents();
  }, []);

  const getUniqueValues = (key: keyof Event) => {
    return Array.from(new Set(events.map(event => event[key]).filter(Boolean)));
  };

  const getUniqueSpeakers = () => {
    const allSpeakers = events.flatMap(event => 
      event.speakers ? event.speakers.split(',').map(s => s.trim()) : []
    ).filter(Boolean);
    return Array.from(new Set(allSpeakers)).sort();
  };

  const getUniqueOrganizers = () => {
    const mainOrganizers = events.map(event => event.organizer).filter(Boolean);
    const junctionOrganizers = events.flatMap(event => 
      event.organizers ? event.organizers.map(org => org.name) : []
    ).filter(Boolean);
    const allOrganizers = [...mainOrganizers, ...junctionOrganizers];
    return Array.from(new Set(allOrganizers)).sort();
  };

  const getHierarchicalCategoriesForDropdown = () => {
    const categoriesMap = new Map<string, string>();
    
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

    const parentCategories = ['ARU', 'UCL', 'Foundation Year Doctors'];
    const hierarchy: Array<{ name: string; isParent: boolean; color: string }> = [];
    
    parentCategories.forEach(parent => {
      const children = Array.from(categoriesMap.keys()).filter(cat => 
        cat !== parent && cat.includes(parent)
      );
      
      if (categoriesMap.has(parent) || children.length > 0) {
        hierarchy.push({ 
          name: parent, 
          isParent: true, 
          color: categoriesMap.get(parent) || '#FCD34D' 
        });
        
        children.sort().forEach(child => {
          hierarchy.push({ 
            name: child, 
            isParent: false, 
            color: categoriesMap.get(child) || '#FCD34D' 
          });
        });
      }
    });
    
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

  // Apply profile-based filtering
  const profileFilteredEvents = (showPersonalizedOnly && userProfile?.profile_completed) 
    ? filterEventsByProfile(events, userProfile) as Event[]
    : events;

  // Apply manual filters
  const filteredEvents = profileFilteredEvents.filter(event => {
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

    if (categoryFilter !== "all") {
      const hasMatchingCategory = 
        event.category === categoryFilter ||
        (event.categories && event.categories.some(cat => cat.name === categoryFilter));
      
      if (!hasMatchingCategory) return false;
    }

    if (formatFilter !== "all" && event.format !== formatFilter) {
      return false;
    }

    if (locationFilter !== "all" && event.location !== locationFilter) {
      return false;
    }

    if (organizerFilter !== "all") {
      const hasMatchingOrganizer = 
        event.organizer === organizerFilter ||
        (event.organizers && event.organizers.some((org: any) => org.name === organizerFilter));
      
      if (!hasMatchingOrganizer) return false;
    }

    if (speakerFilter !== "all") {
      const eventSpeakers = (event.speakers || '').split(',').map((s: string) => s.trim());
      if (!eventSpeakers.includes(speakerFilter)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-[95%] xl:max-w-[1690px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900">My Events</h1>
              <p className="text-gray-600 text-sm md:text-lg mt-1 md:mt-2">
                {showPersonalizedOnly && userProfile?.profile_completed
                  ? `Showing events for ${userProfile.role_type === 'medical_student' && userProfile.university && userProfile.study_year
                      ? `${userProfile.university} Year ${userProfile.study_year}`
                      : userProfile.role_type === 'foundation_doctor' && userProfile.foundation_year
                      ? userProfile.foundation_year
                      : 'you'}`
                  : 'View and manage all your training events'}
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
            </div>
          </div>
        </div>

        <div className="max-w-[140rem] mx-auto">
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
                        {getUniqueValues('location').sort().map((location, index) => (
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
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <Calendar showEventsList={true} maxEventsToShow={5} events={filteredEvents} />
          </div>
        </div>
      </div>
    </div>
  );
}

