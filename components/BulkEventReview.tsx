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
  Mic
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface ExtractedEvent {
  id: string; // temporary ID for tracking
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime?: string; // HH:MM
  location?: string;
  locationId?: string;
  speakers?: string[];
  speakerIds?: string[];
  category?: string;
  categoryId?: string;
  format?: string;
  formatId?: string;
  organizer?: string;
  organizerId?: string;
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
      alert('Please ensure all events have a title, date, and start time.');
      return;
    }
    
    onConfirm(events);
  };
  
  
  const getEventDisplayTitle = (event: ExtractedEvent, index: number) => {
    if (event.format) {
      return `${event.format}: ${event.title}`;
    }
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
                  Review and edit the extracted information below
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-bold text-green-600">
                {events.filter(e => e.title && e.date && e.startTime).length} / {events.length} Valid
              </p>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Events List */}
      <div className="space-y-4">
        {events.map((event, index) => (
          <Card key={event.id} className="overflow-hidden">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {getEventDisplayTitle(event, index)}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                    {event.date && (
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {formatDate(event.date)}
                      </span>
                    )}
                    {event.startTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {event.startTime}
                        {event.endTime && ` - ${event.endTime}`}
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(!event.title || !event.date || !event.startTime) && (
                    <div className="flex items-center gap-1 text-amber-600 text-sm mr-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Incomplete</span>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditEvent(event.id)}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteEvent(event.id)}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {editingEventId === event.id && (
              <CardContent className="p-6 bg-white">
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

                  {/* Location */}
                  <div>
                    <Label htmlFor={`location-${event.id}`}>Location</Label>
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
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No location</SelectItem>
                        {availableLocations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category */}
                  <div>
                    <Label htmlFor={`category-${event.id}`}>Category</Label>
                    <Select
                      value={event.categoryId || 'none'}
                      onValueChange={(value) => {
                        if (value === 'none') {
                          handleUpdateEvent(event.id, { 
                            categoryId: undefined,
                            category: ''
                          });
                        } else {
                          const category = availableCategories.find(c => c.id === value);
                          handleUpdateEvent(event.id, { 
                            categoryId: value,
                            category: category?.name || ''
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No category</SelectItem>
                        {availableCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Format */}
                  <div>
                    <Label htmlFor={`format-${event.id}`}>Format</Label>
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
                      <SelectTrigger className="mt-1">
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

                  {/* Organizer */}
                  <div>
                    <Label htmlFor={`organizer-${event.id}`}>Organizer</Label>
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
                        <SelectValue placeholder="Select organizer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No organizer</SelectItem>
                        {availableOrganizers.map((organizer) => (
                          <SelectItem key={organizer.id} value={organizer.id}>
                            {organizer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => setEditingEventId(null)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Done Editing
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <Card className="bg-gray-50 border-gray-300">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg py-6"
              disabled={events.length === 0}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Continue to Confirmation ({events.length} event{events.length > 1 ? 's' : ''})
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 border-gray-400 text-gray-700"
            >
              Cancel & Start Over
            </Button>
          </div>
          
          {!validateEvents() && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Some events are missing required fields (title, date, start time). 
                Please edit these events before continuing.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

