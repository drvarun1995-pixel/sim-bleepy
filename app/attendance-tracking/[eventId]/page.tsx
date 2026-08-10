'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  MapPin,
  MessageSquare,
  RefreshCw,
  Search,
  UserCheck,
  Users,
  UserX,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import {
  formatRegistrationSourceLabel,
  type AttendanceEventSummary,
  type AttendanceNoShowDto,
  type AttendanceRecordDto,
  type AttendanceRegistrationSource,
  type AttendanceStats,
} from '@/lib/attendance-shared'

type StatusFilter = 'all' | 'success' | 'failed'
type SourceFilter = 'all' | 'self' | 'walk_in_scan' | 'walk_in_guest' | 'admin' | 'unknown'
type ListTab = 'attendees' | 'no_shows'

const FUNNEL_COLORS = {
  attended: '#059669',
  noShows: '#dc2626',
  walkIns: '#d97706',
  waitlisted: '#6366f1',
}

const SOURCE_COLORS = ['#059669', '#0ea5e9', '#d97706', '#6366f1', '#94a3b8']
const DESIGNATION_COLORS = ['#2563eb', '#0891b2', '#7c3aed', '#db2777', '#ea580c', '#65a30d']

function formatDateTime(dateTime: string | undefined | null) {
  if (!dateTime) return '—'
  try {
    const date = new Date(dateTime)
    if (Number.isNaN(date.getTime())) return 'Invalid date'
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'Invalid date'
  }
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

function sourceBadgeVariant(source: AttendanceRegistrationSource) {
  switch (source) {
    case 'walk_in_guest':
    case 'walk_in_scan':
      return 'bg-amber-50 text-amber-800 border-amber-200'
    case 'admin':
      return 'bg-indigo-50 text-indigo-800 border-indigo-200'
    case 'self':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200'
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200'
  }
}

export default function EventAttendanceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<AttendanceEventSummary | null>(null)
  const [records, setRecords] = useState<AttendanceRecordDto[]>([])
  const [noShows, setNoShows] = useState<AttendanceNoShowDto[]>([])
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [listTab, setListTab] = useState<ListTab>('attendees')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/attendance/${eventId}`)
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to load attendance')
      }
      const data = await response.json()
      setEvent(data.event)
      setRecords(data.records || [])
      setNoShows(data.no_shows || [])
      setStats(data.stats || null)
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Failed to load attendance')
      setEvent(null)
      setRecords([])
      setNoShows([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    if (eventId) loadData()
  }, [eventId, loadData])

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return records.filter((record) => {
      if (statusFilter === 'success' && !record.scan_success) return false
      if (statusFilter === 'failed' && record.scan_success) return false

      if (sourceFilter !== 'all') {
        if (sourceFilter === 'unknown') {
          if (record.registration_source) return false
        } else if (record.registration_source !== sourceFilter) {
          return false
        }
      }

      if (!q) return true
      return (
        record.user_name.toLowerCase().includes(q) ||
        record.user_email.toLowerCase().includes(q) ||
        (record.guest_designation || '').toLowerCase().includes(q) ||
        (record.user_role || '').toLowerCase().includes(q)
      )
    })
  }, [records, searchQuery, statusFilter, sourceFilter])

  const filteredNoShows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return noShows
    return noShows.filter(
      (row) =>
        row.user_name.toLowerCase().includes(q) ||
        row.user_email.toLowerCase().includes(q)
    )
  }, [noShows, searchQuery])

  const hasSourceMix = useMemo(() => {
    if (!stats) return false
    const s = stats.by_source
    return s.self + s.walk_in_scan + s.walk_in_guest + s.admin + s.unknown > 0
  }, [stats])

  const funnelPieData = useMemo(() => {
    if (!stats) return []
    const f = stats.funnel
    const bookedAttended = Math.max(0, f.attended - f.walk_ins)
    return [
      { name: 'Booked attendees', value: bookedAttended, color: FUNNEL_COLORS.attended },
      { name: 'Walk-ins', value: f.walk_ins, color: FUNNEL_COLORS.walkIns },
      { name: 'No-shows', value: f.no_shows, color: FUNNEL_COLORS.noShows },
      { name: 'Waitlisted', value: f.waitlisted, color: FUNNEL_COLORS.waitlisted },
    ].filter((d) => d.value > 0)
  }, [stats])

  const sourcePieData = useMemo(() => {
    if (!stats) return []
    return [
      { name: 'Booked', value: stats.by_source.self },
      { name: 'Walk-in signed in', value: stats.by_source.walk_in_scan },
      { name: 'Walk-in guest', value: stats.by_source.walk_in_guest },
      { name: 'Staff added', value: stats.by_source.admin },
      { name: 'Unknown', value: stats.by_source.unknown },
    ].filter((d) => d.value > 0)
  }, [stats])

  const designationPieData = useMemo(() => {
    if (!stats) return []
    return Object.entries(stats.by_designation)
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [stats])

  const timelineChartData = useMemo(() => {
    if (!stats?.timeline?.length) return []
    return stats.timeline.map((b) => ({
      label: b.label,
      checkIns: b.count,
    }))
  }, [stats])

  const handleExport = async () => {
    if (!event) return
    try {
      setExporting(true)
      const response = await fetch(`/api/attendance/${event.id}/export`)
      if (!response.ok) throw new Error('Failed to export attendance data')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance-${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${event.date}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Attendance data exported successfully!')
    } catch (error) {
      console.error(error)
      toast.error('Failed to export attendance data')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading attendance records..." />
  }

  if (!event || !stats) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/attendance-tracking')}
          className="text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Attendance Tracking
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Attendance unavailable</h2>
            <p className="mt-2 text-sm text-gray-600">
              This event has no QR attendance data, or you do not have permission to view it.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const funnel = stats.funnel

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-1 border-b border-slate-200/80 bg-white/95 px-1 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/attendance-tracking')}
              className="h-8 px-2 text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Attendance Tracking
            </Button>
            <div>
              <h1 className="truncate text-2xl font-bold text-gray-900 sm:text-3xl">
                {event.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {formatDate(event.date)}
                </span>
                {(event.start_time || event.end_time) && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {event.start_time || '—'}
                    {event.end_time ? ` – ${event.end_time}` : ''}
                  </span>
                )}
                {event.location_name && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {event.location_name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" onClick={handleExport} disabled={exporting}>
              <Download className="mr-2 h-4 w-4" />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Successful</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.successful_scans}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Failed</p>
            <p className="mt-1 text-2xl font-bold text-red-700">{stats.failed_scans}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Unique attendees
            </p>
            <p className="mt-1 text-2xl font-bold text-blue-700">{stats.unique_attendees}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Show rate</p>
            <p className="mt-1 text-2xl font-bold text-violet-700">{stats.show_rate}%</p>
            <p className="text-xs text-gray-500">
              {funnel.booked > 0
                ? `${funnel.attended} attended of ${funnel.booked} booked`
                : `${stats.attendance_rate}% scan success`}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Attendance mix</CardTitle>
          </CardHeader>
          <CardContent>
            {funnelPieData.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-500">No funnel data yet.</p>
            ) : (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={funnelPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={52}
                      outerRadius={82}
                      paddingAngle={2}
                      label={({ percent }) => `${Math.round(percent * 100)}%`}
                    >
                      {funnelPieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, 'People']} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2">
                <p className="text-xs text-gray-500">Booked</p>
                <p className="text-lg font-semibold text-gray-900">{funnel.booked}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2">
                <p className="text-xs text-gray-500">Show rate</p>
                <p className="text-lg font-semibold text-gray-900">{funnel.show_rate}%</p>
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-3 sm:col-span-1 sm:grid-cols-1">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                  <MessageSquare className="h-4 w-4 text-sky-600" />
                  <div>
                    <p className="text-xs text-gray-500">Feedback</p>
                    <p className="font-semibold text-gray-900">{funnel.feedback_completed}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                  <Award className="h-4 w-4 text-amber-600" />
                  <div>
                    <p className="text-xs text-gray-500">Certificates</p>
                    <p className="font-semibold text-gray-900">{funnel.certificates_issued}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Check-in timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {timelineChartData.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-500">No successful check-ins yet.</p>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timelineChartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      interval="preserveStartEnd"
                      minTickGap={16}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                    <Tooltip />
                    <Bar dataKey="checkIns" name="Check-ins" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(hasSourceMix || designationPieData.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {hasSourceMix && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Check-in source (unique successful)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sourcePieData.length === 0 ? (
                  <p className="py-10 text-center text-sm text-gray-500">No source data yet.</p>
                ) : (
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sourcePieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          outerRadius={90}
                          label={({ percent }) => `${Math.round(percent * 100)}%`}
                        >
                          {sourcePieData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={SOURCE_COLORS[index % SOURCE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [value, 'Attendees']} />
                        <Legend verticalAlign="bottom" height={48} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {designationPieData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Walk-in designations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={designationPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        outerRadius={90}
                        label={({ percent }) => `${Math.round(percent * 100)}%`}
                      >
                        {designationPieData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={DESIGNATION_COLORS[index % DESIGNATION_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [value, 'People']} />
                      <Legend verticalAlign="bottom" height={48} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card>
        <CardHeader className="space-y-4 pb-4">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={listTab === 'attendees' ? 'default' : 'outline'}
              onClick={() => setListTab('attendees')}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Attendees ({records.length})
            </Button>
            <Button
              size="sm"
              variant={listTab === 'no_shows' ? 'default' : 'outline'}
              onClick={() => setListTab('no_shows')}
            >
              <UserX className="mr-2 h-4 w-4" />
              No-shows ({noShows.length})
            </Button>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-base">
              {listTab === 'attendees' ? 'Attendance records' : 'No-show list'}
              <span className="ml-2 text-sm font-normal text-gray-500">
                {listTab === 'attendees'
                  ? `${filteredRecords.length} of ${records.length}`
                  : `${filteredNoShows.length} of ${noShows.length}`}
              </span>
            </CardTitle>
            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
              <div className="relative min-w-[220px] flex-1 lg:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, email…"
                  className="pl-9"
                />
              </div>
              {listTab === 'attendees' && (
                <>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v as StatusFilter)}
                  >
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="success">Successful</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={sourceFilter}
                    onValueChange={(v) => setSourceFilter(v as SourceFilter)}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sources</SelectItem>
                      <SelectItem value="self">Booked</SelectItem>
                      <SelectItem value="walk_in_scan">Walk-in signed in</SelectItem>
                      <SelectItem value="walk_in_guest">Walk-in guest</SelectItem>
                      <SelectItem value="admin">Staff added</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {listTab === 'attendees' ? (
            filteredRecords.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <UserX className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-600">
                  {records.length === 0
                    ? 'No attendance records found for this event.'
                    : 'No records match your search or filters.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="min-w-[180px]">Attendee</TableHead>
                      <TableHead className="min-w-[160px]">Scanned at</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Booking</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Designation / role</TableHead>
                      <TableHead>Feedback</TableHead>
                      <TableHead>Certificate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{record.user_name}</p>
                            <p className="text-sm text-gray-500">{record.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">
                          {formatDateTime(record.scanned_at)}
                        </TableCell>
                        <TableCell>
                          {record.scan_success ? (
                            <Badge className="border-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                              Success
                            </Badge>
                          ) : (
                            <div className="space-y-1">
                              <Badge className="border-0 bg-red-100 text-red-800 hover:bg-red-100">
                                Failed
                              </Badge>
                              {record.failure_reason && (
                                <p className="max-w-[180px] text-xs text-red-600">
                                  {record.failure_reason}
                                </p>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.booking_status ? (
                            <Badge variant="outline" className="capitalize">
                              {record.booking_status}
                            </Badge>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={sourceBadgeVariant(record.registration_source)}
                          >
                            {formatRegistrationSourceLabel(record.registration_source)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">
                          {record.guest_designation || record.user_role || (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.feedback_completed ? (
                            <span className="inline-flex items-center gap-1 text-sm text-emerald-700">
                              <CheckCircle className="h-3.5 w-3.5" /> Yes
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.has_certificate ? (
                            <span className="inline-flex items-center gap-1 text-sm text-amber-700">
                              <Award className="h-3.5 w-3.5" /> Yes
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">No</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : filteredNoShows.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-300" />
              <p className="text-sm text-gray-600">
                {noShows.length === 0
                  ? 'No booked no-shows for this event.'
                  : 'No no-shows match your search.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Booking status</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNoShows.map((row) => (
                    <TableRow key={row.user_id}>
                      <TableCell className="font-medium">{row.user_name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{row.user_email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {row.booking_status || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={sourceBadgeVariant(row.registration_source)}
                        >
                          {formatRegistrationSourceLabel(row.registration_source)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
