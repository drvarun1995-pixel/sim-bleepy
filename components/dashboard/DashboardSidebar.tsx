'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/utils'
import { signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
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
  Briefcase
} from 'lucide-react'

interface DashboardSidebarProps {
  role: 'student' | 'educator' | 'admin' | 'meded_team' | 'ctf'
  userName?: string
  isMobileMenuOpen?: boolean
  setIsMobileMenuOpen?: (open: boolean) => void
}

const eventManagement = [
  { name: 'Event Data', href: '/event-data', icon: List },
  { name: 'All Events', href: '/event-data?tab=all-events&source=dashboard', icon: Calendar },
  { name: 'Add Event', href: '/event-data?tab=add-event&source=dashboard', icon: Plus },
  { name: 'Smart Bulk Upload', href: '/bulk-upload-ai', icon: Upload },
]

const mainNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Events', href: '/events-list', icon: CalendarDays },
  { name: 'Formats', href: '/formats', icon: Sparkles },
]

const aiPatientSimulator = [
  { name: 'Stations', href: '/stations', icon: Stethoscope },
  { name: 'Overview', href: '/dashboard/overview', icon: BarChart3 },
  { name: 'Gamification', href: '/dashboard/gamification', icon: Trophy },
  { name: 'My Progress', href: '/dashboard/progress', icon: TrendingUp },
]

const resourcesNavigation = [
  { name: 'Downloads', href: '/downloads', icon: FolderOpen },
]

const portfolioNavigation = [
  { name: 'IMT Portfolio', href: '/imt-portfolio', icon: Briefcase },
]

const roleSpecificNavigation = {
  student: [],
  educator: [
    { name: 'Announcements', href: '/dashboard/announcements', icon: Bell },
    { name: 'Cohorts', href: '/dashboard/educator/cohorts', icon: Users },
    { name: 'Analytics', href: '/dashboard/educator/analytics', icon: BarChart3 },
  ],
  meded_team: [
    { name: 'Announcements', href: '/dashboard/announcements', icon: Bell },
    { name: 'Contact Messages', href: '/contact-messages', icon: MessageSquare },
  ],
  ctf: [
    { name: 'Announcements', href: '/dashboard/announcements', icon: Bell },
    { name: 'Contact Messages', href: '/contact-messages', icon: MessageSquare },
  ],
  admin: [
    { name: 'Announcements', href: '/dashboard/announcements', icon: Bell },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Simulator Analytics', href: '/simulator-analytics', icon: TrendingUp },
    { name: 'User Management', href: '/admin-users', icon: Users },
    { name: 'Data Retention', href: '/data-retention', icon: Lock },
    { name: 'Contact Messages', href: '/contact-messages', icon: MessageSquare },
  ],
}

