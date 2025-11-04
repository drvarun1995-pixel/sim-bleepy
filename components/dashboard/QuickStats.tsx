'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Calendar, CheckCircle, Clock, TrendingUp } from 'lucide-react'

interface QuickStatsProps {
  todayCount: number
  weekCount: number
  monthCount: number
  upcomingCount: number
}

export function QuickStats({ todayCount, weekCount, monthCount, upcomingCount }: QuickStatsProps) {
  const stats = [
    {
      label: 'Today',
      value: todayCount,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      label: 'This Week',
      value: weekCount,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'This Month',
      value: monthCount,
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Total Upcoming',
      value: upcomingCount,
      icon: CheckCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-tour="quick-stats">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} ${stat.color} p-2 sm:p-3 rounded-lg`}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
