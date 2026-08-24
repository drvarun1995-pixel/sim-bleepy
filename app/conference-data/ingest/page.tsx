'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Database, ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDeadline } from '@/lib/conferences'
import {
  SOURCE_KIND_LABELS,
  SOURCE_PRIORITY_LABELS,
  type ConferenceSourceKind,
  type ConferenceSourcePriority,
} from '@/lib/conferences/ingest/source-registry'

type IngestSource = {
  adapterKey: string
  name: string
  organisation: string
  specialty: string
  url: string
  urls: string[]
  notes: string
  priority: ConferenceSourcePriority
  kind: ConferenceSourceKind
  enabled: boolean
  last_run_at: string | null
  last_error: string | null
}

type IngestResult = {
  source?: string
  found?: number
  created?: number
  updated?: number
  queued?: number
  skipped?: number
  ok?: boolean
  error?: string
}

function summarise(result: IngestResult) {
  if (result.error && result.ok === false) return `${result.source}: ${result.error}`
  return `${result.source}: ${result.created || 0} new, ${result.updated || 0} updated, ${result.skipped || 0} skipped`
}

export default function ConferenceIngestPage() {
  const [sources, setSources] = useState<IngestSource[]>([])
  const [loading, setLoading] = useState(true)
  const [runningKey, setRunningKey] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/admin/conferences/ingest')
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to load sources')
    setSources(data.sources || [])
  }

  useEffect(() => {
    load()
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Failed to load sources'))
      .finally(() => setLoading(false))
  }, [])

  async function run(adapterKey: string) {
    setRunningKey(adapterKey)
    try {
      const res = await fetch('/api/admin/conferences/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adapterKey }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ingest failed')
      if (adapterKey === 'all') {
        const results = (data.results || []) as IngestResult[]
        const failed = results.filter((item) => item.ok === false)
        toast.success(results.map(summarise).join(' · '))
        if (failed.length) toast.error(`${failed.length} source(s) failed`)
      } else {
        toast.success(summarise(data))
      }
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ingest failed')
    } finally {
      setRunningKey(null)
    }
  }

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
              <h1 className="mt-1 text-2xl sm:text-4xl font-bold text-gray-900">Ingest sources</h1>
              <p className="text-gray-600 mt-2 max-w-2xl">
                Run one college at a time, or all of them. New meetings land in the review queue. Archived and rejected records are not recreated.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <Button asChild variant="outline" className="w-full sm:w-auto bg-white">
              <Link href="/conference-data">
                <ArrowLeft className="h-4 w-4" />
                Conference Data
              </Link>
            </Button>
            <Button
              onClick={() => run('all')}
              disabled={Boolean(runningKey)}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {runningKey === 'all' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {runningKey === 'all' ? 'Ingesting all…' : 'Ingest all sources'}
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
          Loading sources
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {sources.map((source) => (
            <section key={source.adapterKey} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{source.organisation}</h2>
                  <p className="text-sm text-gray-500">{source.specialty}</p>
                </div>
                <Badge variant={source.enabled ? 'default' : 'outline'}>{source.enabled ? 'Ready' : 'Disabled'}</Badge>
              </div>
              <p className="text-sm text-gray-700">{source.notes}</p>
              <p className="text-xs text-gray-500">
                {SOURCE_KIND_LABELS[source.kind]} · {SOURCE_PRIORITY_LABELS[source.priority]}
              </p>
              <div className="space-y-1">
                {source.urls.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm font-medium text-blue-700 break-all"
                  >
                    {url} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Last run: {source.last_run_at ? formatDeadline(source.last_run_at) : 'Never'}
              </p>
              {source.last_error ? <p className="text-xs text-red-600">{source.last_error}</p> : null}
              <Button
                onClick={() => run(source.adapterKey)}
                disabled={Boolean(runningKey) || !source.enabled}
                className="w-full sm:w-auto"
              >
                {runningKey === source.adapterKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {runningKey === source.adapterKey ? 'Ingesting…' : 'Run ingest'}
              </Button>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
