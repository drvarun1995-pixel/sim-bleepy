'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import { useRole } from '@/lib/useRole'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { TiptapSimpleEditor } from '@/components/ui/tiptap-simple-editor'
import { USER_ROLES } from '@/lib/roles'
import { cn } from '@/utils'
import { Mail, Users, Loader2, X } from 'lucide-react'

interface DashboardLayoutState {
  isMobileMenuOpen: boolean
}

interface DashboardUser {
  id: string
  name: string | null
  email: string | null
  role: string | null
}

interface AdminEmailLog {
  id: string
  subject: string | null
  body_html: string | null
  recipient_ids: string[] | null
  failed_recipient_ids: string[] | null
  failed_count: number | null
}

const MAX_MANUAL_RECIPIENTS = 50

const generateDraftId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function AdminSendEmailPageInner() {
  const { data: session, status } = useSession()
  const { role, loading: roleLoading, canSendAdminEmails } = useRole()
  const router = useRouter()
  const searchParams = useSearchParams()
  const resendLogId = searchParams?.get('resend')
  const [recipientScope, setRecipientScope] = useState<'all' | 'role' | 'individual'>('individual')
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [availableUsers, setAvailableUsers] = useState<DashboardUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [draftId, setDraftId] = useState(generateDraftId)
  const [uploadedPaths, setUploadedPaths] = useState<string[]>([])
  const [isSending, setIsSending] = useState(false)
  const [prefillInfo, setPrefillInfo] = useState<{ logId: string; failedCount: number } | null>(null)
  const [prefillLoading, setPrefillLoading] = useState(false)

  useEffect(() => {
    if (status === 'loading' || roleLoading) return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    if (!canSendAdminEmails) {
      toast.error('Access denied. Admin or MedEd Team role required.')
      router.push('/dashboard')
    }
  }, [session, status, canSendAdminEmails, roleLoading, router])

  useEffect(() => {
    if (!session || !canSendAdminEmails) return

    const fetchUsers = async () => {
      setUsersLoading(true)
      try {
        const response = await fetch('/api/admin/users?limit=500')
        if (!response.ok) throw new Error('Failed to load users')
        const data = await response.json()
        setAvailableUsers(data.users || [])
      } catch (error) {
        console.error('Failed to fetch users for email console:', error)
        toast.error('Unable to load users list')
      } finally {
        setUsersLoading(false)
      }
    }

    fetchUsers()
  }, [session, canSendAdminEmails])

  useEffect(() => {
    if (!resendLogId) {
      setPrefillInfo(null)
      return
    }

    let active = true
    const fetchPrefill = async () => {
      try {
        setPrefillLoading(true)
        const response = await fetch(`/api/admin/emails/logs/${resendLogId}`)
        if (!response.ok) throw new Error('Failed to load email log')
        const data = await response.json()
        if (!active || !data.log) return
        const log = data.log as AdminEmailLog
        setSubject(log.subject || '')
        setBody(log.body_html || '')
        setRecipientScope('individual')
        const targetIds: string[] =
          (log.failed_recipient_ids && log.failed_recipient_ids.length > 0
            ? log.failed_recipient_ids
            : log.recipient_ids) || []
        setSelectedUserIds(targetIds)
        setPrefillInfo({
          logId: log.id,
          failedCount: log.failed_count || targetIds.length,
        })
        toast.info(
          log.failed_count
            ? `Prefilled ${log.failed_count} failed recipient${log.failed_count === 1 ? '' : 's'}`
            : 'Prefilled recipients from previous send'
        )
      } catch (error) {
        console.error('Failed to preload resend log:', error)
        toast.error('Unable to load resend details')
      } finally {
        if (active) setPrefillLoading(false)
      }
    }

    fetchPrefill()
    return () => {
      active = false
    }
  }, [resendLogId])

  const handleImageUploaded = useCallback((path: string) => {
    setUploadedPaths((prev) => (prev.includes(path) ? prev : [...prev, path]))
  }, [])

  const cleanupDraftImages = useCallback((paths: string[]) => {
    if (!paths.length) return
    const payload = JSON.stringify({ imagePaths: paths })
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon('/api/admin/emails/images/cleanup', blob)
    } else {
      fetch('/api/admin/emails/images/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }
  }, [])

  useEffect(() => {
    return () => {
      cleanupDraftImages(uploadedPaths)
    }
  }, [uploadedPaths, cleanupDraftImages])

  const filteredUsers = useMemo(() => {
    if (!userSearch) return availableUsers
    const query = userSearch.toLowerCase()
    return availableUsers.filter((user) => {
      return (
        (user.name && user.name.toLowerCase().includes(query)) ||
        (user.email && user.email.toLowerCase().includes(query))
      )
    })
  }, [availableUsers, userSearch])

  const selectedUsers = useMemo(() => {
    const map = new Map(availableUsers.map((user) => [user.id, user]))
    return selectedUserIds
      .map((id) => map.get(id))
      .filter(Boolean) as DashboardUser[]
  }, [availableUsers, selectedUserIds])

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId)
      }
      if (prev.length >= MAX_MANUAL_RECIPIENTS) {
        toast.error(`You can only select up to ${MAX_MANUAL_RECIPIENTS} users`)
        return prev
      }
      return [...prev, userId]
    })
  }

  const toggleRole = (roleValue: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleValue) ? prev.filter((r) => r !== roleValue) : [...prev, roleValue]
    )
  }

  const handleSendEmail = async () => {
    if (!canSendAdminEmails) return
    if (!subject.trim()) {
      toast.error('Please enter a subject')
      return
    }
    if (!body.trim()) {
      toast.error('Please write an email body')
      return
    }

    if (recipientScope === 'role' && selectedRoles.length === 0) {
      toast.error('Select at least one role')
      return
    }

    if (recipientScope === 'individual' && selectedUserIds.length === 0) {
      toast.error('Select at least one user')
      return
    }

    if (recipientScope === 'individual' && selectedUserIds.length > MAX_MANUAL_RECIPIENTS) {
      toast.error(`You can only send to ${MAX_MANUAL_RECIPIENTS} users at a time`)
      return
    }

    setIsSending(true)
    try {
      const response = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          html: body,
          recipientScope,
          recipientRoles: recipientScope === 'role' ? selectedRoles : undefined,
          recipientIds: recipientScope === 'individual' ? selectedUserIds : undefined,
          draftId,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email')
      }

      toast.success(`Email sent to ${data.sent} recipients`)
      setSubject('')
      setBody('')
      setSelectedUserIds([])
      setSelectedRoles([])
      cleanupDraftImages(uploadedPaths)
      setUploadedPaths([])
      setDraftId(generateDraftId())
    } catch (error: any) {
      console.error('Failed to send custom email:', error)
      toast.error(error?.message || 'Failed to send email')
    } finally {
      setIsSending(false)
    }
  }

  if (status === 'loading' || roleLoading || !role) {
    return <LoadingScreen message="Loading dashboard..." />
  }

  if (!canSendAdminEmails) {
    return null
  }

  return (
    <DashboardLayoutClient role={role as any} userName={session?.user?.name || session?.user?.email || undefined}>
      <div className="w-full max-w-7xl mx-auto space-y-6 px-1 sm:px-0">
          <div className="px-1 sm:px-0">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Mail className="w-6 h-6 text-blue-600" />
              Send Custom Email
            </h1>
          {prefillInfo && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-amber-900">
                  Resending to {prefillInfo.failedCount}{' '}
                  {prefillInfo.failedCount === 1 ? 'recipient' : 'recipients'} from log {prefillInfo.logId}.
                </p>
                <p className="text-xs text-amber-700">
                  Only the failed recipients from the previous send are pre-selected.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-amber-900 border-amber-200 hover:bg-amber-50"
                onClick={() => router.replace('/emails/send')}
              >
                <X className="w-3 h-3" />
                Clear
              </Button>
            </div>
          )}
            <p className="text-slate-600 mt-1">
              Write and send a custom message to up to {MAX_MANUAL_RECIPIENTS} selected users or any role group.
            </p>
          </div>

            <Card className="sm:rounded-xl rounded-lg">
              <CardHeader className="p-2 sm:p-6 pb-0">
              <CardTitle>Recipients</CardTitle>
              <CardDescription>Select who should receive this email</CardDescription>
            </CardHeader>
              <CardContent className="space-y-6 p-2 sm:p-6 pt-4">
              <div>
                <Label>Recipient Scope</Label>
                <Select
                  value={recipientScope}
                  onValueChange={(value: 'all' | 'role' | 'individual') => {
                    setRecipientScope(value)
                    setSelectedRoles([])
                    setSelectedUserIds([])
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Selected Users (max {MAX_MANUAL_RECIPIENTS})</SelectItem>
                    <SelectItem value="role">By Role</SelectItem>
                    <SelectItem value="all">All Active Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recipientScope === 'role' && (
                <div>
                  <Label>Choose Roles</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[USER_ROLES.ADMIN, USER_ROLES.MEDED_TEAM, USER_ROLES.EDUCATOR, USER_ROLES.CTF, USER_ROLES.STUDENT].map((roleValue) => {
                      const isSelected = selectedRoles.includes(roleValue)
                      return (
                        <Badge
                          key={roleValue}
                          variant={isSelected ? 'default' : 'outline'}
                          className={cn('cursor-pointer select-none px-3 py-1 text-sm', isSelected ? 'bg-blue-600' : '')}
                          onClick={() => toggleRole(roleValue)}
                        >
                          {roleValue.replace('_', ' ')}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}

              {recipientScope === 'individual' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Selected Users ({selectedUserIds.length}/{MAX_MANUAL_RECIPIENTS})</Label>
                    {selectedUserIds.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 text-slate-700"
                        onClick={() => setSelectedUserIds([])}
                      >
                        <X className="w-3 h-3" />
                        Clear
                      </Button>
                    )}
                  </div>
                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => toggleUserSelection(user.id)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100/70 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 transition"
                        >
                          <Users className="w-3 h-3" />
                          <span>{user.name || user.email}</span>
                          <span className="inline-flex items-center justify-center rounded-full bg-white border border-slate-300 text-slate-500 w-4 h-4">
                            <X className="w-3 h-3" />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div>
                    <Label>Search Users</Label>
                    <Input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search by name or email"
                      className="mt-1"
                    />
                  </div>
                  <div className="bg-white border rounded-lg max-h-64 overflow-y-auto divide-y">
                    {usersLoading ? (
                      <div className="flex items-center justify-center py-6 text-sm text-slate-500">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading users...
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="py-6 text-center text-sm text-slate-500">No users found</div>
                    ) : (
                      filteredUsers.map((user) => (
                        <label
                          key={user.id}
                          className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm"
                        >
                          <div>
                            <div className="font-medium text-slate-900">{user.name || 'Unnamed User'}</div>
                            <div className="text-slate-500">{user.email}</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="h-4 w-4"
                          />
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

            <Card className="sm:rounded-xl rounded-lg">
              <CardHeader className="p-2 sm:p-6 pb-0">
              <CardTitle>Email Content</CardTitle>
              <CardDescription>Craft your message using the rich text editor</CardDescription>
            </CardHeader>
              <CardContent className="space-y-4 p-2 sm:p-6 pt-4">
              <div>
                <Label>Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Message</Label>
                <TiptapSimpleEditor
                  value={body}
                  onChange={setBody}
                  placeholder="Write your email content..."
                  draftId={draftId}
                  uploadContext="admin-email"
                  onImageUploaded={handleImageUploaded}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSendEmail}
                  disabled={isSending || prefillLoading}
                  className="inline-flex items-center gap-2"
                >
                  {isSending || prefillLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  {isSending || prefillLoading ? 'Sending...' : 'Send Email'}
                </Button>
              </div>
            </CardContent>
          </Card>
      </div>
    </DashboardLayoutClient>
  )
}

export default function AdminSendEmailPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading email console..." />}>
      <AdminSendEmailPageInner />
    </Suspense>
  )
}

