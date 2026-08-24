'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Archive, Database, ExternalLink, Loader2, Plus, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  CAREER_LEVELS,
  FORMATS,
  NATIONS,
  PUBLICATION_STATUSES,
  RECOGNITION_LEVELS,
  WORK_TYPES,
  formatDeadline,
  type ConferenceOpportunity,
} from '@/lib/conferences'
import { parseScanWindowInput, utcToDatetimeLocalInUK } from '@/lib/ukEventTime'
import {
  CONFERENCE_SOURCE_REGISTRY,
  SOURCE_KIND_LABELS,
  SOURCE_PRIORITY_LABELS,
} from '@/lib/conferences/ingest/source-registry'

type Specialty = { id: string; name: string; slug: string }

type FormState = {
  name: string
  organising_body: string
  official_page_url: string
  submission_page_url: string
  start_date: string
  end_date: string
  location_text: string
  city: string
  nation: string
  format: string
  abstract_deadline: string
  abstract_open_at: string
  results_date_text: string
  poster_accepted: boolean
  oral_accepted: boolean
  eligible_work_types: string[]
  eligible_career_levels: string[]
  abstract_word_limit: string
  submission_requirements: string
  prize_info: string
  publication_info: string
  recognition_level: string
  conference_fee: string
  submission_fee: string
  publication_status: string
  admin_notes: string
  deadline_not_stated: boolean
  specialty_ids: string[]
}

const emptyForm = (): FormState => ({
  name: '',
  organising_body: '',
  official_page_url: '',
  submission_page_url: '',
  start_date: '',
  end_date: '',
  location_text: '',
  city: '',
  nation: 'uk_wide',
  format: 'hybrid',
  abstract_deadline: '',
  abstract_open_at: '',
  results_date_text: '',
  poster_accepted: true,
  oral_accepted: true,
  eligible_work_types: ['research'],
  eligible_career_levels: ['anyone'],
  abstract_word_limit: '',
  submission_requirements: '',
  prize_info: '',
  publication_info: '',
  recognition_level: 'national',
  conference_fee: '',
  submission_fee: '',
  publication_status: 'draft',
  admin_notes: '',
  deadline_not_stated: false,
  specialty_ids: [],
})

function fromOpportunity(opp: ConferenceOpportunity): FormState {
  return {
    name: opp.name || '',
    organising_body: opp.organising_body || '',
    official_page_url: opp.official_page_url || '',
    submission_page_url: opp.submission_page_url || '',
    start_date: opp.start_date || '',
    end_date: opp.end_date || '',
    location_text: opp.location_text || '',
    city: opp.city || '',
    nation: opp.nation || '',
    format: opp.format || '',
    abstract_deadline: opp.abstract_deadline ? utcToDatetimeLocalInUK(new Date(opp.abstract_deadline)) : '',
    abstract_open_at: opp.abstract_open_at ? utcToDatetimeLocalInUK(new Date(opp.abstract_open_at)) : '',
    results_date_text: opp.results_date_text || '',
    poster_accepted: opp.poster_accepted !== false,
    oral_accepted: opp.oral_accepted !== false,
    eligible_work_types: opp.eligible_work_types || [],
    eligible_career_levels: opp.eligible_career_levels || [],
    abstract_word_limit: opp.abstract_word_limit ? String(opp.abstract_word_limit) : '',
    submission_requirements: opp.submission_requirements || '',
    prize_info: opp.prize_info || '',
    publication_info: opp.publication_info || '',
    recognition_level: opp.recognition_level || '',
    conference_fee: opp.conference_fee || '',
    submission_fee: opp.submission_fee || '',
    publication_status: opp.publication_status,
    admin_notes: opp.admin_notes || '',
    deadline_not_stated: opp.deadline_not_stated,
    specialty_ids: opp.specialties.map((s) => s.id),
  }
}

