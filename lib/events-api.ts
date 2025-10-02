import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

// =====================================================
// CATEGORIES
// =====================================================

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories_with_counts')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data;
}

export async function createCategory(category: {
  name: string;
  slug: string;
  parent_id?: string | null;
  description?: string;
  color?: string;
}) {
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateCategory(id: string, updates: {
  name?: string;
  slug?: string;
  parent_id?: string | null;
  description?: string;
  color?: string;
}) {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
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
    .from('formats_with_counts')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data;
}

export async function createFormat(format: {
  name: string;
  slug: string;
  parent_id?: string | null;
  description?: string;
  color?: string;
}) {
  const { data, error } = await supabase
    .from('formats')
    .insert([format])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateFormat(id: string, updates: {
  name?: string;
  slug?: string;
  parent_id?: string | null;
  description?: string;
  color?: string;
}) {
  const { data, error } = await supabase
    .from('formats')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
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
  return data;
}

export async function createSpeaker(speaker: {
  name: string;
  role: string;
}) {
  const { data, error } = await supabase
    .from('speakers')
    .insert([speaker])
    .select()
    .single();
  
  if (error) throw error;
  return data;
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
  return data;
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
  return data;
}

export async function updateLocation(id: string, updates: {
  name?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const { data, error } = await supabase
    .from('locations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
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
  return data;
}

export async function createOrganizer(name: string) {
  const { data, error } = await supabase
    .from('organizers')
    .insert([{ name }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
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
  event_status?: string;
  start_date?: string;
  end_date?: string;
}) {
  let query = supabase
    .from('events_with_details')
    .select('*')
    .order('date', { ascending: false });

  if (filters?.status) {
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
  if (filters?.event_status) {
    query = query.eq('event_status', filters.event_status);
  }
  if (filters?.start_date) {
    query = query.gte('date', filters.start_date);
  }
  if (filters?.end_date) {
    query = query.lte('date', filters.end_date);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  // Get author information separately if needed
  if (data && data.length > 0) {
    const authorIds = Array.from(new Set(data.map(event => event.author_id).filter(Boolean)));
    if (authorIds.length > 0) {
      const { data: authors, error: authorError } = await supabase
        .from('users')
        .select('id, email, name')
        .in('id', authorIds);
      
      if (authorError) {
        console.warn('Could not fetch author information:', authorError.message);
        // Fallback: Set author to a default value based on known admin ID
        data.forEach(event => {
          if (event.author_id === '02c99dc5-1a2b-4e42-8965-f46ac1f84858') {
            event.author = { id: event.author_id, email: 'drvarun1995@gmail.com', name: 'Dr. Varun' };
          }
        });
      } else if (authors && authors.length > 0) {
        // Add author information to events
        data.forEach(event => {
          if (event.author_id && authors) {
            const author = authors.find(a => a.id === event.author_id);
            if (author) {
              event.author = author;
            }
          }
        });
      } else {
        // Fallback: Set author to a default value based on known admin ID
        data.forEach(event => {
          if (event.author_id === '02c99dc5-1a2b-4e42-8965-f46ac1f84858') {
            event.author = { id: event.author_id, email: 'drvarun1995@gmail.com', name: 'Dr. Varun' };
          }
        });
      }
    }
  }
  
  return data;
}

export async function getEventById(id: string) {
  const { data, error } = await supabase
    .from('events_with_details')
    .select(`
      *,
      locations:location_id (
        id,
        name,
        address,
        latitude,
        longitude
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createEvent(event: {
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time: string;
  is_all_day?: boolean;
  hide_time?: boolean;
  hide_end_time?: boolean;
  time_notes?: string;
  location_id?: string;
  other_location_ids?: string[];
  hide_location?: boolean;
  organizer_id?: string;
  other_organizer_ids?: string[];
  hide_organizer?: boolean;
  category_id?: string;
  category_ids?: string[]; // Multiple categories
  format_id?: string;
  speaker_ids?: string[];
  hide_speakers?: boolean;
  event_link?: string;
  more_info_link?: string;
  more_info_target?: 'current' | 'new';
  event_status?: string;
  status?: string;
  author_id?: string;
  author_name?: string;
}) {
  // Extract speaker IDs, category IDs, location IDs, and organizer IDs before inserting event
  const speakerIds = event.speaker_ids || [];
  const categoryIds = event.category_ids || [];
  const locationIds = event.location_ids || [];
  const organizerIds = event.organizer_ids || [];
  const eventData = { ...event };
  delete (eventData as any).speaker_ids;
  delete (eventData as any).category_ids;
  delete (eventData as any).location_ids;
  delete (eventData as any).organizer_ids;

  // Insert event
  const { data: newEvent, error: eventError } = await supabase
    .from('events')
    .insert([eventData])
    .select()
    .single();
  
  if (eventError) throw eventError;

  // Link categories to event
  if (categoryIds.length > 0 && newEvent) {
    const categoryLinks = categoryIds.map(categoryId => ({
      event_id: newEvent.id,
      category_id: categoryId
    }));

    const { error: categoriesError } = await supabase
      .from('event_categories')
      .insert(categoryLinks);
    
    if (categoriesError) throw categoriesError;
  }

  // Link locations to event
  if (locationIds.length > 0 && newEvent) {
    const locationLinks = locationIds.map(locationId => ({
      event_id: newEvent.id,
      location_id: locationId
    }));

    const { error: locationsError } = await supabase
      .from('event_locations')
      .insert(locationLinks);
    
    if (locationsError) throw locationsError;
  }

  // Link organizers to event
  if (organizerIds.length > 0 && newEvent) {
    const organizerLinks = organizerIds.map(organizerId => ({
      event_id: newEvent.id,
      organizer_id: organizerId
    }));

    const { error: organizersError } = await supabase
      .from('event_organizers')
      .insert(organizerLinks);
    
    if (organizersError) throw organizersError;
  }

  // Link speakers to event
  if (speakerIds.length > 0 && newEvent) {
    const speakerLinks = speakerIds.map(speakerId => ({
      event_id: newEvent.id,
      speaker_id: speakerId
    }));

    const { error: speakersError } = await supabase
      .from('event_speakers')
      .insert(speakerLinks);
    
    if (speakersError) throw speakersError;
  }

  return newEvent;
}

export async function updateEvent(id: string, updates: {
  title?: string;
  description?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  is_all_day?: boolean;
  hide_time?: boolean;
  hide_end_time?: boolean;
  time_notes?: string;
  location_id?: string;
  other_location_ids?: string[];
  hide_location?: boolean;
  organizer_id?: string;
  other_organizer_ids?: string[];
  hide_organizer?: boolean;
  category_id?: string;
  category_ids?: string[]; // Multiple categories
  format_id?: string;
  speaker_ids?: string[];
  hide_speakers?: boolean;
  event_link?: string;
  more_info_link?: string;
  more_info_target?: 'current' | 'new';
  event_status?: string;
  status?: string;
}) {
  // Extract speaker IDs, category IDs, location IDs, and organizer IDs
  const speakerIds = updates.speaker_ids;
  const categoryIds = updates.category_ids;
  const locationIds = updates.location_ids;
  const organizerIds = updates.organizer_ids;
  const eventUpdates = { ...updates };
  delete (eventUpdates as any).speaker_ids;
  delete (eventUpdates as any).category_ids;
  delete (eventUpdates as any).location_ids;
  delete (eventUpdates as any).organizer_ids;

  // Update event (don't select - do it separately to avoid RLS issues)
  const { error } = await supabase
    .from('events')
    .update(eventUpdates)
    .eq('id', id);
  
  if (error) throw error;
  
  // Fetch the updated event separately
  const { data, error: fetchError } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();
  
  if (fetchError || !data) {
    // If we can't fetch it back, that's okay - the update succeeded
    console.warn('Update succeeded but could not fetch updated event:', fetchError);
  }

  // Update categories if provided
  if (categoryIds !== undefined) {
    // Delete existing category links
    await supabase
      .from('event_categories')
      .delete()
      .eq('event_id', id);

    // Add new category links
    if (categoryIds.length > 0) {
      const categoryLinks = categoryIds.map(categoryId => ({
        event_id: id,
        category_id: categoryId
      }));

      const { error: categoriesError } = await supabase
        .from('event_categories')
        .insert(categoryLinks);
      
      if (categoriesError) throw categoriesError;
    }
  }

  // Update locations if provided
  if (locationIds !== undefined) {
    // Delete existing location links
    await supabase
      .from('event_locations')
      .delete()
      .eq('event_id', id);

    // Add new location links
    if (locationIds.length > 0) {
      const locationLinks = locationIds.map(locationId => ({
        event_id: id,
        location_id: locationId
      }));

      const { error: locationsError } = await supabase
        .from('event_locations')
        .insert(locationLinks);
      
      if (locationsError) throw locationsError;
    }
  }

  // Update organizers if provided
  if (organizerIds !== undefined) {
    // Delete existing organizer links
    await supabase
      .from('event_organizers')
      .delete()
      .eq('event_id', id);

    // Add new organizer links
    if (organizerIds.length > 0) {
      const organizerLinks = organizerIds.map(organizerId => ({
        event_id: id,
        organizer_id: organizerId
      }));

      const { error: organizersError } = await supabase
        .from('event_organizers')
        .insert(organizerLinks);
      
      if (organizersError) throw organizersError;
    }
  }

  // Update speakers if provided
  if (speakerIds !== undefined) {
    // Delete existing speaker links
    await supabase
      .from('event_speakers')
      .delete()
      .eq('event_id', id);

    // Add new speaker links
    if (speakerIds.length > 0) {
      const speakerLinks = speakerIds.map(speakerId => ({
        event_id: id,
        speaker_id: speakerId
      }));

      const { error: speakersError } = await supabase
        .from('event_speakers')
        .insert(speakerLinks);
      
      if (speakersError) throw speakersError;
    }
  }

  return data;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function bulkDeleteEvents(ids: string[]) {
  const { error } = await supabase
    .from('events')
    .delete()
    .in('id', ids);
  
  if (error) throw error;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export async function getCategoryIdByName(name: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('name', name)
    .single();
  
  if (error) return null;
  return data?.id || null;
}

export async function getFormatIdByName(name: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('formats')
    .select('id')
    .eq('name', name)
    .single();
  
  if (error) return null;
  return data?.id || null;
}

export async function getSpeakerIdsByNames(names: string[]): Promise<string[]> {
  if (names.length === 0) return [];
  
  const { data, error } = await supabase
    .from('speakers')
    .select('id')
    .in('name', names);
  
  if (error) return [];
  return data?.map(s => s.id) || [];
}

export async function getOrCreateLocation(name: string): Promise<string> {
  // First try to find existing location
  const { data: existing } = await supabase
    .from('locations')
    .select('id')
    .eq('name', name)
    .single();
  
  if (existing) return existing.id;
  
  // Create new location
  const { data: newLocation, error } = await supabase
    .from('locations')
    .insert([{ name }])
    .select('id')
    .single();
  
  if (error) throw error;
  return newLocation.id;
}

export async function getOrCreateOrganizer(name: string): Promise<string> {
  // First try to find existing organizer
  const { data: existing } = await supabase
    .from('organizers')
    .select('id')
    .eq('name', name)
    .single();
  
  if (existing) return existing.id;
  
  // Create new organizer
  const { data: newOrganizer, error } = await supabase
    .from('organizers')
    .insert([{ name }])
    .select('id')
    .single();
  
  if (error) throw error;
  return newOrganizer.id;
}

