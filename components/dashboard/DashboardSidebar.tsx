'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/utils'
import { signOut } from 'next-auth/react'
import { 
  LayoutDashboard, 
  GraduationCap, 
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
  Calendar
} from 'lucide-react'

interface DashboardSidebarProps {
  role: 'student' | 'educator' | 'admin'
  userName?: string
}

const mainNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
]

const aiPatientSimulator = [
  { name: 'Stations', href: '/stations', icon: Stethoscope },
  { name: 'Overview', href: '/dashboard/overview', icon: BarChart3 },
  { name: 'Gamification', href: '/dashboard/gamification', icon: Trophy },
  { name: 'My Progress', href: '/dashboard/progress', icon: TrendingUp },
]

const roleSpecificNavigation = {
  educator: [
    { name: 'Cohorts', href: '/dashboard/educator/cohorts', icon: Users },
    { name: 'Analytics', href: '/dashboard/educator/analytics', icon: BarChart3 },
  ],
  admin: [
    { name: 'Live Metrics', href: '/dashboard/admin/live', icon: BarChart3 },
    { name: 'Station Management', href: '/dashboard/admin/stations', icon: GraduationCap },
    { name: 'User Management', href: '/dashboard/admin/users', icon: Users },
    { name: 'Tech Health', href: '/dashboard/admin/tech', icon: Settings },
    { name: 'Billing', href: '/dashboard/admin/billing', icon: Shield },
  ],
}

export function DashboardSidebar({ role, userName }: DashboardSidebarProps) {
  const pathname = usePathname()
  const roleItems = roleSpecificNavigation[role] || []

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-80 lg:flex-shrink-0 lg:flex-col">
        <div className="flex flex-col h-full bg-black border-r border-gray-800 w-80">
          <div className="flex items-center flex-shrink-0 px-6 py-6">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <h1 className="text-xl font-bold text-white">
                Dashboard
              </h1>
            </Link>
          </div>
          {/* Navigation Items */}
          <div className="flex-grow px-4 py-4">
            <nav className="space-y-6">
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
                        className={cn(
                          isActive
                            ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                            : 'text-white hover:bg-gray-800 hover:text-gray-100',
                          'group flex items-center px-4 py-3 text-base font-medium transition-colors duration-200 relative rounded-r-lg'
                        )}
                      >
                        <item.icon
                          className={cn(
                            isActive
                              ? 'text-blue-400'
                              : 'text-white group-hover:text-gray-300',
                            'mr-4 flex-shrink-0 h-6 w-6'
                          )}
                          aria-hidden="true"
                        />
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
                        className={cn(
                          isActive
                            ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                            : 'text-white hover:bg-gray-800 hover:text-gray-100',
                          'group flex items-center px-4 py-3 text-base font-medium transition-colors duration-200 relative rounded-r-lg'
                        )}
                      >
                        <item.icon
                          className={cn(
                            isActive
                              ? 'text-blue-400'
                              : 'text-white group-hover:text-gray-300',
                            'mr-4 flex-shrink-0 h-6 w-6'
                          )}
                          aria-hidden="true"
                        />
                        <span className="flex-1">{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Role-specific items for educator/admin */}
              {roleItems.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-bold text-white uppercase tracking-wider mb-2">
                    {role === 'educator' ? 'Educator Tools' : 'Admin Tools'}
                  </div>
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
                            'group flex items-center px-4 py-3 text-base font-medium transition-colors duration-200 relative rounded-r-lg'
                          )}
                        >
                          <item.icon
                            className={cn(
                              isActive
                                ? 'text-blue-400'
                                : 'text-white group-hover:text-gray-300',
                              'mr-4 flex-shrink-0 h-6 w-6'
                            )}
                            aria-hidden="true"
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
                  {/* User Profile Section */}
                  <Link
                    href={`/dashboard/${role}/profile`}
                    className="flex items-center px-4 py-3 text-base font-medium text-white hover:bg-gray-800 hover:text-gray-100 transition-colors duration-200 rounded-lg"
                  >
                    <User className="mr-4 flex-shrink-0 h-6 w-6" />
                    <span>{userName || 'Profile'}</span>
                  </Link>
                  
                  {/* Privacy & Data */}
                  <Link
                    href="/dashboard/privacy"
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
                  
                  {/* Sign Out Button */}
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
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


      {/* Mobile Bottom Navigation - Horizontally Scrollable */}
      <div className="lg:hidden bg-black border-t border-gray-800">
        <nav className="flex overflow-x-auto scrollbar-hide py-2 px-2 space-x-1">
          {[...mainNavigation, ...aiPatientSimulator, ...roleItems].map((item) => {
            const isActive = pathname === item.href || 
              (item.href === '/dashboard' && pathname === '/dashboard') ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center py-2 px-3 rounded-lg transition-colors duration-200 min-w-0 flex-shrink-0',
                  isActive
                    ? 'text-blue-400 bg-blue-600/20'
                    : 'text-white hover:text-gray-300 hover:bg-gray-800'
                )}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium truncate whitespace-nowrap">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
