"use client"

import { useCallback, useEffect, useState, useTransition } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { toast } from 'sonner'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
import {
  Loader2,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Handshake,
  Users,
  Lightbulb,
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

const fetcher = (url: string) =>
  fetch(url, { cache: 'no-store' })
    .then(async (res) => {
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load connections')
      }
      return data as NetworkResponse
    })

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

export function ConnectionsDashboard() {
  const { data, error, isLoading, mutate } = useSWR<NetworkResponse>(
    `/api/network?type=${filters.type}&status=${filters.status}&q=${encodeURIComponent(searchTerm)}`,
    fetcher
  )

  useEffect(() => {
    setPendingIncomingLimit(10)
    setPendingOutgoingLimit(10)
  }, [data?.connections.pending])
  const [activeTab, setActiveTab] = useState<'pending' | 'friends' | 'mentors' | 'suggestions' | 'blocked'>('pending')
  const [isPending, startTransition] = useTransition()
  const [togglingPause, setTogglingPause] = useState(false)
  const [isLoadingAction, setIsLoadingAction] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({ type: 'all', status: 'all' })
  const [pendingIncomingLimit, setPendingIncomingLimit] = useState(10)
  const [pendingOutgoingLimit, setPendingOutgoingLimit] = useState(10)

  const pauseConnectionRequests = data?.viewer.pauseConnectionRequests ?? false

  const handleAction = useCallback(async (options: {
    endpoint: string
    method?: 'POST' | 'DELETE'
    body?: Record<string, unknown>
    successMessage: string
  }) => {
    const { endpoint, method = 'POST', body, successMessage } = options
    try {
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
    }
  }, [mutate])

  const onSendRequest = useCallback(async (userId: string, type: 'friend' | 'mentor') => {
    await handleAction({
      endpoint: '/api/network/request',
      method: 'POST',
      body: { targetUserId: userId, connectionType: type },
      successMessage: 'Request sent successfully.',
    })
  }, [handleAction])

  const onAccept = useCallback(async (connectionId: string) => {
    await handleAction({
      endpoint: '/api/network/respond',
      body: { connectionId, action: 'accept' },
      successMessage: 'Connection request accepted.',
    })
  }, [handleAction])

  const onDecline = useCallback(async (connectionId: string) => {
    await handleAction({
      endpoint: '/api/network/respond',
      body: { connectionId, action: 'decline' },
      successMessage: 'Connection request declined.',
    })
  }, [handleAction])

  const onRemove = useCallback(async (connectionId: string) => {
    await handleAction({
      endpoint: `/api/network/${connectionId}`,
      method: 'DELETE',
      successMessage: 'Connection removed.',
    })
  }, [handleAction])

  const onUnblock = useCallback(async (connectionId: string) => {
    await handleAction({
      endpoint: '/api/network/respond',
      body: { connectionId, action: 'unblock' },
      successMessage: 'Connection unblocked.',
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
                {item.mutual_connection_count > 0 && (
                  <span>{item.mutual_connection_count} mutual connection{item.mutual_connection_count > 1 ? 's' : ''}</span>
                )}
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
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void onDecline(item.id)}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                  Decline
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
                  disabled={isPending}
                  className="border-slate-200 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-900"
                >
                  Cancel
                </Button>
               </div>
             )}

            {isConnected && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-green-300 bg-green-100 text-green-700">
                  <Handshake className="mr-1.5 h-3.5 w-3.5" /> Connected
                </Badge>
                <Button variant="outline" size="sm" onClick={() => void onRemove(item.id)} disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
                  Remove
                </Button>
              </div>
            )}

            {item.status === 'blocked' && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <Ban className="h-4 w-4" /> Blocked
                <Button variant="ghost" size="sm" onClick={() => void onUnblock(item.id)} disabled={isPending}>
                  Unblock
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
                  disabled={isPending}
                  className="border-slate-200 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-900"
                >
                  Cancel request
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderSuggestions = () => {
    if (!data) return null

    if (data.suggestions.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center text-sm text-slate-500">
            <Users className="h-8 w-8 text-slate-300" />
            No suggestions right now — check back soon!
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.suggestions.map((profile) => {
          const displayName = profile.public_display_name || profile.name || 'Bleepy User'
          const avatarSrc = resolveAvatarSrc(profile.avatar_thumbnail || profile.avatar_asset)
          return (
            <Card key={profile.id} className="border border-slate-200/80 shadow-sm">
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-500">
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
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" onClick={() => void onSendRequest(profile.id, 'friend')} disabled={pauseConnectionRequests && !data.viewer.isStaff}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Friend
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void onSendRequest(profile.id, 'mentor')} disabled={pauseConnectionRequests && !data.viewer.isStaff}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Request Mentor
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  const renderContent = () => {
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

    switch (activeTab) {
      case 'pending':
        const incomingPending = data.connections.pending.filter(item => !item.initiated_by_viewer)
        const sentPending = data.connections.pending.filter(item => item.initiated_by_viewer)
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
      case 'friends':
        return data.connections.friends.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-slate-500">
              You haven’t connected with any friends yet.
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {data.connections.friends.map(renderConnectionCard)}
          </div>
        )
      case 'mentors':
        return data.connections.mentors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-slate-500">
              No mentor connections yet.
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {data.connections.mentors.map(renderConnectionCard)}
          </div>
        )
      case 'blocked':
        return data.connections.blocked.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-slate-500">
              No blocked users.
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {data.connections.blocked.map(renderConnectionCard)}
          </div>
        )
      case 'suggestions':
        return renderSuggestions()
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-md md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Connections</h1>
          <p className="text-sm text-slate-500">Manage friends, mentors, and pending invitations.</p>
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

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="mentors">Mentors</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="blocked">Blocked</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-6">
          {renderContent()}
        </TabsContent>
        <TabsContent value="friends" className="mt-6">
          {renderContent()}
        </TabsContent>
        <TabsContent value="mentors" className="mt-6">
          {renderContent()}
        </TabsContent>
        <TabsContent value="suggestions" className="mt-6">
          {renderSuggestions()}
        </TabsContent>
        <TabsContent value="blocked" className="mt-6">
          {renderContent()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
