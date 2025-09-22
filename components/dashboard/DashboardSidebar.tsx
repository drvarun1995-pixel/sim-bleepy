'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/utils'
import { 
  LayoutDashboard, 
  GraduationCap, 
  Users, 
  Settings, 
  BarChart3,
  User,
  BookOpen,
  Shield
} from 'lucide-react'

interface DashboardSidebarProps {
  role: 'student' | 'educator' | 'admin'
}

const navigation = {
  student: [
    { name: 'Overview', href: '/dashboard/student', icon: LayoutDashboard },
    { name: 'My Progress', href: '/dashboard/student/progress', icon: BarChart3 },
    { name: 'Assignments', href: '/dashboard/student/assignments', icon: BookOpen },
    { name: 'Profile', href: '/dashboard/student/profile', icon: User },
  ],
  educator: [
    { name: 'Overview', href: '/dashboard/educator', icon: LayoutDashboard },
    { name: 'Cohorts', href: '/dashboard/educator/cohorts', icon: Users },
    { name: 'Assignments', href: '/dashboard/educator/assignments', icon: BookOpen },
    { name: 'Analytics', href: '/dashboard/educator/analytics', icon: BarChart3 },
    { name: 'Profile', href: '/dashboard/educator/profile', icon: User },
  ],
  admin: [
    { name: 'Overview', href: '/dashboard/admin', icon: LayoutDashboard },
    { name: 'Live Metrics', href: '/dashboard/admin/live', icon: BarChart3 },
    { name: 'Station Management', href: '/dashboard/admin/stations', icon: GraduationCap },
    { name: 'User Management', href: '/dashboard/admin/users', icon: Users },
    { name: 'Tech Health', href: '/dashboard/admin/tech', icon: Settings },
    { name: 'Billing', href: '/dashboard/admin/billing', icon: Shield },
  ],
}

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const pathname = usePathname()
  const items = navigation[role]

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow pt-5 bg-white dark:bg-gray-800 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center flex-shrink-0 px-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">+</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Sim-Bleepy
              </h1>
            </Link>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      isActive
                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white',
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200'
                    )}
                  >
                    <item.icon
                      className={cn(
                        isActive
                          ? 'text-purple-500 dark:text-purple-400'
                          : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400',
                        'mr-3 flex-shrink-0 h-5 w-5'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>


      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <nav className="flex justify-around items-center py-2">
          {items.slice(0, 4).map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center py-2 px-3 rounded-lg transition-colors duration-200 min-w-0 flex-1',
                  isActive
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                )}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium truncate">{item.name}</span>
              </Link>
            )
          })}
          {items.length > 4 && (
            <div className="flex flex-col items-center py-2 px-3 text-gray-500">
              <span className="text-xs font-medium">+{items.length - 4}</span>
            </div>
          )}
        </nav>
      </div>
    </>
  )
}
