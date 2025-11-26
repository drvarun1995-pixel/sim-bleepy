'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/utils'
import { signOut } from 'next-auth/react'
import { useState, useEffect, Suspense, useRef } from 'react'
import { getTourAttribute } from '@/lib/onboarding/tourAttributes'
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  BarChart3,
  User,
  Shield,
  Stethoscope,
  Lock,
  Trophy,
  LogOut,
  TrendingUp,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
  List,
  Plus,
  Sparkles,
  FolderOpen,
  Bell,
  Upload,
  MessageSquare,
  MessageCircle,
  Briefcase,
  Ticket,
  Award,
  AlertCircle,
  GraduationCap,
  UserCheck,
  QrCode,
  History,
  Gamepad2,
  BookOpen,
  Target,
  Crown,
  HelpCircle,
  FileQuestion,
  Settings2,
  Mail,
  PenSquare
} from 'lucide-react'

interface DashboardSidebarProps {
  role: 'student' | 'educator' | 'admin' | 'meded_team' | 'ctf'
  userName?: string
  isMobileMenuOpen?: boolean
  setIsMobileMenuOpen?: (open: boolean) => void
}

// Event Management - Core event creation and data management
const eventManagement = [
  { name: 'Event Data', href: '/event-data', icon: List },
  { name: 'All Events', href: '/event-data?tab=all-events&source=dashboard', icon: Calendar },
  { name: 'Add Event', href: '/event-data?tab=add-event&source=dashboard', icon: Plus },
  { name: 'Smart Bulk Upload', href: '/bulk-upload-ai', icon: Upload },
]

// Event Operations - Post-event management and operations
const eventOperations = [
  { name: 'Bookings', href: '/bookings', icon: Ticket },
  { name: 'QR Codes', href: '/qr-codes', icon: QrCode },
  { name: 'Attendance Tracking', href: '/attendance-tracking', icon: Users },
  { name: 'Feedback', href: '/feedback', icon: MessageCircle },
  { name: 'Certificates', href: '/certificates', icon: Award },
]

// Placements - Placement-related content
const placementsNavigation = [
  { name: 'Placements Guide', href: '/placements-guide', icon: Stethoscope },
]

const mainNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Events', href: '/events-list', icon: CalendarDays },
  { name: 'Formats', href: '/formats', icon: Sparkles },
  { name: 'My Bookings', href: '/my-bookings', icon: Ticket },
  { name: 'My Attendance', href: '/my-attendance', icon: UserCheck },
  { name: 'My Certificates', href: '/mycertificates', icon: Award },
]

// Social features temporarily disabled due to information governance concerns
// const socialNavigation = [
//   { name: 'Connections (Beta)', href: '/connections', icon: Users },
//   { name: 'Friends (Beta)', href: '/friends', icon: UserCheck },
//   { name: 'Mentors (Beta)', href: '/mentors', icon: GraduationCap },
// ]

const aiPatientSimulator = [
  { name: 'Stations', href: '/stations', icon: Stethoscope },
  { name: 'Overview', href: '/dashboard/overview', icon: BarChart3 },
  { name: 'Gamification', href: '/dashboard/gamification', icon: Trophy },
  { name: 'My Progress', href: '/dashboard/progress', icon: TrendingUp },
]

const resourcesNavigation = [
  { name: 'Downloads', href: '/downloads', icon: FolderOpen },
  { name: 'Placements', href: '/placements', icon: Stethoscope },
  { name: 'MedEd Team Contacts', href: '/meded-contacts', icon: Users },
]

const gamesNavigation = [
  { name: 'Games Portal', href: '/games', icon: Gamepad2 },
  { name: 'Practice Mode', href: '/games/practice', icon: BookOpen },
  { name: 'Challenge Mode', href: '/games/challenge', icon: Target },
  { name: 'Campaigns', href: '/games/campaigns', icon: Trophy },
  { name: 'Leaderboards', href: '/games/leaderboards', icon: Crown },
  { name: 'Statistics', href: '/games/stats', icon: BarChart3 },
  { name: 'Help', href: '/games/help', icon: HelpCircle },
]

const gamesOrganiserNavigation = [
  { name: 'Questions', href: '/games-organiser/questions', icon: FileQuestion },
  { name: 'Create Question', href: '/games-organiser/create-question', icon: Plus },
  { name: 'Questions Bulk Upload', href: '/games-organiser/questions-bulk-upload', icon: Upload },
  { name: 'Game Categories', href: '/games-organiser/game-categories', icon: List },
  { name: 'Game Campaigns', href: '/games-organiser/game-campaigns', icon: Trophy },
  { name: 'Game Analytics', href: '/games-organiser/game-analytics', icon: BarChart3 },
]

const portfolioNavigation = [
  { name: 'IMT Portfolio', href: '/imt-portfolio', icon: Briefcase },
  { name: 'Teaching Portfolio', href: '/teaching-portfolio', icon: GraduationCap },
]

const adminEmailNavigation = [
  { name: 'Send Email', href: '/emails/send', icon: Mail },
  { name: 'Track Emails', href: '/emails/logs', icon: History },
  { name: 'Signatures', href: '/emails/signatures', icon: PenSquare },
]

