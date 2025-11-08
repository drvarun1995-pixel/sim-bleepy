import {
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  Calendar,
  Sparkles,
  Zap,
  Shield,
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
    id: '2025-11-08-profiles',
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
  },
  {
    id: '2025-10-05-onboarding',
    title: 'Personalised Onboarding & Dashboards',
    content: `• Multi-step onboarding captures role, university, interests and availability
• Dashboard widgets filter events by cohort and surface tailored recommendations
• Profile completion reminders keep student data accurate and actionable`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-10-05',
    feature_icon: Bell
  },
  {
    id: '2025-10-04-admin-reflow',
    title: 'Admin Workspace & Responsive Dashboard',
    content: `• Collapsible dashboard sidebar with role-aware navigation
• Admin event tools grouped for quick access from the dashboard hub
• Hydration fixes and pagination upgrades stabilise large tables`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-10-04',
    feature_icon: Info
  },
  {
    id: '2025-10-01-events',
    title: 'Events & Calendar Management System',
    content: `• Comprehensive event creation with speakers, organisers, categories and locations
• Calendar, list and detail pages wired to Supabase with live filters
• Bulk import enriched with Google Places data and timezone-aware scheduling`,
    priority: 'high',
    author_name: 'Bleepy Team',
    created_at: '2025-10-01',
    feature_icon: Calendar
  },
  {
    id: '2025-09-27-compliance',
    title: 'GDPR, Governance & Gamification',
    content: `• Implemented GDPR tooling: data exports, consent capture and admin oversight
• Launched XP, achievements and leaderboards to motivate clinical practice
• Hardened admin authentication, audit logs and role management workflows`,
    priority: 'high',
    author_name: 'Bleepy Team',
    created_at: '2025-09-27',
    feature_icon: Shield
  },
  {
    id: '2025-09-23-analytics',
    title: 'Admin Analytics & Monitoring Overhaul',
    content: `• Delivered live admin dashboards with cohort, usage and performance charts
• Added simulator analytics, cost telemetry and troubleshooting endpoints
• Tightened NextAuth, service-role APIs and the platform’s observability stack`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-09-23',
    feature_icon: AlertCircle
  },
  {
    id: '2025-09-14-launch',
    title: 'Bleepy OSCE Simulator Launch',
    content: `• Core OSCE stations powered by Hume EVI with medical-grade chat styling
• Secure authentication via NextAuth with email flows ready for production
• Analytics, transcripts and session logging established as platform foundations`,
    priority: 'urgent',
    author_name: 'Bleepy Team',
    created_at: '2025-09-14',
    feature_icon: Sparkles
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
