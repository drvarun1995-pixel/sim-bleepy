'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Check, ChevronDown, Eye, FileImage, Loader2, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type DisplaySize = 'small' | 'default' | 'large'
type SortMode = 'new' | 'name'
type Scope = 'all' | 'yours' | 'shared'

type GalleryTemplate = {
  id: string
  name: string
  created_at: string
  shared_at?: string | null
  created_by?: string | null
  is_shared?: boolean
  background_image?: string | null
  image_path?: string | null
  fields?: unknown[]
  users?: { name?: string } | { name?: string }[] | null
}

const SORT_STORAGE_KEY = 'certificates-library-sort'
const DISPLAY_STORAGE_KEY = 'certificates-library-display'

const GRID_CLASS: Record<DisplaySize, string> = {
  small: 'grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  default: 'grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3',
  large: 'grid-cols-1 gap-5',
}

function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T) {
  if (typeof window === 'undefined') return fallback
  const value = window.localStorage.getItem(key)
  return allowed.includes(value as T) ? (value as T) : fallback
}

function creatorName(template: GalleryTemplate) {
  const users = template.users
  if (!users) return null
  if (Array.isArray(users)) return users[0]?.name || null
  return users.name || null
}

function DisplaySizeIcon({ size }: { size: DisplaySize }) {
  if (size === 'large') {
    return <span className="block h-4 w-4 rounded-[2px] border-2 border-current" />
  }
  if (size === 'small') {
    return (
      <span className="grid h-4 w-4 grid-cols-3 gap-[2px]">
        {Array.from({ length: 6 }).map((_, index) => (
          <span key={index} className="rounded-[1px] bg-current" />
        ))}
      </span>
    )
  }
  return (
    <span className="grid h-4 w-4 grid-cols-2 gap-[2px]">
      {Array.from({ length: 4 }).map((_, index) => (
        <span key={index} className="rounded-[1px] bg-current" />
      ))}
    </span>
  )
}