const roleSpecificNavigation = {
  student: [],
  educator: [
    { name: 'Announcements', href: '/dashboard/announcements', icon: Bell },
    { name: 'File Requests', href: '/admin-file-requests', icon: FolderOpen },
    { name: 'Teaching Requests', href: '/admin-teaching-requests', icon: Calendar },
  ],
  meded_team: [
    { name: 'Announcements', href: '/dashboard/announcements', icon: Bell },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Simulator Analytics', href: '/simulator-analytics', icon: TrendingUp },
    { name: 'Changelog', href: '/changelog', icon: History },
    { name: 'User Management', href: '/admin-users', icon: Users },
    { name: 'Student Cohorts', href: '/cohorts', icon: GraduationCap },
    { name: 'Contact Messages', href: '/contact-messages', icon: MessageSquare },
    { name: 'File Requests', href: '/admin-file-requests', icon: FolderOpen },
    { name: 'Teaching Requests', href: '/admin-teaching-requests', icon: Calendar },
  ],
  ctf: [
    { name: 'Announcements', href: '/dashboard/announcements', icon: Bell },
    { name: 'Student Cohorts', href: '/cohorts', icon: GraduationCap },
    { name: 'Contact Messages', href: '/contact-messages', icon: MessageSquare },
    { name: 'File Requests', href: '/admin-file-requests', icon: FolderOpen },
    { name: 'Teaching Requests', href: '/admin-teaching-requests', icon: Calendar },
  ],
  admin: [
    { name: 'Announcements', href: '/dashboard/announcements', icon: Bell },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Simulator Analytics', href: '/simulator-analytics', icon: TrendingUp },
    { name: 'User Management', href: '/admin-users', icon: Users },
    { name: 'Student Cohorts', href: '/cohorts', icon: GraduationCap },
    { name: 'Data Retention', href: '/data-retention', icon: Lock },
    { name: 'System Logs', href: '/logs', icon: AlertCircle },
    { name: 'Changelog', href: '/changelog', icon: History },
    { name: 'Contact Messages', href: '/contact-messages', icon: MessageSquare },
    { name: 'File Requests', href: '/admin-file-requests', icon: FolderOpen },
    { name: 'Teaching Requests', href: '/admin-teaching-requests', icon: Calendar },
  ],
}

