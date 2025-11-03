'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Trash2, RefreshCw, Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface LogEntry {
  id: string
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  context?: Record<string, any>
  stack?: string
  user_id?: string
  user_email?: string
  api_route?: string
  created_at: string
}

export default function LogsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [limit] = useState(50)
  const [offset, setOffset] = useState(0)

  // Filters
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [apiRouteFilter, setApiRouteFilter] = useState('')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Check if user is admin
    checkAdminAccess()
  }, [session, status, router])

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/user/role')
      if (response.ok) {
        const { role } = await response.json()
        if (role !== 'admin') {
          router.push('/dashboard')
          return
        }
        // Load logs if admin
        fetchLogs()
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Failed to check admin access:', error)
      router.push('/dashboard')
    }
  }

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      })

      if (levelFilter !== 'all') {
        params.append('level', levelFilter)
      }

      if (searchQuery) {
        params.append('search', searchQuery)
      }

      if (apiRouteFilter) {
        params.append('apiRoute', apiRouteFilter)
      }

      const response = await fetch(`/api/logs?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
        setTotal(data.total || 0)
      } else {
        toast.error('Failed to fetch logs')
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
      toast.error('Failed to fetch logs')
    } finally {
      setLoading(false)
    }
  }

  const clearOldLogs = async () => {
    if (!confirm('Are you sure you want to delete logs older than 30 days? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysToKeep: 30 })
      })

      if (response.ok) {
        toast.success('Old logs deleted successfully')
        fetchLogs()
      } else {
        toast.error('Failed to delete logs')
      }
    } catch (error) {
      console.error('Error deleting logs:', error)
      toast.error('Failed to delete logs')
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && session) {
      fetchLogs()
    }
  }, [offset, levelFilter, searchQuery, apiRouteFilter])

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'warn':
        return <Badge className="bg-yellow-500">Warning</Badge>
      case 'info':
        return <Badge className="bg-blue-500">Info</Badge>
      case 'debug':
        return <Badge className="bg-gray-500">Debug</Badge>
      default:
        return <Badge>{level}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  if (status === 'loading') {
    return (
      <DashboardLayoutClient role="admin" userName={undefined}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600 dark:text-gray-400">Loading logs...</p>
        </div>
      </DashboardLayoutClient>
    )
  }

  return (
    <DashboardLayoutClient role="admin" userName={session?.user?.name as string | undefined}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <AlertCircle className="h-6 w-6 text-blue-600" />
              <span>System Logs</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View errors and important system events
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchLogs}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={clearOldLogs}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Old Logs
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Level</label>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="error">Errors</SelectItem>
                    <SelectItem value="warn">Warnings</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">API Route</label>
                <Input
                  placeholder="Filter by API route..."
                  value={apiRouteFilter}
                  onChange={(e) => setApiRouteFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Log Entries ({total})</CardTitle>
            <CardDescription>
              Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No logs found
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getLevelBadge(log.level)}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                      {log.api_route && (
                        <Badge variant="outline" className="text-xs">
                          {log.api_route}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-900 dark:text-white mb-2 font-medium">
                      {log.message}
                    </p>
                    {log.user_email && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        User: {log.user_email}
                      </p>
                    )}
                    {log.context && Object.keys(log.context).length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                          View Context
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto">
                          {JSON.stringify(log.context, null, 2)}
                        </pre>
                      </details>
                    )}
                    {log.stack && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                          View Stack Trace
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto">
                          {log.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {total > limit && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {offset + 1} to {Math.min(offset + limit, total)} of {total}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0 || loading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset(offset + limit)}
                    disabled={offset + limit >= total || loading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayoutClient>
  )
}

