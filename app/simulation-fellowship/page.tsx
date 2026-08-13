'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DeleteFileDialog } from '@/components/ui/confirmation-dialog'
import { Check, Download, ExternalLink, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import {
  SIMULATION_FELLOWSHIP_ALLOWED_TYPES,
  SIMULATION_FELLOWSHIP_MAX_FILE_SIZE,
  SIMULATION_FELLOWSHIP_REQUIREMENTS,
  filesForRequirement,
  isRequirementComplete,
  simulationFellowshipProgress,
  type SimulationFellowshipFile,
  type SimulationFellowshipRequirement,
} from '@/lib/simulation-fellowship'

type ViewTab = 'pending' | 'done' | 'all'

export default function SimulationFellowshipPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [files, setFiles] = useState<SimulationFellowshipFile[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ViewTab>('all')
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SimulationFellowshipFile | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadKeyRef = useRef<string | null>(null)
  const pendingJump = useRef<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      const userRole = (session?.user as { role?: string })?.role
      if (userRole !== 'ctf' && userRole !== 'admin') {
        toast.error('Access Denied', {
          description: 'Simulation Fellowship is only accessible to CTF and Admin users.',
        })
        router.push('/dashboard')
      }
    }
  }, [status, session, router])

  const fetchFiles = useCallback(async () => {
    if (status !== 'authenticated') return
    try {
      setLoading(true)
      const response = await fetch('/api/simulation-fellowship/files')
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || 'Failed to load Simulation Fellowship')
        return
      }
      setFiles(data.files || [])
    } catch (error) {
      console.error('Error fetching simulation fellowship:', error)
      toast.error('Failed to load Simulation Fellowship')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const progress = useMemo(() => simulationFellowshipProgress(files), [files])
  const hoursLeft = progress.hoursTotal - progress.hoursDone
  const percent = Math.round((progress.hoursDone / progress.hoursTotal) * 100)

  const visibleRequirements = useMemo(() => {
    if (activeTab === 'pending') return progress.pending
    if (activeTab === 'done') return progress.done
    return SIMULATION_FELLOWSHIP_REQUIREMENTS
  }, [activeTab, progress.done, progress.pending])

  const chooseFile = (key: string) => {
    uploadKeyRef.current = key
    fileInputRef.current?.click()
  }

  const scrollToRequirement = (key: string) => {
    document.getElementById(`requirement-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const jumpToRequirement = (key: string) => {
    if (activeTab !== 'all') {
      pendingJump.current = key
      setActiveTab('all')
      return
    }
    scrollToRequirement(key)
  }

  useEffect(() => {
    if (!pendingJump.current) return
    const key = pendingJump.current
    pendingJump.current = null
    window.requestAnimationFrame(() => scrollToRequirement(key))
  }, [activeTab])

  const uploadEvidence = async (requirementKey: string, file: File) => {
    if (file.size > SIMULATION_FELLOWSHIP_MAX_FILE_SIZE) {
      toast.error('File size must be less than 25MB')
      return
    }
    if (!SIMULATION_FELLOWSHIP_ALLOWED_TYPES.includes(file.type)) {
      toast.error('File type not supported. Use PDF, Word, PowerPoint, or an image.')
      return
    }
    try {
      setUploadingKey(requirementKey)
      const formData = new FormData()
      formData.append('requirementKey', requirementKey)
      formData.append('file', file)
      const response = await fetch('/api/simulation-fellowship/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || 'Upload failed')
        return
      }
      toast.success('Evidence attached')
      fetchFiles()
    } catch (error) {
      console.error(error)
      toast.error('Upload failed')
    } finally {
      setUploadingKey(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/simulation-fellowship/files/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Delete failed')
        return
      }
      toast.success('Evidence removed')
      setDeleteTarget(null)
      fetchFiles()
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
      const response = await fetch('/api/simulation-fellowship/download-all')
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
      a.download = `Simulation_Fellowship_${userName.replace(/[<>:"/\\|?*]/g, '_')}_${new Date().toISOString().split('T')[0]}.zip`
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

  if (status === 'loading' || (status === 'authenticated' && loading && files.length === 0)) {
    return <LoadingScreen message="Loading Simulation Fellowship..." />
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Simulation Fellowship</h1>
          <p className="text-sm text-slate-600">
            Attach evidence against each requirement, then export a Word, Excel, and evidence ZIP.
          </p>
        </div>
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
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Complete</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {progress.completeCount}
            <span className="text-sm font-normal text-slate-500"> / {progress.totalCount}</span>
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Hours</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {progress.hoursDone}
            <span className="text-sm font-normal text-slate-500"> / {progress.hoursTotal}</span>
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Remaining</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{hoursLeft}h</p>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ViewTab)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending ({progress.pending.length})</TabsTrigger>
              <TabsTrigger value="done">Done ({progress.done.length})</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-xs text-slate-500">A requirement is done once evidence is attached.</p>
        </div>

        {visibleRequirements.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            {loading
              ? 'Loading…'
              : activeTab === 'done'
                ? 'Nothing marked complete yet'
                : 'All requirements have evidence attached'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleRequirements.map((requirement, index) => (
              <RequirementRow
                key={requirement.key}
                index={
                  SIMULATION_FELLOWSHIP_REQUIREMENTS.findIndex((item) => item.key === requirement.key) + 1 ||
                  index + 1
                }
                requirement={requirement}
                complete={isRequirementComplete(files, requirement.key)}
                evidence={filesForRequirement(files, requirement.key)}
                uploading={uploadingKey === requirement.key}
                onUpload={() => chooseFile(requirement.key)}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </Card>

      <Card className="p-0">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Progress</h2>
              <p className="text-sm text-slate-500">
                {progress.completeCount} of 9 complete · {hoursLeft}h still to evidence
              </p>
            </div>
            <p className="text-sm tabular-nums text-slate-600">{percent}%</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-teal-700 transition-all" style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SIMULATION_FELLOWSHIP_REQUIREMENTS.map((item) => {
              const complete = isRequirementComplete(files, item.key)
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => jumpToRequirement(item.key)}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left ${
                    complete
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-teal-50/40'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      complete ? 'bg-slate-200 text-slate-500' : 'border border-slate-300 bg-white text-transparent'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm font-medium ${complete ? 'text-slate-400' : 'text-slate-900'}`}>
                      {item.folder}
                    </span>
                    <span className={`text-xs ${complete ? 'text-slate-400' : 'text-slate-500'}`}>{item.hours} hours</span>
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.ppt,.pptx"
        onChange={(event) => {
          const file = event.target.files?.[0]
          const key = uploadKeyRef.current
          event.target.value = ''
          if (file && key) void uploadEvidence(key, file)
        }}
      />

      <DeleteFileDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Remove evidence"
        description="Are you sure you want to remove this file? This cannot be undone."
      />
    </div>
  )
}

function RequirementRow({
  index,
  requirement,
  complete,
  evidence,
  uploading,
  onUpload,
  onDelete,
}: {
  index: number
  requirement: SimulationFellowshipRequirement
  complete: boolean
  evidence: SimulationFellowshipFile[]
  uploading: boolean
  onUpload: () => void
  onDelete: (file: SimulationFellowshipFile) => void
}) {
  return (
    <article
      id={`requirement-${requirement.key}`}
      className={`grid gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start ${
        complete ? 'bg-slate-50/70' : 'bg-white'
      }`}
    >
      <div className="flex gap-3">
        <span
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
            complete ? 'bg-slate-200 text-slate-500' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {complete ? <Check className="h-3.5 w-3.5" /> : String(index).padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h3 className={`text-[15px] font-semibold ${complete ? 'text-slate-500' : 'text-slate-900'}`}>
              {requirement.folder}
            </h3>
            <span className={`text-sm ${complete ? 'text-slate-400' : 'text-slate-500'}`}>{requirement.hours} hours</span>
          </div>
          <p className={`mt-1 text-sm leading-snug ${complete ? 'text-slate-400' : 'text-slate-600'}`}>
            {requirement.title}
          </p>
          <p className={`mt-2 text-xs leading-relaxed ${complete ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className={complete ? 'font-medium text-slate-400' : 'font-medium text-slate-600'}>Needs</span>{' '}
            {requirement.evidence}
            {requirement.alsoCounts ? (
              <>
                <span className="mx-1.5 text-slate-300">·</span>
                <span className={complete ? 'font-medium text-slate-400' : 'font-medium text-slate-600'}>Also</span>{' '}
                {requirement.alsoCounts}
              </>
            ) : null}
          </p>

          {evidence.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {evidence.map((file) => (
                <li
                  key={file.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2"
                >
                  <span className="min-w-0 truncate text-sm text-slate-700">{file.original_filename}</span>
                  <div className="flex items-center gap-3">
                    <a
                      href={`/api/simulation-fellowship/files/${file.id}?inline=1`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-teal-700 hover:underline"
                    >
                      Open
                    </a>
                    <a
                      href={`/api/simulation-fellowship/files/${file.id}`}
                      className="inline-flex items-center text-xs font-medium text-slate-600 hover:underline"
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Download
                    </a>
                    <button
                      type="button"
                      className="inline-flex items-center text-xs font-medium text-red-600 hover:underline"
                      onClick={() => onDelete(file)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        variant={complete ? 'outline' : 'default'}
        className={complete ? 'w-full sm:w-auto' : 'w-full bg-teal-700 hover:bg-teal-800 sm:w-auto'}
        disabled={uploading}
        onClick={onUpload}
      >
        <Upload className="mr-1.5 h-3.5 w-3.5" />
        {uploading ? 'Uploading…' : complete ? 'Add more' : 'Upload evidence'}
      </Button>
    </article>
  )
}
