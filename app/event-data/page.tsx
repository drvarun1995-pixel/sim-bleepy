"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  createEvent,
  updateEvent,
  deleteEvent as deleteEventFromDB,
  createCategory,
  updateCategory,
  deleteCategory as deleteCategoryFromDB,
  createFormat,
  updateFormat,
  deleteFormat as deleteFormatFromDB,
  createSpeaker,
  deleteSpeaker as deleteSpeakerFromDB,
  createLocation,
  deleteLocation as deleteLocationFromDB,
  createOrganizer,
  deleteOrganizer as deleteOrganizerFromDB,
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
  Plus, 
  Edit, 
  Trash2, 
  Tag, 
  MapPin, 
  Users, 
  User, 
  Calendar,
  Settings,
  List,
  ArrowUpDown,
  Clock,
  Menu,
  X
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

const defaultData: EventData = {
  categories: [
    { id: '1', name: 'Medical Training', slug: 'medical-training', parent: 'none', description: 'Medical training events', count: 0, color: '#FF6B6B' },
    { id: '2', name: 'Workshop', slug: 'workshop', parent: 'none', description: 'Interactive workshop sessions', count: 0, color: '#48C9B0' },
    { id: '3', name: 'Conference', slug: 'conference', parent: 'none', description: 'Professional conferences', count: 0, color: '#FFB366' },
    { id: '4', name: 'Seminar', slug: 'seminar', parent: 'none', description: 'Educational seminars', count: 0, color: '#5D6D7E' }
  ],
  formats: [
    { id: '1', name: 'In-Person', slug: 'in-person', parent: 'none', description: 'Physical in-person events', color: '#FF6B6B', count: 0 },
    { id: '2', name: 'Virtual', slug: 'virtual', parent: 'none', description: 'Online virtual events', color: '#48C9B0', count: 0 },
    { id: '3', name: 'Hybrid', slug: 'hybrid', parent: 'none', description: 'Combined in-person and virtual', color: '#FFB366', count: 0 },
    { id: '4', name: 'Online', slug: 'online', parent: 'none', description: 'Fully online events', color: '#5D6D7E', count: 0 }
  ],
  locations: [],
  speakers: [
    { id: '1', name: 'Dr. Sarah Johnson', role: 'Keynote Speaker' },
    { id: '2', name: 'Dr. Michael Chen', role: 'Workshop Leader' },
    { id: '3', name: 'Dr. Emily Rodriguez', role: 'Panelist' },
    { id: '4', name: 'Dr. James Wilson', role: 'Moderator' },
    { id: '5', name: 'Dr. Lisa Thompson', role: 'Guest Speaker' },
    { id: '6', name: 'Dr. Robert Davis', role: 'Presenter' }
  ],
  organizers: [
    'Medical Education Department',
    'Training Institute',
    'HR Department',
    'Professional Development',
    'Quality Assurance Team',
    'Clinical Services'
  ]
};

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
  location: string; // This will store the location ID
  otherLocations: string[];
  hideLocation: boolean;
  organizer: string;
  otherOrganizers: string[];
  allOrganizers: string[]; // All organizers combined for display
  hideOrganizer: boolean;
  category: string[]; // Array of category names for multiple categories
  format: string;
  speakers: string[];
  hideSpeakers: boolean;
  attendees: number;
  status: 'draft' | 'published' | 'cancelled';
  author: string;
  eventLink: string;
  moreInfoLink: string;
  moreInfoTarget: 'current' | 'new';
  eventStatus: 'scheduled' | 'rescheduled' | 'postponed' | 'cancelled' | 'moved-online';
}

const menuItems = [
  { key: 'all-events', label: 'All Events', icon: List },
  { key: 'add-event', label: 'Add Event', icon: Plus },
  { key: 'categories', label: 'Category', icon: Tag },
  { key: 'formats', label: 'Format', icon: Calendar },
  { key: 'locations', label: 'Locations', icon: MapPin },
  { key: 'organizers', label: 'Organizers', icon: User },
  { key: 'speakers', label: 'Speakers', icon: Users },
];

function EventDataPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [data, setData] = useState<EventData>(defaultData);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dataSource, setDataSource] = useState<'supabase' | 'localStorage'>('localStorage');
  const [activeSection, setActiveSection] = useState<string>('all-events');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [editingItem, setEditingItem] = useState<{type: keyof EventData, index: number, value: string} | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingFormat, setEditingFormat] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<string>('');
  const [newSpeaker, setNewSpeaker] = useState({ name: '', role: '' });
  const [newOrganizer, setNewOrganizer] = useState<string>('');
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: ''
  });
  const [editingLocation, setEditingLocation] = useState<{
    id: string;
    name: string;
    address: string;
    latitude: string;
    longitude: string;
  } | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [editAddressSuggestions, setEditAddressSuggestions] = useState<any[]>([]);
  const [showEditAddressSuggestions, setShowEditAddressSuggestions] = useState(false);
  const [addressInputRef, setAddressInputRef] = useState<HTMLInputElement | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    parent: 'none',
    description: '',
    color: ''
  });
  const [editCategoryForm, setEditCategoryForm] = useState({
    name: '',
    slug: '',
    parent: 'none',
    description: '',
    color: ''
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [showFormatDeleteConfirm, setShowFormatDeleteConfirm] = useState(false);
  const [formatForm, setFormatForm] = useState({
    name: '',
    slug: '',
    parent: 'none',
    description: '',
    color: ''
  });
  const [editFormatForm, setEditFormatForm] = useState({
    name: '',
    slug: '',
    parent: 'none',
    description: '',
    color: ''
  });
  const [showFormatColorPicker, setShowFormatColorPicker] = useState(false);
  const [showEditFormatColorPicker, setShowEditFormatColorPicker] = useState(false);
  const [showEditCategoryColorPicker, setShowEditCategoryColorPicker] = useState(false);
  const [activeFormSection, setActiveFormSection] = useState<string>('basic');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    date: 'all',
    format: 'all',
    location: 'all',
    organizer: 'all',
    category: 'all',
    startDate: '',
    eventType: 'all'
  });
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    isAllDay: false,
    hideTime: false,
    hideEndTime: false,
    timeNotes: '',
    location: '',
    otherLocations: [] as string[],
    hideLocation: false,
    organizer: '',
    otherOrganizers: [] as string[],
    hideOrganizer: false,
    category: [] as string[],
    format: [] as string[],
    speakers: [] as string[],
    hideSpeakers: false,
    eventLink: '',
    moreInfoLink: '',
    moreInfoTarget: 'current' as 'current' | 'new',
    eventStatus: 'scheduled' as 'scheduled' | 'rescheduled' | 'postponed' | 'cancelled' | 'moved-online'
  });

  // Calculate category counts based on actual events
  const calculateCategoryCounts = (categories: Category[], events: Event[]) => {
    return categories.map(category => ({
      ...category,
      count: events.filter(event => 
        Array.isArray(event.category) 
          ? event.category.includes(category.name)
          : event.category === category.name
      ).length
    }));
  };

  // Calculate format counts based on actual events
  const calculateFormatCounts = (formats: Format[], events: Event[]) => {
    return formats.map(format => ({
      ...format,
      count: events.filter(event => event.format === format.name).length
    }));
  };

  // Calculate speaker counts based on actual events
  const calculateSpeakerCounts = (speakers: Speaker[], events: Event[]) => {
    return speakers.map(speaker => ({
      ...speaker,
      count: events.filter(event => 
        event.speakers && event.speakers.includes(speaker.name)
      ).length
    }));
  };

  // Calculate organizer counts based on actual events
  const calculateOrganizerCounts = (organizers: string[], events: Event[]) => {
    return organizers.map(organizer => ({
      name: organizer,
      count: events.filter(event => event.organizer === organizer).length
    }));
  };


  // Load all data from Supabase on component mount
  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [categories, formats, speakers, locations, organizers, eventsData] = await Promise.all([
        getCategories(),
        getFormats(),
        getSpeakers(),
        getLocations(),
        getOrganizers(),
        getEvents()
      ]);

      // Convert Supabase format to component format
      setData({
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          parent: cat.parent_id ? categories.find(c => c.id === cat.parent_id)?.name || '' : '',
          description: cat.description || '',
          color: cat.color || '',
          count: 0 // Will be calculated
        })),
        formats: formats.map(fmt => ({
          id: fmt.id,
          name: fmt.name,
          slug: fmt.slug,
          parent: fmt.parent_id ? formats.find(f => f.id === fmt.parent_id)?.name || '' : '',
          description: fmt.description || '',
          color: fmt.color || '',
          count: 0 // Will be calculated
        })),
        speakers: speakers,
        locations: locations, // Store full location objects
        organizers: organizers.map(o => o.name)
      });

      // Convert events from Supabase format to component format
      const convertedEvents = (eventsData || []).map((e: any) => ({
        id: e.id,
        title: e.title,
        description: e.description || '',
        date: e.date,
        startTime: e.start_time,
        endTime: e.end_time,
        isAllDay: e.is_all_day || false,
        hideTime: e.hide_time || false,
        hideEndTime: e.hide_end_time || false,
        timeNotes: e.time_notes || '',
        location: e.location_name || e.location_id || '',
        otherLocations: e.locations ? e.locations.map((l: any) => l.id) : [],
        hideLocation: e.hide_location || false,
        organizer: e.organizer_name || '',
        otherOrganizers: e.organizers ? e.organizers.map((o: any) => o.name) : [],
        allOrganizers: (() => {
          const main = e.organizer_name ? [e.organizer_name] : [];
          const others = e.organizers ? e.organizers.map((o: any) => o.name) : [];
          return [...main, ...others];
        })(),
        hideOrganizer: e.hide_organizer || false,
        category: e.categories ? e.categories.map((c: any) => c.name) : (e.category_name ? [e.category_name] : []), // Multiple categories
        format: e.format_name || '',
        speakers: e.speakers ? e.speakers.map((s: any) => s.name) : [],
        hideSpeakers: e.hide_speakers || false,
        attendees: e.attendees || 0,
        status: e.status || 'published',
        author: e.author?.name || e.author?.email || e.author_name || 'Unknown User',
        eventLink: e.event_link || '',
        moreInfoLink: e.more_info_link || '',
        moreInfoTarget: e.more_info_target || 'current',
        eventStatus: e.event_status || 'scheduled'
      }));

      setEvents(convertedEvents);
      setDataSource('supabase');
      console.log('✅ Successfully loaded data from Supabase:', { categories, formats, speakers, locations, organizers, events: convertedEvents });
      
    } catch (error) {
      console.error('❌ Error loading data from Supabase:', error);
      console.error('Full error:', JSON.stringify(error, null, 2));
      setDataSource('localStorage');
      
      // Fallback to localStorage if Supabase fails
      const savedData = localStorage.getItem('eventData');
      const savedEvents = localStorage.getItem('events');
      if (savedData) {
        try {
          setData(JSON.parse(savedData));
          console.log('⚠️ Loaded data from localStorage fallback');
        } catch (e) {
          console.error('Error parsing localStorage data:', e);
        }
      }
      if (savedEvents) {
        try {
          setEvents(JSON.parse(savedEvents));
        } catch (e) {
          console.error('Error parsing localStorage events:', e);
        }
      }
      alert('⚠️ Could not connect to Supabase. Using localStorage. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Update category, format, speaker, and organizer counts when events change
  useEffect(() => {
    if ((data.categories.length > 0 || data.formats.length > 0 || data.speakers.length > 0 || data.organizers.length > 0) && events.length >= 0) {
      const updatedCategories = calculateCategoryCounts(data.categories, events);
      const updatedFormats = calculateFormatCounts(data.formats, events);
      const updatedSpeakers = calculateSpeakerCounts(data.speakers, events);
      const updatedOrganizers = calculateOrganizerCounts(data.organizers, events);
      
      const categoriesChanged = updatedCategories.some((cat, idx) => 
        cat.count !== data.categories[idx]?.count
      );
      const formatsChanged = updatedFormats.some((fmt, idx) => 
        fmt.count !== data.formats[idx]?.count
      );
      const speakersChanged = updatedSpeakers.some((speaker, idx) => 
        (speaker as any).count !== (data.speakers[idx] as any)?.count
      );
      const organizersChanged = updatedOrganizers.some((org, idx) => 
        (org as any).count !== (data.organizers[idx] as any)?.count
      );
      
      if (categoriesChanged || formatsChanged || speakersChanged || organizersChanged) {
        setData(prev => ({
          ...prev,
          categories: updatedCategories,
          formats: updatedFormats,
          speakers: updatedSpeakers,
          organizers: updatedOrganizers.map(org => (org as any).name) // Keep organizers as string array for compatibility
        }));
      }
    }
  }, [events]);

  // Note: Data is now saved to Supabase automatically via CRUD operations
  // No need to save to localStorage anymore

  // Admin protection
  useEffect(() => {
    if (status === 'loading' || adminLoading) return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
  }, [session, status, isAdmin, adminLoading, router]);

  // Handle edit parameter from URL
  useEffect(() => {
    const editEventId = searchParams.get('edit');
    if (editEventId && events.length > 0) {
      // Wait for events to load, then trigger edit mode
      handleEditEvent(editEventId);
    }
  }, [searchParams, events]);

  // Google Places API is loaded by the centralized loader when needed

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addressInputRef && !addressInputRef.contains(event.target as Node)) {
        setShowAddressSuggestions(false);
      }
    };

    // Use click instead of mousedown to allow onClick events to fire first
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [addressInputRef]);

  // Address search functionality for new locations
  const handleAddressSearch = async (query: string) => {
    if (!query.trim()) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    try {
      console.log('Searching for:', query);
      
      // Load Google Maps API if not already loaded
      const { loadGoogleMapsAPI } = await import('@/lib/google-maps-api');
      await loadGoogleMapsAPI();

      if (!window.google?.maps?.places) {
        console.error('Google Places API not available');
        return;
      }

      console.log('Google API ready, searching...');
      const service = new window.google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input: query,
          types: ['establishment', 'geocode']
        },
        (predictions: any, status: any) => {
          console.log('Search results:', { status, predictions });
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            // Remove duplicates based on place_id, description, and similar addresses
            const uniqueSuggestions = predictions.filter((prediction: any, index: number, self: any[]) => {
              // First, filter by exact place_id match
              const exactMatch = self.findIndex((p: any) => p.place_id === prediction.place_id);
              if (exactMatch !== index) return false;
              
              // Then, filter by similar description (normalize for comparison)
              const normalizeAddress = (addr: string) => 
                addr.toLowerCase()
                    .replace(/\s+/g, ' ')
                    .replace(/[^\w\s]/g, '')
                    .trim();
              
              const normalizedDesc = normalizeAddress(prediction.description);
              const similarMatch = self.findIndex(p => 
                p !== prediction && 
                normalizeAddress(p.description) === normalizedDesc
              );
              
              return similarMatch === -1;
            });
            
            console.log('Deduplicated suggestions:', uniqueSuggestions);
            setAddressSuggestions(uniqueSuggestions);
            setShowAddressSuggestions(true);
          } else {
            console.log('Search failed:', status);
            if (status === 'ApiTargetBlockedMapError') {
              console.error('🚨 API Key Error: Places API is not enabled or restricted');
              console.error('Please check your Google Cloud Console:');
              console.error('1. Enable Places API in APIs & Services → Library');
              console.error('2. Check API restrictions for your key');
              console.error('3. Verify application restrictions include localhost:3000');
            }
            setAddressSuggestions([]);
            setShowAddressSuggestions(false);
          }
        }
      );
    } catch (error) {
      console.error('Error in address search:', error);
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
    }
  };

  // Address search functionality for editing locations
  const handleEditAddressSearch = async (query: string) => {
    if (!query.trim()) {
      setEditAddressSuggestions([]);
      setShowEditAddressSuggestions(false);
      return;
    }

    try {
      console.log('Edit searching for:', query);
      
      // Load Google Maps API if not already loaded
      const { loadGoogleMapsAPI } = await import('@/lib/google-maps-api');
      await loadGoogleMapsAPI();

      if (!window.google?.maps?.places) {
        console.error('Google Places API not available');
        return;
      }

      console.log('Google API ready, edit searching...');
      const service = new window.google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input: query,
          types: ['establishment', 'geocode']
        },
        (predictions: any, status: any) => {
          console.log('Edit search results:', { status, predictions });
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            // Remove duplicates based on place_id, description, and similar addresses
            const uniqueSuggestions = predictions.filter((prediction: any, index: number, self: any[]) => {
              // First, filter by exact place_id match
              const exactMatch = self.findIndex((p: any) => p.place_id === prediction.place_id);
              if (exactMatch !== index) return false;
              
              // Then, filter by similar description (normalize for comparison)
              const normalizeAddress = (addr: string) => 
                addr.toLowerCase()
                    .replace(/\s+/g, ' ')
                    .replace(/[^\w\s]/g, '')
                    .trim();
              
              const normalizedDesc = normalizeAddress(prediction.description);
              const similarMatch = self.findIndex(p => 
                p !== prediction && 
                normalizeAddress(p.description) === normalizedDesc
              );
              
              return similarMatch === -1;
            });
            
            console.log('Deduplicated edit suggestions:', uniqueSuggestions);
            setEditAddressSuggestions(uniqueSuggestions);
            setShowEditAddressSuggestions(true);
          } else {
            console.log('Edit search failed:', status);
            if (status === 'ApiTargetBlockedMapError') {
              console.error('🚨 API Key Error: Places API is not enabled or restricted');
              console.error('Please check your Google Cloud Console:');
              console.error('1. Enable Places API in APIs & Services → Library');
              console.error('2. Check API restrictions for your key');
              console.error('3. Verify application restrictions include localhost:3000');
            }
            setEditAddressSuggestions([]);
            setShowEditAddressSuggestions(false);
          }
        }
      );
    } catch (error) {
      console.error('Error in edit address search:', error);
      setEditAddressSuggestions([]);
      setShowEditAddressSuggestions(false);
    }
  };

  // Get place details and populate coordinates
  const handleAddressSelect = async (placeId: string, suggestionDescription?: string) => {
    try {
      console.log('Selected place ID:', placeId);
      
      // Load Google Maps API if not already loaded
      const { loadGoogleMapsAPI } = await import('@/lib/google-maps-api');
      await loadGoogleMapsAPI();

      if (!window.google?.maps?.places) {
        console.error('Google Places API not available');
        return;
      }

      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      service.getDetails(
        { 
          placeId,
          fields: ['formatted_address', 'geometry', 'name', 'address_components', 'vicinity', 'international_phone_number']
        },
        (place: any, status: any) => {
            console.log('Place details response:', { status, place });
          
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const lat = place.geometry?.location?.lat();
            const lng = place.geometry?.location?.lng();
            
            // Use suggestion description as primary address (it's usually more complete)
            let address = suggestionDescription || place.formatted_address || '';
            
            // If we don't have suggestion description and formatted_address is not complete, try to build from components
            if (!address && place.address_components) {
              const components = place.address_components;
              const parts = [];
              
              // Build address from components
              const streetNumber = components.find((c: any) => c.types.includes('street_number'))?.long_name;
              const route = components.find((c: any) => c.types.includes('route'))?.long_name;
              const locality = components.find((c: any) => c.types.includes('locality'))?.long_name;
              const administrativeArea = components.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name;
              const postalCode = components.find((c: any) => c.types.includes('postal_code'))?.long_name;
              const country = components.find((c: any) => c.types.includes('country'))?.long_name;
              
              if (streetNumber && route) parts.push(`${streetNumber} ${route}`);
              else if (route) parts.push(route);
              
              if (locality) parts.push(locality);
              if (administrativeArea) parts.push(administrativeArea);
              if (postalCode) parts.push(postalCode);
              if (country) parts.push(country);
              
              address = parts.join(', ');
            }
            
            const name = place.name || '';
            
            console.log('Extracted data:', { name, address, lat, lng, formatted_address: place.formatted_address, suggestion_description: suggestionDescription });
            
            setNewLocation(prev => ({
              ...prev,
              // Keep the existing name - don't overwrite with place name
              address: address,
              latitude: lat ? lat.toString() : '',
              longitude: lng ? lng.toString() : ''
            }));
            setShowAddressSuggestions(false);
            
            console.log('Updated location data successfully');
          } else {
            console.error('Failed to get place details:', status);
            
            // Fallback: Use Geocoding API to get coordinates for the selected address
            console.log('Trying Geocoding API fallback...');
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode(
              { placeId: placeId },
              (results: any, geocodeStatus: any) => {
                if (geocodeStatus === window.google.maps.GeocoderStatus.OK && results && results[0]) {
                  const result = results[0];
                  const lat = result.geometry.location.lat();
                  const lng = result.geometry.location.lng();
                  
                  // Use formatted_address from geocoding result
                  let address = result.formatted_address || '';
                  
                  // If still no address, try to build from address_components
                  if (!address && result.address_components) {
                    const components = result.address_components;
                    const parts = [];
                    
                    // Build address from components
                    const streetNumber = components.find((c: any) => c.types.includes('street_number'))?.long_name;
                    const route = components.find((c: any) => c.types.includes('route'))?.long_name;
                    const locality = components.find((c: any) => c.types.includes('locality'))?.long_name;
                    const administrativeArea = components.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name;
                    const postalCode = components.find((c: any) => c.types.includes('postal_code'))?.long_name;
                    const country = components.find((c: any) => c.types.includes('country'))?.long_name;
                    
                    if (streetNumber && route) parts.push(`${streetNumber} ${route}`);
                    else if (route) parts.push(route);
                    
                    if (locality) parts.push(locality);
                    if (administrativeArea) parts.push(administrativeArea);
                    if (postalCode) parts.push(postalCode);
                    if (country) parts.push(country);
                    
                    address = parts.join(', ');
                  }
                  
                  console.log('Geocoding fallback success:', { address, lat, lng, formatted_address: result.formatted_address });
                  
                  setNewLocation(prev => ({
                    ...prev,
                    // Keep the existing name - don't overwrite
                    address: address,
                    latitude: lat.toString(),
                    longitude: lng.toString()
                  }));
                  setShowAddressSuggestions(false);
                } else {
                  console.error('Geocoding fallback also failed:', geocodeStatus);
                }
              }
            );
          }
        }
      );
    } catch (error) {
      console.error('Error selecting address:', error);
    }
  };

  const handleSectionClick = (sectionKey: string) => {
    setActiveSection(sectionKey);
    setIsMobileMenuOpen(false); // Close mobile menu when section is selected
  };

  const addItem = async () => {
    if (activeSection === 'locations') {
      if (!newLocation.name.trim()) {
        alert('Please fill in the name field.');
        return;
      }
      
      try {
        // Create location with full details
        await createLocation({
          name: newLocation.name.trim(),
          address: newLocation.address.trim() || undefined,
          latitude: newLocation.latitude ? parseFloat(newLocation.latitude) : null,
          longitude: newLocation.longitude ? parseFloat(newLocation.longitude) : null
        });
        console.log('Location created in Supabase');
        
        // Reset form
        setNewLocation({
          name: '',
          address: '',
          latitude: '',
          longitude: ''
        });
        setAddressSuggestions([]);
        setShowAddressSuggestions(false);
        
        await loadAllData();
      } catch (error) {
        console.error('Error adding location:', error);
        alert('Failed to add location. Please try again.');
      }
    } else {
      if (!newItem.trim()) return;
      
      try {
        if (activeSection === 'organizers') {
        await createOrganizer(newItem.trim());
        console.log('Organizer created in Supabase');
      }
      
      setNewItem('');
      await loadAllData();
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item. Please check console for details.');
      }
    }
  };

  const editItem = async (index: number, newValue: string) => {
    if (!newValue.trim()) return;
    
    try {
      if (activeSection === 'locations') {
        // Start editing the location with full details
        const location = data.locations[index];
        setEditingLocation({
          id: location.id,
          name: location.name,
          address: location.address || '',
          latitude: location.latitude?.toString() || '',
          longitude: location.longitude?.toString() || ''
        });
      } else if (activeSection === 'organizers') {
        console.log('Editing organizer not yet implemented - delete and recreate instead');
        alert('To edit, please delete and create a new one.');
      }
      
      setEditingItem(null);
    } catch (error) {
      console.error('Error editing item:', error);
      alert('Failed to edit item. Please check console for details.');
    }
  };

  const handleAddressSelectForEdit = async (placeId: string, suggestionDescription?: string) => {
    try {
      console.log('Selected place ID for edit:', placeId);
      
      // Load Google Maps API if not already loaded
      const { loadGoogleMapsAPI } = await import('@/lib/google-maps-api');
      await loadGoogleMapsAPI();

      if (!window.google?.maps?.places) {
        console.error('Google Places API not available');
        return;
      }

      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      service.getDetails(
        { 
          placeId,
          fields: ['formatted_address', 'geometry', 'name', 'address_components', 'vicinity', 'international_phone_number']
        },
        (place: any, status: any) => {
            console.log('Edit place details response:', { status, place });
          
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const lat = place.geometry?.location?.lat();
            const lng = place.geometry?.location?.lng();
            
            // Use suggestion description as primary address (it's usually more complete)
            let address = suggestionDescription || place.formatted_address || '';
            
            // If we don't have suggestion description and formatted_address is not complete, try to build from components
            if (!address && place.address_components) {
              const components = place.address_components;
              const parts = [];
              
              // Build address from components
              const streetNumber = components.find((c: any) => c.types.includes('street_number'))?.long_name;
              const route = components.find((c: any) => c.types.includes('route'))?.long_name;
              const locality = components.find((c: any) => c.types.includes('locality'))?.long_name;
              const administrativeArea = components.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name;
              const postalCode = components.find((c: any) => c.types.includes('postal_code'))?.long_name;
              const country = components.find((c: any) => c.types.includes('country'))?.long_name;
              
              if (streetNumber && route) parts.push(`${streetNumber} ${route}`);
              else if (route) parts.push(route);
              
              if (locality) parts.push(locality);
              if (administrativeArea) parts.push(administrativeArea);
              if (postalCode) parts.push(postalCode);
              if (country) parts.push(country);
              
              address = parts.join(', ');
            }
            
            const name = place.name || '';
            
            console.log('Extracted edit data:', { name, address, lat, lng, formatted_address: place.formatted_address, suggestion_description: suggestionDescription });
            
            setEditingLocation(prev => prev ? {
              ...prev,
              // Keep the existing name - don't overwrite with place name
              address: address,
              latitude: lat ? lat.toString() : '',
              longitude: lng ? lng.toString() : ''
            } : null);
            setShowEditAddressSuggestions(false);
            
            console.log('Updated edit location data successfully');
          } else {
            console.error('Failed to get edit place details:', status);
            
            // Fallback: Use Geocoding API to get coordinates for the selected address
            console.log('Trying Geocoding API fallback for edit...');
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode(
              { placeId: placeId },
              (results: any, geocodeStatus: any) => {
                if (geocodeStatus === window.google.maps.GeocoderStatus.OK && results && results[0]) {
                  const result = results[0];
                  const lat = result.geometry.location.lat();
                  const lng = result.geometry.location.lng();
                  
                  // Use formatted_address from geocoding result
                  let address = result.formatted_address || '';
                  
                  // If still no address, try to build from address_components
                  if (!address && result.address_components) {
                    const components = result.address_components;
                    const parts = [];
                    
                    // Build address from components
                    const streetNumber = components.find((c: any) => c.types.includes('street_number'))?.long_name;
                    const route = components.find((c: any) => c.types.includes('route'))?.long_name;
                    const locality = components.find((c: any) => c.types.includes('locality'))?.long_name;
                    const administrativeArea = components.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name;
                    const postalCode = components.find((c: any) => c.types.includes('postal_code'))?.long_name;
                    const country = components.find((c: any) => c.types.includes('country'))?.long_name;
                    
                    if (streetNumber && route) parts.push(`${streetNumber} ${route}`);
                    else if (route) parts.push(route);
                    
                    if (locality) parts.push(locality);
                    if (administrativeArea) parts.push(administrativeArea);
                    if (postalCode) parts.push(postalCode);
                    if (country) parts.push(country);
                    
                    address = parts.join(', ');
                  }
                  
                  console.log('Edit geocoding fallback success:', { address, lat, lng, formatted_address: result.formatted_address });
                  
                  setEditingLocation(prev => prev ? {
                    ...prev,
                    // Keep the existing name - don't overwrite
                    address: address,
                    latitude: lat.toString(),
                    longitude: lng.toString()
                  } : null);
                  setShowEditAddressSuggestions(false);
                } else {
                  console.error('Edit geocoding fallback also failed:', geocodeStatus);
                }
              }
            );
          }
        }
      );
    } catch (error) {
      console.error('Error selecting address for edit:', error);
    }
  };

  const updateLocation = async () => {
    if (!editingLocation || !editingLocation.name.trim()) {
      alert('Please fill in the name field.');
      return;
    }
    
    try {
      // Import the updateLocation function (we'll need to add this to the API)
      const { updateLocation: updateLocationInDB } = await import('@/lib/events-api');
      await updateLocationInDB(editingLocation.id, {
        name: editingLocation.name.trim(),
        address: editingLocation.address.trim() || undefined,
        latitude: editingLocation.latitude ? parseFloat(editingLocation.latitude) : null,
        longitude: editingLocation.longitude ? parseFloat(editingLocation.longitude) : null
      });
      
      console.log('Location updated in Supabase');
      setEditingLocation(null);
    setEditAddressSuggestions([]);
    setShowEditAddressSuggestions(false);
      await loadAllData();
    } catch (error) {
      console.error('Error updating location:', error);
      alert('Failed to update location. Please try again.');
    }
  };

  const deleteItem = async (index: number) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    try {
      if (activeSection === 'locations') {
        // Get the location object directly
        const location = data.locations[index];
        if (location) {
          await deleteLocationFromDB(location.id);
          console.log('Location deleted from Supabase');
        }
      } else if (activeSection === 'organizers') {
        const organizerName = data.organizers[index];
        const organizers = await getOrganizers();
        const organizer = organizers.find(o => o.name === organizerName);
        if (organizer) {
          await deleteOrganizerFromDB(organizer.id);
          console.log('Organizer deleted from Supabase');
        }
      }
      
      await loadAllData();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please check console for details.');
    }
  };


  const formatDateTime = (date: string, time: string) => {
    if (!date || !time) return '';
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleAddEvent = async () => {
    if (!formData.title || !formData.date || !formData.startTime || !formData.endTime) return;

    try {
      setSaving(true);

      // Debug: Log session data
      console.log('Current session:', session);
      console.log('User data:', session?.user);
      console.log('Author name will be:', session?.user?.name || session?.user?.email || 'Unknown User');

      // Use location ID directly (already stored as ID)
      const locationId = formData.location || undefined;
      const organizerId = formData.organizer ? await getOrCreateOrganizer(formData.organizer) : undefined;
      // Get ALL category IDs, not just the first one
      const categoryIds = await Promise.all(
        formData.category.map(catName => getCategoryIdByName(catName))
      ).then(ids => ids.filter((id): id is string => id !== null));
      const categoryId = categoryIds.length > 0 ? categoryIds[0] : null; // Keep first as primary for backward compatibility
      const formatId = formData.format.length > 0 ? await getFormatIdByName(formData.format[0]) : null;
      const speakerIds = await getSpeakerIdsByNames(formData.speakers);
      // Get location IDs from other locations (stored as IDs already)
      const locationIds = formData.otherLocations || [];
      // Get organizer IDs from other organizers (need to look them up)
      const organizerIds = await Promise.all(
        (formData.otherOrganizers || []).map(async (orgName) => {
          const organizer = await getOrganizers().then(orgs => orgs.find(o => o.name === orgName));
          return organizer?.id;
        })
      ).then(ids => ids.filter((id): id is string => id !== undefined));

      // Create event in Supabase
      const newEvent = await createEvent({
        title: formData.title,
        description: formData.description,
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        is_all_day: formData.isAllDay,
        hide_time: formData.hideTime,
        hide_end_time: formData.hideEndTime,
        time_notes: formData.timeNotes,
        location_id: locationId,
        location_ids: locationIds,
        hide_location: formData.hideLocation,
        organizer_id: organizerId,
        organizer_ids: organizerIds,
        hide_organizer: formData.hideOrganizer,
        category_id: categoryId ?? undefined,
        category_ids: categoryIds, // Multiple categories
        format_id: formatId ?? undefined,
        speaker_ids: speakerIds,
        hide_speakers: formData.hideSpeakers,
        event_link: formData.eventLink,
        more_info_link: formData.moreInfoLink,
        more_info_target: formData.moreInfoTarget,
        event_status: formData.eventStatus,
        status: 'published',
        author_name: session?.user?.name || session?.user?.email || 'Unknown User'
      });

      console.log('Event created in Supabase:', newEvent);
      
      // Reload events from Supabase
      await loadAllData();
      
      resetForm();
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEvent = async () => {
    console.log('handleUpdateEvent called with:', {
      title: formData.title,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      editingEventId
    });
    
    if (!formData.title || !formData.date || !formData.startTime || !formData.endTime || !editingEventId) {
      console.log('Form validation failed - missing required fields');
      return;
    }

    try {
      setSaving(true);

      // Use location ID directly (already stored as ID)
      const locationId = formData.location || undefined;
      const organizerId = formData.organizer ? await getOrCreateOrganizer(formData.organizer) : undefined;
      // Get ALL category IDs, not just the first one
      const categoryIds = await Promise.all(
        formData.category.map(catName => getCategoryIdByName(catName))
      ).then(ids => ids.filter((id): id is string => id !== null));
      const categoryId = categoryIds.length > 0 ? categoryIds[0] : null; // Keep first as primary for backward compatibility
      const formatId = formData.format.length > 0 ? await getFormatIdByName(formData.format[0]) : null;
      const speakerIds = await getSpeakerIdsByNames(formData.speakers);
      // Get location IDs from other locations (stored as IDs already)
      const locationIds = formData.otherLocations || [];
      // Get organizer IDs from other organizers (need to look them up)
      console.log('🔍 Looking up organizers for:', formData.otherOrganizers);
      const allOrganizers = await getOrganizers();
      console.log('📋 Available organizers:', allOrganizers.map(o => o.name));
      
      const organizerIds = formData.otherOrganizers
        .map(orgName => {
          const organizer = allOrganizers.find(o => o.name === orgName);
          console.log(`  Lookup "${orgName}":`, organizer ? `Found (${organizer.id})` : 'NOT FOUND');
          return organizer?.id;
        })
        .filter((id): id is string => id !== undefined);

      console.log('📊 Update data:', {
        categoryIds: categoryIds.length,
        locationIds: locationIds.length,
        organizerIds: organizerIds.length,
        speakerIds: speakerIds.length,
        otherOrganizers: formData.otherOrganizers,
        actualOrganizerIds: organizerIds
      });

      // Update event in Supabase
      await updateEvent(editingEventId, {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        is_all_day: formData.isAllDay,
        hide_time: formData.hideTime,
        hide_end_time: formData.hideEndTime,
        time_notes: formData.timeNotes,
        location_id: locationId,
        location_ids: locationIds,
        hide_location: formData.hideLocation,
        organizer_id: organizerId,
        organizer_ids: organizerIds,
        hide_organizer: formData.hideOrganizer,
        category_id: categoryId ?? undefined,
        category_ids: categoryIds, // Multiple categories
        format_id: formatId ?? undefined,
        speaker_ids: speakerIds,
        hide_speakers: formData.hideSpeakers,
        event_link: formData.eventLink,
        more_info_link: formData.moreInfoLink,
        more_info_target: formData.moreInfoTarget,
        event_status: formData.eventStatus,
        status: 'published'
      });

      console.log('Event updated in Supabase:', editingEventId);
      
      // Wait a moment for categories to be linked
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload events from Supabase
      await loadAllData();
      
      // Show success message
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
      
      console.log('✅ Event and categories updated successfully');
      
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event. Please check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      isAllDay: false,
      hideTime: false,
      hideEndTime: false,
      timeNotes: '',
      location: '',
      otherLocations: [],
      hideLocation: false,
      organizer: '',
      otherOrganizers: [],
      hideOrganizer: false,
      category: [],
      format: [],
      speakers: [],
      hideSpeakers: false,
      eventLink: '',
      moreInfoLink: '',
      moreInfoTarget: 'current',
      eventStatus: 'scheduled'
    });
    setActiveFormSection('basic');
    setEditingEventId(null);
    setUpdateSuccess(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted, editingEventId:', editingEventId);
    if (editingEventId) {
      handleUpdateEvent();
    } else {
      handleAddEvent();
    }
  };

  const handleCategoryNameChange = (name: string) => {
    setCategoryForm({
      ...categoryForm,
      name
    });
  };

  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) return;

    try {
      const parentId = categoryForm.parent !== 'none' && categoryForm.parent 
        ? data.categories.find(c => c.name === categoryForm.parent)?.id || null
        : null;

      await createCategory({
        name: categoryForm.name.trim(),
        slug: categoryForm.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
        parent_id: parentId,
        description: categoryForm.description.trim(),
        color: categoryForm.color
      });

      console.log('Category created in Supabase');
      
      // Reload data
      await loadAllData();

      setCategoryForm({
        name: '',
        slug: '',
        parent: 'none',
        description: '',
        color: ''
      });
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category. Please check console for details.');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }
    
    try {
      console.log('Attempting to delete category:', categoryId);
      await deleteCategoryFromDB(categoryId);
      console.log('Category deleted from Supabase successfully:', categoryId);
      
      // Reload data
      await loadAllData();
      alert('Category deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting category:', error);
      alert(`Failed to delete category: ${error?.message || 'Unknown error'}. Check if you have admin permissions in Supabase.`);
    }
  };

  const handleEditCategory = (categoryId: string) => {
    const category = data.categories.find(cat => cat.id === categoryId);
    if (category) {
      setEditingCategory(categoryId);
      setEditCategoryForm({
        name: category.name,
        slug: category.slug,
        parent: category.parent || 'none',
        description: category.description,
        color: category.color
      });
    }
  };

  const handleUpdateCategory = async (categoryId: string) => {
    if (!editCategoryForm.name.trim()) return;

    try {
      const parentId = editCategoryForm.parent !== 'none' && editCategoryForm.parent 
        ? data.categories.find(c => c.name === editCategoryForm.parent)?.id || null
        : null;

      await updateCategory(categoryId, {
        name: editCategoryForm.name.trim(),
        slug: editCategoryForm.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
        parent_id: parentId,
        description: editCategoryForm.description.trim(),
        color: editCategoryForm.color
      });

      console.log('Category updated in Supabase:', categoryId);
      
      // Reload data
      await loadAllData();

      setEditingCategory(null);
      setEditCategoryForm({
        name: '',
        slug: '',
        parent: 'none',
        description: '',
        color: ''
      });
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category. Please check console for details.');
    }
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setEditCategoryForm({
      name: '',
      slug: '',
      parent: 'none',
      description: '',
      color: ''
    });
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSelectAllCategories = () => {
    setSelectedCategories(
      selectedCategories.length === currentCategories.length 
        ? [] 
        : currentCategories.map(cat => cat.id)
    );
  };

  const handleBulkDeleteCategories = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCategories = async () => {
    try {
      // Delete all selected categories
      await Promise.all(selectedCategories.map(id => deleteCategoryFromDB(id)));
      console.log('Bulk deleted categories:', selectedCategories);
      
      setSelectedCategories([]);
      setShowDeleteConfirm(false);
      
      // Reload data
      await loadAllData();
    } catch (error) {
      console.error('Error bulk deleting categories:', error);
      alert('Failed to delete some categories. Please check console for details.');
      setShowDeleteConfirm(false);
    }
  };

  const cancelDeleteCategories = () => {
    setShowDeleteConfirm(false);
  };

  const handleSelectFormat = (formatId: string) => {
    setSelectedFormats(prev => 
      prev.includes(formatId) 
        ? prev.filter(f => f !== formatId)
        : [...prev, formatId]
    );
  };

  const handleSelectAllFormats = () => {
    setSelectedFormats(
      selectedFormats.length === data.formats.length 
        ? [] 
        : data.formats.map(f => f.id)
    );
  };

  const handleBulkDeleteFormats = () => {
    setShowFormatDeleteConfirm(true);
  };

  const confirmDeleteFormats = async () => {
    try {
      // Delete all selected formats
      await Promise.all(selectedFormats.map(id => deleteFormatFromDB(id)));
      console.log('Bulk deleted formats:', selectedFormats);
      
      setSelectedFormats([]);
      setShowFormatDeleteConfirm(false);
      
      // Reload data
      await loadAllData();
    } catch (error) {
      console.error('Error bulk deleting formats:', error);
      alert('Failed to delete some formats. Please check console for details.');
      setShowFormatDeleteConfirm(false);
    }
  };

  const cancelDeleteFormats = () => {
    setShowFormatDeleteConfirm(false);
  };

  const handleFormatNameChange = (name: string) => {
    setFormatForm({...formatForm, name});
  };

  const handleAddFormat = async () => {
    if (!formatForm.name.trim()) return;

    try {
      const parentId = formatForm.parent !== 'none' && formatForm.parent 
        ? data.formats.find(f => f.name === formatForm.parent)?.id || null
        : null;

      await createFormat({
        name: formatForm.name.trim(),
        slug: formatForm.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
        parent_id: parentId,
        description: formatForm.description.trim(),
        color: formatForm.color
      });

      console.log('Format created in Supabase');
      
      // Reload data
      await loadAllData();

      setFormatForm({
        name: '',
        slug: '',
        parent: 'none',
        description: '',
        color: ''
      });
    } catch (error) {
      console.error('Error creating format:', error);
      alert('Failed to create format. Please check console for details.');
    }
  };

  const handleEditFormat = (formatId: string) => {
    const format = data.formats.find(fmt => fmt.id === formatId);
    if (format) {
      setEditingFormat(formatId);
      setEditFormatForm({
        name: format.name,
        slug: format.slug,
        parent: format.parent || 'none',
        description: format.description,
        color: format.color
      });
    }
  };

  const handleUpdateFormat = async (formatId: string) => {
    if (!editFormatForm.name.trim()) return;

    try {
      const parentId = editFormatForm.parent !== 'none' && editFormatForm.parent 
        ? data.formats.find(f => f.name === editFormatForm.parent)?.id || null
        : null;

      await updateFormat(formatId, {
        name: editFormatForm.name.trim(),
        slug: editFormatForm.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
        parent_id: parentId,
        description: editFormatForm.description.trim(),
        color: editFormatForm.color
      });

      console.log('Format updated in Supabase:', formatId);
      
      // Reload data
      await loadAllData();

      setEditingFormat(null);
      setEditFormatForm({
        name: '',
        slug: '',
        parent: 'none',
        description: '',
        color: ''
      });
    } catch (error) {
      console.error('Error updating format:', error);
      alert('Failed to update format. Please check console for details.');
    }
  };

  const handleCancelEditFormat = () => {
    setEditingFormat(null);
    setEditFormatForm({
      name: '',
      slug: '',
      parent: 'none',
      description: '',
      color: ''
    });
  };

  const handleDeleteFormat = async (formatId: string) => {
    if (!confirm('Are you sure you want to delete this format?')) {
      return;
    }
    
    try {
      console.log('Attempting to delete format:', formatId);
      await deleteFormatFromDB(formatId);
      console.log('Format deleted from Supabase successfully:', formatId);
      
      // Reload data
      await loadAllData();
      alert('Format deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting format:', error);
      alert(`Failed to delete format: ${error?.message || 'Unknown error'}. Check if you have admin permissions in Supabase.`);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEventFromDB(eventId);
      console.log('Event deleted from Supabase:', eventId);
      
      // Reload events from Supabase
      await loadAllData();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please check console for details.');
    }
  };

  const handleBulkDelete = async () => {
    try {
      // Delete all selected events
      await Promise.all(selectedEvents.map(id => deleteEventFromDB(id)));
      console.log('Bulk deleted events:', selectedEvents);
      
      setSelectedEvents([]);
      
      // Reload events from Supabase
      await loadAllData();
    } catch (error) {
      console.error('Error bulk deleting events:', error);
      alert('Failed to delete some events. Please check console for details.');
    }
  };

  const handleSelectEvent = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleEventRowClick = (event: React.MouseEvent, eventId: string) => {
    // Don't trigger row click if clicking on checkbox or action buttons
    const target = event.target as HTMLElement;
    if (target.closest('input[type="checkbox"]') || target.closest('button')) {
      return;
    }
    
    // Switch to edit mode
    handleEditEvent(eventId);
  };

  const handleEditEvent = (eventId: string) => {
    const eventToEdit = events.find(e => e.id === eventId);
    if (!eventToEdit) return;

    // Set editing mode
    setEditingEventId(eventId);
    setActiveSection('add-event');
    setActiveFormSection('basic');
    setUpdateSuccess(false); // Reset success state

    // Pre-fill form with existing event data
    setFormData({
      title: eventToEdit.title,
      description: eventToEdit.description,
      date: eventToEdit.date,
      startTime: eventToEdit.startTime,
      endTime: eventToEdit.endTime,
      isAllDay: eventToEdit.isAllDay,
      hideTime: eventToEdit.hideTime,
      hideEndTime: eventToEdit.hideEndTime,
      timeNotes: eventToEdit.timeNotes,
      location: eventToEdit.location ? data.locations.find(l => l.name === eventToEdit.location)?.id || '' : '',
      otherLocations: eventToEdit.otherLocations || [],
      hideLocation: eventToEdit.hideLocation ?? false,
      organizer: eventToEdit.organizer,
      otherOrganizers: eventToEdit.otherOrganizers || [],
      hideOrganizer: eventToEdit.hideOrganizer ?? false,
      category: eventToEdit.category || [], // Already an array from database
      format: eventToEdit.format ? [eventToEdit.format] : [],
      speakers: eventToEdit.speakers || [],
      hideSpeakers: eventToEdit.hideSpeakers ?? false,
      eventLink: eventToEdit.eventLink || '',
      moreInfoLink: eventToEdit.moreInfoLink || '',
      moreInfoTarget: eventToEdit.moreInfoTarget || 'current',
      eventStatus: eventToEdit.eventStatus || 'scheduled'
    });
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    resetForm();
  };

  // Stable callback functions for MultiSelect components
  const handleCategoryChange = React.useCallback((selected: string[]) => {
    setFormData(prev => ({...prev, category: selected}));
  }, []);

  const handleFormatChange = React.useCallback((selected: string[]) => {
    setFormData(prev => ({...prev, format: selected}));
  }, []);

  const handleSpeakerChange = React.useCallback((selected: string[]) => {
    setFormData(prev => ({...prev, speakers: selected}));
  }, []);

  const handleOtherLocationsChange = React.useCallback((selected: string[]) => {
    setFormData(prev => ({...prev, otherLocations: selected}));
  }, []);

  const handleOtherOrganizersChange = React.useCallback((selected: string[]) => {
    setFormData(prev => ({...prev, otherOrganizers: selected}));
  }, []);

  const handleSelectAll = () => {
    setSelectedEvents(
      selectedEvents.length === sortedEvents.length 
        ? [] 
        : sortedEvents.map(e => e.id)
    );
  };

  const filteredEvents = events.filter(event => {
    // Date filtering logic
    let matchesDate = true;
    if (filters.date !== 'all') {
      const now = new Date();
      const eventDate = new Date(`${event.date}T${event.startTime}`);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      
      switch (filters.date) {
        case 'today':
          matchesDate = eventDay.getTime() === today.getTime();
          break;
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          matchesDate = eventDay >= weekStart && eventDay <= weekEnd;
          break;
        case 'month':
          matchesDate = eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
          break;
      }
    }

    const matchesFormat = filters.format === 'all' || event.format === filters.format;
    const matchesLocation = filters.location === 'all' || event.location === filters.location;
    const matchesOrganizer = filters.organizer === 'all' || event.organizer === filters.organizer;
    const matchesCategory = filters.category === 'all' || (Array.isArray(event.category) ? event.category.includes(filters.category) : event.category === filters.category);
    const matchesStartDate = !filters.startDate || event.date === filters.startDate;
    
    const now = new Date();
    const eventDate = new Date(`${event.date}T${event.startTime}`);
    const matchesEventType = filters.eventType === 'all' || 
      (filters.eventType === 'upcoming' && eventDate >= now) ||
      (filters.eventType === 'expired' && eventDate < now);
    
    const matches = matchesDate && matchesFormat && matchesLocation && 
           matchesOrganizer && matchesCategory && matchesStartDate && matchesEventType;
    
    // Debug logging
    if (!matches) {
      console.log('Event filtered out:', event.title, {
        matchesDate,
        matchesFormat,
        matchesLocation,
        matchesOrganizer,
        matchesCategory,
        matchesStartDate,
        matchesEventType,
        eventDate: eventDate.toISOString(),
        now: now.toISOString()
      });
    }
    
    return matches;
  });

  // Sorting functionality
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedEvents = React.useMemo(() => {
    if (!sortConfig) return filteredEvents;

    return [...filteredEvents].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'title':
          aValue = a.title?.toLowerCase() || '';
          bValue = b.title?.toLowerCase() || '';
          break;
        case 'author':
          aValue = a.author?.toLowerCase() || '';
          bValue = b.author?.toLowerCase() || '';
          break;
        case 'category':
          aValue = a.category?.toLowerCase() || '';
          bValue = b.category?.toLowerCase() || '';
          break;
        case 'format':
          aValue = a.format?.toLowerCase() || '';
          bValue = b.format?.toLowerCase() || '';
          break;
        case 'location':
          aValue = a.location?.toLowerCase() || '';
          bValue = b.location?.toLowerCase() || '';
          break;
        case 'organizer':
          aValue = a.organizer?.toLowerCase() || '';
          bValue = b.organizer?.toLowerCase() || '';
          break;
        case 'speakers':
          aValue = a.speakers?.join(', ').toLowerCase() || '';
          bValue = b.speakers?.join(', ').toLowerCase() || '';
          break;
        case 'startDate':
          aValue = new Date(`${a.date}T${a.startTime || '00:00'}`);
          bValue = new Date(`${b.date}T${b.startTime || '00:00'}`);
          break;
        case 'endDate':
          aValue = new Date(`${a.date}T${a.endTime || '23:59'}`);
          bValue = new Date(`${b.date}T${b.endTime || '23:59'}`);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredEvents, sortConfig]);

  // Organize categories hierarchically
  const organizeCategories = (categories: Category[]) => {
    const organized: Category[] = [];
    const categoryMap = new Map(categories.map(cat => [cat.name, cat]));
    
    // First, add all parent categories (those without parent or parent is 'none')
    categories.forEach(category => {
      if (!category.parent || category.parent === 'none' || category.parent === '') {
        organized.push(category);
        
        // Then add its children
        categories.forEach(subCategory => {
          if (subCategory.parent === category.name) {
            organized.push(subCategory);
          }
        });
      }
    });
    
    // Add any orphaned categories (categories with non-existent parent)
    categories.forEach(category => {
      if (category.parent && category.parent !== 'none' && category.parent !== '' && !categoryMap.has(category.parent)) {
        if (!organized.includes(category)) {
          organized.push(category);
        }
      }
    });
    
    return organized;
  };

  // Organize formats hierarchically
  const organizeFormats = (formats: Format[]) => {
    const organized: Format[] = [];
    const formatMap = new Map(formats.map(fmt => [fmt.name, fmt]));
    
    // First, add all parent formats (those without parent or parent is 'none')
    formats.forEach(format => {
      if (!format.parent || format.parent === 'none' || format.parent === '') {
        organized.push(format);
        
        // Then add its children
        formats.forEach(subFormat => {
          if (subFormat.parent === format.name) {
            organized.push(subFormat);
          }
        });
      }
    });
    
    // Add any orphaned formats (formats with non-existent parent)
    formats.forEach(format => {
      if (format.parent && format.parent !== 'none' && format.parent !== '' && !formatMap.has(format.parent)) {
        if (!organized.includes(format)) {
          organized.push(format);
        }
      }
    });
    
    return organized;
  };

  const currentData = (() => {
    if (activeSection === 'categories') return data.categories || [];
    if (activeSection === 'formats') return data.formats || [];
    if (activeSection === 'locations') return data.locations || [];
    if (activeSection === 'speakers') return data.speakers || [];
    if (activeSection === 'organizers') return data.organizers || [];
    return [];
  })();
  const currentCategories = data.categories || [];
  const organizedCategories = organizeCategories(currentCategories);
  const currentFormats = data.formats || [];
  const organizedFormats = organizeFormats(currentFormats);
  const currentItem = menuItems.find(item => item.key === activeSection);

  // Show loading state while checking authentication and admin status
  if (status === 'loading' || adminLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{loading ? 'Loading data from Supabase...' : 'Checking permissions...'}</p>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-20">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 bg-gray-800 text-white">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-300 mb-6">Event Data</h2>
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.key;
                
                return (
                  <button
                    key={item.key}
                    onClick={() => handleSectionClick(item.key)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                      isActive 
                        ? 'bg-gray-700 text-white font-medium' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {isActive && <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-20 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">
              {menuItems.find(item => item.key === activeSection)?.label || 'Event Data'}
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center gap-2"
            >
              <Menu className="w-4 h-4" />
              Menu
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="fixed top-20 left-0 bottom-0 w-64 bg-gray-800 text-white" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-300">Event Data</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <nav className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.key;
                    
                    return (
                      <button
                        key={item.key}
                        onClick={() => handleSectionClick(item.key)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                          isActive 
                            ? 'bg-gray-700 text-white font-medium' 
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                        {isActive && <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8 overflow-y-auto">
          {/* Data Source Indicator */}
          
          <div className="w-full">
            {activeSection === 'all-events' ? (
              /* Events List View */
              <>
                {/* Header */}
                <div className="mb-6 lg:mb-8">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">All Events</h1>
                  <p className="text-gray-600 mt-2">Manage all your training events</p>
                </div>

                {/* Filter Toolbar */}
                <Card className="mb-6">
                  <CardContent className="p-3 lg:p-4">
                    <div className="flex flex-wrap gap-2 lg:gap-4 items-center">
                      {/* Bulk Actions */}
                      {selectedEvents.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={handleBulkDelete}
                            className="w-full sm:w-auto"
                          >
                            Delete Selected ({selectedEvents.length})
                          </Button>
                        </div>
                      )}

                      {/* Filter Dropdowns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full">
                        <Select value={filters.date} onValueChange={(value) => setFilters({...filters, date: value})}>
                          <SelectTrigger className="w-full">
                          <SelectValue placeholder="All dates" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All dates</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This week</SelectItem>
                          <SelectItem value="month">This month</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filters.format} onValueChange={(value) => setFilters({...filters, format: value})}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Show all Format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Show all Format</SelectItem>
                          {data.formats.map((format, index) => (
                            <SelectItem key={index} value={format.name}>{format.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={filters.location} onValueChange={(value) => setFilters({...filters, location: value})}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Show all locations" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Show all locations</SelectItem>
                          {data.locations.map((location) => (
                            <SelectItem key={location.id} value={location.name}>{location.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={filters.organizer} onValueChange={(value) => setFilters({...filters, organizer: value})}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Show all organizers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Show all organizers</SelectItem>
                          {data.organizers.map((organizer, index) => (
                            <SelectItem key={index} value={organizer}>{organizer}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Show all Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Show all Categories</SelectItem>
                          {currentCategories.map((category) => (
                            <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                        {/* Start Date Input */}
                        <Input
                          type="date"
                          value={filters.startDate}
                          onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                          className="w-40"
                          placeholder="Start Date"
                        />
                      </div>

                      {/* Reset and Event Type Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full sm:w-auto"
                          onClick={() => setFilters({
                            date: 'all',
                            format: 'all',
                            location: 'all',
                            organizer: 'all',
                            category: 'all',
                            startDate: '',
                            eventType: 'all'
                          })}
                        >
                          Reset
                        </Button>

                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                          <Button 
                            variant={filters.eventType === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilters({...filters, eventType: 'all'})}
                            className="flex-1 sm:flex-none"
                          >
                            All Events
                          </Button>
                          <Button 
                            variant={filters.eventType === 'expired' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilters({...filters, eventType: 'expired'})}
                            className="flex-1 sm:flex-none"
                          >
                            Expired Events
                          </Button>
                          <Button 
                            variant={filters.eventType === 'upcoming' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilters({...filters, eventType: 'upcoming'})}
                            className="flex-1 sm:flex-none"
                          >
                            Upcoming Events
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Events Summary */}
                {sortedEvents.length > 0 && (
                  <div className="mb-4 text-sm text-gray-600">
                    Showing {sortedEvents.length} of {events.length} events
                    {selectedEvents.length > 0 && (
                      <span className="ml-2 text-blue-600">
                        ({selectedEvents.length} selected)
                      </span>
                    )}
                  </div>
                )}

                {/* Events Table */}
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                    {events.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
                        <p className="text-gray-500 mb-4">Create your first event to get started</p>
                        <Button onClick={() => setActiveSection('add-event')}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Event
                        </Button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="text-left p-4 font-medium text-gray-900">
                                <Checkbox
                                  checked={selectedEvents.length === sortedEvents.length && sortedEvents.length > 0}
                                  onCheckedChange={handleSelectAll}
                                />
                              </th>
                              <th className="text-left p-4 font-medium text-gray-900">
                                <button 
                                  onClick={() => handleSort('title')}
                                  className="flex items-center gap-2 hover:text-gray-700 transition-colors"
                                >
                                  Title
                                  {sortConfig?.key === 'title' ? (
                                    sortConfig.direction === 'asc' ? 
                                      <ArrowUpDown className="w-4 h-4 text-blue-600" /> : 
                                      <ArrowUpDown className="w-4 h-4 text-blue-600 rotate-180" />
                                  ) : (
                                  <ArrowUpDown className="w-4 h-4 text-gray-400" />
                                  )}
                                </button>
                              </th>
                              <th className="text-left p-4 font-medium text-gray-900">
                                <button 
                                  onClick={() => handleSort('author')}
                                  className="flex items-center gap-2 hover:text-gray-700 transition-colors"
                                >
                                  Author
                                  {sortConfig?.key === 'author' ? (
                                    sortConfig.direction === 'asc' ? 
                                      <ArrowUpDown className="w-4 h-4 text-blue-600" /> : 
                                      <ArrowUpDown className="w-4 h-4 text-blue-600 rotate-180" />
                                  ) : (
                                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                                  )}
                                </button>
                              </th>
                              <th className="text-left p-4 font-medium text-gray-900">
                                <button 
                                  onClick={() => handleSort('category')}
                                  className="flex items-center gap-2 hover:text-gray-700 transition-colors"
                                >
                                  Category
                                  {sortConfig?.key === 'category' ? (
                                    sortConfig.direction === 'asc' ? 
                                      <ArrowUpDown className="w-4 h-4 text-blue-600" /> : 
                                      <ArrowUpDown className="w-4 h-4 text-blue-600 rotate-180" />
                                  ) : (
                                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                                  )}
                                </button>
                              </th>
                              <th className="text-left p-4 font-medium text-gray-900">
                                <button 
                                  onClick={() => handleSort('format')}
                                  className="flex items-center gap-2 hover:text-gray-700 transition-colors"
                                >
                                  Format
                                  {sortConfig?.key === 'format' ? (
                                    sortConfig.direction === 'asc' ? 
                                      <ArrowUpDown className="w-4 h-4 text-blue-600" /> : 
                                      <ArrowUpDown className="w-4 h-4 text-blue-600 rotate-180" />
                                  ) : (
                                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                                  )}
                                </button>
                              </th>
                              <th className="text-left p-4 font-medium text-gray-900">
                                <button 
                                  onClick={() => handleSort('location')}
                                  className="flex items-center gap-2 hover:text-gray-700 transition-colors"
                                >
                                  Location
                                  {sortConfig?.key === 'location' ? (
                                    sortConfig.direction === 'asc' ? 
                                      <ArrowUpDown className="w-4 h-4 text-blue-600" /> : 
                                      <ArrowUpDown className="w-4 h-4 text-blue-600 rotate-180" />
                                  ) : (
                                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                                  )}
                                </button>
                              </th>
                              <th className="text-left p-4 font-medium text-gray-900">
                                <button 
                                  onClick={() => handleSort('organizer')}
                                  className="flex items-center gap-2 hover:text-gray-700 transition-colors"
                                >
                                  Organizer
                                  {sortConfig?.key === 'organizer' ? (
                                    sortConfig.direction === 'asc' ? 
                                      <ArrowUpDown className="w-4 h-4 text-blue-600" /> : 
                                      <ArrowUpDown className="w-4 h-4 text-blue-600 rotate-180" />
                                  ) : (
                                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                                  )}
                                </button>
                              </th>
                              <th className="text-left p-4 font-medium text-gray-900">
                                <button 
                                  onClick={() => handleSort('startDate')}
                                  className="flex items-center gap-2 hover:text-gray-700 transition-colors"
                                >
                                  Start Date
                                  {sortConfig?.key === 'startDate' ? (
                                    sortConfig.direction === 'asc' ? 
                                      <ArrowUpDown className="w-4 h-4 text-blue-600" /> : 
                                      <ArrowUpDown className="w-4 h-4 text-blue-600 rotate-180" />
                                  ) : (
                                  <ArrowUpDown className="w-4 h-4 text-gray-400" />
                                  )}
                                </button>
                              </th>
                              <th className="text-left p-4 font-medium text-gray-900">
                                <button 
                                  onClick={() => handleSort('endDate')}
                                  className="flex items-center gap-2 hover:text-gray-700 transition-colors"
                                >
                                  End Date
                                  {sortConfig?.key === 'endDate' ? (
                                    sortConfig.direction === 'asc' ? 
                                      <ArrowUpDown className="w-4 h-4 text-blue-600" /> : 
                                      <ArrowUpDown className="w-4 h-4 text-blue-600 rotate-180" />
                                  ) : (
                                  <ArrowUpDown className="w-4 h-4 text-gray-400" />
                                  )}
                                </button>
                              </th>
                              <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedEvents.map((event, index) => (
                              <tr 
                                key={event.id} 
                                className="border-b hover:bg-gray-50 cursor-pointer"
                                onClick={(e) => handleEventRowClick(e, event.id)}
                              >
                                <td className="p-4">
                                  <Checkbox
                                    checked={selectedEvents.includes(event.id)}
                                    onCheckedChange={() => handleSelectEvent(event.id)}
                                  />
                                </td>
                                <td className="p-4">
                                  <div className="font-medium text-gray-900">{event.title}</div>
                                </td>
                                <td className="p-4 text-gray-600">{event.author || '-'}</td>
                                <td className="p-4 text-gray-600">
                                  {Array.isArray(event.category) && event.category.length > 0 
                                    ? event.category.join(', ') 
                                    : (event.category || '-')}
                                </td>
                                <td className="p-4 text-gray-600">{event.format || '-'}</td>
                                <td className="p-4 text-gray-600">{event.location || '-'}</td>
                                <td className="p-4 text-gray-600">
                                  {event.allOrganizers && event.allOrganizers.length > 0 
                                    ? event.allOrganizers.join(', ') 
                                    : (event.organizer || '-')}
                                </td>
                                <td className="p-4 text-gray-600">
                                  {formatDateTime(event.date, event.startTime)}
                                </td>
                                <td className="p-4 text-gray-600">
                                  {formatDateTime(event.date, event.endTime)}
                                </td>
                                <td className="p-4">
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteEvent(event.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : activeSection === 'add-event' ? (
              /* Add Event Form */
              <>
                {/* Header */}
                <div className="mb-6 lg:mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                        {editingEventId ? 'Edit Event' : 'Add Event'}
                      </h1>
                      <p className="text-gray-600 mt-2">
                        {editingEventId ? 'Update your training event' : 'Create a new training event'}
                      </p>
                    </div>
                    {editingEventId && (
                      <Button 
                        variant="outline" 
                        onClick={handleCancelEdit}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                {/* Main Form Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
                  {/* Sidebar Navigation */}
                  <div className="lg:col-span-1 order-2 lg:order-1">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Event Details</h3>
                      <nav className="space-y-1">
                        <button
                          onClick={() => setActiveFormSection('basic')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                            activeFormSection === 'basic'
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Basic Information
                        </button>
                        <button
                          onClick={() => setActiveFormSection('datetime')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                            activeFormSection === 'datetime'
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Date And Time
                        </button>
                        <button
                          onClick={() => setActiveFormSection('location')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                            activeFormSection === 'location'
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Location/Venue
                        </button>
                        <button
                          onClick={() => setActiveFormSection('links')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                            activeFormSection === 'links'
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Event Links
                        </button>
                        <button
                          onClick={() => setActiveFormSection('organizer')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                            activeFormSection === 'organizer'
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Organizer
                        </button>
                        <button
                          onClick={() => setActiveFormSection('speakers')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                            activeFormSection === 'speakers'
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Speakers
                        </button>
                        <button
                          onClick={() => setActiveFormSection('status')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                            activeFormSection === 'status'
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Event Status
                        </button>
                      </nav>
                    </div>
                  </div>

                  {/* Main Content Area */}
                  <div className="lg:col-span-4 order-1 lg:order-2">
                    <form onSubmit={handleFormSubmit}>
                      <Card>
                        <CardContent className="p-6">
                          {/* Basic Information */}
                          {activeFormSection === 'basic' && (
                            <div className="space-y-6">
                              <div>
                                <Label htmlFor="title">Event Title *</Label>
                                <Input
                                  id="title"
                                  value={formData.title}
                                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                                  placeholder="Enter event title"
                                  required
                                  className="mt-1"
                                />
                              </div>

                              <div>
                                <Label htmlFor="description">Event Description</Label>
                                <div className="mt-1">
                                  <RichTextEditor
                                    value={formData.description}
                                    onChange={(value) => setFormData({...formData, description: value})}
                                    placeholder="Enter event description"
                                  />
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="category">Category</Label>
                                  {formData.category.length > 0 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setFormData({...formData, category: []})}
                                      className="text-xs h-auto py-1 px-2"
                                    >
                                      Clear All
                                    </Button>
                                  )}
                                </div>
                                <DebugMultiSelect
                                  options={currentCategories.map(cat => ({ value: cat.name, label: cat.name }))}
                                  selected={formData.category}
                                  onChange={handleCategoryChange}
                                  placeholder="Select categories"
                                  className="mt-1"
                                />
                              </div>

                              <div>
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="format">Format</Label>
                                  {formData.format.length > 0 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setFormData({...formData, format: []})}
                                      className="text-xs h-auto py-1 px-2"
                                    >
                                      Clear All
                                    </Button>
                                  )}
                                </div>
                                <DebugMultiSelect
                                  options={data.formats.map(format => ({ value: format.name, label: format.name }))}
                                  selected={formData.format}
                                  onChange={handleFormatChange}
                                  placeholder="Select formats"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          )}

                          {/* Date And Time */}
                          {activeFormSection === 'datetime' && (
                            <div className="space-y-6">
                              <h3 className="text-lg font-semibold text-gray-900">Date And Time</h3>
                              
                              {/* Start Date */}
                              <div>
                                <Label htmlFor="date" className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Start Date
                                </Label>
                                <div className="flex items-center gap-3 mt-2">
                                  <Input
                                    id="date"
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                                    required
                                    className="flex-1"
                                  />
                                  {!formData.isAllDay && (
                                    <Input
                                      type="time"
                                      value={formData.startTime}
                                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                                      required
                                    />
                                  )}
                                </div>
                              </div>

                              {/* End Date */}
                              <div>
                                <Label htmlFor="endDate" className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  End Date
                                </Label>
                                <div className="flex items-center gap-3 mt-2">
                                  <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                                    className="flex-1"
                                  />
                                  {!formData.isAllDay && (
                                    <Input
                                      type="time"
                                      value={formData.endTime}
                                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                                      required
                                    />
                                  )}
                                </div>
                              </div>

                              {/* All-day Event */}
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="isAllDay"
                                  checked={formData.isAllDay}
                                  onCheckedChange={(checked) => {
                                    const isAllDay = !!checked;
                                    setFormData({
                                      ...formData, 
                                      isAllDay,
                                      startTime: isAllDay ? '09:00' : formData.startTime,
                                      endTime: isAllDay ? '17:00' : formData.endTime
                                    });
                                  }}
                                />
                                <Label htmlFor="isAllDay">All-day Event</Label>
                              </div>

                              {/* Time Options */}
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="hideTime"
                                    checked={formData.hideTime}
                                    onCheckedChange={(checked) => setFormData({...formData, hideTime: !!checked})}
                                  />
                                  <Label htmlFor="hideTime">Hide Event Time</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="hideEndTime"
                                    checked={formData.hideEndTime}
                                    onCheckedChange={(checked) => setFormData({...formData, hideEndTime: !!checked})}
                                  />
                                  <Label htmlFor="hideEndTime">Hide Event End Time</Label>
                                </div>
                              </div>

                              {/* Time Notes */}
                              <div>
                                <Label htmlFor="timeNotes">Notes on the time</Label>
                                <Textarea
                                  id="timeNotes"
                                  value={formData.timeNotes}
                                  onChange={(e) => setFormData({...formData, timeNotes: e.target.value})}
                                  placeholder="Any additional notes about timing"
                                  rows={3}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          )}

                          {/* Location */}
                          {activeFormSection === 'location' && (
                            <div className="space-y-6">
                              <h3 className="text-lg font-semibold text-gray-900">Location/Venue</h3>

                              <div>
                                <Label htmlFor="location">Event Main Location</Label>
                                <div className="flex gap-2 mt-1">
                                  <Select value={formData.location} onValueChange={(value) => setFormData({...formData, location: value})}>
                                    <SelectTrigger className="flex-1">
                                      <SelectValue placeholder="Select location">
                                        {formData.location ? data.locations.find(l => l.id === formData.location)?.name : "Select location"}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {data.locations.map((location) => (
                                        <SelectItem key={location.id} value={location.id}>
                                          {location.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {formData.location && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setFormData({...formData, location: ''})}
                                      className="px-3"
                                      title="Clear location"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="otherLocations">Other Locations</Label>
                                  {formData.otherLocations.length > 0 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setFormData({...formData, otherLocations: []})}
                                      className="text-xs h-auto py-1 px-2"
                                    >
                                      Clear All
                                    </Button>
                                  )}
                                </div>
                                <DebugMultiSelect
                                  options={data.locations.filter(loc => loc.id !== formData.location).map(location => ({ value: location.id, label: location.name }))}
                                  selected={formData.otherLocations}
                                  onChange={handleOtherLocationsChange}
                                  placeholder="Select additional locations"
                                  className="mt-1"
                                />
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="hideLocation"
                                  checked={formData.hideLocation}
                                  onCheckedChange={(checked) => setFormData({...formData, hideLocation: !!checked})}
                                />
                                <Label htmlFor="hideLocation">Hide Location on Event Page</Label>
                              </div>
                            </div>
                          )}

                          {/* Event Links */}
                          {activeFormSection === 'links' && (
                            <div className="space-y-6">
                              <h3 className="text-lg font-semibold text-gray-900">Event Links</h3>
                              
                              <div>
                                <Label htmlFor="eventLink">Event Link</Label>
                                <Input
                                  id="eventLink"
                                  type="url"
                                  value={formData.eventLink}
                                  onChange={(e) => setFormData({...formData, eventLink: e.target.value})}
                                  placeholder="eg. http://yoursite.com/your-event"
                                  className="mt-1"
                                />
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div className="lg:col-span-2">
                                  <Label htmlFor="moreInfoLink">More Info</Label>
                                  <Input
                                    id="moreInfoLink"
                                    type="url"
                                    value={formData.moreInfoLink}
                                    onChange={(e) => setFormData({...formData, moreInfoLink: e.target.value})}
                                    placeholder="eg. http://yoursite.com/your-event"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="moreInfoTarget">More Information</Label>
                                  <Select 
                                    value={formData.moreInfoTarget} 
                                    onValueChange={(value: 'current' | 'new') => setFormData({...formData, moreInfoTarget: value})}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue placeholder="Select window" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="current">Current Window</SelectItem>
                                      <SelectItem value="new">New Window</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Organizer */}
                          {activeFormSection === 'organizer' && (
                            <div className="space-y-6">
                              <h3 className="text-lg font-semibold text-gray-900">Organizer</h3>

                              <div>
                                <Label htmlFor="organizer">Event Main Organizer</Label>
                                <div className="flex gap-2 mt-1">
                                  <Select value={formData.organizer} onValueChange={(value) => setFormData({...formData, organizer: value})}>
                                    <SelectTrigger className="flex-1">
                                      <SelectValue placeholder="Select organizer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {data.organizers.map((organizer, index) => (
                                        <SelectItem key={index} value={organizer}>
                                          {organizer}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {formData.organizer && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setFormData({...formData, organizer: ''})}
                                      className="px-3"
                                      title="Clear organizer"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="otherOrganizers">Other Organizers</Label>
                                  {formData.otherOrganizers.length > 0 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setFormData({...formData, otherOrganizers: []})}
                                      className="text-xs h-auto py-1 px-2"
                                    >
                                      Clear All
                                    </Button>
                                  )}
                                </div>
                                <DebugMultiSelect
                                  options={data.organizers.filter(org => org !== formData.organizer).map(organizer => ({ value: organizer, label: organizer }))}
                                  selected={formData.otherOrganizers}
                                  onChange={handleOtherOrganizersChange}
                                  placeholder="Select additional organizers"
                                  className="mt-1"
                                />
                              </div>

                              <div>
                                <Label htmlFor="addOrganizer">Add New Organizer</Label>
                                <div className="mt-2">
                                  <Input
                                    placeholder="Add new organizer"
                                    value={newOrganizer}
                                    onChange={(e) => setNewOrganizer(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter' && newOrganizer.trim()) {
                                        setData(prev => ({
                                          ...prev,
                                          organizers: [...prev.organizers, newOrganizer.trim()]
                                        }));
                                        setNewOrganizer('');
                                      }
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => {
                                      if (newOrganizer.trim()) {
                                        setData(prev => ({
                                          ...prev,
                                          organizers: [...prev.organizers, newOrganizer.trim()]
                                        }));
                                        setNewOrganizer('');
                                      }
                                    }}
                                    disabled={!newOrganizer.trim()}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Organizer
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="hideOrganizer"
                                  checked={formData.hideOrganizer}
                                  onCheckedChange={(checked) => setFormData({...formData, hideOrganizer: !!checked})}
                                />
                                <Label htmlFor="hideOrganizer">Hide Organizer on Event Page</Label>
                              </div>
                            </div>
                          )}

                          {/* Speakers */}
                          {activeFormSection === 'speakers' && (
                            <div className="space-y-6">
                              <h3 className="text-lg font-semibold text-gray-900">Speakers</h3>

                              <div>
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="speakers">Event Speakers</Label>
                                  {formData.speakers.length > 0 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setFormData({...formData, speakers: []})}
                                      className="text-xs h-auto py-1 px-2"
                                    >
                                      Clear All
                                    </Button>
                                  )}
                                </div>
                                <DebugMultiSelect
                                  options={data.speakers.map(speaker => ({ value: speaker.name, label: `${speaker.name} - ${speaker.role}` }))}
                                  selected={formData.speakers}
                                  onChange={handleSpeakerChange}
                                  placeholder="Select speakers"
                                  className="mt-1"
                                />
                                <div className="mt-4">
                                  <Label>Add New Speaker</Label>
                                  <div className="grid grid-cols-2 gap-2 mt-2">
                                    <Input
                                      placeholder="Speaker name"
                                      value={newSpeaker.name}
                                      onChange={(e) => setNewSpeaker({...newSpeaker, name: e.target.value})}
                                    />
                                    <Input
                                      placeholder="Speaker role"
                                      value={newSpeaker.role}
                                      onChange={(e) => setNewSpeaker({...newSpeaker, role: e.target.value})}
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="mt-2"
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (newSpeaker.name.trim() && newSpeaker.role.trim()) {
                                        try {
                                          await createSpeaker({
                                            name: newSpeaker.name.trim(),
                                            role: newSpeaker.role.trim()
                                          });
                                          console.log('Speaker created in Supabase');
                                          setNewSpeaker({ name: '', role: '' });
                                          await loadAllData();
                                        } catch (error) {
                                          console.error('Error creating speaker:', error);
                                          alert('Failed to create speaker. Please check console for details.');
                                        }
                                      }
                                    }}
                                    disabled={!newSpeaker.name.trim() || !newSpeaker.role.trim()}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Speaker
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="hideSpeakers"
                                  checked={formData.hideSpeakers}
                                  onCheckedChange={(checked) => setFormData({...formData, hideSpeakers: !!checked})}
                                />
                                <Label htmlFor="hideSpeakers">Hide Speakers on Event Page</Label>
                              </div>
                            </div>
                          )}

                          {/* Event Status */}
                          {activeFormSection === 'status' && (
                            <div className="space-y-6">
                              <h3 className="text-lg font-semibold text-gray-900">Event Status</h3>
                              
                              <div className="space-y-4">
                                {/* Scheduled */}
                                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setFormData({...formData, eventStatus: 'scheduled'})}>
                                  <div className="flex items-center h-5">
                                    <input
                                      type="radio"
                                      name="eventStatus"
                                      value="scheduled"
                                      checked={formData.eventStatus === 'scheduled'}
                                      onChange={(e) => setFormData({...formData, eventStatus: e.target.value as any})}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Label className="font-medium text-gray-900 cursor-pointer">Scheduled</Label>
                                    <p className="text-sm text-gray-600 mt-1">For active events!</p>
                                  </div>
                                </div>

                                {/* Rescheduled */}
                                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setFormData({...formData, eventStatus: 'rescheduled'})}>
                                  <div className="flex items-center h-5">
                                    <input
                                      type="radio"
                                      name="eventStatus"
                                      value="rescheduled"
                                      checked={formData.eventStatus === 'rescheduled'}
                                      onChange={(e) => setFormData({...formData, eventStatus: e.target.value as any})}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Label className="font-medium text-gray-900 cursor-pointer">Rescheduled</Label>
                                    <p className="text-sm text-gray-600 mt-1">For rescheduled events!</p>
                                  </div>
                                </div>

                                {/* Postponed */}
                                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setFormData({...formData, eventStatus: 'postponed'})}>
                                  <div className="flex items-center h-5">
                                    <input
                                      type="radio"
                                      name="eventStatus"
                                      value="postponed"
                                      checked={formData.eventStatus === 'postponed'}
                                      onChange={(e) => setFormData({...formData, eventStatus: e.target.value as any})}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Label className="font-medium text-gray-900 cursor-pointer">Postponed</Label>
                                    <p className="text-sm text-gray-600 mt-1">If you postponed an event then you can use this status!</p>
                                  </div>
                                </div>

                                {/* Cancelled */}
                                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setFormData({...formData, eventStatus: 'cancelled'})}>
                                  <div className="flex items-center h-5">
                                    <input
                                      type="radio"
                                      name="eventStatus"
                                      value="cancelled"
                                      checked={formData.eventStatus === 'cancelled'}
                                      onChange={(e) => setFormData({...formData, eventStatus: e.target.value as any})}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Label className="font-medium text-gray-900 cursor-pointer">Cancelled</Label>
                                    <p className="text-sm text-gray-600 mt-1">If you cancelled an event then you should select this status!</p>
                                  </div>
                                </div>

                                {/* Moved Online */}
                                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setFormData({...formData, eventStatus: 'moved-online'})}>
                                  <div className="flex items-center h-5">
                                    <input
                                      type="radio"
                                      name="eventStatus"
                                      value="moved-online"
                                      checked={formData.eventStatus === 'moved-online'}
                                      onChange={(e) => setFormData({...formData, eventStatus: e.target.value as any})}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Label className="font-medium text-gray-900 cursor-pointer">Moved Online</Label>
                                    <p className="text-sm text-gray-600 mt-1">For the events that moved online!</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Form Actions */}
                      <div className="flex gap-2 mt-6">
                        <Button 
                          type="submit"
                          className={updateSuccess ? 'bg-green-600 hover:bg-green-700' : ''}
                          disabled={saving}
                        >
                          {saving ? 'Saving...' : updateSuccess ? '✓ Updated Successfully!' : editingEventId ? 'Update Event' : 'Add Event'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={resetForm}
                        >
                          {editingEventId ? 'Clear Form' : 'Reset Form'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setActiveSection('all-events')}
                        >
                          View All Events
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </>
            ) : activeSection === 'categories' ? (
              /* Category Management View */
              <>
                {/* Header */}
                <div className="mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Category</h1>
                    <p className="text-gray-600 mt-2">Manage categories that will appear in event forms</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Add New Category Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Add New Category</CardTitle>
                      <CardDescription>Create a new category for your events</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="categoryName">Name</Label>
                        <Input
                          id="categoryName"
                          value={categoryForm.name}
                          onChange={(e) => handleCategoryNameChange(e.target.value)}
                          placeholder="Enter category name"
                          className="mt-1"
                        />
                        <p className="text-sm text-gray-500 mt-1">The name is how it appears on your site.</p>
                      </div>

                      <div>
                        <Label htmlFor="categoryParent">Parent Category</Label>
                        <Select value={categoryForm.parent} onValueChange={(value) => setCategoryForm({...categoryForm, parent: value})}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {currentCategories
                              .filter(cat => !cat.parent || cat.parent === 'none' || cat.parent === '')
                              .map((category) => (
                                <SelectItem key={category.id} value={category.name}>
                                  {category.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-gray-500 mt-1">Assign a parent term to create a hierarchy. Only root categories can be selected as parents.</p>
                      </div>

                      <div>
                        <Label htmlFor="categoryDescription">Description</Label>
                        <Textarea
                          id="categoryDescription"
                          value={categoryForm.description}
                          onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                          placeholder="Enter category description"
                          rows={4}
                          className="mt-1"
                        />
                        <p className="text-sm text-gray-500 mt-1">The description is not prominent by default; however, some themes may show it.</p>
                      </div>

                      <div>
                        <Label htmlFor="categoryColor">Color</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <div 
                            className="w-6 h-6 border border-gray-300 rounded"
                            style={{ backgroundColor: categoryForm.color || '#ffffff' }}
                          ></div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowColorPicker(!showColorPicker)}
                          >
                            Select Colour
                          </Button>
                          <Input
                            type="text"
                            value={categoryForm.color}
                            onChange={(e) => setCategoryForm({...categoryForm, color: e.target.value})}
                            placeholder="#000000"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCategoryForm({...categoryForm, color: ''})}
                          >
                            Clear
                          </Button>
                        </div>
                        {showColorPicker && (
                          <div className="mt-2 p-4 border rounded-lg bg-white shadow-lg">
                            <div className="grid grid-cols-8 gap-2 mb-4">
                              {[
                                '#000000', '#ffffff', '#ff0000', '#ffa500',
                                '#ffff00', '#00ff00', '#0000ff', '#800080'
                              ].map((color) => (
                                <button
                                  key={color}
                                  className="w-8 h-8 border border-gray-300 rounded hover:scale-110 transition-transform"
                                  style={{ backgroundColor: color }}
                                  onClick={() => {
                                    setCategoryForm({...categoryForm, color});
                                    setShowColorPicker(false);
                                  }}
                                />
                              ))}
                            </div>
                            <div className="grid grid-cols-6 gap-1">
                              {[
                                '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3',
                                '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#ff6348', '#2ed573'
                              ].map((color) => (
                                <button
                                  key={color}
                                  className="w-6 h-6 border border-gray-300 rounded hover:scale-110 transition-transform"
                                  style={{ backgroundColor: color }}
                                  onClick={() => {
                                    setCategoryForm({...categoryForm, color});
                                    setShowColorPicker(false);
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        <p className="text-sm text-gray-500 mt-1">Optional category color</p>
                      </div>

                      <Button onClick={handleAddCategory} disabled={!categoryForm.name.trim()} className="w-full">
                        Add New Category
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Categories List */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Categories</CardTitle>
                          <CardDescription>
                            {currentCategories.length === 0 
                              ? "No categories added yet" 
                              : `${currentCategories.length} categories available`
                          }
                        </CardDescription>
                      </div>
                      {selectedCategories.length > 0 && (
                        <Button 
                          variant="destructive"
                          size="sm"
                          onClick={handleBulkDeleteCategories}
                        >
                          Delete Selected
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                    <CardContent>
                      {currentCategories.length === 0 ? (
                        <div className="text-center py-8">
                          <Tag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                          <p className="text-gray-500">No categories added yet</p>
                          <p className="text-sm text-gray-400 mt-1">Add your first category using the form on the left</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-5 gap-4 p-3 bg-gray-50 rounded-lg font-medium text-sm">
                            <div className="flex items-center gap-2">
                              <Checkbox 
                                checked={selectedCategories.length === currentCategories.length && currentCategories.length > 0}
                                onCheckedChange={handleSelectAllCategories}
                              />
                              <div>Name</div>
                            </div>
                            <div>Description</div>
                            <div>Count</div>
                            <div>Color</div>
                            <div>Actions</div>
                          </div>
                          {organizedCategories.map((category) => {
                            const isSubCategory = category.parent && category.parent !== 'none' && category.parent !== '';
                            const isEditing = editingCategory === category.id;
                            
                            if (isEditing) {
                              return (
                                <div 
                                  key={category.id} 
                                  className={`p-4 border rounded-lg bg-yellow-50 ${
                                    isSubCategory ? 'ml-8' : ''
                                  }`}
                                >
                                  <div className="space-y-3">
                                    <div>
                                      <Label className="text-xs">Name</Label>
                                      <Input
                                        value={editCategoryForm.name}
                                        onChange={(e) => setEditCategoryForm({...editCategoryForm, name: e.target.value})}
                                        className="mt-1"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Description</Label>
                                      <Textarea
                                        value={editCategoryForm.description}
                                        onChange={(e) => setEditCategoryForm({...editCategoryForm, description: e.target.value})}
                                        rows={2}
                                        className="mt-1"
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <Label className="text-xs">Parent</Label>
                                        <Select value={editCategoryForm.parent} onValueChange={(value) => setEditCategoryForm({...editCategoryForm, parent: value})}>
                                          <SelectTrigger className="mt-1">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {currentCategories
                                              .filter(cat => (!cat.parent || cat.parent === 'none' || cat.parent === '') && cat.id !== category.id)
                                              .map((cat) => (
                                                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                              ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label className="text-xs">Color</Label>
                                        <Input
                                          type="text"
                                          value={editCategoryForm.color}
                                          onChange={(e) => setEditCategoryForm({...editCategoryForm, color: e.target.value})}
                                          placeholder="#000000"
                                          className="mt-1"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                      <Button size="sm" variant="outline" onClick={handleCancelEditCategory}>Cancel</Button>
                                      <Button size="sm" onClick={() => handleUpdateCategory(category.id)}>Save</Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            
                            return (
                              <div 
                                key={category.id} 
                                className={`grid grid-cols-5 gap-4 p-3 border rounded-lg hover:bg-gray-50 ${
                                  isSubCategory ? 'ml-8 border-l-4 border-l-blue-300 bg-blue-50/30' : ''
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Checkbox 
                                    checked={selectedCategories.includes(category.id)}
                                    onCheckedChange={() => handleSelectCategory(category.id)}
                                  />
                                  <div className="flex items-center gap-2">
                                    {isSubCategory && (
                                      <span className="text-gray-400 text-sm">└─</span>
                                    )}
                                    <div className={`font-medium ${isSubCategory ? 'text-sm text-gray-700' : ''}`}>
                                      {category.name}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-gray-600 text-sm">{category.description || '-'}</div>
                                <div className={`text-gray-600 font-semibold ${category.count > 0 ? 'text-blue-600' : ''}`}>
                                  {category.count}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-4 h-4 border border-gray-300 rounded"
                                    style={{ backgroundColor: category.color || '#ffffff' }}
                                  ></div>
                                  <span className="text-xs text-gray-500">{category.color || 'No color'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleEditCategory(category.id);
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDeleteCategory(category.id);
                                    }}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              /* Other Data Management View */
              <>
                {/* Header */}
                <div className="mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{currentItem?.label}</h1>
                    <p className="text-gray-600 mt-2">Manage {currentItem?.label.toLowerCase()} that will appear in event forms</p>
                  </div>
                </div>

                {/* Add new item */}
                {activeSection !== 'add-event' && (
                  <>
                    {activeSection === 'speakers' ? (
                      /* Speakers Form */
                      <Card className="mb-6">
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                placeholder="Speaker name"
                                value={newSpeaker.name}
                                onChange={(e) => setNewSpeaker({...newSpeaker, name: e.target.value})}
                                className="flex-1"
                              />
                              <Input
                                placeholder="Speaker role"
                                value={newSpeaker.role}
                                onChange={(e) => setNewSpeaker({...newSpeaker, role: e.target.value})}
                                className="flex-1"
                              />
                            </div>
                            <Button 
                              type="button"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (newSpeaker.name.trim() && newSpeaker.role.trim()) {
                                  try {
                                    await createSpeaker({
                                      name: newSpeaker.name.trim(),
                                      role: newSpeaker.role.trim()
                                    });
                                    console.log('Speaker created in Supabase');
                                    setNewSpeaker({ name: '', role: '' });
                                    await loadAllData();
                                  } catch (error) {
                                    console.error('Error creating speaker:', error);
                                    alert('Failed to create speaker. Please check console for details.');
                                  }
                                }
                              }} 
                              disabled={!newSpeaker.name.trim() || !newSpeaker.role.trim()}
                              className="w-full"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Speaker
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : activeSection === 'formats' ? (
                      /* Single grid container for both form and list - like categories */
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Add New Format</CardTitle>
                            <CardDescription>
                              Create a new format for your events
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label htmlFor="formatName">Name</Label>
                              <Input
                                id="formatName"
                                value={formatForm.name}
                                onChange={(e) => handleFormatNameChange(e.target.value)}
                                placeholder="Enter format name"
                                className="mt-1"
                              />
                              <p className="text-sm text-gray-500 mt-1">The name is how it appears on your site.</p>
                            </div>

                            <div>
                              <Label htmlFor="formatParent">Parent Format</Label>
                              <Select value={formatForm.parent} onValueChange={(value) => setFormatForm({...formatForm, parent: value})}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select parent format" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {data.formats
                                    .filter(fmt => !fmt.parent || fmt.parent === 'none' || fmt.parent === '')
                                    .map((format) => (
                                      <SelectItem key={format.id} value={format.name}>{format.name}</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <p className="text-sm text-gray-500 mt-1">Assign a parent term to create a hierarchy. Only root formats can be selected as parents.</p>
                            </div>

                            <div>
                              <Label htmlFor="formatDescription">Description</Label>
                              <Textarea
                                id="formatDescription"
                                value={formatForm.description}
                                onChange={(e) => setFormatForm({...formatForm, description: e.target.value})}
                                placeholder="Enter format description"
                                className="mt-1"
                              />
                              <p className="text-sm text-gray-500 mt-1">The description is not prominent by default; however, some themes may show it.</p>
                            </div>

                            <div>
                              <Label htmlFor="formatColor">Color</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setShowFormatColorPicker(!showFormatColorPicker)}
                                >
                                  Select Colour
                                </Button>
                                <Input
                                  type="text"
                                  value={formatForm.color}
                                  onChange={(e) => setFormatForm({...formatForm, color: e.target.value})}
                                  placeholder="#000000"
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setFormatForm({...formatForm, color: ''})}
                                >
                                  Clear
                                </Button>
                              </div>
                              {showFormatColorPicker && (
                                <div className="mt-2 p-4 border rounded-lg bg-white shadow-lg">
                                  <div className="grid grid-cols-8 gap-2 mb-4">
                                    {[
                                      '#000000', '#ffffff', '#ff0000', '#ffa500',
                                      '#ffff00', '#00ff00', '#0000ff', '#800080'
                                    ].map((color) => (
                                      <button
                                        key={color}
                                        className="w-8 h-8 border border-gray-300 rounded hover:scale-110 transition-transform"
                                        style={{ backgroundColor: color }}
                                        onClick={() => {
                                          setFormatForm({...formatForm, color});
                                          setShowFormatColorPicker(false);
                                        }}
                                      />
                                    ))}
                                  </div>
                                  <div className="grid grid-cols-6 gap-1">
                                    {[
                                      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3',
                                      '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#ff6348', '#2ed573'
                                    ].map((color) => (
                                      <button
                                        key={color}
                                        className="w-6 h-6 border border-gray-300 rounded hover:scale-110 transition-transform"
                                        style={{ backgroundColor: color }}
                                        onClick={() => {
                                          setFormatForm({...formatForm, color});
                                          setShowFormatColorPicker(false);
                                        }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                              <p className="text-sm text-gray-500 mt-1">Optional format color.</p>
                            </div>

                            <Button onClick={handleAddFormat} disabled={!formatForm.name.trim()} className="w-full">
                              Add New Format
                            </Button>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle>{currentItem?.label}</CardTitle>
                                <CardDescription>
                                  {currentData.length === 0 
                                    ? `No ${currentItem?.label.toLowerCase()} added yet` 
                                    : `${currentData.length} ${currentItem?.label.toLowerCase()} available`
                                  }
                                </CardDescription>
                              </div>
                              {selectedFormats.length > 0 && (
                                <Button 
                                  variant="destructive"
                                  size="sm"
                                  onClick={handleBulkDeleteFormats}
                                >
                                  Delete Selected
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            {currentData.length === 0 ? (
                              <div className="text-center py-8">
                                <div className="text-gray-400 mb-2">
                                  {currentItem && <currentItem.icon className="w-12 h-12 mx-auto" />}
                                </div>
                                <p className="text-gray-500">No {currentItem?.label.toLowerCase()} added yet</p>
                                <p className="text-sm text-gray-400 mt-1">Add your first {currentItem?.label.toLowerCase()} using the form on the left</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="grid grid-cols-5 gap-4 p-3 bg-gray-50 rounded-lg font-medium text-sm">
                                  <div className="flex items-center gap-2">
                                    <Checkbox 
                                      checked={selectedFormats.length === currentData.length && currentData.length > 0}
                                      onCheckedChange={handleSelectAllFormats}
                                    />
                                    <div>Name</div>
                                  </div>
                                  <div>Description</div>
                                  <div>Count</div>
                                  <div>Color</div>
                                  <div>Actions</div>
                                </div>
                                {organizedFormats.map((format) => {
                                  const isSubFormat = format.parent && format.parent !== 'none' && format.parent !== '';
                                  const isEditing = editingFormat === format.id;
                                  
                                  if (isEditing) {
                                    return (
                                      <div 
                                        key={format.id} 
                                        className={`p-4 border rounded-lg bg-yellow-50 ${
                                          isSubFormat ? 'ml-8' : ''
                                        }`}
                                      >
                                        <div className="space-y-3">
                                          <div>
                                            <Label className="text-xs">Name</Label>
                                            <Input
                                              value={editFormatForm.name}
                                              onChange={(e) => setEditFormatForm({...editFormatForm, name: e.target.value})}
                                              className="mt-1"
                                            />
                                          </div>
                                          <div>
                                            <Label className="text-xs">Description</Label>
                                            <Textarea
                                              value={editFormatForm.description}
                                              onChange={(e) => setEditFormatForm({...editFormatForm, description: e.target.value})}
                                              rows={2}
                                              className="mt-1"
                                            />
                                          </div>
                                          <div className="grid grid-cols-2 gap-3">
                                            <div>
                                              <Label className="text-xs">Parent</Label>
                                              <Select value={editFormatForm.parent} onValueChange={(value) => setEditFormatForm({...editFormatForm, parent: value})}>
                                                <SelectTrigger className="mt-1">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="none">None</SelectItem>
                                                  {currentFormats
                                                    .filter(fmt => (!fmt.parent || fmt.parent === 'none' || fmt.parent === '') && fmt.id !== format.id)
                                                    .map((fmt) => (
                                                      <SelectItem key={fmt.id} value={fmt.name}>{fmt.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <div>
                                              <Label className="text-xs">Color</Label>
                                              <Input
                                                type="text"
                                                value={editFormatForm.color}
                                                onChange={(e) => setEditFormatForm({...editFormatForm, color: e.target.value})}
                                                placeholder="#000000"
                                                className="mt-1"
                                              />
                                            </div>
                                          </div>
                                          <div className="flex gap-2 justify-end">
                                            <Button size="sm" variant="outline" onClick={handleCancelEditFormat}>Cancel</Button>
                                            <Button size="sm" onClick={() => handleUpdateFormat(format.id)}>Save</Button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }
                                  
                                  return (
                                    <div 
                                      key={format.id} 
                                      className={`grid grid-cols-5 gap-4 p-3 border rounded-lg hover:bg-gray-50 ${
                                        isSubFormat ? 'ml-8 border-l-4 border-l-green-300 bg-green-50/30' : ''
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Checkbox 
                                          checked={selectedFormats.includes(format.id)}
                                          onCheckedChange={() => handleSelectFormat(format.id)}
                                        />
                                        <div className="flex items-center gap-2">
                                          {isSubFormat && (
                                            <span className="text-gray-400 text-sm">└─</span>
                                          )}
                                          <div className={`font-medium ${isSubFormat ? 'text-sm text-gray-700' : ''}`}>
                                            {format.name}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-gray-600 text-sm">{format.description || '-'}</div>
                                      <div className={`text-gray-600 font-semibold ${format.count > 0 ? 'text-green-600' : ''}`}>
                                        {format.count}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-4 h-4 border border-gray-300 rounded"
                                          style={{ backgroundColor: format.color || '#ffffff' }}
                                        ></div>
                                        <span className="text-xs text-gray-500">{format.color || 'No color'}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleEditFormat(format.id);
                                          }}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDeleteFormat(format.id);
                                          }}
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    ) : activeSection !== 'categories' && activeSection !== 'formats' ? (
                      /* Simple Form for other sections (locations, organizers) */
                      activeSection === 'locations' ? (
                        <Card className="mb-6">
                          <CardHeader>
                            <CardTitle>Add New Location</CardTitle>
                          </CardHeader>
                          <CardContent className="p-6 space-y-4">
                            <div>
                              <Label htmlFor="locationName">Name</Label>
                              <Input
                                id="locationName"
                                placeholder="The name is how it appears on your site."
                                value={newLocation.name}
                                onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                                className="mt-1"
                              />
                            </div>
                            
                            <div className="relative">
                              <Label htmlFor="locationAddress">Address</Label>
                              <Input
                                ref={setAddressInputRef}
                                id="locationAddress"
                                placeholder="Enter the location address."
                                value={newLocation.address}
                                onChange={(e) => {
                                  setNewLocation({...newLocation, address: e.target.value});
                                  handleAddressSearch(e.target.value);
                                }}
                                className="mt-1"
                              />
                              
                              {showAddressSuggestions && addressSuggestions.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                  {addressSuggestions.map((suggestion) => (
                                    <div
                                      key={suggestion.place_id}
                                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-start gap-3"
                                        onClick={(e) => {
                                        console.log('Suggestion clicked:', suggestion.place_id, suggestion.description);
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleAddressSelect(suggestion.place_id, suggestion.description);
                                      }}
                                    >
                                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-900">{suggestion.structured_formatting?.main_text}</div>
                                        <div className="text-sm text-gray-600">{suggestion.structured_formatting?.secondary_text}</div>
                                      </div>
                                    </div>
                                  ))}
                                  <div className="px-4 py-2 text-xs text-gray-500 flex items-center justify-end gap-1 border-t border-gray-100">
                                    <span>powered by</span>
                                    <span className="font-semibold text-blue-600">Google</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="locationLatitude">Latitude</Label>
                                <Input
                                  id="locationLatitude"
                                  placeholder="Geo latitude (Optional for Lite)"
                                  value={newLocation.latitude}
                                  onChange={(e) => setNewLocation({...newLocation, latitude: e.target.value})}
                                  className="mt-1"
                                  type="number"
                                  step="any"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="locationLongitude">Longitude</Label>
                                <Input
                                  id="locationLongitude"
                                  placeholder="Geo longitude (Optional for Lite)"
                                  value={newLocation.longitude}
                                  onChange={(e) => setNewLocation({...newLocation, longitude: e.target.value})}
                                  className="mt-1"
                                  type="number"
                                  step="any"
                                />
                              </div>
                            </div>
                            
                            <Button 
                              onClick={addItem} 
                              disabled={!newLocation.name.trim()}
                              className="w-full"
                            >
                              Add New Location
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                      <Card className="mb-6">
                        <CardContent className="p-6">
                          <div className="flex gap-2">
                            <Input
                              placeholder={`Enter ${currentItem?.label.toLowerCase()} name`}
                              value={newItem}
                              onChange={(e) => setNewItem(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addItem()}
                              className="flex-1"
                            />
                            <Button onClick={addItem} disabled={!newItem.trim()}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      )
                    ) : null}
                  </>
                )}

                {/* List items - only for non-formats and non-speakers sections */}
                {activeSection !== 'add-event' && activeSection !== 'formats' && activeSection !== 'speakers' && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Current {currentItem?.label}</CardTitle>
                          <CardDescription>
                            {currentData.length === 0 
                              ? `No ${currentItem?.label.toLowerCase()} added yet` 
                              : `${currentData.length} ${currentItem?.label.toLowerCase()} available`
                            }
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {currentData.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-gray-400 mb-2">
                            {currentItem && <currentItem.icon className="w-12 h-12 mx-auto" />}
                          </div>
                          <p className="text-gray-500">No {currentItem?.label.toLowerCase()} added yet</p>
                          <p className="text-sm text-gray-400 mt-1">Add your first {currentItem?.label.toLowerCase()} using the form above</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {activeSection === 'locations' ? (
                            // Special handling for locations with full details
                            (currentData as any[]).map((location, index) => (
                              <div key={location.id || index} className="p-4 border rounded-lg hover:bg-gray-50">
                                {editingLocation?.id === location.id ? (
                                  // Edit mode for location
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="editLocationName">Name</Label>
                                      <Input
                                        id="editLocationName"
                                        value={editingLocation?.name || ''}
                                        onChange={(e) => editingLocation && setEditingLocation({...editingLocation, name: e.target.value})}
                                        className="mt-1"
                                      />
                                    </div>
                                    
                                    <div className="relative">
                                      <Label htmlFor="editLocationAddress">Address</Label>
                                      <Input
                                        id="editLocationAddress"
                                        placeholder="Enter the location address."
                                        value={editingLocation?.address || ''}
                                        onChange={(e) => {
                                          if (editingLocation) {
                                            setEditingLocation({...editingLocation, address: e.target.value});
                                            handleEditAddressSearch(e.target.value);
                                          }
                                        }}
                                        className="mt-1"
                                      />
                                      
                                      {showEditAddressSuggestions && editAddressSuggestions.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                          {editAddressSuggestions.map((suggestion) => (
                                            <div
                                              key={suggestion.place_id}
                                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-start gap-3"
                                              onClick={(e) => {
                                                console.log('Edit suggestion clicked:', suggestion.place_id, suggestion.description);
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleAddressSelectForEdit(suggestion.place_id, suggestion.description);
                                              }}
                                            >
                                              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                              <div className="flex-1">
                                                <div className="font-medium text-gray-900">{suggestion.structured_formatting?.main_text}</div>
                                                <div className="text-sm text-gray-600">{suggestion.structured_formatting?.secondary_text}</div>
                                              </div>
                                            </div>
                                          ))}
                                          <div className="px-4 py-2 text-xs text-gray-500 flex items-center justify-end gap-1 border-t border-gray-100">
                                            <span>powered by</span>
                                            <span className="font-semibold text-blue-600">Google</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor="editLocationLatitude">Latitude</Label>
                                        <Input
                                          id="editLocationLatitude"
                                          value={editingLocation?.latitude || ''}
                                          onChange={(e) => editingLocation && setEditingLocation({...editingLocation, latitude: e.target.value})}
                                          className="mt-1"
                                          type="number"
                                          step="any"
                                        />
                                      </div>
                                      
                                      <div>
                                        <Label htmlFor="editLocationLongitude">Longitude</Label>
                                        <Input
                                          id="editLocationLongitude"
                                          value={editingLocation?.longitude || ''}
                                          onChange={(e) => editingLocation && setEditingLocation({...editingLocation, longitude: e.target.value})}
                                          className="mt-1"
                                          type="number"
                                          step="any"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                      <Button onClick={updateLocation} size="sm">
                                        Save Changes
                                      </Button>
                                      <Button 
                                        onClick={() => {
                                          setEditingLocation(null);
                                          setEditAddressSuggestions([]);
                                          setShowEditAddressSuggestions(false);
                                        }} 
                                        variant="outline" 
                                        size="sm"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  // Display mode for location
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900">{location.name}</div>
                                      {location.address && (
                                        <div className="text-sm text-gray-600 mt-1">{location.address}</div>
                                      )}
                                      {(location.latitude || location.longitude) && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          {location.latitude && location.longitude 
                                            ? `${location.latitude}, ${location.longitude}`
                                            : location.latitude 
                                            ? `Lat: ${location.latitude}`
                                            : `Lng: ${location.longitude}`
                                          }
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => editItem(index, location.name)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => deleteItem(index)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                            ) : activeSection === 'organizers' ? (
                              // Special handling for organizers with table layout
                              <>
                                <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg font-medium text-sm mb-2">
                                  <div>Name</div>
                                  <div>Count</div>
                                  <div>Actions</div>
                                </div>
                                {data.organizers.map((organizer, index) => (
                                  <div key={index} className="grid grid-cols-3 gap-4 p-3 border rounded-lg hover:bg-gray-50">
                                    <div className="text-sm font-medium">{organizer}</div>
                                    <div>
                                      <div className={`text-xs font-semibold px-2 py-1 rounded-full inline-block ${
                                        events.filter(event => event.organizer === organizer).length > 0 
                                          ? 'bg-blue-100 text-blue-600' 
                                          : 'bg-gray-100 text-gray-500'
                                      }`}>
                                        {events.filter(event => event.organizer === organizer).length}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setEditingItem({type: activeSection as keyof EventData, index, value: organizer})}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => deleteItem(index)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </>
                            ) : (
                              // Default handling for other sections
                              (currentData as string[]).map((item, index) => (
                            <div key={index} className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50">
                              {editingItem?.type === activeSection && editingItem?.index === index ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <Input
                                    value={editingItem.value}
                                    onChange={(e) => setEditingItem({...editingItem, value: e.target.value})}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        editItem(index, editingItem.value);
                                      } else if (e.key === 'Escape') {
                                        setEditingItem(null);
                                      }
                                    }}
                                    className="flex-1"
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => editItem(index, editingItem.value)}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingItem(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <span className="flex-1 text-sm font-medium">{item}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingItem({type: activeSection as keyof EventData, index, value: item})}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteItem(index)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                            ))
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {/* Speakers section with roles */}
                {activeSection === 'speakers' && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Current Speakers</CardTitle>
                          <CardDescription>
                            {data.speakers.length === 0 
                              ? "No speakers added yet" 
                              : `${data.speakers.length} speakers available`
                            }
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {data.speakers.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                          <p className="text-gray-500">No speakers added yet</p>
                          <p className="text-sm text-gray-400 mt-1">Add your first speaker using the form above</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-5 gap-4 p-3 bg-gray-50 rounded-lg font-medium text-sm">
                            <div>Name</div>
                            <div>Role</div>
                            <div>Count</div>
                            <div className="col-span-2">Actions</div>
                          </div>
                          {data.speakers.map((speaker) => (
                            <div key={speaker.id} className="grid grid-cols-5 gap-4 p-3 border rounded-lg hover:bg-gray-50">
                              <div className="text-sm font-medium">{speaker.name}</div>
                              <div className="text-sm text-gray-600">{speaker.role}</div>
                              <div>
                                <div className={`text-xs font-semibold px-2 py-1 rounded-full inline-block ${
                                  (speaker.count || 0) > 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {speaker.count || 0}
                                </div>
                              </div>
                              <div className="col-span-2 flex items-center gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    try {
                                      await deleteSpeakerFromDB(speaker.id);
                                      console.log('Speaker deleted from Supabase:', speaker.id);
                                      await loadAllData();
                                    } catch (error) {
                                      console.error('Error deleting speaker:', error);
                                      alert('Failed to delete speaker. Please check console for details.');
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Categories</h3>
            <p className="text-gray-600 mb-4">
              You are about to delete {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'}. Are you sure?
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={cancelDeleteCategories}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteCategories}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Format Delete Confirmation Dialog */}
      {showFormatDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Formats</h3>
            <p className="text-gray-600 mb-4">
              You are about to delete {selectedFormats.length} format{selectedFormats.length === 1 ? '' : 's'}. Are you sure?
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={cancelDeleteFormats}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteFormats}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EventDataPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <EventDataPageContent />
    </Suspense>
  );
}
