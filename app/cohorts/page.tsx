'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Users, GraduationCap, BarChart3, Mail, CheckCircle, XCircle, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw, ChevronDown } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Legend, Tooltip, CartesianGrid } from 'recharts'
import { StudentCohortsTourButton } from './StudentCohortsTourButton'
import { useRole } from '@/lib/useRole'
import {
  ARU_STUDY_YEARS,
  FOUNDATION_YEARS,
  UCL_STUDY_YEARS,
  formatYearChipLabel,
  getCohortYearFilterOptions,
  isFoundationYearValue,
  learnerYearKey,
} from '@/lib/study-years'
import { calendarCohortLabel } from '@/lib/year-progression'

interface User {
  id: string
  email: string
  name: string
  university: string | null
  study_year: string | null
  foundation_year?: string | null
  role_type: string | null
  created_at: string
  email_verified: boolean
  academic_status?: string | null
  academic_cohort?: string | null
  inferred?: boolean
}

interface CohortData {
  stats: {
    total: number
    aru: number
    ucl: number
    fy?: number
    other: number
    verified: number
    byYear: {
      aru: Record<string, number>
      ucl: Record<string, number>
      fy?: Record<string, number>
    }
    byCohort?: Record<string, number>
  }
  cohorts?: Array<{ label: string; is_current?: boolean; suppress_emails?: boolean }>
  aruUsers: User[]
  uclUsers: User[]
  fyUsers?: User[]
  otherUsers: User[]
}

type FilterType = 'all' | 'aru' | 'ucl' | 'fy' | 'other'

const COLORS = {
  aru: '#8B5CF6',
  ucl: '#3B82F6',
  fy: '#0F766E',
  other: '#6B7280'
}

function usersInSelectedCohort(users: User[], selectedCohort: string | null) {
  if (!selectedCohort) return users
  return users.filter((user) => (user.academic_cohort || 'unassigned') === selectedCohort)
}

function countYearInUsers(users: User[], year: string, knownYears: string[]) {
  return users.filter((user) => {
    const key = learnerYearKey(user)
    if (year === 'unknown') return key === 'unknown' || !knownYears.includes(key)
    return key === year
  }).length
}

function CohortStatusBadges({ user, showCohortLabel = true }: { user: User; showCohortLabel?: boolean }) {
  const status = user.academic_status || 'active'
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {showCohortLabel ? <Badge variant="outline">{user.academic_cohort || '—'}</Badge> : null}
      {status === 'graduated' ? (
        <Badge className="bg-slate-700 text-white">Graduated</Badge>
      ) : status === 'active' ? (
        <Badge className="bg-teal-700 text-white">Active</Badge>
      ) : (
        <Badge variant="outline">{status}</Badge>
      )}
    </div>
  )
}

