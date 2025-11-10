"use client"

import { useCallback, useEffect, useMemo, useState, startTransition } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { toast } from 'sonner'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { formatDistanceToNow } from 'date-fns'
import {
  Loader2,
  UserPlus,
  ShieldCheck,
  Handshake,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Users,
  Lightbulb,
  FlagTriangleRight,
  FlaskConical,
} from 'lucide-react'

const humanizeRoleType = (roleType?: string | null) => {
  if (!roleType) return null
  if (roleType === 'meded_team') return 'MedEd Team'
  return roleType.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase())
}

const shouldShowRoleTypeBadge = (platformRole?: string | null, roleType?: string | null) => {
  if (!roleType) return false
  if (roleType === 'meded_team' && platformRole !== 'meded_team') return false
  return true
}

interface ProfileSummary {
  id: string
  name: string | null
  public_display_name: string | null
  public_slug: string | null
  is_public: boolean | null
  allow_messages: boolean | null
  avatar_type: string | null
  avatar_asset: string | null
  avatar_thumbnail?: string | null
  profile_picture_url: string | null
  role: string | null
  role_type: string | null
  university: string | null
  specialty: string | null
  mutual_connection_count?: number | null
}

interface ConnectionListItem {
  id: string
  requester_id: string
  addressee_id: string
  connection_type: 'friend' | 'mentor'
  status: 'pending' | 'accepted' | 'blocked' | 'snoozed' | 'declined'
  initiated_by_viewer: boolean
  requested_at: string
  responded_at: string | null
  snoozed_until: string | null
  notes: string | null
  counterpart: ProfileSummary
  mutual_connection_count: number
  mutual_connection_ids: string[]
}

interface NetworkResponse {
  viewer: {
    id: string
    name: string | null
    role: string | null
    public_display_name: string | null
    isStaff: boolean
    pauseConnectionRequests: boolean
  }
  metrics: {
    pendingTotal: number
    pendingIncoming: number
    pendingOutgoing: number
    friends: number
    mentors: number
    blocked: number
  }
  connections: {
    pending: ConnectionListItem[]
    friends: ConnectionListItem[]
    mentors: ConnectionListItem[]
    blocked: ConnectionListItem[]
    accepted: ConnectionListItem[]
  }
  suggestions: ProfileSummary[]
}

const fetcher = async <T = unknown>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: 'no-store' })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load data')
  }
  return data as T
}

const toInitials = (value: string | null | undefined) => {
  if (!value) return 'BP'
  const parts = value.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const formatRelativeTime = (iso?: string | null) => {
  if (!iso) return null
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true })
  } catch {
    return null
  }
}

const resolveAvatarSrc = (path?: string | null) => {
  if (!path) return null
  return path.startsWith('/') ? path : `/${path}`
}

const formatMutualLabel = (count?: number | null) => {
  if (!count || count <= 0) return null
  return count === 1 ? '1 mutual connection' : `${count} mutual connections`
}

const reportButtonClasses =
  'inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-1'

type ConnectionTab = 'pending' | 'friends' | 'mentors' | 'suggestions' | 'blocked'

const TAB_LABELS: Record<ConnectionTab, string> = {
  suggestions: 'Suggestions',
  pending: 'Pending',
  friends: 'Friends',
  mentors: 'Mentors',
  blocked: 'Blocked',
}

const TAB_ORDER: ConnectionTab[] = ['suggestions', 'pending', 'friends', 'mentors', 'blocked']

type ReportContext = {
  targetUserId: string
  connectionId?: string
  displayName?: string
}

interface SearchResponse {
  results: ProfileSummary[]
}

interface ConnectionsDashboardProps {
  visibleTabs?: ConnectionTab[]
  defaultTab?: ConnectionTab
}

