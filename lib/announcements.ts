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
  Filter,
  Download,
  Upload
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
    id: '0',
    title: 'IMT Portfolio Management System',
    content: `Introducing our comprehensive IMT Portfolio Management System:

📁 Organized File Management: Upload and organize your professional portfolio files by category
🗂️ Folder Structure: Create custom folders within categories for better organization
📊 Evidence Type Classification: Categorize files by evidence type (Certificate, Abstract, etc.)
🔍 Smart Search: Find files quickly with powerful search functionality
📱 Mobile-Optimized: Fully responsive design for managing your portfolio on any device
📋 Official IMT Scoring: Integrated scoring criteria for each portfolio category
⚡ Quick Upload: Streamlined upload process with validation and preview
🎯 Publication Support: Special handling for publications with PMID and URL fields
📈 Progress Tracking: Visual indicators and file counts for each category
🛡️ Secure Storage: All files stored securely with proper access controls

This system helps you organize and manage your IMT portfolio efficiently, ensuring you have everything you need for your applications.`,
    priority: 'high',
    author_name: 'Bleepy Team',
    created_at: '2025-10-16',
    feature_icon: Upload
  },
  {
    id: '1',
    title: 'AI-Powered Bulk Event Upload System',
    content: `Introducing our revolutionary bulk event upload feature powered by AI:

🤖 AI-Powered Extraction: Upload Excel files and let AI automatically extract event details
📅 Smart Date Detection: Intelligent parsing of dates, times, and event titles from any format
🔍 Duplicate Detection: Automatically identifies existing events to prevent duplicates
✏️ Review & Edit Interface: Easy-to-use interface to review and modify extracted events
📱 Mobile-Optimized: Fully responsive design for uploading and managing events on any device
🎯 Multi-Selection Support: Select multiple categories, locations, organizers, and speakers
⚡ Batch Processing: Upload and process multiple events simultaneously
🛡️ Data Validation: Comprehensive validation ensures data integrity

This feature dramatically reduces the time needed to add multiple events to the platform, making event management more efficient than ever before.`,
    priority: 'high',
    author_name: 'Bleepy Team',
    created_at: '2025-10-11',
    feature_icon: Upload
  },
  {
    id: '2',
    title: 'Enhanced Search Experience with Smart Filters',
    content: `We've completely redesigned our search functionality with powerful new features:

🔍 Smart Filters: Search specifically by Stations, Resources, or Events
🎯 Precise Results: Better filtering and categorization of search results
📱 Mobile-Optimized: Improved scrolling and touch interactions on mobile devices
⬇️ Direct Downloads: One-click resource downloads with progress notifications
📊 Real-time Results: Instant search results as you type
🎨 Better Descriptions: Resources now show "Study material" instead of technical file types

The new search system provides faster, more accurate results and a better user experience across all devices.`,
    priority: 'high',
    author_name: 'Bleepy Team',
    created_at: '2025-10-15',
    feature_icon: Search
  },
  {
    id: '3',
    title: 'New Announcements System for Better Communication',
    content: `Introducing our comprehensive announcements system:

📢 Dashboard Widget: Stay updated with relevant announcements right on your dashboard
🎯 Targeted Messaging: Announcements based on your role and profile details
📅 Expiration Dates: Time-sensitive announcements with automatic cleanup
✏️ Management Tools: Easy creation and editing for educators and admins
🔒 Role-Based Access: Secure announcement management with proper permissions
📱 Responsive Design: Fully optimized for mobile and tablet devices

This system helps keep all users informed about important updates, events, and platform changes.`,
    priority: 'high',
    author_name: 'Bleepy Team',
    created_at: '2025-10-08',
    feature_icon: Bell
  },
  {
    id: '4',
    title: 'Improved Event Navigation and Individual Event Pages',
    content: `We've enhanced the event system with better navigation and detailed pages:

📅 Calendar Integration: Seamless integration between calendar and events pages
🔗 Direct Event Links: Individual event pages with detailed information
📍 Location Details: Enhanced location display with maps integration
👥 Speaker Information: Complete speaker and organizer details
📱 Responsive Design: Optimized for all screen sizes and devices
🎪 Better Navigation: Fixed circular redirects and improved user flow

Events now provide a more comprehensive and user-friendly experience with dedicated pages for each event.`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-09-28',
    feature_icon: Calendar
  },
  {
    id: '5',
    title: 'Mobile-First Responsive Design Improvements',
    content: `The entire platform has been optimized for mobile devices:

📱 Touch-Friendly Interface: Better touch targets and gestures for mobile users
📐 Responsive Layouts: Adaptive designs for all screen sizes (mobile, tablet, desktop)
🎨 Improved Typography: Better readability on small screens
⚡ Performance Optimizations: Faster loading and smoother interactions
🔄 Enhanced Navigation: Mobile-optimized menus and navigation
📊 Responsive Cards: Better display of announcements and content on mobile

These improvements ensure the best experience across all devices, with particular focus on mobile usability.`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-09-22',
    feature_icon: Zap
  },
  {
    id: '6',
    title: 'Enhanced Resource Management and Download System',
    content: `We've improved how resources are managed and downloaded:

⬇️ Smart Downloads: Direct download links with progress tracking
📁 Better Organization: Improved file categorization and display in search results
🔍 Enhanced Search: Resources now appear in global search results with proper descriptions
📊 Usage Analytics: Track download patterns and popular resources
🛡️ Security Improvements: Better file handling and validation
📱 Mobile Downloads: Optimized download experience on mobile devices

Resources are now more accessible and easier to manage with improved search integration.`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-09-15',
    feature_icon: Download
  },
  {
    id: '7',
    title: 'Advanced Security & Role-Based Access Control',
    content: `We've enhanced security across the platform:

🔐 NextAuth Integration: Secure authentication with multiple providers
🛡️ Role-Based Permissions: Granular access control for students, educators, and admins
🔒 Protected Routes: Secure access to sensitive features and dashboard pages
👤 Profile Management: Enhanced user profile system with proper data handling
📊 Admin Dashboard: Comprehensive administration tools for managing users and content
🚀 Session Management: Improved session handling and security

Security and user management have been significantly improved with proper authentication and authorization.`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-09-05',
    feature_icon: Shield
  },
  {
    id: '8',
    title: 'Public Bleepy Announcements Page',
    content: `Stay updated with the latest platform features and improvements:

📰 Dedicated Page: New public page showcasing all Bleepy updates and features
🔍 Easy Navigation: Accessible from the main navigation menu under Products
📱 Responsive Design: Fully optimized for all devices with beautiful card layouts
📊 Load More Functionality: Progressive loading of announcements (6 at a time)
🎨 Beautiful UI: Gradient cards with hover effects and proper typography
📅 Recent Updates: Stay informed about new features and platform improvements

Check out the new Bleepy Announcements page to stay up-to-date with all our latest features!`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-09-12',
    feature_icon: Sparkles
  },
  {
    id: '9',
    title: 'Improved User Interface and Navigation',
    content: `We've made several UI/UX improvements across the platform:

🎨 Better Button Styling: Improved button designs with better hover effects
📱 Mobile Navigation: Enhanced mobile menu and navigation experience
🔄 Smooth Transitions: Better animations and transitions throughout the app
📊 Card Layouts: Improved card designs for better content presentation
🎯 Better Typography: Enhanced text readability and hierarchy
📐 Consistent Spacing: Better spacing and layout consistency across pages

These improvements make the platform more intuitive and visually appealing for all users.`,
    priority: 'normal',
    author_name: 'Bleepy Team',
    created_at: '2025-09-01',
    feature_icon: Zap
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
