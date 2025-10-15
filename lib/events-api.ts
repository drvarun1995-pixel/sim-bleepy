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
  const response = await fetch('/api/events/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create category');
  }
  
  return await response.json();
}

export async function updateCategory(id: string, updates: {
  name?: string;
  slug?: string;
  parent_id?: string | null;
  description?: string;
  color?: string;
}) {
  const response = await fetch('/api/events/categories', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update category');
  }
  
  return await response.json();
}

export async function deleteCategory(id: string) {
  const response = await fetch(`/api/events/categories?id=${id}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete category');
  }
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
  const response = await fetch('/api/events/formats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(format)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create format');
  }
  
  return await response.json();
}

export async function updateFormat(id: string, updates: {
  name?: string;
  slug?: string;
  parent_id?: string | null;
  description?: string;
  color?: string;
}) {
  const response = await fetch('/api/events/formats', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update format');
  }
  
  return await response.json();
}

export async function deleteFormat(id: string) {
  const response = await fetch(`/api/events/formats?id=${id}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete format');
  }
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
  const response = await fetch('/api/events/speakers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(speaker)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create speaker');
  }
  
  return await response.json();
}

export async function deleteSpeaker(id: string) {
  const response = await fetch(`/api/events/speakers?id=${id}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete speaker');
  }
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
  const response = await fetch('/api/events/locations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(locationData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create location');
  }
  
  return await response.json();
}

export async function updateLocation(id: string, updates: {
  name?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const response = await fetch('/api/events/locations', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update location');
  }
  
  return await response.json();
}

export async function deleteLocation(id: string) {
  const response = await fetch(`/api/events/locations?id=${id}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete location');
  }
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
  const response = await fetch('/api/events/organizers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create organizer');
  }
  
  return await response.json();
}

export async function deleteOrganizer(id: string) {
  const response = await fetch(`/api/events/organizers?id=${id}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete organizer');
  }
}

// =====================================================
// EVENTS
// =====================================================

// Cache for events data
const eventsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getEvents(filters?: {
  status?: string;
  category_id?: string;
  format_id?: string;
  location_id?: string;
  organizer_id?: string;
  event_status?: string;
  start_date?: string;
  end_date?: string;
  limit?: number; // Add limit parameter for performance
}) {
  // Create cache key
  const cacheKey = JSON.stringify(filters || {});
  const cached = eventsCache.get(cacheKey);
  
  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // Build query parameters
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.category_id) params.append('category_id', filters.category_id);
  if (filters?.format_id) params.append('format_id', filters.format_id);
  if (filters?.location_id) params.append('location_id', filters.location_id);
  if (filters?.organizer_id) params.append('organizer_id', filters.organizer_id);
  if (filters?.event_status) params.append('event_status', filters.event_status);
  if (filters?.start_date) params.append('start_date', filters.start_date);
  if (filters?.end_date) params.append('end_date', filters.end_date);
  if (filters?.limit) params.append('limit', filters.limit.toString());

  // Fetch events from API route with caching headers
  const response = await fetch(`/api/events?${params.toString()}`, {
    headers: {
      'Cache-Control': 'max-age=300' // 5 minutes browser cache
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Cache the data
  eventsCache.set(cacheKey, { data, timestamp: Date.now() });
  
  // Clean up old cache entries
  if (eventsCache.size > 10) {
    const oldestKey = eventsCache.keys().next().value;
    eventsCache.delete(oldestKey);
  }
  
  return data;
}

export async function getEventById(id: string) {
  // Fetch event from API route
  const response = await fetch(`/api/events/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch event: ${response.statusText}`);
  }
  
  const data = await response.json();
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
  location_ids?: string[];
  other_location_ids?: string[];
  hide_location?: boolean;
  organizer_id?: string;
  organizer_ids?: string[];
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
  const response = await fetch('/api/events/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create event');
  }
  
  return await response.json();
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
  location_ids?: string[];
  other_location_ids?: string[];
  hide_location?: boolean;
  organizer_id?: string;
  organizer_ids?: string[];
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
  const response = await fetch(`/api/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update event');
  }
  
  return await response.json();
}

export async function deleteEvent(id: string) {
  const response = await fetch(`/api/events/${id}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete event');
  }
}

export async function bulkDeleteEvents(ids: string[]) {
  // Delete events one by one using the API
  const deletePromises = ids.map(id => deleteEvent(id));
  await Promise.all(deletePromises);
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

