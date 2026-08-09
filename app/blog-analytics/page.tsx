'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  BarChart3,
  Clock,
  FileText,
  MousePointerClick,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { toast } from 'sonner'

function rankEmailMatches(query: string, emails: string[], limit = 8): string[] {
  const q = query.trim().toLowerCase()
  const unique = Array.from(new Set(emails.filter((e) => e && e !== 'unknown')))
  if (!q) return unique.sort((a, b) => a.localeCompare(b)).slice(0, limit)

  return unique
    .map((email) => {
      const e = email.toLowerCase()
      const local = e.split('@')[0] || ''
      let score = 0
      if (e === q) score = 100
      else if (e.startsWith(q)) score = 90
      else if (local.startsWith(q)) score = 80
      else if (e.includes(q)) score = 60
      else if (local.includes(q)) score = 50
      else return null
      return { email, score }
    })
    .filter((x): x is { email: string; score: number } => !!x)
    .sort((a, b) => b.score - a.score || a.email.localeCompare(b.email))
    .slice(0, limit)
    .map((x) => x.email)
}

function EmailTypeahead({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder = 'user@example.com',
  id,
  dropUp = false,
}: {
  value: string
  onChange: (value: string) => void
  onSelect?: (value: string) => void
  suggestions: string[]
  placeholder?: string
  id?: string
  dropUp?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const matches = useMemo(
    () => rankEmailMatches(value, suggestions, 8),
    [value, suggestions]
  )

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    setActiveIndex(0)
  }, [value, open])

  const pick = (email: string) => {
    onChange(email)
    onSelect?.(email)
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative">
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (!open || !matches.length) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActiveIndex((i) => Math.min(i + 1, matches.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIndex((i) => Math.max(i - 1, 0))
          } else if (e.key === 'Enter' && matches[activeIndex]) {
            e.preventDefault()
            pick(matches[activeIndex])
          } else if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
      />
      {open && matches.length > 0 && (
        <ul
          className={`absolute left-0 right-0 z-[80] max-h-48 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg ${
            dropUp ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          {matches.map((email, index) => (
            <li key={email}>
              <button
                type="button"
                className={`flex w-full px-3 py-2 text-left hover:bg-teal-50 ${
                  index === activeIndex ? 'bg-teal-50 text-teal-900' : 'text-slate-800'
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(email)}
              >
                {email}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

type ReaderRow = {
  userEmail: string
  isAdmin?: boolean
  pageSlug: string
  pageTitle: string
  sessions: number
  totalActiveSeconds: number
  maxScrollPercent: number
  events: number
  lastSeenAt: string
}

type AnalyticsPayload = {
  summary: {
    days: number
    totalSessions: number
    totalEvents: number
    uniqueReaders: number
    totalActiveSeconds: number
    adminSessions?: number
    nonAdminSessions?: number
    uniqueAdminReaders?: number
    uniqueNonAdminReaders?: number
    adminActiveSeconds?: number
    adminEvents?: number
  }
  pageStats: Array<{
    pageSlug: string
    pageTitle: string
    uniqueReaders: number
    uniqueAdminReaders?: number
    sessions: number
    adminSessions?: number
    totalActiveSeconds: number
    adminActiveSeconds?: number
    avgActiveSeconds: number
    events: number
    adminEvents?: number
  }>
  readers: ReaderRow[]
  adminReaders?: ReaderRow[]
  sessions: Array<{
    sessionId: string
    pageSlug: string
    pageTitle: string
    userEmail: string
    isAdmin?: boolean
    startedAt: string
    lastSeenAt: string
    activeSeconds: number
    maxScrollPercent: number
    eventCount: number
  }>
  events: Array<{
    id: string
    pageSlug: string
    userEmail: string
    isAdmin?: boolean
    eventType: string
    eventLabel: string
    eventHref: string
    createdAt: string
  }>
}

function AdminBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
      Admin
    </span>
  )
}

function formatDuration(seconds: number) {
  const s = Math.max(0, Math.round(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const rem = s % 60
  if (h > 0) return `${h}h ${m}m ${rem}s`
  if (m > 0) return `${m}m ${rem}s`
  return `${rem}s`
}

function formatDate(value: string) {
  const d = new Date(value)
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function BlogAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [data, setData] = useState<AnalyticsPayload | null>(null)
  const [days, setDays] = useState(30)
  const [pageSlug, setPageSlug] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [error, setError] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteScope, setDeleteScope] = useState<'user' | 'admins' | 'all'>('user')
  const [deleteEmail, setDeleteEmail] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([])
  const liveReadyRef = useRef(false)
  const daysRef = useRef(days)
  const pageSlugRef = useRef(pageSlug)
  const userEmailRef = useRef(userEmail)
  daysRef.current = days
  pageSlugRef.current = pageSlug
  userEmailRef.current = userEmail

  const knownEmails = useMemo(() => {
    const set = new Set<string>()
    for (const r of data?.readers || []) if (r.userEmail) set.add(r.userEmail)
    for (const r of data?.adminReaders || []) if (r.userEmail) set.add(r.userEmail)
    for (const s of data?.sessions || []) if (s.userEmail) set.add(s.userEmail)
    for (const e of emailSuggestions) if (e) set.add(e)
    return Array.from(set)
  }, [data, emailSuggestions])

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    void bootstrap()
  }, [session, status, router])

  const loadAnalytics = async (emailOverride?: string) => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams({ days: String(daysRef.current) })
      const slug = pageSlugRef.current.trim()
      const email = (emailOverride ?? userEmailRef.current).trim()
      if (slug) params.set('pageSlug', slug)
      if (email) params.set('userEmail', email)
      const res = await fetch(`/api/blog-analytics?${params.toString()}`, {
        credentials: 'include',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to load analytics')
      }
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const bootstrap = async () => {
    try {
      const roleRes = await fetch('/api/user/role')
      if (!roleRes.ok) {
        router.push('/dashboard')
        return
      }
      const { role } = await roleRes.json()
      if (role !== 'admin') {
        router.push('/dashboard')
        return
      }
      setAllowed(true)
      await loadAnalytics()
      liveReadyRef.current = true
    } catch {
      router.push('/dashboard')
    }
  }

  // Live filter: reload analytics as the email query changes
  useEffect(() => {
    if (!allowed || !liveReadyRef.current) return
    const t = window.setTimeout(() => {
      void loadAnalytics()
    }, 300)
    return () => window.clearTimeout(t)
  }, [userEmail, allowed])

  // Fetch ranked email suggestions while typing (filter + delete dialog)
  useEffect(() => {
    if (!allowed) return
    const query = deleteOpen ? deleteEmail : userEmail
    const t = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          days: String(days),
          emailSuggest: query.trim(),
        })
        if (pageSlug.trim()) params.set('pageSlug', pageSlug.trim())
        const res = await fetch(`/api/blog-analytics?${params.toString()}`, {
          credentials: 'include',
        })
        if (!res.ok) return
        const body = await res.json()
        setEmailSuggestions(Array.isArray(body.suggestions) ? body.suggestions : [])
      } catch {
        // ignore suggest errors
      }
    }, 200)
    return () => window.clearTimeout(t)
  }, [allowed, userEmail, deleteEmail, deleteOpen, days, pageSlug])

  const deleteDescription = (() => {
    const range = `last ${days} day${days === 1 ? '' : 's'}`
    const pageNote = pageSlug.trim() ? ` for post “${pageSlug.trim()}”` : ''
    if (deleteScope === 'user') {
      return `Permanently delete blog analytics for ${
        deleteEmail.trim() || 'the entered email'
      }${pageNote} over the ${range}. This cannot be undone.`
    }
    if (deleteScope === 'admins') {
      return `Permanently delete all admin blog analytics${pageNote} over the ${range}. User (non-admin) records are kept. This cannot be undone.`
    }
    return `Permanently delete ALL blog analytics records${pageNote} over the ${range}. This cannot be undone.`
  })()

  const handleDeleteRecords = async () => {
    if (deleteScope === 'user' && !deleteEmail.trim()) {
      toast.error('Enter a user email to delete')
      return
    }
    try {
      setDeleting(true)
      const res = await fetch('/api/blog-analytics/delete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: deleteScope,
          userEmail: deleteEmail.trim() || undefined,
          pageSlug: pageSlug.trim() || undefined,
          days,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Delete failed')
      toast.success(`Deleted ${body.deleted ?? 0} record(s)`)
      setDeleteOpen(false)
      await loadAnalytics()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete records')
    } finally {
      setDeleting(false)
    }
  }

  if (!allowed) {
    return (
      <DashboardLayoutClient role="admin" userName={session?.user?.name || undefined}>
        <div className="text-sm text-slate-600 p-6">Checking admin access…</div>
      </DashboardLayoutClient>
    )
  }

  return (
    <DashboardLayoutClient role="admin" userName={session?.user?.name || undefined}>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-teal-700" />
              Blog Analytics
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Foundation Year post reads, time spent, clicks and downloads. Admins only.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                setDeleteEmail(userEmail)
                setDeleteOpen(true)
              }}
              disabled={loading || deleting}
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete records
            </Button>
            <Button onClick={() => void loadAnalytics()} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <p className="text-xs text-slate-500 -mt-2">
          Tracking only runs when the reader has accepted analytics cookies / consent.
        </p>

        <Card>
          <CardContent className="pt-6 grid gap-3 md:grid-cols-4">
            <div>
              <label className="text-xs font-medium text-slate-600">Days</label>
              <Input
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(e) => setDays(Number(e.target.value) || 30)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Page slug</label>
              <Input
                placeholder="e.g. trust-induction-basildon-hospital"
                value={pageSlug}
                onChange={(e) => setPageSlug(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">User email</label>
              <EmailTypeahead
                value={userEmail}
                onChange={setUserEmail}
                onSelect={(email) => {
                  setUserEmail(email)
                  void loadAnalytics(email)
                }}
                suggestions={knownEmails}
                placeholder="Start typing an email…"
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={() => void loadAnalytics()} disabled={loading}>
                Apply filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {loading && !data ? (
          <div className="text-slate-600 text-sm">Loading analytics…</div>
        ) : data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Users className="h-4 w-4" /> Unique readers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{data.summary.uniqueReaders}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {(data.summary.uniqueNonAdminReaders ?? 0)} users ·{' '}
                    <span className="text-amber-700 font-medium">
                      {data.summary.uniqueAdminReaders ?? 0} admins
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{data.summary.totalSessions}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {(data.summary.nonAdminSessions ?? 0)} user ·{' '}
                    <span className="text-amber-700 font-medium">
                      {data.summary.adminSessions ?? 0} admin
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Total time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">
                    {formatDuration(data.summary.totalActiveSeconds)}
                  </div>
                  <div className="mt-1 text-xs text-amber-700 font-medium">
                    Admin time: {formatDuration(data.summary.adminActiveSeconds ?? 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <MousePointerClick className="h-4 w-4" /> Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{data.summary.totalEvents}</div>
                  <div className="mt-1 text-xs text-amber-700 font-medium">
                    Admin events: {data.summary.adminEvents ?? 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Posts</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b">
                      <th className="py-2 pr-4">Post</th>
                      <th className="py-2 pr-4">Readers</th>
                      <th className="py-2 pr-4">Sessions</th>
                      <th className="py-2 pr-4">Avg time</th>
                      <th className="py-2 pr-4">Events</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.pageStats.map((p) => (
                      <tr key={p.pageSlug} className="border-b border-slate-100">
                        <td className="py-2 pr-4">
                          <div className="font-medium text-slate-900">
                            {p.pageTitle || p.pageSlug}
                          </div>
                          <div className="text-xs text-slate-500">{p.pageSlug}</div>
                        </td>
                        <td className="py-2 pr-4">
                          {p.uniqueReaders}
                          {(p.uniqueAdminReaders ?? 0) > 0 && (
                            <div className="text-xs text-amber-700">
                              {p.uniqueAdminReaders} admin
                            </div>
                          )}
                        </td>
                        <td className="py-2 pr-4">
                          {p.sessions}
                          {(p.adminSessions ?? 0) > 0 && (
                            <div className="text-xs text-amber-700">
                              {p.adminSessions} admin
                            </div>
                          )}
                        </td>
                        <td className="py-2 pr-4">{formatDuration(p.avgActiveSeconds)}</td>
                        <td className="py-2 pr-4">
                          {p.events}
                          {(p.adminEvents ?? 0) > 0 && (
                            <div className="text-xs text-amber-700">
                              {p.adminEvents} admin
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!data.pageStats.length && (
                      <tr>
                        <td colSpan={5} className="py-6 text-slate-500">
                          No blog reads in this period yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Admin views
                  <AdminBadge />
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-amber-800/70 border-b border-amber-200">
                      <th className="py-2 pr-4">Admin</th>
                      <th className="py-2 pr-4">Post</th>
                      <th className="py-2 pr-4">Times read</th>
                      <th className="py-2 pr-4">Time spent</th>
                      <th className="py-2 pr-4">Scroll</th>
                      <th className="py-2 pr-4">Events</th>
                      <th className="py-2 pr-4">Last seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.adminReaders || data.readers.filter((r) => r.isAdmin)).map((r) => (
                      <tr
                        key={`admin-${r.userEmail}-${r.pageSlug}`}
                        className="border-b border-amber-100 bg-amber-50/70"
                      >
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-2">
                            <span>{r.userEmail}</span>
                            <AdminBadge />
                          </div>
                        </td>
                        <td className="py-2 pr-4">{r.pageTitle || r.pageSlug}</td>
                        <td className="py-2 pr-4">{r.sessions}</td>
                        <td className="py-2 pr-4">
                          {formatDuration(r.totalActiveSeconds)}
                        </td>
                        <td className="py-2 pr-4">{r.maxScrollPercent}%</td>
                        <td className="py-2 pr-4">{r.events}</td>
                        <td className="py-2 pr-4">{formatDate(r.lastSeenAt)}</td>
                      </tr>
                    ))}
                    {!(data.adminReaders || []).length &&
                      !data.readers.some((r) => r.isAdmin) && (
                        <tr>
                          <td colSpan={7} className="py-6 text-amber-800/70">
                            No admin views in this period yet.
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All readers</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b">
                      <th className="py-2 pr-4">User</th>
                      <th className="py-2 pr-4">Post</th>
                      <th className="py-2 pr-4">Times read</th>
                      <th className="py-2 pr-4">Time spent</th>
                      <th className="py-2 pr-4">Scroll</th>
                      <th className="py-2 pr-4">Events</th>
                      <th className="py-2 pr-4">Last seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.readers.map((r) => (
                      <tr
                        key={`${r.userEmail}-${r.pageSlug}`}
                        className={`border-b border-slate-100 ${
                          r.isAdmin ? 'bg-amber-50/80' : ''
                        }`}
                      >
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-2">
                            <span>{r.userEmail}</span>
                            {r.isAdmin && <AdminBadge />}
                          </div>
                        </td>
                        <td className="py-2 pr-4">{r.pageTitle || r.pageSlug}</td>
                        <td className="py-2 pr-4">{r.sessions}</td>
                        <td className="py-2 pr-4">
                          {formatDuration(r.totalActiveSeconds)}
                        </td>
                        <td className="py-2 pr-4">{r.maxScrollPercent}%</td>
                        <td className="py-2 pr-4">{r.events}</td>
                        <td className="py-2 pr-4">{formatDate(r.lastSeenAt)}</td>
                      </tr>
                    ))}
                    {!data.readers.length && (
                      <tr>
                        <td colSpan={7} className="py-6 text-slate-500">
                          No reader activity yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Clicks & downloads</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b">
                      <th className="py-2 pr-4">When</th>
                      <th className="py-2 pr-4">User</th>
                      <th className="py-2 pr-4">Post</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Label / target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.events.map((e) => (
                      <tr
                        key={e.id}
                        className={`border-b border-slate-100 ${
                          e.isAdmin ? 'bg-amber-50/80' : ''
                        }`}
                      >
                        <td className="py-2 pr-4 whitespace-nowrap">
                          {formatDate(e.createdAt)}
                        </td>
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-2">
                            <span>{e.userEmail}</span>
                            {e.isAdmin && <AdminBadge />}
                          </div>
                        </td>
                        <td className="py-2 pr-4">{e.pageSlug}</td>
                        <td className="py-2 pr-4 capitalize">{e.eventType}</td>
                        <td className="py-2 pr-4">
                          <div>{e.eventLabel || '—'}</div>
                          {e.eventHref && (
                            <div className="text-xs text-slate-500 break-all">
                              {e.eventHref}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!data.events.length && (
                      <tr>
                        <td colSpan={5} className="py-6 text-slate-500">
                          No click/download events yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => void handleDeleteRecords()}
        className="overflow-visible"
        title="Delete blog analytics records"
        description={
          <div className="space-y-4 text-left">
            <p className="text-sm text-slate-600">{deleteDescription}</p>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Delete scope</label>
              <select
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={deleteScope}
                onChange={(e) =>
                  setDeleteScope(e.target.value as 'user' | 'admins' | 'all')
                }
              >
                <option value="user">Specific user email</option>
                <option value="admins">All admin views</option>
                <option value="all">All records in range</option>
              </select>
            </div>
            {deleteScope === 'user' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">User email</label>
                <EmailTypeahead
                  value={deleteEmail}
                  onChange={setDeleteEmail}
                  onSelect={setDeleteEmail}
                  suggestions={knownEmails}
                  placeholder="Start typing an email…"
                  dropUp
                />
              </div>
            )}
            <p className="text-xs text-slate-500">
              Uses current filters: days = {days}
              {pageSlug.trim() ? `, page = ${pageSlug.trim()}` : ', all pages'}.
            </p>
          </div>
        }
        confirmText={deleting ? 'Deleting…' : 'Delete'}
        variant="destructive"
        isLoading={deleting}
        disabled={deleting || (deleteScope === 'user' && !deleteEmail.trim())}
      />
    </DashboardLayoutClient>
  )
}
