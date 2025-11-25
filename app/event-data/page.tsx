"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAdmin } from "@/lib/useAdmin";
import { toast } from "sonner";
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
  updateSpeaker,
  deleteSpeaker as deleteSpeakerFromDB,
  createLocation,
  deleteLocation as deleteLocationFromDB,
  createOrganizer,
  deleteOrganizer as deleteOrganizerFromDB,
  getCategoryIdByName,
  getFormatIdByName,
  getSpeakerIdsByNames,
  getOrCreateLocation,
  getOrCreateOrganizer,
  updateOrganizer
} from "@/lib/events-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DeleteEventDialog, DeleteFileDialog, BulkDeleteDialog, ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DebugMultiSelect } from "@/components/ui/debug-multi-select";
import { TiptapSimpleEditor } from "@/components/ui/tiptap-simple-editor";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Tag, 
  MapPin, 
  Users, 
  User, 
  Calendar,
  Settings,
  List,
  ArrowUpDown,
  ArrowLeft,
  Clock,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  QrCode,
  Award,
  AlertCircle,
  Download,
  Eye,
  Image as ImageIcon,
  Upload,
  Loader2
} from "lucide-react";
import { useOnboardingTour } from "@/components/onboarding/OnboardingContext";
import { createCompleteEventDataTour } from "@/lib/onboarding/steps/event-data/CompleteEventDataTour";

const slugifyEventTitle = (value: string) => {
  if (!value) return "untitled-event";
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "untitled-event";
};

