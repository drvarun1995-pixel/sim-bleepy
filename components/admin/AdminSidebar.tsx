'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/utils'
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  Settings, 
  Database,
  Mail,
  Shield,
  Activity,
  TrendingUp,
  UserCheck,
  Bell
} from 'lucide-react'

interface AdminSidebarProps {
  className?: string
}

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/admin', 
    icon: LayoutDashboard,
    description: 'Overview and key metrics'
  },
  { 
    name: 'Analytics', 
    href: '/admin/analytics', 
    icon: BarChart3,
    description: 'Usage and performance data'
  },
  { 
    name: 'User Management', 
    href: '/admin/users', 
    icon: Users,
    description: 'Manage users and roles'
  },
  { 
    name: 'Station Management', 
    href: '/admin/stations', 
    icon: Activity,
    description: 'Configure clinical stations'
  },
  { 
    name: 'Newsletter', 
    href: '/admin/newsletter', 
    icon: Mail,
    description: 'Email campaigns and analytics'
  },
  { 
    name: 'Database', 
    href: '/admin/database', 
    icon: Database,
    description: 'Database health and tools'
  },
  { 
    name: 'System Health', 
    href: '/admin/system', 
    icon: Shield,
    description: 'System monitoring and logs'
  },
  { 
    name: 'Notifications', 
    href: '/admin/notifications', 
    icon: Bell,
    description: 'System notifications'
  },
  { 
    name: 'Settings', 
    href: '/admin/settings', 
    icon: Settings,
    description: 'Admin configuration'
  }
]

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn("hidden lg:flex lg:w-72 lg:flex-col", className)}>
        <div className="flex flex-col flex-grow pt-5 bg-white dark:bg-gray-800 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center flex-shrink-0 px-4">
            <Link href="/admin" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Admin Panel
              </h1>
            </Link>
          </div>
          
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href === '/admin' && pathname === '/admin') ||
                  (item.href !== '/admin' && pathname.startsWith(item.href))
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      isActive
                        ? 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white',
                      'group flex items-start px-3 py-3 text-sm font-medium rounded-md transition-colors duration-200'
                    )}
                  >
                    <item.icon
                      className={cn(
                        isActive
                          ? 'text-red-500 dark:text-red-400'
                          : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400',
                        'mr-3 flex-shrink-0 h-5 w-5 mt-0.5'
                      )}
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white">Sim-Bleepy</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Admin Portal</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <nav className="flex justify-around items-center py-2 overflow-x-auto">
          {navigation.slice(0, 4).map((item) => {
            const isActive = pathname === item.href || 
              (item.href === '/admin' && pathname === '/admin') ||
              (item.href !== '/admin' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center py-2 px-3 rounded-lg transition-colors duration-200 min-w-0 flex-1',
                  isActive
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                )}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium truncate">{item.name}</span>
              </Link>
            )
          })}
          {navigation.length > 4 && (
            <div className="flex flex-col items-center py-2 px-3 text-gray-500">
              <span className="text-xs font-medium">+{navigation.length - 4}</span>
            </div>
          )}
        </nav>
      </div>
    </>
  )
}
