"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getEvents } from "@/lib/events-api";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon, X } from "lucide-react";
import { EventStatusBadge } from "@/components/EventStatusBadge";

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
  allOrganizers?: string[]; // All organizers for display
  category: string;
  categories?: Array<{ id: string; name: string; color?: string }>; // Multiple categories
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
}

interface CalendarProps {
  showEventsList?: boolean;
  maxEventsToShow?: number;
  events?: Event[]; // Optional prop to pass pre-filtered events
  clickableEvents?: boolean; // Whether events should be clickable
  viewCalendarLink?: string; // Custom link for "View Full Calendar" button
  showEventDetails?: boolean; // Whether to show Details button on events
  centerContent?: boolean; // Whether to center content in event cards
}

export default function Calendar({ 
  showEventsList = true, 
  maxEventsToShow = 5, 
  events: propEvents, 
  clickableEvents = true, 
  viewCalendarLink = '/calendar', 
  showEventDetails = true,
  centerContent = false
}: CalendarProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState(true);
  const [popupDate, setPopupDate] = useState<Date | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);
  const [displayedDate, setDisplayedDate] = useState<Date | null>(new Date());

  // Close month picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Add a small delay to ensure button clicks are processed first
      setTimeout(() => {
        if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
          setShowMonthPicker(false);
        }
      }, 0);
    }

    if (showMonthPicker) {
      // Use 'click' event which works for both mouse and touch
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showMonthPicker]);

  // Use prop events if provided, otherwise load from Supabase
  useEffect(() => {
    if (propEvents) {
      setEvents(propEvents);
      setLoading(false);
      return;
    }

    const loadEvents = async () => {
      try {
        setLoading(true);
        
        // Use public API for logged out users, authenticated API for logged in users
        const apiUrl = session ? '/api/events' : '/api/events/public';
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.statusText}`);
        }
        
        const supabaseEvents = await response.json();
        
        // Transform Supabase events to match the interface
        const transformedEvents = supabaseEvents.map((event: any) => {
          // Build allOrganizers array from main organizer + additional organizers
          const allOrganizers: string[] = [];
          
          // Add main organizer if it exists
          if (event.organizer_name && event.organizer_name.trim()) {
            allOrganizers.push(event.organizer_name);
          }
          
          // Add additional organizers from the organizers array
          if (event.organizers && Array.isArray(event.organizers)) {
            event.organizers.forEach((org: any) => {
              if (org.name && org.name.trim() && !allOrganizers.includes(org.name)) {
                allOrganizers.push(org.name);
              }
            });
          }
          
          return {
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
            allOrganizers: allOrganizers, // All organizers for display
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
            author: event.author_name || 'Unknown'
          };
        });

        setEvents(transformedEvents);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [propEvents, session]);

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

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const handleDateClick = (date: Date) => {
    // Only animate if date is actually changing
    if (calendarSelectedDate && date.toDateString() === calendarSelectedDate.toDateString()) {
      return;
    }
    
    // Update selected date immediately
    setCalendarSelectedDate(date);
    
    // Start animation - new events will render hidden
    setIsAnimating(true);
    
    // Update displayed date and trigger animation after React renders
    setTimeout(() => {
      setDisplayedDate(date);
      // Use double requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(false);
        });
      });
    }, 50);
  };

  // Helper function to determine if a color is light or dark
  const isLightColor = (hex: string): boolean => {
    if (!hex || !hex.startsWith('#')) return false;
    const color = hex.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
  };

  const getEventColor = (event: Event): string => {
    // Use format color from database if available
    if (event.formatColor) {
      const textColor = isLightColor(event.formatColor) ? 'text-gray-900' : 'text-white';
      return `bg-[${event.formatColor}] ${textColor}`;
    }
    
    // Fallback to gray if no color specified
    return 'bg-gray-300 text-gray-900';
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
    
    // Add days of the month - ensure dates are created in local timezone
    for (let day = 1; day <= daysInMonth; day++) {
      // Create date in local timezone to avoid UTC conversion issues
      const localDate = new Date(year, month, day, 12, 0, 0, 0); // Use noon to avoid DST issues
      days.push(localDate);
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
    // Use local date methods to ensure we're working in London timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    // Filter events for this date and sort by start time
    return events
      .filter(event => event.date === dateString)
      .sort((a, b) => {
        // Sort by start time
        const timeA = a.startTime || '00:00';
        const timeB = b.startTime || '00:00';
        return timeA.localeCompare(timeB);
      });
  };

  const getSelectedDateEvents = () => {
    // Use displayedDate for animation control
    const dateToUse = displayedDate || calendarSelectedDate;
    if (!dateToUse) return [];
    
    // Get events for the displayed date
    const year = dateToUse.getFullYear();
    const month = String(dateToUse.getMonth() + 1).padStart(2, '0');
    const day = String(dateToUse.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    // Filter events for this date and sort by start time
    return events
      .filter(event => event.date === dateString)
      .sort((a, b) => {
        // Sort by start time
        const timeA = a.startTime || '00:00';
        const timeB = b.startTime || '00:00';
        return timeA.localeCompare(timeB);
      });
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    return events
      .filter(event => event.date >= todayString)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, maxEventsToShow);
  };

  const days = getDaysInMonth(currentDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile Dark Calendar */}
      <div className="md:hidden bg-[#2C2C2C] rounded-xl p-4">
        {/* Header with navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigateMonth('prev');
            }}
            className="text-white hover:text-cyan-400 transition-all p-2.5 hover:bg-[#3C3C3C] rounded-lg border-2 border-gray-600 hover:border-cyan-500 hover:shadow-lg active:scale-95"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="relative" ref={monthPickerRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMonthPicker(!showMonthPicker);
              }}
              className="flex items-center gap-3 bg-gradient-to-r from-[#3C3C3C] to-[#4C4C4C] hover:from-cyan-600 hover:to-blue-600 rounded-lg px-5 py-3 transition-all border-2 border-gray-600 hover:border-cyan-400 shadow-lg hover:shadow-xl active:scale-95"
            >
              <span className="text-white font-bold text-base whitespace-nowrap">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <ChevronDown className={`h-4 w-4 text-cyan-300 transition-transform ${showMonthPicker ? 'rotate-180' : ''}`} />
            </button>
            
            {showMonthPicker && (
              <div 
                className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-[#1C1C1C] rounded-xl shadow-2xl border border-gray-700 p-4 z-50 w-80 animate-in fade-in slide-in-from-top-2 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-300 mb-2 block">Select Year</label>
                  <div className="grid grid-cols-5 gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-[#2C2C2C] rounded-lg">
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() - 5 + i;
                      return (
                        <button
                          type="button"
                          key={year}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            const newDate = new Date(currentDate);
                            newDate.setFullYear(year);
                            setCurrentDate(newDate);
                          }}
                          className={`px-2 py-1.5 rounded-md text-xs font-semibold transition-all ${
                            currentDate.getFullYear() === year
                              ? 'bg-cyan-500 text-white shadow-md'
                              : 'bg-[#3C3C3C] text-gray-300 hover:bg-[#4C4C4C] border border-gray-600'
                          }`}
                        >
                          {year}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-300 mb-2 block">Select Month</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {monthNames.map((month, index) => (
                      <button
                        type="button"
                        key={month}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const newDate = new Date(currentDate);
                          newDate.setMonth(index);
                          setCurrentDate(newDate);
                          setShowMonthPicker(false);
                        }}
                        className={`px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                          currentDate.getMonth() === index
                            ? 'bg-cyan-500 text-white shadow-md'
                            : 'bg-[#3C3C3C] text-gray-300 hover:bg-[#4C4C4C]'
                        }`}
                      >
                        {month.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setCurrentDate(new Date());
                      setShowMonthPicker(false);
                    }}
                    className="flex-1 px-3 py-1.5 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors font-semibold text-xs"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setShowMonthPicker(false);
                    }}
                    className="flex-1 px-3 py-1.5 bg-[#3C3C3C] text-gray-300 rounded-md hover:bg-[#4C4C4C] transition-colors font-semibold text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigateMonth('next');
            }}
            className="text-white hover:text-cyan-400 transition-all p-2.5 hover:bg-[#3C3C3C] rounded-lg border-2 border-gray-600 hover:border-cyan-500 hover:shadow-lg active:scale-95"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
            <div 
              key={day} 
              className={`text-center text-xs font-bold py-2 ${
                idx >= 5 ? 'text-orange-400' : 'text-gray-400'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (!day) {
              return <div key={index} className="aspect-square"></div>;
            }

            const dayEvents = getEventsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected = calendarSelectedDate && day.toDateString() === calendarSelectedDate.toDateString();
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();

            return (
              <div
                key={index}
                onClick={() => handleDateClick(day)}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-600 border-2 border-blue-400'
                    : isToday
                    ? 'bg-orange-500'
                    : 'border-2 border-transparent hover:bg-[#3C3C3C]'
                }`}
              >
                <div className={`text-sm font-semibold ${
                  isSelected || isToday
                    ? 'text-white'
                    : !isCurrentMonth
                    ? 'text-gray-600'
                    : isWeekend
                    ? 'text-orange-400'
                    : 'text-white'
                }`}>
                  {day.getDate()}
                </div>
                
                {/* Show dots for events */}
                {dayEvents.length > 0 && isCurrentMonth && !isSelected && !isToday && (
                  <div className="flex justify-center gap-0.5 mt-1">
                    {dayEvents.slice(0, 3).map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Calendar */}
      <Card className="md:block hidden md:mx-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="text-gray-600 hover:text-white hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600 text-xs md:text-sm font-bold transition-all border-2 border-gray-300 hover:border-purple-500 shadow-md hover:shadow-lg px-3 py-2 active:scale-95"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">{monthNames[currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1].toUpperCase()}</span>
            </Button>
            
            <div className="relative" ref={monthPickerRef}>
              <button
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className="text-base md:text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg transition-all cursor-pointer whitespace-nowrap border-2 border-purple-400 hover:border-purple-300 shadow-lg hover:shadow-xl active:scale-95"
              >
                {monthNames[currentDate.getMonth()].toUpperCase()} {currentDate.getFullYear()}
                <ChevronDown className={`inline-block ml-2 h-4 w-4 text-purple-100 transition-transform ${showMonthPicker ? 'rotate-180' : ''}`} />
              </button>
              
              {showMonthPicker && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-6 z-50 w-96 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="mb-6">
                    <label className="text-sm font-bold text-gray-800 mb-3 block">Select Year</label>
                    <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() - 5 + i;
                        return (
                          <button
                            key={year}
                            onClick={() => {
                              const newDate = new Date(currentDate);
                              newDate.setFullYear(year);
                              setCurrentDate(newDate);
                            }}
                            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                              currentDate.getFullYear() === year
                                ? 'bg-blue-600 text-white shadow-md scale-105'
                                : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-200'
                            }`}
                          >
                            {year}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-800 mb-3 block">Select Month</label>
                    <div className="grid grid-cols-3 gap-2">
                      {monthNames.map((month, index) => (
                        <button
                          key={month}
                          onClick={() => {
                            const newDate = new Date(currentDate);
                            newDate.setMonth(index);
                            setCurrentDate(newDate);
                            setShowMonthPicker(false);
                          }}
                          className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                            currentDate.getMonth() === index
                              ? 'bg-blue-600 text-white shadow-md scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {month}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={() => {
                        setCurrentDate(new Date());
                        setShowMonthPicker(false);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold text-sm"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setShowMonthPicker(false)}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="text-gray-600 hover:text-white hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600 text-xs md:text-sm font-bold transition-all border-2 border-gray-300 hover:border-purple-500 shadow-md hover:shadow-lg px-3 py-2 active:scale-95"
              aria-label="Next month"
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
              <div key={day} className="p-2 sm:p-3 text-center text-xs sm:text-sm font-bold text-gray-600 bg-gray-100 border border-gray-200">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0">
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="p-0 border border-gray-200 bg-gray-50 min-h-[3.5rem] sm:min-h-[4rem] md:h-[12rem] lg:h-[14rem]"></div>;
              }

              const dayEvents = getEventsForDate(day);
              const isToday = day.toDateString() === new Date().toDateString();
              const isSelected = calendarSelectedDate && day.toDateString() === calendarSelectedDate.toDateString();

              return (
                <div
                  key={index}
                  onClick={() => {
                    handleDateClick(day);
                  }}
                  className={`p-0 text-left transition-all duration-200 ease-in-out border border-gray-200 cursor-pointer overflow-hidden min-h-[3.5rem] sm:min-h-[4rem] md:h-[12rem] lg:h-[14rem] md:flex md:flex-col ${
                    isSelected
                      ? 'bg-blue-50 scale-105 shadow-md border-blue-300'
                      : isToday
                      ? 'bg-orange-50 hover:scale-102 border-orange-300'
                      : 'bg-white hover:bg-gray-50 hover:scale-102'
                  }`}
                >
                  {/* Date number at top */}
                  <div className={`mb-0 flex-shrink-0 ${isToday ? 'p-1 sm:p-1.5' : 'pt-1 px-1 sm:pt-1.5 sm:px-1.5'}`}>
                    <div
                      className={`text-sm sm:text-base font-bold transition-all ${
                        isToday
                          ? 'bg-orange-500 text-white rounded-full w-7 h-7 sm:w-8 sm:h-8 md:w-8 md:h-8 flex items-center justify-center mx-auto'
                          : isSelected
                          ? 'text-blue-600 bg-blue-100 rounded-full w-7 h-7 sm:w-8 sm:h-8 md:w-8 md:h-8 flex items-center justify-center mx-auto'
                          : 'text-gray-700 text-center'
                      }`}
                    >
                      {day.getDate()}
                    </div>
                  </div>
                  
                  {/* Show dots for events on mobile/tablet, full event tiles on desktop */}
                  {dayEvents.length > 0 ? (
                    <>
                      {/* Mobile/Tablet: Show dots */}
                      <div className="flex justify-center gap-1 sm:gap-1.5 md:hidden mt-1 sm:mt-1.5">
                        {dayEvents.slice(0, 3).map((_, i) => (
                          <div key={i} className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-orange-500"></div>
                        ))}
                      </div>
                      
                      {/* Desktop: Show event tiles */}
                      <div className="hidden md:flex md:flex-col md:flex-1 md:min-h-0 space-y-0.5 overflow-y-auto">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className={`calendar-event-tile text-xs leading-tight px-1.5 py-1 transition-opacity text-white ${clickableEvents ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
                            style={{
                              backgroundColor: event.formatColor || '#1F2937'
                            }}
                            onClick={(e) => {
                              if (clickableEvents) {
                                e.stopPropagation();
                                router.push(`/events/${event.id}`);
                              }
                            }}
                            title={`${event.title}${event.startTime && !event.hideTime ? ` - ${formatTime(event.startTime)}` : ''}`}
                          >
                            <div className="font-semibold truncate calendar-event-tile-title text-white text-xs">{event.title}</div>
                            {event.startTime && !event.hideTime && (
                              <div className="text-[10px] opacity-90 mt-0.5 calendar-event-tile-time text-white">
                                {formatTime(event.startTime)}
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {/* Show "+X more" if there are more than 3 events */}
                        {dayEvents.length > 3 && (
                          <div
                            className="text-xs leading-tight px-1.5 py-1 cursor-pointer hover:opacity-90 transition-opacity bg-gray-100 text-gray-700 font-semibold"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPopupDate(day);
                            }}
                            title={`Click to see ${dayEvents.length - 3} more events`}
                          >
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    // Empty spacer for days without events to maintain fixed height on desktop
                    <div className="hidden md:block flex-1"></div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Events List */}
      {showEventsList && (
        <div className="space-y-3 md:space-y-4 overflow-visible">
          <div className="text-center mb-4 md:mb-6">
            <h3 className="text-base md:text-xl font-bold text-gray-800">
              Events for {(displayedDate || calendarSelectedDate)?.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
          </div>
          
          {getSelectedDateEvents().length === 0 ? (
            <div className={`text-center py-8 text-gray-500 transition-all duration-500 ease-out ${
              isAnimating 
                ? 'opacity-0 transform -translate-y-10' 
                : 'opacity-100 transform translate-y-0'
            }`}>
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No events scheduled for this date</p>
            </div>
          ) : (
            getSelectedDateEvents().map((event, index) => (
            <div 
              key={`${(displayedDate || calendarSelectedDate)?.toDateString()}-${event.id}-${index}`}
              className={`bg-white border-2 border-gray-100 rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] ${
                isAnimating 
                  ? 'opacity-0 -translate-y-20' 
                  : 'opacity-100 translate-y-0'
              }`}
              style={{
                transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                transitionDelay: isAnimating ? '0ms' : `${index * 150}ms`,
                willChange: isAnimating ? 'transform, opacity' : 'auto'
              }}
            >
              <div className="space-y-3 md:space-y-4">
                {/* Title and Icon Section */}
                <div className="flex items-start space-x-3 md:space-x-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                    <CalendarIcon className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 md:mb-3 flex-wrap">
                      <h3 className="text-base md:text-xl font-bold text-gray-900">{event.title}</h3>
                      <EventStatusBadge status={event.eventStatus || 'scheduled'} className="text-xs" />
                    </div>
                    <div className="flex flex-wrap gap-2 md:gap-3 text-xs md:text-sm text-gray-600">
                      <div className="flex items-center">
                        <CalendarIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-1.5 flex-shrink-0" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-1.5 flex-shrink-0" />
                        <span>
                          {event.isAllDay 
                            ? "All day" 
                            : `${formatTime(event.startTime)}${event.endTime ? ` - ${formatTime(event.endTime)}` : ''}`
                          }
                        </span>
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-1.5 flex-shrink-0" />
                        <span>{event.location || "TBD"}</span>
                      </div>
                      {!event.hideOrganizer && event.allOrganizers && event.allOrganizers.length > 0 && (
                        <div className="flex items-center">
                          <CalendarIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-1.5 flex-shrink-0" />
                          <span className="truncate">
                            {event.allOrganizers.length === 1 
                              ? event.allOrganizers[0]
                              : `${event.allOrganizers[0]} +${event.allOrganizers.length - 1} more`
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Categories, Format, and Button Section */}
                <div className={`flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 pt-3 md:pt-4 border-t border-gray-100 ${
                  centerContent 
                    ? 'justify-center' 
                    : 'justify-between sm:ml-16 md:ml-20'
                }`}>
                  <div className={`flex flex-wrap gap-1.5 md:gap-2 ${centerContent ? 'justify-center' : ''}`}>
                    {/* Show all categories */}
                    {event.categories && event.categories.length > 0 ? (
                      event.categories.map((cat) => (
                        <span 
                          key={cat.id}
                          className="px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap"
                          style={{
                            backgroundColor: cat.color || '#F3F4F6',
                            color: cat.color && isLightColor(cat.color) ? '#111827' : '#FFFFFF'
                          }}
                        >
                          {cat.name}
                        </span>
                      ))
                    ) : event.category ? (
                      <span 
                        className="px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap"
                        style={{
                          backgroundColor: '#F3F4F6',
                          color: '#374151'
                        }}
                      >
                        {event.category}
                      </span>
                    ) : null}
                    
                    {/* Show format */}
                    {event.format && (
                      <span 
                        className="px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap"
                        style={{
                          backgroundColor: event.formatColor || '#D1D5DB',
                          color: event.formatColor && isLightColor(event.formatColor) ? '#111827' : '#FFFFFF'
                        }}
                      >
                        {event.format}
                      </span>
                    )}
                  </div>
                  {showEventDetails && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="group flex-shrink-0 w-full sm:w-auto text-xs md:text-sm"
                      onClick={() => router.push(`/events/${event.id}`)}
                    >
                      Details
                      <ChevronRight className="ml-1 h-3 w-3 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
          )}
        </div>
      )}
      
      {/* Popup for additional events */}
      {popupDate && (
        <div 
          className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50 p-4"
          onClick={() => setPopupDate(null)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Additional Events for {popupDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h3>
              <button
                onClick={() => setPopupDate(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white transition-all shadow-md hover:shadow-lg hover:scale-110 active:scale-95"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {getEventsForDate(popupDate).slice(3).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No additional events to show</p>
                </div>
              ) : (
                getEventsForDate(popupDate).slice(3).map(event => (
                  <div
                    key={event.id}
                    className="bg-white border-2 border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="space-y-4">
                      {/* Title and Icon Section */}
                      <div className="flex items-start space-x-4">
                        <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <CalendarIcon className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{event.title}</h3>
                            <EventStatusBadge status={event.eventStatus || 'scheduled'} className="text-xs" />
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                              <span className="whitespace-nowrap">{formatDate(event.date)}</span>
                            </div>
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                              <span className="whitespace-nowrap">
                                {event.isAllDay 
                                  ? "All day" 
                                  : event.hideTime
                                  ? (event.timeNotes || "Time TBD")
                                  : `${formatTime(event.startTime)}${event.endTime && !event.hideEndTime ? ` - ${formatTime(event.endTime)}` : ''}`
                                }
                              </span>
                            </div>
                            {!event.hideLocation && event.location && (
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                            {!event.hideOrganizer && event.allOrganizers && event.allOrganizers.length > 0 && (
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                                <span className="truncate">
                                  {event.allOrganizers.length === 1 
                                    ? event.allOrganizers[0]
                                    : `${event.allOrganizers[0]} +${event.allOrganizers.length - 1} more`
                                  }
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Categories, Format, and Button Section */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
                        <div className="flex flex-wrap gap-2">
                          {/* Show all categories */}
                          {event.categories && event.categories.length > 0 ? (
                            event.categories.map((cat) => (
                              <span 
                                key={cat.id}
                                className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
                                style={{
                                  backgroundColor: cat.color || '#F3F4F6',
                                  color: cat.color && isLightColor(cat.color) ? '#111827' : '#FFFFFF'
                                }}
                              >
                                {cat.name}
                              </span>
                            ))
                          ) : event.category ? (
                            <span 
                              className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
                              style={{
                                backgroundColor: '#F3F4F6',
                                color: '#374151'
                              }}
                            >
                              {event.category}
                            </span>
                          ) : null}
                          
                          {/* Show format */}
                          {event.format && (
                            <span 
                              className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
                              style={{
                                backgroundColor: event.formatColor || '#D1D5DB',
                                color: event.formatColor && isLightColor(event.formatColor) ? '#111827' : '#FFFFFF'
                              }}
                            >
                              {event.format}
                            </span>
                          )}
                        </div>
                        {showEventDetails && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="group flex-shrink-0 w-full sm:w-auto"
                            onClick={() => {
                              router.push(`/events/${event.id}`);
                              setPopupDate(null);
                            }}
                          >
                            Details
                            <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


