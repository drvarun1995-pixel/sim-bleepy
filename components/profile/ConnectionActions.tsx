"use client"

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, UserPlus, ShieldCheck, Handshake, Ban, CheckCircle2, Clock, XCircle, FlagTriangleRight } from 'lucide-react'

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

const reportButtonClasses =
  'inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-1'

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
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)

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

  const openReportDialog = () => {
    setReportReason('')
    setReportDialogOpen(true)
  }

  const closeReportDialog = () => {
    if (isSubmittingReport) {
      return
    }
    setReportDialogOpen(false)
    setReportReason('')
  }

  const handleReportDialogOpenChange = (open: boolean) => {
    if (open) {
      setReportDialogOpen(true)
      return
    }
    closeReportDialog()
  }

  const submitReport = async () => {
    const trimmedReason = reportReason.trim()
    if (!trimmedReason) {
      toast.error('Please add a short description for this report.')
      return
    }

    try {
      setIsSubmittingReport(true)
      setPendingAction('report')

      const response = await fetch('/api/network/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: profileId,
          connectionId: relationship.connectionId,
          reason: trimmedReason,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Unable to submit report')
      }

      toast.success(result.message || 'Report submitted')
      setReportDialogOpen(false)
      setReportReason('')
      refreshClient()
    } catch (error) {
      console.error('Failed to report connection', error)
      toast.error('Unable to submit report', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setIsSubmittingReport(false)
      setPendingAction(null)
    }
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

  const handleBlock = async () => {
    if (!relationship.connectionId) return

    try {
      setPendingAction('block')
      const response = await fetch('/api/network/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: relationship.connectionId, action: 'block' }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Unable to block user')
      }

      toast.success(result.message || 'Connection blocked')
      refreshClient()
    } catch (error) {
      console.error('Failed to block connection', error)
      toast.error('Unable to block connection', {
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

  const isLoading = isPending || pendingAction !== null || isSubmittingReport

  const renderContent = (): JSX.Element | null => {
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
            <Button
              variant="outline"
              size="sm"
              onClick={openReportDialog}
              disabled={isLoading}
              className={`${reportButtonClasses} self-start`}
            >
              <FlagTriangleRight className="h-4 w-4" /> Report profile
            </Button>
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
            <Button
              variant="outline"
              size="sm"
              onClick={openReportDialog}
              disabled={isLoading}
              className={reportButtonClasses}
            >
              <FlagTriangleRight className="h-4 w-4" /> Report
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
            <Button
              variant="outline"
              size="sm"
              onClick={openReportDialog}
              disabled={isLoading}
              className={reportButtonClasses}
            >
              <FlagTriangleRight className="h-4 w-4" /> Report
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
            <Button
              variant="outline"
              onClick={handleBlock}
              disabled={isLoading}
            >
              {isLoading && pendingAction === 'block' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
              Block user
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openReportDialog}
              disabled={isLoading}
              className={reportButtonClasses}
            >
              <FlagTriangleRight className="h-4 w-4" /> Report
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
            <Button
              variant="outline"
              size="sm"
              onClick={openReportDialog}
              disabled={isLoading}
              className={reportButtonClasses}
            >
              <FlagTriangleRight className="h-4 w-4" /> Report
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
            <Button
              variant="outline"
              size="sm"
              onClick={openReportDialog}
              disabled={isLoading}
              className={reportButtonClasses}
            >
              <FlagTriangleRight className="h-4 w-4" /> Report
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
            <Button
              variant="outline"
              size="sm"
              onClick={openReportDialog}
              disabled={isLoading}
              className={reportButtonClasses}
            >
              <FlagTriangleRight className="h-4 w-4" /> Report
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <>
      {renderContent()}
      <Dialog open={reportDialogOpen} onOpenChange={handleReportDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report {profileDisplayName}</DialogTitle>
            <DialogDescription>
              Let us know what happened so our safety team can review this connection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
              placeholder="Describe what happened..."
              className="min-h-[140px]"
              disabled={isSubmittingReport}
              autoFocus
            />
            <p className="text-xs text-slate-500">
              Reports are confidential. The MedEd team may follow up if we need more detail.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeReportDialog} disabled={isSubmittingReport}>
              Cancel
            </Button>
            <Button
              onClick={() => void submitReport()}
              disabled={isSubmittingReport || !reportReason.trim()}
              className="inline-flex items-center"
            >
              {isSubmittingReport ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FlagTriangleRight className="mr-2 h-4 w-4" />
              )}
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
