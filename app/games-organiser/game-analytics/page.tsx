'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  Target,
  Clock,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  User,
  Settings,
  ChevronDown,
  ChevronUp,
  UserX,
  Search,
  X,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCallback } from 'react'

interface ChallengeLog {
  id: string
  code: string
  status: string
  createdAt: string
  questionCount: number
  timeLimit: number | null
  categories: string[]
  difficulties: string[]
  host: {
    name: string
    email: string
  }
  participants: {
    id: string
    name: string
    email: string
    status: string
  }[]
}

interface PracticeLog {
  id: string
  startedAt: string
  completed: boolean
  category: string
  difficulty: string
  timeLimit: number | null
  questionCount: number | null
  score: number | null
  user: {
    name: string
    email: string
  }
}

interface PerformanceTrendPoint {
  date: string
  practiceSessions: number
  challengesHosted: number
}

export default function GameAnalyticsPage() {
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalSessions: 0,
    totalUsers: 0,
    averageScore: 0,
    completionRate: 0,
    averageTime: 0,
  })
  const [challengeLogs, setChallengeLogs] = useState<ChallengeLog[]>([])
  const [practiceLogs, setPracticeLogs] = useState<PracticeLog[]>([])
  const [performanceTrends, setPerformanceTrends] = useState<PerformanceTrendPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [confirmState, setConfirmState] = useState<'closed' | 'overview' | 'final'>('closed')
  const [challengePage, setChallengePage] = useState(1)
  const [practicePage, setPracticePage] = useState(1)
  const [dateFilter, setDateFilter] = useState('0') // 0 = all time, 1 = 24h, 7 = 7d, 30 = 30d
  
  // User-specific reset state
  const [showUserResetDialog, setShowUserResetDialog] = useState(false)
  const [userResetLoading, setUserResetLoading] = useState(false)
  const [userResetError, setUserResetError] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserName, setSelectedUserName] = useState('')
  const [users, setUsers] = useState<Array<{ id: string; name: string | null; email: string }>>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  // Fetch users for user-specific reset
  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true)
      const response = await fetch('/api/admin/users?limit=1000')
      if (!response.ok) throw new Error('Failed to load users')
      const data = await response.json()
      setUsers(data.users || [])
    } catch (err) {
      console.error('Error fetching users:', err)
      setUsers([])
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (showUserResetDialog && users.length === 0) {
      fetchUsers()
    }
  }, [showUserResetDialog, users.length, fetchUsers])

  const filteredUsers = users.filter(user => {
    const searchLower = userSearchTerm.toLowerCase()
    return (
      user.email.toLowerCase().includes(searchLower) ||
      (user.name || '').toLowerCase().includes(searchLower)
    )
  })

  const handleResetUserAnalytics = useCallback(async () => {
    if (!selectedUserId) return
    
    setUserResetLoading(true)
    setUserResetError(null)
    
    try {
      const response = await fetch('/api/quiz/analytics/reset-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset user analytics')
      }

      if (data.partialSuccess) {
        toast.warning('Analytics partially cleared', {
          description: data.error || 'Some data could not be cleared. Check the console for details.',
          duration: 7000,
        })
        console.error('Partial success details:', data.details)
      } else {
        toast.success('User analytics cleared successfully', {
          description: data.message || `Analytics data for ${selectedUserName} has been deleted.`,
          duration: 5000,
        })
      }

      // Refresh analytics
      setLoading(true)
      try {
        const params = new URLSearchParams({ period: dateFilter })
        const fetchResponse = await fetch(`/api/quiz/analytics?${params}`)
        if (fetchResponse.ok) {
          const fetchData = await fetchResponse.json()
          setStats(
            fetchData.stats || {
              totalQuestions: 0,
              totalSessions: 0,
              totalUsers: 0,
              averageScore: 0,
              completionRate: 0,
              averageTime: 0,
            }
          )
          setChallengeLogs(fetchData.challengeLogs || [])
          setPracticeLogs(fetchData.practiceLogs || [])
          setPerformanceTrends(fetchData.performanceTrends || [])
        }
      } catch (fetchError) {
        console.error('Error refreshing analytics:', fetchError)
      } finally {
        setLoading(false)
      }

      // Close dialog and reset state
      setShowUserResetDialog(false)
      setSelectedUserId(null)
      setSelectedUserName('')
      setUserSearchTerm('')
      setShowUserDropdown(false)
    } catch (error: any) {
      console.error('Error resetting user analytics:', error)
      setUserResetError(error.message || 'An error occurred while resetting user analytics.')
      toast.error('Failed to reset user analytics', {
        description: error.message || 'An error occurred while resetting user analytics.',
        duration: 5000,
      })
    } finally {
      setUserResetLoading(false)
    }
  }, [selectedUserId, selectedUserName, dateFilter])

  useEffect(() => {
    // Fetch analytics data from API
    const fetchAnalytics = async () => {
      try {
        const params = new URLSearchParams({ period: dateFilter })
        const response = await fetch(`/api/quiz/analytics?${params}`)
        if (!response.ok) throw new Error('Failed to fetch analytics')
        const data = await response.json()
        setStats(
          data.stats || {
            totalQuestions: 0,
            totalSessions: 0,
            totalUsers: 0,
            averageScore: 0,
            completionRate: 0,
            averageTime: 0,
          }
        )
        setChallengeLogs(data.challengeLogs || [])
        setPracticeLogs(data.practiceLogs || [])
        setPerformanceTrends(data.performanceTrends || [])
      } catch (error) {
        console.error('Error fetching analytics:', error)
        // Keep default values on error
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [dateFilter])

  const openClearDialog = () => {
    setConfirmState('overview')
  }

  const closeConfirmDialogs = () => {
    if (!clearing) {
      setConfirmState('closed')
    }
  }

  const performanceMax = useMemo(() => {
    if (!performanceTrends.length) return 1
    return Math.max(
      1,
      ...performanceTrends.map(
        (point) => point.practiceSessions + point.challengesHosted
      )
    )
  }, [performanceTrends])

  const executeClearAnalytics = async () => {
    setClearing(true)
    try {
      const response = await fetch('/api/quiz/analytics', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to clear analytics')
      }

      // Check if it was a partial success
      if (data.partialSuccess) {
        toast.warning('Analytics partially cleared', {
          description: data.error || 'Some data could not be cleared. Check the console for details.',
          duration: 7000,
        })
        console.error('Partial success details:', data.details)
      } else {
        toast.success('Analytics cleared successfully', {
          description: 'All analytics data has been deleted. Questions, categories, and campaigns have been preserved.',
          duration: 5000,
        })
      }

      // Refresh analytics (will show zeros or updated stats)
      setLoading(true)
      try {
        const params = new URLSearchParams({ period: dateFilter })
        const fetchResponse = await fetch(`/api/quiz/analytics?${params}`)
        if (fetchResponse.ok) {
          const fetchData = await fetchResponse.json()
          setStats(
            fetchData.stats || {
              totalQuestions: 0,
              totalSessions: 0,
              totalUsers: 0,
              averageScore: 0,
              completionRate: 0,
              averageTime: 0,
            }
          )
          setChallengeLogs(fetchData.challengeLogs || [])
          setPracticeLogs(fetchData.practiceLogs || [])
          setPerformanceTrends(fetchData.performanceTrends || [])
        }
      } catch (fetchError) {
        console.error('Error refreshing analytics:', fetchError)
      } finally {
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Error clearing analytics:', error)
      toast.error('Failed to clear analytics', {
        description: error.message || 'An error occurred while clearing analytics data.',
        duration: 5000,
      })
    } finally {
      setClearing(false)
      setConfirmState('closed')
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Questions',
      value: stats.totalQuestions.toLocaleString(),
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Practice Sessions',
      value: stats.totalSessions.toLocaleString(),
      icon: Clock,
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100',
      borderColor: 'border-green-200',
    },
    {
      title: 'Active Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
    },
    {
      title: 'Average Score',
      value: `${stats.averageScore}%`,
      icon: Target,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'from-orange-50 to-orange-100',
      borderColor: 'border-orange-200',
    },
    {
      title: 'Completion Rate',
      value: `${stats.completionRate}%`,
      icon: CheckCircle2,
      color: 'from-teal-500 to-teal-600',
      bgColor: 'from-teal-50 to-teal-100',
      borderColor: 'border-teal-200',
    },
    {
      title: 'Avg Time/Question',
      value: `${stats.averageTime}s`,
      icon: TrendingUp,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'from-pink-50 to-pink-100',
      borderColor: 'border-pink-200',
    },
  ]

  const formatDateLabel = (isoDate: string) => {
    const date = new Date(isoDate)
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  const challengesPerPage = 10
  const practicesPerPage = 10
  const paginatedChallenges = challengeLogs.slice(0, challengePage * challengesPerPage)
  const paginatedPractices = practiceLogs.slice(0, practicePage * practicesPerPage)
  const hasMoreChallenges = challengeLogs.length > paginatedChallenges.length
  const hasMorePractices = practiceLogs.length > paginatedPractices.length
  const performanceChartData = performanceTrends.map((point) => ({
    date: formatDateLabel(point.date),
    practice: point.practiceSessions,
    challenges: point.challengesHosted,
  }))
  const hasPerformanceData = performanceTrends.some(
    (point) => point.practiceSessions > 0 || point.challengesHosted > 0
  )

  return (
    <>
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Game Analytics
          </h1>
          <p className="text-gray-600 mt-2">Track performance and engagement metrics</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <BarChart3 className="w-5 h-5" />
            <span>Last updated: Just now</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Time Period:</label>
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="0">All time</option>
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setUserResetError(null)
                setSelectedUserId(null)
                setSelectedUserName('')
                setUserSearchTerm('')
                setShowUserResetDialog(true)
              }}
              className="rounded-xl px-4 py-2 text-sm font-semibold border-orange-300 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
            >
              <UserX className="h-4 w-4 mr-2" />
              Reset User
            </Button>
            <button
              onClick={openClearDialog}
              disabled={clearing}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors font-semibold shadow-sm"
            >
              {clearing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Clearing...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Analytics</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Warning Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-yellow-800">Analytics Data</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Clearing analytics will permanently delete all sessions, answers, leaderboards, and user progress. 
              Questions, categories, and campaigns will be preserved.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.05 }}
            className={`bg-gradient-to-br ${stat.bgColor} p-6 rounded-xl border ${stat.borderColor} shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid gap-6"
      >
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Performance Trends
            {dateFilter === '0' ? ' (All Time)' :
             dateFilter === '1' ? ' (Last 24 Hours)' :
             dateFilter === '7' ? ' (Last 7 Days)' :
             dateFilter === '30' ? ' (Last 30 Days)' : ' (All Time)'}
          </h3>
          {!performanceTrends.length ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No activity in the last two weeks</p>
              </div>
            </div>
          ) : hasPerformanceData ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="practice"
                    stroke="#2563eb"
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                    name="Practice sessions"
                  />
                  <Line
                    type="monotone"
                    dataKey="challenges"
                    stroke="#a855f7"
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                    name="Challenges hosted"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No practice or challenge activity recorded.</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Challenge Logs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Recent Multiplayer Challenges
            </h2>
            <p className="text-sm text-gray-500">
              Host, participants, and lobby settings for the latest hosted sessions
            </p>
          </div>
        </div>
        {challengeLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No challenges hosted yet.
          </div>
        ) : (
      <div className="space-y-4">
        {paginatedChallenges.map((challenge) => (
              <div
                key={challenge.id}
                className="border border-gray-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Challenge code</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {challenge.code}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                      {challenge.status}
                    </span>
                    {challenge.categories.length > 0 && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 flex items-center gap-1">
                        <Settings className="w-3 h-3" />
                        {challenge.categories.join(', ')}
                      </span>
                    )}
                    {challenge.difficulties.length > 0 && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                        {challenge.difficulties.join(', ')}
                      </span>
                    )}

        {challengeLogs.length > challengesPerPage && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setChallengePage((prev) => Math.max(1, prev - 1))}
              disabled={challengePage === 1}
              className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 disabled:opacity-40"
            >
              <ChevronUp className="w-4 h-4" />
              Show less
            </button>
            <span className="text-xs text-gray-400">
              Showing {paginatedChallenges.length} of {challengeLogs.length}
            </span>
            <button
              type="button"
              onClick={() => setChallengePage((prev) => prev + 1)}
              disabled={!hasMoreChallenges}
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 disabled:opacity-40"
            >
              Show 10 more
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase text-gray-500 tracking-wide">Host</p>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {challenge.host.name}
                    </p>
                    <p className="text-xs text-gray-500">{challenge.host.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700">
                      {challenge.questionCount || 10} questions
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700">
                      {challenge.timeLimit || 60}s per question
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700">
                      {new Date(challenge.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs uppercase text-gray-500 tracking-wide mb-2">
                    Participants ({challenge.participants.length})
                  </p>
                  {challenge.participants.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No players joined this lobby.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {challenge.participants.map((participant) => (
                        <span
                          key={participant.id}
                          className="px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs font-medium text-gray-700"
                        >
                          {participant.name || 'Unknown'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Practice Logs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Recent Practice Sessions
            </h2>
            <p className="text-sm text-gray-500">
              Individual practice attempts with chosen settings
            </p>
          </div>
        </div>
        {practiceLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No practice data yet.</div>
        ) : (
      <div className="space-y-3">
        {paginatedPractices.map((session) => (
              <div
                key={session.id}
                className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-gray-500">{session.user.email}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(session.startedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                  <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100">
                    {session.category}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-100">
                    {session.difficulty}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200">
                    {session.questionCount || 10} Q • {session.timeLimit || 60}s
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full border ${
                      session.completed
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    {session.completed ? 'Completed' : 'Incomplete'}
                  </span>
                  {session.score !== null && session.score !== undefined && (
                    <span className="px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700">
                      Score: {(() => {
                        // Score is stored as total points (100 points per correct answer)
                        // To convert to percentage: (score / 100) / questionCount * 100 = score / questionCount
                        if (session.questionCount && session.questionCount > 0) {
                          const percentage = (session.score / session.questionCount)
                          return Math.min(100, Math.max(0, percentage)).toFixed(0)
                        }
                        // Fallback: if no questionCount, assume score is already a percentage (shouldn't happen)
                        return Math.min(100, Math.max(0, session.score)).toFixed(0)
                      })()}%
                    </span>
                  )}

        {practiceLogs.length > practicesPerPage && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPracticePage((prev) => Math.max(1, prev - 1))}
              disabled={practicePage === 1}
              className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 disabled:opacity-40"
            >
              <ChevronUp className="w-4 h-4" />
              Show less
            </button>
            <span className="text-xs text-gray-400">
              Showing {paginatedPractices.length} of {practiceLogs.length}
            </span>
            <button
              type="button"
              onClick={() => setPracticePage((prev) => prev + 1)}
              disabled={!hasMorePractices}
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 disabled:opacity-40"
            >
              Show 10 more
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>

    <ConfirmationDialog
      open={confirmState === 'overview'}
      onOpenChange={(open) => {
        if (!open) closeConfirmDialogs()
      }}
      onConfirm={() => setConfirmState('final')}
      onCancel={closeConfirmDialogs}
      variant="warning"
      icon={<ShieldAlert className="h-6 w-6 text-orange-500" />}
      title="Delete analytics data?"
      description={`This will permanently delete practice sessions, challenge data, leaderboards, and user progress. Questions, categories, and campaigns stay intact.`}
      confirmText="Continue"
      cancelText="Keep data"
    />
    
    <ConfirmationDialog
      open={confirmState === 'final'}
      onOpenChange={(open) => {
        if (!open && !clearing) closeConfirmDialogs()
      }}
      onConfirm={executeClearAnalytics}
      onCancel={() => {
        if (!clearing) setConfirmState('overview')
      }}
      isLoading={clearing}
      variant="destructive"
      icon={<ShieldCheck className="h-6 w-6 text-red-500" />}
      title="This action cannot be undone"
      description="All analytics data will be wiped immediately. Leaderboards, sessions, participants, and user progress will be zeroed out. Are you absolutely sure?"
      confirmText={clearing ? 'Clearing…' : 'Delete analytics'}
      cancelText="Back"
      className="max-w-lg"
    />

    {/* User-Specific Reset Dialog */}
    <ConfirmationDialog
      open={showUserResetDialog}
      onOpenChange={(open) => {
        if (userResetLoading) return
        if (!open) {
          setUserResetError(null)
          setSelectedUserId(null)
          setSelectedUserName('')
          setUserSearchTerm('')
          setShowUserDropdown(false)
        }
        setShowUserResetDialog(open)
      }}
      onConfirm={() => {
        if (selectedUserId) {
          void handleResetUserAnalytics()
        } else {
          setUserResetError('Please select a user')
        }
      }}
      title="Reset user analytics?"
      className="sm:max-w-lg"
      disabled={!selectedUserId || userResetLoading}
      isLoading={userResetLoading}
      variant="warning"
      icon={<ShieldAlert className="h-6 w-6 text-orange-500" />}
      confirmText={userResetLoading ? 'Resetting…' : 'Reset user analytics'}
      cancelText="Cancel"
      description={
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will permanently delete all analytics data for the selected user, including practice sessions, challenge data, leaderboard entries, and user progress.
          </p>
          
          {/* User Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Select User</label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={userSearchTerm}
                  onChange={(e) => {
                    setUserSearchTerm(e.target.value)
                    setShowUserDropdown(true)
                    if (!e.target.value) {
                      setSelectedUserId(null)
                      setSelectedUserName('')
                    }
                  }}
                  onFocus={() => setShowUserDropdown(true)}
                  className="pl-10 pr-10"
                />
                {userSearchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserSearchTerm('')
                      setSelectedUserId(null)
                      setSelectedUserName('')
                      setShowUserDropdown(false)
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Dropdown */}
              {showUserDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserDropdown(false)}
                  />
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {usersLoading ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Loading users...
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        {userSearchTerm ? 'No users found' : 'Start typing to search...'}
                      </div>
                    ) : (
                      filteredUsers.slice(0, 50).map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setSelectedUserId(user.id)
                            setSelectedUserName(user.name || user.email)
                            setUserSearchTerm(user.name || user.email)
                            setShowUserDropdown(false)
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-sm text-gray-900">
                            {user.name || 'No name'}
                          </div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Selected User Display */}
          {selectedUserId && selectedUserName && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Selected User</p>
                  <p className="text-sm text-blue-700">{selectedUserName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserId(null)
                    setSelectedUserName('')
                    setUserSearchTerm('')
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {userResetError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{userResetError}</p>
            </div>
          )}
        </div>
      }
    />
    </>
  )
}

