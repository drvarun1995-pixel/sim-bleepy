'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Download,
  Filter,
  FolderOpen,
  Presentation,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react'
import { getTeachingResourceCategory } from '@/lib/teaching-resources'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type LibraryTab = 'study' | 'teaching'

type DownloadRow = {
  id: string
  resource_name: string
  user_email: string
  user_name: string
  download_timestamp: string
  file_size?: number | null
  file_type?: string | null
  category?: string | null
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${date.getFullYear()}`
}

function formatDateTime(dateString: string | null) {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${date.getFullYear()} ${hours}:${minutes}`
}

function friendlyFileType(mimeType?: string | null) {
  const type = mimeType || 'unknown'
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/msword': 'Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/vnd.ms-powerpoint': 'PowerPoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/webp': 'WEBP',
    'audio/mpeg': 'MP3',
    'audio/wav': 'WAV',
    'audio/ogg': 'OGG',
    'application/zip': 'ZIP',
    unknown: 'Unknown',
  }
  return typeMap[type] || type.split('/')[1]?.toUpperCase() || 'Other'
}

function filterRows(rows: DownloadRow[], dateFilter: string, userFilter: string) {
  const days = parseInt(dateFilter, 10)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const query = userFilter.trim().toLowerCase()

  return rows.filter((row) => {
    if (days > 0 && new Date(row.download_timestamp) < cutoff) return false
    if (!query) return true
    return (
      (row.user_email || '').toLowerCase().includes(query) ||
      (row.user_name || '').toLowerCase().includes(query) ||
      (row.resource_name || '').toLowerCase().includes(query)
    )
  })
}

