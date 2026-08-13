'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import { useRole } from '@/lib/useRole'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { whatHappensAtFinish } from '@/lib/year-group-timelines'
import { suggestNextCohortLabel } from '@/lib/year-progression'

type Tab = 'overview' | 'schedules' | 'override' | 'exceptions' | 'audit'

export default function YearProgressionPage() {
  const { data: session, status } = useSession()
  const { role, loading: roleLoading, canSendAdminEmails } = useRole()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [history, setHistory] = useState<any>(null)
  const [timelineCohort, setTimelineCohort] = useState('26-27')
  const [timelineNext, setTimelineNext] = useState('27-28')
  const [timelineGroups, setTimelineGroups] = useState<any[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [timelineClosed, setTimelineClosed] = useState(false)
  const [overrideUnlocked, setOverrideUnlocked] = useState(false)
  const [newCohort, setNewCohort] = useState('')
  const [exceptionReason, setExceptionReason] = useState('')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/year-progression')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load')
      setData(json)
      const preferred = json.stats?.preferredTimelineCohort
      if (preferred) {
        setTimelineCohort(preferred)
        setTimelineNext(suggestNextCohortLabel(preferred))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const loadTimelines = async (cohort?: string) => {
    const label = cohort || timelineCohort
    setTimelineLoading(true)
    try {
      const res = await fetch(
        `/api/admin/year-progression/timelines?cohort=${encodeURIComponent(label)}`
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load timelines')
      setTimelineCohort(json.cohort_label)
      setTimelineNext(json.next_cohort_label)
      setTimelineGroups(json.groups || [])
      setTimelineClosed(!!json.closed)
      setOverrideUnlocked(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load timelines')
    } finally {
      setTimelineLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'loading' || roleLoading) return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    if (!canSendAdminEmails) {
      router.push('/dashboard')
      return
    }
    load()
  }, [session, status, roleLoading, canSendAdminEmails, router])

  useEffect(() => {
    if (tab !== 'schedules' || error || loading || !data) return
    const preferred = data.stats?.preferredTimelineCohort || timelineCohort
    loadTimelines(preferred)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, error, loading])

  const searchUsers = async (q: string) => {
    try {
      const res = await fetch(`/api/admin/year-progression/users?q=${encodeURIComponent(q)}`)
      const json = await res.json().catch(() => ({}))
      setUsers(json.users || [])
    } catch {
      setUsers([])
    }
  }

  const loadHistory = async (userId: string) => {
    const res = await fetch(`/api/admin/year-progression/users?historyUserId=${userId}`)
    setHistory(await res.json())
  }

  const legacySchedules = useMemo(
    () =>
      (data?.schedules || []).filter((s: any) => {
        try {
          const notes = s.notes ? JSON.parse(s.notes) : null
          return !notes || notes.v !== 1 || !notes.timeline_key
        } catch {
          return true
        }
      }),
    [data]
  )
  const timelineLocked = timelineClosed && !overrideUnlocked

  if (status === 'loading' || roleLoading || !role) {
    return <LoadingScreen message="Loading year progression…" />
  }
  if (!canSendAdminEmails) return null

  return (
    <DashboardLayoutClient role={role as any} userName={session?.user?.name || undefined}>
      <div className="mx-auto w-full max-w-6xl space-y-6 px-1 sm:px-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Year Progression</h1>
          <p className="mt-1 text-sm text-slate-600">
            Set start and finish dates for each university year. When a finish date arrives, those
            learners move on automatically. Existing 25-26 learners never receive automatic emails.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['overview', 'schedules', 'override', 'exceptions', 'audit'] as Tab[]).map((t) => (
            <Button key={t} variant={tab === t ? 'default' : 'outline'} size="sm" onClick={() => setTab(t)}>
              {t === 'schedules' ? 'Timelines' : t[0].toUpperCase() + t.slice(1)}
            </Button>
          ))}
        </div>

        {error && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-base">Setup needed</CardTitle>
              <CardDescription className="text-amber-900">{error}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-amber-900">
              Run <code>supabase/migrations/20260813_year_progression.sql</code> in the Supabase SQL
              editor, then refresh this page.
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : !error && tab === 'overview' ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>
                    {(data.stats.overviewCohort || data.stats.preferredTimelineCohort || '26-27')} labelled
                  </CardDescription>
                  <CardTitle>{data.stats.labelledCurrent ?? data.stats.labelled25}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Unlabelled learners</CardDescription>
                  <CardTitle>{data.stats.unlabelled}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Active learners</CardDescription>
                  <CardTitle>{data.stats.active}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Graduated / intercalated</CardDescription>
                  <CardTitle>
                    {data.stats.graduated} / {data.stats.intercalated}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {(data.activeLearners || []).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Who is still active</CardTitle>
                  <CardDescription>
                    Medical students and FY doctors on{' '}
                    {data.stats.overviewCohort || data.stats.preferredTimelineCohort || '26-27'}.
                    Test accounts are hidden here, on Student Cohorts, and from email sends.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {(data.activeLearners || []).map((user: any) => (
                    <p key={user.id} className="border-b border-slate-100 py-2">
                      <span className="font-medium">{user.name || 'Unnamed'}</span>
                      <span className="text-slate-500"> · {user.email}</span>
                      <span className="text-slate-500">
                        {' '}
                        · {user.university || user.foundation_year || user.role_type || '—'}
                        {user.study_year ? ` Year ${user.study_year}` : ''}
                        {user.academic_cohort ? ` · ${user.academic_cohort}` : ''}
                      </span>
                    </p>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">How progression works</CardTitle>
                <CardDescription>
                  Open Timelines, pick a cohort, then set when each ARU / UCL / FY year starts and
                  finishes. Advancing learners join the next cohort you choose. Terminal years
                  (ARU 5, UCL 6, FY2) graduate, unless you set them to FY1 or intercalated.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button onClick={() => setTab('schedules')}>Set year timelines</Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true)
                    try {
                      const res = await fetch('/api/admin/year-progression', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'backfill' }),
                      })
                      const json = await res.json()
                      if (!res.ok) throw new Error(json.error)
                      toast.success(
                        `Backfill: ${json.labelled} labelled, ${json.history} history rows`
                      )
                      await load()
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Backfill failed')
                    } finally {
                      setBusy(false)
                    }
                  }}
                >
                  Assign remaining users to 25-26
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cohorts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(data.cohorts || []).map((c: any) => (
                    <Badge
                      key={c.id}
                      variant={
                        c.label === (data.stats.overviewCohort || data.stats.preferredTimelineCohort)
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {c.label}
                      {c.label === (data.stats.overviewCohort || data.stats.preferredTimelineCohort)
                        ? ' · latest'
                        : ''}
                      {c.is_current ? ' · current' : ''}
                      {c.is_closed ? ' · closed' : ''}
                      {c.suppress_emails ? ' · no emails' : ''}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="26-27"
                    value={newCohort}
                    onChange={(e) => setNewCohort(e.target.value)}
                    className="max-w-[140px]"
                  />
                  <Button
                    variant="outline"
                    disabled={busy || !newCohort}
                    onClick={async () => {
                      setBusy(true)
                      try {
                        const res = await fetch('/api/admin/year-progression/cohorts', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ label: newCohort }),
                        })
                        const json = await res.json()
                        if (!res.ok) throw new Error(json.error)
                        setNewCohort('')
                        await load()
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : 'Could not add cohort')
                      } finally {
                        setBusy(false)
                      }
                    }}
                  >
                    Add cohort
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}

        {!error && !loading && tab === 'schedules' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">Year timelines</CardTitle>
                  {timelineClosed ? <Badge variant="secondary">Closed</Badge> : null}
                  {overrideUnlocked ? <Badge>Override on</Badge> : null}
                </div>
                <CardDescription>
                  Pick a cohort, then set when each year group starts and finishes. Medical school
                  years follow the academic year. Foundation years default to 5 August → 5 August
                  (25-26 is 5 Aug 2025 → 5 Aug 2026). The daily job moves that group on the finish date.
                  When every group has finished, the cohort is marked closed and locked. New
                  cohorts copy the previous cohort’s dates with the year moved forward. Save
                  timelines is enough — the daily job runs each group on its finish date.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Cohort</Label>
                    <select
                      className="h-10 w-full rounded-md border px-3 text-sm"
                      value={timelineCohort}
                      onChange={(e) => {
                        const next = e.target.value
                        setTimelineCohort(next)
                        setTimelineNext(suggestNextCohortLabel(next))
                        loadTimelines(next)
                      }}
                    >
                      {(data.cohorts || []).map((c: any) => (
                        <option key={c.id} value={c.label}>
                          {c.label}
                          {c.is_current ? ' · current' : ''}
                          {c.is_closed ? ' · closed' : ''}
                          {c.suppress_emails ? ' · no emails' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>After finish, advancing learners join</Label>
                    <select
                      className="h-10 w-full rounded-md border px-3 text-sm"
                      value={timelineNext}
                      disabled={timelineLocked}
                      onChange={(e) => setTimelineNext(e.target.value)}
                    >
                      {Array.from(
                        new Set([
                          timelineNext,
                          ...(data.cohorts || [])
                            .map((c: any) => c.label)
                            .filter((label: string) => label !== timelineCohort),
                        ])
                      ).map((label: string) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {timelineClosed && (
                  <div className="flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
                    <p>
                      This cohort is <strong>closed</strong> because every year group, including
                      Foundation Year, has passed its finish date. Dates and actions are locked.
                    </p>
                    {!overrideUnlocked ? (
                      <Button
                        variant="outline"
                        className="shrink-0"
                        onClick={() => {
                          if (
                            !confirm(
                              `Unlock editing for closed cohort ${timelineCohort}? This should only be used to correct a mistake.`
                            )
                          )
                            return
                          setOverrideUnlocked(true)
                        }}
                      >
                        Manual override
                      </Button>
                    ) : (
                      <p className="shrink-0 text-xs font-medium text-amber-800">
                        Override is on. Save will lock the cohort again if all finish dates are still in the past.
                      </p>
                    )}
                  </div>
                )}

                {timelineCohort === '25-26' && (
                  <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    25-26 dates will run without sending progression emails. ARU years use the
                    school teaching windows (Year 3 is April–July 2026; Year 5 finish is 24 May 2026,
                    the end of the second block).
                  </p>
                )}

                {timelineLoading ? (
                  <p className="text-sm text-slate-500">Loading year groups…</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                      <thead>
                        <tr className="border-b text-left text-slate-500">
                          <th className="py-2 pr-3 font-medium">Year group</th>
                          <th className="py-2 pr-3 font-medium">Start</th>
                          <th className="py-2 pr-3 font-medium">Finish</th>
                          <th className="py-2 pr-3 font-medium">At finish</th>
                          <th className="py-2 pr-3 font-medium">Learners</th>
                          <th className="py-2 font-medium"> </th>
                        </tr>
                      </thead>
                      <tbody>
                        {timelineGroups.map((group: any, index: number) => {
                          const prev = timelineGroups[index - 1]
                          const showSection = group.section && group.section !== prev?.section
                          return (
                            <Fragment key={group.key}>
                              {showSection ? (
                                <tr>
                                  <td
                                    colSpan={6}
                                    className="bg-slate-50 pb-2 pt-4 text-xs font-semibold uppercase tracking-wide text-slate-500"
                                  >
                                    {group.section === 'foundation'
                                      ? 'Foundation years · 5 August to 5 August'
                                      : 'Medical school'}
                                  </td>
                                </tr>
                              ) : null}
                          <tr className="border-b align-top">
                            <td className="py-3 pr-3">
                              <div className="font-medium text-slate-900">{group.label}</div>
                              <div className="text-xs text-slate-500">
                                {group.status === 'scheduled'
                                  ? 'Will run on finish date'
                                  : group.status === 'applied'
                                    ? 'Already applied'
                                    : group.status === 'cancelled'
                                      ? 'Not scheduled'
                                      : 'Not saved yet'}
                              </div>
                            </td>
                            <td className="py-3 pr-3">
                              <Input
                                type="date"
                                disabled={timelineLocked}
                                value={group.starts_on || ''}
                                onChange={(e) =>
                                  setTimelineGroups((rows) =>
                                    rows.map((row) =>
                                      row.key === group.key
                                        ? { ...row, starts_on: e.target.value }
                                        : row
                                    )
                                  )
                                }
                              />
                            </td>
                            <td className="py-3 pr-3">
                              <Input
                                type="date"
                                disabled={timelineLocked}
                                value={group.ends_on || ''}
                                onChange={(e) =>
                                  setTimelineGroups((rows) =>
                                    rows.map((row) =>
                                      row.key === group.key
                                        ? { ...row, ends_on: e.target.value }
                                        : row
                                    )
                                  )
                                }
                              />
                            </td>
                            <td className="py-3 pr-3">
                              {group.terminal ? (
                                <select
                                  className="h-10 w-full rounded-md border px-2 text-sm"
                                  disabled={timelineLocked}
                                  value={group.exit_action || 'graduate'}
                                  onChange={(e) =>
                                    setTimelineGroups((rows) =>
                                      rows.map((row) =>
                                        row.key === group.key
                                          ? { ...row, exit_action: e.target.value }
                                          : row
                                      )
                                    )
                                  }
                                >
                                  <option value="graduate">Graduated</option>
                                  <option value="fy1">Move to FY1</option>
                                  <option value="intercalated">Intercalated</option>
                                </select>
                              ) : (
                                <p className="pt-2 text-slate-600">
                                  {whatHappensAtFinish(group, group.exit_action, timelineNext)}
                                </p>
                              )}
                            </td>
                            <td className="py-3 pr-3 pt-5">{group.learner_count}</td>
                            <td className="py-3">
                              {group.schedule_id && group.status !== 'cancelled' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={busy}
                                  onClick={async () => {
                                    setBusy(true)
                                    try {
                                      const res = await fetch(
                                        `/api/admin/year-progression/schedules/${group.schedule_id}`,
                                        {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ action: 'preview' }),
                                        }
                                      )
                                      const json = await res.json()
                                      if (!res.ok) throw new Error(json.error)
                                      setPreview({ ...json, scheduleName: group.label })
                                    } catch (e) {
                                      toast.error(
                                        e instanceof Error ? e.message : 'Preview failed'
                                      )
                                    } finally {
                                      setBusy(false)
                                    }
                                  }}
                                >
                                  Preview
                                </Button>
                              ) : null}
                            </td>
                          </tr>
                            </Fragment>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <Button
                  disabled={busy || timelineLoading || timelineLocked}
                  onClick={async () => {
                    setBusy(true)
                    try {
                      const res = await fetch('/api/admin/year-progression/timelines', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          cohort_label: timelineCohort,
                          next_cohort_label: timelineNext,
                          groups: timelineGroups,
                          allow_override: overrideUnlocked,
                        }),
                      })
                      const json = await res.json()
                      if (!res.ok) throw new Error(json.error)
                      toast.success('Timelines saved. They will run on each finish date.')
                      await load()
                      await loadTimelines(timelineCohort)
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Save failed')
                    } finally {
                      setBusy(false)
                    }
                  }}
                >
                  Save timelines
                </Button>
              </CardContent>
            </Card>

            {preview && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Preview {preview.scheduleName ? `· ${preview.scheduleName}` : ''}
                  </CardTitle>
                  <CardDescription>
                    {preview.applyCount} will move · {preview.skipCount} skipped
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-80 overflow-auto text-sm">
                  {(preview.apply || []).map((row: any) => (
                    <p key={row.userId} className="border-b border-slate-100 py-1">
                      <span className="font-medium">{row.name || row.email}</span> · {row.fromLabel}{' '}
                      → {row.toLabel} ({row.action})
                    </p>
                  ))}
                  {(preview.apply || []).length === 0 && (
                    <p className="text-slate-500">Nobody in this year group would move.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {legacySchedules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Older jobs</CardTitle>
                  <CardDescription>
                    Previous whole-cohort schedules. New progression should use the table above.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {legacySchedules.map((s: any) => (
                    <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-slate-500">
                          {s.cohort_label || 'all'} → {s.next_cohort_label || '—'} · {s.effective_date} ·{' '}
                          {s.status}
                        </p>
                      </div>
                      {s.status === 'scheduled' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            await fetch('/api/admin/year-progression/schedules', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: s.id, status: 'cancelled' }),
                            })
                            await load()
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!error && !loading && tab === 'override' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Manual override</CardTitle>
              <CardDescription>Search a learner and apply a one-off change with audit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search name or email"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  if (e.target.value.length >= 2) searchUsers(e.target.value)
                }}
              />
              <div className="max-h-48 overflow-auto text-sm">
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="block w-full border-b border-slate-100 py-2 text-left hover:bg-slate-50"
                    onClick={() => {
                      setSelectedUser(u)
                      loadHistory(u.id)
                    }}
                  >
                    {u.name} · {u.email} · {u.university || u.foundation_year || ''} {u.study_year || ''}{' '}
                    · {u.academic_status} · {u.academic_cohort}
                  </button>
                ))}
              </div>
              {selectedUser && (
                <div className="space-y-3 rounded-lg border p-3">
                  <p className="font-medium">
                    {selectedUser.name}{' '}
                    <span className="text-slate-500">{selectedUser.email}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['per_user', 'advance', 'fy1', 'graduate', 'intercalated'].map((action) => (
                      <Button
                        key={action}
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true)
                          try {
                            const res = await fetch('/api/admin/year-progression/override', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ userId: selectedUser.id, action }),
                            })
                            const json = await res.json()
                            if (!res.ok) throw new Error(json.error || json.skipped)
                            toast.success(json.applied ? `Applied ${json.action}` : json.skipped)
                            loadHistory(selectedUser.id)
                            await load()
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : 'Override failed')
                          } finally {
                            setBusy(false)
                          }
                        }}
                      >
                        {action}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        const res = await fetch('/api/admin/year-progression/users', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            action: 'add-exception',
                            userId: selectedUser.id,
                            reason: exceptionReason || 'Repeat / don’t bump',
                          }),
                        })
                        const json = await res.json()
                        if (!res.ok) toast.error(json.error)
                        else toast.success('Exception added')
                        await load()
                      }}
                    >
                      Don’t bump
                    </Button>
                  </div>
                  <Input
                    placeholder="Exception reason"
                    value={exceptionReason}
                    onChange={(e) => setExceptionReason(e.target.value)}
                  />
                  {history?.stages && (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Stage history</p>
                      {history.stages.map((st: any) => (
                        <p key={st.id} className="text-sm">
                          {st.stage_label} · {new Date(st.started_at).toLocaleDateString()} –{' '}
                          {st.ended_at ? new Date(st.ended_at).toLocaleDateString() : 'current'}
                        </p>
                      ))}
                    </div>
                  )}
                  {history?.bookings?.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                        Bookings by stage
                      </p>
                      {history.bookings.slice(0, 12).map((b: any) => (
                        <p key={b.id} className="text-sm">
                          {b.events?.title || b.event_id} · {b.stage_label} · {b.status}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!error && !loading && tab === 'exceptions' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Repeat / don’t bump</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(data.exceptions || []).length === 0 && (
                <p className="text-slate-500">No exceptions yet.</p>
              )}
              {(data.exceptions || []).map((ex: any) => (
                <div key={ex.id} className="flex items-center justify-between border-b py-2">
                  <span>
                    {ex.users?.name || ex.user_id} · {ex.exception_type} · {ex.reason || ''}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      await fetch('/api/admin/year-progression/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'delete-exception', id: ex.id }),
                      })
                      await load()
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {!error && !loading && tab === 'audit' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Change history</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[480px] overflow-auto text-sm">
              {(data.audit || []).map((row: any) => (
                <p key={row.id} className="border-b border-slate-100 py-2">
                  {new Date(row.created_at).toLocaleString()} · {row.users?.name || row.user_id} ·{' '}
                  {row.from_snapshot?.stage_label} → {row.to_snapshot?.stage_label} · {row.action} ·{' '}
                  {row.source}
                  {row.emails_suppressed ? ' · emails off' : ''}
                </p>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayoutClient>
  )
}
