// Supabase Events API Integration
// This file contains all functions to interact with the events database

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =====================================================
// TYPES
// =====================================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  description: string;
  color: string;
  created_at?: string;
  updated_at?: string;
}

export interface Format {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  description: string;
  color: string;
  created_at?: string;
  updated_at?: string;
}

export interface Speaker {
  id: string;
  name: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface Organizer {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Event {
  id?: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  hide_time: boolean;
  hide_end_time: boolean;
  time_notes: string;
  location_id: string | null;
  other_location_ids: string[];
  hide_location: boolean;
  organizer_id: string | null;
  other_organizer_ids: string[];
  hide_organizer: boolean;
  category_id: string | null;
  format_id: string | null;
  speaker_ids: string[];
  hide_speakers: boolean;
  event_link: string;
  more_info_link: string;
  more_info_target: 'current' | 'new';
  event_status: 'scheduled' | 'rescheduled' | 'postponed' | 'cancelled' | 'moved-online';
  attendees: number;
  status: 'draft' | 'published' | 'cancelled';
  author_id?: string;
  author_name?: string;
  created_at?: string;
  updated_at?: string;
  // Booking fields
  booking_enabled?: boolean;
  booking_button_label?: string;
  booking_capacity?: number | null;
  booking_deadline_hours?: number;
  allow_waitlist?: boolean;
  confirmation_checkbox_1_text?: string;
  confirmation_checkbox_1_required?: boolean;
  confirmation_checkbox_2_text?: string;
  confirmation_checkbox_2_required?: boolean;
  cancellation_deadline_hours?: number;
  allowed_roles?: string[] | null;
  approval_mode?: 'auto' | 'manual';
}

// =====================================================
// CATEGORIES
// =====================================================

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data as Category[];
}

export async function getCategoriesWithCounts() {
  const { data, error } = await supabase
    .from('categories_with_counts')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data;
}

export async function createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select()
    .single();
  
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(id: string, updates: Partial<Category>) {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// =====================================================
// FORMATS
// =====================================================

export async function getFormats() {
  const { data, error } = await supabase
    .from('formats')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data as Format[];
}

export async function getFormatsWithCounts() {
  const { data, error } = await supabase
    .from('formats_with_counts')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data;
}

export async function createFormat(format: Omit<Format, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('formats')
    .insert([format])
    .select()
    .single();
  
  if (error) throw error;
  return data as Format;
}

export async function updateFormat(id: string, updates: Partial<Format>) {
  const { data, error } = await supabase
    .from('formats')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Format;
}

export async function deleteFormat(id: string) {
  const { error } = await supabase
    .from('formats')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// =====================================================
// SPEAKERS
// =====================================================

export async function getSpeakers() {
  const { data, error } = await supabase
    .from('speakers')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data as Speaker[];
}

export async function createSpeaker(speaker: Omit<Speaker, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('speakers')
    .insert([speaker])
    .select()
    .single();
  
  if (error) throw error;
  return data as Speaker;
}

export async function deleteSpeaker(id: string) {
  const { error } = await supabase
    .from('speakers')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// =====================================================
// LOCATIONS
// =====================================================

export async function getLocations() {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data as Location[];
}

export async function createLocation(locationData: {
  name: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const { data, error } = await supabase
    .from('locations')
    .insert([locationData])
    .select()
    .single();
  
  if (error) throw error;
  return data as Location;
}

export async function deleteLocation(id: string) {
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// =====================================================
// ORGANIZERS
// =====================================================

export async function getOrganizers() {
  const { data, error } = await supabase
    .from('organizers')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data as Organizer[];
}

export async function createOrganizer(name: string) {
  const { data, error } = await supabase
    .from('organizers')
    .insert([{ name }])
    .select()
    .single();
  
  if (error) throw error;
  return data as Organizer;
}

export async function deleteOrganizer(id: string) {
  const { error } = await supabase
    .from('organizers')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// =====================================================
// EVENTS
// =====================================================

export async function getEvents(filters?: {
  status?: string;
  category_id?: string;
  format_id?: string;
  location_id?: string;
  organizer_id?: string;
  date_from?: string;
  date_to?: string;
}) {
  let query = supabase
    .from('events_with_details')
    .select('*')
    .order('date', { ascending: true });

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id);
  }
  if (filters?.format_id) {
    query = query.eq('format_id', filters.format_id);
  }
  if (filters?.location_id) {
    query = query.eq('location_id', filters.location_id);
  }
  if (filters?.organizer_id) {
    query = query.eq('organizer_id', filters.organizer_id);
  }
  if (filters?.date_from) {
    query = query.gte('date', filters.date_from);
  }
  if (filters?.date_to) {
    query = query.lte('date', filters.date_to);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}

export async function getEventById(id: string) {
  const { data, error } = await supabase
    .from('events_with_details')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createEvent(event: Omit<Event, 'id' | 'created_at' | 'updated_at'>, speakerIds: string[]) {
  // Insert the event
  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .insert([{
      title: event.title,
      description: event.description,
      date: event.date,
      start_time: event.start_time,
      end_time: event.end_time,
      is_all_day: event.is_all_day,
      hide_time: event.hide_time,
      hide_end_time: event.hide_end_time,
      time_notes: event.time_notes,
      location_id: event.location_id,
      other_location_ids: event.other_location_ids,
      hide_location: event.hide_location,
      organizer_id: event.organizer_id,
      other_organizer_ids: event.other_organizer_ids,
      hide_organizer: event.hide_organizer,
      category_id: event.category_id,
      format_id: event.format_id,
      hide_speakers: event.hide_speakers,
      event_link: event.event_link,
      more_info_link: event.more_info_link,
      more_info_target: event.more_info_target,
      event_status: event.event_status,
      attendees: event.attendees || 0,
      status: event.status,
      author_id: event.author_id,
      author_name: event.author_name,
      // Booking fields
      booking_enabled: event.booking_enabled,
      booking_button_label: event.booking_button_label,
      booking_capacity: event.booking_capacity,
      booking_deadline_hours: event.booking_deadline_hours,
      allow_waitlist: event.allow_waitlist,
      confirmation_checkbox_1_text: event.confirmation_checkbox_1_text,
      confirmation_checkbox_1_required: event.confirmation_checkbox_1_required,
      confirmation_checkbox_2_text: event.confirmation_checkbox_2_text,
      confirmation_checkbox_2_required: event.confirmation_checkbox_2_required,
      cancellation_deadline_hours: event.cancellation_deadline_hours,
      allowed_roles: event.allowed_roles,
      approval_mode: event.approval_mode
    }])
    .select()
    .single();
  
  if (eventError) throw eventError;

  // Add speakers to the event
  if (speakerIds && speakerIds.length > 0) {
    const speakerRecords = speakerIds.map(speakerId => ({
      event_id: eventData.id,
      speaker_id: speakerId
    }));

    const { error: speakersError } = await supabase
      .from('event_speakers')
      .insert(speakerRecords);
    
    if (speakersError) throw speakersError;
  }

  return eventData;
}

export async function updateEvent(id: string, event: Partial<Event>, speakerIds?: string[]) {
  // Update the event
  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .update({
      title: event.title,
      description: event.description,
      date: event.date,
      start_time: event.start_time,
      end_time: event.end_time,
      is_all_day: event.is_all_day,
      hide_time: event.hide_time,
      hide_end_time: event.hide_end_time,
      time_notes: event.time_notes,
      location_id: event.location_id,
      other_location_ids: event.other_location_ids,
      hide_location: event.hide_location,
      organizer_id: event.organizer_id,
      other_organizer_ids: event.other_organizer_ids,
      hide_organizer: event.hide_organizer,
      category_id: event.category_id,
      format_id: event.format_id,
      hide_speakers: event.hide_speakers,
      event_link: event.event_link,
      more_info_link: event.more_info_link,
      more_info_target: event.more_info_target,
      event_status: event.event_status,
      status: event.status,
      // Booking fields
      booking_enabled: event.booking_enabled,
      booking_button_label: event.booking_button_label,
      booking_capacity: event.booking_capacity,
      booking_deadline_hours: event.booking_deadline_hours,
      allow_waitlist: event.allow_waitlist,
      confirmation_checkbox_1_text: event.confirmation_checkbox_1_text,
      confirmation_checkbox_1_required: event.confirmation_checkbox_1_required,
      confirmation_checkbox_2_text: event.confirmation_checkbox_2_text,
      confirmation_checkbox_2_required: event.confirmation_checkbox_2_required,
      cancellation_deadline_hours: event.cancellation_deadline_hours,
      allowed_roles: event.allowed_roles,
      approval_mode: event.approval_mode
    })
    .eq('id', id)
    .select()
    .single();
  
  if (eventError) throw eventError;

  // Update speakers if provided
  if (speakerIds !== undefined) {
    // Delete existing speaker associations
    await supabase
      .from('event_speakers')
      .delete()
      .eq('event_id', id);

    // Add new speaker associations
    if (speakerIds.length > 0) {
      const speakerRecords = speakerIds.map(speakerId => ({
        event_id: id,
        speaker_id: speakerId
      }));

      const { error: speakersError } = await supabase
        .from('event_speakers')
        .insert(speakerRecords);
      
      if (speakersError) throw speakersError;
    }
  }

  return eventData;
}

export async function deleteEvent(id: string) {
  // Delete event (cascade will handle event_speakers)
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

// Get location ID by name (or create if doesn't exist)
export async function getOrCreateLocation(name: string): Promise<string> {
  if (!name) return '';
  
  // Try to find existing location
  const { data: existing, error: findError } = await supabase
    .from('locations')
    .select('id')
    .eq('name', name)
    .single();
  
  if (existing) return existing.id;
  
  // Create new location if not found
  const { data: newLocation, error: createError } = await supabase
    .from('locations')
    .insert([{ name }])
    .select('id')
    .single();
  
  if (createError) throw createError;
  return newLocation.id;
}

// Get organizer ID by name (or create if doesn't exist)
export async function getOrCreateOrganizer(name: string): Promise<string> {
  if (!name) return '';
  
  const { data: existing, error: findError } = await supabase
    .from('organizers')
    .select('id')
    .eq('name', name)
    .single();
  
  if (existing) return existing.id;
  
  const { data: newOrganizer, error: createError } = await supabase
    .from('organizers')
    .insert([{ name }])
    .select('id')
    .single();
  
  if (createError) throw createError;
  return newOrganizer.id;
}

// Get category ID by name
export async function getCategoryIdByName(name: string): Promise<string | null> {
  if (!name) return null;
  
  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('name', name)
    .single();
  
  if (error || !data) return null;
  return data.id;
}

// Get format ID by name
export async function getFormatIdByName(name: string): Promise<string | null> {
  if (!name) return null;
  
  const { data, error } = await supabase
    .from('formats')
    .select('id')
    .eq('name', name)
    .single();
  
  if (error || !data) return null;
  return data.id;
}

// Get speaker IDs by names
export async function getSpeakerIdsByNames(names: string[]): Promise<string[]> {
  if (!names || names.length === 0) return [];
  
  const { data, error } = await supabase
    .from('speakers')
    .select('id, name')
    .in('name', names);
  
  if (error || !data) return [];
  return data.map(s => s.id);
}

// =====================================================
// MIGRATION HELPER - Convert localStorage to Supabase
// =====================================================

export async function migrateLocalStorageToSupabase() {
  try {
    // Get data from localStorage
    const eventsJson = localStorage.getItem('events');
    const eventDataJson = localStorage.getItem('eventData');
    
    if (!eventsJson && !eventDataJson) {
      return { success: false, message: 'No data found in localStorage' };
    }

    let migratedCount = 0;

    // Migrate event data (categories, formats, etc.)
    if (eventDataJson) {
      const eventData = JSON.parse(eventDataJson);
      
      // Migrate categories
      if (eventData.categories) {
        for (const cat of eventData.categories) {
          await createCategory({
            name: cat.name,
            slug: cat.slug,
            parent_id: null, // Handle parent mapping if needed
            description: cat.description || '',
            color: cat.color || ''
          });
        }
      }

      // Migrate formats
      if (eventData.formats) {
        for (const fmt of eventData.formats) {
          await createFormat({
            name: fmt.name,
            slug: fmt.slug,
            parent_id: null,
            description: fmt.description || '',
            color: fmt.color || ''
          });
        }
      }

      // Migrate speakers
      if (eventData.speakers) {
        for (const speaker of eventData.speakers) {
          if (typeof speaker === 'string') {
            // Old format - just name
            await createSpeaker({ name: speaker, role: 'Speaker' });
          } else {
            // New format - with role
            await createSpeaker({ name: speaker.name, role: speaker.role });
          }
        }
      }

      // Migrate locations
      if (eventData.locations) {
        for (const location of eventData.locations) {
          if (typeof location === 'string') {
            // Old format - just name
            await createLocation({ name: location });
          } else {
            // New format - with full details
            await createLocation(location);
          }
        }
      }

      // Migrate organizers
      if (eventData.organizers) {
        for (const organizer of eventData.organizers) {
          await createOrganizer(organizer);
        }
      }
    }

    // Migrate events
    if (eventsJson) {
      const events = JSON.parse(eventsJson);
      
      for (const event of events) {
        // Get or create related IDs
        const locationId = await getOrCreateLocation(event.location);
        const organizerId = await getOrCreateOrganizer(event.organizer);
        const categoryId = await getCategoryIdByName(event.category);
        const formatId = await getFormatIdByName(event.format);
        const speakerIds = await getSpeakerIdsByNames(event.speakers || []);

        await createEvent({
          title: event.title,
          description: event.description,
          date: event.date,
          start_time: event.startTime,
          end_time: event.endTime,
          is_all_day: event.isAllDay || false,
          hide_time: event.hideTime || false,
          hide_end_time: event.hideEndTime || false,
          time_notes: event.timeNotes || '',
          location_id: locationId,
          other_location_ids: [],
          hide_location: event.hideLocation ?? false,
          organizer_id: organizerId,
          other_organizer_ids: [],
          hide_organizer: event.hideOrganizer ?? false,
          category_id: categoryId,
          format_id: formatId,
          speaker_ids: speakerIds,
          hide_speakers: event.hideSpeakers ?? false,
          event_link: event.eventLink || '',
          more_info_link: event.moreInfoLink || '',
          more_info_target: event.moreInfoTarget || 'current',
          event_status: event.eventStatus || 'scheduled',
          attendees: event.attendees || 0,
          status: 'published',
          author_name: event.author || 'Unknown'
        }, speakerIds);

        migratedCount++;
      }
    }

    return { 
      success: true, 
      message: `Successfully migrated ${migratedCount} events to Supabase` 
    };
  } catch (error: any) {
    return { 
      success: false, 
      message: `Migration failed: ${error.message}` 
    };
  }
}