export default function ConnectionsDashboard({
  visibleTabs = TAB_ORDER,
  defaultTab = 'suggestions',
}: ConnectionsDashboardProps) {
  const normalizedVisibleTabs = useMemo<ConnectionTab[]>(
    () => TAB_ORDER.filter((tab) => visibleTabs.includes(tab)),
    [visibleTabs],
  )

  const initialTab = normalizedVisibleTabs.includes(defaultTab)
    ? defaultTab
    : normalizedVisibleTabs[0] ?? 'pending'

  const [activeTab, setActiveTab] = useState<ConnectionTab>(initialTab)
  useEffect(() => {
    if (!normalizedVisibleTabs.length) {
      return
    }

    if (!normalizedVisibleTabs.includes(activeTab)) {
      setActiveTab(normalizedVisibleTabs[0])
    }
  }, [normalizedVisibleTabs, activeTab])

  const [togglingPause, setTogglingPause] = useState(false)
  const [isLoadingAction, setIsLoadingAction] = useState<string | null>(null)
  const [pendingIncomingLimit, setPendingIncomingLimit] = useState(10)
  const [pendingOutgoingLimit, setPendingOutgoingLimit] = useState(10)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [reportContext, setReportContext] = useState<ReportContext | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)

  const { data, error, isLoading, mutate } = useSWR<NetworkResponse>(
    '/api/network',
    fetcher,
    {
      revalidateOnFocus: false,
    },
  )

  const shouldSearch = debouncedSearch.length >= 2
  const {
    data: searchResults,
    error: searchError,
    isLoading: isSearching,
  } = useSWR<SearchResponse>(
    shouldSearch ? `/api/network/search?query=${encodeURIComponent(debouncedSearch)}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  )

  const isReportDialogOpen = Boolean(reportContext)

  const handleReportDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !isSubmittingReport) {
        setReportContext(null)
        setReportReason('')
      }
    },
    [isSubmittingReport],
  )

  const openReportDialog = useCallback((context: ReportContext) => {
    setReportContext(context)
    setReportReason('')
  }, [])

  const submitReport = useCallback(async () => {
    if (!reportContext) return

    const trimmedReason = reportReason.trim()
    if (!trimmedReason) {
      toast.error('Please add a short description for this report.')
      return
    }

    const trackingId = reportContext.connectionId ?? reportContext.targetUserId

    try {
      setIsSubmittingReport(true)
      setIsLoadingAction(trackingId)

      const response = await fetch('/api/network/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: reportContext.targetUserId,
          connectionId: reportContext.connectionId,
          reason: trimmedReason,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Unable to submit report')
      }

      toast.success(result.message || 'Report submitted')
      setReportContext(null)
      setReportReason('')
      startTransition(() => {
        void mutate()
      })
    } catch (error) {
      console.error('Failed to submit connection report', error)
      toast.error('Unable to submit report', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setIsSubmittingReport(false)
      setIsLoadingAction((current) => (current === trackingId ? null : current))
    }
  }, [reportContext, reportReason, mutate])

  const tabGridClass = 'flex w-full flex-wrap justify-center gap-2 sm:gap-3'

  useEffect(() => {
    setPendingIncomingLimit(10)
    setPendingOutgoingLimit(10)
  }, [data?.connections.pending])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput])

  const pauseConnectionRequests = data?.viewer.pauseConnectionRequests ?? false

  const handleAction = useCallback(async (options: {
    endpoint: string
    method?: 'POST' | 'DELETE'
    body?: Record<string, unknown>
    successMessage: string
    trackingId?: string
  }) => {
    const { endpoint, method = 'POST', body, successMessage, trackingId } = options
    try {
      if (trackingId) {
        setIsLoadingAction(trackingId)
      }

      const response = await fetch(endpoint, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Request failed')
      }

      toast.success(result.message || successMessage)
      startTransition(() => {
        void mutate()
      })
    } catch (actionError) {
      console.error('Failed connection action', actionError)
      toast.error('Action failed', {
        description: actionError instanceof Error ? actionError.message : 'Please try again.',
      })
    } finally {
      if (trackingId) {
        setIsLoadingAction((current) => (current === trackingId ? null : current))
      }
    }
  }, [mutate])

  const isPending = useCallback((id: string) => isLoadingAction === id, [isLoadingAction])

  const onSendRequest = useCallback(async (userId: string, type: 'friend' | 'mentor') => {
    await handleAction({
      endpoint: '/api/network/request',
      method: 'POST',
      body: { targetUserId: userId, connectionType: type },
      successMessage: 'Request sent successfully.',
      trackingId: userId,
    })
  }, [handleAction])

  const onAccept = useCallback(async (connectionId: string) => {
    await handleAction({
      endpoint: '/api/network/respond',
      body: { connectionId, action: 'accept' },
      successMessage: 'Connection request accepted.',
      trackingId: connectionId,
    })
  }, [handleAction])

  const onDecline = useCallback(async (connectionId: string) => {
    await handleAction({
      endpoint: '/api/network/respond',
      body: { connectionId, action: 'decline' },
      successMessage: 'Connection request declined.',
      trackingId: connectionId,
    })
  }, [handleAction])

  const onRemove = useCallback(async (connectionId: string) => {
    await handleAction({
      endpoint: `/api/network/${connectionId}`,
      method: 'DELETE',
      successMessage: 'Connection removed.',
      trackingId: connectionId,
    })
  }, [handleAction])

  const onUnblock = useCallback(async (connectionId: string) => {
    await handleAction({
      endpoint: '/api/network/respond',
      body: { connectionId, action: 'unblock' },
      successMessage: 'Connection unblocked.',
      trackingId: connectionId,
    })
  }, [handleAction])

  const onBlock = useCallback(async (connectionId: string) => {
    await handleAction({
      endpoint: '/api/network/respond',
      body: { connectionId, action: 'block' },
      successMessage: 'User blocked.',
      trackingId: connectionId,
    })
  }, [handleAction])

  const handlePauseToggle = async (nextValue: boolean) => {
    setTogglingPause(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pause_connection_requests: nextValue }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update preference')
      }

      toast.success(nextValue ? 'Connection requests paused.' : 'Connection requests resumed.')
      await mutate()
    } catch (prefError) {
      console.error('Failed to toggle pause', prefError)
      toast.error('Unable to update preference', {
        description: prefError instanceof Error ? prefError.message : 'Please try again.',
      })
    } finally {
      setTogglingPause(false)
    }
  }

  const renderConnectionCard = (item: ConnectionListItem) => {
    const displayName = item.counterpart.public_display_name || item.counterpart.name || 'Bleepy User'
    const subtitle = item.connection_type === 'mentor' ? 'Mentor link' : 'Friend connection'
    const requestedAgo = formatRelativeTime(item.requested_at)
    const pendingIncoming = item.status === 'pending' && !item.initiated_by_viewer
    const pendingOutgoing = item.status === 'pending' && item.initiated_by_viewer
    const isConnected = item.status === 'accepted'
    const avatarSrc = resolveAvatarSrc(item.counterpart.avatar_thumbnail || item.counterpart.avatar_asset)
    const mutualLabel = formatMutualLabel(item.mutual_connection_count)

    return (
      <Card key={item.id} className="border border-slate-200/80 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-500">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                toInitials(displayName)
              )}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={item.counterpart.public_slug ? `/profile/${item.counterpart.public_slug}` : '#'}
                  className="text-base font-semibold text-slate-900 hover:text-purple-600"
                >
                  {displayName}
                </Link>
                {item.connection_type === 'mentor' && (
                  <Badge variant="outline" className="border-purple-200 text-purple-600">
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Mentor
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-600">{subtitle}</p>
              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                {requestedAgo && (
                  <span>Requested {requestedAgo}</span>
                )}
                {mutualLabel && <span>{mutualLabel}</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 md:items-end">
            {pendingIncoming && (
               <div className="flex items-center gap-2">
                 <Button
                   size="sm"
                   className="bg-green-600 text-white hover:bg-green-700"
                   onClick={() => void onAccept(item.id)}
                   disabled={isPending(item.id)}
                 >
                   {isPending(item.id) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                   Accept
                 </Button>
                 <Button
                   size="sm"
                   variant="outline"
                   onClick={() => void onDecline(item.id)}
                   disabled={isPending(item.id)}
                 >
                   {isPending(item.id) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                   Decline
                 </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void onBlock(item.id)}
                  disabled={isPending(item.id)}
                  className="border-slate-200 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-900"
                >
                  {isPending(item.id) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
                  Block
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openReportDialog({ targetUserId: item.counterpart.id, connectionId: item.id, displayName })}
                  disabled={isPending(item.id)}
                  className={reportButtonClasses}
                >
                  <FlagTriangleRight className="h-4 w-4" /> Report
                </Button>
               </div>
             )}

            {pendingOutgoing && (
               <div className="flex items-center gap-2 text-sm text-slate-500">
                 <Clock className="h-4 w-4" /> Awaiting response
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void onRemove(item.id)}
                  disabled={isPending(item.id)}
                  className="border-slate-200 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-900"
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void onBlock(item.id)}
                  disabled={isPending(item.id)}
                  className="border-slate-200 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-900"
                >
                  {isPending(item.id) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
                  Block
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openReportDialog({ targetUserId: item.counterpart.id, connectionId: item.id, displayName })}
                  disabled={isPending(item.id)}
                  className={reportButtonClasses}
                >
                  <FlagTriangleRight className="h-4 w-4" /> Report
                </Button>
               </div>
             )}

            {isConnected && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-green-300 bg-green-100 text-green-700">
                  <Handshake className="mr-1.5 h-3.5 w-3.5" /> Connected
                </Badge>
                <Button variant="outline" size="sm" onClick={() => void onRemove(item.id)} disabled={isPending(item.id)}>
                  {isPending(item.id) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
                  Remove
                </Button>
                <Button variant="outline" size="sm" onClick={() => void onBlock(item.id)} disabled={isPending(item.id)}>
                  {isPending(item.id) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
                  Block
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openReportDialog({ targetUserId: item.counterpart.id, connectionId: item.id, displayName })}
                  disabled={isPending(item.id)}
                  className={reportButtonClasses}
                >
                  <FlagTriangleRight className="h-4 w-4" /> Report
                </Button>
              </div>
            )}

            {item.status === 'blocked' && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <Ban className="h-4 w-4" /> Blocked
                <Button variant="ghost" size="sm" onClick={() => void onUnblock(item.id)} disabled={isPending(item.id)}>
                  Unblock
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openReportDialog({ targetUserId: item.counterpart.id, connectionId: item.id, displayName })}
                  disabled={isPending(item.id)}
                  className={reportButtonClasses}
                >
                  <FlagTriangleRight className="h-4 w-4" /> Report
                </Button>
              </div>
            )}

            {item.status === 'snoozed' && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <Clock className="h-4 w-4" /> Snoozed
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void onRemove(item.id)}
                  disabled={isPending(item.id)}
                  className="border-slate-200 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-900"
                >
                  Cancel request
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openReportDialog({ targetUserId: item.counterpart.id, connectionId: item.id, displayName })}
                  disabled={isPending(item.id)}
                  className={reportButtonClasses}
                >
                  <FlagTriangleRight className="h-4 w-4" /> Report
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderSuggestionCard = (profile: ProfileSummary) => {
    const displayName = profile.public_display_name || profile.name || 'Bleepy User'
    const avatarSrc = resolveAvatarSrc(profile.avatar_thumbnail || profile.avatar_asset)
    const mutualLabel = formatMutualLabel(profile.mutual_connection_count)
    const viewerIsStaff = data?.viewer?.isStaff ?? false

    return (
      <Card key={profile.id} className="border border-slate-200/80 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-500">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                toInitials(displayName)
              )}
            </div>
            <div className="space-y-1">
              <Link
                href={profile.public_slug ? `/profile/${profile.public_slug}` : '#'}
                className="text-sm font-semibold text-slate-900 hover:text-purple-600"
              >
                {displayName}
              </Link>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                {shouldShowRoleTypeBadge(profile.role, profile.role_type) && (
                  <Badge variant="secondary">{humanizeRoleType(profile.role_type)}</Badge>
                )}
                {profile.university && <Badge variant="secondary">{profile.university}</Badge>}
              </div>
              {mutualLabel && <div className="text-xs text-slate-400">{mutualLabel}</div>}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <Button size="sm" onClick={() => void onSendRequest(profile.id, 'friend')} disabled={pauseConnectionRequests && !viewerIsStaff}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Friend
            </Button>
            <Button size="sm" variant="outline" onClick={() => void onSendRequest(profile.id, 'mentor')} disabled={pauseConnectionRequests && !viewerIsStaff}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Request Mentor
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openReportDialog({ targetUserId: profile.id, displayName })}
              disabled={isPending(profile.id)}
              className={reportButtonClasses}
            >
              <FlagTriangleRight className="h-4 w-4" /> Report
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderSuggestions = () => {
    if (!data) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-2xl" />
          ))}
        </div>
      )
    }

    if (data.suggestions.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-500">
            We’ll keep looking for great connections. Try making your profile public to see more options.
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.suggestions.map((profile) => renderSuggestionCard(profile))}
      </div>
    )
  }

  const renderConnectionsTab = (tab: ConnectionTab) => {
    if (tab === 'suggestions') {
      return renderSuggestions()
    }

    if (isLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={`connection-skeleton-${index}`} className="border border-slate-200/80">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (error) {
      return (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="py-12 text-center text-sm text-red-700">
            Unable to load connections. {error.message}
          </CardContent>
        </Card>
      )
    }

    if (!data) return null

    switch (tab) {
      case 'pending': {
        const incomingPending = data.connections.pending.filter((item) => !item.initiated_by_viewer)
        const sentPending = data.connections.pending.filter((item) => item.initiated_by_viewer)
        const incomingDisplayed = incomingPending.slice(0, pendingIncomingLimit)
        const sentDisplayed = sentPending.slice(0, pendingOutgoingLimit)

        return (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pending friend requests</h3>
                <p className="text-xs text-slate-400">Requests from other users waiting for your response.</p>
              </div>
              {incomingPending.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-sm text-slate-500">
                    No pending requests right now.
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col gap-4">
                  {incomingDisplayed.map(renderConnectionCard)}
                  {incomingPending.length > incomingDisplayed.length && (
                    <Button
                      variant="outline"
                      className="self-start border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                      onClick={() => setPendingIncomingLimit((limit) => limit + 10)}
                    >
                      Show 10 more
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Sent requests</h3>
                <p className="text-xs text-slate-400">Invitations you’ve sent that are waiting for a reply.</p>
              </div>
              {sentPending.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-sm text-slate-500">
                    You have no outstanding requests.
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col gap-4">
                  {sentDisplayed.map(renderConnectionCard)}
                  {sentPending.length > sentDisplayed.length && (
                    <Button
                      variant="outline"
                      className="self-start border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                      onClick={() => setPendingOutgoingLimit((limit) => limit + 10)}
                    >
                      Show 10 more
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      }
      case 'friends':
        if (data.connections.friends.length === 0) {
          return (
            <Card>
              <CardContent className="py-12 text-center text-sm text-slate-500">
                You haven’t connected with any friends yet.
              </CardContent>
            </Card>
          )
        }

        return (
          <div className="flex flex-col gap-4">
            {data.connections.friends.map(renderConnectionCard)}
          </div>
        )

      case 'mentors':
        if (data.connections.mentors.length === 0) {
          return (
            <Card>
              <CardContent className="py-12 text-center text-sm text-slate-500">
                No mentor connections yet.
              </CardContent>
            </Card>
          )
        }

        return (
          <div className="flex flex-col gap-4">
            {data.connections.mentors.map(renderConnectionCard)}
          </div>
        )

      case 'blocked':
        if (data.connections.blocked.length === 0) {
          return (
            <Card>
              <CardContent className="py-12 text-center text-sm text-slate-500">
                No blocked users.
              </CardContent>
            </Card>
          )
        }

        return (
          <div className="flex flex-col gap-4">
            {data.connections.blocked.map(renderConnectionCard)}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        <Card className="border border-blue-200 bg-blue-50/80">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white/80 p-2 text-blue-600 shadow-inner">
                <FlaskConical className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Connections Beta</p>
                <p className="text-sm text-blue-900">
                  We’re still polishing the social experience. If you spot any bugs or have suggestions, please let the developers know so we can improve it quickly.
                </p>
                <Button
                  variant="outline"
                  asChild
                  className="border-blue-200 bg-white text-blue-700 hover:bg-blue-100 hover:text-blue-800 focus-visible:ring-blue-300"
                >
                  <Link href="/contact?category=connections_report">Share feedback</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-md md:flex-row md:items-center md:justify-between">
          <div className="flex w-full flex-col gap-2 md:max-w-md">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="connections-search">Quick search</label>
            <Input
              id="connections-search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search people by name, university, or specialty"
            />
            <p className="text-xs text-slate-400">Type at least 2 characters to see results.</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-2">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Pause requests</p>
              <p className="text-sm text-slate-700">
                {pauseConnectionRequests ? 'Currently paused' : 'Accepting new requests'}
              </p>
            </div>
            <Switch
              checked={pauseConnectionRequests}
              onCheckedChange={(checked) => void handlePauseToggle(checked)}
              disabled={togglingPause}
            />
          </div>
        </div>

        {shouldSearch && (
          <Card className="w-full overflow-hidden border border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Search results{searchResults?.results?.length ? ` (${searchResults.results.length})` : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="w-full overflow-hidden pt-0">
              {isSearching ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-32 rounded-2xl" />
                  ))}
                </div>
              ) : searchError ? (
                <p className="py-6 text-sm text-red-600">Unable to search right now. {searchError.message}</p>
              ) : searchResults && searchResults.results.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {searchResults.results.map((profile) => renderSuggestionCard(profile))}
                </div>
              ) : (
                <p className="py-6 text-sm text-slate-500">No matching users yet. Try adjusting your search.</p>
              )}
            </CardContent>
          </Card>
        )}

        {data && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border border-purple-200 bg-purple-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-purple-900">
                  <Clock className="h-4 w-4" /> Pending
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-3xl font-bold text-purple-900">
                {data.metrics.pendingTotal}
                <p className="mt-1 text-xs font-medium text-purple-700">
                  {data.metrics.pendingIncoming} incoming · {data.metrics.pendingOutgoing} sent
                </p>
              </CardContent>
            </Card>
            <Card className="border border-blue-200 bg-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                  <Handshake className="h-4 w-4" /> Friends
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-3xl font-bold text-blue-900">
                {data.metrics.friends}
                <p className="mt-1 text-xs font-medium text-blue-700">Active friend connections</p>
              </CardContent>
            </Card>
            <Card className="border border-emerald-200 bg-emerald-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                  <Lightbulb className="h-4 w-4" /> Mentors
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-3xl font-bold text-emerald-900">
                {data.metrics.mentors}
                <p className="mt-1 text-xs font-medium text-emerald-700">Active mentor connections</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ConnectionTab)}>
        <TabsList
          className={`${tabGridClass} items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${
            normalizedVisibleTabs.length <= 3 ? 'mt-4 sm:mt-6' : 'mt-2'
          }`}
        >
          {normalizedVisibleTabs.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="flex-1 min-w-[100px] px-3 py-1 text-sm sm:flex-none sm:px-4 sm:py-1.5"
            >
              {TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>
        {normalizedVisibleTabs.map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            {renderConnectionsTab(tab)}
          </TabsContent>
        ))}
      </Tabs>
    </>
  )
}
