'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Users, Clock, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

interface LiveMetricsData {
  onlineUsers: number
  sessionsInProgress: number
  avgDuration: string
}

interface LiveMetricsPanelProps {
  data: LiveMetricsData
}

export function LiveMetricsPanel({ data }: LiveMetricsPanelProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Mock additional metrics
  const totalUsersToday = 142
  const systemUptime = "99.9%"
  const responseTime = "45ms"

  const liveMetrics = [
    {
      title: 'Users Online',
      value: data.onlineUsers,
      description: 'Active in last 2 minutes',
      icon: Users,
      trend: 'stable' as const,
      color: 'text-blue-600'
    },
    {
      title: 'Sessions in Progress',
      value: data.sessionsInProgress,
      description: 'Currently active',
      icon: Activity,
      trend: 'up' as const,
      color: 'text-green-600'
    },
    {
      title: 'Avg Session Duration',
      value: data.avgDuration,
      description: 'Current active sessions',
      icon: Clock,
      trend: 'stable' as const,
      color: 'text-purple-600'
    },
    {
      title: 'System Uptime',
      value: systemUptime,
      description: 'Last 24 hours',
      icon: TrendingUp,
      trend: 'up' as const,
      color: 'text-green-600'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Live Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {liveMetrics.map((metric, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metric.description}
              </p>
              {/* Live indicator */}
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Recent Activity
            </span>
            <Badge variant="secondary" className="animate-pulse">
              Live
            </Badge>
          </CardTitle>
          <CardDescription>
            Real-time session activity across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium text-sm">Cardiac Emergency</p>
                  <p className="text-xs text-muted-foreground">Emergency Medicine • Started 2m 15s ago</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium text-sm">Respiratory Distress</p>
                  <p className="text-xs text-muted-foreground">Pulmonology • Started 5m 30s ago</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium text-sm">Trauma Assessment</p>
                  <p className="text-xs text-muted-foreground">Emergency Medicine • Started 1m 45s ago</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300">
                Active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>
            Current system health and performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">API Response Time</p>
                <p className="text-xs text-muted-foreground">Average last 5 minutes</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">{responseTime}</p>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Healthy
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Users Today</p>
                <p className="text-xs text-muted-foreground">Unique active users</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">{totalUsersToday}</p>
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  +12% vs yesterday
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-xs text-muted-foreground">Metrics refresh</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-600">
                  {format(currentTime, 'HH:mm:ss')}
                </p>
                <Badge variant="outline">
                  Live
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
