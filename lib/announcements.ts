import {
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  Calendar,
  Sparkles,
  Zap,
  Shield,
  Search,
  Upload,
  Ticket
} from 'lucide-react'

export interface BleepyAnnouncement {
  id: string
  title: string
  content: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  author_name: string
  created_at: string
  feature_icon: any
}

// Static announcements data - based on actual features implemented (sorted by date, most recent first)
export const BLEEPY_ANNOUNCEMENTS: BleepyAnnouncement[] = [
  {
    id: '2025-11-08-privacy',
    title: 'Profiles, Avatars & MedEd Role Refresh',
    content: `• Public/private profile toggle with dashboard sidebar parity
• Avatar library now saves on confirm and clears old Supabase uploads
• MedEd Team onboarding skips extra fields and notifies admins automatically`,
    priority: 'high',
    author_name: 'Bleepy Team',
    created_at: '2025-11-08',
    feature_icon: Sparkles
  },
  {
    id: '2025-11-08-analytics',
    title: 'Homepage & Analytics Metrics Update',
    content: `• Cohort cards now pull live Supabase counts for ARU, UCL and FY doctors
• Active students calculated on a rolling 30-day window across the platform
• Legal pages updated for avatar storage, GDPR commitments and zero retention`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-11-08',
    feature_icon: Info
  },
  {
    id: '2025-11-07-hume',
    title: 'Hume EVI Zero Data Retention Safeguards',
    content: `• Disabled remote chat storage with chatHistory=false on every connection
• Saved transcripts directly into Supabase attempts with local-only retention
• Policy copy refreshed to highlight zero data retention across the platform`,
    priority: 'high',
    author_name: 'Bleepy Team',
    created_at: '2025-11-07',
    feature_icon: Shield
  },
  {
    id: '2025-11-06-placements',
    title: 'Placements Gallery Mobile Experience',
    content: `• Rebuilt lightbox overlay to stay centered on all devices
• Added graceful error/retry handling for image loads
• Locked page scrolling while the gallery is open for stable UX`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-11-06',
    feature_icon: Zap
  },
  {
    id: '2025-10-23-certificates',
    title: 'Professional Certificate Workflow Release',
    content: `• Drag-and-drop template builder with precise scaling and alignment
• Bulk certificate generation with secure Supabase storage
• Role-based access so educators and admins govern distribution`,
    priority: 'urgent',
    author_name: 'Bleepy Team',
    created_at: '2025-10-23',
    feature_icon: Sparkles
  },
  {
    id: '2025-10-17-bookings',
    title: 'Event Bookings & Safeguards Launch',
    content: `• Full booking lifecycle with capacity, waitlists and attendee tracking
• Manual approval and cancellation windows to protect high-demand events
• Publish guards stop schedule changes once bookings or QR scans exist`,
    priority: 'high',
    author_name: 'Bleepy Team',
    created_at: '2025-10-17',
    feature_icon: Ticket
  },
  {
    id: '2025-10-11-bulk-upload',
    title: 'AI-Powered Bulk Event Import',
    content: `• Excel uploads auto-extract dates, times and event metadata with AI assist
• Inline review lets admins tidy duplicates before publishing
• Multi-select categories and organisers streamline large onboarding batches`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-10-11',
    feature_icon: Upload
  }
]

/**
 * Get the latest announcements sorted by date (most recent first)
 * @param limit - Number of announcements to return (default: 2)
 * @returns Array of latest announcements
 */
export function getLatestAnnouncements(limit: number = 2): BleepyAnnouncement[] {
  // Sort by created_at date in descending order (most recent first)
  const sortedAnnouncements = [...BLEEPY_ANNOUNCEMENTS].sort((a, b) => {
    const dateA = new Date(a.created_at)
    const dateB = new Date(b.created_at)
    return dateB.getTime() - dateA.getTime()
  })

  // Return the latest announcements up to the limit
  return sortedAnnouncements.slice(0, limit)
}

/**
 * Get all announcements sorted by date (most recent first)
 * @returns Array of all announcements
 */
export function getAllAnnouncements(): BleepyAnnouncement[] {
  return [...BLEEPY_ANNOUNCEMENTS].sort((a, b) => {
    const dateA = new Date(a.created_at)
    const dateB = new Date(b.created_at)
    return dateB.getTime() - dateA.getTime()
  })
}
