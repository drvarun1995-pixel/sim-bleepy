"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Edit2, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Folder,
  Sparkles,
  UserCircle,
  Mic,
  Eye,
  EyeOff,
  Database
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DebugMultiSelect } from "@/components/ui/debug-multi-select";

interface ExtractedEvent {
  id: string; // temporary ID for tracking
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime?: string; // HH:MM
  
  // Location fields
  location?: string;
  locationId?: string;
  otherLocationIds?: string[];
  otherLocations?: Array<{ id: string; name: string }>;
  
  // Speaker fields
  speakers?: Array<{ id: string; name: string; role?: string }>;
  speakerIds?: string[];
  
  // Category fields (multiple support)
  categories?: Array<{ id: string; name: string; color?: string }>;
  categoryIds?: string[];
  
  // Format fields
  format?: string;
  formatId?: string;
  
  // Organizer fields
  organizer?: string;
  organizerId?: string;
  otherOrganizerIds?: string[];
  otherOrganizers?: Array<{ id: string; name: string }>;
  
  // Existing event matching
  existingEventMatch?: {
    isMatch: boolean;
    existingEventId?: string;
    similarityReason?: string;
  };
  
  isValid?: boolean;
  errors?: string[];
}

interface BulkEventReviewProps {
  events: ExtractedEvent[];
  onConfirm: (events: ExtractedEvent[]) => void;
  onCancel: () => void;
}

