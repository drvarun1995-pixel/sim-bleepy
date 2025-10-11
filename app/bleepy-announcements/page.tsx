'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Bell, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Calendar,
  User,
  ArrowLeft,
  Sparkles,
  Zap,
  Shield,
  Search,
  Filter,
  Download,
  Upload
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BleepyAnnouncement {
  id: string
  title: string
  content: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  author_name: string
  created_at: string
  feature_icon: any
}

const PRIORITY_CONFIG = {
  low: {
    icon: Info,
    label: 'Info',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    bgColor: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-700'
  },
  normal: {
    icon: Bell,
    label: 'Normal',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    bgColor: 'bg-gray-50 border-gray-200',
    textColor: 'text-gray-700'
  },
  high: {
    icon: AlertTriangle,
    label: 'High',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    bgColor: 'bg-orange-50 border-orange-200',
    textColor: 'text-orange-700'
  },
  urgent: {
    icon: AlertCircle,
    label: 'Urgent',
    color: 'bg-red-100 text-red-800 border-red-200',
    bgColor: 'bg-red-50 border-red-200',
    textColor: 'text-red-700'
  }
}

// Static announcements data - based on actual features implemented (sorted by date, most recent first)
const BLEEPY_ANNOUNCEMENTS: BleepyAnnouncement[] = [
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

export default function BleepyAnnouncementsPage() {
  const router = useRouter()
  const [visibleCount, setVisibleCount] = useState(6)

  const getPriorityConfig = (priority: string) => {
    return PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal
  }

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 6)
  }

  const visibleAnnouncements = BLEEPY_ANNOUNCEMENTS.slice(0, visibleCount)
  const hasMore = visibleCount < BLEEPY_ANNOUNCEMENTS.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <Bell className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bleepy Announcements
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Stay updated with the latest features, improvements, and news from the Bleepy platform
          </p>
        </div>

        {/* Announcements Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleAnnouncements.map((announcement) => {
            const priorityConfig = getPriorityConfig(announcement.priority)
            const FeatureIcon = announcement.feature_icon
            
            return (
              <Card 
                key={announcement.id} 
                className={`${priorityConfig.bgColor} hover:shadow-lg transition-all duration-300 hover:scale-105`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <FeatureIcon className={`h-5 w-5 ${priorityConfig.textColor}`} />
                      <Badge className={`${priorityConfig.color} text-xs`}>
                        {priorityConfig.label}
                      </Badge>
                    </div>
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <CardTitle className={`text-lg ${priorityConfig.textColor}`}>
                    {announcement.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-sm ${priorityConfig.textColor} mb-4 whitespace-pre-line`}>
                    {announcement.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{announcement.author_name}</span>
                    </div>
                    <span>{new Date(announcement.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center mt-12">
            <Button 
              onClick={handleLoadMore}
              variant="outline"
              className="px-8 py-3 text-lg font-medium bg-white hover:bg-gray-50 border-2 border-purple-200 hover:border-purple-300 text-purple-700 hover:text-purple-800 transition-all duration-300"
            >
              Load More Announcements
              <ArrowLeft className="h-5 w-5 ml-2 rotate-90" />
            </Button>
            <p className="text-sm text-gray-500 mt-3">
              Showing {visibleCount} of {BLEEPY_ANNOUNCEMENTS.length} announcements
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex items-center space-x-2 mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