function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export default function DownloadAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState<LibraryTab>('study')
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('0')
  const [userFilter, setUserFilter] = useState('')
  const [studyDownloads, setStudyDownloads] = useState<DownloadRow[]>([])
  const [teachingDownloads, setTeachingDownloads] = useState<DownloadRow[]>([])
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteScope, setDeleteScope] = useState<'user' | 'admins' | 'all'>('user')
  const [deleteEmail, setDeleteEmail] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin?callbackUrl=/download-analytics')
      return
    }
    void checkAccess()
  }, [session, status, router])

  const checkAccess = async () => {
    try {
      const response = await fetch('/api/user/role')
      if (!response.ok) {
        router.push('/dashboard')
        return
      }
      const { role } = await response.json()
      if (role !== 'admin' && role !== 'meded_team') {
        router.push('/dashboard')
        return
      }
      await loadDownloads()
    } catch {
      router.push('/dashboard')
    }
  }

  const loadDownloads = async () => {
    setLoading(true)
    try {
      const [studyResponse, teachingResponse] = await Promise.all([
        fetch('/api/downloads/track?limit=10000'),
        fetch('/api/teaching-resources/track?limit=10000'),
      ])
      const studyData = studyResponse.ok ? await studyResponse.json() : { downloads: [] }
      const teachingData = teachingResponse.ok ? await teachingResponse.json() : { downloads: [] }
      setStudyDownloads(studyData.downloads || [])
      setTeachingDownloads(teachingData.downloads || [])
    } finally {
      setLoading(false)
    }
  }

  const studyRows = useMemo(
    () => filterRows(studyDownloads, dateFilter, userFilter),
    [studyDownloads, dateFilter, userFilter]
  )
  const teachingRows = useMemo(
    () => filterRows(teachingDownloads, dateFilter, userFilter),
    [teachingDownloads, dateFilter, userFilter]
  )
  const activeRows = tab === 'study' ? studyRows : teachingRows
  const today = startOfToday()

  const studyToday = studyDownloads.filter((row) => new Date(row.download_timestamp) >= today).length
  const teachingToday = teachingDownloads.filter((row) => new Date(row.download_timestamp) >= today).length

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const row of activeRows) {
      const label =
        tab === 'teaching'
          ? getTeachingResourceCategory(row.category || '')?.name || row.category || 'Unknown'
          : friendlyFileType(row.file_type)
      counts[label] = (counts[label] || 0) + 1
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [activeRows, tab])

  const uniqueUsers = new Set(activeRows.map((row) => row.user_email).filter(Boolean)).size
  const knownEmails = useMemo(() => {
    const emails = new Set<string>()
    for (const row of tab === 'study' ? studyDownloads : teachingDownloads) {
      if (row.user_email) emails.add(row.user_email)
    }
    return Array.from(emails).sort((a, b) => a.localeCompare(b))
  }, [tab, studyDownloads, teachingDownloads])

  const deleteRangeLabel =
    dateFilter === '0' ? 'all time' : dateFilter === '1' ? 'last 24 hours' : `last ${dateFilter} days`
  const deleteLibraryLabel = tab === 'teaching' ? 'Resources for Teaching' : 'Study resources'
  const deleteDescription =
    deleteScope === 'user'
      ? `Permanently delete ${deleteLibraryLabel} download records for ${
          deleteEmail.trim() || 'the entered email'
        } over ${deleteRangeLabel}. This cannot be undone.`
      : deleteScope === 'admins'
        ? `Permanently delete all admin ${deleteLibraryLabel} download records over ${deleteRangeLabel}. Other users are kept. This cannot be undone.`
        : `Permanently delete ALL ${deleteLibraryLabel} download records over ${deleteRangeLabel}. This cannot be undone.`

  const handleDeleteRecords = async () => {
    if (deleteScope === 'user' && !deleteEmail.trim()) {
      toast.error('Enter a user email to delete')
      return
    }
    try {
      setDeleting(true)
      const res = await fetch('/api/download-analytics/delete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          library: tab,
          scope: deleteScope,
          userEmail: deleteEmail.trim() || undefined,
          days: parseInt(dateFilter, 10) || 0,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Delete failed')
      toast.success(`Deleted ${body.deleted ?? 0} record(s)`)
      setDeleteOpen(false)
      await loadDownloads()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete records')
    } finally {
      setDeleting(false)
    }
  }

  const exportCsv = () => {
    const header = tab === 'teaching'
      ? ['Library', 'File', 'Category', 'Downloaded by', 'Email', 'When']
      : ['Library', 'File', 'File type', 'Downloaded by', 'Email', 'When']
    const lines = [
      header.join(','),
      ...activeRows.map((row) => {
        const extra =
          tab === 'teaching'
            ? getTeachingResourceCategory(row.category || '')?.name || row.category || ''
            : friendlyFileType(row.file_type)
        return [
          tab === 'teaching' ? 'Resources for Teaching' : 'Study resources',
          `"${(row.resource_name || '').replace(/"/g, '""')}"`,
          `"${extra}"`,
          `"${(row.user_name || '').replace(/"/g, '""')}"`,
          row.user_email || '',
          row.download_timestamp || '',
        ].join(',')
      }),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${tab === 'teaching' ? 'teaching' : 'study'}-downloads-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayoutClient role="admin" userName={session?.user?.name || undefined}>
        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
          <div className="h-40 animate-pulse rounded bg-gray-200" />
        </div>
      </DashboardLayoutClient>
    )
  }

  return (
    <DashboardLayoutClient role="admin" userName={session?.user?.name || undefined}>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">Download Analytics</h1>
            <p className="mt-2 text-gray-600">
              Study resource downloads and Resources for Teaching are tracked separately.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50"
              disabled={loading || deleting}
              onClick={() => {
                setDeleteEmail(userFilter.includes('@') ? userFilter.trim() : '')
                setDeleteOpen(true)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete records
            </Button>
            <Button variant="outline" onClick={() => void exportCsv()}>
              <Download className="mr-2 h-4 w-4" />
              Export this library
            </Button>
            <Button variant="outline" onClick={() => void loadDownloads()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setTab('study')}
            className={`rounded-xl border p-4 text-left transition ${
              tab === 'study'
                ? 'border-blue-400 bg-blue-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <FolderOpen className="mb-2 h-5 w-5 text-blue-600" />
            <p className="font-semibold text-slate-900">Study resources</p>
            <p className="mt-1 text-sm text-slate-600">
              Student Downloads library · {studyDownloads.length} downloads
            </p>
          </button>
          <button
            type="button"
            onClick={() => setTab('teaching')}
            className={`rounded-xl border p-4 text-left transition ${
              tab === 'teaching'
                ? 'border-teal-400 bg-teal-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <Presentation className="mb-2 h-5 w-5 text-teal-700" />
            <p className="font-semibold text-slate-900">Resources for Teaching</p>
            <p className="mt-1 text-sm text-slate-600">
              Staff teaching library · {teachingDownloads.length} downloads
            </p>
          </button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Date range</label>
              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="rounded border px-3 py-1 text-sm"
              >
                <option value="0">All time</option>
                <option value="1">Last 24 hours</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                value={userFilter}
                onChange={(event) => setUserFilter(event.target.value)}
                placeholder="File, name, or email"
                className="w-64"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-gray-600">
                {tab === 'study' ? 'Study downloads' : 'Teaching downloads'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{activeRows.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-gray-600">Today (all time, unfiltered)</p>
              <p className="text-2xl font-bold text-gray-900">
                {tab === 'study' ? studyToday : teachingToday}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                Unique downloaders
              </div>
              <p className="text-2xl font-bold text-gray-900">{uniqueUsers}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {tab === 'study' ? 'Study downloads by file type' : 'Teaching downloads by category'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="py-12 text-center text-gray-500">No downloads in this view</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-20} textAnchor="end" height={70} fontSize={12} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill={tab === 'study' ? '#2563eb' : '#0d9488'} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent {tab === 'study' ? 'study' : 'teaching'} downloads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 space-y-3 overflow-y-auto">
                {activeRows.slice(0, 10).map((row) => (
                  <div key={row.id} className="flex items-center gap-3 rounded-lg border bg-white p-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        tab === 'study' ? 'bg-blue-100' : 'bg-teal-100'
                      }`}
                    >
                      {tab === 'study' ? (
                        <FolderOpen className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Presentation className="h-4 w-4 text-teal-700" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{row.resource_name}</p>
                      <p className="text-xs text-gray-600">
                        {tab === 'teaching'
                          ? getTeachingResourceCategory(row.category || '')?.name || row.category || 'Uncategorised'
                          : friendlyFileType(row.file_type)}
                        {' · '}
                        {row.user_name || row.user_email}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">{formatDate(row.download_timestamp)}</p>
                  </div>
                ))}
                {activeRows.length === 0 && (
                  <p className="py-12 text-center text-gray-500">No downloads found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {tab === 'study' ? 'Study resource download log' : 'Teaching resource download log'}{' '}
              ({activeRows.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-full overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">File</th>
                    <th className="p-2 text-left">{tab === 'teaching' ? 'Category' : 'Type'}</th>
                    <th className="p-2 text-left">Downloaded by</th>
                    <th className="p-2 text-left">When</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRows.slice(0, 200).map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="p-2 font-medium text-gray-900">{row.resource_name}</td>
                      <td className="p-2 text-gray-600">
                        {tab === 'teaching'
                          ? getTeachingResourceCategory(row.category || '')?.name || row.category || '—'
                          : friendlyFileType(row.file_type)}
                      </td>
                      <td className="p-2 text-gray-600">{row.user_name || row.user_email || '—'}</td>
                      <td className="p-2 text-gray-500">{formatDateTime(row.download_timestamp)}</td>
                    </tr>
                  ))}
                  {activeRows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-gray-500">
                        No downloads in this filter
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => void handleDeleteRecords()}
        title="Delete download analytics records"
        description={
          <div className="space-y-4 text-left">
            <p className="text-sm text-slate-600">{deleteDescription}</p>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Delete scope</label>
              <select
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={deleteScope}
                onChange={(event) =>
                  setDeleteScope(event.target.value as 'user' | 'admins' | 'all')
                }
              >
                <option value="user">Specific user email</option>
                <option value="admins">All admin downloads</option>
                <option value="all">All records in range</option>
              </select>
            </div>
            {deleteScope === 'user' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">User email</label>
                <Input
                  value={deleteEmail}
                  onChange={(event) => setDeleteEmail(event.target.value)}
                  placeholder="Start typing an email…"
                  list="download-analytics-emails"
                />
                <datalist id="download-analytics-emails">
                  {knownEmails.map((email) => (
                    <option key={email} value={email} />
                  ))}
                </datalist>
              </div>
            )}
            <p className="text-xs text-slate-500">
              Applies to the {deleteLibraryLabel} tab only. Date range: {deleteRangeLabel}.
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
