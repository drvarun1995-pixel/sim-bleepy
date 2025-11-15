'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { useRole } from '@/lib/useRole'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Mail,
  Eye,
  History,
  Loader2,
  Filter,
  Download,
  Users,
  Search,
  RefreshCcw,
  Trash2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'

interface AdminEmailLog {
  id: string
  sender_user_id: string | null
  sender_email: string | null
  sender_name: string | null
  subject: string
  body_html: string
  recipient_scope: 'all' | 'role' | 'individual'
  recipient_roles: string[] | null
  recipient_ids: string[] | null
  recipient_emails: string[] | null
  total_recipients: number
  success_count: number | null
  failed_count: number | null
  failed_recipient_emails: string[] | null
  failed_recipient_ids: string[] | null
  failure_messages: { email: string; message: string }[] | null
  recipient_names: string[] | null
  recipient_name_search: string | null
  created_at: string
}

interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface SenderOption {
  email: string
  name: string | null
}

const scopeOptions: { label: string; value: 'all' | 'individual' | 'role' }[] = [
  { label: 'All audiences', value: 'all' },
  { label: 'Selected users', value: 'individual' },
  { label: 'Role-based', value: 'role' },
]

const pageSizeOptions = [10, 20, 30, 50]

const statusFilterOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Successful only', value: 'success' },
  { label: 'Failed only', value: 'failed' },
]

