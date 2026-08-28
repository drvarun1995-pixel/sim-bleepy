'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Bookmark, Loader2, Presentation, Search } from 'lucide-react'
import { ConferenceCard } from '@/components/conferences/ConferenceCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CAREER_LEVELS,
  FORMATS,
  NATIONS,
  RECOGNITION_LEVELS,
  WORK_TYPES,
  azByLabel,
  type ConferenceOpportunity,
} from '@/lib/conferences'

type Specialty = { id: string; name: string; slug: string }

export default function ConferencesPage() {
  const router = useRouter()
  const { status } = useSession()
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [presentation, setPresentation] = useState('')
  const [workType, setWorkType] = useState('')
  const [careerLevel, setCareerLevel] = useState('')
  const [format, setFormat] = useState('')
  const [nation, setNation] = useState('')
  const [recognition, setRecognition] = useState('')
  const [deadline, setDeadline] = useState('')
  const [sort, setSort] = useState('deadline')
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [opportunities, setOpportunities] = useState<ConferenceOpportunity[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin?callbackUrl=/conferences')
  }, [status, router])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(q.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [q])

  useEffect(() => {
    fetch('/api/placements/specialties')
      .then((res) => res.json())
      .then((data) => setSpecialties(data.specialties || []))
      .catch(() => setSpecialties([]))
  }, [])

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (debouncedQ) params.set('q', debouncedQ)
    if (specialty) params.set('specialty', specialty)
    if (presentation) params.set('presentation', presentation)
    if (workType) params.set('workType', workType)
    if (careerLevel) params.set('careerLevel', careerLevel)
    if (format) params.set('format', format)
    if (nation) params.set('nation', nation)
    if (recognition) params.set('recognition', recognition)
    if (deadline) params.set('deadline', deadline)
    params.set('sort', sort)
    params.set('limit', '30')
    return params.toString()
  }, [debouncedQ, specialty, presentation, workType, careerLevel, format, nation, recognition, deadline, sort])

  useEffect(() => {
    if (status !== 'authenticated') return
    let cancelled = false
    setLoading(true)
    fetch(`/api/conferences?${queryString}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        setOpportunities(data.opportunities || [])
        setTotal(data.total || 0)
      })
      .catch(() => {
        if (!cancelled) setOpportunities([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [queryString, status])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
              <Presentation className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">Research &amp; presentations</p>
              <h1 className="mt-1 text-2xl sm:text-4xl font-bold text-gray-900">Presentation opportunities</h1>
              <p className="text-gray-600 mt-2 max-w-2xl">
                Open UK calls for poster or oral presentation. Submit on the organiser&apos;s site — Bleepy keeps the deadlines and requirements in one place.
              </p>
            </div>
          </div>
          <Button asChild className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Link href="/conferences/saved">
              <Bookmark className="h-4 w-4" />
              Saved
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, organiser, or location"
            className="pl-9 h-11"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <FilterSelect
            label="Specialty"
            value={specialty}
            onChange={setSpecialty}
            options={[
              { value: '', label: 'All specialties' },
              ...[...specialties]
                .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))
                .map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
          <FilterSelect
            label="Presentation"
            value={presentation}
            onChange={setPresentation}
            options={[
              { value: '', label: 'Poster or oral' },
              ...azByLabel([
                { value: 'poster', label: 'Poster' },
                { value: 'oral', label: 'Oral' },
                { value: 'both', label: 'Both' },
              ]),
            ]}
          />
          <FilterSelect label="Work type" value={workType} onChange={setWorkType} options={[{ value: '', label: 'Any work type' }, ...azByLabel(WORK_TYPES)]} />
          <FilterSelect label="Career level" value={careerLevel} onChange={setCareerLevel} options={[{ value: '', label: 'Any career level' }, ...azByLabel(CAREER_LEVELS)]} />
          <FilterSelect label="Format" value={format} onChange={setFormat} options={[{ value: '', label: 'Any format' }, ...azByLabel(FORMATS)]} />
          <FilterSelect label="Geography" value={nation} onChange={setNation} options={[{ value: '', label: 'Anywhere' }, ...azByLabel(NATIONS)]} />
          <FilterSelect label="Recognition" value={recognition} onChange={setRecognition} options={[{ value: '', label: 'Any recognition' }, ...azByLabel(RECOGNITION_LEVELS)]} />
          <FilterSelect
            label="Deadline"
            value={deadline}
            onChange={setDeadline}
            options={[
              { value: '', label: 'Any open deadline' },
              { value: '7', label: 'Within 7 days' },
              { value: '30', label: 'Within 30 days' },
              { value: '90', label: 'Within 3 months' },
            ]}
          />
        </div>
        <FilterSelect
          label="Sort"
          value={sort}
          onChange={setSort}
          options={[
            { value: 'deadline', label: 'Deadline soonest' },
            { value: 'event', label: 'Event date' },
            { value: 'verified', label: 'Recently verified' },
          ]}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading opportunities
        </div>
      ) : opportunities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
          No open presentation opportunities match these filters.
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">{total} open opportunit{total === 1 ? 'y' : 'ies'}</p>
          <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
            {opportunities.map((opportunity) => (
              <ConferenceCard
                key={opportunity.id}
                opportunity={opportunity}
                href={`/conferences/${opportunity.slug}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <div>
      <Label className="text-xs font-medium text-gray-500">{label}</Label>
      <select
        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value || 'all'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