export default function BulkEventReview({ events: initialEvents, onConfirm, onCancel }: BulkEventReviewProps) {
  const [events, setEvents] = useState<ExtractedEvent[]>(initialEvents);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [availableLocations, setAvailableLocations] = useState<any[]>([]);
  const [availableSpeakers, setAvailableSpeakers] = useState<any[]>([]);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [availableFormats, setAvailableFormats] = useState<any[]>([]);
  const [availableOrganizers, setAvailableOrganizers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExistingEvents, setShowExistingEvents] = useState(false);
  

  // Fetch available options from database
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        
        // Fetch all reference data
        const [locationsRes, speakersRes, categoriesRes, formatsRes, organizersRes] = await Promise.all([
          fetch('/api/events/bulk-upload-options?type=locations'),
          fetch('/api/events/bulk-upload-options?type=speakers'),
          fetch('/api/events/bulk-upload-options?type=categories'),
          fetch('/api/events/bulk-upload-options?type=formats'),
          fetch('/api/events/bulk-upload-options?type=organizers')
        ]);

        const [locations, speakers, categories, formats, organizers] = await Promise.all([
          locationsRes.json(),
          speakersRes.json(),
          categoriesRes.json(),
          formatsRes.json(),
          organizersRes.json()
        ]);

        setAvailableLocations(locations.data || []);
        setAvailableSpeakers(speakers.data || []);
        setAvailableCategories(categories.data || []);
        setAvailableFormats(formats.data || []);
        setAvailableOrganizers(organizers.data || []);

      } catch (error) {
        console.error('Error fetching options:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
  };

  const handleEditEvent = (eventId: string) => {
    setEditingEventId(eventId === editingEventId ? null : eventId);
  };

  const handleUpdateEvent = (eventId: string, updates: Partial<ExtractedEvent>) => {
    setEvents(events.map(e => 
      e.id === eventId ? { ...e, ...updates } : e
    ));
  };

  const validateEvents = () => {
    return events.every(event => {
      return event.title && event.date && event.startTime;
    });
  };

  const handleConfirm = () => {
    if (!validateEvents()) {
      alert('Please ensure all new events have a title, date, and start time.');
      return;
    }
    
    // Only pass new events (not existing matches) for confirmation
    onConfirm(newEvents);
  };
  
  
  // Helper function to get category hierarchy
  const getCategoryHierarchy = () => {
    const parentCategories = availableCategories.filter(c => !c.parent_id);
    const childCategories = availableCategories.filter(c => c.parent_id);
    
    return parentCategories.map(parent => ({
      ...parent,
      children: childCategories.filter(c => c.parent_id === parent.id)
    }));
  };

  // Separate events into new and existing
  console.log('All events received:', events);
  
  // Debug: Show raw event data in UI temporarily
  const debugInfo = events.map((event: any) => ({
    id: event.id,
    title: event.title,
    date: event.date,
    startTime: event.startTime,
    hasExistingMatch: !!event.existingEventMatch?.isMatch,
    existingEventMatch: event.existingEventMatch
  }));
  console.log('Debug event info:', debugInfo);
  console.log('🔍 Frontend: Checking if existingEventMatch property exists...');
  events.forEach((event, index) => {
    console.log(`Frontend Event ${index + 1}:`, {
      title: event.title,
      existingEventMatch: event.existingEventMatch,
      hasExistingMatch: !!event.existingEventMatch?.isMatch
    });
  });
  
  // Validate events data
  if (!events || events.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-red-600">No Events Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              No events were extracted from your file. Please check the file content and try again.
            </p>
            <Button onClick={onCancel} variant="outline">
              Upload Different File
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const newEvents = events.filter(event => !event.existingEventMatch?.isMatch);
  const existingEvents = events.filter(event => event.existingEventMatch?.isMatch);
  console.log('New events:', newEvents);
  console.log('Existing events:', existingEvents);

  const getEventDisplayTitle = (event: ExtractedEvent, index: number) => {
    // Title already includes format prefix from backend, so just return as-is
    return event.title;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600">Loading event options...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {events.length} Event{events.length > 1 ? 's' : ''} Extracted
                </h3>
                <p className="text-sm text-gray-600">
                  {newEvents.length} new events, {existingEvents.length} existing matches
                </p>
                <p className="text-sm text-gray-600">
                  Review and edit the extracted information below
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-bold text-green-600">
                {events.filter(e => e.title && e.date && e.startTime).length} / {events.length} Valid
              </p>
              {existingEvents.length > 0 && (
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExistingEvents(!showExistingEvents)}
                    className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    {showExistingEvents ? (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Hide Existing
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Show Existing ({existingEvents.length})
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>


      {/* New Events List */}
      <div className="space-y-4">
        {newEvents.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">New Events ({newEvents.length})</h3>
            </div>
            {newEvents.map((event, index) => (
          <Card key={event.id} className="overflow-hidden">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg break-words">
                    {getEventDisplayTitle(event, index)}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-600">
                    {event.date && (
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{formatDate(event.date)}</span>
                      </span>
                    )}
                    {event.startTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          {event.startTime}
                          {event.endTime && ` - ${event.endTime}`}
                        </span>
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
                  {(!event.title || !event.date || !event.startTime) && (
                    <div className="flex items-center gap-1 text-amber-600 text-sm">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>Incomplete</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditEvent(event.id)}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50 flex-1 sm:flex-none"
                    >
                      <Edit2 className="h-4 w-4 sm:mr-1" />
                      <span className="sm:inline">Edit</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteEvent(event.id)}
                      className="border-red-300 text-red-700 hover:bg-red-50 flex-1 sm:flex-none"
                    >
                      <Trash2 className="h-4 w-4 sm:mr-1" />
                      <span className="sm:inline">Delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {editingEventId === event.id && (
              <CardContent className="p-6 bg-white">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Title */}
                    <div className="md:col-span-2">
                      <Label htmlFor={`title-${event.id}`}>Title *</Label>
                      <Input
                        id={`title-${event.id}`}
                        value={event.title}
                        onChange={(e) => handleUpdateEvent(event.id, { title: e.target.value })}
                        placeholder="Event title"
                        className="mt-1"
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <Label htmlFor={`description-${event.id}`}>Description</Label>
                      <Textarea
                        id={`description-${event.id}`}
                        value={event.description || ''}
                        onChange={(e) => handleUpdateEvent(event.id, { description: e.target.value })}
                        placeholder="Event description"
                        rows={3}
                        className="mt-1"
                      />
                    </div>

                    {/* Date */}
                    <div>
                      <Label htmlFor={`date-${event.id}`}>Date *</Label>
                      <Input
                        id={`date-${event.id}`}
                        type="date"
                        value={event.date}
                        onChange={(e) => handleUpdateEvent(event.id, { date: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    {/* Start Time */}
                    <div>
                      <Label htmlFor={`startTime-${event.id}`}>Start Time *</Label>
                      <Input
                        id={`startTime-${event.id}`}
                        type="time"
                        value={event.startTime}
                        onChange={(e) => handleUpdateEvent(event.id, { startTime: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    {/* End Time */}
                    <div>
                      <Label htmlFor={`endTime-${event.id}`}>End Time</Label>
                      <Input
                        id={`endTime-${event.id}`}
                        type="time"
                        value={event.endTime || ''}
                        onChange={(e) => handleUpdateEvent(event.id, { endTime: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Categories Section */}
                  <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Folder className="h-5 w-5 text-blue-600" />
                      <h4 className="font-medium text-blue-900">Categories</h4>
                    </div>
                    <DebugMultiSelect
                      options={getCategoryHierarchy().flatMap(parent => [
                        { value: parent.id, label: parent.name },
                        ...(parent.children?.map((child: any) => ({
                          value: child.id, 
                          label: `  ${child.name}`
                        })) || [])
                      ])}
                      selected={event.categoryIds || []}
                      onChange={(selected) => {
                        handleUpdateEvent(event.id, { 
                          categoryIds: selected,
                          categories: availableCategories
                            .filter(c => selected.includes(c.id))
                            .map(c => ({ id: c.id, name: c.name, color: c.color }))
                        });
                      }}
                      placeholder="Select categories"
                    />
                  </div>

                  {/* Format Section */}
                  <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-5 w-5 text-green-600" />
                      <h4 className="font-medium text-green-900">Format</h4>
                    </div>
                    <Select
                      value={event.formatId || 'none'}
                      onValueChange={(value) => {
                        if (value === 'none') {
                          handleUpdateEvent(event.id, { 
                            formatId: undefined,
                            format: ''
                          });
                        } else {
                          const format = availableFormats.find(f => f.id === value);
                          handleUpdateEvent(event.id, { 
                            formatId: value,
                            format: format?.name || ''
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No format</SelectItem>
                        {availableFormats.map((format) => (
                          <SelectItem key={format.id} value={format.id}>
                            {format.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location Section */}
                  <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-5 w-5 text-red-600" />
                      <h4 className="font-medium text-red-900">Location</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Main Location */}
                      <div>
                        <Label htmlFor={`main-location-${event.id}`}>Main Location</Label>
                        <Select
                          value={event.locationId || 'none'}
                          onValueChange={(value) => {
                            if (value === 'none') {
                              handleUpdateEvent(event.id, { 
                                locationId: undefined,
                                location: ''
                              });
                            } else {
                              const location = availableLocations.find(l => l.id === value);
                              handleUpdateEvent(event.id, { 
                                locationId: value,
                                location: location?.name || ''
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select main location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No main location</SelectItem>
                            {availableLocations.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Other Locations */}
                      <div>
                        <Label className="text-xs sm:text-sm">Other Locations</Label>
                        <DebugMultiSelect
                          options={availableLocations.map(location => ({ value: location.id, label: location.name }))}
                          selected={event.otherLocationIds || []}
                          onChange={(selected) => {
                            handleUpdateEvent(event.id, { 
                              otherLocationIds: selected,
                              otherLocations: availableLocations
                                .filter(l => selected.includes(l.id))
                                .map(l => ({ id: l.id, name: l.name }))
                            });
                          }}
                          placeholder="Select additional locations"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Organizer Section */}
                  <div className="border rounded-lg p-4 bg-purple-50 border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <UserCircle className="h-5 w-5 text-purple-600" />
                      <h4 className="font-medium text-purple-900">Organizer</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Main Organizer */}
                      <div>
                        <Label htmlFor={`main-organizer-${event.id}`}>Main Organizer</Label>
                        <Select
                          value={event.organizerId || 'none'}
                          onValueChange={(value) => {
                            if (value === 'none') {
                              handleUpdateEvent(event.id, { 
                                organizerId: undefined,
                                organizer: ''
                              });
                            } else {
                              const organizer = availableOrganizers.find(o => o.id === value);
                              handleUpdateEvent(event.id, { 
                                organizerId: value,
                                organizer: organizer?.name || ''
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select main organizer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No main organizer</SelectItem>
                            {availableOrganizers.map((organizer) => (
                              <SelectItem key={organizer.id} value={organizer.id}>
                                {organizer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Other Organizers */}
                      <div>
                        <Label className="text-xs sm:text-sm">Other Organizers</Label>
                        <DebugMultiSelect
                          options={availableOrganizers.map(organizer => ({ value: organizer.id, label: organizer.name }))}
                          selected={event.otherOrganizerIds || []}
                          onChange={(selected) => {
                            handleUpdateEvent(event.id, { 
                              otherOrganizerIds: selected,
                              otherOrganizers: availableOrganizers
                                .filter(o => selected.includes(o.id))
                                .map(o => ({ id: o.id, name: o.name }))
                            });
                          }}
                          placeholder="Select additional organizers"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Speaker Section */}
                  <div className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Mic className="h-5 w-5 text-orange-600" />
                      <h4 className="font-medium text-orange-900">Speakers</h4>
                    </div>
                    <DebugMultiSelect
                      options={availableSpeakers.map(speaker => ({ 
                        value: speaker.id, 
                        label: `${speaker.name}${speaker.role ? ` (${speaker.role})` : ''}` 
                      }))}
                      selected={event.speakerIds || []}
                      onChange={(selected) => {
                        handleUpdateEvent(event.id, { 
                          speakerIds: selected,
                          speakers: availableSpeakers
                            .filter(s => selected.includes(s.id))
                            .map(s => ({ id: s.id, name: s.name, role: s.role }))
                        });
                      }}
                      placeholder="Select speakers"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => setEditingEventId(null)}
                    className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                  >
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="sm:inline">Done Editing</span>
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
          </>
        )}

        {/* Existing Events Section */}
        {existingEvents.length > 0 && showExistingEvents && (
          <>
            <div className="flex items-center gap-2 mb-4 mt-8">
              <Database className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-gray-900">Existing Events Found ({existingEvents.length})</h3>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-800 font-medium">
                    These events appear to already exist in your database
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Review them carefully - you may want to skip these or update the existing events instead
                  </p>
                </div>
              </div>
            </div>
            {existingEvents.map((event, index) => (
          <Card key={event.id} className="overflow-hidden border-amber-200 bg-amber-50">
            <CardHeader className="bg-amber-100 border-b border-amber-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <CardTitle className="text-lg text-amber-900 break-words">
                      {getEventDisplayTitle(event, index)}
                    </CardTitle>
                    <span className="px-2 py-1 bg-amber-200 text-amber-800 text-xs font-medium rounded-full flex-shrink-0 w-fit">
                      Existing Match
                    </span>
                  </div>
                  {event.existingEventMatch?.similarityReason && (
                    <p className="text-sm text-amber-700 mb-2 break-words">
                      <strong>Match reason:</strong> {event.existingEventMatch.similarityReason}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-sm text-amber-700">
                    {event.date && (
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{formatDate(event.date)}</span>
                      </span>
                    )}
                    {event.startTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          {event.startTime}
                          {event.endTime && ` - ${event.endTime}`}
                        </span>
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
                  {(!event.title || !event.date || !event.startTime) && (
                    <div className="flex items-center gap-1 text-amber-600 text-sm">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>Incomplete</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditEvent(event.id)}
                      className="border-amber-300 text-amber-700 hover:bg-amber-100 flex-1 sm:flex-none"
                    >
                      <Edit2 className="h-4 w-4 sm:mr-1" />
                      <span className="sm:inline">Edit</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteEvent(event.id)}
                      className="border-red-300 text-red-700 hover:bg-red-50 flex-1 sm:flex-none"
                    >
                      <Trash2 className="h-4 w-4 sm:mr-1" />
                      <span className="sm:inline">Skip</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {editingEventId === event.id && (
              <CardContent className="p-6 bg-white">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Title */}
                    <div className="md:col-span-2">
                      <Label htmlFor={`title-${event.id}`}>Title *</Label>
                      <Input
                        id={`title-${event.id}`}
                        value={event.title}
                        onChange={(e) => handleUpdateEvent(event.id, { title: e.target.value })}
                        placeholder="Event title"
                        className="mt-1"
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <Label htmlFor={`description-${event.id}`}>Description</Label>
                      <Textarea
                        id={`description-${event.id}`}
                        value={event.description || ''}
                        onChange={(e) => handleUpdateEvent(event.id, { description: e.target.value })}
                        placeholder="Event description"
                        rows={3}
                        className="mt-1"
                      />
                    </div>

                    {/* Date */}
                    <div>
                      <Label htmlFor={`date-${event.id}`}>Date *</Label>
                      <Input
                        id={`date-${event.id}`}
                        type="date"
                        value={event.date}
                        onChange={(e) => handleUpdateEvent(event.id, { date: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    {/* Start Time */}
                    <div>
                      <Label htmlFor={`startTime-${event.id}`}>Start Time *</Label>
                      <Input
                        id={`startTime-${event.id}`}
                        type="time"
                        value={event.startTime}
                        onChange={(e) => handleUpdateEvent(event.id, { startTime: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    {/* End Time */}
                    <div>
                      <Label htmlFor={`endTime-${event.id}`}>End Time</Label>
                      <Input
                        id={`endTime-${event.id}`}
                        type="time"
                        value={event.endTime || ''}
                        onChange={(e) => handleUpdateEvent(event.id, { endTime: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Categories Section */}
                  <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Folder className="h-5 w-5 text-blue-600" />
                      <h4 className="font-medium text-blue-900">Categories</h4>
                    </div>
                    <DebugMultiSelect
                      options={getCategoryHierarchy().flatMap(parent => [
                        { value: parent.id, label: parent.name },
                        ...(parent.children?.map((child: any) => ({
                          value: child.id, 
                          label: `  ${child.name}`
                        })) || [])
                      ])}
                      selected={event.categoryIds || []}
                      onChange={(selected) => {
                        handleUpdateEvent(event.id, { 
                          categoryIds: selected,
                          categories: availableCategories
                            .filter(c => selected.includes(c.id))
                            .map(c => ({ id: c.id, name: c.name, color: c.color }))
                        });
                      }}
                      placeholder="Select categories"
                    />
                  </div>

                  {/* Format Section */}
                  <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-5 w-5 text-green-600" />
                      <h4 className="font-medium text-green-900">Format</h4>
                    </div>
                    <Select
                      value={event.formatId || 'none'}
                      onValueChange={(value) => {
                        if (value === 'none') {
                          handleUpdateEvent(event.id, { 
                            formatId: undefined,
                            format: ''
                          });
                        } else {
                          const format = availableFormats.find(f => f.id === value);
                          handleUpdateEvent(event.id, { 
                            formatId: value,
                            format: format?.name || ''
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No format</SelectItem>
                        {availableFormats.map((format) => (
                          <SelectItem key={format.id} value={format.id}>
                            {format.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location Section */}
                  <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-5 w-5 text-red-600" />
                      <h4 className="font-medium text-red-900">Location</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Main Location */}
                      <div>
                        <Label htmlFor={`main-location-${event.id}`}>Main Location</Label>
                        <Select
                          value={event.locationId || 'none'}
                          onValueChange={(value) => {
                            if (value === 'none') {
                              handleUpdateEvent(event.id, { 
                                locationId: undefined,
                                location: ''
                              });
                            } else {
                              const location = availableLocations.find(l => l.id === value);
                              handleUpdateEvent(event.id, { 
                                locationId: value,
                                location: location?.name || ''
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select main location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No main location</SelectItem>
                            {availableLocations.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Other Locations */}
                      <div>
                        <Label className="text-xs sm:text-sm">Other Locations</Label>
                        <DebugMultiSelect
                          options={availableLocations.map(location => ({ value: location.id, label: location.name }))}
                          selected={event.otherLocationIds || []}
                          onChange={(selected) => {
                            handleUpdateEvent(event.id, { 
                              otherLocationIds: selected,
                              otherLocations: availableLocations
                                .filter(l => selected.includes(l.id))
                                .map(l => ({ id: l.id, name: l.name }))
                            });
                          }}
                          placeholder="Select additional locations"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Organizer Section */}
                  <div className="border rounded-lg p-4 bg-purple-50 border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <UserCircle className="h-5 w-5 text-purple-600" />
                      <h4 className="font-medium text-purple-900">Organizer</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Main Organizer */}
                      <div>
                        <Label htmlFor={`main-organizer-${event.id}`}>Main Organizer</Label>
                        <Select
                          value={event.organizerId || 'none'}
                          onValueChange={(value) => {
                            if (value === 'none') {
                              handleUpdateEvent(event.id, { 
                                organizerId: undefined,
                                organizer: ''
                              });
                            } else {
                              const organizer = availableOrganizers.find(o => o.id === value);
                              handleUpdateEvent(event.id, { 
                                organizerId: value,
                                organizer: organizer?.name || ''
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select main organizer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No main organizer</SelectItem>
                            {availableOrganizers.map((organizer) => (
                              <SelectItem key={organizer.id} value={organizer.id}>
                                {organizer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Other Organizers */}
                      <div>
                        <Label className="text-xs sm:text-sm">Other Organizers</Label>
                        <DebugMultiSelect
                          options={availableOrganizers.map(organizer => ({ value: organizer.id, label: organizer.name }))}
                          selected={event.otherOrganizerIds || []}
                          onChange={(selected) => {
                            handleUpdateEvent(event.id, { 
                              otherOrganizerIds: selected,
                              otherOrganizers: availableOrganizers
                                .filter(o => selected.includes(o.id))
                                .map(o => ({ id: o.id, name: o.name }))
                            });
                          }}
                          placeholder="Select additional organizers"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Speaker Section */}
                  <div className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Mic className="h-5 w-5 text-orange-600" />
                      <h4 className="font-medium text-orange-900">Speakers</h4>
                    </div>
                    <DebugMultiSelect
                      options={availableSpeakers.map(speaker => ({ 
                        value: speaker.id, 
                        label: `${speaker.name}${speaker.role ? ` (${speaker.role})` : ''}` 
                      }))}
                      selected={event.speakerIds || []}
                      onChange={(selected) => {
                        handleUpdateEvent(event.id, { 
                          speakerIds: selected,
                          speakers: availableSpeakers
                            .filter(s => selected.includes(s.id))
                            .map(s => ({ id: s.id, name: s.name, role: s.role }))
                        });
                      }}
                      placeholder="Select speakers"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => setEditingEventId(null)}
                    className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                  >
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="sm:inline">Done Editing</span>
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
          </>
        )}
      </div>

      {/* Action Buttons */}
      <Card className="bg-gray-50 border-gray-300">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleConfirm}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm sm:text-lg py-4 sm:py-6"
              disabled={newEvents.length === 0}
            >
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
              <span className="break-words text-center">
                Continue to Confirmation ({newEvents.length} new event{newEvents.length > 1 ? 's' : ''})
              </span>
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              className="w-full border-gray-400 text-gray-700 text-sm sm:text-base py-4 sm:py-6"
            >
              Cancel & Start Over
            </Button>
          </div>
          
          {!validateEvents() && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Some new events are missing required fields (title, date, start time). 
                Please edit these events before continuing.
                {existingEvents.length > 0 && (
                  <span className="block mt-1">
                    Note: Existing events are shown separately and can be skipped if needed.
                  </span>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