const generateDraftId = () => {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `draft-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

const extractImagePathsFromHtml = (html: string): string[] => {
  if (typeof window === "undefined" || !html) return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const images = doc.querySelectorAll("img");
  const paths: string[] = [];

  images.forEach((img) => {
    const src = img.getAttribute("src");
    if (!src) return;
    try {
      const url = new URL(src, window.location.origin);
      const pathParam = url.searchParams.get("path");
      if (pathParam) {
        paths.push(decodeURIComponent(pathParam));
      }
    } catch {
      // Ignore parsing failures
    }
  });

  return paths;
};

const replaceImagePathsInHtml = (
  html: string,
  pathMap: Record<string, string>
): string => {
  let updatedHtml = html;
  Object.entries(pathMap).forEach(([oldPath, newPath]) => {
    const encodedOld = encodeURIComponent(oldPath);
    const encodedNew = encodeURIComponent(newPath);
    updatedHtml = updatedHtml
      .replaceAll(`path=${encodedOld}`, `path=${encodedNew}`)
      .replaceAll(oldPath, newPath);
  });
  return updatedHtml;
};

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
  rescheduledDate?: string | null;
  movedOnlineLink?: string | null;
  // Booking fields
  bookingEnabled?: boolean;
  bookingButtonLabel?: string;
  bookingCapacity?: number | null;
  bookingDeadlineHours?: number;
  allowWaitlist?: boolean;
  confirmationCheckbox1Text?: string;
  confirmationCheckbox1Required?: boolean;
  confirmationCheckbox2Text?: string;
  confirmationCheckbox2Required?: boolean;
  // Auto-certificate fields
  qrAttendanceEnabled?: boolean;
  feedbackRequiredForCertificate?: boolean;
  feedbackDeadlineDays?: number | null;
  autoGenerateCertificate?: boolean;
  certificateTemplateId?: string | null;
  certificateAutoSendEmail?: boolean;
  feedbackFormCreated?: boolean;
  feedbackFormTemplate?: string;
  feedbackEnabled?: boolean;
}

const menuItems = [
  { key: 'all-events', label: 'All Events', icon: List },
  { key: 'add-event', label: 'Add Event', icon: Plus },
  { key: 'bulk-upload', label: 'Smart Bulk Upload', icon: Settings },
  { key: 'categories', label: 'Category', icon: Tag },
  { key: 'formats', label: 'Format', icon: Calendar },
  { key: 'locations', label: 'Locations', icon: MapPin },
  { key: 'organizers', label: 'Organizers', icon: User },
  { key: 'speakers', label: 'Speakers', icon: Users },
];

function EventDataPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { startTourWithSteps } = useOnboardingTour();
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
  
  // Confirmation dialog states
  const [showDeleteEventDialog, setShowDeleteEventDialog] = useState(false);
  const [showBookingsWarningDialog, setShowBookingsWarningDialog] = useState(false);
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = useState(false);
  const [showDeleteFormatDialog, setShowDeleteFormatDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showDeleteSpeakerDialog, setShowDeleteSpeakerDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [bulkDeleteTargets, setBulkDeleteTargets] = useState<string[]>([]);
  const [bulkBookingEvents, setBulkBookingEvents] = useState<Array<{ id: string; title: string }>>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
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
  const [editingSpeaker, setEditingSpeaker] = useState<{
    id: string;
    name: string;
    role: string;
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
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const [showSpeakerDeleteConfirm, setShowSpeakerDeleteConfirm] = useState(false);
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
  
  // Image tracking and cleanup
  const [uploadedImagePaths, setUploadedImagePaths] = useState<string[]>([]);
  const isSavedRef = useRef(false);
  const descriptionContentRef = useRef('');
  const tourStartProcessedRef = useRef(false);
  
  // Featured image state
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [featuredImagePath, setFeaturedImagePath] = useState<string | null>(null);
  const [uploadingFeaturedImage, setUploadingFeaturedImage] = useState(false);
  const [showFeaturedImage, setShowFeaturedImage] = useState(false);

  const getEventTitle = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    return event?.title || 'This event';
  };

  const [filters, setFilters] = useState({
    date: 'all',
    format: 'all',
    location: 'all',
    organizer: 'all',
    category: 'all',
    startDate: '',
    eventType: 'upcoming'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [eventsPerPage, setEventsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>({ key: 'startDate', direction: 'asc' });
  const [isMobile, setIsMobile] = useState(false);

  // Local storage persistence for filters
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  // Reset ref when navigating to clean URL (no query params)
  useEffect(() => {
    const hasQueryParams = searchParams.toString().length > 0
    if (pathname === '/event-data' && !hasQueryParams) {
      // Reset the ref when we're on clean URL to allow tour to start
      tourStartProcessedRef.current = false
      
      // Also set up a polling mechanism to check for the flag after navigation
      // This handles cases where useEffect doesn't trigger immediately after router navigation
      const checkInterval = setInterval(() => {
        // Check for multi-page tour first
        const tourTimestamp = sessionStorage.getItem('startTourAfterNavigation')
        const nextTourType = sessionStorage.getItem('nextTourType')
        const shouldStartTour = sessionStorage.getItem('startEventDataTour')
        
        // Multi-page tour check
        if (tourTimestamp && nextTourType === 'event-data' && status === 'authenticated' && startTourWithSteps && !tourStartProcessedRef.current) {
          const timestamp = parseInt(tourTimestamp, 10)
          const now = Date.now()
          const timeDiff = now - timestamp
          
          if (!isNaN(timestamp) && timeDiff > 0 && timeDiff < 10000) {
            clearInterval(checkInterval)
            tourStartProcessedRef.current = true
            sessionStorage.removeItem('startTourAfterNavigation')
            sessionStorage.removeItem('nextTourType')
            
            setTimeout(() => {
              if (activeSection === 'add-event' && activeFormSection !== 'basic') {
                setActiveFormSection('basic')
                setTimeout(() => {
                  setActiveSection('all-events')
                  setTimeout(() => {
                    const userRole = session?.user?.role || 'meded_team'
                    const eventDataSteps = createCompleteEventDataTour({ 
                      role: userRole as any,
                      onTabSwitch: (tab: string) => {
                        setActiveSection(tab)
                      }
                    })
                    if (startTourWithSteps) {
                      startTourWithSteps(eventDataSteps)
                    }
                  }, 300)
                }, 200)
              } else if (activeSection !== 'all-events') {
                setActiveSection('all-events')
                setTimeout(() => {
                  const userRole = session?.user?.role || 'meded_team'
                  const eventDataSteps = createCompleteEventDataTour({ 
                    role: userRole as any,
                    onTabSwitch: (tab: string) => {
                      setActiveSection(tab)
                    }
                  })
                  if (startTourWithSteps) {
                    startTourWithSteps(eventDataSteps)
                  }
                }, 300)
              } else {
                const userRole = session?.user?.role || 'meded_team'
                const eventDataSteps = createCompleteEventDataTour({ 
                  role: userRole as any,
                  onTabSwitch: (tab: string) => {
                    setActiveSection(tab)
                  }
                })
                if (startTourWithSteps) {
                  startTourWithSteps(eventDataSteps)
                }
              }
            }, 1000)
            return
          }
        }
        
        // Standalone event data tour check
        if (shouldStartTour === 'true' && status === 'authenticated' && startTourWithSteps && !tourStartProcessedRef.current) {
          clearInterval(checkInterval)
          // Trigger the tour start logic
          tourStartProcessedRef.current = true
          sessionStorage.removeItem('startEventDataTour')
          
          setTimeout(() => {
            if (activeSection === 'add-event' && activeFormSection !== 'basic') {
              setActiveFormSection('basic')
              setTimeout(() => {
                setActiveSection('all-events')
                setTimeout(() => {
                  const userRole = session?.user?.role || 'meded_team'
                  const eventDataSteps = createCompleteEventDataTour({ 
                    role: userRole as any,
                    onTabSwitch: (tab: string) => {
                      setActiveSection(tab)
                    }
                  })
                  if (startTourWithSteps) {
                    startTourWithSteps(eventDataSteps)
                  }
                }, 300)
              }, 200)
            } else if (activeSection !== 'all-events') {
              setActiveSection('all-events')
              setTimeout(() => {
                const userRole = session?.user?.role || 'meded_team'
                const eventDataSteps = createCompleteEventDataTour({ 
                  role: userRole as any,
                  onTabSwitch: (tab: string) => {
                    setActiveSection(tab)
                  }
                })
                if (startTourWithSteps) {
                  startTourWithSteps(eventDataSteps)
                }
              }, 300)
            } else {
              const userRole = session?.user?.role || 'meded_team'
              const eventDataSteps = createCompleteEventDataTour({ 
                role: userRole as any,
                onTabSwitch: (tab: string) => {
                  setActiveSection(tab)
                }
              })
              if (startTourWithSteps) {
                startTourWithSteps(eventDataSteps)
              }
            }
          }, 1000)
        }
      }, 200) // Check every 200ms
      
      // Clear interval after 5 seconds (should be enough time for navigation)
      setTimeout(() => {
        clearInterval(checkInterval)
      }, 5000)
      
      return () => {
        clearInterval(checkInterval)
      }
    }
  }, [pathname, searchParams, status, startTourWithSteps, activeSection, activeFormSection, session])

  // Check for tour start flag after navigation
  useEffect(() => {
    const hasQueryParams = searchParams.toString().length > 0
    
    // Only process if we're on the event-data page (clean URL), session is loaded, and tour function is available
    if (pathname === '/event-data' && !hasQueryParams && typeof window !== 'undefined' && status === 'authenticated' && startTourWithSteps && !tourStartProcessedRef.current) {
      // Check for multi-page tour first
      const tourTimestamp = sessionStorage.getItem('startTourAfterNavigation')
      const nextTourType = sessionStorage.getItem('nextTourType')
      const shouldStartTour = sessionStorage.getItem('startEventDataTour')
      
      // Multi-page tour takes precedence
      if (tourTimestamp && nextTourType === 'event-data') {
        const timestamp = parseInt(tourTimestamp, 10)
        const now = Date.now()
        const timeDiff = now - timestamp
        
        // Only process if timestamp is recent (within 10 seconds)
        if (!isNaN(timestamp) && timeDiff > 0 && timeDiff < 10000) {
          console.log('[Event Data Tour] Multi-page tour detected')
          // Clear flags
          sessionStorage.removeItem('startTourAfterNavigation')
          sessionStorage.removeItem('nextTourType')
          tourStartProcessedRef.current = true
          
          setTimeout(() => {
            if (activeSection === 'add-event' && activeFormSection !== 'basic') {
              setActiveFormSection('basic')
              setTimeout(() => {
                setActiveSection('all-events')
                setTimeout(() => {
                  const userRole = session?.user?.role || 'meded_team'
                  const eventDataSteps = createCompleteEventDataTour({ 
                    role: userRole as any,
                    onTabSwitch: (tab: string) => {
                      setActiveSection(tab)
                    }
                  })
                  if (startTourWithSteps) {
                    startTourWithSteps(eventDataSteps)
                  }
                }, 300)
              }, 200)
            } else if (activeSection !== 'all-events') {
              setActiveSection('all-events')
              setTimeout(() => {
                const userRole = session?.user?.role || 'meded_team'
                const eventDataSteps = createCompleteEventDataTour({ 
                  role: userRole as any,
                  onTabSwitch: (tab: string) => {
                    setActiveSection(tab)
                  }
                })
                if (startTourWithSteps) {
                  startTourWithSteps(eventDataSteps)
                }
              }, 300)
            } else {
              const userRole = session?.user?.role || 'meded_team'
              const eventDataSteps = createCompleteEventDataTour({ 
                role: userRole as any,
                onTabSwitch: (tab: string) => {
                  setActiveSection(tab)
                }
              })
              if (startTourWithSteps) {
                startTourWithSteps(eventDataSteps)
              }
            }
          }, 1000)
          return
        } else if (tourTimestamp) {
          // Timestamp is old, clear it
          sessionStorage.removeItem('startTourAfterNavigation')
          sessionStorage.removeItem('nextTourType')
        }
      }
      
      // Check for standalone event data tour
      console.log('[Event Data Tour] Checking flag:', shouldStartTour, 'status:', status, 'startTourWithSteps:', !!startTourWithSteps, 'hasQueryParams:', hasQueryParams)
      if (shouldStartTour === 'true') {
        console.log('[Event Data Tour] Starting tour after navigation')
        // Mark as processed to prevent multiple runs
        tourStartProcessedRef.current = true
        // Clear the flag
        sessionStorage.removeItem('startEventDataTour')
        
        // Wait for page to fully load, then start tour
        setTimeout(() => {
          console.log('[Event Data Tour] Starting tour logic, activeSection:', activeSection)
          // Reset to Basic Information if on Add Event tab
          if (activeSection === 'add-event' && activeFormSection !== 'basic') {
            setActiveFormSection('basic')
            setTimeout(() => {
              setActiveSection('all-events')
              setTimeout(() => {
                const userRole = session?.user?.role || 'meded_team'
                const eventDataSteps = createCompleteEventDataTour({ 
                  role: userRole as any,
                  onTabSwitch: (tab: string) => {
                    setActiveSection(tab)
                  }
                })
                if (startTourWithSteps) {
                  console.log('[Event Data Tour] Starting tour with steps')
                  startTourWithSteps(eventDataSteps)
                } else {
                  console.log('[Event Data Tour] startTourWithSteps not available')
                }
              }, 300)
            }, 200)
          } else if (activeSection !== 'all-events') {
            setActiveSection('all-events')
            setTimeout(() => {
              const userRole = session?.user?.role || 'meded_team'
              const eventDataSteps = createCompleteEventDataTour({ 
                role: userRole as any,
                onTabSwitch: (tab: string) => {
                  setActiveSection(tab)
                }
              })
              if (startTourWithSteps) {
                console.log('[Event Data Tour] Starting tour with steps')
                startTourWithSteps(eventDataSteps)
              } else {
                console.log('[Event Data Tour] startTourWithSteps not available')
              }
            }, 300)
          } else {
            const userRole = session?.user?.role || 'meded_team'
            const eventDataSteps = createCompleteEventDataTour({ 
              role: userRole as any,
              onTabSwitch: (tab: string) => {
                setActiveSection(tab)
              }
            })
            if (startTourWithSteps) {
              console.log('[Event Data Tour] Starting tour with steps')
              startTourWithSteps(eventDataSteps)
            } else {
              console.log('[Event Data Tour] startTourWithSteps not available')
            }
          }
        }, 1000) // Wait longer for page to fully render and all components to mount
      }
    }
    
    // Reset the ref when pathname changes (user navigates away)
    if (pathname !== '/event-data') {
      tourStartProcessedRef.current = false
    }
  }, [pathname, searchParams, activeSection, activeFormSection, session, startTourWithSteps, status])

  // Load filters from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedFilters = localStorage.getItem('event-data-filters');
        if (savedFilters) {
          const parsedFilters = JSON.parse(savedFilters);
          setFilters(parsedFilters);
        }
        
        const savedSearchQuery = localStorage.getItem('event-data-search');
        if (savedSearchQuery) {
          setSearchQuery(savedSearchQuery);
        }
        
        const savedEventsPerPage = localStorage.getItem('event-data-eventsPerPage');
        if (savedEventsPerPage) {
          setEventsPerPage(parseInt(savedEventsPerPage));
        }
        
        const savedCurrentPage = localStorage.getItem('event-data-currentPage');
        if (savedCurrentPage) {
          setCurrentPage(parseInt(savedCurrentPage));
        }
        
        const savedSortConfig = localStorage.getItem('event-data-sortConfig');
        if (savedSortConfig) {
          setSortConfig(JSON.parse(savedSortConfig));
        }
        
        setFiltersLoaded(true);
      } catch (error) {
        console.error('Error loading filters from localStorage:', error);
        setFiltersLoaded(true);
      }
    }
  }, []);

  // Debug dialog states
  useEffect(() => {
    console.log('🔍 Dialog states changed:', {
      showDeleteEventDialog,
      showBulkDeleteDialog,
      selectedEventsCount: selectedEvents.length,
      deleteTarget
    });
  }, [showDeleteEventDialog, showBulkDeleteDialog, selectedEvents.length, deleteTarget]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (filtersLoaded && typeof window !== 'undefined') {
      try {
        localStorage.setItem('event-data-filters', JSON.stringify(filters));
      } catch (error) {
        console.error('Error saving filters to localStorage:', error);
      }
    }
  }, [filters, filtersLoaded]);

  useEffect(() => {
    if (filtersLoaded && typeof window !== 'undefined') {
      try {
        localStorage.setItem('event-data-search', searchQuery);
      } catch (error) {
        console.error('Error saving search query to localStorage:', error);
      }
    }
  }, [searchQuery, filtersLoaded]);

  useEffect(() => {
    if (filtersLoaded && typeof window !== 'undefined') {
      try {
        localStorage.setItem('event-data-eventsPerPage', eventsPerPage.toString());
      } catch (error) {
        console.error('Error saving eventsPerPage to localStorage:', error);
      }
    }
  }, [eventsPerPage, filtersLoaded]);

  useEffect(() => {
    if (filtersLoaded && typeof window !== 'undefined') {
      try {
        localStorage.setItem('event-data-currentPage', currentPage.toString());
      } catch (error) {
        console.error('Error saving currentPage to localStorage:', error);
      }
    }
  }, [currentPage, filtersLoaded]);

  useEffect(() => {
    if (filtersLoaded && typeof window !== 'undefined') {
      try {
        localStorage.setItem('event-data-sortConfig', JSON.stringify(sortConfig));
      } catch (error) {
        console.error('Error saving sortConfig to localStorage:', error);
      }
    }
  }, [sortConfig, filtersLoaded]);

  // Reset filters function
  const resetFilters = () => {
    setFilters({
      date: 'all',
      format: 'all',
      location: 'all',
      organizer: 'all',
      category: 'all',
      startDate: '',
      eventType: 'upcoming'
    });
    setSearchQuery('');
    setEventsPerPage(10);
    setCurrentPage(1);
    setSortConfig({ key: 'startDate', direction: 'asc' });
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('event-data-filters');
        localStorage.removeItem('event-data-search');
        localStorage.removeItem('event-data-eventsPerPage');
        localStorage.removeItem('event-data-currentPage');
        localStorage.removeItem('event-data-sortConfig');
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    }
  };

  // Reset to page 1 when filters or eventsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, eventsPerPage]);

  // Check screen size for mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    format: '',
    speakers: [] as string[],
    hideSpeakers: false,
    eventLink: '',
    moreInfoLink: '',
    moreInfoTarget: 'current' as 'current' | 'new',
    eventStatus: 'scheduled' as 'scheduled' | 'rescheduled' | 'postponed' | 'cancelled' | 'moved-online',
    rescheduledDate: null as string | null,
    movedOnlineLink: null as string | null,
    // Booking fields
    bookingEnabled: false,
    bookingButtonLabel: 'Register',
    bookingCapacity: null as number | null,
    bookingDeadlineHours: 0,
    allowWaitlist: true,
    confirmationCheckbox1Text: 'I confirm my attendance at this event',
    confirmationCheckbox1Required: true,
    confirmationCheckbox2Text: '',
    confirmationCheckbox2Required: false,
    cancellationDeadlineHours: 0,
    allowedCategories: [] as string[],
    approvalMode: 'auto' as 'auto' | 'manual',
    // Auto-certificate defaults
    qrAttendanceEnabled: false,
    feedbackRequiredForCertificate: false,
    feedbackDeadlineDays: null as number | null,
    autoGenerateCertificate: false,
    certificateTemplateId: null as string | null,
    certificateAutoSendEmail: true,
    feedbackFormCreated: false,
    feedbackFormTemplate: 'auto-generate',
    feedbackEnabled: false
  });
  const eventSlug = React.useMemo(() => slugifyEventTitle(formData.title || "untitled-event"), [formData.title]);
  const draftSessionIdRef = useRef<string>(generateDraftId());
  const resetDraftSessionId = useCallback(() => {
    draftSessionIdRef.current = generateDraftId();
  }, []);

  const [hasActiveBookings, setHasActiveBookings] = useState(false);
  const [checkingBookings, setCheckingBookings] = useState(false);
  const [certificateTemplates, setCertificateTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [creatingFeedbackForm, setCreatingFeedbackForm] = useState(false);
  const [feedbackTemplates, setFeedbackTemplates] = useState<any[]>([]);
  const [loadingFeedbackTemplates, setLoadingFeedbackTemplates] = useState(false);
  const [feedbackEnabled, setFeedbackEnabled] = useState(false);

  // Auto-populate allowedCategories when category changes
  useEffect(() => {
    // Always sync allowedCategories with selected categories
    // This ensures that when categories are selected, they are automatically added to allowedCategories
    setFormData(prev => {
      const currentAllowed = prev.allowedCategories || [];
      const selectedCategories = prev.category || [];
      
      console.log('🔄 Auto-populating allowedCategories:', {
        selectedCategories,
        currentAllowed,
        formDataCategory: formData.category
      });
      
      // Add any new categories that aren't already in allowedCategories
      const newCategories = selectedCategories.filter(cat => !currentAllowed.includes(cat));
      
      // Only update if there are actually new categories to add
      if (newCategories.length > 0) {
        const updatedAllowed = [...currentAllowed, ...newCategories];
        console.log('✅ Adding new categories to allowedCategories:', newCategories);
        return { ...prev, allowedCategories: updatedAllowed };
      }
      
      return prev;
    });
  }, [formData.category]);

  // Auto-populate allowedCategories when form is first loaded with existing data
  useEffect(() => {
    if (formData.category && formData.category.length > 0 && (!formData.allowedCategories || formData.allowedCategories.length === 0)) {
      console.log('🔄 Initial auto-population of allowedCategories from existing categories:', formData.category);
      setFormData(prev => ({
        ...prev,
        allowedCategories: [...(prev.allowedCategories || []), ...formData.category]
      }));
    }
  }, [formData.category, formData.allowedCategories]);

  // Load certificate templates when auto-generate certificate is enabled
  useEffect(() => {
    const loadCertificateTemplates = async () => {
      if (formData.autoGenerateCertificate && certificateTemplates.length === 0) {
        setLoadingTemplates(true);
        try {
          const response = await fetch('/api/certificates/templates');
          if (response.ok) {
            const data = await response.json();
            setCertificateTemplates(data.templates || []);
          } else {
            console.error('Failed to load certificate templates:', response.statusText);
          }
        } catch (error) {
          console.error('Error loading certificate templates:', error);
        } finally {
          setLoadingTemplates(false);
        }
      }
    };

    loadCertificateTemplates();
  }, [formData.autoGenerateCertificate, certificateTemplates.length]);

  // Load feedback templates when feedback is enabled
  useEffect(() => {
    const loadFeedbackTemplates = async () => {
      if (formData.feedbackEnabled && feedbackTemplates.length === 0) {
        try {
          setLoadingFeedbackTemplates(true)
          const response = await fetch('/api/feedback/templates')
          if (response.ok) {
            const data = await response.json()
            setFeedbackTemplates(data.templates || [])
          }
        } catch (error) {
          console.error('Error loading feedback templates:', error)
        } finally {
          setLoadingFeedbackTemplates(false)
        }
      }
    };

    loadFeedbackTemplates();
  }, [formData.feedbackEnabled, feedbackTemplates.length]);

  // Remove auto-create on enable; creation happens only on explicit template selection
  const feedbackTemplateMapRanRef = React.useRef(false);
  // Immediately apply stored template selection after redirect, without waiting for templates
  useEffect(() => {
    if (!formData.feedbackEnabled || !editingEventId) return;
    try {
      const stored = sessionStorage.getItem('feedbackTemplateSelected');
      if (stored) {
        setFormData(prev => ({ ...prev, feedbackFormTemplate: stored }));
        sessionStorage.removeItem('feedbackTemplateSelected');
      }
    } catch {}
  }, [editingEventId, formData.feedbackEnabled]);
  // After templates load, map existing form's questions to a known template ID
  useEffect(() => {
    const run = async () => {
      if (
        !formData.feedbackEnabled ||
        !editingEventId ||
        feedbackTemplateMapRanRef.current ||
        !Array.isArray(feedbackTemplates) ||
        feedbackTemplates.length === 0
      ) return;

      // If we have a recent selection saved during redirect, apply it immediately
      try {
        const stored = sessionStorage.getItem('feedbackTemplateSelected');
        if (stored) {
          setFormData(prev => ({ ...prev, feedbackFormTemplate: stored }));
          sessionStorage.removeItem('feedbackTemplateSelected');
          feedbackTemplateMapRanRef.current = true;
          return;
        }
      } catch {}

      try {
        const res = await fetch(`/api/feedback/forms?eventId=${editingEventId}`);
        if (!res.ok) return;
        const forms = await res.json();
        if (!forms || forms.length === 0) return;

        const activeForm = forms[0];
        const normalize = (q: any) => ({
          type: q.type,
          question: (q.question || '').trim().toLowerCase(),
          options: Array.isArray(q.options) ? q.options.map((o: any) => String(o).trim().toLowerCase()).sort() : []
        });
        const activeQs = Array.isArray(activeForm.questions) ? activeForm.questions.map(normalize) : [];

        // Try exact order match first, then unordered match
        const findMatch = () => {
          for (const t of feedbackTemplates) {
            const tQs = Array.isArray(t.questions) ? t.questions.map(normalize) : [];
            if (tQs.length !== activeQs.length) continue;
            const exact = tQs.every((q: any, i: number) => JSON.stringify(q) === JSON.stringify(activeQs[i]));
            if (exact) return t.id;
            // Unordered compare
            const a = [...activeQs].map(x => JSON.stringify(x)).sort();
            const b = [...tQs].map(x => JSON.stringify(x)).sort();
            const unordered = a.every((x: string, i: number) => x === b[i]);
            if (unordered) return t.id;
          }
          return null;
        };

        const matchedId = findMatch();
        if (matchedId && formData.feedbackFormTemplate !== matchedId) {
          setFormData(prev => ({ ...prev, feedbackFormTemplate: matchedId }));
        }
      } catch {}
      finally {
        feedbackTemplateMapRanRef.current = true;
      }
    };

    run();
  }, [editingEventId, formData.feedbackEnabled, feedbackTemplates.length]);

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
      count: events.filter(event => 
        event.organizer === organizer ||
        (event.allOrganizers && event.allOrganizers.includes(organizer))
      ).length
    }));
  };

  // Get all unique organizers from events (main + additional)
  const getAllUniqueOrganizers = () => {
    const allOrganizers = new Set<string>();
    
    events.forEach(event => {
      // Add main organizer
      if (event.organizer) {
        allOrganizers.add(event.organizer);
      }
      
      // Add all organizers from allOrganizers array
      if (event.allOrganizers) {
        event.allOrganizers.forEach(org => allOrganizers.add(org));
      }
    });
    
    return Array.from(allOrganizers).sort();
  };

  // Get all unique locations from events (main + additional)
  const getAllUniqueLocations = () => {
    const allLocations = new Set<string>();
    
    events.forEach(event => {
      // Add main location
      if (event.location) {
        allLocations.add(event.location);
      }
      
      // Add all locations from otherLocations array
      if (event.otherLocations) {
        event.otherLocations.forEach(loc => allLocations.add(loc));
      }
    });
    
    return Array.from(allLocations).sort();
  };
  // Load all data from Supabase on component mount
  const loadAllData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Add cache busting parameter if force refresh is requested
      const cacheBuster = forceRefresh ? `?t=${Date.now()}` : '';
      
      // Load all data in parallel
      const [categories, formats, speakers, locations, organizers, eventsData] = await Promise.all([
        getCategories(),
        getFormats(),
        getSpeakers(),
        getLocations(),
        getOrganizers(),
        getEvents()
      ]);

      // Ensure all values are arrays (safety check)
      const categoriesArray = Array.isArray(categories) ? categories : [];
      const formatsArray = Array.isArray(formats) ? formats : [];
      const speakersArray = Array.isArray(speakers) ? speakers : [];
      const locationsArray = Array.isArray(locations) ? locations : [];
      const organizersArray = Array.isArray(organizers) ? organizers : [];

      // Convert Supabase format to component format
      setData({
        categories: categoriesArray.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          parent: cat.parent || '',
          description: cat.description || '',
          color: cat.color || '',
          count: 0 // Will be calculated
        })),
        formats: formatsArray.map((fmt: any) => ({
          id: fmt.id,
          name: fmt.name,
          slug: fmt.slug,
          parent: fmt.parent_id ? formatsArray.find((f: any) => f.id === fmt.parent_id)?.name || '' : '',
          description: fmt.description || '',
          color: fmt.color || '',
          count: 0 // Will be calculated
        })),
        speakers: speakersArray,
        locations: locationsArray, // Store full location objects
        organizers: organizersArray.map((o: any) => o.name)
      });

      // Convert events from Supabase format to component format
      console.log('🔍 Debug: Raw events data from database:', eventsData?.map((e: any) => ({
        id: e.id,
        title: e.title,
        qr_attendance_enabled: e.qr_attendance_enabled,
        booking_enabled: e.booking_enabled
      })));
      
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
        otherLocations: e.locations ? e.locations.map((l: any) => l.name) : [],
        hideLocation: e.hide_location || false,
        organizer: e.organizer_name || '',
        otherOrganizers: e.organizers ? e.organizers
          .filter((o: any) => o.name !== e.organizer_name) // Exclude main organizer
          .map((o: any) => o.name) : [],
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
        eventStatus: e.event_status || 'scheduled',
        rescheduledDate: e.rescheduled_date || null,
        movedOnlineLink: e.moved_online_link || null,
        // Booking fields
        bookingEnabled: e.booking_enabled ?? false,
        bookingButtonLabel: e.booking_button_label || 'Register',
        bookingCapacity: e.booking_capacity ?? null,
        bookingDeadlineHours: e.booking_deadline_hours ?? 0,
        allowWaitlist: e.allow_waitlist ?? true,
        confirmationCheckbox1Text: e.confirmation_checkbox_1_text || 'I confirm my attendance at this event',
        confirmationCheckbox1Required: e.confirmation_checkbox_1_required ?? true,
        confirmationCheckbox2Text: e.confirmation_checkbox_2_text ?? '',
        confirmationCheckbox2Required: e.confirmation_checkbox_2_required ?? false,
        // Auto-certificate fields
        qrAttendanceEnabled: e.qr_attendance_enabled ?? false,
        feedbackRequiredForCertificate: e.feedback_required_for_certificate ?? false,
        feedbackDeadlineDays: e.feedback_deadline_days ?? null,
        autoGenerateCertificate: e.auto_generate_certificate ?? false,
        certificateTemplateId: e.certificate_template_id ?? null,
        certificateAutoSendEmail: e.certificate_auto_send_email ?? true,
        feedbackFormTemplate: 'auto-generate', // Default template for existing events
        feedbackEnabled: e.feedback_enabled ?? false,
        featured_image: e.featured_image || null
      }));

      console.log('🔍 Debug: Converted events with QR fields:', convertedEvents?.map((e: any) => ({
        id: e.id,
        title: e.title,
        qrAttendanceEnabled: e.qrAttendanceEnabled,
        bookingEnabled: e.bookingEnabled,
        feedbackEnabled: e.feedbackEnabled
      })));
      
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

  // Handle tab parameter from URL for initial section
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveSection(tab);
      setIsMobileMenuOpen(false);
    }
  }, [searchParams]);

  // Handle edit parameter from URL
  useEffect(() => {
    const editEventId = searchParams.get('edit');
    if (editEventId && events.length > 0) {
      // Wait for events to load, then trigger edit mode
      handleEditEvent(editEventId);
    }
  }, [searchParams, events]);

  // Check for active bookings when editing an event
  useEffect(() => {
    if (editingEventId && formData.bookingEnabled) {
      checkActiveBookings(editingEventId);
    } else {
      setHasActiveBookings(false);
    }
  }, [editingEventId, formData.bookingEnabled]);

  // Handle duplicate parameter from URL
  useEffect(() => {
    const duplicateData = searchParams.get('duplicate');
    if (duplicateData && !loading && data.categories.length > 0 && data.locations.length > 0) {
      try {
        const eventData = JSON.parse(decodeURIComponent(duplicateData));
        
        // Function to resolve location name to ID
        const resolveLocationId = (locationName: string) => {
          if (!locationName) return '';
          const foundLocation = data.locations.find(loc => loc.name === locationName);
          return foundLocation?.id || '';
        };
        
        // Function to format speakers data
        const formatSpeakers = (speakersData: any) => {
          if (!speakersData) return [];
          if (typeof speakersData === 'string') {
            return speakersData.split(',').map((s: any) => s.trim()).filter((s: any) => s);
          }
          if (Array.isArray(speakersData)) {
            return speakersData.map((s: any) => typeof s === 'string' ? s : s.name || s).filter((s: any) => s);
          }
          return [];
        };
        
        // Function to format categories data
        const formatCategories = (categoriesData: any) => {
          if (!categoriesData) return [];
          if (Array.isArray(categoriesData)) {
            return categoriesData.map((c: any) => typeof c === 'string' ? c : c.name || c).filter((c: any) => c);
          }
          if (typeof categoriesData === 'string') {
            return [categoriesData];
          }
          return [];
        };
        
        // Function to format format data
        const formatFormat = (formatData: any) => {
          if (!formatData) return '';
          if (typeof formatData === 'string') {
            return formatData;
          }
          if (Array.isArray(formatData) && formatData.length > 0) {
            return formatData[0]; // Take first if array (backward compatibility)
          }
          return '';
        };
        
        // Pre-fill the form with the duplicate data
        setFormData({
          title: eventData.title || '',
          description: eventData.description || '',
          date: eventData.date || '',
          startTime: eventData.startTime || '',
          endTime: eventData.endTime || '',
          isAllDay: eventData.isAllDay || false,
          hideTime: eventData.hideTime || false,
          hideEndTime: eventData.hideEndTime || false,
          timeNotes: eventData.timeNotes || '',
          location: resolveLocationId(eventData.location),
          otherLocations: [], // Initialize otherLocations array
          hideLocation: eventData.hideLocation || false,
          organizer: eventData.organizer || '',
          otherOrganizers: [], // Initialize otherOrganizers array
          hideOrganizer: eventData.hideOrganizer || false,
          category: formatCategories(eventData.categories),
          format: formatFormat(eventData.format),
          speakers: formatSpeakers(eventData.speakers),
          hideSpeakers: eventData.hideSpeakers || false,
          eventLink: eventData.eventLink || '',
          moreInfoLink: eventData.moreInfoLink || '',
          moreInfoTarget: eventData.moreInfoTarget || 'current',
          eventStatus: eventData.eventStatus || 'scheduled',
          rescheduledDate: eventData.rescheduledDate || null,
          movedOnlineLink: eventData.movedOnlineLink || null,
          // Booking fields
          bookingEnabled: eventData.bookingEnabled || false,
          bookingButtonLabel: eventData.bookingButtonLabel || 'Register',
          bookingCapacity: eventData.bookingCapacity || null,
          bookingDeadlineHours: eventData.bookingDeadlineHours ?? 0,
          allowWaitlist: eventData.allowWaitlist !== undefined ? eventData.allowWaitlist : true,
          confirmationCheckbox1Text: eventData.confirmationCheckbox1Text || 'I confirm my attendance at this event',
          confirmationCheckbox1Required: eventData.confirmationCheckbox1Required !== undefined ? eventData.confirmationCheckbox1Required : true,
          confirmationCheckbox2Text: eventData.confirmationCheckbox2Text ?? '',
          confirmationCheckbox2Required: eventData.confirmationCheckbox2Required || false,
          cancellationDeadlineHours: eventData.cancellationDeadlineHours || 0,
          allowedCategories: eventData.allowedCategories || [],
          approvalMode: eventData.approvalMode || 'auto',
          // Auto-certificate fields
          qrAttendanceEnabled: eventData.qrAttendanceEnabled || false,
          feedbackRequiredForCertificate: eventData.feedbackRequiredForCertificate ?? false,
          feedbackDeadlineDays: eventData.feedbackDeadlineDays || null,
          autoGenerateCertificate: eventData.autoGenerateCertificate || false,
          certificateTemplateId: eventData.certificateTemplateId || null,
          certificateAutoSendEmail: eventData.certificateAutoSendEmail !== false,
          feedbackFormCreated: false,
          feedbackFormTemplate: eventData.feedbackFormTemplate || 'auto-generate',
          feedbackEnabled: eventData.feedbackEnabled || false
        });
        
        
        // Switch to the add event section
        setActiveSection('add-event');
        
        // Clear the duplicate parameter from URL
        const url = new URL(window.location.href);
        url.searchParams.delete('duplicate');
        window.history.replaceState({}, '', url.toString());
        
      } catch (error) {
        console.error('Error parsing duplicate data:', error);
      }
    }
  }, [searchParams, data.locations, data.categories, loading]);

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
        // Handle organizer editing
        const organizerName = data.organizers[index];
        const organizers = await getOrganizers();
        const organizer = organizers.find((o: any) => o.name === organizerName);
        if (organizer) {
          await updateOrganizer(organizer.id, newValue.trim());
          console.log('Organizer updated in Supabase');
          await loadAllData(); // Refresh the data to show the updated organizer
        }
      } else if (activeSection === 'speakers') {
        // Handle speaker editing
        const speaker = data.speakers[index];
        if (speaker) {
          setEditingSpeaker({
            id: speaker.id,
            name: speaker.name,
            role: speaker.role
          });
        }
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

  const handleUpdateSpeaker = async () => {
    if (!editingSpeaker || !editingSpeaker.name.trim() || !editingSpeaker.role.trim()) {
      alert('Please fill in both name and role fields.');
      return;
    }
    
    try {
      await updateSpeaker(editingSpeaker.id, {
        name: editingSpeaker.name.trim(),
        role: editingSpeaker.role.trim()
      });
      
      console.log('Speaker updated in Supabase');
      setEditingSpeaker(null);
      await loadAllData();
    } catch (error) {
      console.error('Error updating speaker:', error);
      alert('Failed to update speaker. Please try again.');
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
        const organizer = organizers.find((o: any) => o.name === organizerName);
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
    // Validate required fields with specific toast notifications
    if (!formData.title) {
      toast.error('Please enter an event title');
      return;
    }
    if (!formData.date) {
      toast.error('Please select an event date');
      return;
    }
    if (!formData.startTime) {
      toast.error('Please enter a start time');
      return;
    }
    if (!formData.endTime) {
      toast.error('Please enter an end time');
      return;
    }

    // Validate certificate template selection if auto-generation is enabled
    if (formData.autoGenerateCertificate && !formData.certificateTemplateId) {
      toast.error('Please select a certificate template to enable auto-generation');
      return;
    }

    // Auto-uncheck feedbackRequiredForCertificate if feedback is disabled
    if (!formData.feedbackEnabled && formData.feedbackRequiredForCertificate) {
      formData.feedbackRequiredForCertificate = false;
    }

    // Validate feedback requirements when "generate after feedback completion" is selected
    if (formData.feedbackRequiredForCertificate) {
      if (!formData.feedbackEnabled) {
        toast.error('Please enable feedback in Feedback Configuration to use "Generate after feedback completion"');
        return;
      }
      // Empty template defaults to auto-generate, which is valid
      // No need to check template selection as auto-generate is acceptable
    }

    try {
      setSaving(true);

      // Debug: Log session data
      console.log('Current session:', session);
      console.log('User data:', session?.user);
      console.log('Author name will be:', session?.user?.name || session?.user?.email || 'Unknown User');

      // Use location ID directly (already resolved during form pre-filling)
      const locationId = formData.location || undefined;
      // Only get organizer ID if organizer is not empty (check for both empty string and falsy)
      const organizerId = (formData.organizer && formData.organizer.trim()) ? await getOrCreateOrganizer(formData.organizer) : null;
      // Get ALL category IDs, not just the first one
      const categoryIds = await Promise.all(
        formData.category.map(catName => getCategoryIdByName(catName))
      ).then(ids => ids.filter((id): id is string => id !== null));
      const categoryId = categoryIds.length > 0 ? categoryIds[0] : null; // Keep first as primary for backward compatibility
      const formatId = formData.format ? await getFormatIdByName(formData.format) : null;
      const speakerIds = await getSpeakerIdsByNames(formData.speakers);
      // Get location IDs from other locations (stored as IDs already)
      const locationIds = formData.otherLocations || [];
      // Get organizer IDs from other organizers (need to look them up)
      const organizerIds = await Promise.all(
        (formData.otherOrganizers || []).map(async (orgName) => {
          const organizer = await getOrganizers().then(orgs => orgs.find((o: any) => o.name === orgName));
          return organizer?.id;
        })
      ).then(ids => ids.filter((id): id is string => id !== undefined));

      // Get user ID from database for proper author attribution
      let authorId: string | undefined;
      let authorName: string = session?.user?.name || session?.user?.email || 'System User';
      
      if (session?.user?.email) {
        try {
          // Use service role client to bypass RLS for author lookup
          const { supabaseAdmin } = await import('@/utils/supabase');
          
          // First try to find existing user
          let { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, name, role')
            .eq('email', session.user.email)
            .single();
          
          // If user doesn't exist, create them using the helper function
          if (userError && userError.code === 'PGRST116') {
            console.log('User not found, creating new user...');
            const { data: newUser, error: createError } = await supabaseAdmin
              .rpc('get_or_create_user_for_event', {
                user_email: session.user.email,
                user_name: session.user.name || null,
                user_role: 'user'
              });
            
            if (newUser && !createError) {
              authorId = newUser;
              authorName = session.user.name || session.user.email;
              console.log('✅ User created and linked:', { authorId, authorName });
            } else {
              console.error('Failed to create user:', createError);
            }
          } else if (user && !userError) {
            authorId = user.id;
            authorName = user.name || session.user.name || session.user.email;
            console.log('✅ Author lookup successful:', { authorId, authorName });
          } else {
            console.warn('⚠️ Author lookup failed:', userError?.message);
          }
        } catch (error) {
          console.warn('Could not fetch user ID for author attribution:', error);
          // Fallback: use session data
          authorName = session.user.name || session.user.email;
        }
      }

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
        organizer_id: organizerId ?? undefined,
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
        rescheduled_date: formData.rescheduledDate || null,
        moved_online_link: formData.movedOnlineLink || null,
        status: 'published',
        author_id: authorId,
        author_name: authorName,
        featured_image: featuredImagePath || null,
        // Booking fields
        booking_enabled: formData.bookingEnabled,
        booking_button_label: formData.bookingButtonLabel,
        booking_capacity: formData.bookingCapacity,
        booking_deadline_hours: formData.bookingDeadlineHours,
        allow_waitlist: formData.allowWaitlist,
        confirmation_checkbox_1_text: formData.confirmationCheckbox1Text,
        confirmation_checkbox_1_required: formData.confirmationCheckbox1Required,
        confirmation_checkbox_2_text: formData.confirmationCheckbox2Text || null,
        confirmation_checkbox_2_required: formData.confirmationCheckbox2Required,
        cancellation_deadline_hours: formData.cancellationDeadlineHours,
        allowed_roles: formData.allowedCategories && formData.allowedCategories.length > 0 ? formData.allowedCategories : null,
        approval_mode: formData.approvalMode,
        // Auto-certificate fields
        qr_attendance_enabled: formData.qrAttendanceEnabled || false,
        feedback_required_for_certificate: formData.feedbackRequiredForCertificate ?? false,
        feedback_deadline_days: formData.feedbackDeadlineDays,
        auto_generate_certificate: formData.autoGenerateCertificate || false,
        certificate_template_id: formData.certificateTemplateId,
        certificate_auto_send_email: formData.certificateAutoSendEmail ?? true,
        feedback_enabled: formData.feedbackEnabled || false,
        // Feedback immediate creation hints
        feedbackFormTemplate: formData.feedbackFormTemplate && formData.feedbackFormTemplate !== 'auto-generate' ? formData.feedbackFormTemplate : 'auto-generate',
        feedbackCustomQuestions: undefined
      } as any);

      console.log('Event created in Supabase:', newEvent);

      if (newEvent?.id) {
        const promotionResult = await promoteDraftAssets(
          newEvent.id,
          formData.description,
          featuredImagePath
        );

        if (promotionResult.updated) {
          try {
            await updateEvent(newEvent.id, {
              description: promotionResult.updatedDescription,
              featured_image: promotionResult.updatedFeaturedPath || null,
            } as any);
            setFormData((prev) => ({
              ...prev,
              description: promotionResult.updatedDescription,
            }));
            descriptionContentRef.current = promotionResult.updatedDescription;
            if (promotionResult.updatedFeaturedPath) {
              const viewUrl = `/api/events/images/view?path=${encodeURIComponent(
                promotionResult.updatedFeaturedPath
              )}`;
              setFeaturedImage(viewUrl);
            }
            if (promotionResult.updatedFeaturedPath !== featuredImagePath) {
              setFeaturedImagePath(promotionResult.updatedFeaturedPath);
            }
          } catch (error) {
            console.error('Error updating event with promoted images:', error);
          }
        }
      }
      // Persist selected template across redirect so dropdown reflects immediately
      try {
        if (formData.feedbackEnabled) {
          sessionStorage.setItem('feedbackTemplateSelected', formData.feedbackFormTemplate || 'auto-generate');
        }
      } catch {}
      
      // Reload events from Supabase
      await loadAllData();
      
      // Mark as saved to prevent cleanup
      isSavedRef.current = true;
      setUploadedImagePaths([]);
      resetDraftSessionId();
      descriptionContentRef.current = '';
      // Clear featured image state (it's now saved in the database)
      setFeaturedImage(null);
      setFeaturedImagePath(null);
      
      // Show success message
      toast.success('Event created successfully');
      
      // Show announcement creation notification if applicable
      if ((newEvent as any).announcementCreated && (newEvent as any).announcementStatus) {
        const status = (newEvent as any).announcementStatus;
        let statusText = '';
        if (status === 'postponed') statusText = 'postponed';
        else if (status === 'cancelled') statusText = 'cancelled';
        else if (status === 'rescheduled') statusText = 'rescheduled';
        else if (status === 'moved-online') statusText = 'moved online';
        
        if (statusText) {
          toast.success(`Announcement automatically created for ${statusText} event`);
        }
      }
      
      // Redirect to edit page of the newly created event
      if (newEvent && newEvent.id) {
        router.push(`/event-data?edit=${newEvent.id}&tab=all-events&source=dashboard`);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEvent = async () => {
    console.log('🔍 Debug: handleUpdateEvent called with formData:', {
      title: formData.title,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      editingEventId,
      qrAttendanceEnabled: formData.qrAttendanceEnabled
    });
    
    if (!formData.title || !formData.date || !formData.startTime || !formData.endTime || !editingEventId) {
      console.log('Form validation failed - missing required fields');
      return;
    }

    // Validate certificate template selection if auto-generation is enabled
    if (formData.autoGenerateCertificate && !formData.certificateTemplateId) {
      toast.error('Please select a certificate template to enable auto-generation');
      return;
    }

    // Auto-uncheck feedbackRequiredForCertificate if feedback is disabled
    if (!formData.feedbackEnabled && formData.feedbackRequiredForCertificate) {
      formData.feedbackRequiredForCertificate = false;
    }

    // Validate feedback requirements when "generate after feedback completion" is selected
    if (formData.feedbackRequiredForCertificate) {
      if (!formData.feedbackEnabled) {
        toast.error('Please enable feedback in Feedback Configuration to use "Generate after feedback completion"');
        return;
      }
      // Empty template defaults to auto-generate, which is valid
      // No need to check template selection as auto-generate is acceptable
    }

    try {
      setSaving(true);

      // Use location ID directly (already resolved during form pre-filling)
      const locationId = formData.location || undefined;
      // Only get organizer ID if organizer is not empty (check for both empty string and falsy)
      const organizerId = (formData.organizer && formData.organizer.trim()) ? await getOrCreateOrganizer(formData.organizer) : null;
      // Get ALL category IDs, not just the first one
      const categoryIds = await Promise.all(
        formData.category.map(catName => getCategoryIdByName(catName))
      ).then(ids => ids.filter((id): id is string => id !== null));
      const categoryId = categoryIds.length > 0 ? categoryIds[0] : null; // Keep first as primary for backward compatibility
      const formatId = formData.format ? await getFormatIdByName(formData.format) : null;
      const speakerIds = await getSpeakerIdsByNames(formData.speakers);
      // Get location IDs from other locations (stored as IDs already)
      const locationIds = formData.otherLocations || [];
      // Get organizer IDs from other organizers (need to look them up)
      console.log('🔍 Looking up organizers for:', formData.otherOrganizers);
      const allOrganizers = await getOrganizers();
      console.log('📋 Available organizers:', allOrganizers.map((o: any) => o.name));
      
      const organizerIds = formData.otherOrganizers
        .map(orgName => {
          const organizer = allOrganizers.find((o: any) => o.name === orgName);
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
      const updatedEvent = await updateEvent(editingEventId, {
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
        organizer_id: organizerId ?? undefined,
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
        rescheduled_date: formData.rescheduledDate || null,
        moved_online_link: formData.movedOnlineLink || null,
        status: 'published',
        featured_image: featuredImagePath || null,
        // Booking fields
        booking_enabled: formData.bookingEnabled,
        booking_button_label: formData.bookingButtonLabel,
        booking_capacity: formData.bookingCapacity,
        booking_deadline_hours: formData.bookingDeadlineHours,
        allow_waitlist: formData.allowWaitlist,
        confirmation_checkbox_1_text: formData.confirmationCheckbox1Text,
        confirmation_checkbox_1_required: formData.confirmationCheckbox1Required,
        confirmation_checkbox_2_text: formData.confirmationCheckbox2Text || null,
        confirmation_checkbox_2_required: formData.confirmationCheckbox2Required,
        cancellation_deadline_hours: formData.cancellationDeadlineHours,
        allowed_roles: formData.allowedCategories && formData.allowedCategories.length > 0 ? formData.allowedCategories : null,
        approval_mode: formData.approvalMode,
        // Auto-certificate fields
        qr_attendance_enabled: formData.qrAttendanceEnabled || false,
        feedback_required_for_certificate: formData.feedbackRequiredForCertificate ?? false,
        feedback_deadline_days: formData.feedbackDeadlineDays,
        auto_generate_certificate: formData.autoGenerateCertificate || false,
        certificate_template_id: formData.certificateTemplateId,
        certificate_auto_send_email: formData.certificateAutoSendEmail ?? true,
        feedback_enabled: formData.feedbackEnabled || false
      } as any);

      console.log('Event updated in Supabase:', editingEventId);
      
      // Wait a moment for categories to be linked
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload events from Supabase
      await loadAllData();
      
      // Mark as saved to prevent cleanup
      isSavedRef.current = true;
      setUploadedImagePaths([]);
      descriptionContentRef.current = '';
      // Clear featured image state (it's now saved in the database)
      setFeaturedImage(null);
      setFeaturedImagePath(null);
      
      // Show success message
      setUpdateSuccess(true);
      toast.success('Event updated successfully');
      setTimeout(() => setUpdateSuccess(false), 3000);
      
      // Show announcement creation notification if applicable
      if ((updatedEvent as any)?.announcementCreated && (updatedEvent as any)?.announcementStatus) {
        const status = (updatedEvent as any).announcementStatus;
        let statusText = '';
        if (status === 'postponed') statusText = 'postponed';
        else if (status === 'cancelled') statusText = 'cancelled';
        else if (status === 'rescheduled') statusText = 'rescheduled';
        else if (status === 'moved-online') statusText = 'moved online';
        
        if (statusText) {
          toast.success(`Announcement automatically created for ${statusText} event`);
        }
      }
      
      // Keep the form in edit mode instead of resetting
      console.log('✅ Event and categories updated successfully');
      
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event. Please check console for details.');
    } finally {
      setSaving(false);
    }
  };

  // Image upload callback
  const handleImageUploaded = (imagePath: string) => {
    setUploadedImagePaths(prev => [...prev, imagePath]);
  };

  // Featured image upload handler
  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast.error('Invalid file type. Only images are allowed.');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

    try {
      setUploadingFeaturedImage(true);

      // Create FormData
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      // If eventId exists, use it; otherwise upload to general/images (will be moved/copied when event is saved)
      if (editingEventId) {
        uploadFormData.append('eventId', editingEventId);
      }
      if (eventSlug) {
        uploadFormData.append('eventSlug', eventSlug);
      }
      if (!editingEventId && draftSessionIdRef.current) {
        uploadFormData.append('draftId', draftSessionIdRef.current);
      }
      uploadFormData.append('isFeatured', 'true'); // Flag to indicate this is a featured image

      // Upload image
      const response = await fetch('/api/events/images', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      const data = await response.json();
      
      // Store the view URL and path
      setFeaturedImage(data.url);
      setFeaturedImagePath(data.path);
      
      toast.success('Featured image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading featured image:', error);
      toast.error(error.message || 'Failed to upload featured image');
    } finally {
      setUploadingFeaturedImage(false);
      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  // Remove featured image handler
  const handleRemoveFeaturedImage = async () => {
    if (!featuredImagePath) {
      setFeaturedImage(null);
      setFeaturedImagePath(null);
      return;
    }

    try {
      // Delete from storage
      const response = await fetch('/api/events/images/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePaths: [featuredImagePath] }),
      });

      if (!response.ok) {
        console.error('Failed to delete featured image from storage');
      }

      setFeaturedImage(null);
      setFeaturedImagePath(null);
      toast.success('Featured image removed');
    } catch (error) {
      console.error('Error removing featured image:', error);
      // Still remove from UI even if deletion fails
      setFeaturedImage(null);
      setFeaturedImagePath(null);
    }
  };

  // Cleanup function to extract and delete images
  const cleanupImagesRef = useRef<() => void>(() => {});

  useEffect(() => {
    cleanupImagesRef.current = () => {
      if (isSavedRef.current) return;

      const imagePaths: string[] = [];

      if (descriptionContentRef.current) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(descriptionContentRef.current, 'text/html');
        const images = doc.querySelectorAll('img');

        images.forEach((img) => {
          const src = img.getAttribute('src');
          if (!src) return;
          try {
            const url = new URL(src, window.location.origin);
            const pathParam = url.searchParams.get('path');
            if (pathParam) {
              imagePaths.push(pathParam);
            } else if (src.includes('/api/events/images/view')) {
              const pathMatch = src.match(/path=([^&]+)/);
              if (pathMatch) {
                imagePaths.push(decodeURIComponent(pathMatch[1]));
              }
            }
          } catch {
            // ignore parse errors
          }
        });
      }

      uploadedImagePaths.forEach((path) => {
        if (!imagePaths.includes(path)) {
          imagePaths.push(path);
        }
      });

      if (featuredImagePath) {
        imagePaths.push(featuredImagePath);
      }

      if (imagePaths.length === 0) return;

      const data = JSON.stringify({ imagePaths });
      if (navigator.sendBeacon) {
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon('/api/events/images/cleanup', blob);
      } else {
        fetch('/api/events/images/cleanup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true,
        }).catch(() => {});
      }
    };
  }, [uploadedImagePaths, featuredImagePath]);

  const promoteDraftAssets = useCallback(
    async (
      newEventId: string,
      currentDescription: string,
      currentFeaturedPath: string | null
    ): Promise<{
      updatedDescription: string;
      updatedFeaturedPath: string | null;
      updated: boolean;
    }> => {
      const draftPaths = new Set<string>();
      extractImagePathsFromHtml(currentDescription).forEach((path) => {
        if (path.includes('drafts/')) {
          draftPaths.add(path);
        }
      });

      if (currentFeaturedPath && currentFeaturedPath.includes('drafts/')) {
        draftPaths.add(currentFeaturedPath);
      }

      if (draftPaths.size === 0) {
        return {
          updatedDescription: currentDescription,
          updatedFeaturedPath: currentFeaturedPath,
          updated: false,
        };
      }

      try {
        const response = await fetch('/api/events/images/promote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: newEventId,
            eventSlug,
            paths: Array.from(draftPaths),
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          console.error('Failed to promote draft images:', error);
          return {
            updatedDescription: currentDescription,
            updatedFeaturedPath: currentFeaturedPath,
            updated: false,
          };
        }

        const { pathMap } = await response.json();
        if (!pathMap || Object.keys(pathMap).length === 0) {
          return {
            updatedDescription: currentDescription,
            updatedFeaturedPath: currentFeaturedPath,
            updated: false,
          };
        }

        const updatedDescription = replaceImagePathsInHtml(currentDescription, pathMap);
        const updatedFeaturedPath =
          currentFeaturedPath && pathMap[currentFeaturedPath]
            ? pathMap[currentFeaturedPath]
            : currentFeaturedPath;

        return {
          updatedDescription,
          updatedFeaturedPath,
          updated: true,
        };
      } catch (error) {
        console.error('Error promoting draft images:', error);
        return {
          updatedDescription: currentDescription,
          updatedFeaturedPath: currentFeaturedPath,
          updated: false,
        };
      }
    },
    [eventSlug]
  );

  // Track description content changes
  useEffect(() => {
    descriptionContentRef.current = formData.description;
  }, [formData.description]);

  // Reset saved flag when starting a new event (not editing)
  useEffect(() => {
    if (activeSection === 'add-event' && !editingEventId) {
      isSavedRef.current = false;
      setUploadedImagePaths([]);
      descriptionContentRef.current = formData.description || '';
    }
  }, [activeSection, editingEventId, formData.description]);

  // Cleanup on page unload/refresh - only set up when creating new event
  useEffect(() => {
    // Don't set up cleanup if editing existing event or already saved
    if (editingEventId || isSavedRef.current) return;
    
    const handleBeforeUnload = () => {
      if (!isSavedRef.current) {
        cleanupImagesRef.current();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also cleanup on unmount (but only if not saved)
      if (!isSavedRef.current) {
        cleanupImagesRef.current();
      }
    };
  }, [editingEventId]);

  const resetForm = () => {
    // Cleanup images before resetting if not saved
    if (!isSavedRef.current) {
      cleanupImagesRef.current();
    }
    
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
      format: '',
      speakers: [],
      hideSpeakers: false,
      eventLink: '',
      moreInfoLink: '',
      moreInfoTarget: 'current',
      eventStatus: 'scheduled',
      rescheduledDate: null,
      movedOnlineLink: null,
      // Booking fields
      bookingEnabled: false,
      bookingButtonLabel: 'Register',
      bookingCapacity: null,
      bookingDeadlineHours: 0,
      allowWaitlist: true,
      confirmationCheckbox1Text: 'I confirm my attendance at this event',
      confirmationCheckbox1Required: true,
      confirmationCheckbox2Text: '',
      confirmationCheckbox2Required: false,
      cancellationDeadlineHours: 0,
      allowedCategories: [],
      approvalMode: 'auto',
      // Auto-certificate fields
      qrAttendanceEnabled: false,
      feedbackRequiredForCertificate: false,
      feedbackDeadlineDays: null,
      autoGenerateCertificate: false,
      certificateTemplateId: null,
      certificateAutoSendEmail: true,
      feedbackFormTemplate: 'auto-generate',
      feedbackEnabled: false,
      feedbackFormCreated: false
    });
    setActiveFormSection('basic');
    setEditingEventId(null);
    setUpdateSuccess(false);
    setUploadedImagePaths([]);
    descriptionContentRef.current = '';
    setFeaturedImage(null);
    setFeaturedImagePath(null);
    setShowFeaturedImage(false);
    isSavedRef.current = false;
    resetDraftSessionId();
  };

  // Function to check if event has active bookings
  const checkActiveBookings = async (eventId: string) => {
    if (!eventId) return false;
    
    try {
      setCheckingBookings(true);
      const response = await fetch(`/api/bookings/event/${eventId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch booking data');
      }
      
      const data = await response.json();
      const activeBookings = data.bookings?.filter((booking: any) => 
        booking.status === 'confirmed' || booking.status === 'waitlist'
      ) || [];
      
      const hasActive = activeBookings.length > 0;
      setHasActiveBookings(hasActive);
      return hasActive;
    } catch (error) {
      console.error('Error checking active bookings:', error);
      setHasActiveBookings(false);
      return false;
    } finally {
      setCheckingBookings(false);
    }
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
      const parentName = categoryForm.parent !== 'none' && categoryForm.parent 
        ? categoryForm.parent
        : null;

      await createCategory({
        name: categoryForm.name.trim(),
        slug: categoryForm.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
        parent_id: parentName,
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
    setDeleteTarget(categoryId);
    setShowDeleteCategoryDialog(true);
  };

  const confirmDeleteCategory = async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    try {
      console.log('Attempting to delete category:', deleteTarget);
      await deleteCategoryFromDB(deleteTarget);
      console.log('Category deleted from Supabase successfully:', deleteTarget);
      
      // Reload data
      await loadAllData();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      alert(`Failed to delete category: ${error?.message || 'Unknown error'}. Check if you have admin permissions in Supabase.`);
    } finally {
      setIsDeleting(false);
      setShowDeleteCategoryDialog(false);
      setDeleteTarget(null);
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
      const parentName = editCategoryForm.parent !== 'none' && editCategoryForm.parent 
        ? editCategoryForm.parent
        : null;

      await updateCategory(categoryId, {
        name: editCategoryForm.name.trim(),
        slug: editCategoryForm.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
        parent_id: parentName,
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
        : data.formats.map((f: any) => f.id)
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

  // Speaker bulk delete functions
  const handleSelectSpeaker = (speakerId: string) => {
    setSelectedSpeakers(prev => 
      prev.includes(speakerId) 
        ? prev.filter(s => s !== speakerId)
        : [...prev, speakerId]
    );
  };

  const handleSelectAllSpeakers = () => {
    setSelectedSpeakers(
      selectedSpeakers.length === data.speakers.length 
        ? [] 
        : data.speakers.map((s: any) => s.id)
    );
  };

  const handleBulkDeleteSpeakers = () => {
    setShowSpeakerDeleteConfirm(true);
  };
  const confirmDeleteSpeakers = async () => {
    try {
      // Delete all selected speakers
      await Promise.all(selectedSpeakers.map(id => deleteSpeakerFromDB(id)));
      console.log('Bulk deleted speakers:', selectedSpeakers);
      
      setSelectedSpeakers([]);
      setShowSpeakerDeleteConfirm(false);
      
      // Reload data
      await loadAllData();
    } catch (error) {
      console.error('Error bulk deleting speakers:', error);
      alert('Failed to delete some speakers. Please check console for details.');
      setShowSpeakerDeleteConfirm(false);
    }
  };

  const cancelDeleteSpeakers = () => {
    setShowSpeakerDeleteConfirm(false);
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
    setDeleteTarget(formatId);
    setShowDeleteFormatDialog(true);
  };

  const confirmDeleteFormat = async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    try {
      console.log('Attempting to delete format:', deleteTarget);
      await deleteFormatFromDB(deleteTarget);
      console.log('Format deleted from Supabase successfully:', deleteTarget);
      
      // Reload data
      await loadAllData();
    } catch (error: any) {
      console.error('Error deleting format:', error);
      alert(`Failed to delete format: ${error?.message || 'Unknown error'}. Check if you have admin permissions in Supabase.`);
    } finally {
      setIsDeleting(false);
      setShowDeleteFormatDialog(false);
      setDeleteTarget(null);
    }
  };

  const confirmDeleteSpeaker = async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    try {
      console.log('Attempting to delete speaker:', deleteTarget);
      await deleteSpeakerFromDB(deleteTarget);
      console.log('Speaker deleted from Supabase successfully:', deleteTarget);
      
      // Reload data
      await loadAllData();
    } catch (error: any) {
      console.error('Error deleting speaker:', error);
      alert(`Failed to delete speaker: ${error?.message || 'Unknown error'}. Check if you have admin permissions in Supabase.`);
    } finally {
      setIsDeleting(false);
      setShowDeleteSpeakerDialog(false);
      setDeleteTarget(null);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    console.log('🗑️ SINGLE EVENT DELETE triggered for:', eventId);
    console.log('🗑️ Current selectedEvents:', selectedEvents);
    console.log('🗑️ Current showBulkDeleteDialog:', showBulkDeleteDialog);
    console.log('🗑️ Current showDeleteEventDialog:', showDeleteEventDialog);
    
    // Check if event has active bookings before showing delete dialog
    const hasBookings = await checkActiveBookings(eventId);
    if (hasBookings) {
      setDeleteTarget(eventId);
      setBulkDeleteTargets([eventId]);
      setBulkBookingEvents([{ id: eventId, title: getEventTitle(eventId) }]);
      setShowBulkDeleteDialog(false);
      setShowDeleteEventDialog(false);
      setShowBookingsWarningDialog(true);
      return;
    }
    
    // Ensure bulk delete dialog is closed
    setShowBulkDeleteDialog(false);
    
    // Use setTimeout to ensure state updates are processed in order
    setTimeout(() => {
    setDeleteTarget(eventId);
    setShowDeleteEventDialog(true);
      
      console.log('🗑️ SINGLE EVENT DELETE - After setting states:');
      console.log('🗑️ - showBulkDeleteDialog set to:', false);
      console.log('🗑️ - showDeleteEventDialog set to:', true);
      console.log('🗑️ - deleteTarget set to:', eventId);
    }, 0);
  };

  const handleDuplicateEvent = async (eventId: string) => {
    // Find the event to duplicate
    const eventToDuplicate = events.find(e => e.id === eventId);
    if (!eventToDuplicate) {
      alert('Event not found');
      return;
    }

    // Create event data for pre-filling
    const eventData = {
      title: `${eventToDuplicate.title} (Copy)`,
      description: eventToDuplicate.description,
      date: eventToDuplicate.date,
      startTime: eventToDuplicate.startTime,
      endTime: eventToDuplicate.endTime,
      isAllDay: eventToDuplicate.isAllDay,
      hideTime: eventToDuplicate.hideTime,
      hideEndTime: eventToDuplicate.hideEndTime,
      timeNotes: eventToDuplicate.timeNotes,
      location: eventToDuplicate.location, // This should be the location name, not ID
      hideLocation: eventToDuplicate.hideLocation,
      organizer: eventToDuplicate.organizer,
      hideOrganizer: eventToDuplicate.hideOrganizer,
      categories: eventToDuplicate.category,
      format: eventToDuplicate.format,
      speakers: eventToDuplicate.speakers,
      hideSpeakers: eventToDuplicate.hideSpeakers,
      eventLink: eventToDuplicate.eventLink,
      moreInfoLink: eventToDuplicate.moreInfoLink,
      moreInfoTarget: eventToDuplicate.moreInfoTarget,
      eventStatus: eventToDuplicate.eventStatus
    };

    // Encode the event data as URL parameters
    const encodedData = encodeURIComponent(JSON.stringify(eventData));
    
    // Redirect to add event page with pre-filled data
    window.open(`/event-data?duplicate=${encodedData}`, '_blank');
  };

  const confirmDeleteEvent = async () => {
    if (!deleteTarget) return;
    
    const targetEventId = deleteTarget;
    let encounteredBookingConstraint = false;
    setIsDeleting(true);
    try {
      await deleteEventFromDB(targetEventId);
      console.log('Event deleted from Supabase:', targetEventId);
      
      // Force refresh events from Supabase to ensure deleted event is removed
      await loadAllData(true);
      
      // If we're editing an event, reset the form and go back to all events
      if (editingEventId === targetEventId) {
        setEditingEventId(null);
        resetForm();
        setActiveSection('all-events');
        router.push('/event-data?tab=all-events&source=dashboard');
      } else {
        // Redirect to event-data all-events page after successful deletion
        router.push('/event-data?tab=all-events&source=dashboard');
      }
    } catch (error: any) {
      console.error('Error deleting event:', error);
      
      // Extract error message from API response
      let errorMessage = 'Failed to delete event. Please try again.';
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Check if the error is about existing bookings
      if (errorMessage.includes('existing bookings') || errorMessage.includes('Cannot delete event')) {
        toast.error('Cannot delete event with existing bookings. Please cancel all bookings first.');
        setShowDeleteEventDialog(false);
        setBulkDeleteTargets([targetEventId]);
        setBulkBookingEvents([{ id: targetEventId, title: getEventTitle(targetEventId) }]);
        setShowBookingsWarningDialog(true);
        encounteredBookingConstraint = true;
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsDeleting(false);
      if (!encounteredBookingConstraint) {
        setDeleteTarget(null);
        setBulkDeleteTargets([]);
        setBulkBookingEvents([]);
        setShowDeleteEventDialog(false);
      }
    }
  };

  const handleBulkDelete = async () => {
    console.log('🗑️ BULK DELETE triggered');
    console.log('🗑️ Selected events count:', selectedEvents.length);
    console.log('🗑️ Selected events:', selectedEvents);
    console.log('🗑️ Current showDeleteEventDialog:', showDeleteEventDialog);
    console.log('🗑️ Current showBulkDeleteDialog:', showBulkDeleteDialog);
    
    if (selectedEvents.length === 0) {
      console.log('❌ No events selected for bulk delete - returning early');
      return;
    }
    // Ensure single event delete dialog is closed
    setShowDeleteEventDialog(false);
    setBulkDeleteTargets([]);
    setBulkBookingEvents([]);
    setDeleteTarget(null);
    setShowBulkDeleteDialog(true);
    
    console.log('🗑️ BULK DELETE - After setting states:');
    console.log('🗑️ - showBulkDeleteDialog set to:', true);
    console.log('🗑️ - showDeleteEventDialog set to:', false);
  };

  const confirmBulkDelete = async () => {
    const eventsWithBookings: string[] = [];
    const eventsWithoutBookings: string[] = [];

    setIsDeleting(true);
    try {
      for (const id of selectedEvents) {
        try {
          await deleteEventFromDB(id);
          eventsWithoutBookings.push(id);
        } catch (error: any) {
          const msg = error?.response?.data?.error || error?.message || '';
          if (msg.includes('existing bookings') || msg.includes('Cannot delete event')) {
            eventsWithBookings.push(id);
          } else {
            throw error;
          }
        }
      }

      if (eventsWithoutBookings.length > 0) {
        await loadAllData(true);
        toast.success(`${eventsWithoutBookings.length} event(s) deleted successfully`);
      }

      if (eventsWithBookings.length > 0) {
        setBulkDeleteTargets(eventsWithBookings);
        setBulkBookingEvents(
          eventsWithBookings.map((id) => ({ id, title: getEventTitle(id) }))
        );
        setDeleteTarget(eventsWithBookings.length === 1 ? eventsWithBookings[0] : null);
        setShowBookingsWarningDialog(true);
        toast.error(`${eventsWithBookings.length} event(s) have existing bookings.`);
      } else {
        setBulkDeleteTargets([]);
        setBulkBookingEvents([]);
        setDeleteTarget(null);
      }
    } catch (error: any) {
      console.error('Error bulk deleting events:', error);
      const errorMessage = error?.message || 'Failed to delete selected events. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setSelectedEvents(eventsWithBookings);
      setShowBulkDeleteDialog(false);
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

    console.log('🔍 Debug: Loading event for editing:', {
      id: eventToEdit.id,
      title: eventToEdit.title,
      feedbackEnabled: (eventToEdit as any).feedbackEnabled,
      qrAttendanceEnabled: (eventToEdit as any).qrAttendanceEnabled
    });

    // Set editing mode
    setEditingEventId(eventId);
    setActiveSection('add-event');
    setActiveFormSection('basic');
    setUpdateSuccess(false); // Reset success state
    isSavedRef.current = true; // Editing existing event, so mark as saved initially
    setUploadedImagePaths([]);
    descriptionContentRef.current = eventToEdit.description || '';
    
    // Load featured image if it exists
    const featuredImagePath = (eventToEdit as any).featured_image;
    if (featuredImagePath) {
      // Generate view URL for featured image
      const viewUrl = `/api/events/images/view?path=${encodeURIComponent(featuredImagePath)}`;
      setFeaturedImage(viewUrl);
      setFeaturedImagePath(featuredImagePath);
      setShowFeaturedImage(true);
    } else {
      setFeaturedImage(null);
      setFeaturedImagePath(null);
      setShowFeaturedImage(false);
    }

    // Update URL to reflect edit state
    router.push(`/event-data?edit=${eventId}&tab=add-event`);

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
      otherLocations: eventToEdit.otherLocations ? 
        eventToEdit.otherLocations.map(locName => 
          data.locations.find(l => l.name === locName)?.id || ''
        ).filter(id => id !== '') : [],
      hideLocation: eventToEdit.hideLocation ?? false,
      organizer: eventToEdit.organizer,
      otherOrganizers: eventToEdit.otherOrganizers || [],
      hideOrganizer: eventToEdit.hideOrganizer ?? false,
      category: eventToEdit.category || [], // Already an array from database
      format: eventToEdit.format || '',
      speakers: eventToEdit.speakers || [],
      hideSpeakers: eventToEdit.hideSpeakers ?? false,
      eventLink: eventToEdit.eventLink || '',
      moreInfoLink: eventToEdit.moreInfoLink || '',
      moreInfoTarget: eventToEdit.moreInfoTarget || 'current',
      eventStatus: eventToEdit.eventStatus || 'scheduled',
      rescheduledDate: (eventToEdit as any).rescheduledDate || null,
      movedOnlineLink: (eventToEdit as any).movedOnlineLink || null,
      // Booking fields
      bookingEnabled: eventToEdit.bookingEnabled ?? false,
      bookingButtonLabel: eventToEdit.bookingButtonLabel || 'Register',
      bookingCapacity: eventToEdit.bookingCapacity ?? null,
      bookingDeadlineHours: eventToEdit.bookingDeadlineHours ?? 0,
      allowWaitlist: eventToEdit.allowWaitlist ?? true,
      confirmationCheckbox1Text: eventToEdit.confirmationCheckbox1Text || 'I confirm my attendance at this event',
      confirmationCheckbox1Required: eventToEdit.confirmationCheckbox1Required ?? true,
      confirmationCheckbox2Text: eventToEdit.confirmationCheckbox2Text ?? '',
      confirmationCheckbox2Required: eventToEdit.confirmationCheckbox2Required ?? false,
      cancellationDeadlineHours: (eventToEdit as any).cancellationDeadlineHours ?? 0,
      allowedCategories: (eventToEdit as any).allowedCategories || eventToEdit.category || [],
      approvalMode: (eventToEdit as any).approvalMode || 'auto',
      // Auto-certificate fields
      qrAttendanceEnabled: (eventToEdit as any).qrAttendanceEnabled ?? false,
      feedbackRequiredForCertificate: (eventToEdit as any).feedbackRequiredForCertificate ?? false,
      feedbackDeadlineDays: (eventToEdit as any).feedbackDeadlineDays ?? null,
      autoGenerateCertificate: (eventToEdit as any).autoGenerateCertificate ?? false,
      certificateTemplateId: (eventToEdit as any).certificateTemplateId ?? null,
      certificateAutoSendEmail: (eventToEdit as any).certificateAutoSendEmail ?? true,
      feedbackFormTemplate: (eventToEdit as any).feedbackFormTemplate || 'auto-generate',
      feedbackEnabled: (eventToEdit as any).feedbackEnabled ?? false,
      feedbackFormCreated: false
    });

    console.log('🔍 Debug: Form data set for editing:', {
      feedbackEnabled: (eventToEdit as any).feedbackEnabled ?? false,
      qrAttendanceEnabled: (eventToEdit as any).qrAttendanceEnabled ?? false
    });
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    resetForm();
    // Clear URL parameters and go back to all events
    router.push('/event-data?tab=all-events');
  };

  const handleDeleteEventFromEdit = async () => {
    if (!editingEventId) return;

    // Check if event has active bookings before showing delete confirmation
    const hasBookings = await checkActiveBookings(editingEventId);
    if (hasBookings) {
      toast.error(
        "Cannot delete event with active bookings. " +
        "Please cancel all bookings first before deleting this event."
      );
      setDeleteTarget(editingEventId);
      setBulkDeleteTargets([editingEventId]);
      setBulkBookingEvents([{ id: editingEventId, title: getEventTitle(editingEventId) }]);
      setShowDeleteEventDialog(false);
      setShowBulkDeleteDialog(false);
      setShowBookingsWarningDialog(true);
      return;
    }

    // Use the same dialog system as the main delete functionality
    setDeleteTarget(editingEventId);
    setBulkDeleteTargets([]);
    setBulkBookingEvents([]);
    setShowDeleteEventDialog(true);
  };


  // Stable callback functions for MultiSelect components
  const handleCategoryChange = React.useCallback((selected: string[]) => {
    console.log('🎯 Category selection changed:', selected);
    setFormData(prev => ({...prev, category: selected}));
  }, []);

  const handleFormatChange = React.useCallback((selected: string) => {
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
      selectedEvents.length === paginatedEvents.length 
        ? [] 
        : paginatedEvents.map((e: any) => e.id)
    );
  };

  const filteredEvents = events.filter(event => {
    // Search query filtering
    const matchesSearch = !searchQuery || 
      String(event.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(event.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(event.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(event.organizer || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(event.category) ? event.category.some(cat => String(cat || '').toLowerCase().includes(searchQuery.toLowerCase())) : String(event.category || '').toLowerCase().includes(searchQuery.toLowerCase())) ||
      String(event.format || '').toLowerCase().includes(searchQuery.toLowerCase());

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
    const matchesLocation = filters.location === 'all' || 
      event.location === filters.location ||
      (event.otherLocations && event.otherLocations.includes(filters.location));
    const matchesOrganizer = filters.organizer === 'all' || 
      event.organizer === filters.organizer ||
      (event.allOrganizers && event.allOrganizers.includes(filters.organizer));
    const matchesCategory = filters.category === 'all' || (Array.isArray(event.category) ? event.category.includes(filters.category) : event.category === filters.category);
    const matchesStartDate = !filters.startDate || event.date === filters.startDate;
    
    const now = new Date();
    const eventDate = new Date(`${event.date}T${event.startTime}`);
    const matchesEventType = filters.eventType === 'all' || 
      (filters.eventType === 'upcoming' && eventDate >= now) ||
      (filters.eventType === 'expired' && eventDate < now);
    
    const matches = matchesSearch && matchesDate && matchesFormat && matchesLocation && 
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
          aValue = Array.isArray(a.category) ? a.category.join(', ').toLowerCase() : '';
          bValue = Array.isArray(b.category) ? b.category.join(', ').toLowerCase() : '';
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
        case 'speaker':
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
  // Calculate pagination
  const totalPages = Math.ceil(sortedEvents.length / eventsPerPage);
  const startIndex = (currentPage - 1) * eventsPerPage;
  const endIndex = startIndex + eventsPerPage;
  const paginatedEvents = sortedEvents.slice(startIndex, endIndex);

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

  // Check if we should hide the event-data sidebar (when loaded from dashboard, viewing all-events, or editing an event)
  const hideEventDataSidebar = searchParams.get('source') === 'dashboard' || 
                               searchParams.get('tab') === 'all-events' || 
                               searchParams.get('edit') !== null;

  return (
    <div className="min-h-screen bg-gray-100 pt-20">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        {!hideEventDataSidebar && (
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
                    data-tour={item.key === 'all-events' ? 'event-data-all-events-tab' : 
                              item.key === 'add-event' ? 'event-data-add-event-tab' :
                              item.key === 'bulk-upload' ? 'event-data-bulk-upload-tab' :
                              item.key === 'categories' ? 'event-data-category-tab' :
                              item.key === 'formats' ? 'event-data-format-tab' :
                              item.key === 'locations' ? 'event-data-locations-tab' :
                              item.key === 'organizers' ? 'event-data-organizers-tab' :
                              item.key === 'speakers' ? 'event-data-speakers-tab' : undefined}
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
        )}

        {/* Mobile Header */}
        {!hideEventDataSidebar && (
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
        )}

        {/* Mobile Menu Overlay */}
        {!hideEventDataSidebar && isMobileMenuOpen && (
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
        <div className={`flex-1 p-4 lg:p-8 ${hideEventDataSidebar ? 'pt-4' : 'pt-16 lg:pt-8'} overflow-y-auto`}>
          {/* Data Source Indicator */}
          
          <div className="w-full">
            {activeSection === 'all-events' ? (
              /* Events List View */
              <>
                {/* Header */}
                <div className="mb-6 lg:mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">All Events</h1>
                      <p className="text-gray-600 mt-2">Manage all your training events</p>
                    </div>
                    <div className="flex gap-2" data-tour="event-data-header-buttons">
                      <Button
                        onClick={() => {
                          // Check if we're on the event-data page and if there are query parameters
                          const hasQueryParams = searchParams.toString().length > 0
                          
                          // If we're on event-data page but have query params, or we're on a different page, navigate to clean URL
                          if (pathname !== '/event-data' || hasQueryParams) {
                            // Navigate to clean /event-data URL (without query params) and set flag to start tour
                            sessionStorage.setItem('startEventDataTour', 'true')
                            // Use replace to ensure navigation happens and triggers useEffect
                            router.replace('/event-data')
                            return
                          }

                          // We're on clean /event-data URL and already on all-events tab, start tour immediately
                          const userRole = session?.user?.role || 'meded_team'
                          const eventDataSteps = createCompleteEventDataTour({ 
                            role: userRole as any,
                            onTabSwitch: (tab: string) => {
                              setActiveSection(tab)
                            }
                          })
                          if (startTourWithSteps) {
                            startTourWithSteps(eventDataSteps)
                          }
                        }}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                      >
                        Start Event Data Tour
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => router.push('/export-event-data')}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Export Data
                      </Button>
                    <Button 
                      onClick={() => {
                        resetForm();
                        setActiveSection('add-event');
                          // Navigate to add-event without sidebar (like from dashboard)
                          router.push('/event-data?tab=add-event&source=dashboard');
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                    </div>
                  </div>
                </div>

                {/* Filter Toolbar */}
                <Card className="mb-6" data-tour="event-data-filters">
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

                      {/* Search Input */}
                      <div className="w-full sm:w-auto flex gap-2">
                        <Input
                          type="text"
                          placeholder="Search events..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full sm:w-64"
                        />
                        {searchQuery && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSearchQuery('')}
                            className="px-3"
                          >
                            Clear
                          </Button>
                        )}
                      </div>

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
                          {getAllUniqueLocations().map((location, index) => (
                            <SelectItem key={index} value={location}>{location}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={filters.organizer} onValueChange={(value) => setFilters({...filters, organizer: value})}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Show all organizers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Show all organizers</SelectItem>
                          {getAllUniqueOrganizers().map((organizer, index) => (
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

                        {/* Events Per Page Dropdown */}
                        <Select value={eventsPerPage.toString()} onValueChange={(value) => setEventsPerPage(Number(value))}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Events per page" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10 events</SelectItem>
                            <SelectItem value="20">20 events</SelectItem>
                            <SelectItem value="50">50 events</SelectItem>
                            <SelectItem value="100">100 events</SelectItem>
                            <SelectItem value="999999">All events</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Reset and Event Type Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full sm:w-auto"
                          onClick={resetFilters}
                        >
                          Reset
                        </Button>

                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                          <Button 
                            variant={filters.eventType === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilters({...filters, eventType: 'all'})}
                            className="flex-1 sm:flex-none text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3"
                          >
                            All Events
                          </Button>
                          <Button 
                            variant={filters.eventType === 'expired' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilters({...filters, eventType: 'expired'})}
                            className="flex-1 sm:flex-none text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3"
                          >
                            Expired
                          </Button>
                          <Button 
                            variant={filters.eventType === 'upcoming' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilters({...filters, eventType: 'upcoming'})}
                            className="flex-1 sm:flex-none text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3"
                          >
                            Upcoming
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Events Summary */}
                {sortedEvents.length > 0 && (
                  <div className="mb-4 text-sm text-gray-600">
                    Showing {startIndex + 1}-{Math.min(endIndex, sortedEvents.length)} of {sortedEvents.length} events
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
                        <Button onClick={() => {
                          resetForm();
                          setActiveSection('add-event');
                          // Navigate to add-event without sidebar (like from dashboard)
                          router.push('/event-data?tab=add-event&source=dashboard');
                        }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Event
                        </Button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto min-h-[600px]">
                        <table className="w-full table-fixed text-sm md:text-base" data-tour="event-data-events-table">
                          <colgroup>
                            <col className="w-12" />
                            <col className="w-64" />
                            <col className="w-32" />
                            <col className="w-48" />
                            <col className="w-32" />
                            <col className="w-32" />
                            <col className="w-32" />
                            <col className="w-32" />
                            <col className="w-40" />
                            <col className="w-40" />
                            <col className="w-32" />
                          </colgroup>
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="text-left p-2 md:p-4 font-medium text-gray-900" data-tour="event-data-bulk-delete">
                                <Checkbox
                                  checked={paginatedEvents.length > 0 && paginatedEvents.every(e => selectedEvents.includes(e.id))}
                                  onCheckedChange={handleSelectAll}
                                  className="h-2.5 w-2.5 sm:h-4 sm:w-4"
                                />
                              </th>
                              <th className="text-left p-2 md:p-4 font-medium text-gray-900">
                                <button 
                                  onClick={() => handleSort('title')}
                                  className="flex items-center gap-1 md:gap-2 hover:text-gray-700 transition-colors"
                                >
                                  Title
                                  {sortConfig?.key === 'title' ? (
                                    sortConfig.direction === 'asc' ? 
                                      <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-blue-600" /> : 
                                      <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-blue-600 rotate-180" />
                                  ) : (
                                  <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                                  )}
                                </button>
                              </th>
                              <th className="text-left p-2 md:p-4 font-medium text-gray-900">
                                <button 
                                  onClick={() => handleSort('author')}
                                  className="flex items-center gap-1 md:gap-2 hover:text-gray-700 transition-colors"
                                >
                                  Author
                                  {sortConfig?.key === 'author' ? (
                                    sortConfig.direction === 'asc' ? 
                                      <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-blue-600" /> : 
                                      <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-blue-600 rotate-180" />
                                  ) : (
                                    <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                                  )}
                                </button>
                              </th>
                              <th className="text-left p-2 md:p-4 font-medium text-gray-900">
                                <button 
                                  onClick={() => handleSort('category')}
                                  className="flex items-center gap-1 md:gap-2 hover:text-gray-700 transition-colors"
                                >
                                  Category
                                  {sortConfig?.key === 'category' ? (
                                    sortConfig.direction === 'asc' ? 
                                      <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-blue-600" /> : 
                                      <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-blue-600 rotate-180" />
                                  ) : (
                                    <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                                  )}
                                </button>
                              </th>
                              <th className="text-left p-2 md:p-4 font-medium text-gray-900">
                                <button 
                                  onClick={() => handleSort('format')}
                                  className="flex items-center gap-1 md:gap-2 hover:text-gray-700 transition-colors"
                                >
                                  Format
                                  {sortConfig?.key === 'format' ? (
                                    sortConfig.direction === 'asc' ? 
                                      <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-blue-600" /> : 
                                      <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-blue-600 rotate-180" />
                                  ) : (
                                    <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                                  )}
                                </button>
                              </th>
                              <th className="text-left p-2 md:p-4 font-medium text-gray-900">
                                <button 
                                  onClick={() => handleSort('location')}
                                  className="flex items-center gap-1 md:gap-2 hover:text-gray-700 transition-colors"
                                >
                                  Location
                                  {sortConfig?.key === 'location' ? (
                                    sortConfig.direction === 'asc' ? 
                                      <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-blue-600" /> : 
                                      <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-blue-600 rotate-180" />
                                  ) : (
                                    <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                                  )}
                                </button>
                              </th>
                              <th className="text-left p-2 md:p-4 font-medium text-gray-900">
                                <button 
                                  onClick={() => handleSort('organizer')}
                                  className="flex items-center gap-1 md:gap-2 hover:text-gray-700 transition-colors"
                                >
                                  Organizer
                                  {sortConfig?.key === 'organizer' ? (
                                    sortConfig.direction === 'asc' ? 
                                      <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-blue-600" /> : 
                                      <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-blue-600 rotate-180" />
                                  ) : (
                                    <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                                  )}
                                </button>
                              </th>
                              <th className="text-left p-2 md:p-4 font-medium text-gray-900">
                                <button 
                                  onClick={() => handleSort('speaker')}
                                  className="flex items-center gap-1 md:gap-2 hover:text-gray-700 transition-colors"
                                >
                                  Speaker
                                  {sortConfig?.key === 'speaker' ? (
                                    sortConfig.direction === 'asc' ? 
                                      <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-blue-600" /> : 
                                      <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-blue-600 rotate-180" />
                                  ) : (
                                    <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                                  )}
                                </button>
                              </th>
                              <th className="text-left p-2 md:p-4 font-medium text-gray-900">
                                <button 
                                  onClick={() => handleSort('startDate')}
                                  className="flex items-center gap-1 md:gap-2 hover:text-gray-700 transition-colors"
                                >
                                  Start Date
                                  {sortConfig?.key === 'startDate' ? (
                                    sortConfig.direction === 'asc' ? 
                                      <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-blue-600" /> : 
                                      <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-blue-600 rotate-180" />
                                  ) : (
                                  <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                                  )}
                                </button>
                              </th>
                              <th className="text-left p-2 md:p-4 font-medium text-gray-900">
                                <button 
                                  onClick={() => handleSort('endDate')}
                                  className="flex items-center gap-1 md:gap-2 hover:text-gray-700 transition-colors"
                                >
                                  End Date
                                  {sortConfig?.key === 'endDate' ? (
                                    sortConfig.direction === 'asc' ? 
                                      <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-blue-600" /> : 
                                      <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-blue-600 rotate-180" />
                                  ) : (
                                    <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                                  )}
                                </button>
                              </th>
                              <th className="text-left p-2 md:p-4 font-medium text-gray-900">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedEvents.map((event, index) => (
                              <tr 
                                key={event.id}
                                className="border-b hover:bg-gray-50 cursor-pointer"
                                onClick={(e) => handleEventRowClick(e, event.id)}
                              >
                                <td className="p-2 md:p-4">
                                  <Checkbox
                                    checked={selectedEvents.includes(event.id)}
                                    onCheckedChange={() => handleSelectEvent(event.id)}
                                    className="h-2.5 w-2.5 sm:h-4 sm:w-4"
                                  />
                                </td>
                                <td className="p-2 md:p-4">
                                  <div className="font-medium text-gray-900 truncate" title={event.title}>{event.title}</div>
                                </td>
                                <td className="p-2 md:p-4 text-gray-600 truncate">{event.author || '-'}</td>
                                <td className="p-2 md:p-4 text-gray-600 truncate" title={Array.isArray(event.category) && event.category.length > 0 ? event.category.join(', ') : (typeof event.category === 'string' ? event.category : '-')}>
                                  {Array.isArray(event.category) && event.category.length > 0 
                                    ? event.category.join(', ') 
                                    : (event.category || '-')}
                                </td>
                                <td className="p-2 md:p-4 text-gray-600 truncate" title={event.format || '-'}>{event.format || '-'}</td>
                                <td className="p-2 md:p-4 text-gray-600 truncate" title={event.location || '-'}>{event.location || '-'}</td>
                                <td className="p-2 md:p-4 text-gray-600 truncate" title={event.organizer || '-'}>{event.organizer || '-'}</td>
                                <td className="p-2 md:p-4 text-gray-600 truncate" title={Array.isArray(event.speakers) && event.speakers.length > 0 ? event.speakers.join(', ') : '-'}>
                                  {Array.isArray(event.speakers) && event.speakers.length > 0 
                                    ? event.speakers.join(', ') 
                                    : '-'}
                                </td>
                                <td className="p-2 md:p-4 text-gray-600 truncate">
                                  {formatDateTime(event.date, event.startTime)}
                                </td>
                                <td className="p-2 md:p-4 text-gray-600 truncate">
                                  {formatDateTime(event.date, event.endTime)}
                                </td>
                                <td className="p-2 md:p-4">
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDuplicateEvent(event.id)}
                                      disabled={isDuplicating}
                                      className="text-blue-600 hover:text-blue-700"
                                      title="Duplicate Event"
                                      data-tour="event-data-duplicate-button"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('🔴 Delete button clicked for event:', event.id);
                                        handleDeleteEvent(event.id);
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                      title="Delete Event"
                                      data-tour="event-data-delete-button"
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

                    {/* Pagination Controls */}
                    <div className="border-t border-gray-200 px-1 sm:px-4 py-3 sm:py-4 min-h-[60px] flex items-center justify-center" data-tour="event-data-pagination">
                      {sortedEvents.length > eventsPerPage ? (
                        <div className="flex flex-col items-center gap-2 sm:gap-4">
                          {/* Results Info */}
                          <div className="text-xs sm:text-sm text-gray-600 text-center">
                            Showing {startIndex + 1}-{Math.min(endIndex, sortedEvents.length)} of {sortedEvents.length} event{sortedEvents.length !== 1 ? 's' : ''}
                          </div>

                          {/* Pagination Buttons */}
                          <div className="flex items-center justify-center w-full">
                            {/* Mobile: Compact layout */}
                            <div className="flex sm:hidden items-center justify-center" style={{ gap: '0px', maxWidth: '100%' }}>
                              <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="disabled:opacity-30 disabled:cursor-not-allowed w-[30px] h-[30px] flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-all flex-shrink-0"
                                title="First"
                              >
                                <ChevronsLeft className="h-3 w-3" />
                              </button>

                              <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="disabled:opacity-30 disabled:cursor-not-allowed w-[30px] h-[30px] flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-all flex-shrink-0 ml-1"
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </button>

                              <div className="flex items-center mx-1">
                                <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-300">
                                  {currentPage} / {totalPages}
                                </span>
                              </div>

                              <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="disabled:opacity-30 disabled:cursor-not-allowed w-[30px] h-[30px] flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-all flex-shrink-0 mr-1"
                              >
                                <ChevronRight className="h-3 w-3" />
                              </button>

                              <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="disabled:opacity-30 disabled:cursor-not-allowed w-[30px] h-[30px] flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-all flex-shrink-0"
                                title="Last"
                              >
                                <ChevronsRight className="h-3 w-3" />
                              </button>
                            </div>

                            {/* Desktop: Full layout */}
                            <div className="hidden sm:flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="disabled:opacity-50 disabled:cursor-not-allowed"
                                title="First page"
                              >
                                <ChevronsLeft className="h-4 w-4" />
                                <span className="hidden lg:inline ml-1">First</span>
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="hidden lg:inline ml-1">Prev</span>
                              </Button>

                              <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                  let pageNum;
                                  
                                  if (totalPages <= 5) {
                                    pageNum = i + 1;
                                  } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                  } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                  } else {
                                    pageNum = currentPage - 2 + i;
                                  }

                                  return (
                                    <Button
                                      key={pageNum}
                                      variant={currentPage === pageNum ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => setCurrentPage(pageNum)}
                                      className={`w-9 h-9 p-0 flex-shrink-0 ${
                                        currentPage === pageNum 
                                          ? 'text-white border-0' 
                                          : ''
                                      }`}
                                      style={{
                                        backgroundColor: currentPage === pageNum ? '#ff6b6b' : 'transparent'
                                      }}
                                    >
                                      {pageNum}
                                    </Button>
                                  );
                                })}
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <span className="hidden lg:inline mr-1">Next</span>
                                <ChevronRight className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Last page"
                              >
                                <span className="hidden lg:inline mr-1">Last</span>
                                <ChevronsRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Page Input - Desktop Only */}
                          <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600">
                            <span>Go to page:</span>
                            <input
                              type="number"
                              min="1"
                              max={totalPages}
                              value={currentPage}
                              onChange={(e) => {
                                const page = parseInt(e.target.value);
                                if (page >= 1 && page <= totalPages) {
                                  setCurrentPage(page);
                                }
                              }}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <span>of {totalPages}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 sm:gap-4 w-full">
                          <div className="text-xs sm:text-sm text-gray-600 text-center">
                            All events are displayed on this page
                          </div>
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
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex flex-col gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveSection('all-events');
                          setEditingEventId(null);
                          // Clear URL parameters to go back to clean all-events view
                          router.push('/event-data?tab=all-events');
                        }}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 transition-all duration-200 hover:scale-105 w-fit"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="font-medium">Back to All Events</span>
                      </Button>
                      <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                          {editingEventId ? 'Edit Event' : 'Add Event'}
                        </h1>
                        <p className="text-gray-600 mt-2">
                          {editingEventId ? 'Update your training event' : 'Create a new training event'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={(e) => {
                          e.preventDefault()
                          // Check if we're on the event-data page and if there are query parameters
                          const hasQueryParams = searchParams.toString().length > 0
                          
                          // If we're on event-data page but have query params, or we're on a different page, navigate to clean URL
                          if (pathname !== '/event-data' || hasQueryParams) {
                            // Navigate to clean /event-data URL (without query params) and set flag to start tour
                            sessionStorage.setItem('startEventDataTour', 'true')
                            // Use replace to ensure navigation happens and triggers useEffect
                            router.replace('/event-data')
                            return
                          }

                          // We're on clean /event-data URL and already on all-events tab, start tour immediately
                          const userRole = session?.user?.role || 'meded_team'
                          const eventDataSteps = createCompleteEventDataTour({ 
                            role: userRole as any,
                            onTabSwitch: (tab: string) => {
                              setActiveSection(tab)
                            }
                          })
                          if (startTourWithSteps) {
                            startTourWithSteps(eventDataSteps)
                          }
                        }}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                      >
                        Start Event Data Tour
                      </Button>
                      {editingEventId && (
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
                          <Button 
                            variant="outline" 
                            onClick={() => window.open(`/events/${editingEventId}`, '_blank')}
                            className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 flex-1 sm:flex-none"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Show Event
                          </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-900 flex-1 sm:flex-none"
                        >
                          Cancel
                        </Button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <Button 
                          variant="destructive" 
                          onClick={handleDeleteEventFromEdit}
                            disabled={isDeleting}
                            className="text-white hover:bg-red-700 flex-1 sm:flex-none"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                            {isDeleting ? 'Deleting...' : 'Delete Event'}
                        </Button>
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                </div>

                {/* Booking Management Buttons - Only show if booking is enabled and event exists */}
                {formData.bookingEnabled && editingEventId && (
                  <div className="mb-6">
                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Booking Management
                        </CardTitle>
                        <CardDescription className="text-blue-700">
                          Manage bookings, QR codes, and certificates for this event
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-3">
                          <Button
                            onClick={() => router.push(`/bookings/${editingEventId}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                          >
                            <Users className="h-4 w-4 mr-2" />
                            View Bookings
                          </Button>
                          <Button
                            onClick={() => router.push(`/qr-codes/${editingEventId}`)}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                          >
                            <QrCode className="h-4 w-4 mr-2" />
                            QR Codes
                          </Button>
                          <Button
                            onClick={() => router.push(`/certificates/generate?event=${editingEventId}`)}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                          >
                            <Award className="h-4 w-4 mr-2" />
                            Certificates
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Main Form Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
                  {/* Sidebar Navigation */}
                  <div className="lg:col-span-1 order-1">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Event Details</h3>
                      <nav className="space-y-1">
                        <button
                          data-tour="add-event-basic-information-tab"
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
                          data-tour="add-event-date-time-tab"
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
                          data-tour="add-event-location-tab"
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
                          data-tour="add-event-links-tab"
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
                          data-tour="add-event-organizer-tab"
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
                          data-tour="add-event-speakers-tab"
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
                          data-tour="add-event-booking-tab"
                          onClick={() => setActiveFormSection('booking')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                            activeFormSection === 'booking'
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Booking
                        </button>
                        <button
                          data-tour="add-event-feedback-tab"
                          onClick={() => setActiveFormSection('feedback')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                            activeFormSection === 'feedback'
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Feedback
                        </button>
                        <button
                          data-tour="add-event-attendance-tab"
                          onClick={() => setActiveFormSection('attendance')}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                            activeFormSection === 'attendance'
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Attendance Tracking
                        </button>
                        {formData.bookingEnabled && (
                          <button
                            data-tour="add-event-certificates-tab"
                            onClick={() => setActiveFormSection('certificates')}
                            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                              activeFormSection === 'certificates'
                                ? 'bg-blue-100 text-blue-700 font-medium'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            Certificates
                          </button>
                        )}
                        <button
                          data-tour="add-event-status-tab"
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
                  <div className="lg:col-span-4 order-2">
                    <form onSubmit={handleFormSubmit}>
                      <Card>
                        <CardContent className="p-3 sm:p-4 md:p-6">
                          {/* Basic Information */}
                          {activeFormSection === 'basic' && (
                            <div className="space-y-4 sm:space-y-6">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Label htmlFor="title">Event Title *</Label>
                                  <HelpTooltip content="Enter a clear, descriptive title for your event. This will be displayed prominently on event listings and pages. The title helps students quickly identify and understand what the event is about." />
                                </div>
                                <Input
                                  id="title"
                                  data-tour="add-event-title"
                                  value={formData.title}
                                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                                  placeholder="Enter event title"
                                  required
                                  className="mt-1"
                                />
                              </div>

                              {/* Featured Image Section */}
                              <div data-tour="add-event-featured-image">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="showFeaturedImage"
                                    checked={showFeaturedImage}
                                    onCheckedChange={(checked) => {
                                      setShowFeaturedImage(checked as boolean);
                                      if (!checked) {
                                        // Remove featured image if checkbox is unchecked
                                        if (featuredImagePath) {
                                          handleRemoveFeaturedImage();
                                        }
                                      }
                                    }}
                                    className="h-4 w-4"
                                  />
                                  <Label htmlFor="showFeaturedImage" className="text-sm font-semibold text-gray-700 cursor-pointer">
                                    Add Featured Image
                                  </Label>
                                  <HelpTooltip content="Upload a featured image that will be displayed prominently on the event page. This image helps attract attention and provides visual context for your event." />
                                </div>
                                {showFeaturedImage && (
                                  <div className="space-y-3 mt-3">
                                    {featuredImage ? (
                                      <div className="relative group">
                                        <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                                          <img
                                            src={featuredImage}
                                            alt="Featured"
                                            className="w-full h-full object-cover"
                                          />
                                          <button
                                            type="button"
                                            onClick={handleRemoveFeaturedImage}
                                            className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                                            aria-label="Remove featured image"
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center hover:border-purple-400 transition-colors">
                                        <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-3" />
                                        <Label
                                          htmlFor="featuredImage"
                                          className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-all ${
                                            uploadingFeaturedImage
                                              ? 'bg-gray-400 cursor-not-allowed opacity-60'
                                              : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                                          }`}
                                        >
                                          {uploadingFeaturedImage ? (
                                            <>
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                              Uploading...
                                            </>
                                          ) : (
                                            <>
                                              <Upload className="h-4 w-4" />
                                              Upload Featured Image
                                            </>
                                          )}
                                        </Label>
                                        <input
                                          id="featuredImage"
                                          type="file"
                                          accept="image/*"
                                          onChange={handleFeaturedImageUpload}
                                          disabled={uploadingFeaturedImage}
                                          className="hidden"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">JPG, PNG, GIF or WebP (max 10MB)</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div data-tour="add-event-description">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor="description">Event Description</Label>
                                  <HelpTooltip content="Provide detailed information about the event. Use the rich text editor to format your description with headings, lists, and links. This description appears on the event detail page and helps students understand what they'll learn or experience." />
                                </div>
                                <div className="mt-1">
                                  <TiptapSimpleEditor
                                    value={formData.description}
                                    onChange={(value) => setFormData({...formData, description: value})}
                                    placeholder="Enter event description"
                                    eventId={editingEventId || undefined}
                                    eventSlug={eventSlug}
                                    draftId={!editingEventId ? draftSessionIdRef.current : undefined}
                                    onImageUploaded={handleImageUploaded}
                                    uploadContext="event"
                                  />
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor="category">Category</Label>
                                    <HelpTooltip content="Select one or more categories that best describe your event. Categories help students filter and discover relevant events. Examples: Cardiology, Surgery, Emergency Medicine. Categories also determine who can book the event if booking restrictions are enabled." />
                                  </div>
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
                                <div data-tour="add-event-categories">
                                  <DebugMultiSelect
                                    options={currentCategories.map(cat => ({ value: cat.name, label: cat.name }))}
                                    selected={formData.category}
                                    onChange={handleCategoryChange}
                                    placeholder="Select categories"
                                    className="mt-1"
                                  />
                                </div>
                              </div>

                              <div data-tour="add-event-format">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor="format">Format</Label>
                                  <HelpTooltip content="Select the format or delivery method of your event. Examples: Lecture, Workshop, Seminar, Simulation, Online. Formats help categorize how the event will be conducted and what students can expect." />
                                </div>
                                <Select
                                  value={formData.format}
                                  onValueChange={handleFormatChange}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select format" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {data.formats.map((format) => (
                                      <SelectItem key={format.id} value={format.name}>
                                        {format.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}

                          {/* Date And Time */}
                          {activeFormSection === 'datetime' && (
                            <div className="space-y-4 sm:space-y-6">
                              <h3 className="text-lg font-semibold text-gray-900">Date And Time</h3>
                              
                              {/* Start Date */}
                              <div data-tour="add-event-date-time-inputs">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor="date" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Start Date
                                  </Label>
                                  <HelpTooltip content="Select the date and start time when your event begins. This is required and will be used for event scheduling, calendar displays, and booking deadlines. For multi-day events, this is the first day." />
                                </div>
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
                                <div className="flex items-center gap-2">
                                  <Label htmlFor="endDate" className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    End Date
                                  </Label>
                                  <HelpTooltip content="Select the date and end time when your event concludes. If the event ends on the same day as it starts, use the same date. The end time is used for calendar displays and to determine when the event is complete." />
                                </div>
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
                              <div data-tour="add-event-all-day" className="flex items-center space-x-2">
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
                                  className="h-2.5 w-2.5 sm:h-4 sm:w-4"
                                />
                                <div className="flex items-center gap-2">
                                  <Label htmlFor="isAllDay">All-day Event</Label>
                                  <HelpTooltip content="Enable this if your event runs all day without specific start/end times. When enabled, times are hidden and the event is displayed as an all-day event in calendars. Default times (9 AM - 5 PM) are set automatically but won't be displayed." />
                                </div>
                              </div>

                              {/* Time Options */}
                              <div data-tour="add-event-time-tweaks" className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="hideTime"
                                    checked={formData.hideTime}
                                    onCheckedChange={(checked) => setFormData({...formData, hideTime: !!checked})}
                                    className="h-2.5 w-2.5 sm:h-4 sm:w-4"
                                  />
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor="hideTime">Hide Event Time</Label>
                                    <HelpTooltip content="When enabled, the start time will not be displayed on the public event page. Useful for events where only the date matters or when you want to keep timing details private." />
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="hideEndTime"
                                    checked={formData.hideEndTime}
                                    onCheckedChange={(checked) => setFormData({...formData, hideEndTime: !!checked})}
                                    className="h-2.5 w-2.5 sm:h-4 sm:w-4"
                                  />
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor="hideEndTime">Hide Event End Time</Label>
                                    <HelpTooltip content="When enabled, the end time will not be displayed on the public event page. Only the start time (if visible) will be shown. Useful for events with flexible or approximate end times." />
                                  </div>
                                </div>
                              </div>

                              {/* Time Notes */}
                              <div>
                                <div className="flex items-center gap-2">
                                  <Label htmlFor="timeNotes">Notes on the time</Label>
                                  <HelpTooltip content="Add any additional information about timing that students should know. Examples: 'Registration opens 30 minutes early', 'Coffee break at 11 AM', or 'Flexible start time - arrive when convenient'." />
                                </div>
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
                            <div className="space-y-4 sm:space-y-6">
                              <h3 className="text-lg font-semibold text-gray-900">Location/Venue</h3>

                              <div data-tour="add-event-primary-location">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor="location">Event Main Location</Label>
                                  <HelpTooltip content="Select the primary location where your event will take place. This is the main venue that will be displayed on the event page. If your event has multiple locations, you can add additional locations below." />
                                </div>
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

                              <div data-tour="add-event-other-locations">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor="otherLocations">Other Locations</Label>
                                    <HelpTooltip content="For events that take place at multiple locations (e.g., hospital tours, multi-site workshops), select additional venues here. All selected locations will be displayed on the event page." />
                                  </div>
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
                              
                              <div data-tour="add-event-hide-location" className="flex items-center space-x-2">
                                <Checkbox
                                  id="hideLocation"
                                  checked={formData.hideLocation}
                                  onCheckedChange={(checked) => setFormData({...formData, hideLocation: !!checked})}
                                  className="h-2.5 w-2.5 sm:h-4 sm:w-4"
                                />
                                <div className="flex items-center gap-2">
                                  <Label htmlFor="hideLocation">Hide Location on Event Page</Label>
                                  <HelpTooltip content="When enabled, the location information will not be displayed on the public event page. Useful for online events, events with location TBA, or when location details should be shared separately." />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Event Links */}
                          {activeFormSection === 'links' && (
                            <div className="space-y-4 sm:space-y-6">
                              <h3 className="text-lg font-semibold text-gray-900">Event Links</h3>
                              
                              <div data-tour="add-event-links-inputs">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor="eventLink">Event Link</Label>
                                  <HelpTooltip content="Add a direct link to your event (e.g., Zoom meeting, Teams link, external registration page). This link will be displayed prominently on the event page and can be used for online events or external registration systems." />
                                </div>
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
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor="moreInfoLink">More Info</Label>
                                    <HelpTooltip content="Add a link to additional information about the event (e.g., detailed agenda, reading materials, prerequisites). This link appears on the event page and helps students prepare for the event." />
                                  </div>
                                  <Input
                                    id="moreInfoLink"
                                    type="url"
                                    value={formData.moreInfoLink}
                                    onChange={(e) => setFormData({...formData, moreInfoLink: e.target.value})}
                                    placeholder="eg. http://yoursite.com/your-event"
                                    className="mt-1"
                                  />
                                </div>
                                <div data-tour="add-event-links-open">
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor="moreInfoTarget">More Information</Label>
                                    <HelpTooltip content="Choose whether the 'More Info' link opens in the current browser window or a new tab. Opening in a new tab is recommended so students don't lose their place on the event page." />
                                  </div>
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
                            <div className="space-y-4 sm:space-y-6">
                              <h3 className="text-lg font-semibold text-gray-900">Organizer</h3>

                              <div data-tour="add-event-main-organizer">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor="organizer">Event Main Organizer</Label>
                                  <HelpTooltip content="Select the primary organizer or department responsible for this event. The main organizer is displayed prominently on the event page. You can select 'None' if there is no specific main organizer." />
                                </div>
                                <div className="flex gap-2 mt-1">
                                  <Select 
                                    value={formData.organizer || "__none__"} 
                                    onValueChange={(value) => setFormData({...formData, organizer: value === "__none__" ? '' : value})}
                                  >
                                    <SelectTrigger className="flex-1">
                                      <SelectValue placeholder="Select organizer (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__none__">None (No Main Organizer)</SelectItem>
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
                                      onClick={() => {
                                        console.log('Clearing main organizer');
                                        setFormData({...formData, organizer: ''});
                                      }}
                                      className="px-3"
                                      title="Clear main organizer"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <div data-tour="add-event-other-organizers">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor="otherOrganizers">Other Organizers</Label>
                                    <HelpTooltip content="For events organized by multiple departments or teams, add additional organizers here. All organizers (main and additional) will be displayed on the event page." />
                                  </div>
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
                                <div className="flex items-center gap-2">
                                  <Label htmlFor="addOrganizer">Add New Organizer</Label>
                                  <HelpTooltip content="Add a new organizer to the system. Once added, the organizer will be available for selection in future events. Organizers are saved to the database and can be reused across multiple events." />
                                </div>
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
                              
                              <div data-tour="add-event-hide-organizer" className="flex items-center space-x-2">
                                <Checkbox
                                  id="hideOrganizer"
                                  checked={formData.hideOrganizer}
                                  onCheckedChange={(checked) => setFormData({...formData, hideOrganizer: !!checked})}
                                  className="h-2.5 w-2.5 sm:h-4 sm:w-4"
                                />
                                <div className="flex items-center gap-2">
                                  <Label htmlFor="hideOrganizer">Hide Organizer on Event Page</Label>
                                  <HelpTooltip content="When enabled, organizer information will not be displayed on the public event page. Useful when organizer details should remain private or when the event is organized anonymously." />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Speakers */}
                          {activeFormSection === 'speakers' && (
                            <div className="space-y-4 sm:space-y-6">
                              <h3 className="text-lg font-semibold text-gray-900">Speakers</h3>

                              <div data-tour="add-event-speakers">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor="speakers">Event Speakers</Label>
                                    <HelpTooltip content="Select the speakers or presenters for this event. You can select multiple speakers. Each speaker should have a name and role (e.g., 'Dr. Smith - Consultant Cardiologist'). Speakers are displayed on the event page to help students know who will be presenting." />
                                  </div>
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
                                  <div className="flex items-center gap-2">
                                    <Label>Add New Speaker</Label>
                                    <HelpTooltip content="Add a new speaker to the system. Enter the speaker's name and their role/title. Once added, the speaker will be available for selection in future events. Speakers are saved to the database and can be reused." />
                                  </div>
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
                              
                              <div className="flex items-center space-x-2" data-tour="add-event-hide-speakers">
                                <Checkbox
                                  id="hideSpeakers"
                                  checked={formData.hideSpeakers}
                                  onCheckedChange={(checked) => setFormData({...formData, hideSpeakers: !!checked})}
                                  className="h-2.5 w-2.5 sm:h-4 sm:w-4"
                                />
                                <div className="flex items-center gap-2">
                                  <Label htmlFor="hideSpeakers">Hide Speakers on Event Page</Label>
                                  <HelpTooltip content="When enabled, speaker information will not be displayed on the public event page. Useful when speaker details should remain private or when speakers are to be announced later." />
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Booking Configuration */}
                          {activeFormSection === 'booking' && (
                            <div className="space-y-4 sm:space-y-6">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Event Booking Configuration</h3>
                                <p className="text-sm text-gray-600">Configure registration/booking settings for this event. Booking is disabled by default.</p>
                              </div>

                              {/* Enable Booking Toggle */}
                              <div data-tour="add-event-enable-booking" className="flex items-center space-x-3 p-4 border rounded-lg bg-blue-50 border-blue-200">
                                <input
                                  type="checkbox"
                                  id="bookingEnabled"
                                  checked={formData.bookingEnabled ?? false}
                                  disabled={checkingBookings}
                                  onChange={(e) => {
                                    // Prevent unchecking if there are active bookings
                                    if (!e.target.checked && hasActiveBookings) {
                                      toast.error(
                                        "Cannot disable booking while there are active registrations. " +
                                        "Please cancel all bookings first before disabling booking for this event."
                                      );
                                      return;
                                    }
                                    
                                    const isEnabled = e.target.checked;
                                    setFormData({...formData, bookingEnabled: isEnabled});
                                    
                                    // If booking is disabled and user is on a dependent section, switch to booking
                                    if (!isEnabled && ['feedback', 'attendance', 'certificates'].includes(activeFormSection)) {
                                      setActiveFormSection('booking');
                                      toast.info('Switched to Booking section since dependent features are now disabled.');
                                    }
                                  }}
                                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor="bookingEnabled" className="font-medium text-gray-900 cursor-pointer">
                                      Activate Booking for this Event
                                      {checkingBookings && (
                                        <span className="ml-2 text-xs text-gray-500">(Checking bookings...)</span>
                                      )}
                                    </Label>
                                    <HelpTooltip content="Enable this to allow students to register/book spots for your event. When enabled, students will see a booking button on the event page. Booking also enables features like attendance tracking, feedback collection, and certificate generation. Once students have booked, you cannot disable booking until all bookings are cancelled." />
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    Enable registration/booking functionality for attendees
                                    {hasActiveBookings && (
                                      <span className="block text-red-600 font-medium mt-1">
                                        ⚠️ Cannot disable: Event has active registrations
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              {/* Booking Settings - Only show if booking is enabled */}
                              {formData.bookingEnabled && (
                                <div className="space-y-6 border-t pt-6">
                                  
                                  {/* 1. Basic Booking Settings */}
                                  <div data-tour="add-event-booking-settings" className="space-y-3 p-4 border rounded-lg">
                                    <Label className="font-medium">📋 Basic Booking Settings</Label>
                                    <div className="space-y-4">
                                      {/* Booking Button Label */}
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <Label htmlFor="bookingButtonLabel">Booking Button Label</Label>
                                          <HelpTooltip content="Customize the text displayed on the booking button that students see on the event page. Common options: 'Register', 'Book Now', 'Reserve Spot', 'Sign Up'. Choose text that clearly indicates the action students will take." />
                                        </div>
                                        <Input
                                          id="bookingButtonLabel"
                                          value={formData.bookingButtonLabel || 'Register'}
                                          onChange={(e) => setFormData({...formData, bookingButtonLabel: e.target.value})}
                                          placeholder="e.g., Register, Book Now, Reserve Spot"
                                          className="mt-1"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                          Customize the text shown on the booking button
                                        </p>
                                      </div>

                                      {/* Booking Capacity */}
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <Label htmlFor="bookingCapacity">Event Capacity (Optional)</Label>
                                          <HelpTooltip content="Set the maximum number of students who can book this event. Once capacity is reached, no more bookings will be accepted (unless waitlist is enabled). Leave empty for unlimited capacity - useful for online events or large venues." />
                                        </div>
                                        <Input
                                          id="bookingCapacity"
                                          type="number"
                                          min="1"
                                          value={formData.bookingCapacity || ''}
                                          onChange={(e) => setFormData({...formData, bookingCapacity: e.target.value ? parseInt(e.target.value) : null})}
                                          placeholder="Leave empty for unlimited capacity"
                                          className="mt-1"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                          Maximum number of bookings allowed. Leave empty for unlimited capacity.
                                        </p>
                                      </div>

                                      {/* Booking Deadline */}
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <Label htmlFor="bookingDeadlineHours">Booking Deadline (Hours before event)</Label>
                                          <HelpTooltip content="Set how many hours before the event starts that booking will close. For example, set 24 to stop bookings 24 hours before the event. Set to 0 to allow booking until the event ends. This helps you prepare final attendee lists and manage logistics." />
                                        </div>
                                        <Input
                                          id="bookingDeadlineHours"
                                          type="number"
                                          min="0"
                                          value={formData.bookingDeadlineHours ?? 0}
                                          onChange={(e) => setFormData({...formData, bookingDeadlineHours: isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value)})}
                                          className="mt-1"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                          How many hours before the event should bookings close? Set to 0 to allow booking until the event ends. (Default: 0)
                                        </p>
                                      </div>

                                      {/* Cancellation Deadline */}
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <Label htmlFor="cancellationDeadlineHours">Cancellation Deadline (Hours before event)</Label>
                                          <HelpTooltip content="Prevent students from cancelling their booking within X hours of the event start. This helps prevent last-minute cancellations and ensures accurate attendance planning. Set to 0 to always allow cancellation. See cancellation policy for details." />
                                        </div>
                                        <Input
                                          id="cancellationDeadlineHours"
                                          type="number"
                                          min="0"
                                          value={formData.cancellationDeadlineHours || 0}
                                          onChange={(e) => setFormData({...formData, cancellationDeadlineHours: parseInt(e.target.value) || 0})}
                                          className="mt-1"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                          Users cannot cancel within X hours of event. Set to 0 to always allow cancellation. See <a href="/cancellation-policy" target="_blank" className="text-blue-600 underline">cancellation policy</a> for details.
                                        </p>
                                      </div>

                                      {/* Allow Waitlist */}
                                      <div className="flex items-start space-x-3">
                                        <input
                                          type="checkbox"
                                          id="allowWaitlist"
                                          checked={formData.allowWaitlist ?? true}
                                          onChange={(e) => setFormData({...formData, allowWaitlist: e.target.checked})}
                                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 rounded mt-0.5"
                                        />
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <Label htmlFor="allowWaitlist" className="font-medium text-gray-900 cursor-pointer">
                                              Allow Waitlist
                                            </Label>
                                            <HelpTooltip content="When enabled and capacity is reached, students can join a waitlist. If a booked student cancels, the first person on the waitlist will be automatically notified and can claim the spot. This helps maximize event attendance." />
                                          </div>
                                          <p className="text-sm text-gray-600 mt-1">
                                            When capacity is full, allow users to join a waitlist. They will be notified if spots become available.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 2. Access Control */}
                                  <div data-tour="add-event-who-can-book" className="space-y-3 p-4 border rounded-lg">
                                    <Label className="font-medium">🔒 Who Can Book</Label>
                                    <div className="space-y-4">
                                      {/* Category Restrictions */}
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <Label>Restrict Booking to Specific Categories (Optional)</Label>
                                          <HelpTooltip content="Limit who can book this event based on student categories (e.g., only Foundation Year doctors, only Year 3 students). Categories are auto-populated from your event categories, but you can modify the list. Students not in selected categories won't see the booking button." />
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2">
                                          Auto-populated from your selected categories above. You can modify this list to further restrict booking access.
                                        </p>
                                        <div className="space-y-2 p-4 border rounded-lg bg-gray-50">
                                          {formData.category?.map(category => (
                                            <div key={category} className="flex items-center space-x-2">
                                              <input
                                                type="checkbox"
                                                id={`allowed-category-${category}`}
                                                checked={formData.allowedCategories?.includes(category) || false}
                                                onChange={(e) => {
                                                  const current = formData.allowedCategories || [];
                                                  const updated = e.target.checked
                                                    ? [...current, category]
                                                    : current.filter(c => c !== category);
                                                  setFormData({...formData, allowedCategories: updated});
                                                }}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                                              />
                                              <Label htmlFor={`allowed-category-${category}`} className="cursor-pointer text-sm">
                                                {category}
                                              </Label>
                                            </div>
                                          ))}
                                          {(!formData.category || formData.category.length === 0) && (
                                            <p className="text-sm text-gray-500 italic">
                                              Select categories in the basic information section above to configure booking restrictions.
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      {/* Approval Mode */}
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <Label className="font-medium">Booking Approval Mode</Label>
                                          <HelpTooltip content="Auto-Approve: Bookings are confirmed immediately when students register. Manual Approval: Each booking must be reviewed and approved by an admin or educator before confirmation. Use manual approval for events with limited capacity or when you need to verify eligibility." />
                                        </div>
                                        <div className="space-y-2 mt-2">
                                          <div className="flex items-center space-x-2">
                                            <input
                                              type="radio"
                                              id="auto-approve"
                                              checked={formData.approvalMode === 'auto' || !formData.approvalMode}
                                              onChange={() => setFormData({...formData, approvalMode: 'auto'})}
                                              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                            />
                                            <Label htmlFor="auto-approve" className="cursor-pointer text-sm">
                                              Auto-Approve (Default) - Bookings are confirmed immediately
                                            </Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <input
                                              type="radio"
                                              id="manual-approve"
                                              checked={formData.approvalMode === 'manual'}
                                              onChange={() => setFormData({...formData, approvalMode: 'manual'})}
                                              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                            />
                                            <Label htmlFor="manual-approve" className="cursor-pointer text-sm">
                                              Manual Approval - Admin/Educator must approve each booking
                                            </Label>
                                          </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                          Manual approval requires authorized users to review and approve bookings before they are confirmed.
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 3. User Experience */}
                                  <div data-tour="add-event-confirmation-checkboxes" className="space-y-3 p-4 border rounded-lg">
                                    <Label className="font-medium">✅ User Confirmation</Label>
                                    <div className="space-y-4">
                                      <p className="text-sm text-gray-600">
                                        Configure the checkboxes users must acknowledge when booking
                                      </p>

                                      {/* Checkbox 1 */}
                                      <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                                        <div className="flex items-center justify-between">
                                          <Label className="font-medium">Checkbox 1 (Required)</Label>
                                          <span className="text-xs text-gray-500">Always shown</span>
                                        </div>
                                        <Input
                                          value={formData.confirmationCheckbox1Text || 'I confirm my attendance at this event'}
                                          onChange={(e) => setFormData({...formData, confirmationCheckbox1Text: e.target.value})}
                                          placeholder="I confirm my attendance at this event"
                                        />
                                        <div className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            id="checkbox1Required"
                                            checked={formData.confirmationCheckbox1Required ?? true}
                                            onChange={(e) => setFormData({...formData, confirmationCheckbox1Required: e.target.checked})}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                                          />
                                          <Label htmlFor="checkbox1Required" className="text-sm cursor-pointer">
                                            Required (users must check to book)
                                          </Label>
                                        </div>
                                      </div>

                                      {/* Checkbox 2 (Optional) */}
                                      <div className="space-y-3 p-4 border rounded-lg">
                                        <div className="flex items-center justify-between">
                                          <Label className="font-medium">Checkbox 2 (Optional)</Label>
                                          <span className="text-xs text-gray-500">Only shown if text provided</span>
                                        </div>
                                        <Input
                                          value={formData.confirmationCheckbox2Text || ''}
                                          onChange={(e) => setFormData({...formData, confirmationCheckbox2Text: e.target.value})}
                                          placeholder="e.g., I agree to follow event guidelines"
                                        />
                                        <div className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            id="checkbox2Required"
                                            checked={formData.confirmationCheckbox2Required ?? false}
                                            onChange={(e) => setFormData({...formData, confirmationCheckbox2Required: e.target.checked})}
                                            disabled={!formData.confirmationCheckbox2Text}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded disabled:opacity-50"
                                          />
                                          <Label htmlFor="checkbox2Required" className={`text-sm cursor-pointer ${!formData.confirmationCheckbox2Text ? 'opacity-50' : ''}`}>
                                            Required (users must check to book)
                                          </Label>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                          Leave text empty to hide this checkbox
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                </div>
                              )}

                              {!formData.bookingEnabled && (
                                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                                  <p className="text-gray-600 mb-2">
                                    Booking is currently disabled for this event. Enable it above to configure booking settings.
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Once booking is enabled, you'll also have access to Feedback, Attendance Tracking, and Certificates sections.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          {/* Feedback Configuration */}
                          {activeFormSection === 'feedback' && (
                            <div className="space-y-4 sm:space-y-6">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Feedback Configuration</h3>
                                <p className="text-sm text-gray-600">Configure feedback collection settings for this event. Feedback can be collected from all event attendees, including walk-ins and external participants.</p>
                                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                  <p className="text-sm text-green-700">
                                    💡 <strong>Independent Feature:</strong> Feedback collection works independently of booking - perfect for events with walk-ins or external attendees.
                                  </p>
                                </div>
                              </div>

                              {/* Enable Feedback Section */}
                              <div data-tour="add-event-enable-feedback" className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id="feedbackEnabled"
                                    checked={formData.feedbackEnabled || false}
                                    onChange={(e) => {
                                      const isEnabled = e.target.checked;
                                      const updatedFormData = {...formData, feedbackEnabled: isEnabled};
                                      // Auto-uncheck feedbackRequiredForCertificate if feedback is disabled
                                      if (!isEnabled && updatedFormData.feedbackRequiredForCertificate) {
                                        updatedFormData.feedbackRequiredForCertificate = false;
                                      }
                                      setFormData(updatedFormData);
                                      if (isEnabled) {
                                        toast.success('Feedback enabled! A feedback form will be created automatically.');
                                      }
                                    }}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                                  />
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor="feedbackEnabled" className="font-medium">
                                      Enable Feedback
                                    </Label>
                                    <HelpTooltip content="Enable feedback collection for this event. Feedback works independently of booking - you can collect feedback from all attendees including walk-ins and external participants. A feedback form will be created automatically when you enable this feature." />
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 ml-6">
                                  Collect feedback from students after the event
                                </p>
                                {formData.feedbackEnabled && (
                                  <div className="ml-6 space-y-3">
                                    <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                                      ✅ A feedback form will be created automatically
                                    </div>
                                    
                                    {/* Feedback Form Template Selection */}
                                    <div data-tour="add-event-feedback-template" className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Label htmlFor="feedbackFormTemplate" className="text-sm font-medium">
                                          📝 Feedback Form Template:
                                        </Label>
                                        <HelpTooltip content="Select a feedback form template that will be used for this event. The template defines the questions and format of the feedback form. If no template is selected, a default form will be created automatically when you save the event." />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Select
                                          value={formData.feedbackFormTemplate && formData.feedbackFormTemplate !== 'auto-generate' ? formData.feedbackFormTemplate : ''}
                                          onValueChange={async (value) => {
                                            setFormData({ ...formData, feedbackFormTemplate: value });

                                            if (!formData.feedbackEnabled) {
                                              return;
                                            }

                                            if (!editingEventId) {
                                              // Event not saved yet; creation API will handle template.
                                              return;
                                            }

                                            try {
                                              const selectedTemplate = feedbackTemplates.find(t => t.id === value);
                                              if (selectedTemplate) {
                                                const form_template = selectedTemplate.category || 'custom';
                                                const questions = selectedTemplate.questions || [];
                                                
                                                // Increment usage (best-effort)
                                                try {
                                                  await fetch(`/api/feedback/templates/${selectedTemplate.id}/usage`, { method: 'POST' });
                                                } catch {}

                                                const resp = await fetch('/api/feedback/forms', {
                                                  method: 'POST',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({
                                                    event_ids: [editingEventId],
                                                    form_name: `Feedback for ${formData.title}`,
                                                    form_template,
                                                    questions,
                                                    anonymous_enabled: false,
                                                  }),
                                                });

                                                if (resp.ok) {
                                                  toast.success('Feedback form updated for selected template');
                                                  setFormData(prev => ({ ...prev, feedbackFormCreated: true, feedbackFormTemplate: value }));
                                                } else {
                                                  const text = await resp.text();
                                                  toast.error('Failed to update feedback form');
                                                  console.error('Feedback form update error:', text);
                                                }
                                              } else {
                                                toast.error('Selected template not found');
                                              }
                                            } catch (e) {
                                              console.error(e);
                                              toast.error('Error updating feedback form');
                                            }
                                          }}
                                          disabled={loadingFeedbackTemplates}
                                        >
                                          <SelectTrigger className="w-full">
                                            <SelectValue placeholder={loadingFeedbackTemplates ? "Loading templates..." : "Select feedback template"} />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {loadingFeedbackTemplates ? (
                                              <SelectItem value="loading" disabled>
                                                <div className="flex flex-col">
                                                  <span className="font-medium">Loading templates...</span>
                                                  <span className="text-xs text-gray-500">Please wait</span>
                                                </div>
                                              </SelectItem>
                                            ) : feedbackTemplates.length === 0 ? (
                                              <SelectItem value="no-templates" disabled>
                                                <div className="flex flex-col">
                                                  <span className="font-medium">No templates available</span>
                                                  <span className="text-xs text-gray-500">Create templates first</span>
                                                </div>
                                              </SelectItem>
                                            ) : (
                                              feedbackTemplates.map((template) => (
                                                <SelectItem key={template.id} value={template.id}>
                                                  <div className="flex flex-col">
                                                    <span className="font-medium">{template.name}</span>
                                                    <span className="text-xs text-gray-500">{template.description || `${template.question_count} questions • ${template.category}`}</span>
                                                  </div>
                                                </SelectItem>
                                              ))
                                            )}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <p className="text-xs text-gray-500">
                                        Choose a feedback form template for this event. If no template is selected, a default form will be created automatically.
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Attendance Tracking Configuration */}
                          {activeFormSection === 'attendance' && (
                            <div className="space-y-4 sm:space-y-6">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Attendance Tracking Configuration</h3>
                                <p className="text-sm text-gray-600">Configure QR code attendance tracking for this event. Track attendance for all event participants, including walk-ins and external attendees.</p>
                                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                  <p className="text-sm text-green-700">
                                    💡 <strong>Independent Feature:</strong> Attendance tracking works independently of booking - perfect for events with walk-ins or external attendees.
                                  </p>
                                </div>
                              </div>

                              {/* QR Code Attendance Tracking Section */}
                              <div data-tour="add-event-enable-attendance" className="space-y-3">
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          id="qrAttendanceEnabled"
                                          checked={formData.qrAttendanceEnabled || false}
                                    onChange={(e) => {
                                      const isEnabled = e.target.checked;
                                      setFormData({...formData, qrAttendanceEnabled: isEnabled});
                                      if (isEnabled) {
                                        toast.success('QR attendance enabled! QR codes will be generated for attendance tracking.');
                                      }
                                    }}
                                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                                        />
                                        <div className="flex items-center gap-2">
                                          <Label htmlFor="qrAttendanceEnabled" className="font-medium">
                                            Enable QR Code Attendance Tracking
                                          </Label>
                                          <HelpTooltip content="Enable QR code-based attendance tracking for this event. QR codes will be generated automatically and can be scanned by students to mark their attendance. This works independently of booking - you can track attendance for all attendees including walk-ins. Attendance is automatically monitored by MedEd Team and Administrators." />
                                        </div>
                                      </div>
                                      <p className="text-xs text-gray-500 ml-6">
                                  Allow students to scan QR codes to mark attendance
                                </p>
                                {formData.qrAttendanceEnabled && (
                                  <div className="ml-6 space-y-3">
                                    <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                                      ✅ QR codes will be generated for attendance tracking
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Certificate Configuration */}
                          {activeFormSection === 'certificates' && (
                            <div className="space-y-4 sm:space-y-6">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Certificate Configuration</h3>
                                <p className="text-sm text-gray-600">Configure automatic certificate generation for this event.</p>
                                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <p className="text-sm text-blue-700">
                                    💡 <strong>Note:</strong> Certificate generation is available because booking is enabled for this event.
                                  </p>
                                </div>
                              </div>

                                      {/* Certificate Generation */}
                                      <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                                        <Label className="font-medium">Certificate Generation</Label>
                                        
                                {/* Auto-generate Certificate */}
                                <div data-tour="add-event-enable-certificates" className="space-y-3">
                                          <div className="flex items-center space-x-2">
                                            <input
                                              type="checkbox"
                                              id="autoGenerateCertificate"
                                              checked={formData.autoGenerateCertificate || false}
                                              onChange={(e) => {
                                        const isEnabled = e.target.checked;
                                        setFormData({...formData, autoGenerateCertificate: isEnabled});
                                        if (isEnabled) {
                                          toast.success('Auto-certificate generation enabled!');
                                        }
                                              }}
                                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                                            />
                                    <div className="flex items-center gap-2">
                                      <Label htmlFor="autoGenerateCertificate" className="font-medium">
                                        Auto-generate Certificate
                                      </Label>
                                      <HelpTooltip content="Automatically generate certificates for attendees after the event. Certificates will be created using the selected template and can be automatically emailed to attendees. This feature requires booking to be enabled. You can also require feedback completion before certificate generation." />
                                    </div>
                                          </div>
                                          <p className="text-xs text-gray-500 ml-6">
                                    Automatically generate certificates after event completion
                                          </p>

                                          {formData.autoGenerateCertificate && (
                                    <div className="ml-6 space-y-3">
                                      <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                                        ✅ Certificates will be generated automatically
                                      </div>
                                      
                                      {/* Certificate Template Selection */}
                                      <div data-tour="add-event-certificate-template" className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Label htmlFor="certificateTemplateId" className="text-sm font-medium">
                                            📜 Certificate Template:
                                          </Label>
                                          <HelpTooltip content="Select a certificate template that will be used to generate certificates for attendees. The template defines the design, layout, and information displayed on the certificate. You can manage templates in the Certificates section." />
                                        </div>
                                        <div className="flex items-center gap-2">
                                                <Select
                                            value={formData.certificateTemplateId || ''}
                                            onValueChange={(value) => setFormData({...formData, certificateTemplateId: value})}
                                            disabled={loadingTemplates}
                                          >
                                            <SelectTrigger className="w-full">
                                              <SelectValue placeholder={loadingTemplates ? "Loading templates..." : "Select certificate template"} />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                              {certificateTemplates.map((template) => (
                                                        <SelectItem key={template.id} value={template.id}>
                                                  <div className="flex flex-col">
                                                    <span className="font-medium">{template.name}</span>
                                                    <span className="text-xs text-gray-500">{template.description}</span>
                                                  </div>
                                                        </SelectItem>
                                              ))}
                                                  </SelectContent>
                                                </Select>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                                  Choose a certificate template for auto-generation. 
                                                </p>
                                              </div>

                                      {/* Auto-send Email */}
                                      <div className="space-y-2">
                                              <div data-tour="add-event-auto-send-certificates" className="flex items-center space-x-2">
                                                <input
                                                  type="checkbox"
                                            id="certificateAutoSendEmail"
                                            checked={formData.certificateAutoSendEmail ?? true}
                                            onChange={(e) => setFormData({...formData, certificateAutoSendEmail: e.target.checked})}
                                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                                                />
                                          <div className="flex items-center gap-2">
                                            <Label htmlFor="certificateAutoSendEmail" className="font-medium">
                                              Auto-send Certificate via Email
                                            </Label>
                                            <HelpTooltip content="When enabled, certificates will be automatically emailed to attendees once they are generated. If disabled, certificates will be generated but you'll need to manually send them or attendees can download them from their portfolio." />
                                          </div>
                                              </div>
                                        <p className="text-xs text-gray-500 ml-6">
                                          Automatically email certificates to attendees
                                                  </p>
                                                </div>

                                      {/* Generate after feedback completion */}
                                      <div className="space-y-2">
                                              <div data-tour="add-event-certificates-after-feedback" className="flex items-center space-x-2">
                                                <input
                                                  type="checkbox"
                                            id="feedbackRequiredForCertificate"
                                            checked={formData.feedbackRequiredForCertificate ?? false}
                                            onChange={(e) => setFormData({...formData, feedbackRequiredForCertificate: e.target.checked})}
                                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                                                />
                                          <div className="flex items-center gap-2">
                                            <Label htmlFor="feedbackRequiredForCertificate" className="font-medium">
                                              Generate after feedback completion
                                            </Label>
                                            <HelpTooltip content="When enabled, certificates will only be generated after attendees complete the feedback form. This ensures you receive feedback before issuing certificates. Requires feedback to be enabled and a feedback template to be selected. You can also set a deadline for feedback submission." />
                                          </div>
                                        </div>
                                        <p data-tour="add-event-certificates-after-feedback-explanation" className="text-xs text-gray-500 ml-6">
                                          Only generate certificates after attendees complete feedback
                                        </p>
                                        
                                        {/* Validation warnings when checkbox is checked */}
                                        {formData.feedbackRequiredForCertificate && (
                                          <div className="ml-6 mt-2 space-y-2">
                                            {!formData.feedbackEnabled && (
                                              <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                                ⚠️ <strong>Required:</strong> Please enable feedback in Feedback Configuration section
                                              </div>
                                            )}
                                            {/* Empty template defaults to auto-generate, so no warning needed */}
                                          </div>
                                        )}
                                        
                                        {/* Feedback Deadline - only show when feedback is required for certificate */}
                                        {formData.feedbackRequiredForCertificate && (
                                          <div className="ml-6 mt-3 space-y-2">
                                            <div className="flex items-center gap-2">
                                              <Label htmlFor="feedbackDeadlineDays" className="text-sm font-medium">
                                                Feedback Deadline (days) <span className="text-gray-500 font-normal">(optional)</span>:
                                              </Label>
                                              <HelpTooltip content="Set a deadline (in days after the event) for when feedback must be completed before certificates are generated. For example, set 7 to require feedback within 7 days. If left empty, certificates will be generated regardless of when feedback is submitted (indefinite deadline)." />
                                            </div>
                                            <Input
                                              id="feedbackDeadlineDays"
                                              type="number"
                                              min="1"
                                              max="365"
                                              value={formData.feedbackDeadlineDays || ''}
                                              onChange={(e) => {
                                                const value = e.target.value ? parseInt(e.target.value, 10) : null;
                                                setFormData({...formData, feedbackDeadlineDays: value});
                                              }}
                                              placeholder="Leave empty for indefinite"
                                              className="w-56"
                                            />
                                            <p className="text-xs text-gray-500">
                                              Optional: Number of days after the event that feedback must be completed. If left empty, certificates will be generated regardless of when feedback is submitted (indefinite deadline).
                                            </p>
                                          </div>
                                        )}
                                              </div>
                                            </div>
                                          )}
                                    </div>
                                  </div>
                            </div>
                          )}

                          {/* Event Status */}
                          {activeFormSection === 'status' && (
                            <div className="space-y-4 sm:space-y-6">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-gray-900">Event Status</h3>
                                <HelpTooltip content="Set the current status of your event. The status determines how the event is displayed to students and affects booking availability. Use 'Scheduled' for active events, 'Rescheduled' or 'Postponed' for delayed events, 'Cancelled' for cancelled events, and 'Moved Online' for events that have transitioned to online format." />
                              </div>
                              
                              <div data-tour="add-event-status-options" className="space-y-4">
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
                                    <div className="flex items-center gap-2">
                                      <Label className="font-medium text-gray-900 cursor-pointer">Scheduled</Label>
                                      <HelpTooltip content="Use this status for active, upcoming events that are proceeding as planned. Scheduled events are visible to students and available for booking (if booking is enabled). This is the default status for new events." />
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">For active events!</p>
                                  </div>
                                </div>

                                {/* Rescheduled */}
                                <div>
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
                                      <div className="flex items-center gap-2">
                                        <Label className="font-medium text-gray-900 cursor-pointer">Rescheduled</Label>
                                        <HelpTooltip content="Use this status when an event has been moved to a new date. You can optionally specify the rescheduled date, which will be displayed to students. Rescheduled events remain visible but indicate the date change." />
                                      </div>
                                      <p className="text-sm text-gray-600 mt-1">For rescheduled events!</p>
                                    </div>
                                  </div>

                                  {/* Rescheduled Date Picker */}
                                  {formData.eventStatus === 'rescheduled' && (
                                    <div className="ml-6 mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <Label htmlFor="rescheduledDate" className="text-sm font-medium text-gray-700 mb-2 block">
                                          Rescheduled Date (Optional)
                                        </Label>
                                        <HelpTooltip content="Enter the new date for the rescheduled event. If provided, this date will be displayed on the event page and in announcements as 'Postponed to [date]'. This helps students know when the event will now take place." />
                                      </div>
                                      <Input
                                        id="rescheduledDate"
                                        type="date"
                                        value={formData.rescheduledDate || ''}
                                        onChange={(e) => setFormData({...formData, rescheduledDate: e.target.value || null})}
                                        className="w-full md:w-[10%]"
                                      />
                                      <p className="text-xs text-gray-500 mt-2">
                                        If selected, this date will be shown as "Postponed to [date]" on the event page and in announcements.
                                      </p>
                                    </div>
                                  )}
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
                                    <div className="flex items-center gap-2">
                                      <Label className="font-medium text-gray-900 cursor-pointer">Postponed</Label>
                                      <HelpTooltip content="Use this status when an event has been postponed to an indefinite future date. Postponed events remain visible but indicate that the original date is no longer valid. Unlike 'Rescheduled', postponed events don't have a specific new date set." />
                                    </div>
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
                                    <div className="flex items-center gap-2">
                                      <Label className="font-medium text-gray-900 cursor-pointer">Cancelled</Label>
                                      <HelpTooltip content="Use this status when an event has been cancelled and will not take place. Cancelled events are still visible but clearly marked as cancelled. Students who have booked will be notified, and no new bookings will be accepted." />
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">If you cancelled an event then you should select this status!</p>
                                  </div>
                                </div>

                                {/* Moved Online */}
                                <div>
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
                                      <div className="flex items-center gap-2">
                                        <Label className="font-medium text-gray-900 cursor-pointer">Moved Online</Label>
                                        <HelpTooltip content="Use this status when an event that was originally planned as in-person has been moved to an online format. You can provide an online event link (Zoom, Teams, etc.) that will be displayed to students. The event remains active and available for booking." />
                                      </div>
                                      <p className="text-sm text-gray-600 mt-1">For the events that moved online!</p>
                                    </div>
                                  </div>

                                  {/* Moved Online Link Input */}
                                  {formData.eventStatus === 'moved-online' && (
                                    <div className="ml-6 mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <Label htmlFor="movedOnlineLink" className="text-sm font-medium text-gray-700 mb-2 block">
                                          Online Event Link (Optional)
                                        </Label>
                                        <HelpTooltip content="Enter the link for the online event (e.g., Zoom meeting URL, Microsoft Teams link, Google Meet link). This link will be displayed prominently on the event page so students can easily join the online event. Make sure the link is accessible to all registered attendees." />
                                      </div>
                                      <Input
                                        id="movedOnlineLink"
                                        type="url"
                                        placeholder="https://example.com/meeting"
                                        value={formData.movedOnlineLink || ''}
                                        onChange={(e) => setFormData({...formData, movedOnlineLink: e.target.value || null})}
                                        className="w-full"
                                      />
                                      <p className="text-xs text-gray-500 mt-2">
                                        The link to join the online event. This will be included in the announcement.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      {/* Form Actions - Responsive */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
                        <Button 
                          type="submit"
                            className={`${updateSuccess ? 'bg-green-600 hover:bg-green-700' : ''} flex-1 sm:flex-none`}
                          disabled={saving}
                        >
                          {saving ? 'Saving...' : updateSuccess ? '✓ Updated Successfully!' : editingEventId ? 'Update Event' : 'Add Event'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={resetForm}
                            className="flex-1 sm:flex-none"
                        >
                          {editingEventId ? 'Clear Form' : 'Reset Form'}
                        </Button>
                          {editingEventId && (
                            <Button 
                              type="button" 
                              variant="secondary"
                              onClick={() => {
                                setEditingEventId(null);
                                resetForm();
                                setActiveSection('add-event');
                                router.push('/event-data?tab=add-event&source=dashboard');
                                toast.success('Form cleared - ready for new event');
                              }}
                              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 flex-1 sm:flex-none"
                            >
                              Add Another Event
                            </Button>
                          )}
                        {!editingEventId && (
                          <Button 
                            type="button" 
                            variant="secondary"
                            onClick={() => {
                              resetForm();
                              toast.success('Form cleared - ready for new event');
                            }}
                              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 flex-1 sm:flex-none"
                          >
                            Add Another Event
                          </Button>
                        )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setActiveSection('all-events')}
                            className="flex-1 sm:flex-none"
                        >
                          View All Events
                        </Button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </>
            ) : activeSection === 'bulk-upload' ? (
              /* Smart Bulk Upload - Redirect to dedicated page */
              <>
                <div className="max-w-2xl mx-auto text-center py-12">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 mb-6">
                    <Settings className="h-16 w-16 mx-auto mb-4 text-purple-600" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Smart Bulk Upload</h2>
                    <p className="text-gray-600 mb-6">
                      Upload Excel, PDF, or Word documents and let AI automatically extract event information.
                    </p>
                    <Button 
                      onClick={() => router.push('/bulk-upload-ai')} 
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      size="lg"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Go to Smart Bulk Upload
                    </Button>
                  </div>
                  <Card className="text-left">
                    <CardHeader>
                      <CardTitle>Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>AI automatically extracts event titles, dates, and times</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>Matches existing locations and speakers from your database</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>Email detection with privacy warnings</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>Review and edit all information before saving</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>Supports Excel (.xlsx, .xls), PDF, and Word (.docx, .doc)</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
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
                  <Card data-tour="event-data-add-category">
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
                  <Card data-tour="event-data-categories-list">
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
                                className="h-2.5 w-2.5 sm:h-4 sm:w-4"
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
                                    className="h-2.5 w-2.5 sm:h-4 sm:w-4"
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
                      <Card className="mb-6" data-tour="event-data-add-speaker">
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
                        <Card data-tour="event-data-add-format">
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
                        
                        <Card data-tour="event-data-formats-list">
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
                                      className="h-2.5 w-2.5 sm:h-4 sm:w-4"
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
                                          className="h-2.5 w-2.5 sm:h-4 sm:w-4"
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
                        <Card className="mb-6" data-tour="event-data-add-location">
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
                      <Card className="mb-6" data-tour={activeSection === 'organizers' ? 'event-data-add-organizer' : undefined}>
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
                  <Card data-tour={activeSection === 'locations' ? 'event-data-locations-list' : 
                                   activeSection === 'organizers' ? 'event-data-organizers-list' : undefined}>
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
                                    {editingItem?.type === activeSection && editingItem?.index === index ? (
                                      <>
                                        <div className="col-span-2">
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
                                            className="w-full"
                                            autoFocus
                                          />
                                        </div>
                                        <div className="flex items-center gap-2">
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
                                      </>
                                    ) : (
                                      <>
                                        <div className="text-sm font-medium">{organizer}</div>
                                        <div>
                                          <div className={`text-xs font-semibold px-2 py-1 rounded-full inline-block ${
                                            events.filter(event => 
                                              event.organizer === organizer ||
                                              (event.allOrganizers && event.allOrganizers.includes(organizer))
                                            ).length > 0 
                                              ? 'bg-blue-100 text-blue-600' 
                                              : 'bg-gray-100 text-gray-500'
                                          }`}>
                                            {events.filter(event => 
                                              event.organizer === organizer ||
                                              (event.allOrganizers && event.allOrganizers.includes(organizer))
                                            ).length}
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
                                      </>
                                    )}
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
                  <Card data-tour="event-data-speakers-list">
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
                        {selectedSpeakers.length > 0 && (
                          <Button 
                            variant="destructive"
                            onClick={handleBulkDeleteSpeakers}
                            className="w-full sm:w-auto"
                          >
                            Delete Selected ({selectedSpeakers.length})
                          </Button>
                        )}
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
                          <div className="grid grid-cols-6 gap-4 p-3 bg-gray-50 rounded-lg font-medium text-sm">
                            <div className="flex items-center gap-2">
                              <Checkbox 
                                checked={selectedSpeakers.length === data.speakers.length && data.speakers.length > 0}
                                onCheckedChange={handleSelectAllSpeakers}
                                className="h-2.5 w-2.5 sm:h-4 sm:w-4"
                              />
                              <span>Select All</span>
                            </div>
                            <div>Name</div>
                            <div>Role</div>
                            <div>Count</div>
                            <div className="col-span-2">Actions</div>
                          </div>
                          {data.speakers.map((speaker) => (
                            <div key={speaker.id} className="grid grid-cols-6 gap-4 p-3 border rounded-lg hover:bg-gray-50">
                              {editingSpeaker?.id === speaker.id ? (
                                // Edit mode for speaker
                                <div className="col-span-6 space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="editSpeakerName">Name</Label>
                                      <Input
                                        id="editSpeakerName"
                                        value={editingSpeaker?.name || ''}
                                        onChange={(e) => editingSpeaker && setEditingSpeaker({...editingSpeaker, name: e.target.value})}
                                        className="mt-1"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="editSpeakerRole">Role</Label>
                                      <Input
                                        id="editSpeakerRole"
                                        value={editingSpeaker?.role || ''}
                                        onChange={(e) => editingSpeaker && setEditingSpeaker({...editingSpeaker, role: e.target.value})}
                                        className="mt-1"
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <Button onClick={handleUpdateSpeaker} size="sm">
                                      Save Changes
                                    </Button>
                                    <Button 
                                      onClick={() => setEditingSpeaker(null)} 
                                      variant="outline" 
                                      size="sm"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                // Normal view
                                <>
                                  <div className="flex items-center gap-2">
                                    <Checkbox 
                                      checked={selectedSpeakers.includes(speaker.id)}
                                      onCheckedChange={() => handleSelectSpeaker(speaker.id)}
                                      className="h-2.5 w-2.5 sm:h-4 sm:w-4"
                                    />
                                  </div>
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
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setEditingSpeaker({
                                          id: speaker.id,
                                          name: speaker.name,
                                          role: speaker.role
                                        });
                                      }}
                                      className="text-blue-600 hover:text-blue-700"
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
                                        setDeleteTarget(speaker.id);
                                        setShowDeleteSpeakerDialog(true);
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </>
                              )}
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

      {/* Speaker Delete Confirmation Dialog */}
      {showSpeakerDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Speakers</h3>
            <p className="text-gray-600 mb-4">
              You are about to delete {selectedSpeakers.length} speaker{selectedSpeakers.length === 1 ? '' : 's'}. Are you sure?
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={cancelDeleteSpeakers}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteSpeakers}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* New Confirmation Dialogs */}
      <DeleteEventDialog
        open={showDeleteEventDialog}
        onOpenChange={(open) => {
          console.log('🔍 DeleteEventDialog onOpenChange called with:', open);
          console.log('🔍 Current showBulkDeleteDialog when DeleteEventDialog changes:', showBulkDeleteDialog);
          setShowDeleteEventDialog(open);
        }}
        onConfirm={confirmDeleteEvent}
        isLoading={isDeleting}
        title="Delete Event"
        description={`Are you sure you want to delete this event? This action cannot be undone and will remove all associated data.`}
      />

      {/* Bookings Warning Dialog */}
      <Dialog open={showBookingsWarningDialog} onOpenChange={setShowBookingsWarningDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-orange-100">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Cannot Delete Event
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-base leading-relaxed">
              This event has existing bookings that must be cancelled and deleted before the event can be removed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-2">To delete {bulkDeleteTargets.length > 1 ? 'these events' : 'this event'}, you need to:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>{bulkDeleteTargets.length > 1 ? 'Go to the Bookings page for these events' : 'Go to the Bookings page for this event'}</li>
                  <li>Cancel all existing bookings</li>
                  <li>Delete the cancelled bookings</li>
                  <li>Then return to delete the event</li>
                </ol>
              </div>
            </div>
          </div>

          {bulkBookingEvents.length > 0 && (
            <div className="bg-white border border-orange-200 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-orange-900 mb-2">Events with active bookings:</p>
              <ul className="text-sm text-orange-800 space-y-1 list-disc list-inside">
                {bulkBookingEvents.map((event) => (
                  <li key={event.id}>
                    {event.title}
                    <span className="text-orange-600 text-xs ml-1">(ID: {event.id})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowBookingsWarningDialog(false);
                setDeleteTarget(null);
                setBulkDeleteTargets([]);
                setBulkBookingEvents([]);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (bulkDeleteTargets.length > 1) {
                  setShowBookingsWarningDialog(false);
                  setDeleteTarget(null);
                  setBulkBookingEvents([]);
                  setBulkDeleteTargets([]);
                  router.push('/bookings');
                  return;
                }
                const targetId = deleteTarget ?? bulkDeleteTargets[0] ?? null;
                if (targetId) {
                  router.push(`/bookings/${targetId}`);
                }
                setShowBookingsWarningDialog(false);
                setDeleteTarget(null);
                setBulkBookingEvents([]);
                setBulkDeleteTargets([]);
              }}
              className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
              disabled={!deleteTarget && bulkDeleteTargets.length === 0}
            >
              {bulkDeleteTargets.length > 1 ? 'Go to Bookings' : 'Go to Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={showDeleteCategoryDialog}
        onOpenChange={setShowDeleteCategoryDialog}
        onConfirm={confirmDeleteCategory}
        isLoading={isDeleting}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone and may affect events using this category."
        confirmText="Delete Category"
      />

      <ConfirmationDialog
        open={showDeleteFormatDialog}
        onOpenChange={setShowDeleteFormatDialog}
        onConfirm={confirmDeleteFormat}
        isLoading={isDeleting}
        title="Delete Format"
        description="Are you sure you want to delete this format? This action cannot be undone and may affect events using this format."
        confirmText="Delete Format"
      />

      <ConfirmationDialog
        open={showDeleteSpeakerDialog}
        onOpenChange={setShowDeleteSpeakerDialog}
        onConfirm={confirmDeleteSpeaker}
        isLoading={isDeleting}
        title="Delete Speaker"
        description="Are you sure you want to delete this speaker? This action cannot be undone and may affect events using this speaker."
        confirmText="Delete Speaker"
      />
      <BulkDeleteDialog
        open={showBulkDeleteDialog && selectedEvents.length > 0 && !showDeleteEventDialog}
        onOpenChange={(open) => {
          console.log('🔍 BulkDeleteDialog onOpenChange called with:', open);
          console.log('🔍 Current showDeleteEventDialog when BulkDeleteDialog changes:', showDeleteEventDialog);
          setShowBulkDeleteDialog(open);
        }}
        onConfirm={confirmBulkDelete}
        isLoading={isDeleting}
        count={selectedEvents.length}
      />
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