const statusConfig = {
  sent: {
    label: 'Sent',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  failed: {
    label: 'Failed',
    className: 'bg-rose-100 text-rose-800 border-rose-200',
  },
}

export default function AdminEmailLogsPage() {
  const { data: session, status } = useSession()
  const { role, loading: roleLoading, canSendAdminEmails } = useRole()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const [logs, setLogs] = useState<AdminEmailLog[]>([])
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AdminEmailLog | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailView, setDetailView] = useState<'preview' | 'html'>('preview')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteContext, setDeleteContext] = useState<{ type: 'single' | 'bulk' | 'all'; ids: string[] }>({
    type: 'single',
    ids: [],
  })
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const deleteConfirmDisabled = deleteConfirmText !== 'DELETE'
  const [reloadKey, setReloadKey] = useState(0)

  const [scopeFilter, setScopeFilter] = useState<'all' | 'individual' | 'role'>('all')
  const [senderFilter, setSenderFilter] = useState<string>('all')
  const [senders, setSenders] = useState<SenderOption[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const isMobile = useIsMobile()
  const [mobileTooltipTarget, setMobileTooltipTarget] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(searchTerm), 400)
    return () => clearTimeout(timer)
  }, [searchTerm])

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

    const fetchLogs = async () => {
      setLoadingLogs(true)
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pageSize.toString(),
        })
        if (scopeFilter !== 'all') {
          params.set('scope', scopeFilter)
        }
        if (senderFilter !== 'all') {
          params.set('sender', senderFilter)
        }
        if (statusFilter !== 'all') {
          params.set('status', statusFilter)
        }
        if (startDate) {
          params.set('startDate', startDate)
        }
        if (endDate) {
          params.set('endDate', endDate)
        }
        if (searchDebounced) {
          params.set('search', searchDebounced)
        }

        const response = await fetch(`/api/admin/emails/logs?${params.toString()}`)
        if (!response.ok) throw new Error('Failed to fetch email logs')
        const data = await response.json()
        setLogs(data.logs || [])
        setPagination(data.pagination || null)
        setSenders(data.senders || [])
      } catch (error) {
        console.error('Failed to load email logs:', error)
        toast.error('Unable to load email history')
      } finally {
        setLoadingLogs(false)
      }
    }

    fetchLogs()
  }, [
    session,
    canSendAdminEmails,
    page,
    pageSize,
    scopeFilter,
    senderFilter,
    statusFilter,
    startDate,
    endDate,
    searchDebounced,
    reloadKey,
  ])

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => logs.some((log) => log.id === id)))
  }, [logs])

  useEffect(() => {
    setMobileTooltipTarget(null)
  }, [logs, isMobile])

  const audienceSummary = (log: AdminEmailLog) => {
    if (log.recipient_scope === 'all') {
      return 'All Active Users'
    }
    if (log.recipient_scope === 'role') {
      return `Roles: ${(log.recipient_roles || []).join(', ') || 'n/a'}`
    }
    return `${log.total_recipients} selected user${log.total_recipients === 1 ? '' : 's'}`
  }

  const deriveStatus = (log: AdminEmailLog) => {
    if (log.failed_count && log.failed_count > 0) return 'failed'
    if (!log.total_recipients || log.total_recipients <= 0) return 'failed'
    return 'sent'
  }

  const detailRecipients = useMemo(() => {
    if (!selectedLog) return []
    if (selectedLog.recipient_scope === 'all') return ['All active users']
    if (selectedLog.recipient_scope === 'role') {
      return (selectedLog.recipient_roles || []).length > 0
        ? selectedLog.recipient_roles!
        : ['No roles saved']
    }
    const emails = selectedLog.recipient_emails || []
    if (emails.length === 0) return ['No email snapshot stored']
    return emails.map((email, index) => {
      const name = selectedLog.recipient_names?.[index]
      return name ? `${name} (${email})` : email
    })
  }, [selectedLog])

  const totals = useMemo(() => {
    return {
      totalEmails: pagination?.total || 0,
      totalRecipients: logs.reduce((sum, log) => sum + (log.total_recipients || 0), 0),
    }
  }, [logs, pagination])
  const allSelected = logs.length > 0 && selectedIds.length === logs.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < logs.length
  const masterCheckboxState: boolean | 'indeterminate' = allSelected ? true : someSelected ? 'indeterminate' : false

  const toggleSelect = (logId: string) => {
    setSelectedIds((prev) => (prev.includes(logId) ? prev.filter((id) => id !== logId) : [...prev, logId]))
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(logs.map((log) => log.id))
    }
  }

  const openDeleteDialog = (type: 'single' | 'bulk' | 'all', ids: string[] = []) => {
    setDeleteContext({ type, ids })
    setDeleteConfirmText('')
    setDeleteDialogOpen(true)
  }

  const runDelete = async () => {
    try {
      setLoadingLogs(true)
      const endpoint =
        deleteContext.type === 'all' ? '/api/admin/emails/logs/delete-all' : '/api/admin/emails/logs/delete'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: deleteContext.type === 'all' ? undefined : { 'Content-Type': 'application/json' },
        body:
          deleteContext.type === 'all'
            ? undefined
            : JSON.stringify({
                ids: deleteContext.ids,
              }),
      })
      if (!response.ok) throw new Error('Failed to delete logs')

      toast.success(
        deleteContext.type === 'all'
          ? 'All email logs deleted.'
          : `${deleteContext.ids.length} log${deleteContext.ids.length === 1 ? '' : 's'} deleted.`
      )
      setSelectedIds([])
      setDeleteDialogOpen(false)
      setDeleteConfirmText('')
      setReloadKey((prev) => prev + 1)
    } catch (error) {
      console.error('Delete logs error:', error)
      toast.error('Unable to delete logs')
    } finally {
      setLoadingLogs(false)
    }
  }

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return
    openDeleteDialog('bulk', selectedIds)
  }

  const toggleMobileTooltip = (logId: string) => {
    if (!isMobile) return
    setMobileTooltipTarget((prev) => (prev === logId ? null : logId))
  }


  const handleExport = () => {
    if (!logs.length) {
      toast.info('No rows to export')
      return
    }

    const headers = ['Date', 'Subject', 'Sender', 'Scope', 'Recipients']
    const rows = logs.map((log) => [
      new Date(log.created_at).toISOString(),
      `"${log.subject.replace(/"/g, '""')}"`,
      log.sender_email || '',
      log.recipient_scope,
      log.total_recipients.toString(),
    ])

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `email-logs-page-${page}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const resetFilters = () => {
    setScopeFilter('all')
    setSenderFilter('all')
    setStatusFilter('all')
    setStartDate('')
    setEndDate('')
    setSearchTerm('')
    setSearchDebounced('')
    setPage(1)
  }

  if (status === 'loading' || roleLoading || !role) {
    return <LoadingScreen message="Loading dashboard..." />
  }

  if (!canSendAdminEmails) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <DashboardSidebar
        role={role as any}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <main className="flex-1 w-full overflow-auto p-4 sm:p-6 lg:p-8">
        <TooltipProvider delayDuration={isMobile ? 0 : 150}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <History className="w-6 h-6 text-blue-600" />
              Email Activity
            </h1>
            <p className="text-slate-600 mt-1">
              Review the custom emails sent through the dashboard, filter by sender or audience, and audit the exact
              content that left the platform.
            </p>
          </div>

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <CardTitle>Sent Emails</CardTitle>
                  <CardDescription>Recent campaigns sent by Admin and MedEd team members</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleExport}>
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={!logs.length}
                    onClick={() => openDeleteDialog('all')}
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={resetFilters}>
                    <RefreshCcw className="w-4 h-4" />
                    Reset
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-6">
                <div className="flex items-center gap-2 rounded-xl border bg-white/40 px-2.5 py-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Total Emails</p>
                    <p className="text-xl font-semibold text-slate-900">{totals.totalEmails}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border bg-white/40 px-2.5 py-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Recipients</p>
                    <p className="text-xl font-semibold text-slate-900">{totals.totalRecipients}</p>
                  </div>
                </div>
                <div className="rounded-xl border bg-white/40 px-4 py-3 col-span-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 inline-flex items-center gap-1">
                    <Filter className="w-3 h-3" />
                    Filters
                  </p>
                  <div className="grid gap-4 md:grid-cols-5">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Scope</p>
                      <Select
                        value={scopeFilter}
                        onValueChange={(value) => {
                          setScopeFilter(value as 'all' | 'individual' | 'role')
                          setPage(1)
                        }}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Scope" />
                        </SelectTrigger>
                        <SelectContent>
                          {scopeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Sender</p>
                      <Select
                        value={senderFilter}
                        onValueChange={(value) => {
                          setSenderFilter(value)
                          setPage(1)
                        }}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Sender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All senders</SelectItem>
                          {senders.map((sender) => (
                            <SelectItem key={sender.email} value={sender.email}>
                              {sender.name || sender.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-1">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Status</p>
                      <Select
                        value={statusFilter}
                        onValueChange={(value) => {
                          setStatusFilter(value as 'all' | 'success' | 'failed')
                          setPage(1)
                        }}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusFilterOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-1">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Page Size</p>
                      <Select
                        value={String(pageSize)}
                        onValueChange={(value) => {
                          setPageSize(Number(value))
                          setPage(1)
                        }}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Page size" />
                        </SelectTrigger>
                        <SelectContent>
                          {pageSizeOptions.map((size) => (
                            <SelectItem key={size} value={String(size)}>
                              Show {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Start Date</p>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(event) => {
                            setStartDate(event.target.value)
                            setPage(1)
                          }}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">End Date</p>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(event) => {
                            setEndDate(event.target.value)
                            setPage(1)
                          }}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  className="pl-10"
                  placeholder="Search subject, sender, or recipient…"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value)
                    setPage(1)
                  }}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingLogs ? (
                <div className="flex items-center justify-center py-10 text-slate-500">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Loading email history...
                </div>
              ) : logs.length === 0 ? (
                <div className="py-10 text-center text-slate-500">
                  No matching emails yet. Adjust your filters or try a different search phrase.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-slate-600">
                      {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'No rows selected'}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-2"
                      disabled={selectedIds.length === 0}
                      onClick={handleDeleteSelected}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Selected
                    </Button>
                  </div>

                  <div className="-mx-4 sm:-mx-6 lg:mx-0" role="region" aria-label="Email logs table">
                    <div className="overflow-x-auto touch-pan-x">
                      <div className="min-h-[480px]">
                        <div
                          className="rounded-2xl border border-slate-200 bg-white shadow-sm"
                          style={{ minWidth: '1150px' }}
                        >
                          <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-3 sm:px-6 py-3 border-b border-slate-200">
                            <div
                              className="grid grid-cols-12 gap-2 sm:gap-4 items-center text-xs font-semibold uppercase tracking-wide text-slate-600"
                              style={{ minWidth: '1150px' }}
                            >
                            <div className="col-span-4 flex items-center gap-3">
                                <Checkbox
                                  checked={masterCheckboxState}
                                  onCheckedChange={toggleSelectAll}
                                  aria-label="Select all email logs"
                                />
                                <div>
                                <p>Subject</p>
                                <p className="text-[11px] text-slate-500 normal-case">Shows subject and timestamp</p>
                                </div>
                              </div>
                              <div className="col-span-2">
                                <p>Audience</p>
                              </div>
                              <div className="col-span-2">
                                <p>Sender</p>
                              </div>
                              <div className="col-span-1 text-center">
                                <p>Recipients</p>
                              </div>
                              <div className="col-span-1 text-center">
                                <p>Status</p>
                              </div>
                              <div className="col-span-2 text-center">
                                <p>Actions</p>
                              </div>
                            </div>
                          </div>

                          <div className="divide-y divide-slate-200">
                            {logs.map((log, index) => {
                              const status = deriveStatus(log)
                              const statusStyles = statusConfig[status as keyof typeof statusConfig]
                              return (
                                <div
                                  key={log.id}
                                  className={cn(
                                    'px-3 sm:px-6 py-4 transition-colors border-b border-slate-200/80',
                                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60',
                                    'hover:bg-slate-50'
                                  )}
                                >
                                  <div
                                    className="grid grid-cols-12 gap-3 sm:gap-4 items-center text-sm text-slate-900"
                                    style={{ minWidth: '1150px' }}
                                  >
                                    <div className="col-span-4 flex gap-3 border-r border-slate-200 pr-3">
                                      <Checkbox
                                        checked={selectedIds.includes(log.id)}
                                        onCheckedChange={() => toggleSelect(log.id)}
                                        aria-label="Select this log"
                                        className="mt-1"
                                      />
                                      <div className="space-y-1 min-w-0 text-left">
                                        <p className="text-sm font-semibold truncate text-slate-900">{log.subject}</p>
                                        <p className="text-xs text-slate-500">
                                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="col-span-2 min-w-0 text-left space-y-1 border-r border-slate-200 pr-3">
                                      <p className="font-medium text-slate-900">{audienceSummary(log)}</p>
                                      {log.recipient_scope === 'role' && log.recipient_roles && (
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                          {log.recipient_roles.join(', ')}
                                        </p>
                                      )}
                                      {log.recipient_scope === 'individual' &&
                                        log.recipient_emails &&
                                        log.recipient_emails.length > 0 && (
                                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                                            <Badge variant="outline" className="text-xs">
                                              {log.recipient_names?.[0] || log.recipient_emails[0]}
                                            </Badge>
                                            {log.recipient_emails.length > 1 && (
                                              <Tooltip
                                                open={isMobile ? mobileTooltipTarget === log.id : undefined}
                                                onOpenChange={(open) => {
                                                  if (!isMobile) return
                                                  setMobileTooltipTarget(open ? log.id : null)
                                                }}
                                              >
                                                <TooltipTrigger asChild>
                                                  <button
                                                    type="button"
                                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 focus:outline-none underline-offset-2 hover:underline"
                                                    onClick={() => toggleMobileTooltip(log.id)}
                                                  >
                                                    +{log.recipient_emails.length - 1} more
                                                  </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="max-w-xs">
                                                  <div className="flex flex-col gap-1 text-xs text-slate-900">
                                                    {log.recipient_emails.slice(1).map((recipient, index) => {
                                                      const overallIndex = index + 1
                                                      const name = log.recipient_names?.[overallIndex]
                                                      return (
                                                        <span key={`${recipient}-${overallIndex}`}>
                                                          {name ? `${name} (${recipient})` : recipient}
                                                        </span>
                                                      )
                                                    })}
                                                  </div>
                                                </TooltipContent>
                                              </Tooltip>
                                            )}
                                          </div>
                                        )}
                                    </div>

                                    <div className="col-span-2 min-w-0 text-left space-y-1 border-r border-slate-200 pr-3">
                                      <p className="font-medium text-slate-900">
                                        {log.sender_name || log.sender_email || 'Unknown'}
                                      </p>
                                      {log.sender_email && (
                                        <p className="text-xs text-slate-500 mt-1 break-all">{log.sender_email}</p>
                                      )}
                                    </div>

                                    <div className="col-span-1 text-center space-y-1 border-r border-slate-200 pr-3">
                                      <p className="text-slate-900 font-semibold">{log.total_recipients}</p>
                                      {log.failed_count && log.failed_count > 0 ? (
                                        <p className="text-xs text-rose-600 mt-1">Failed {log.failed_count}</p>
                                      ) : (
                                        <p className="text-xs text-emerald-600 mt-1">All delivered</p>
                                      )}
                                    </div>

                                    <div className="col-span-1 text-center space-y-2 border-r border-slate-200 pr-3">
                                      <Badge className={cn('text-xs border', statusStyles.className)}>
                                        {statusStyles.label}
                                      </Badge>
                                      {(log.failed_count ?? 0) > 0 && log.failure_messages && (
                                        <p className="text-[11px] text-rose-600 line-clamp-2">
                                          {(log.failure_messages[0]?.message || '').slice(0, 60)}
                                          {log.failure_messages.length > 1 ? '…' : ''}
                                        </p>
                                      )}
                                    </div>

                                    <div className="col-span-2 text-center">
                                      <div className="flex flex-col gap-2 items-center">
                                        {(log.failed_count ?? 0) > 0 && (
                                          <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => router.push(`/emails/send?resend=${log.id}`)}
                                          >
                                            Resend failed
                                          </Button>
                                        )}
                                        <div className="flex flex-wrap gap-2 justify-center">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-2"
                                            onClick={() => {
                                              setSelectedLog(log)
                                              setDetailView('preview')
                                              setDetailOpen(true)
                                            }}
                                          >
                                            <Eye className="w-4 h-4" />
                                            View
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Delete this log"
                                            onClick={() => openDeleteDialog('single', [log.id])}
                                          >
                                            <Trash2 className="w-4 h-4 text-slate-500" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1 || loadingLogs}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  >
                    Previous
                  </Button>
                  <p className="text-sm text-slate-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === pagination.totalPages || loadingLogs}
                    onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </TooltipProvider>
      </main>

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) {
            setDetailView('preview')
            setSelectedLog(null)
          }
        }}
      >
        <DialogContent
          className="flex flex-col overflow-hidden"
          style={{ width: '90vw', maxWidth: '90vw', height: '90vh', maxHeight: '90vh' }}
        >
          <DialogHeader>
            <DialogTitle>{selectedLog?.subject || 'Email Details'}</DialogTitle>
            <DialogDescription>
              Sent {selectedLog ? formatDistanceToNow(new Date(selectedLog.created_at), { addSuffix: true }) : ''}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-6 flex-1 overflow-y-auto pr-2">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Recipients</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {detailRecipients.map((recipient) => (
                    <Badge key={recipient} variant="outline" className="text-xs">
                      {recipient}
                    </Badge>
                  ))}
                </div>
              </div>
              {selectedLog.failed_count && selectedLog.failed_count > 0 && (
                <div>
                  <p className="text-xs font-semibold text-rose-600 uppercase">Failed Recipients</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(selectedLog.failed_recipient_emails || []).map((recipient) => (
                      <Badge key={recipient} variant="destructive" className="text-xs">
                        {recipient}
                      </Badge>
                    ))}
                  </div>
                  {selectedLog.failure_messages && selectedLog.failure_messages.length > 0 && (
                    <ul className="mt-3 space-y-1 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
                      {selectedLog.failure_messages.map((failure) => (
                        <li key={`${failure.email}-${failure.message}`}>
                          <span className="font-medium">{failure.email}:</span> {failure.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant={detailView === 'preview' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDetailView('preview')}
                  >
                    Preview
                  </Button>
                  <Button
                    variant={detailView === 'html' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDetailView('html')}
                  >
                    HTML
                  </Button>
                </div>

                {detailView === 'preview' ? (
                  <div className="bg-slate-50 p-4 rounded-lg border overflow-hidden">
                    <div
                      className="prose prose-sm max-w-none text-slate-900 relative after:content-[''] after:block after:clear-both [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:shadow-sm"
                      dangerouslySetInnerHTML={{ __html: selectedLog.body_html }}
                    />
                  </div>
                ) : (
                  <pre className="bg-slate-900 text-slate-100 text-xs p-4 rounded-lg overflow-x-auto">
                    {selectedLog.body_html}
                  </pre>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) {
            setDeleteConfirmText('')
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete email logs</DialogTitle>
            <DialogDescription>
              This cannot be undone. Type <span className="font-semibold">DELETE</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirmText}
            onChange={(event) => setDeleteConfirmText(event.target.value)}
            placeholder="Type DELETE to confirm"
            className="mt-4"
          />
          <div className="flex items-center justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeleteConfirmText('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmDisabled || loadingLogs}
              onClick={runDelete}
              className="flex items-center gap-2"
            >
              {loadingLogs && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

