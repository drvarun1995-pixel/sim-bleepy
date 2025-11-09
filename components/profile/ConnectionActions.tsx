"use client"

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Loader2, UserPlus, ShieldCheck, Handshake, Ban, CheckCircle2, Clock, XCircle } from 'lucide-react'

interface RelationshipState {
  status:
    | 'anonymous'
    | 'self'
    | 'none'
    | 'connected'
    | 'incoming-request'
    | 'outgoing-request'
    | 'snoozed'
    | 'blocked'
    | 'declined'
  connectionId?: string
  connectionType?: 'friend' | 'mentor'
  initiatedByViewer?: boolean
  snoozedUntil?: string | null
}

interface ConnectionActionsProps {
  profileId: string
  profileDisplayName: string
  relationship: RelationshipState
  pauseConnectionRequests: boolean
  viewerId: string | null
  viewerIsOwner: boolean
  viewerIsStaff: boolean
}

export function ConnectionActions({
  profileId,
  profileDisplayName,
  relationship,
  pauseConnectionRequests,
  viewerId,
  viewerIsOwner,
  viewerIsStaff,
}: ConnectionActionsProps) {
  const router = useRouter()
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!viewerId || viewerIsOwner) {
    return null
  }

  if (relationship.status === 'anonymous') {
    return null
  }

  const refreshClient = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  const handleSendRequest = async (connectionType: 'friend' | 'mentor') => {
    if (pauseConnectionRequests && !viewerIsStaff) {
      toast.info(`${profileDisplayName} is not accepting new connections right now.`)
      return
    }

    try {
      setPendingAction(connectionType)
      const response = await fetch('/api/network/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: profileId, connectionType }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send request')
      }

      toast.success(result.message || 'Request sent')
      refreshClient()
    } catch (error) {
      console.error('Failed to send connection request', error)
      toast.error('Unable to send request', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setPendingAction(null)
    }
  }

  const handleRespond = async (action: 'accept' | 'decline') => {
    if (!relationship.connectionId) return

    try {
      setPendingAction(action)
      const response = await fetch('/api/network/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: relationship.connectionId, action }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Unable to update request')
      }

      toast.success(result.message || 'Request updated')
      refreshClient()
    } catch (error) {
      console.error('Failed to respond to connection', error)
      toast.error('Unable to update request', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setPendingAction(null)
    }
  }

  const handleRemoveConnection = async () => {
    if (!relationship.connectionId) return

    try {
      setPendingAction('remove')
      const response = await fetch(`/api/network/${relationship.connectionId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove connection')
      }

      toast.success(result.message || 'Connection removed')
      refreshClient()
    } catch (error) {
      console.error('Failed to remove connection', error)
      toast.error('Unable to remove connection', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setPendingAction(null)
    }
  }

  const handleUnblock = async () => {
    if (!relationship.connectionId) return

    try {
      setPendingAction('unblock')
      const response = await fetch('/api/network/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: relationship.connectionId, action: 'unblock' }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Unable to unblock user')
      }

      toast.success(result.message || 'Connection unblocked')
      refreshClient()
    } catch (error) {
      console.error('Failed to unblock connection', error)
      toast.error('Unable to unblock connection', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setPendingAction(null)
    }
  }

  const isLoading = isPending || pendingAction !== null

  switch (relationship.status) {
    case 'none':
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => void handleSendRequest('friend')}
              disabled={isLoading || (pauseConnectionRequests && !viewerIsStaff)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl"
            >
              {isLoading && pendingAction === 'friend' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Add Friend
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleSendRequest('mentor')}
              disabled={isLoading || (pauseConnectionRequests && !viewerIsStaff)}
              className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
            >
              {isLoading && pendingAction === 'mentor' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              Request Mentor
            </Button>
          </div>
          {pauseConnectionRequests && !viewerIsStaff && (
            <p className="text-xs text-amber-600">
              {profileDisplayName} is currently pausing new connection requests.
            </p>
          )}
        </div>
      )

    case 'outgoing-request':
      return (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
            <Clock className="h-4 w-4" />
            {relationship.connectionType === 'mentor' ? 'Mentor request pending' : 'Friend request pending'}
          </div>
          <Button
            variant="outline"
            onClick={handleRemoveConnection}
            disabled={isLoading}
            className="border-slate-200 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-900"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
            Cancel request
          </Button>
        </div>
      )

    case 'incoming-request':
      return (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => void handleRespond('accept')}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white shadow"
          >
            {isLoading && pendingAction === 'accept' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Accept
          </Button>
          <Button
            variant="outline"
            onClick={() => void handleRespond('decline')}
            disabled={isLoading}
          >
            {isLoading && pendingAction === 'decline' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Decline
          </Button>
        </div>
      )

    case 'connected':
      return (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700 shadow-sm">
            <Handshake className="mr-2 h-4 w-4" />
            Connected {relationship.connectionType === 'mentor' ? '· Mentor link' : ''}
          </div>
          <Button
            variant="outline"
            onClick={handleRemoveConnection}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
            Remove connection
          </Button>
        </div>
      )

    case 'snoozed':
      return (
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <Clock className="h-4 w-4" />
          Request snoozed — try again later.
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveConnection}
            disabled={isLoading}
            className="border-slate-200 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-900"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
            Cancel request
          </Button>
        </div>
      )

    case 'blocked':
      return (
        <div className="flex items-center gap-3 text-sm text-red-600">
          <span className="inline-flex items-center gap-2">
            <Ban className="h-4 w-4" /> Connection blocked
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnblock}
            disabled={isLoading}
          >
            {isLoading && pendingAction === 'unblock' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
            Reopen request
          </Button>
        </div>
      )

    case 'declined':
      return (
        <div className="flex flex-wrap items-center gap-3 text-sm text-red-600">
          <span className="inline-flex items-center gap-2">
            <XCircle className="h-4 w-4" /> Request declined
          </span>
          <span className="text-xs text-red-400">
            This person decided not to connect. You can wait for them to reach out if they change their mind.
          </span>
        </div>
      )
    default:
      return null
  }
}
