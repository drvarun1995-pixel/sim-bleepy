"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getEvents } from "@/lib/events-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

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
}

export default function Calendar({ showEventsList = true, maxEventsToShow = 5, events: propEvents }: CalendarProps) {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState(true);
  const [popupDate, setPopupDate] = useState<Date | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

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
        }));

        setEvents(transformedEvents);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [propEvents]);

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
    setIsAnimating(true);
    setCalendarSelectedDate(date);
    
    // Reset animation state after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 600); // Match the animation duration
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
    
    return events.filter(event => event.date === dateString);
  };

  const getSelectedDateEvents = () => {
    if (!calendarSelectedDate) return [];
    
    // Get events for the selected date
    const year = calendarSelectedDate.getFullYear();
    const month = String(calendarSelectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(calendarSelectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    return events.filter(event => event.date === dateString);
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
      {/* Calendar */}
      <Card>
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
              <div key={day} className="p-2 sm:p-3 text-center text-xs sm:text-sm font-bold text-gray-600 bg-gray-100 border border-gray-200">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0">
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="p-0 aspect-square border border-gray-200 bg-gray-50 min-h-[3.5rem] sm:min-h-[4rem]"></div>;
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
                  className={`p-0 aspect-square text-left transition-all duration-200 ease-in-out border border-gray-200 cursor-pointer overflow-hidden min-h-[3.5rem] sm:min-h-[4rem] ${
                    isSelected
                      ? 'bg-blue-50 scale-105 shadow-md'
                      : isToday
                      ? 'bg-yellow-50 hover:scale-102'
                      : 'bg-white hover:bg-gray-50 hover:scale-102'
                  }`}
                >
                  {/* Date number at top */}
                  <div className={`mb-0 ${isToday ? 'p-1 sm:p-1.5' : 'pt-1 px-1 sm:pt-1.5 sm:px-1.5'}`}>
                    <div
                      className={`text-sm sm:text-base font-bold transition-all ${
                        isToday
                          ? 'bg-orange-500 text-white rounded-full w-7 h-7 sm:w-8 sm:h-8 md:w-8 md:h-8 flex items-center justify-center mx-auto'
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
                      <div className="flex justify-center gap-1 sm:gap-1.5 md:hidden mt-1 sm:mt-1.5">
                        {dayEvents.slice(0, 3).map((_, i) => (
                          <div key={i} className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-orange-500"></div>
                        ))}
                      </div>
                      
                      {/* Desktop: Show event tiles */}
                      <div className="hidden md:block">
                        {dayEvents.slice(0, 4).map(event => (
                          <div
                            key={event.id}
                            className="text-[11px] leading-snug px-2 py-2 cursor-pointer hover:opacity-90 transition-opacity"
                            style={{
                              backgroundColor: event.formatColor || '#D1D5DB',
                              color: event.formatColor && isLightColor(event.formatColor) ? '#111827' : '#FFFFFF'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/events/${event.id}`);
                            }}
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                        
                        {/* Show "+X more" if there are more than 4 events */}
                        {dayEvents.length > 4 && (
                          <div
                            className="text-[11px] leading-snug px-2 py-2 cursor-pointer hover:opacity-90 transition-opacity bg-gray-100 text-gray-700 font-semibold"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPopupDate(day);
                            }}
                            title={`Click to see ${dayEvents.length - 4} more events`}
                          >
                            +{dayEvents.length - 4} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Events List */}
      {showEventsList && (
        <div className={`space-y-4 transition-all duration-500 ease-in-out ${
          isAnimating 
            ? 'opacity-0 transform translate-y-4' 
            : 'opacity-100 transform translate-y-0'
        }`}>
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 transition-all duration-300">
              Events for {calendarSelectedDate?.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
          </div>
          
          {getSelectedDateEvents().length === 0 ? (
            <div className="text-center py-8 text-gray-500 transition-all duration-300">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No events scheduled for this date</p>
            </div>
          ) : (
            getSelectedDateEvents().map((event, index) => (
            <div 
              key={event.id}
              className={`bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${
                isAnimating 
                  ? 'opacity-0 transform translate-y-4' 
                  : 'opacity-100 transform translate-y-0'
              }`}
              style={{
                transitionDelay: isAnimating ? '0ms' : `${index * 100}ms`
              }}
            >
              <div className="space-y-4">
                {/* Title and Icon Section */}
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CalendarIcon className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{event.title}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                        <span>
                          {event.isAllDay 
                            ? "All day" 
                            : `${formatTime(event.startTime)}${event.endTime ? ` - ${formatTime(event.endTime)}` : ''}`
                          }
                        </span>
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                        <span>{event.location || "TBD"}</span>
                      </div>
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
                          className="px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap"
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
                        className="px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap"
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
                        className="px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap"
                        style={{
                          backgroundColor: event.formatColor || '#D1D5DB',
                          color: event.formatColor && isLightColor(event.formatColor) ? '#111827' : '#FFFFFF'
                        }}
                      >
                        {event.format}
                      </span>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="group flex-shrink-0 w-full sm:w-auto"
                    onClick={() => router.push(`/events/${event.id}`)}
                  >
                    Details
                    <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
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
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              {getEventsForDate(popupDate).slice(4).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No additional events to show</p>
                </div>
              ) : (
                getEventsForDate(popupDate).slice(4).map(event => (
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
                          <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">{event.title}</h3>
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