function toPayload(form: FormState) {
  const toIso = (value: string) => (value ? parseScanWindowInput(value).toISOString() : null)
  return {
    ...form,
    abstract_deadline: form.deadline_not_stated ? null : toIso(form.abstract_deadline),
    abstract_open_at: toIso(form.abstract_open_at),
    abstract_word_limit: form.abstract_word_limit ? Number(form.abstract_word_limit) : null,
    nation: form.nation || null,
    format: form.format || null,
    recognition_level: form.recognition_level || null,
  }
}

function staffListParams(tab: 'queue' | 'all' | 'archived' | 'sources' | 'form') {
  const params = new URLSearchParams({ staff: 'true', limit: '50', sort: 'verified' })
  if (tab === 'queue') {
    params.set('publicationStatus', 'pending_review')
    params.set('includeClosed', 'false')
  } else if (tab === 'archived') {
    params.set('publicationStatuses', 'archived,rejected')
    params.set('includeClosed', 'true')
  } else {
    params.set('excludePublicationStatuses', 'archived,rejected')
    params.set('includeClosed', 'false')
  }
  return params
}

export default function ConferenceDataPage() {
  const [tab, setTab] = useState<'queue' | 'all' | 'archived' | 'sources' | 'form'>('queue')
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [items, setItems] = useState<ConferenceOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  useEffect(() => {
    fetch('/api/placements/specialties?includeInactive=true')
      .then((res) => res.json())
      .then((data) => setSpecialties(data.specialties || []))
  }, [])

  useEffect(() => {
    if (tab === 'form' || tab === 'sources') return
    let cancelled = false
    async function load() {
      if (items.length === 0) setLoading(true)
      const params = staffListParams(tab)
      try {
        const res = await fetch(`/api/conferences?${params}`)
        const data = await res.json()
        if (!cancelled) setItems(data.opportunities || [])
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  async function refreshList() {
    const params = staffListParams(tab)
    const res = await fetch(`/api/conferences?${params}`)
    const data = await res.json()
    setItems(data.opportunities || [])
  }

  function startCreate() {
    setEditingId(null)
    setEditingSlug(null)
    setForm(emptyForm())
    setTab('form')
  }

  function startEdit(opp: ConferenceOpportunity) {
    setEditingId(opp.id)
    setEditingSlug(opp.slug)
    setForm(fromOpportunity(opp))
    setTab('form')
  }

  async function saveForm(publish = false) {
    setSaving(true)
    try {
      const payload = { ...toPayload(form), publication_status: publish ? 'published' : form.publication_status }
      const url = editingSlug ? `/api/conferences/${editingSlug}` : '/api/conferences'
      const res = await fetch(url, {
        method: editingSlug ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success(publish ? 'Published' : 'Saved')
      setTab(publish ? 'all' : 'queue')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function setStatus(opp: ConferenceOpportunity, publication_status: string) {
    const res = await fetch(`/api/conferences/${opp.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publication_status }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'Update failed')
      return
    }
    toast.success(`Marked ${publication_status.replace('_', ' ')}`)
    refreshList()
  }

  async function archive(opp: ConferenceOpportunity) {
    if (!window.confirm(`Archive ${opp.name}? It will leave the public list and will not be recreated by ingest.`)) return
    await setStatus(opp, 'archived')
  }

  const title = useMemo(() => {
    if (tab === 'queue') return 'Review queue'
    if (tab === 'all') return 'All opportunities'
    if (tab === 'archived') return 'Archived'
    if (tab === 'sources') return 'Source registry'
    return editingId ? 'Edit opportunity' : 'Add opportunity'
  }, [tab, editingId])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
              <Database className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">Staff tools</p>
              <h1 className="mt-1 text-2xl sm:text-4xl font-bold text-gray-900">Conference Data</h1>
              <p className="text-gray-600 mt-2 max-w-2xl">
                Review scraped calls, publish open opportunities, and add meetings manually. Closed submissions are skipped.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <Button asChild className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">
              <Link href="/conference-data/ingest">
                <RefreshCw className="h-4 w-4" />
                Ingest sources
              </Link>
            </Button>
            <Button onClick={startCreate} variant="outline" className="w-full sm:w-auto bg-white">
              <Plus className="h-4 w-4" />
              Add conference
            </Button>
          </div>
        </div>
      </div>

      {tab !== 'form' && tab !== 'sources' && !loading ? (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:max-w-xs">
          <p className="text-sm font-medium text-amber-800">
            {tab === 'queue' ? 'Waiting for review' : tab === 'archived' ? 'Archived or rejected' : 'Open opportunities'}
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-950">{items.length}</p>
        </div>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {([
          { id: 'queue', label: 'Review queue' },
          { id: 'all', label: 'All open' },
          { id: 'archived', label: 'Archived' },
          { id: 'sources', label: 'Sources' },
          { id: 'form', label: 'Editor' },
        ] as const).map((item) => (
          <Button
            key={item.id}
            variant={tab === item.id ? 'default' : 'outline'}
            onClick={() => setTab(item.id)}
            className={`shrink-0 ${tab === item.id ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white'}`}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {tab !== 'form' && tab !== 'sources' && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading
            </div>
          ) : items.length === 0 ? (
            <p className="p-8 text-center text-gray-600">
              {tab === 'queue'
                ? 'No open items waiting for review. Open Ingest sources to fetch current calls.'
                : tab === 'archived'
                  ? 'No archived or rejected conferences.'
                  : 'No open conferences yet.'}
            </p>
          ) : (
            <>
              <div className="divide-y lg:hidden">
                {items.map((opp) => (
                  <OpportunityMobileCard
                    key={opp.id}
                    opp={opp}
                    onEdit={startEdit}
                    onPublish={() => setStatus(opp, 'published')}
                    onReject={() => setStatus(opp, 'rejected')}
                    onRestore={() => setStatus(opp, 'pending_review')}
                    onArchive={() => archive(opp)}
                    archivedView={tab === 'archived'}
                  />
                ))}
              </div>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-500">
                    <tr>
                      <th className="p-4 font-medium">Conference</th>
                      <th className="p-4 font-medium">Deadline (UK)</th>
                      <th className="p-4 font-medium">Last verified (UK)</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Source</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((opp) => (
                      <tr key={opp.id} className="border-t">
                        <td className="p-4">
                          <div className="font-medium text-gray-900">{opp.name}</div>
                          <div className="text-gray-500">{opp.organising_body}</div>
                        </td>
                        <td className="p-4 whitespace-nowrap">{opp.deadline_not_stated ? 'Not stated' : formatDeadline(opp.abstract_deadline)}</td>
                        <td className="p-4 whitespace-nowrap text-gray-600">{formatDeadline(opp.last_verified_at)}</td>
                        <td className="p-4">
                          <Badge variant="outline">{opp.publication_status.replace('_', ' ')}</Badge>
                        </td>
                        <td className="p-4 capitalize">{opp.source_type}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => startEdit(opp)}>Edit</Button>
                            {tab === 'archived' ? (
                              <Button size="sm" onClick={() => setStatus(opp, 'pending_review')}>Restore</Button>
                            ) : (
                              <>
                                {opp.publication_status !== 'published' && (
                                  <Button size="sm" onClick={() => setStatus(opp, 'published')}>Publish</Button>
                                )}
                                {opp.publication_status === 'published' && (
                                  <Button size="sm" variant="outline" asChild>
                                    <Link href={`/conferences/${opp.slug}`}>View</Link>
                                  </Button>
                                )}
                                <Button size="sm" variant="outline" onClick={() => setStatus(opp, 'rejected')}>Reject</Button>
                                <Button size="sm" variant="ghost" onClick={() => archive(opp)}>
                                  <Archive className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'sources' && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Scrape-ready source registry</h2>
            <p className="mt-1 text-sm text-gray-600">
              Exact abstract, conference and PDF seed URLs. Run them from Ingest sources. Closed historic calls are skipped.
            </p>
          </div>
          <div className="divide-y lg:hidden">
            {CONFERENCE_SOURCE_REGISTRY.map((source) => (
              <div key={source.url} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{source.organisation}</p>
                    <p className="text-sm text-gray-500">{source.specialty}</p>
                  </div>
                  <Badge variant={source.adapterReady ? 'default' : 'outline'}>
                    {source.adapterReady ? 'Ready' : 'Queued'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700">{SOURCE_KIND_LABELS[source.kind]} · {SOURCE_PRIORITY_LABELS[source.priority]}</p>
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 break-all">
                  {source.url} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
                <p className="text-xs text-gray-500">{source.notes}</p>
              </div>
            ))}
          </div>
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="p-4 font-medium">Specialty</th>
                  <th className="p-4 font-medium">Organisation</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Seed URL</th>
                  <th className="p-4 font-medium">Priority</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {CONFERENCE_SOURCE_REGISTRY.map((source) => (
                  <tr key={source.url} className="border-t align-top">
                    <td className="p-4 whitespace-nowrap">{source.specialty}</td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{source.organisation}</div>
                      <div className="text-xs text-gray-500 mt-1 max-w-xs">{source.notes}</div>
                    </td>
                    <td className="p-4 whitespace-nowrap">{SOURCE_KIND_LABELS[source.kind]}</td>
                    <td className="p-4">
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-700 font-medium break-all">
                        Open page <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    </td>
                    <td className="p-4 whitespace-nowrap">{SOURCE_PRIORITY_LABELS[source.priority]}</td>
                    <td className="p-4">
                      <Badge variant={source.adapterReady ? 'default' : 'outline'}>
                        {source.adapterReady ? 'Ready' : 'Queued'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

        {tab === 'form' && (
          <form
            className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 space-y-5 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault()
              saveForm(false)
            }}
          >
            <h2 className="text-lg font-semibold">{title}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Name">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </Field>
              <Field label="Organising body">
                <Input value={form.organising_body} onChange={(e) => setForm({ ...form, organising_body: e.target.value })} />
              </Field>
              <Field label="Meeting page URL">
                <Input value={form.official_page_url} onChange={(e) => setForm({ ...form, official_page_url: e.target.value })} required />
              </Field>
              <Field label="Abstract submission URL">
                <Input value={form.submission_page_url} onChange={(e) => setForm({ ...form, submission_page_url: e.target.value })} />
              </Field>
              <Field label="Start date">
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </Field>
              <Field label="End date">
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </Field>
              <Field label="Abstract deadline (UK)">
                <Input type="datetime-local" value={form.abstract_deadline} onChange={(e) => setForm({ ...form, abstract_deadline: e.target.value })} disabled={form.deadline_not_stated} />
              </Field>
              <Field label="Abstract opens (UK)">
                <Input type="datetime-local" value={form.abstract_open_at} onChange={(e) => setForm({ ...form, abstract_open_at: e.target.value })} />
              </Field>
              <Field label="Location">
                <Input value={form.location_text} onChange={(e) => setForm({ ...form, location_text: e.target.value })} />
              </Field>
              <Field label="City">
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </Field>
              <Field label="Nation">
                <select className="w-full rounded-md border px-3 py-2 text-sm" value={form.nation} onChange={(e) => setForm({ ...form, nation: e.target.value })}>
                  <option value="">Not stated</option>
                  {NATIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </Field>
              <Field label="Format">
                <select className="w-full rounded-md border px-3 py-2 text-sm" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
                  <option value="">Not stated</option>
                  {FORMATS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </Field>
              <Field label="Recognition">
                <select className="w-full rounded-md border px-3 py-2 text-sm" value={form.recognition_level} onChange={(e) => setForm({ ...form, recognition_level: e.target.value })}>
                  <option value="">Not stated</option>
                  {RECOGNITION_LEVELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </Field>
              <Field label="Word limit">
                <Input type="number" value={form.abstract_word_limit} onChange={(e) => setForm({ ...form, abstract_word_limit: e.target.value })} />
              </Field>
              <Field label="Publication status">
                <select className="w-full rounded-md border px-3 py-2 text-sm" value={form.publication_status} onChange={(e) => setForm({ ...form, publication_status: e.target.value })}>
                  {PUBLICATION_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </Field>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.deadline_not_stated} onChange={(e) => setForm({ ...form, deadline_not_stated: e.target.checked })} />
              Deadline not stated
            </label>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.poster_accepted} onChange={(e) => setForm({ ...form, poster_accepted: e.target.checked })} />
                Poster accepted
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.oral_accepted} onChange={(e) => setForm({ ...form, oral_accepted: e.target.checked })} />
                Oral accepted
              </label>
            </div>

            <fieldset>
              <Label>Specialties</Label>
              <div className="mt-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {specialties.map((spec) => (
                  <label key={spec.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.specialty_ids.includes(spec.id)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...form.specialty_ids, spec.id]
                          : form.specialty_ids.filter((id) => id !== spec.id)
                        setForm({ ...form, specialty_ids: next })
                      }}
                    />
                    {spec.name}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <Label>Eligible work types</Label>
              <div className="mt-2 flex flex-wrap gap-3">
                {WORK_TYPES.map((item) => (
                  <label key={item.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.eligible_work_types.includes(item.value)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...form.eligible_work_types, item.value]
                          : form.eligible_work_types.filter((value) => value !== item.value)
                        setForm({ ...form, eligible_work_types: next })
                      }}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <Label>Career levels</Label>
              <div className="mt-2 flex flex-wrap gap-3">
                {CAREER_LEVELS.map((item) => (
                  <label key={item.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.eligible_career_levels.includes(item.value)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...form.eligible_career_levels, item.value]
                          : form.eligible_career_levels.filter((value) => value !== item.value)
                        setForm({ ...form, eligible_career_levels: next })
                      }}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <Field label="Submission requirements">
              <Textarea rows={4} value={form.submission_requirements} onChange={(e) => setForm({ ...form, submission_requirements: e.target.value })} />
            </Field>
            <Field label="Prize information">
              <Textarea rows={3} value={form.prize_info} onChange={(e) => setForm({ ...form, prize_info: e.target.value })} />
            </Field>
            <Field label="Publication information">
              <Textarea rows={3} value={form.publication_info} onChange={(e) => setForm({ ...form, publication_info: e.target.value })} />
            </Field>
            <Field label="Staff notes">
              <Textarea rows={2} value={form.admin_notes} onChange={(e) => setForm({ ...form, admin_notes: e.target.value })} />
            </Field>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
              <Button type="button" disabled={saving} onClick={() => saveForm(true)}>Save and publish</Button>
              <Button type="button" variant="outline" onClick={() => setTab('queue')}>Cancel</Button>
            </div>
          </form>
        )}
    </div>
  )
}

function OpportunityMobileCard({
  opp,
  onEdit,
  onPublish,
  onReject,
  onRestore,
  onArchive,
  archivedView,
}: {
  opp: ConferenceOpportunity
  onEdit: (opp: ConferenceOpportunity) => void
  onPublish: () => void
  onReject: () => void
  onRestore: () => void
  onArchive: () => void
  archivedView: boolean
}) {
  return (
    <div className="p-4 space-y-3">
      <div>
        <div className="font-medium text-gray-900">{opp.name}</div>
        <div className="text-sm text-gray-500">{opp.organising_body}</div>
        <div className="mt-2 text-sm text-gray-700">
          Deadline: {opp.deadline_not_stated ? 'Not stated' : formatDeadline(opp.abstract_deadline)}
        </div>
        <div className="text-xs text-gray-500">Verified: {formatDeadline(opp.last_verified_at)}</div>
        <Badge variant="outline" className="mt-2">{opp.publication_status.replace('_', ' ')}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" onClick={() => onEdit(opp)}>Edit</Button>
        {archivedView ? (
          <Button size="sm" onClick={onRestore}>Restore</Button>
        ) : (
          <>
            {opp.publication_status !== 'published' ? (
              <Button size="sm" onClick={onPublish}>Publish</Button>
            ) : (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/conferences/${opp.slug}`}>View</Link>
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={onReject}>Reject</Button>
            <Button size="sm" variant="ghost" onClick={onArchive}>
              <Archive className="h-4 w-4 mr-1" /> Archive
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  )
}
