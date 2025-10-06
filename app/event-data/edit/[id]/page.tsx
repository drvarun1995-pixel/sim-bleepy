"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAdmin } from "@/lib/useAdmin";
import type { Location } from "@/lib/supabase-events";
import { 
  getCategories, 
  getFormats, 
  getSpeakers, 
  getLocations, 
  getOrganizers,
  getEvents,
  updateEvent,
  getCategoryIdByName,
  getFormatIdByName,
  getSpeakerIdsByNames,
  getOrCreateLocation,
  getOrCreateOrganizer
} from "@/lib/events-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DebugMultiSelect } from "@/components/ui/debug-multi-select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { 
  Calendar,
  ArrowLeft,
  Save,
  Loader2
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent: string;
  description: string;
  color: string;
  count: number;
}

interface Format {
  id: string;
  name: string;
  slug: string;
  parent: string;
  description: string;
  color: string;
  count: number;
}

interface Speaker {
  id: string;
  name: string;
  role: string;
  count?: number;
}

interface EventData {
  categories: Category[];
  formats: Format[];
  locations: Location[];
  speakers: Speaker[];
  organizers: string[];
}

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { data: session } = useSession();
  const isAdmin = useAdmin();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventData, setEventData] = useState<EventData>({
    categories: [],
    formats: [],
    locations: [],
    speakers: [],
    organizers: [],
  });

  // Event form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [hideTime, setHideTime] = useState(false);
  const [hideEndTime, setHideEndTime] = useState(false);
  const [timeNotes, setTimeNotes] = useState("");
  const [location, setLocation] = useState("");
  const [additionalLocations, setAdditionalLocations] = useState<string[]>([]);
  const [hideLocation, setHideLocation] = useState(false);
  const [organizer, setOrganizer] = useState("");
  const [additionalOrganizers, setAdditionalOrganizers] = useState<string[]>([]);
  const [hideOrganizer, setHideOrganizer] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [format, setFormat] = useState("");
  const [speakers, setSpeakers] = useState<string[]>([]);
  const [hideSpeakers, setHideSpeakers] = useState(false);
  const [attendees, setAttendees] = useState(0);
  const [status, setStatus] = useState<'draft' | 'published' | 'cancelled'>('published');
  const [eventLink, setEventLink] = useState("");
  const [moreInfoLink, setMoreInfoLink] = useState("");
  const [moreInfoTarget, setMoreInfoTarget] = useState<'current' | 'new'>('new');
  const [eventStatus, setEventStatus] = useState<'scheduled' | 'rescheduled' | 'postponed' | 'cancelled' | 'moved-online'>('scheduled');

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all event data
        const [categoriesData, formatsData, locationsData, speakersData, organizersData, eventsData] = await Promise.all([
          getCategories(),
          getFormats(),
          getLocations(),
          getSpeakers(),
          getOrganizers(),
          getEvents()
        ]);

        setEventData({
          categories: categoriesData,
          formats: formatsData,
          locations: locationsData,
          speakers: speakersData,
          organizers: organizersData.map((org: any) => org.name),
        });

        // Find and load the event to edit
        const eventToEdit = eventsData.find((e: any) => e.id === eventId);
        if (eventToEdit) {
          loadEventForEditing(eventToEdit);
        } else {
          alert('Event not found');
          router.push('/event-data');
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to load event data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, isAdmin]);

  const loadEventForEditing = (event: any) => {
    setTitle(event.title || '');
    setDescription(event.description || '');
    setDate(event.date || '');
    setStartTime(event.start_time || '');
    setEndTime(event.end_time || '');
    setIsAllDay(event.is_all_day || false);
    setHideTime(event.hide_time || false);
    setHideEndTime(event.hide_end_time || false);
    setTimeNotes(event.time_notes || '');
    setLocation(event.location_name || '');
    setAdditionalLocations(event.locations?.map((loc: any) => loc.name).filter((name: string) => name !== event.location_name) || []);
    setHideLocation(event.hide_location || false);
    setOrganizer(event.organizer_name || '');
    setAdditionalOrganizers(event.organizers?.map((org: any) => org.name).filter((name: string) => name !== event.organizer_name) || []);
    setHideOrganizer(event.hide_organizer || false);
    setSelectedCategories(event.categories?.map((cat: any) => cat.name) || []);
    setFormat(event.format_name || '');
    setSpeakers(event.speakers?.map((speaker: any) => speaker.name) || []);
    setHideSpeakers(event.hide_speakers || false);
    setAttendees(event.attendees || 0);
    setStatus(event.status || 'published');
    setEventLink(event.event_link || '');
    setMoreInfoLink(event.more_info_link || '');
    setMoreInfoTarget(event.more_info_target || 'new');
    setEventStatus(event.event_status || 'scheduled');
  };

  const handleSaveEvent = async () => {
    if (!title || !date) {
      alert("Title and date are required");
      return;
    }

    try {
      setSaving(true);

      // Get category IDs
      const categoryIds: string[] = [];
      for (const categoryName of selectedCategories) {
        const categoryId = await getCategoryIdByName(categoryName);
        if (categoryId) {
          categoryIds.push(categoryId);
        }
      }

      // Get format ID
      const formatId = format ? await getFormatIdByName(format) : null;

      // Get speaker IDs
      const speakerIds = speakers.length > 0 ? await getSpeakerIdsByNames(speakers) : [];

      // Get or create main location
      const mainLocationId = location ? await getOrCreateLocation(location) : null;

      // Get or create additional locations
      const additionalLocationIds: string[] = [];
      for (const loc of additionalLocations) {
        if (loc && loc.trim()) {
          const locId = await getOrCreateLocation(loc);
          if (locId) {
            additionalLocationIds.push(locId);
          }
        }
      }

      // Combine all location IDs (main + additional)
      const allLocationIds = [
        ...(mainLocationId ? [mainLocationId] : []),
        ...additionalLocationIds
      ];

      // Get or create main organizer
      const mainOrganizerId = organizer ? await getOrCreateOrganizer(organizer) : null;

      // Get or create additional organizers
      const additionalOrganizerIds: string[] = [];
      for (const org of additionalOrganizers) {
        if (org && org.trim()) {
          const orgId = await getOrCreateOrganizer(org);
          if (orgId) {
            additionalOrganizerIds.push(orgId);
          }
        }
      }

      // Combine all organizer IDs (main + additional)
      const allOrganizerIds = [
        ...(mainOrganizerId ? [mainOrganizerId] : []),
        ...additionalOrganizerIds
      ];

      // Update event
      await updateEvent(eventId, {
        title,
        description,
        date,
        start_time: startTime || null,
        end_time: endTime || null,
        is_all_day: isAllDay,
        hide_time: hideTime,
        hide_end_time: hideEndTime,
        time_notes: timeNotes || null,
        location_id: mainLocationId,
        location_ids: allLocationIds,
        hide_location: hideLocation,
        organizer_id: mainOrganizerId,
        organizer_ids: allOrganizerIds,
        hide_organizer: hideOrganizer,
        category_ids: categoryIds,
        format_id: formatId,
        speaker_ids: speakerIds,
        hide_speakers: hideSpeakers,
        attendees: attendees || 0,
        status,
        event_link: eventLink || null,
        more_info_link: moreInfoLink || null,
        more_info_target: moreInfoTarget,
        event_status: eventStatus,
      });

      alert('Event updated successfully!');
      router.push(`/events/${eventId}`);
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-7 w-7 text-purple-600" />
              Edit Event
            </h1>
            <p className="text-gray-600 mt-1">Update event details</p>
          </div>
        </div>
        <Button
          onClick={handleSaveEvent}
          disabled={saving}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Event Form */}
      <Card>
        <CardHeader>
          <CardTitle>Event Information</CardTitle>
          <CardDescription>Update the event details below</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event title"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Enter event description..."
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isAllDay}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isAllDay || hideEndTime}
              />
            </div>
          </div>

          {/* Time Options */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAllDay"
                checked={isAllDay}
                onCheckedChange={(checked) => setIsAllDay(checked as boolean)}
              />
              <Label htmlFor="isAllDay" className="cursor-pointer">All Day Event</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hideTime"
                checked={hideTime}
                onCheckedChange={(checked) => setHideTime(checked as boolean)}
              />
              <Label htmlFor="hideTime" className="cursor-pointer">Hide Time</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hideEndTime"
                checked={hideEndTime}
                onCheckedChange={(checked) => setHideEndTime(checked as boolean)}
              />
              <Label htmlFor="hideEndTime" className="cursor-pointer">Hide End Time</Label>
            </div>
          </div>

          {/* Time Notes */}
          <div className="space-y-2">
            <Label htmlFor="timeNotes">Time Notes</Label>
            <Input
              id="timeNotes"
              value={timeNotes}
              onChange={(e) => setTimeNotes(e.target.value)}
              placeholder="e.g., Times may vary"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Main Location</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                {eventData.locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.name}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Locations */}
          <div className="space-y-2">
            <Label>Additional Locations</Label>
            <DebugMultiSelect
              options={eventData.locations.map(loc => loc.name).filter(name => name !== location)}
              selectedValues={additionalLocations}
              onChange={setAdditionalLocations}
              placeholder="Select additional locations"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hideLocation"
              checked={hideLocation}
              onCheckedChange={(checked) => setHideLocation(checked as boolean)}
            />
            <Label htmlFor="hideLocation" className="cursor-pointer">Hide Location</Label>
          </div>

          {/* Organizer */}
          <div className="space-y-2">
            <Label htmlFor="organizer">Main Organizer</Label>
            <Select value={organizer} onValueChange={setOrganizer}>
              <SelectTrigger>
                <SelectValue placeholder="Select an organizer" />
              </SelectTrigger>
              <SelectContent>
                {eventData.organizers.map((org, index) => (
                  <SelectItem key={index} value={org}>
                    {org}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Organizers */}
          <div className="space-y-2">
            <Label>Additional Organizers</Label>
            <DebugMultiSelect
              options={eventData.organizers.filter(name => name !== organizer)}
              selectedValues={additionalOrganizers}
              onChange={setAdditionalOrganizers}
              placeholder="Select additional organizers"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hideOrganizer"
              checked={hideOrganizer}
              onCheckedChange={(checked) => setHideOrganizer(checked as boolean)}
            />
            <Label htmlFor="hideOrganizer" className="cursor-pointer">Hide Organizer</Label>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label>Categories</Label>
            <DebugMultiSelect
              options={eventData.categories.map(cat => cat.name)}
              selectedValues={selectedCategories}
              onChange={setSelectedCategories}
              placeholder="Select categories"
            />
          </div>

          {/* Format */}
          <div className="space-y-2">
            <Label htmlFor="format">Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Select a format" />
              </SelectTrigger>
              <SelectContent>
                {eventData.formats.map((fmt) => (
                  <SelectItem key={fmt.id} value={fmt.name}>
                    {fmt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Speakers */}
          <div className="space-y-2">
            <Label>Speakers</Label>
            <DebugMultiSelect
              options={eventData.speakers.map(speaker => speaker.name)}
              selectedValues={speakers}
              onChange={setSpeakers}
              placeholder="Select speakers"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hideSpeakers"
              checked={hideSpeakers}
              onCheckedChange={(checked) => setHideSpeakers(checked as boolean)}
            />
            <Label htmlFor="hideSpeakers" className="cursor-pointer">Hide Speakers</Label>
          </div>

          {/* Attendees */}
          <div className="space-y-2">
            <Label htmlFor="attendees">Expected Attendees</Label>
            <Input
              id="attendees"
              type="number"
              value={attendees}
              onChange={(e) => setAttendees(parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Event Status */}
          <div className="space-y-2">
            <Label htmlFor="eventStatus">Event Status</Label>
            <Select value={eventStatus} onValueChange={(value: any) => setEventStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="rescheduled">Rescheduled</SelectItem>
                <SelectItem value="postponed">Postponed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="moved-online">Moved Online</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eventLink">Event Link</Label>
              <Input
                id="eventLink"
                type="url"
                value={eventLink}
                onChange={(e) => setEventLink(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="moreInfoLink">More Info Link</Label>
              <Input
                id="moreInfoLink"
                type="url"
                value={moreInfoLink}
                onChange={(e) => setMoreInfoLink(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="moreInfoTarget">Open More Info Link In</Label>
              <Select value={moreInfoTarget} onValueChange={(value: any) => setMoreInfoTarget(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Tab</SelectItem>
                  <SelectItem value="new">New Tab</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button at Bottom */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSaveEvent}
          disabled={saving}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

