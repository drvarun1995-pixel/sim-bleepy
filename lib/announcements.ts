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
  Ticket,
  Users,
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
    id: '2025-11-10-connections-beta',
    title: 'Connections Beta – Friends & Mentors Go Live',
    content: `• Launched standalone Connections, Friends (Beta) and Mentors (Beta) hubs
• Added inline public-profile reminders with one-click toggles on every social page
• Hardened reports with contact inbox integration, acknowledgement emails and RLS-secured connection analytics`,
    priority: 'high',
    author_name: 'Bleepy Team',
    created_at: '2025-11-10',
    feature_icon: Users,
  },
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
    id: '2025-11-05-placements-suite',
    title: 'Placements Publishing Suite',
    content: `• Introduced dedicated placements bucket with role-based access
• Upgraded editor with Excel paste support, image management and autosave
• Delivered refined layouts, breadcrumbs and specialty tagging across guides`,
    priority: 'high',
    author_name: 'Bleepy Team',
    created_at: '2025-11-05',
    feature_icon: Calendar
  },
  {
    id: '2025-11-03-cohorts',
    title: 'Cohort Intelligence & Admin Logs',
    content: `• Added cohort analytics with year filters, charts and university inference
• Launched system logs console with bulk actions and cron instrumentation
• Refreshed 404 and cohorts UX for a polished admin experience`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-11-03',
    feature_icon: AlertCircle
  },
  {
    id: '2025-11-02-workflow',
    title: 'Workflow Automation & Feedback Gate',
    content: `• Gated certificate release behind feedback completion with smart cron jobs
• Automated request notifications for teaching and resource submissions
• Hardened analytics filters and QR scan cooldowns for reliability`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-11-02',
    feature_icon: Shield
  },
  {
    id: '2025-11-01-cert-engine',
    title: 'Certificate Engine Hardening',
    content: `• Bundled custom fonts and server-side rendering for crisp certificates
• Added rich debugging overlays and cron triggers from attendance scans
• Streamlined template saving with safer placeholders and email previews`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-11-01',
    feature_icon: Info
  },
  {
    id: '2025-10-31-automation',
    title: 'End-to-End Event Automation',
    content: `• Preserved attended status across QR scans and certificate jobs
• Fine-tuned mobile layouts for QR, feedback and bookings workflows
• Improved cron scheduling, error capture and production configuration`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-10-31',
    feature_icon: Zap
  },
  {
    id: '2025-10-29-attendance',
    title: 'Attendance & Feedback Intelligence',
    content: `• Added Attendance Tracking dashboards with real-time counters
• Launched feedback template library with sharing controls and analytics
• Tightened QR scan logic, duplicate handling and event filtering`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-10-29',
    feature_icon: AlertCircle
  },
  {
    id: '2025-10-27-exports',
    title: 'Data Export & Live QR Dashboards',
    content: `• Delivered comprehensive CSV exports with advanced filters
• Introduced real-time QR attendance boards with fullscreen view
• Streamlined certificate previews and multi-select admin tools`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-10-27',
    feature_icon: Upload
  },
  {
    id: '2025-10-25-feedback',
    title: 'Feedback & Attendance Upgrade',
    content: `• Rolled out feedback forms with anonymous mode and QR integrations
• Persisted event builder progress locally to guard against refresh loss
• Enhanced AI bulk upload with organiser, location and category fixes`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-10-25',
    feature_icon: Bell
  },
  {
    id: '2025-10-24-qr',
    title: 'Smart QR Codes & Auto Certificates',
    content: `• Added QR attendance flows with fullscreen displays and live scan counts
• Linked QR scans to auto-certificate generation with email follow-up
• Hardened scan endpoints, RLS rules and cron compatibility`,
    priority: 'high',
    author_name: 'Bleepy Team',
    created_at: '2025-10-24',
    feature_icon: Ticket
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
    id: '2025-10-16-calendar',
    title: 'Calendar Subscriptions & Admin Onboarding',
    content: `• Introduced iCal feeds for Google, Outlook and Apple with deep links
• Streamlined admin-created user onboarding with branded emails
• Delivered automated Week Files, download tracking and polished layouts`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-10-16',
    feature_icon: Calendar
  },
  {
    id: '2025-10-14-roles',
    title: 'MedEd Team & Permission System',
    content: `• Added MedEd Team and CTF roles with tailored dashboard access
• Hardened leaderboard RLS, download tracking and admin tooling
• Rolled out Outlook-friendly email templates and confirmation dialogs`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-10-14',
    feature_icon: Shield
  },
  {
    id: '2025-10-13-imt',
    title: 'IMT Portfolio Management',
    content: `• Organise evidence with subcategories, scoring and custom folders
• Support secure uploads, renaming, downloads and bulk export
• Delivered diagnostics, role gating and responsive medical UI`,
    priority: 'high',
    author_name: 'Bleepy Team',
    created_at: '2025-10-13',
    feature_icon: Upload
  },
  {
    id: '2025-10-12-contact',
    title: 'Contact & Support Centre',
    content: `• Added secure contact form with reCAPTCHA and branded messaging
• Built admin inbox for triage, deletion and role-change alerts
• Unified mobile navigation with full product menu parity`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-10-12',
    feature_icon: Bell
  },
  {
    id: '2025-10-09-announcements',
    title: 'Announcements System Launch',
    content: `• Created dashboard widget with role-aware announcements
• Published public announcements hub with polished card design
• Automated email alerts for approvals and role changes`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-10-09',
    feature_icon: Bell
  },
  {
    id: '2025-10-08-downloads',
    title: 'Resource Library & Analytics',
    content: `• Released resources/downloads hub with uploads, filters and pagination
• Linked resources directly to events with signed URLs and tracking
• Integrated Google Analytics with role-based exclusions`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-10-08',
    feature_icon: Upload
  },
  {
    id: '2025-10-06-formats',
    title: 'Formats & Calendar Enhancements',
    content: `• Delivered formats explorer with sorting, pagination and personalization
• Refined calendar UX with dark mode, animations and precise time filters
• Added performance boosts across homepage, events list and AI simulator`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-10-06',
    feature_icon: Info
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
    id: '2025-09-21-analytics',
    title: 'Analytics & Hume Stabilisation',
    content: `• Completed educator analytics dashboards with cohort trends and KPIs
• Resolved Hume EVI behaviours, audio controls and transcript auto-scroll
• Polished station data contracts for reliable reporting`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-09-21',
    feature_icon: Zap
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
