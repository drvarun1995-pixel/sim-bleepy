"use client";

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Users, Target, Stethoscope, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface UserStats {
  totalStations: number
  completedStations: number
  averageScore: number
  role: string
  recentActivity: Array<{
    id: string
    stationName: string
    date: string
    score: number
    maxScore: number
    status: 'PASS' | 'FAIL' | 'INCOMPLETE'
    duration: number
  }>
}

export function OverviewContent() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/user/stats')
        const data = await response.json()
        
        if (data.error) {
          setError(data.error)
        } else {
          setStats(data.stats)
        }
      } catch (err) {
        console.error('Error fetching stats:', err)
        setError('Failed to load statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    })
  }

  const formatDuration = (minutes: number) => {
    const mins = Math.floor(minutes)
    const secs = Math.round((minutes - mins) * 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your statistics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <XCircle className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Unable to load statistics
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome back! Here's your clinical training summary.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stations</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStations || 0}</div>
            <p className="text-xs text-muted-foreground">
              Available clinical scenarios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedStations || 0}</div>
            <p className="text-xs text-muted-foreground">
              Stations completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageScore && stats.averageScore > 0 ? `${stats.averageScore.toFixed(1)}/12` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall performance score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Role</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{stats?.role || 'student'}</div>
            <p className="text-xs text-muted-foreground">
              Your current role
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with your clinical training
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link 
              href="/dashboard" 
              className="block p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Stethoscope className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Start Clinical Stations</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Practice with AI patients</p>
                </div>
              </div>
            </Link>
            <Link 
              href="/dashboard/progress" 
              className="block p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">View Progress</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Check your performance</p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest training sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.status === 'PASS' 
                          ? 'bg-green-100 dark:bg-green-900' 
                          : activity.status === 'FAIL'
                          ? 'bg-red-100 dark:bg-red-900'
                          : 'bg-yellow-100 dark:bg-yellow-900'
                      }`}>
                        {activity.status === 'PASS' ? (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : activity.status === 'FAIL' ? (
                          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{activity.stationName}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {formatDate(activity.date)} • {formatDuration(activity.duration)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {activity.score}/{activity.maxScore}
                      </p>
                      <p className={`text-xs ${
                        activity.status === 'PASS' 
                          ? 'text-green-600 dark:text-green-400' 
                          : activity.status === 'FAIL'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {activity.status}
                      </p>
                    </div>
                  </div>
                ))}
                {stats.recentActivity.length > 3 && (
                  <Link href="/dashboard/progress" className="block text-center text-sm text-blue-600 hover:text-blue-700">
                    View all activity →
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Stethoscope className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity</p>
                <p className="text-sm">Start your first clinical station to see progress here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
