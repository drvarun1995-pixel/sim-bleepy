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
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 bg-white dark:bg-gray-800 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Sim-Bleepy Dashboard
          </h1>
        </div>
        <div className="mt-5 flex-grow flex flex-col">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {items.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive
                        ? 'text-blue-500 dark:text-blue-400'
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
  )
}
