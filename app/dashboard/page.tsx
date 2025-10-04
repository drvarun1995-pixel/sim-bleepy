import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Calendar, Stethoscope, BarChart3, Trophy } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return <div>Please sign in to access the dashboard.</div>
  }

  const quickLinks = [
    {
      title: 'Calendar',
      description: 'View upcoming events and sessions',
      icon: Calendar,
      href: '/calendar',
      color: 'bg-blue-500'
    },
    {
      title: 'Stations',
      description: 'Practice with AI patients',
      icon: Stethoscope,
      href: '/stations',
      color: 'bg-purple-500'
    },
    {
      title: 'Overview',
      description: 'View your performance stats',
      icon: BarChart3,
      href: '/dashboard/overview',
      color: 'bg-green-500'
    },
    {
      title: 'Gamification',
      description: 'Track your achievements',
      icon: Trophy,
      href: '/dashboard/gamification',
      color: 'bg-yellow-500'
    }
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
          Welcome back, {session.user.name || 'User'}!
        </h1>
        <p className="text-purple-100 text-sm sm:text-base md:text-lg">
          Ready to continue your medical training journey?
        </p>
      </div>

      {/* Quick Links Grid */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Quick Links
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {quickLinks.map((link) => (
            <a
              key={link.title}
              href={link.href}
              className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:scale-105"
            >
              <div className={`${link.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                <link.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {link.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {link.description}
              </p>
            </a>
          ))}
        </div>
      </div>

      {/* Stats Section - Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sessions Completed</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Streak</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">0 days</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 sm:col-span-2 lg:col-span-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total XP</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
        </div>
      </div>
    </div>
  )
}