export function CertificatesTemplateGallery() {
  const { data: session } = useSession()
  const [templates, setTemplates] = useState<GalleryTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [scope, setScope] = useState<Scope>('all')
  const [sort, setSort] = useState<SortMode>('new')
  const [displaySize, setDisplaySize] = useState<DisplaySize>('default')
  const [sortOpen, setSortOpen] = useState(false)
  const [displayOpen, setDisplayOpen] = useState(false)

  useEffect(() => {
    setSort(readStored(SORT_STORAGE_KEY, ['new', 'name'] as const, 'new'))
    setDisplaySize(readStored(DISPLAY_STORAGE_KEY, ['small', 'default', 'large'] as const, 'default'))
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await fetch('/api/certificates/templates')
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to load templates')
        if (!cancelled) setTemplates(result.templates || [])
      } catch (error) {
        console.error('Error loading certificate templates:', error)
        if (!cancelled) setTemplates([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const userId = session?.user?.id
  const yoursCount = templates.filter((template) => template.created_by === userId).length
  const sharedCount = templates.filter(
    (template) => template.is_shared && template.created_by !== userId
  ).length

  const visibleTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const filtered = templates.filter((template) => {
      const isOwn = template.created_by === userId
      const isSharedByOthers = Boolean(template.is_shared && !isOwn)
      if (scope === 'yours' && !isOwn) return false
      if (scope === 'shared' && !isSharedByOthers) return false
      if (!query) return true
      const creator = creatorName(template)?.toLowerCase() || ''
      return template.name.toLowerCase().includes(query) || creator.includes(query)
    })

    return [...filtered].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [templates, searchQuery, scope, sort, userId])

  return (
    <div className="space-y-4" data-tour="certificates-featured-templates">
      <div>
        <p className="text-sm font-medium text-blue-700">Templates</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Certificate templates
        </h2>
        <p className="mt-1 max-w-2xl text-slate-600">
          Browse your designs and templates shared by others. Use one as a starting point, or open the library to edit.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {([
          ['all', 'All templates', templates.length],
          ['yours', 'Your templates', yoursCount],
          ['shared', 'Shared with you', sharedCount],
        ] as const).map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            onClick={() => setScope(value)}
            className={`rounded-xl border p-4 text-left transition ${
              scope === value
                ? 'border-blue-400 bg-blue-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <p className="text-sm font-semibold text-slate-900">{label}</p>
            <p className="mt-1 text-xs text-slate-500">{count} {count === 1 ? 'template' : 'templates'}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by template name"
            className="h-11 bg-white pl-10 placeholder:text-slate-500"
            aria-label="Search certificate templates"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Popover open={sortOpen} onOpenChange={setSortOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex h-11 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:gap-2 sm:px-4"
              >
                Sort
                <ChevronDown className={`h-4 w-4 text-slate-500 transition ${sortOpen ? 'rotate-180' : ''}`} />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 rounded-xl p-1.5">
              {([
                ['new', 'Newest'],
                ['name', 'Name A–Z'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setSort(value)
                    window.localStorage.setItem(SORT_STORAGE_KEY, value)
                    setSortOpen(false)
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm ${
                    sort === value
                      ? 'bg-blue-50 font-medium text-blue-800'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {label}
                  {sort === value && <Check className="h-4 w-4" />}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <Popover open={displayOpen} onOpenChange={setDisplayOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                title="Display size"
                className="hidden h-11 w-14 items-center justify-center gap-1 rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:inline-flex"
              >
                <DisplaySizeIcon size={displaySize} />
                <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition ${displayOpen ? 'rotate-180' : ''}`} />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 rounded-xl p-3">
              <p className="mb-2 text-sm font-medium text-slate-700">Display size</p>
              <div className="grid grid-cols-3 rounded-full bg-slate-100 p-1">
                {([
                  ['small', 'Small'],
                  ['default', 'Default'],
                  ['large', 'Large'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setDisplaySize(value)
                      window.localStorage.setItem(DISPLAY_STORAGE_KEY, value)
                      setDisplayOpen(false)
                    }}
                    className={`rounded-full px-2 py-1.5 text-xs font-medium transition ${
                      displaySize === value
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading templates…
        </div>
      ) : visibleTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileImage className="mx-auto mb-3 h-10 w-10 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900">No templates in this view</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              {searchQuery
                ? 'Try a different search, or switch All / Yours / Shared.'
                : 'Create a template or ask a colleague to share one.'}
            </p>
            <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700">
              <Link href="/certificates/image-builder">Create template</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={`grid ${GRID_CLASS[displaySize]}`}>
          {visibleTemplates.map((template) => {
            const isOwn = template.created_by === userId
            const imageUrl = template.background_image
            const creator = creatorName(template)
            return (
              <Card
                key={template.id}
                className="group overflow-hidden border-slate-200 p-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div
                  className={`relative overflow-hidden bg-slate-100 ${
                    displaySize === 'large' ? 'aspect-[21/9]' : 'aspect-[4/3]'
                  }`}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={template.name}
                      className="h-full w-full object-contain bg-white transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <FileImage className="h-10 w-10" />
                    </div>
                  )}
                  <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-sm bg-black/70 px-2 py-1 text-[11px] font-medium leading-none tracking-wide text-white">
                    {isOwn ? 'Yours' : 'Shared'}
                  </span>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="line-clamp-1 font-semibold text-slate-900">{template.name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      {isOwn ? (
                        'Your template'
                      ) : (
                        <>
                          <Users className="h-3 w-3" />
                          {creator ? `Shared by ${creator}` : 'Shared with you'}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                      <Link href={`/certificates/image-builder?use=${template.id}`}>
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        Use
                      </Link>
                    </Button>
                    {isOwn && (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/certificates/image-builder?template=${template.id}`}>
                          Edit
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