export default function CohortsPage() {
  const { data: session, status } = useSession()
  const { role: viewerRole, loading: roleLoading } = useRole()
  const router = useRouter()

  const [data, setData] = useState<CohortData | null>(null)
  const [loading, setLoading] = useState(true)
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedCohort, setSelectedCohort] = useState<string | null>(() => calendarCohortLabel())
  const [selectedYear, setSelectedYear] = useState<string | null>(null)
  const [sortField, setSortField] = useState<'name' | 'email' | 'year' | 'status'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [cohortMenuOpen, setCohortMenuOpen] = useState(false)
  const appliedCurrentCohort = useRef(false)

  // Drop year chips that aren't valid for the active university / FY filter
  useEffect(() => {
    if (!selectedYear) return
    const allowed = [...getCohortYearFilterOptions(filter), 'unknown']
    if (!allowed.includes(selectedYear)) {
      setSelectedYear(null)
    }
  }, [filter, selectedYear])

  useEffect(() => {
    if (!data || appliedCurrentCohort.current) return
    appliedCurrentCohort.current = true
    const current = data.cohorts?.find((c) => c.is_current)?.label || calendarCohortLabel()
    setSelectedCohort(current)
  }, [data])

  // Track window width for responsive chart sizing
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (status === 'loading' || roleLoading) return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (!['ctf', 'admin', 'meded_team'].includes(viewerRole || '')) {
      router.push('/dashboard')
      return
    }

    fetchCohorts()
  }, [session, status, roleLoading, viewerRole, router])

  const fetchCohorts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/cohorts')
      if (response.ok) {
        const cohortData = await response.json()
        setData(cohortData)
      } else {
        console.error('Failed to fetch cohorts')
      }
    } catch (error) {
      console.error('Error fetching cohorts:', error)
    } finally {
      setLoading(false)
    }
  }

  const preparePieData = () => {
    if (!data) return []
    const aru = usersInSelectedCohort(data.aruUsers, selectedCohort).length
    const ucl = usersInSelectedCohort(data.uclUsers, selectedCohort).length
    const fy = usersInSelectedCohort(data.fyUsers || [], selectedCohort).length
    const other = usersInSelectedCohort(data.otherUsers || [], selectedCohort).length
    return [
      { name: 'ARU', value: aru, color: COLORS.aru },
      { name: 'UCL', value: ucl, color: COLORS.ucl },
      { name: 'FY', value: fy, color: COLORS.fy },
      { name: 'Other', value: other, color: COLORS.other },
    ].filter((row) => row.value > 0)
  }

  const prepareYearData = () => {
    if (!data) return []
    const aruUsers = usersInSelectedCohort(data.aruUsers, selectedCohort)
    const uclUsers = usersInSelectedCohort(data.uclUsers, selectedCohort)
    const fyUsers = usersInSelectedCohort(data.fyUsers || [], selectedCohort)
    const fyKnown = [...FOUNDATION_YEARS]

    if (filter === 'fy') {
      return [...FOUNDATION_YEARS, 'unknown'].map((year) => ({
        year: formatYearChipLabel(year),
        ARU: 0,
        UCL: 0,
        FY: countYearInUsers(fyUsers, year, fyKnown),
      }))
    }

    const years =
      filter === 'aru'
        ? [...ARU_STUDY_YEARS]
        : filter === 'ucl'
          ? [...UCL_STUDY_YEARS]
          : getCohortYearFilterOptions('all').filter((year) => !isFoundationYearValue(year))
    const known = [...years]

    const undergrad = years
      .map((year) => ({
        year: formatYearChipLabel(year),
        ARU: filter === 'ucl' ? 0 : countYearInUsers(aruUsers, year, known),
        UCL: filter === 'aru' ? 0 : countYearInUsers(uclUsers, year, known),
        FY: 0,
      }))
      .filter((item) => item.ARU > 0 || item.UCL > 0)

    const unassigned = {
      year: formatYearChipLabel('unknown'),
      ARU: filter === 'ucl' ? 0 : countYearInUsers(aruUsers, 'unknown', known),
      UCL: filter === 'aru' ? 0 : countYearInUsers(uclUsers, 'unknown', known),
      FY: filter === 'aru' || filter === 'ucl' ? 0 : countYearInUsers(fyUsers, 'unknown', fyKnown),
    }
    const hasUnassigned = unassigned.ARU > 0 || unassigned.UCL > 0 || unassigned.FY > 0

    if (filter === 'aru' || filter === 'ucl') {
      return hasUnassigned ? [...undergrad, unassigned] : undergrad
    }

    const fyRows = [...FOUNDATION_YEARS]
      .map((year) => ({
        year: formatYearChipLabel(year),
        ARU: 0,
        UCL: 0,
        FY: countYearInUsers(fyUsers, year, fyKnown),
      }))
      .filter((item) => item.FY > 0)

    return hasUnassigned ? [...undergrad, ...fyRows, unassigned] : [...undergrad, ...fyRows]
  }

  const layoutRole = (['admin', 'meded_team', 'ctf', 'educator', 'student'].includes(viewerRole || '')
    ? viewerRole
    : 'student') as 'admin' | 'meded_team' | 'ctf' | 'educator' | 'student'

  if (status === 'loading' || roleLoading || loading) {
    return (
      <DashboardLayoutClient role={layoutRole} userName={undefined}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600 dark:text-gray-400">Loading cohorts...</p>
        </div>
      </DashboardLayoutClient>
    )
  }

  if (!data) {
    return (
      <DashboardLayoutClient role={layoutRole} userName={session?.user?.name as string | undefined}>
        <div className="text-center py-12 text-gray-500">
          Failed to load cohort data
        </div>
      </DashboardLayoutClient>
    )
  }

  // Filter and sort users
  const getFilteredAndSortedUsers = (users: User[]) => {
    let filtered = users

    // Filter by year if selected
    if (selectedCohort) {
      filtered = filtered.filter(
        (user) => (user.academic_cohort || 'unassigned') === selectedCohort
      )
    }

    if (selectedYear === 'unknown') {
      const knownYears = getCohortYearFilterOptions(filter)
      filtered = filtered.filter((user) => {
        const key = learnerYearKey(user)
        return key === 'unknown' || !knownYears.includes(key)
      })
    } else if (selectedYear) {
      filtered = filtered.filter((user) => learnerYearKey(user) === selectedYear)
    }

    // Sort users
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'name':
          aValue = (a.name || '').toLowerCase()
          bValue = (b.name || '').toLowerCase()
          break
        case 'email':
          aValue = (a.email || '').toLowerCase()
          bValue = (b.email || '').toLowerCase()
          break
        case 'year':
          aValue = a.foundation_year || a.study_year || ''
          bValue = b.foundation_year || b.study_year || ''
          break
        case 'status':
          aValue = a.email_verified ? 1 : 0
          bValue = b.email_verified ? 1 : 0
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }

  const filteredAruUsers = filter === 'all' || filter === 'aru' ? getFilteredAndSortedUsers(data.aruUsers) : []
  const filteredUclUsers = filter === 'all' || filter === 'ucl' ? getFilteredAndSortedUsers(data.uclUsers) : []
  const filteredFyUsers = filter === 'all' || filter === 'fy' ? getFilteredAndSortedUsers(data.fyUsers || []) : []
  const filteredOtherUsers = filter === 'all' || filter === 'other' ? getFilteredAndSortedUsers(data.otherUsers || []) : []
  const showOtherTable =
    filteredOtherUsers.length > 0 &&
    (filter === 'other' || (filter === 'all' && selectedYear === null))
  const hasTableRows =
    filteredAruUsers.length +
      filteredUclUsers.length +
      filteredFyUsers.length +
      (showOtherTable ? filteredOtherUsers.length : 0) >
    0

  const scopedAru = usersInSelectedCohort(data.aruUsers, selectedCohort)
  const scopedUcl = usersInSelectedCohort(data.uclUsers, selectedCohort)
  const scopedFy = usersInSelectedCohort(data.fyUsers || [], selectedCohort)
  const scopedOther = usersInSelectedCohort(data.otherUsers || [], selectedCohort)
  const scopedTotal = scopedAru.length + scopedUcl.length + scopedFy.length + scopedOther.length
  const scopedActive = [...scopedAru, ...scopedUcl, ...scopedFy, ...scopedOther].filter(
    (user) => (user.academic_status || 'active') === 'active'
  ).length
  const fyYearCounts = {
    FY1: scopedFy.filter((user) => learnerYearKey(user) === 'FY1').length,
    FY2: scopedFy.filter((user) => learnerYearKey(user) === 'FY2').length,
    unknown: scopedFy.filter((user) => {
      const key = learnerYearKey(user)
      return key !== 'FY1' && key !== 'FY2'
    }).length,
  }
  const fyUnassigned = fyYearCounts.unknown || 0
  const knownYearKeys = getCohortYearFilterOptions(filter)
  const usersForYearCounts = (
    filter === 'aru'
      ? scopedAru
      : filter === 'ucl'
        ? scopedUcl
        : filter === 'fy'
          ? scopedFy
          : [...scopedAru, ...scopedUcl, ...scopedFy]
  )
  const yearChipCount = (year: string) =>
    usersForYearCounts.filter((user) => {
      const key = learnerYearKey(user)
      if (year === 'unknown') return key === 'unknown' || !knownYearKeys.includes(key)
      return key === year
    }).length
  const yearFilterOptions = [...knownYearKeys, 'unknown']
  const yearChartData = prepareYearData()
  const showFyBar = yearChartData.some((row) => row.FY > 0) || filter === 'fy'
  const cohortChipLabels = Array.from(
    new Set([
      ...(data.cohorts || []).map((c) => c.label),
      ...Object.keys(data.stats.byCohort || {}),
    ])
  ).sort((a, b) => {
    if (a === 'unassigned') return 1
    if (b === 'unassigned') return -1
    return a.localeCompare(b)
  })
  const currentCohortLabel =
    data.cohorts?.find((c) => c.is_current)?.label || calendarCohortLabel()
  const viewingCohortLabel =
    selectedCohort === null ? 'All cohorts' : selectedCohort === 'unassigned' ? 'Unassigned' : selectedCohort
  const viewingIsCurrent = selectedCohort === currentCohortLabel

  const handleSort = (field: 'name' | 'email' | 'year' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleReset = () => {
    setFilter('all')
    setSelectedYear(null)
    setSortField('name')
    setSortDirection('asc')
  }


  return (
    <DashboardLayoutClient role={layoutRole} userName={session?.user?.name as string | undefined}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <Users className="h-6 w-6 text-blue-600" />
              <span>Student Cohorts</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Graduated learners stay visible in their academic year. Intercalated accounts are hidden.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center" data-tour="cohorts-switcher">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Viewing cohort</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-xl font-bold text-slate-900 dark:text-white">{viewingCohortLabel}</span>
                {viewingIsCurrent ? (
                  <Badge className="bg-teal-700 text-white">Current</Badge>
                ) : null}
                <span className="text-sm text-slate-500">
                  {scopedTotal} learner{scopedTotal === 1 ? '' : 's'}
                  {selectedCohort ? ` · ${scopedActive} active` : ''}
                </span>
              </div>
            </div>
            <Popover open={cohortMenuOpen} onOpenChange={setCohortMenuOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-11 shrink-0">
                  Switch cohort
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-1">
                <button
                  type="button"
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                    selectedCohort === null
                      ? 'bg-teal-50 font-medium text-teal-800 dark:bg-teal-950 dark:text-teal-100'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  onClick={() => {
                    setSelectedCohort(null)
                    setCohortMenuOpen(false)
                  }}
                >
                  <span>All cohorts</span>
                  <span className="text-slate-500">{data.stats.total}</span>
                </button>
                {cohortChipLabels.map((label) => {
                  const count = data.stats.byCohort?.[label] || 0
                  const isCurrent = label === currentCohortLabel
                  return (
                    <button
                      key={label}
                      type="button"
                      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                        selectedCohort === label
                          ? 'bg-teal-50 font-medium text-teal-800 dark:bg-teal-950 dark:text-teal-100'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                      onClick={() => {
                        setSelectedCohort(label)
                        setCohortMenuOpen(false)
                      }}
                    >
                      <span>
                        {label === 'unassigned' ? 'Unassigned' : label}
                        {isCurrent ? ' · current' : ''}
                      </span>
                      <span className="text-slate-500">{count}</span>
                    </button>
                  )
                })}
              </PopoverContent>
            </Popover>
            <StudentCohortsTourButton />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="space-y-4" data-tour="cohorts-filters">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">University:</span>
              <div className="flex flex-wrap gap-2 flex-1 min-w-0">
                <Button
                  size="sm"
                  className={`flex-shrink-0 text-sm sm:text-base sm:h-10 sm:px-4 ${filter === 'all' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-400'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-2 border-slate-500'
                  }`}
                  onClick={() => {
                    setFilter('all')
                    setSelectedYear(null)
                  }}
                >
                  All ({scopedTotal})
                </Button>
                <Button
                  size="sm"
                  className={`flex-shrink-0 text-sm sm:text-base sm:h-10 sm:px-4 ${filter === 'aru'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-purple-100 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-purple-400'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-2 border-slate-500'
                  }`}
                  onClick={() => {
                    setFilter('aru')
                    setSelectedYear((prev) =>
                      prev && ARU_STUDY_YEARS.includes(prev as (typeof ARU_STUDY_YEARS)[number])
                        ? prev
                        : null
                    )
                  }}
                >
                  ARU ({scopedAru.length})
                </Button>
                <Button
                  size="sm"
                  className={`flex-shrink-0 text-sm sm:text-base sm:h-10 sm:px-4 ${filter === 'ucl'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-cyan-400'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-2 border-slate-500'
                  }`}
                  onClick={() => {
                    setFilter('ucl')
                    setSelectedYear((prev) =>
                      prev && UCL_STUDY_YEARS.includes(prev as (typeof UCL_STUDY_YEARS)[number])
                        ? prev
                        : null
                    )
                  }}
                >
                  UCL ({scopedUcl.length})
                </Button>
                <Button
                  size="sm"
                  className={`flex-shrink-0 text-sm sm:text-base sm:h-10 sm:px-4 ${filter === 'fy'
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-teal-50 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-teal-400'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-2 border-slate-500'
                  }`}
                  onClick={() => {
                    setFilter('fy')
                    setSelectedYear((prev) =>
                      prev && FOUNDATION_YEARS.includes(prev as (typeof FOUNDATION_YEARS)[number])
                        ? prev
                        : null
                    )
                  }}
                >
                  FY ({scopedFy.length})
                </Button>
                {scopedOther.length > 0 && (
                  <Button
                    size="sm"
                    className={`flex-shrink-0 text-sm sm:text-base sm:h-10 sm:px-4 ${filter === 'other'
                      ? 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-slate-100 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-slate-400'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-2 border-slate-500'
                    }`}
                    onClick={() => {
                      setFilter('other')
                      setSelectedYear(null)
                    }}
                  >
                    Other ({scopedOther.length})
                  </Button>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-400/50 hover:border-amber-400 flex-shrink-0 w-full sm:w-auto text-sm sm:text-base sm:h-10 sm:px-4"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
          </div>

          {filter !== 'other' && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap flex-shrink-0">Year:</span>
            <div className="flex flex-wrap gap-2 flex-1 min-w-0">
              <Button
                size="sm"
                className={`flex-shrink-0 ${selectedYear === null
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-emerald-50 shadow-md hover:shadow-lg transition-all duration-300 border border-emerald-400'
                  : 'bg-slate-600 hover:bg-slate-500 text-slate-300 border border-slate-500'
                }`}
                onClick={() => setSelectedYear(null)}
              >
                All Years
              </Button>
              {yearFilterOptions
                .filter((year) => yearChipCount(year) > 0 || selectedYear === year)
                .map((year) => (
                <Button
                  key={year}
                  size="sm"
                  className={`flex-shrink-0 ${selectedYear === year
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-emerald-50 shadow-md hover:shadow-lg transition-all duration-300 border border-emerald-400'
                    : 'bg-slate-600 hover:bg-slate-500 text-slate-300 border border-slate-500'
                  }`}
                  onClick={() => setSelectedYear(year)}
                >
                  {formatYearChipLabel(year)} ({yearChipCount(year)})
                </Button>
              ))}
            </div>
          </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total in this cohort
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scopedTotal}</div>
              <p className="text-xs text-gray-500 mt-1">
                {scopedActive} active · {scopedTotal - scopedActive} graduated
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                ARU Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{scopedAru.length}</div>
              <p className="text-xs text-gray-500 mt-1">
                {scopedTotal ? ((scopedAru.length / scopedTotal) * 100).toFixed(1) : '0.0'}% of cohort
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                UCL Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{scopedUcl.length}</div>
              <p className="text-xs text-gray-500 mt-1">
                {scopedTotal ? ((scopedUcl.length / scopedTotal) * 100).toFixed(1) : '0.0'}% of cohort
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Foundation Year
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-700">{scopedFy.length}</div>
              <p className="text-xs text-gray-500 mt-1">
                FY1 {fyYearCounts.FY1 || 0} · FY2 {fyYearCounts.FY2 || 0}
                {fyUnassigned > 0 ? ` · Unassigned ${fyUnassigned}` : ''}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <Card data-tour="cohorts-distribution-university">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Distribution by University
              </CardTitle>
              <CardDescription>Total student distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-hidden">
                <ResponsiveContainer width="100%" height={300} className="overflow-visible">
                  <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <Pie
                      data={preparePieData()}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => {
                        const value = (percent * 100).toFixed(0)
                        return `${name}: ${value}%`
                      }}
                      outerRadius={windowWidth < 768 ? 65 : windowWidth < 1024 ? 85 : 90}
                      innerRadius={windowWidth < 768 ? 15 : 35}
                      paddingAngle={windowWidth < 768 ? 3 : 2}
                      fill="#8884d8"
                      dataKey="value"
                      style={{
                        fontSize: windowWidth < 768 ? '10px' : '12px',
                      }}
                    >
                      {preparePieData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [
                        `${value} (${scopedTotal ? ((value / scopedTotal) * 100).toFixed(1) : 0}%)`,
                        'Students'
                      ]}
                    />
                    <Legend 
                      wrapperStyle={{ 
                        paddingTop: windowWidth < 768 ? '20px' : '10px',
                        fontSize: windowWidth < 768 ? '11px' : '12px'
                      }}
                      iconType="circle"
                      verticalAlign="bottom"
                      height={windowWidth < 768 ? 60 : 36}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Bar Chart by Year */}
          <Card data-tour="cohorts-students-by-year">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Students by Year
              </CardTitle>
              <CardDescription>Undergraduate years and FY1 / FY2</CardDescription>
            </CardHeader>
            <CardContent>
              {yearChartData.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center text-sm text-gray-500">
                  No year data for this filter
                </div>
              ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {filter !== 'fy' && <Bar dataKey="ARU" fill={COLORS.aru} />}
                  {filter !== 'fy' && <Bar dataKey="UCL" fill={COLORS.ucl} />}
                  {showFyBar && <Bar dataKey="FY" fill={COLORS.fy} />}
                </BarChart>
              </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tables */}
        <div className="grid md:grid-cols-2 gap-6">
          {!hasTableRows && (
            <div className="md:col-span-2 rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No learners match these filters.
            </div>
          )}
          {/* ARU Table */}
          {(filter === 'all' || filter === 'aru') && filteredAruUsers.length > 0 && (
            <Card className="w-full max-w-full overflow-hidden" data-tour="cohorts-aru-table">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <GraduationCap className="h-5 w-5" />
                  ARU Students ({filteredAruUsers.length})
                </CardTitle>
                <CardDescription>Anglia Ruskin University</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative w-full overflow-auto" style={{ maxHeight: '600px' }}>
                  <table className="min-w-[600px] w-full text-sm">
                    <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none" onClick={() => handleSort('name')}>
                          <div className="flex items-center gap-2">
                            Name
                            {sortField === 'name' ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : (
                                <ArrowDown className="h-4 w-4" />
                              )
                            ) : (
                              <ArrowUpDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </th>
                        <th className="text-left p-4 font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none" onClick={() => handleSort('email')}>
                          <div className="flex items-center gap-2">
                            Email
                            {sortField === 'email' ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : (
                                <ArrowDown className="h-4 w-4" />
                              )
                            ) : (
                              <ArrowUpDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </th>
                        <th className="text-left p-4 font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none" onClick={() => handleSort('year')}>
                          <div className="flex items-center gap-2">
                            Year
                            {sortField === 'year' ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : (
                                <ArrowDown className="h-4 w-4" />
                              )
                            ) : (
                              <ArrowUpDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </th>
                        <th className="text-left p-4 font-medium text-gray-900 dark:text-gray-100">
                          Cohort
                        </th>
                        <th className="text-left p-4 font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none" onClick={() => handleSort('status')}>
                          <div className="flex items-center gap-2">
                            Status
                            {sortField === 'status' ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : (
                                <ArrowDown className="h-4 w-4" />
                              )
                            ) : (
                              <ArrowUpDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAruUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center text-gray-500 p-4">
                            No ARU students found
                          </td>
                        </tr>
                      ) : (
                        filteredAruUsers.map((user) => (
                          <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="font-medium p-4">{user.name || 'N/A'}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{user.email}</span>
                              </div>
                              {user.inferred && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  Inferred
                                </Badge>
                              )}
                            </td>
                            <td className="p-4">
                              {user.foundation_year || (user.study_year ? `Year ${user.study_year}` : 'N/A')}
                            </td>
                            <td className="p-4">
                              <CohortStatusBadges user={user} showCohortLabel={selectedCohort === null} />
                            </td>
                            <td className="p-4">
                              {user.email_verified ? (
                                <Badge className="bg-green-500">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Unverified
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* UCL Table */}
          {(filter === 'all' || filter === 'ucl') && filteredUclUsers.length > 0 && (
            <Card className="w-full max-w-full overflow-hidden" data-tour="cohorts-ucl-table">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <GraduationCap className="h-5 w-5" />
                  UCL Students ({filteredUclUsers.length})
                </CardTitle>
                <CardDescription>University College London</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative w-full overflow-auto" style={{ maxHeight: '600px' }}>
                  <table className="min-w-[600px] w-full text-sm">
                    <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none" onClick={() => handleSort('name')}>
                          <div className="flex items-center gap-2">
                            Name
                            {sortField === 'name' ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : (
                                <ArrowDown className="h-4 w-4" />
                              )
                            ) : (
                              <ArrowUpDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </th>
                        <th className="text-left p-4 font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none" onClick={() => handleSort('email')}>
                          <div className="flex items-center gap-2">
                            Email
                            {sortField === 'email' ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : (
                                <ArrowDown className="h-4 w-4" />
                              )
                            ) : (
                              <ArrowUpDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </th>
                        <th className="text-left p-4 font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none" onClick={() => handleSort('year')}>
                          <div className="flex items-center gap-2">
                            Year
                            {sortField === 'year' ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : (
                                <ArrowDown className="h-4 w-4" />
                              )
                            ) : (
                              <ArrowUpDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </th>
                        <th className="text-left p-4 font-medium text-gray-900 dark:text-gray-100">
                          Cohort
                        </th>
                        <th className="text-left p-4 font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none" onClick={() => handleSort('status')}>
                          <div className="flex items-center gap-2">
                            Status
                            {sortField === 'status' ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : (
                                <ArrowDown className="h-4 w-4" />
                              )
                            ) : (
                              <ArrowUpDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUclUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center text-gray-500 p-4">
                            No UCL students found
                          </td>
                        </tr>
                      ) : (
                        filteredUclUsers.map((user) => (
                          <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="font-medium p-4">{user.name || 'N/A'}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{user.email}</span>
                              </div>
                              {user.inferred && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  Inferred
                                </Badge>
                              )}
                            </td>
                            <td className="p-4">
                              {user.foundation_year || (user.study_year ? `Year ${user.study_year}` : 'N/A')}
                            </td>
                            <td className="p-4">
                              <CohortStatusBadges user={user} showCohortLabel={selectedCohort === null} />
                            </td>
                            <td className="p-4">
                              {user.email_verified ? (
                                <Badge className="bg-green-500">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Unverified
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {(filter === 'all' || filter === 'fy') && filteredFyUsers.length > 0 && (
            <Card className="w-full max-w-full overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-teal-700">
                  <GraduationCap className="h-5 w-5" />
                  Foundation Year ({filteredFyUsers.length})
                </CardTitle>
                <CardDescription>FY1 and FY2 doctors</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative w-full overflow-auto" style={{ maxHeight: '600px' }}>
                  <table className="min-w-[600px] w-full text-sm">
                    <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium">Name</th>
                        <th className="text-left p-4 font-medium">Email</th>
                        <th className="text-left p-4 font-medium">Year</th>
                        <th className="text-left p-4 font-medium">Cohort</th>
                        <th className="text-left p-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFyUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center text-gray-500 p-4">
                            No foundation year doctors found
                          </td>
                        </tr>
                      ) : (
                        filteredFyUsers.map((user) => (
                          <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="font-medium p-4">{user.name || 'N/A'}</td>
                            <td className="p-4 text-sm">{user.email}</td>
                            <td className="p-4">{user.foundation_year || user.study_year || 'Unassigned'}</td>
                            <td className="p-4">
                              <CohortStatusBadges user={user} showCohortLabel={selectedCohort === null} />
                            </td>
                            <td className="p-4">
                              {user.email_verified ? (
                                <Badge className="bg-green-500">Verified</Badge>
                              ) : (
                                <Badge variant="outline">Unverified</Badge>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {showOtherTable && (
            <Card className="w-full max-w-full overflow-hidden md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-700">
                  <Users className="h-5 w-5" />
                  Other ({filteredOtherUsers.length})
                </CardTitle>
                <CardDescription>Learners who have not picked ARU, UCL, or Foundation Year</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative w-full overflow-auto" style={{ maxHeight: '600px' }}>
                  <table className="min-w-[600px] w-full text-sm">
                    <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium">Name</th>
                        <th className="text-left p-4 font-medium">Email</th>
                        <th className="text-left p-4 font-medium">Year</th>
                        <th className="text-left p-4 font-medium">Cohort</th>
                        <th className="text-left p-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOtherUsers.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="font-medium p-4">{user.name || 'N/A'}</td>
                          <td className="p-4 text-sm">{user.email}</td>
                          <td className="p-4">
                            {user.foundation_year || (user.study_year ? `Year ${user.study_year}` : 'Unassigned')}
                          </td>
                          <td className="p-4">
                            <CohortStatusBadges user={user} showCohortLabel={selectedCohort === null} />
                          </td>
                          <td className="p-4">
                            {user.email_verified ? (
                              <Badge className="bg-green-500">Verified</Badge>
                            ) : (
                              <Badge variant="outline">Unverified</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayoutClient>
  )
}