export function DashboardSidebar({ role, userName, isMobileMenuOpen = false, setIsMobileMenuOpen }: DashboardSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const roleItems = roleSpecificNavigation[role] || []
  
  // Initialize collapsed state - default to false
  const [isCollapsed, setIsCollapsed] = useState(false)

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

  const handleLinkClick = () => {
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen?.(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 bg-black border-r border-gray-800 transform transition-transform duration-300 ease-in-out lg:hidden",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
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

              {/* Main Section */}
              <div>
                <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2">
                  Main
                </div>
                <div className="space-y-2">
                  {mainNavigation.map((item) => {
                    const isActive = pathname === item.href || 
                      (item.href === '/dashboard' && pathname === '/dashboard')
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

              {/* Resources Section */}
              <div>
                <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2">
                  Resources
                </div>
                <div className="space-y-2">
                  {resourcesNavigation.map((item) => {
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

              {/* Portfolio Section */}
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
        "hidden lg:flex lg:flex-shrink-0 lg:flex-col transition-all duration-300",
        isCollapsed ? "lg:w-20" : "lg:w-80"
      )}>
        <div className={cn(
          "flex flex-col h-full bg-black border-r border-gray-800 transition-all duration-300",
          isCollapsed ? "w-20" : "w-80"
        )}>
          {/* Toggle Button at Top */}
          <div className="flex items-center justify-center px-6 py-6 border-b border-gray-800">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-white hover:bg-gray-800 rounded-lg transition-all duration-200 font-medium text-sm border border-gray-700 hover:border-gray-600",
                isCollapsed ? "justify-center" : "w-full"
              )}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <>
                  <ChevronLeft className="h-5 w-5" />
                  <span className="flex-1 text-left">Collapse</span>
                </>
              )}
            </button>
          </div>
          {/* Navigation Items */}
          <div className="flex-grow px-4 py-4">
            <nav className="space-y-6">
              {/* Event Management Section - For admins, MedEd Team, and CTF */}
              {(role === 'admin' || role === 'meded_team' || role === 'ctf') && (
                <div>
                  {!isCollapsed && (
                    <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2">
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

              {/* Main Section */}
              <div>
                {!isCollapsed && (
                  <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2">
                    Main
                  </div>
                )}
                <div className="space-y-2">
                  {mainNavigation.map((item) => {
                    const isActive = pathname === item.href || 
                      (item.href === '/dashboard' && pathname === '/dashboard')
                    
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

              {/* Resources Section */}
              <div>
                {!isCollapsed && (
                  <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2">
                    Resources
                  </div>
                )}
                <div className="space-y-2">
                  {resourcesNavigation.map((item) => {
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

              {/* Portfolio Section */}
              <div>
                {!isCollapsed && (
                  <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2">
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

              {/* AI Patient Simulator Section */}
              <div>
                {!isCollapsed && (
                  <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2">
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
                    <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2">
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

              {/* Profile Section */}
              <div>
                {!isCollapsed && (
                  <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2">
                    Profile
                  </div>
                )}
                <div className="space-y-2">
                  {/* User Profile Section */}
                  <Link
                    href={`/dashboard/${role}/profile`}
                    className={cn(
                      'flex items-center text-base font-medium text-white hover:bg-gray-800 hover:text-gray-100 transition-colors duration-200 rounded-lg',
                      isCollapsed ? 'px-4 py-3 justify-center' : 'px-4 py-3'
                    )}
                    title={isCollapsed ? userName || 'Profile' : ''}
                  >
                    <User className={cn('flex-shrink-0 h-6 w-6', !isCollapsed && 'mr-4')} />
                    {!isCollapsed && <span>{userName || 'Profile'}</span>}
                  </Link>
                  
                  {/* Privacy & Data */}
                  <Link
                    href="/dashboard/privacy"
                    className={cn(
                      pathname === '/dashboard/privacy'
                        ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                        : 'text-white hover:bg-gray-800 hover:text-gray-100',
                      'flex items-center text-base font-medium transition-colors duration-200 relative rounded-r-lg',
                      isCollapsed ? 'px-4 py-3 justify-center' : 'px-4 py-3'
                    )}
                    title={isCollapsed ? 'Privacy & Data' : ''}
                  >
                    <Lock className={cn('flex-shrink-0 h-6 w-6', !isCollapsed && 'mr-4')} />
                    {!isCollapsed && <span>Privacy & Data</span>}
                  </Link>
                  
                  {/* Sign Out Button */}
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className={cn(
                      'flex items-center text-base font-medium text-white hover:bg-gray-800 hover:text-gray-100 transition-colors duration-200 rounded-lg w-full',
                      isCollapsed ? 'px-4 py-3 justify-center' : 'px-4 py-3 text-left'
                    )}
                    title={isCollapsed ? 'Sign Out' : ''}
                  >
                    <LogOut className={cn('flex-shrink-0 h-6 w-6', !isCollapsed && 'mr-4')} />
                    {!isCollapsed && <span>Sign Out</span>}
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
