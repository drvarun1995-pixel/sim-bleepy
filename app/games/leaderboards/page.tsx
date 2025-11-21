'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Medal, Award, Crown, RefreshCw, ShieldAlert, Trash2, UserX, Search, X } from 'lucide-react'
import { toast } from 'sonner'

import { BetaNotice } from '@/components/quiz/BetaNotice'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Input } from '@/components/ui/input'

interface QuizLeaderboardEntry {
  rank: number
  total_xp: number
  current_level: number | null
  level_progress: number | null
  user: {
    id?: string
    name: string
    avatar: string | null
  }
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
  if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
  if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />
  return <span className="w-6 h-6 flex items-center justify-center text-gray-500">{rank}</span>
}

function AvatarBubble({ entry }: { entry: QuizLeaderboardEntry }) {
  const initials = useMemo(() => {
    const displayName = entry.user.name || 'A'
    return displayName
      .split(' ')
      .map((part) => part.trim()[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }, [entry.user.name])

  if (entry.user.avatar) {
    return (
      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg">
        <img src={entry.user.avatar} alt={entry.user.name} className="w-full h-full object-cover" />
      </div>
    )
  }

  return (
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 border-white">
      {initials}
    </div>
  )
}

interface ViewerProfileSummary {
  is_public: boolean
  public_display_name: string
  name: string
  public_slug: string | null
}

export default function LeaderboardsPage() {
  const [leaderboard, setLeaderboard] = useState<QuizLeaderboardEntry[]>([])
  const [period, setPeriod] = useState<'all_time' | 'weekly' | 'monthly'>('all_time')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<ViewerProfileSummary | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [toggleLoading, setToggleLoading] = useState(false)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [showUserResetDialog, setShowUserResetDialog] = useState(false)
  const [userResetLoading, setUserResetLoading] = useState(false)
  const [userResetError, setUserResetError] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserName, setSelectedUserName] = useState<string>('')
  const [users, setUsers] = useState<Array<{ id: string; email: string; name: string }>>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ period })
      const response = await fetch(`/api/quiz/leaderboards/quiz?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to load leaderboard')
      const data = await response.json()
      setLeaderboard(data.leaderboard || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    void fetchLeaderboard()
  }, [fetchLeaderboard])

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const response = await fetch('/api/user/role')
        if (response.ok) {
          const data = await response.json()
          setRole(data.role || null)
        } else {
          setRole(null)
        }
      } catch (err) {
        console.error('Failed to fetch user role', err)
        setRole(null)
      } finally {
        setRoleLoading(false)
      }
    }
    void fetchRole()
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (!response.ok) throw new Error('Failed to load profile')
        const data = await response.json()
        if (data?.user) {
          setProfile({
            is_public: !!data.user.is_public,
            public_display_name: data.user.public_display_name || '',
            name: data.user.name || '',
            public_slug: data.user.public_slug || null,
          })
        }
      } catch (err) {
        console.error('Failed to fetch profile summary', err)
      } finally {
        setProfileLoading(false)
      }
    }
    void fetchProfile()
  }, [])

  const handleEnablePublicProfile = async () => {
    if (!profile) return
    try {
      setToggleLoading(true)
      setToggleError(null)
      const fallbackName = profile.public_display_name?.trim() || profile.name || 'Anonymous'
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_public: true,
          public_display_name: fallbackName,
        }),
      })
      if (!response.ok) throw new Error('Failed to update profile visibility')
      const data = await response.json()
      if (data?.user) {
        setProfile({
          is_public: !!data.user.is_public,
          public_display_name: data.user.public_display_name || fallbackName,
          name: data.user.name || profile.name,
          public_slug: data.user.public_slug || profile.public_slug,
        })
      }
    } catch (err) {
      setToggleError(err instanceof Error ? err.message : 'Unable to update visibility')
    } finally {
      setToggleLoading(false)
    }
  }

  const topThree = leaderboard.slice(0, 3)
  const restOfBoard = leaderboard.slice(3)
  const canResetLeaderboard = !roleLoading && (role === 'admin' || role === 'meded_team')

  // Fetch users for user-specific reset
  const fetchUsers = useCallback(async () => {
    if (!canResetLeaderboard) return
    
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
  }, [canResetLeaderboard])

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

  const handleResetUserLeaderboard = useCallback(async () => {
    if (!selectedUserId) return
    
    try {
      setUserResetLoading(true)
      setUserResetError(null)
      const response = await fetch('/api/quiz/leaderboards/quiz/reset-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Unable to reset user leaderboard')
      }
      const data = await response.json()
      toast.success('User leaderboard reset', {
        description: data.message || `Quiz XP data cleared for ${selectedUserName || 'user'}.`,
      })
      setShowUserResetDialog(false)
      setSelectedUserId(null)
      setSelectedUserName('')
      setUserSearchTerm('')
      await fetchLeaderboard()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reset user leaderboard'
      setUserResetError(message)
      toast.error('Reset failed', { description: message })
    } finally {
      setUserResetLoading(false)
    }
  }, [selectedUserId, selectedUserName, fetchLeaderboard])

  const handleResetLeaderboard = useCallback(async () => {
    try {
      setResetLoading(true)
      setResetError(null)
      const response = await fetch('/api/quiz/leaderboards/quiz/reset', {
        method: 'POST',
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Unable to reset leaderboard')
      }
      toast.success('Quiz leaderboard reset', {
        description: 'All quiz XP data has been cleared.',
      })
      setShowResetDialog(false)
      await fetchLeaderboard()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reset leaderboard'
      setResetError(message)
      toast.error('Reset failed', { description: message })
    } finally {
      setResetLoading(false)
    }
  }, [fetchLeaderboard])

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <BetaNotice />

      {!profileLoading && profile && !profile.is_public && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 shadow-sm"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-indigo-100 p-2 text-indigo-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-900">Public profile required</p>
                <p className="text-sm text-indigo-800">
                  Toggle on your public profile to appear on both the simulator and quiz leaderboards (visible only to logged-in members).
                </p>
              </div>
            </div>
            <Button
              onClick={handleEnablePublicProfile}
              disabled={toggleLoading}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-60"
            >
              {toggleLoading ? 'Enabling…' : 'Enable public profile'}
            </Button>
          </div>
          {toggleError && <p className="mt-2 text-xs text-red-600">{toggleError}</p>}
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl">
            <Crown className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            Quiz Leaderboard
          </h1>
        </div>
        <p className="text-gray-600 text-lg">Track the top performers from practice and challenge modes</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col gap-4"
      >
          <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600" htmlFor="leaderboard-period">
                Period
              </label>
              <select
                id="leaderboard-period"
                value={period}
                onChange={(e) => setPeriod(e.target.value as 'all_time' | 'weekly' | 'monthly')}
                className="px-4 py-2 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm font-medium"
              >
                <option value="all_time">All Time (live)</option>
                <option value="weekly">Weekly Snapshot</option>
                <option value="monthly">Monthly Snapshot</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void fetchLeaderboard()}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-indigo-200 text-indigo-700 font-medium hover:bg-indigo-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <p className="text-xs text-gray-500">
                Weekly/monthly views fall back to live rankings until snapshots are ready.
              </p>
            </div>

            {canResetLeaderboard && (
              <div className="flex flex-col gap-2 lg:ml-auto lg:items-end">
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
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      setResetError(null)
                      setShowResetDialog(true)
                    }}
                    className="rounded-xl px-4 py-2 text-sm font-semibold"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Reset All
                  </Button>
                </div>
                {resetError && (
                  <p className="text-xs text-red-600 max-w-xs text-right">{resetError}</p>
                )}
                {userResetError && (
                  <p className="text-xs text-red-600 max-w-xs text-right">{userResetError}</p>
                )}
              </div>
            )}
          </div>
      </motion.div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading leaderboard...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-dashed border-indigo-200 rounded-2xl py-16 text-center space-y-3">
          <Crown className="w-16 h-16 text-indigo-300 mx-auto" />
          <p className="text-xl font-semibold text-gray-700">No entries yet</p>
          <p className="text-gray-500">
            Play practice sessions or challenges to become one of the first people on the leaderboard.
          </p>
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl px-4 sm:px-6 py-8"
          >
            <h2 className="text-center text-xl font-semibold text-indigo-900 mb-6">Podium</h2>
            <div className="grid gap-4 sm:grid-cols-3 justify-items-center">
              {topThree.map((entry, index) => (
                <motion.div
                  key={entry.rank}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`w-full max-w-xs bg-white rounded-2xl shadow-lg p-5 text-center border-2 ${
                    index === 0
                      ? 'border-yellow-200'
                      : index === 1
                      ? 'border-indigo-100'
                      : 'border-purple-100'
                  }`}
                >
                  <div className="flex justify-center mb-3">
                    <AvatarBubble entry={entry} />
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <RankIcon rank={entry.rank} />
                    <span className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                      #{entry.rank}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{entry.user.name || 'Anonymous'}</p>
                  <p className="text-3xl font-extrabold text-indigo-700 mt-2">{entry.total_xp.toLocaleString()} XP</p>
                  <p className="text-sm text-gray-500">Level {entry.current_level ?? '-'}</p>
                  {typeof entry.level_progress === 'number' && (
                    <div className="mt-3">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                          style={{
                            width: `${Math.min(100, (entry.level_progress / 1000) * 100)}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">towards next level</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {restOfBoard.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        XP
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Level
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {restOfBoard.map((entry) => (
                      <tr key={entry.rank} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <RankIcon rank={entry.rank} />
                            {entry.rank > 3 && (
                              <span className="text-gray-600 font-semibold text-sm">#{entry.rank}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">{entry.user.name || 'Anonymous'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-indigo-700 font-bold">{entry.total_xp.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">Lv {entry.current_level ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-6 md:grid-cols-2"
      >
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">How XP works</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Earn XP by finishing practice sessions and multiplayer challenges.</li>
            <li>• Base XP comes from correct answers, speed bonuses, and challenge placements.</li>
            <li>• Weekly and monthly snapshots capture standings at the time they’re generated.</li>
            <li>• Make sure your profile is public to appear on the leaderboard.</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Climb the rankings</h3>
          <p className="text-sm text-indigo-100 mb-4">
            Host challenges with friends, replay practice sets, and aim for perfect streaks to keep your name in the
            spotlight.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/games/practice"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white text-indigo-600 font-semibold shadow hover:bg-indigo-50 transition"
            >
              Start a practice session
            </Link>
            <Link
              href="/games/challenge"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-white/70 text-white font-semibold shadow hover:bg-white/10 transition"
            >
              Host a challenge
            </Link>
          </div>
        </div>
      </motion.div>

      <ConfirmationDialog
        open={showResetDialog}
        onOpenChange={(open) => {
          if (resetLoading) return
          if (!open) {
            setResetError(null)
          }
          setShowResetDialog(open)
        }}
        onConfirm={() => void handleResetLeaderboard()}
        title="Reset quiz leaderboard?"
        description="This will remove all quiz XP, transactions, and snapshot rankings for every player. This action cannot be undone."
        confirmText="Reset leaderboard"
        cancelText="Keep leaderboard"
        variant="destructive"
        isLoading={resetLoading}
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
            void handleResetUserLeaderboard()
          } else {
            setUserResetError('Please select a user')
          }
        }}
        title="Reset user leaderboard?"
        className="sm:max-w-lg"
        description={
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This will remove all quiz XP, transactions, and snapshot rankings for the selected user. This action cannot be undone.
            </p>
            
            {/* User Search and Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Select User</label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearchTerm}
                    onChange={(e) => {
                      setUserSearchTerm(e.target.value)
                      setShowUserDropdown(true)
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
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* User Dropdown */}
                <AnimatePresence>
                  {showUserDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserDropdown(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      >
                        {usersLoading ? (
                          <div className="p-4 text-center text-sm text-gray-500">Loading users...</div>
                        ) : filteredUsers.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-500">No users found</div>
                        ) : (
                          <div className="p-2 space-y-1">
                            {filteredUsers.slice(0, 50).map((user) => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => {
                                  setSelectedUserId(user.id)
                                  setSelectedUserName(user.name || user.email)
                                  setUserSearchTerm(user.name || user.email)
                                  setShowUserDropdown(false)
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors ${
                                  selectedUserId === user.id ? 'bg-blue-100 border border-blue-300' : ''
                                }`}
                              >
                                <div className="font-medium text-sm text-gray-900">{user.name || 'No name'}</div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                              </button>
                            ))}
                            {filteredUsers.length > 50 && (
                              <div className="p-2 text-xs text-gray-500 text-center">
                                Showing first 50 results. Refine your search for more.
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Selected User Display */}
              {selectedUserId && selectedUserName && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-blue-900">Selected: {selectedUserName}</div>
                      <div className="text-xs text-blue-700">
                        {users.find(u => u.id === selectedUserId)?.email}
                      </div>
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
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        }
        confirmText={selectedUserId ? "Reset user leaderboard" : "Select a user first"}
        cancelText="Cancel"
        variant="destructive"
        isLoading={userResetLoading}
        disabled={!selectedUserId || userResetLoading}
      />
    </div>
  )
}