function DashboardSidebarContent({ role, userName, isMobileMenuOpen = false, setIsMobileMenuOpen }: DashboardSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const roleItems = roleSpecificNavigation[role] || []
  
  // Initialize collapsed state - default to false
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [hasInteractedWithMobileMenu, setHasInteractedWithMobileMenu] = useState(false)
  const previousMobileMenuOpenRef = useRef(isMobileMenuOpen)

  // Load collapsed state from localStorage after mount and persist changes
  useEffect(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved === 'true') {
      setIsCollapsed(true)
    }
  }, [])

  // Persist collapsed state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString())
  }, [isCollapsed])

  // Close mobile menu when route changes
  useEffect(() => {
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false)
    }
  }, [pathname, setIsMobileMenuOpen])

  useEffect(() => {
    if (isMobileMenuOpen) {
      setHasInteractedWithMobileMenu(true)
    }
    previousMobileMenuOpenRef.current = isMobileMenuOpen
  }, [isMobileMenuOpen])

  const handleLinkClick = () => {
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false)
    }
  }

  const sidebarAnimationClass = isMobileMenuOpen
    ? 'mobile-sidebar-open'
    : hasInteractedWithMobileMenu && previousMobileMenuOpenRef.current
    ? 'mobile-sidebar-closed'
    : ''

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes mobileSidebarSlideIn {
          0% {
            transform: translateX(-100%) scale(0.96);
            opacity: 0;
          }
          100% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
        
        @keyframes mobileSidebarSlideOut {
          0% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateX(-100%) scale(0.96);
            opacity: 0;
          }
        }
        
        .mobile-sidebar-animated {
          transform: translateX(-100%) scale(0.96);
          opacity: 0;
        }
        
        .mobile-sidebar-animated.mobile-sidebar-open {
          animation: mobileSidebarSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
        }
        
        .mobile-sidebar-animated.mobile-sidebar-closed {
          animation: mobileSidebarSlideOut 0.3s cubic-bezier(0.7, 0, 0.84, 0) forwards !important;
        }
      `}} />
      
      {/* Mobile Overlay */}
      <div 
        className="fixed inset-0 bg-black z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300 ease-out"
        style={{ 
          opacity: isMobileMenuOpen ? 0.6 : 0,
          pointerEvents: isMobileMenuOpen ? 'auto' : 'none',
          visibility: isMobileMenuOpen ? 'visible' : 'hidden',
          willChange: 'opacity',
          transition: 'opacity 0.3s ease-out'
        }}
        onClick={() => setIsMobileMenuOpen?.(false)}
      />

      {/* Mobile Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-black border-r border-gray-800 lg:hidden shadow-2xl mobile-sidebar-animated ${
          sidebarAnimationClass
        }`}
        style={{ 
          willChange: 'transform, opacity'
        }}
        data-tour="sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Mobile Header with Close Button */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <h1 className="text-xl font-bold text-white whitespace-nowrap">
                Dashboard
              </h1>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen?.(false)}
              className="text-white hover:bg-gray-800 p-2 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Mobile Navigation Items */}
          <div className="flex-grow px-4 py-4 overflow-y-auto">
            <nav className="space-y-6">
              {/* Event Management Section - For admins, MedEd Team, and CTF */}
              {(role === 'admin' || role === 'meded_team' || role === 'ctf') && (
                <>
                  <div>
                    <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2">
                      Event Management
                    </div>
                    <div className="space-y-2">
                      {eventManagement.map((item) => {
                        // Parse the href to get path and query params
                        const [itemPath, itemQuery] = item.href.split('?')
                        const itemParams = new URLSearchParams(itemQuery || '')
                        const currentTab = searchParams.get('tab')
                        const itemTab = itemParams.get('tab')
                        
                        // Check if this item is active
                        let isActive = false
                        if (pathname === itemPath) {
                          if (itemTab) {
                            // For items with tab parameter, match the tab
                            isActive = currentTab === itemTab
                          } else {
                            // For Event Data (no tab), active when no tab or unrecognized tab
                            isActive = !currentTab || (currentTab !== 'all-events' && currentTab !== 'add-event')
                          }
                        }
                        
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={handleLinkClick}
                            id={item.name === 'Event Data' ? 'mobile-sidebar-event-data-link' : undefined}
                            className={cn(
                              isActive
                                ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                                : 'text-white hover:bg-gray-800 hover:text-gray-100',
                              'group flex items-center px-4 py-3 text-base font-medium transition-colors duration-200 relative rounded-r-lg'
                            )}
                          >
                            <item.icon className={cn(
                              isActive ? 'text-blue-400' : 'text-white group-hover:text-gray-300',
                              'mr-4 flex-shrink-0 h-6 w-6'
                            )} />
                            <span className="flex-1">{item.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>

                  {/* Event Operations Section */}
                  <div>
                    <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2">
                      Event Operations
                    </div>
                    <div className="space-y-2">
                      {eventOperations.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href)
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            id={
                              item.name === 'Bookings' ? 'sidebar-bookings-link' :
                              undefined
                            }
                            onClick={handleLinkClick}
                            className={cn(
                              isActive
                                ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                                : 'text-white hover:bg-gray-800 hover:text-gray-100',
                              'group flex items-center px-4 py-3 text-base font-medium transition-colors duration-200 relative rounded-r-lg'
                            )}
                          >
                            <item.icon className={cn(
                              isActive ? 'text-blue-400' : 'text-white group-hover:text-gray-300',
                              'mr-4 flex-shrink-0 h-6 w-6'
                            )} />
                            <span className="flex-1">{item.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>

                  {/* Placements Section */}
                  <div>
                    <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2">
                      Placements
                    </div>
                    <div className="space-y-2">
                      {placementsNavigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href)
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={handleLinkClick}
                            className={cn(
                              isActive
                                ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                                : 'text-white hover:bg-gray-800 hover:text-gray-100',
                              'group flex items-center px-4 py-3 text-base font-medium transition-colors duration-200 relative rounded-r-lg'
                            )}
                          >
                            <item.icon className={cn(
                              isActive ? 'text-blue-400' : 'text-white group-hover:text-gray-300',
                              'mr-4 flex-shrink-0 h-6 w-6'
                            )} />
                            <span className="flex-1">{item.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Main Section */}
              <div>
                <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2">
                  Main
                </div>
                <div className="space-y-2">
                  {mainNavigation.map((item) => {
                    const isActive = pathname === item.href || 
                      (item.href === '/dashboard' && pathname === '/dashboard')
                     const tourAttr = getTourAttribute(item.name)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                          id={
                            item.name === 'Dashboard' ? 'mobile-sidebar-dashboard-link' :
                            item.name === 'Calendar' ? 'mobile-sidebar-calendar-link' :
                            item.name === 'Events' ? 'mobile-sidebar-events-link' :
                            item.name === 'Formats' ? 'mobile-sidebar-formats-link' :
                            item.name === 'My Bookings' ? 'mobile-sidebar-my-bookings-link' :
                            item.name === 'My Attendance' ? 'mobile-sidebar-my-attendance-link' :
                            item.name === 'My Certificates' ? 'mobile-sidebar-my-certificates-link' :
                            undefined
                          }
                        onClick={handleLinkClick}
                        className={cn(
                          isActive
                            ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                            : 'text-white hover:bg-gray-800 hover:text-gray-100',
                          'group flex items-center px-4 py-3 text-base font-medium transition-colors duration-200 relative rounded-r-lg'
                        )}
                          data-tour={tourAttr}
                      >
                        <item.icon className={cn(
                          isActive ? 'text-blue-400' : 'text-white group-hover:text-gray-300',
                          'mr-4 flex-shrink-0 h-6 w-6'
                        )} />
                        <span className="flex-1">{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Social Section - Temporarily disabled due to information governance concerns */}
              {/* <div>
                <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2">
                  Social (Beta)
                </div>
                <div className="space-y-2">
                  {socialNavigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href)
                    const tourAttr = getTourAttribute(item.name)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        data-tour={tourAttr}
                        onClick={handleLinkClick}
                        className={cn(
                          isActive
                            ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                            : 'text-white hover:bg-gray-800 hover:text-gray-100',
                          'group flex items-center px-4 py-3 text-base font-medium transition-colors duration-200 relative rounded-r-lg'
                        )}
                      >
                        <item.icon className={cn(
                          isActive ? 'text-blue-400' : 'text-white group-hover:text-gray-300',
                          'mr-4 flex-shrink-0 h-6 w-6'
                        )} />
                        <span className="flex-1">{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div> */}

              {/* Resources Section */}
              <div>
                <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2">
                  Resources
                </div>
                <div className="space-y-2">
                  {resourcesNavigation.map((item) => {
                    // Fix: Make sure /placements-guide doesn't match /placements
                    const isActive = item.href === '/placements' 
                      ? pathname === item.href || pathname.startsWith(item.href + '/')
                      : pathname === item.href || pathname.startsWith(item.href)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={handleLinkClick}
                        id={
                          item.name === 'Downloads' ? 'sidebar-downloads-link' :
                          item.name === 'Placements' ? 'sidebar-placements-link' :
                          item.name === 'MedEd Team Contacts' ? 'sidebar-meded-contacts-link' :
                          undefined
                        }
                        className={cn(
                          isActive
                            ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                            : 'text-white hover:bg-gray-800 hover:text-gray-100',
                          'group flex items-center px-4 py-3 text-base font-medium transition-colors duration-200 relative rounded-r-lg'
                        )}
                      >
                        <item.icon className={cn(
                          isActive ? 'text-blue-400' : 'text-white group-hover:text-gray-300',
                          'mr-4 flex-shrink-0 h-6 w-6'
                        )} />
                        <span className="flex-1">{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Games Section - For all users */}
              <div>
                <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2">
                  Games (Beta)
                </div>
                <div className="space-y-2">
                  {gamesNavigation.map((item) => {
                    // Games Portal should only be active on exact /games path
                    // Other items can be active on exact match or sub-routes
                    let isActive = false
                    if (item.href === '/games') {
                      isActive = pathname === '/games'
                    } else {
                      isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    }
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={handleLinkClick}
                        className={cn(
                          isActive
                            ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                            : 'text-white hover:bg-gray-800 hover:text-gray-100',
                          'group flex items-center px-4 py-3 text-base font-medium transition-colors duration-200 relative rounded-r-lg'
                        )}
                      >
                        <item.icon className={cn(
                          isActive ? 'text-blue-400' : 'text-white group-hover:text-gray-300',
                          'mr-4 flex-shrink-0 h-6 w-6'
                        )} />
                        <span className="flex-1">{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Games Organiser Section - Only for Admin */}
              {role === 'admin' && (
                <div>
                  <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2">
                    Games Organiser
                  </div>
                  <div className="space-y-2">
                    {gamesOrganiserNavigation.map((item) => {
                      // More precise active state detection to avoid conflicts
                      // For specific items like "Questions", only match exact path
                      // For other items, allow sub-routes (pathname starts with href followed by /)
                      let isActive = false
                      if (item.href === '/games-organiser/questions') {
                        // "Questions" should only match exactly, not sub-routes
                        isActive = pathname === item.href
                      } else {
                        // Other items can match exactly or be a sub-route
                        isActive = pathname === item.href || 
                          (pathname.startsWith(item.href) && 
                           (pathname.length === item.href.length || pathname[item.href.length] === '/'))
                      }
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={handleLinkClick}
                          className={cn(
                            isActive
                              ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                              : 'text-white hover:bg-gray-800 hover:text-gray-100',
                            'group flex items-center px-4 py-3 text-base font-medium transition-colors duration-200 relative rounded-r-lg'
                          )}
                        >
                          <item.icon className={cn(
                            isActive ? 'text-blue-400' : 'text-white group-hover:text-gray-300',
                            'mr-4 flex-shrink-0 h-6 w-6'
                          )} />
                          <span className="flex-1">{item.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Portfolio Section - Only for CTF and Admin */}
              {(role === 'ctf' || role === 'admin') && (
                <div>
                  <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2">
                    Portfolio
                  </div>
                  <div className="space-y-2">
                    {portfolioNavigation.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href)
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={handleLinkClick}
                          className={cn(
                            isActive
                              ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                              : 'text-white hover:bg-gray-800 hover:text-gray-100',
                            'group flex items-center px-4 py-3 text-base font-medium transition-colors duration-200 relative rounded-r-lg'
                          )}
                        >
                          <item.icon className={cn(
                            isActive ? 'text-blue-400' : 'text-white group-hover:text-gray-300',
                            'mr-4 flex-shrink-0 h-6 w-6'
                          )} />
                          <span className="flex-1">{item.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* AI Patient Simulator Section */}
              <div>
                <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2">
                  AI Patient Simulator
                </div>
                <div className="space-y-2">
                  {aiPatientSimulator.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={handleLinkClick}
                        className={cn(
                          isActive
                            ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                            : 'text-white hover:bg-gray-800 hover:text-gray-100',
                          'group flex items-center px-4 py-3 text-base font-medium transition-colors duration-200 relative rounded-r-lg'
                        )}
                      >
                        <item.icon className={cn(
                          isActive ? 'text-blue-400' : 'text-white group-hover:text-gray-300',
                          'mr-4 flex-shrink-0 h-6 w-6'
                        )} />
                        <span className="flex-1">{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Role-specific items */}
              {roleItems.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2">
                    {role === 'educator' ? 'Educator Tools' : role === 'meded_team' ? 'MedEd Tools' : role === 'ctf' ? 'CTF Tools' : 'Admin Tools'}
                  </div>
                  <div className="space-y-2">
                    {roleItems.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href)
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={handleLinkClick}
                          id={
                            item.name === 'Announcements' ? 'sidebar-announcements-link' :
                            item.name === 'Analytics' ? 'sidebar-analytics-link' :
                            item.name === 'Simulator Analytics' ? 'sidebar-simulator-analytics-link' :
                            item.name === 'User Management' ? 'sidebar-user-management-link' :
                            item.name === 'Student Cohorts' ? 'sidebar-cohorts-link' :
                            undefined
                          }
                          className={cn(
                            isActive
                              ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                              : 'text-white hover:bg-gray-800 hover:text-gray-100',
                            'group flex items-center px-4 py-3 text-base font-medium transition-colors duration-200 relative rounded-r-lg'
                          )}
                        >
                          <item.icon className={cn(
                            isActive ? 'text-blue-400' : 'text-white group-hover:text-gray-300',
                            'mr-4 flex-shrink-0 h-6 w-6'
                          )} />
                          <span className="flex-1">{item.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Emails Section - Admin + MedEd */}
              {(role === 'admin' || role === 'meded_team') && (
                <div>
                  <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2">
                    Emails
                  </div>
                  <div className="space-y-2">
                    {adminEmailNavigation.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href)
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={handleLinkClick}
                          className={cn(
                            isActive
                              ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                              : 'text-white hover:bg-gray-800 hover:text-gray-100',
                            'group flex items-center px-4 py-3 text-base font-medium transition-colors duration-200 relative rounded-r-lg'
                          )}
                        >
                          <item.icon
                            className={cn(
                              isActive ? 'text-blue-400' : 'text-white group-hover:text-gray-300',
                              'mr-4 flex-shrink-0 h-6 w-6'
                            )}
                          />
                          <span className="flex-1">{item.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Profile Section */}
              <div>
                <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2">
                  Profile
                </div>
                <div className="space-y-2">
                  <Link
                    href={`/dashboard/${role}/profile`}
                    onClick={handleLinkClick}
                    className="flex items-center px-4 py-3 text-base font-medium text-white hover:bg-gray-800 hover:text-gray-100 transition-colors duration-200 rounded-lg"
                  >
                    <User className="mr-4 flex-shrink-0 h-6 w-6" />
                    <span>{userName || 'Profile'}</span>
                  </Link>
                  <Link
                    href="/dashboard/privacy"
                    onClick={handleLinkClick}
                    className={cn(
                      pathname === '/dashboard/privacy'
                        ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                        : 'text-white hover:bg-gray-800 hover:text-gray-100',
                      'flex items-center px-4 py-3 text-base font-medium transition-colors duration-200 relative rounded-r-lg'
                    )}
                  >
                    <Lock className="mr-4 flex-shrink-0 h-6 w-6" />
                    <span>Privacy & Data</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLinkClick()
                      signOut({ callbackUrl: "/" })
                    }}
                    className="flex items-center px-4 py-3 text-base font-medium text-white hover:bg-gray-800 hover:text-gray-100 transition-colors duration-200 rounded-lg w-full text-left"
                  >
                    <LogOut className="mr-4 flex-shrink-0 h-6 w-6" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex lg:flex-shrink-0 lg:flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "lg:w-20" : "lg:w-80"
      )} data-tour="sidebar">
        <div 
          className={cn(
          "flex flex-col h-full bg-black border-r border-gray-800 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-80"
          )}
          id="dashboard-sidebar-content"
        >
          {/* Toggle Button at Top */}
          <div className={cn(
            "flex items-center border-b border-gray-800 transition-all duration-300 ease-in-out",
            isCollapsed ? "justify-center px-4 py-6" : "justify-center px-6 py-6"
          )}>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-white hover:bg-gray-800 rounded-lg transition-all duration-300 ease-in-out font-medium text-sm border border-gray-700 hover:border-gray-600 hover:scale-105 active:scale-95",
                isCollapsed ? "justify-center w-full" : "w-full"
              )}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5 transition-all duration-300 ease-in-out transform rotate-0" />
              ) : (
                <>
                  <ChevronLeft className="h-5 w-5 transition-all duration-300 ease-in-out transform rotate-0" />
                  <span className="flex-1 text-left transition-all duration-300 ease-in-out opacity-100">Collapse</span>
                </>
              )}
            </button>
          </div>
          {/* Navigation Items */}
          <div className="flex-grow px-4 py-4">
            <nav className="space-y-6">
              {/* Event Management Section - For admins, MedEd Team, and CTF */}
              {(role === 'admin' || role === 'meded_team' || role === 'ctf') && (
                <>
                  {/* Event Management */}
                  <div>
                    {!isCollapsed && (
                      <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2 transition-all duration-300 ease-in-out opacity-100">
                        Event Management
                      </div>
                    )}
                    <div className="space-y-2">
                      {eventManagement.map((item) => {
                        // Parse the href to get path and query params
                        const [itemPath, itemQuery] = item.href.split('?')
                        const itemParams = new URLSearchParams(itemQuery || '')
                        const currentTab = searchParams.get('tab')
                        const itemTab = itemParams.get('tab')
                        
                        // Check if this item is active
                        let isActive = false
                        if (pathname === itemPath) {
                          if (itemTab) {
                            // For items with tab parameter, match the tab
                            isActive = currentTab === itemTab
                          } else {
                            // For Event Data (no tab), active when no tab or unrecognized tab
                            isActive = !currentTab || (currentTab !== 'all-events' && currentTab !== 'add-event')
                          }
                        }
                        
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            id={item.name === 'Event Data' ? 'sidebar-event-data-link' : undefined}
                            className={cn(
                              isActive
                                ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                                : 'text-white hover:bg-gray-800 hover:text-gray-100',
                              'group flex items-center text-base font-medium transition-all duration-300 ease-in-out relative rounded-r-lg',
                              isCollapsed ? 'px-4 py-3 justify-center' : 'px-4 py-3'
                            )}
                            title={isCollapsed ? item.name : ''}
                          >
                            <item.icon
                              className={cn(
                                isActive ? 'text-blue-400' : 'text-white group-hover:text-gray-300',
                                'flex-shrink-0 h-6 w-6 transition-all duration-300 ease-in-out',
                                !isCollapsed && 'mr-4'
                              )}
                            />
                            {!isCollapsed && (
                              <span className="flex-1 transition-all duration-300 ease-in-out opacity-100">
                                {item.name}
                              </span>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </div>

                  {/* Event Operations */}
                  <div>
                    {!isCollapsed && (
                      <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2 transition-all duration-300 ease-in-out opacity-100">
                        Event Operations
                      </div>
                    )}
                    <div className="space-y-2">
                      {eventOperations.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href)
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            id={
                              item.name === 'Bookings' ? 'sidebar-bookings-link' :
                              item.name === 'QR Codes' ? 'sidebar-qr-codes-link' :
                              item.name === 'Attendance Tracking' ? 'sidebar-attendance-tracking-link' :
                              item.name === 'Feedback' ? 'sidebar-feedback-link' :
                              item.name === 'Certificates' ? 'sidebar-certificates-link' :
                              undefined
                            }
                            className={cn(
                              isActive
                                ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                                : 'text-white hover:bg-gray-800 hover:text-gray-100',
                              'group flex items-center text-base font-medium transition-all duration-300 ease-in-out relative rounded-r-lg',
                              isCollapsed ? 'px-4 py-3 justify-center' : 'px-4 py-3'
                            )}
                            title={isCollapsed ? item.name : ''}
                          >
                            <item.icon
                              className={cn(
                                isActive ? 'text-blue-400' : 'text-white group-hover:text-gray-300',
                                'flex-shrink-0 h-6 w-6 transition-all duration-300 ease-in-out',
                                !isCollapsed && 'mr-4'
                              )}
                            />
                            {!isCollapsed && (
                              <span className="flex-1 transition-all duration-300 ease-in-out opacity-100">
                                {item.name}
                              </span>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </div>

                  {/* Placements */}
                  <div>
                    {!isCollapsed && (
                      <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2 transition-all duration-300 ease-in-out opacity-100">
                        Placements
                      </div>
                    )}
                    <div className="space-y-2">
                      {placementsNavigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href)
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            id={
                              item.name === 'Placements Guide' ? 'sidebar-placements-guide-link' :
                              undefined
                            }
                            className={cn(
                              isActive
                                ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                                : 'text-white hover:bg-gray-800 hover:text-gray-100',
                              'group flex items-center text-base font-medium transition-all duration-300 ease-in-out relative rounded-r-lg',
                              isCollapsed ? 'px-4 py-3 justify-center' : 'px-4 py-3'
                            )}
                            title={isCollapsed ? item.name : ''}
                          >
                            <item.icon
                              className={cn(
                                isActive ? 'text-blue-400' : 'text-white group-hover:text-gray-300',
                                'flex-shrink-0 h-6 w-6 transition-all duration-300 ease-in-out',
                                !isCollapsed && 'mr-4'
                              )}
                            />
                            {!isCollapsed && (
                              <span className="flex-1 transition-all duration-300 ease-in-out opacity-100">
                                {item.name}
                              </span>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Main Section */}
              <div>
                {!isCollapsed && (
                  <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2 transition-opacity duration-300 ease-in-out animate-in fade-in">
                    Main
                  </div>
                )}
                <div className="space-y-2">
                  {mainNavigation.map((item) => {
                    const isActive = pathname === item.href || 
                      (item.href === '/dashboard' && pathname === '/dashboard')
                    const tourAttr = getTourAttribute(item.name)
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        id={
                          item.name === 'Dashboard' ? 'sidebar-dashboard-link' :
                          item.name === 'Calendar' ? 'sidebar-calendar-link' :
                          item.name === 'Events' ? 'sidebar-events-link' :
                          item.name === 'Formats' ? 'sidebar-formats-link' :
                          item.name === 'My Bookings' ? 'sidebar-my-bookings-link' :
                          item.name === 'My Attendance' ? 'sidebar-my-attendance-link' :
                          item.name === 'My Certificates' ? 'sidebar-my-certificates-link' :
                          undefined
                        }
                        className={cn(
                          isActive
                            ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                            : 'text-white hover:bg-gray-800 hover:text-gray-100',
                          'group flex items-center text-base font-medium transition-colors duration-200 relative rounded-r-lg',
                          isCollapsed ? 'px-4 py-3 justify-center' : 'px-4 py-3'
                        )}
                        title={isCollapsed ? item.name : ''}
                        data-tour={tourAttr}
                      >
                        <item.icon
                          className={cn(
                            isActive
                              ? 'text-blue-400'
                              : 'text-white group-hover:text-gray-300',
                            'flex-shrink-0 h-6 w-6',
                            !isCollapsed && 'mr-4'
                          )}
                          aria-hidden="true"
                        />
                        {!isCollapsed && <span className="flex-1">{item.name}</span>}
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Social Section - Temporarily disabled due to information governance concerns */}
              {/* <div>
                {!isCollapsed && (
                  <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2 transition-opacity duration-300 ease-in-out animate-in fade-in">
                    Social (Beta)
                  </div>
                )}
                <div className="space-y-2">
                  {socialNavigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href)
                    const tourAttr = getTourAttribute(item.name)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        data-tour={tourAttr}
                        onClick={handleLinkClick}
                        className={cn(
                          isActive
                            ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                            : 'text-white hover:bg-gray-800 hover:text-gray-100',
                          'group flex items-center text-base font-medium transition-colors duration-200 relative rounded-r-lg',
                          isCollapsed ? 'px-4 py-3 justify-center' : 'px-4 py-3'
                        )}
                        title={isCollapsed ? item.name : ''}
                      >
                        <item.icon
                          className={cn(
                            isActive
                              ? 'text-blue-400'
                              : 'text-white group-hover:text-gray-300',
                            'flex-shrink-0 h-6 w-6',
                            !isCollapsed && 'mr-4'
                          )}
                          aria-hidden="true"
                        />
                        {!isCollapsed && <span className="flex-1">{item.name}</span>}
                      </Link>
                    )
                  })}
                </div>
              </div> */}

              {/* Resources Section */}
              <div>
                {!isCollapsed && (
                  <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2 transition-opacity duration-300 ease-in-out animate-in fade-in">
                    Resources
                  </div>
                )}
                <div className="space-y-2">
                  {resourcesNavigation.map((item) => {
                    // Fix: Make sure /placements-guide doesn't match /placements
                    const isActive = item.href === '/placements' 
                      ? pathname === item.href || pathname.startsWith(item.href + '/')
                      : pathname === item.href || pathname.startsWith(item.href)
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        id={
                          item.name === 'Downloads' ? 'sidebar-downloads-link' :
                          item.name === 'Placements' ? 'sidebar-placements-link' :
                          item.name === 'MedEd Team Contacts' ? 'sidebar-meded-contacts-link' :
                          undefined
                        }
                        className={cn(
                          isActive
                            ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                            : 'text-white hover:bg-gray-800 hover:text-gray-100',
                          'group flex items-center text-base font-medium transition-colors duration-200 relative rounded-r-lg',
                          isCollapsed ? 'px-4 py-3 justify-center' : 'px-4 py-3'
                        )}
                        title={isCollapsed ? item.name : ''}
                      >
                        <item.icon
                          className={cn(
                            isActive
                              ? 'text-blue-400'
                              : 'text-white group-hover:text-gray-300',
                            'flex-shrink-0 h-6 w-6',
                            !isCollapsed && 'mr-4'
                          )}
                          aria-hidden="true"
                        />
                        {!isCollapsed && <span className="flex-1">{item.name}</span>}
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Games Section - For all users */}
              <div>
                {!isCollapsed && (
                  <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2 transition-opacity duration-300 ease-in-out animate-in fade-in">
                    Games (Beta)
                  </div>
                )}
                <div className="space-y-2">
                  {gamesNavigation.map((item) => {
                    // Games Portal should only be active on exact /games path
                    // Other items can be active on exact match or sub-routes
                    let isActive = false
                    if (item.href === '/games') {
                      isActive = pathname === '/games'
                    } else {
                      isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    }
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          isActive
                            ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                            : 'text-white hover:bg-gray-800 hover:text-gray-100',
                          'group flex items-center text-base font-medium transition-colors duration-200 relative rounded-r-lg',
                          isCollapsed ? 'px-4 py-3 justify-center' : 'px-4 py-3'
                        )}
                        title={isCollapsed ? item.name : ''}
                      >
                        <item.icon
                          className={cn(
                            isActive
                              ? 'text-blue-400'
                              : 'text-white group-hover:text-gray-300',
                            'flex-shrink-0 h-6 w-6',
                            !isCollapsed && 'mr-4'
                          )}
                          aria-hidden="true"
                        />
                        {!isCollapsed && <span className="flex-1">{item.name}</span>}
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Games Organiser Section - Only for Admin */}
              {role === 'admin' && (
                <div>
                  {!isCollapsed && (
                    <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2 transition-opacity duration-300 ease-in-out animate-in fade-in">
                      Games Organiser
                    </div>
                  )}
                  <div className="space-y-2">
                    {gamesOrganiserNavigation.map((item) => {
                      // More precise active state detection to avoid conflicts
                      // For specific items like "Questions", only match exact path
                      // For other items, allow sub-routes (pathname starts with href followed by /)
                      let isActive = false
                      if (item.href === '/games-organiser/questions') {
                        // "Questions" should only match exactly, not sub-routes
                        isActive = pathname === item.href
                      } else {
                        // Other items can match exactly or be a sub-route
                        isActive = pathname === item.href || 
                          (pathname.startsWith(item.href) && 
                           (pathname.length === item.href.length || pathname[item.href.length] === '/'))
                      }
                      
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            isActive
                              ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                              : 'text-white hover:bg-gray-800 hover:text-gray-100',
                            'group flex items-center text-base font-medium transition-colors duration-200 relative rounded-r-lg',
                            isCollapsed ? 'px-4 py-3 justify-center' : 'px-4 py-3'
                          )}
                          title={isCollapsed ? item.name : ''}
                        >
                          <item.icon
                            className={cn(
                              isActive
                                ? 'text-blue-400'
                                : 'text-white group-hover:text-gray-300',
                              'flex-shrink-0 h-6 w-6',
                              !isCollapsed && 'mr-4'
                            )}
                            aria-hidden="true"
                          />
                          {!isCollapsed && <span className="flex-1">{item.name}</span>}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Portfolio Section - Only for CTF and Admin */}
              {(role === 'ctf' || role === 'admin') && (
                <div>
                  {!isCollapsed && (
                    <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2 transition-opacity duration-300 ease-in-out animate-in fade-in">
                      Portfolio
                    </div>
                  )}
                  <div className="space-y-2">
                    {portfolioNavigation.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href)
                      
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            isActive
                              ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                              : 'text-white hover:bg-gray-800 hover:text-gray-100',
                            'group flex items-center text-base font-medium transition-colors duration-200 relative rounded-r-lg',
                            isCollapsed ? 'px-4 py-3 justify-center' : 'px-4 py-3'
                          )}
                          title={isCollapsed ? item.name : ''}
                        >
                          <item.icon
                            className={cn(
                              isActive
                                ? 'text-blue-400'
                                : 'text-white group-hover:text-gray-300',
                              'flex-shrink-0 h-6 w-6',
                              !isCollapsed && 'mr-4'
                            )}
                            aria-hidden="true"
                          />
                          {!isCollapsed && <span className="flex-1">{item.name}</span>}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* AI Patient Simulator Section */}
              <div>
                {!isCollapsed && (
                  <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2 transition-opacity duration-300 ease-in-out animate-in fade-in">
                    AI Patient Simulator
                  </div>
                )}
                <div className="space-y-2">
                  {aiPatientSimulator.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href)
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          isActive
                            ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                            : 'text-white hover:bg-gray-800 hover:text-gray-100',
                          'group flex items-center text-base font-medium transition-colors duration-200 relative rounded-r-lg',
                          isCollapsed ? 'px-4 py-3 justify-center' : 'px-4 py-3'
                        )}
                        title={isCollapsed ? item.name : ''}
                      >
                        <item.icon
                          className={cn(
                            isActive
                              ? 'text-blue-400'
                              : 'text-white group-hover:text-gray-300',
                            'flex-shrink-0 h-6 w-6',
                            !isCollapsed && 'mr-4'
                          )}
                          aria-hidden="true"
                        />
                        {!isCollapsed && <span className="flex-1">{item.name}</span>}
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Role-specific items for educator/admin */}
              {roleItems.length > 0 && (
                <div>
                  {!isCollapsed && (
                    <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2 transition-opacity duration-300 ease-in-out animate-in fade-in">
                      {role === 'educator' ? 'Educator Tools' : role === 'meded_team' ? 'MedEd Tools' : role === 'ctf' ? 'CTF Tools' : 'Admin Tools'}
                    </div>
                  )}
                  <div className="space-y-2">
                    {roleItems.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href)
                      
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          id={
                            item.name === 'Announcements' ? 'sidebar-announcements-link' :
                            item.name === 'Analytics' ? 'sidebar-analytics-link' :
                            item.name === 'Simulator Analytics' ? 'sidebar-simulator-analytics-link' :
                            item.name === 'User Management' ? 'sidebar-user-management-link' :
                            item.name === 'Student Cohorts' ? 'sidebar-cohorts-link' :
                            undefined
                          }
                          className={cn(
                            isActive
                              ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                              : 'text-white hover:bg-gray-800 hover:text-gray-100',
                            'group flex items-center text-base font-medium transition-colors duration-200 relative rounded-r-lg',
                            isCollapsed ? 'px-4 py-3 justify-center' : 'px-4 py-3'
                          )}
                          title={isCollapsed ? item.name : ''}
                        >
                          <item.icon
                            className={cn(
                              isActive
                                ? 'text-blue-400'
                                : 'text-white group-hover:text-gray-300',
                              'flex-shrink-0 h-6 w-6',
                              !isCollapsed && 'mr-4'
                            )}
                            aria-hidden="true"
                          />
                          {!isCollapsed && <span className="flex-1">{item.name}</span>}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {(role === 'admin' || role === 'meded_team') && (
                <div>
                  {!isCollapsed && (
                    <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2 transition-opacity duration-300 ease-in-out animate-in fade-in">
                      Emails
                    </div>
                  )}
                  <div className="space-y-2">
                    {adminEmailNavigation.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href)
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            isActive
                              ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                              : 'text-white hover:bg-gray-800 hover:text-gray-100',
                            'group flex items-center text-base font-medium transition-colors duration-200 relative rounded-r-lg',
                            isCollapsed ? 'px-4 py-3 justify-center' : 'px-4 py-3'
                          )}
                          title={isCollapsed ? item.name : ''}
                        >
                          <item.icon
                            className={cn(
                              isActive ? 'text-blue-400' : 'text-white group-hover:text-gray-300',
                              'flex-shrink-0 h-6 w-6',
                              !isCollapsed && 'mr-4'
                            )}
                          />
                          {!isCollapsed && <span className="flex-1">{item.name}</span>}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Profile Section */}
              <div>
                {!isCollapsed && (
                  <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2 transition-opacity duration-300 ease-in-out animate-in fade-in">
                    Profile
                  </div>
                )}
                <div className="space-y-2">
                  {/* User Profile Section */}
                  <Link
                    href={`/dashboard/${role}/profile`}
                    className={cn(
                      'flex items-center text-base font-medium text-white hover:bg-gray-800 hover:text-gray-100 transition-all duration-300 ease-in-out rounded-lg',
                      isCollapsed ? 'px-4 py-3 justify-center' : 'px-4 py-3'
                    )}
                    title={isCollapsed ? userName || 'Profile' : ''}
                  >
                    <User className={cn('flex-shrink-0 h-6 w-6 transition-all duration-300 ease-in-out', !isCollapsed && 'mr-4')} />
                    {!isCollapsed && (
                      <span className="transition-all duration-300 ease-in-out opacity-100">
                        {userName || 'Profile'}
                      </span>
                    )}
                  </Link>
                  
                  {/* Privacy & Data */}
                  <Link
                    href="/dashboard/privacy"
                    className={cn(
                      pathname === '/dashboard/privacy'
                        ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                        : 'text-white hover:bg-gray-800 hover:text-gray-100',
                      'flex items-center text-base font-medium transition-all duration-300 ease-in-out relative rounded-r-lg',
                      isCollapsed ? 'px-4 py-3 justify-center' : 'px-4 py-3'
                    )}
                    title={isCollapsed ? 'Privacy & Data' : ''}
                  >
                    <Lock className={cn('flex-shrink-0 h-6 w-6 transition-all duration-300 ease-in-out', !isCollapsed && 'mr-4')} />
                    {!isCollapsed && (
                      <span className="transition-all duration-300 ease-in-out opacity-100">
                        Privacy & Data
                      </span>
                    )}
                  </Link>
                  
                  {/* Sign Out Button */}
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className={cn(
                      'flex items-center text-base font-medium text-white hover:bg-gray-800 hover:text-gray-100 transition-all duration-300 ease-in-out rounded-lg w-full',
                      isCollapsed ? 'px-4 py-3 justify-center' : 'px-4 py-3 text-left'
                    )}
                    title={isCollapsed ? 'Sign Out' : ''}
                  >
                    <LogOut className={cn('flex-shrink-0 h-6 w-6 transition-all duration-300 ease-in-out', !isCollapsed && 'mr-4')} />
                    {!isCollapsed && (
                      <span className="transition-all duration-300 ease-in-out opacity-100">
                        Sign Out
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </>
  )
}

export function DashboardSidebar(props: DashboardSidebarProps) {
  return (
    <Suspense fallback={<div className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 animate-pulse" />}>
      <DashboardSidebarContent {...props} />
    </Suspense>
  )
}
