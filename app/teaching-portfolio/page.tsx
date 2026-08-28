'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DeleteFileDialog } from '@/components/ui/confirmation-dialog'
import {
  Download,
  Edit,
  ExternalLink,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  LEARNING_TYPE_OPTIONS,
  TAUGHT_TO_OPTIONS,
  TEACHING_PORTFOLIO_ALLOWED_TYPES,
  TEACHING_PORTFOLIO_MAX_FILE_SIZE,
  teachingEntryKind,
  teachingEntryTitle,
  teachingOptionLabel,
  type TeachingEntryKind,
  type TeachingPortfolioEntry,
} from '@/lib/teaching-portfolio'

const emptyForm = {
  sessionTitle: '',
  activityDate: '',
  sessionTime: '',
  taughtTo: '',
  learningType: '',
  provider: '',
  file: null as File | null,
}

export default function TeachingPortfolioPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [entries, setEntries] = useState<TeachingPortfolioEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TeachingEntryKind>('taught')
  const [searchQuery, setSearchQuery] = useState('')
  const [audienceFilter, setAudienceFilter] = useState('all')
  const [evidenceFilter, setEvidenceFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date-asc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TeachingPortfolioEntry | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<TeachingPortfolioEntry | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const evidenceInputRef = useRef<HTMLInputElement>(null)
  const evidenceTargetId = useRef<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const fetchEntries = useCallback(async () => {
    if (status !== 'authenticated') return
    try {
      setLoading(true)
      const response = await fetch('/api/teaching-portfolio/files')
      const data = await response.json()
      setEntries(data.files || [])
    } catch (error) {
      console.error('Error fetching entries:', error)
      toast.error('Failed to fetch teaching portfolio')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const tabEntries = useMemo(
    () => entries.filter((entry) => teachingEntryKind(entry) === activeTab),
    [entries, activeTab]
  )

  const visibleEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const filtered = tabEntries.filter((entry) => {
      const title = teachingEntryTitle(entry).toLowerCase()
      if (query && !title.includes(query)) return false
      if (evidenceFilter === 'has' && !entry.file_path) return false
      if (evidenceFilter === 'none' && entry.file_path) return false
      if (activeTab === 'taught' && audienceFilter !== 'all' && entry.taught_to !== audienceFilter) return false
      if (activeTab === 'learnt' && audienceFilter !== 'all' && entry.learning_type !== audienceFilter) return false
      return true
    })

    return filtered.sort((a, b) => {
      const titleA = teachingEntryTitle(a)
      const titleB = teachingEntryTitle(b)
      const dateA = a.activity_date || '9999-12-31'
      const dateB = b.activity_date || '9999-12-31'
      if (sortBy === 'date-desc') return dateB.localeCompare(dateA) || titleA.localeCompare(titleB)
      if (sortBy === 'title-asc') return titleA.localeCompare(titleB)
      if (sortBy === 'title-desc') return titleB.localeCompare(titleA)
      return dateA.localeCompare(dateB) || titleA.localeCompare(titleB)
    })
  }, [tabEntries, searchQuery, evidenceFilter, audienceFilter, activeTab, sortBy])

  const resetForm = () => {
    setForm(emptyForm)
    setEditing(null)
  }

  const openAdd = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEdit = (entry: TeachingPortfolioEntry) => {
    setEditing(entry)
    setForm({
      sessionTitle: teachingEntryTitle(entry),
      activityDate: entry.activity_date || '',
      sessionTime: entry.session_time || '',
      taughtTo: entry.taught_to || '',
      learningType: entry.learning_type || '',
      provider: entry.provider || '',
      file: null,
    })
    setDialogOpen(true)
  }

  const saveEntry = async () => {
    if (!form.sessionTitle.trim()) {
      toast.error('Title is required')
      return
    }
    if (!form.activityDate) {
      toast.error('Date is required')
      return
    }
    if (activeTab === 'taught' && !form.taughtTo) {
      toast.error('Taught to is required')
      return
    }
    if (form.file && form.file.size > TEACHING_PORTFOLIO_MAX_FILE_SIZE) {
      toast.error('File size must be less than 25MB')
      return
    }
    if (form.file && !TEACHING_PORTFOLIO_ALLOWED_TYPES.includes(form.file.type)) {
      toast.error('File type not supported')
      return
    }

    try {
      setSaving(true)
      if (editing) {
        const response = await fetch(`/api/teaching-portfolio/files/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entryKind: activeTab,
            sessionTitle: form.sessionTitle,
            activityDate: form.activityDate,
            sessionTime: form.sessionTime,
            taughtTo: form.taughtTo,
            learningType: form.learningType,
            provider: form.provider,
          }),
        })
        const data = await response.json()
        if (!response.ok) {
          toast.error(data.error || 'Failed to update entry')
          return
        }
        toast.success('Entry updated')
      } else {
        const formData = new FormData()
        formData.append('entryKind', activeTab)
        formData.append('sessionTitle', form.sessionTitle)
        formData.append('activityDate', form.activityDate)
        formData.append('sessionTime', form.sessionTime)
        formData.append('taughtTo', form.taughtTo)
        formData.append('learningType', form.learningType)
        formData.append('provider', form.provider)
        if (form.file) formData.append('file', form.file)
        const response = await fetch('/api/teaching-portfolio/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await response.json()
        if (!response.ok) {
          toast.error(data.error || 'Failed to add entry')
          return
        }
        toast.success('Entry added')
      }
      setDialogOpen(false)
      resetForm()
      fetchEntries()
    } catch (error) {
      console.error(error)
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  const uploadEvidence = async (entryId: string, file: File) => {
    if (file.size > TEACHING_PORTFOLIO_MAX_FILE_SIZE) {
      toast.error('File size must be less than 25MB')
      return
    }
    if (!TEACHING_PORTFOLIO_ALLOWED_TYPES.includes(file.type)) {
      toast.error('File type not supported')
      return
    }
    try {
      setUploadingId(entryId)
      const formData = new FormData()
      formData.append('entryId', entryId)
      formData.append('file', file)
      const response = await fetch('/api/teaching-portfolio/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || 'Upload failed')
        return
      }
      toast.success('Evidence uploaded')
      fetchEntries()
    } catch (error) {
      console.error(error)
      toast.error('Upload failed')
    } finally {
      setUploadingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/teaching-portfolio/files/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Delete failed')
        return
      }
      toast.success('Entry deleted')
      setDeleteTarget(null)
      fetchEntries()
    } catch (error) {
      console.error(error)
      toast.error('Delete failed')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExport = async () => {
    const toastId = toast.loading('Preparing your portfolio download...')
    try {
      setIsExporting(true)
      const response = await fetch('/api/teaching-portfolio/download-all')
      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to export portfolio', { id: toastId })
        return
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'user'
      a.download = `Teaching_Portfolio_${userName.replace(/[<>:"/\\|?*]/g, '_')}_${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Portfolio downloaded', { id: toastId })
    } catch (error) {
      console.error(error)
      toast.error('An error occurred while exporting the portfolio', { id: toastId })
    } finally {
      setIsExporting(false)
    }
  }

  if (status === 'loading' || (status === 'authenticated' && loading && entries.length === 0)) {
    return <LoadingScreen message="Loading teaching portfolio…" />
  }

  const filterOptions = activeTab === 'taught' ? TAUGHT_TO_OPTIONS : LEARNING_TYPE_OPTIONS

  const renderEvidence = (entry: TeachingPortfolioEntry) =>
    entry.file_path ? (
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-xs text-slate-500">{entry.original_filename}</span>
        <div className="flex flex-wrap gap-3">
          <a
            href={`/api/teaching-portfolio/files/${entry.id}?inline=1`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center text-xs font-medium text-teal-700 hover:underline"
          >
            <ExternalLink className="mr-1 h-3 w-3" />
            Open in new tab
          </a>
          <a
            href={`/api/teaching-portfolio/files/${entry.id}`}
            className="inline-flex items-center text-xs font-medium text-slate-700 hover:underline"
          >
            <Download className="mr-1 h-3 w-3" />
            Download
          </a>
        </div>
      </div>
    ) : (
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={uploadingId === entry.id}
        onClick={() => {
          evidenceTargetId.current = entry.id
          evidenceInputRef.current?.click()
        }}
      >
        <Upload className="mr-1 h-3 w-3" />
        {uploadingId === entry.id ? 'Uploading…' : 'Upload evidence'}
      </Button>
    )

  const renderActions = (entry: TeachingPortfolioEntry) => (
    <div className="flex shrink-0 justify-end gap-1">
      <Button type="button" size="sm" variant="ghost" onClick={() => openEdit(entry)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button type="button" size="sm" variant="ghost" className="text-red-600" onClick={() => setDeleteTarget(entry)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teaching Portfolio</h1>
          <p className="text-sm text-slate-600">
            Record sessions you taught and courses you completed, then export a Word, Excel, and evidence ZIP.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            className="border-green-200 text-green-800 hover:bg-green-50"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Preparing ZIP…' : 'Export portfolio'}
          </Button>
          <Button type="button" onClick={openAdd} className="bg-teal-700 hover:bg-teal-800">
            <Plus className="mr-2 h-4 w-4" />
            Add {activeTab === 'taught' ? 'session' : 'learning'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value as TeachingEntryKind)
        setAudienceFilter('all')
      }}>
        <TabsList>
          <TabsTrigger value="taught">Taught</TabsTrigger>
          <TabsTrigger value="learnt">Learnt</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="p-0">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="relative col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title"
                className="pl-9"
              />
            </div>
            <div className="col-span-2 min-w-0 md:col-span-1">
              <Select value={audienceFilter} onValueChange={setAudienceFilter}>
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue placeholder={activeTab === 'taught' ? 'Taught to' : 'Type'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{activeTab === 'taught' ? 'All audiences' : 'All types'}</SelectItem>
                  {filterOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0">
              <Select value={evidenceFilter} onValueChange={setEvidenceFilter}>
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue placeholder="Evidence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All evidence</SelectItem>
                  <SelectItem value="has">Has evidence</SelectItem>
                  <SelectItem value="none">No evidence</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-asc">Date (oldest first)</SelectItem>
                  <SelectItem value="date-desc">Date (newest first)</SelectItem>
                  <SelectItem value="title-asc">Title (A–Z)</SelectItem>
                  <SelectItem value="title-desc">Title (Z–A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {visibleEntries.length === 0 ? (
            <div className="rounded-lg border px-4 py-10 text-center text-sm text-slate-500">
              {loading ? 'Loading…' : 'No entries yet'}
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {visibleEntries.map((entry) => {
                  const dateLabel = (() => {
                    if (!entry.activity_date) return null
                    const parsed = new Date(`${entry.activity_date}T00:00:00`)
                    if (Number.isNaN(parsed.getTime())) return entry.activity_date
                    return parsed.toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  })()
                  const when = [dateLabel, entry.session_time].filter(Boolean).join(' · ')
                  const kindLabel =
                    activeTab === 'taught'
                      ? teachingOptionLabel(TAUGHT_TO_OPTIONS, entry.taught_to)
                      : teachingOptionLabel(LEARNING_TYPE_OPTIONS, entry.learning_type)

                  return (
                    <article key={entry.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <div className="px-4 pt-4 pb-3">
                        <h3 className="text-[15px] font-semibold leading-snug text-slate-900">
                          {teachingEntryTitle(entry)}
                        </h3>
                        {when && <p className="mt-1 text-sm text-slate-500">{when}</p>}
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          {kindLabel && <Badge variant="outline">{kindLabel}</Badge>}
                          {activeTab === 'learnt' && entry.provider && (
                            <span className="text-sm text-slate-600">{entry.provider}</span>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                        {entry.file_path ? (
                          <div>
                            <p className="truncate text-sm text-slate-700">{entry.original_filename}</p>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <a
                                href={`/api/teaching-portfolio/files/${entry.id}?inline=1`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white text-xs font-medium text-teal-800"
                              >
                                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                Open
                              </a>
                              <a
                                href={`/api/teaching-portfolio/files/${entry.id}`}
                                className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700"
                              >
                                <Download className="mr-1.5 h-3.5 w-3.5" />
                                Download
                              </a>
                            </div>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="w-full bg-white"
                            disabled={uploadingId === entry.id}
                            onClick={() => {
                              evidenceTargetId.current = entry.id
                              evidenceInputRef.current?.click()
                            }}
                          >
                            <Upload className="mr-1.5 h-3.5 w-3.5" />
                            {uploadingId === entry.id ? 'Uploading…' : 'Upload evidence'}
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => openEdit(entry)}
                          className="inline-flex h-11 items-center justify-center gap-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(entry)}
                          className="inline-flex h-11 items-center justify-center gap-1.5 border-l border-slate-100 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>

              <div className="hidden overflow-x-auto rounded-lg border md:block">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">{activeTab === 'taught' ? 'Session' : 'Title'}</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Time</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        {activeTab === 'taught' ? 'Taught to' : 'Type'}
                      </th>
                      {activeTab === 'learnt' && (
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Provider</th>
                      )}
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Evidence</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {visibleEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{teachingEntryTitle(entry)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">{entry.activity_date || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">{entry.session_time || '—'}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">
                            {activeTab === 'taught'
                              ? teachingOptionLabel(TAUGHT_TO_OPTIONS, entry.taught_to) || '—'
                              : teachingOptionLabel(LEARNING_TYPE_OPTIONS, entry.learning_type) || '—'}
                          </Badge>
                        </td>
                        {activeTab === 'learnt' && (
                          <td className="px-4 py-3 text-slate-600">{entry.provider || '—'}</td>
                        )}
                        <td className="px-4 py-3">{renderEvidence(entry)}</td>
                        <td className="px-4 py-3">{renderActions(entry)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <input
        ref={evidenceInputRef}
        type="file"
        className="hidden"
        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.ppt,.pptx"
        onChange={(e) => {
          const file = e.target.files?.[0]
          const entryId = evidenceTargetId.current
          e.target.value = ''
          if (file && entryId) uploadEvidence(entryId, file)
        }}
      />

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit' : 'Add'} {activeTab === 'taught' ? 'taught session' : 'learning'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Title</label>
              <Input
                value={form.sessionTitle}
                onChange={(e) => setForm((prev) => ({ ...prev, sessionTitle: e.target.value }))}
                placeholder={activeTab === 'taught' ? 'Teaching session delivered' : 'Course or learning activity'}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={form.activityDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, activityDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Time {activeTab === 'learnt' ? '(optional)' : ''}</label>
                <Input
                  type="time"
                  value={form.sessionTime}
                  onChange={(e) => setForm((prev) => ({ ...prev, sessionTime: e.target.value }))}
                />
              </div>
            </div>
            {activeTab === 'taught' ? (
              <div>
                <label className="mb-1 block text-sm font-medium">Taught to</label>
                <Select value={form.taughtTo} onValueChange={(value) => setForm((prev) => ({ ...prev, taughtTo: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    {TAUGHT_TO_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium">Type (optional)</label>
                  <Select value={form.learningType} onValueChange={(value) => setForm((prev) => ({ ...prev, learningType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEARNING_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Provider (optional)</label>
                  <Input
                    value={form.provider}
                    onChange={(e) => setForm((prev) => ({ ...prev, provider: e.target.value }))}
                    placeholder="Organisation or provider"
                  />
                </div>
              </>
            )}
            {!editing && (
              <div>
                <label className="mb-1 block text-sm font-medium">Evidence (optional)</label>
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.ppt,.pptx"
                  onChange={(e) => setForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
                />
                <p className="mt-1 text-xs text-slate-500">jpg, png, pdf, Word, or PowerPoint. Max 25MB.</p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={saveEntry} disabled={saving} className="bg-teal-700 hover:bg-teal-800">
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteFileDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete entry"
        description="Are you sure you want to delete this entry? This cannot be undone."
      />
    </div>
  )
}
