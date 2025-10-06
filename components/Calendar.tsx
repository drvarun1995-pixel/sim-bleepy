"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getEvents } from "@/lib/events-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon } from "lucide-react";

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
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());

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

  const handleMonthYearChange = () => {
    const newDate = new Date(selectedYear, selectedMonth, 1);
    setCurrentDate(newDate);
    setShowMonthYearPicker(false);
  };

  const generateYearRange = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
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
      {/* Mobile Dark Calendar */}
      <div className="md:hidden bg-[#2C2C2C] rounded-xl p-4 relative">
        {/* Header with navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg p-2.5 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => {
              setSelectedYear(currentDate.getFullYear());
              setSelectedMonth(currentDate.getMonth());
              setShowMonthYearPicker(!showMonthYearPicker);
            }}
            className="flex items-center gap-2 bg-[#3C3C3C] hover:bg-[#4C4C4C] rounded-lg px-4 py-2 transition-colors cursor-pointer"
          >
            <span className="text-white font-medium">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showMonthYearPicker ? 'rotate-180' : ''}`} />
          </button>
          
          <button
            onClick={() => navigateMonth('next')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg p-2.5 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Month/Year Picker Dropdown - Mobile */}
        {showMonthYearPicker && (
          <div className="absolute top-16 left-4 right-4 bg-[#3C3C3C] rounded-lg shadow-2xl z-50 p-4 border border-gray-600">
            <div className="space-y-4">
              {/* Year Selector */}
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Year</label>
                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                  {generateYearRange().map(year => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedYear === year
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                          : 'bg-[#2C2C2C] text-gray-300 hover:bg-[#4C4C4C]'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              {/* Month Selector */}
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Month</label>
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {monthNames.map((month, index) => (
                    <button
                      key={month}
                      onClick={() => setSelectedMonth(index)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedMonth === index
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                          : 'bg-[#2C2C2C] text-gray-300 hover:bg-[#4C4C4C]'
                      }`}
                    >
                      {month.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowMonthYearPicker(false)}
                  className="flex-1 px-4 py-2 bg-[#2C2C2C] text-gray-300 rounded-lg hover:bg-[#4C4C4C] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMonthYearChange}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Overlay to close picker */}
        {showMonthYearPicker && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowMonthYearPicker(false)}
          ></div>
        )}

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
            <div 
              key={day} 
              className={`text-center text-xs font-medium py-2 ${
                idx >= 5 ? 'text-red-400' : 'text-gray-400'
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
                    ? 'border-2 border-cyan-400'
                    : 'border-2 border-transparent hover:border-gray-600'
                }`}
              >
                <div className={`text-sm font-medium ${
                  !isCurrentMonth
                    ? 'text-gray-600'
                    : isWeekend
                    ? 'text-red-400'
                    : 'text-white'
                }`}>
                  {day.getDate()}
                </div>
                
                {/* Show dots for events */}
                {dayEvents.length > 0 && isCurrentMonth && (
                  <div className="flex justify-center gap-0.5 mt-1">
                    {dayEvents.slice(0, 3).map((_, i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-orange-500"></div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Calendar */}
      <Card className="md:block hidden relative">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Button
              variant="default"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs md:text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">{monthNames[currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1].toUpperCase()}</span>
            </Button>
            
            <button
              onClick={() => {
                setSelectedYear(currentDate.getFullYear());
                setSelectedMonth(currentDate.getMonth());
                setShowMonthYearPicker(!showMonthYearPicker);
              }}
              className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-4 py-2 transition-colors group"
            >
              <CardTitle className="text-base md:text-xl font-bold text-gray-800">
                {monthNames[currentDate.getMonth()].toUpperCase()} {currentDate.getFullYear()}
              </CardTitle>
              <ChevronDown className={`h-5 w-5 text-gray-500 group-hover:text-gray-700 transition-all duration-200 ${showMonthYearPicker ? 'rotate-180' : ''}`} />
            </button>
            
            <Button
              variant="default"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs md:text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              <span className="hidden md:inline">{monthNames[currentDate.getMonth() === 11 ? 0 : currentDate.getMonth() + 1].toUpperCase()}</span>
              <ChevronRight className="h-4 w-4 md:ml-1" />
            </Button>
          </div>

          {/* Month/Year Picker Dropdown - Desktop */}
          {showMonthYearPicker && (
            <>
              <div
                className="fixed inset-0 bg-black bg-opacity-30 z-40"
                onClick={() => setShowMonthYearPicker(false)}
              ></div>
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-2xl z-50 p-6 border border-gray-200 w-[500px]">
                <div className="space-y-4">
                  {/* Year Selector */}
                  <div>
                    <label className="text-gray-700 text-sm font-semibold mb-2 block">Select Year</label>
                    <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto">
                      {generateYearRange().map(year => (
                        <button
                          key={year}
                          onClick={() => setSelectedYear(year)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedYear === year
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md transform scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Month Selector */}
                  <div>
                    <label className="text-gray-700 text-sm font-semibold mb-2 block">Select Month</label>
                    <div className="grid grid-cols-4 gap-2">
                      {monthNames.map((month, index) => (
                        <button
                          key={month}
                          onClick={() => setSelectedMonth(index)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedMonth === index
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md transform scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {month}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowMonthYearPicker(false)}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleMonthYearChange}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md font-medium"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
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
        <div className={`space-y-3 md:space-y-4 transition-all duration-500 ease-in-out ${
          isAnimating 
            ? 'opacity-0 transform translate-y-4' 
            : 'opacity-100 transform translate-y-0'
        }`}>
          <div className="text-center mb-4 md:mb-6">
            <h3 className="text-base md:text-xl font-bold text-gray-800 transition-all duration-300">
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
              className={`bg-white border-2 border-gray-100 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${
                isAnimating 
                  ? 'opacity-0 transform translate-y-4' 
                  : 'opacity-100 transform translate-y-0'
              }`}
              style={{
                transitionDelay: isAnimating ? '0ms' : `${index * 100}ms`
              }}
            >
              <div className="space-y-3 md:space-y-4">
                {/* Title and Icon Section */}
                <div className="flex items-start space-x-3 md:space-x-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                    <CalendarIcon className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base md:text-xl font-bold text-gray-900 mb-2 md:mb-3">{event.title}</h3>
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
                    </div>
                  </div>
                </div>

                {/* Categories, Format, and Button Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3 pt-2 md:pt-3 border-t border-gray-100">
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="group flex-shrink-0 w-full sm:w-auto text-xs md:text-sm"
                    onClick={() => router.push(`/events/${event.id}`)}
                  >
                    Details
                    <ChevronRight className="ml-1 h-3 w-3 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform" />
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


