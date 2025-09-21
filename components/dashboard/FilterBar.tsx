'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, X } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/utils'

interface FilterBarProps {
  role: 'student' | 'educator' | 'admin'
  org?: string
}

interface FilterState {
  dateRange: {
    from: Date | undefined
    to?: Date | undefined
  }
  stations: string[]
  cohorts: string[]
  devices: string[]
  browsers: string[]
}

const datePresets = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'This year', value: '1y' },
]

export function FilterBar({ role, org }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { from: undefined, to: undefined },
    stations: [],
    cohorts: [],
    devices: [],
    browsers: [],
  })

  const [availableStations, setAvailableStations] = useState<Array<{ id: string; title: string }>>([])
  const [availableCohorts, setAvailableCohorts] = useState<Array<{ id: string; name: string }>>([])

  // Load available filter options
  useEffect(() => {
    // This would typically fetch from your API
    setAvailableStations([
      { id: '1', title: 'Cardiology Consultation' },
      { id: '2', title: 'Emergency Triage' },
      { id: '3', title: 'Pediatric Assessment' },
      { id: '4', title: 'Mental Health Interview' },
      { id: '5', title: 'Orthopedic Examination' },
    ])

    if (role === 'educator' || role === 'admin') {
      setAvailableCohorts([
        { id: '1', name: 'Year 3 Medical Students' },
        { id: '2', name: 'Nursing Cohort A' },
        { id: '3', name: 'PA Students 2024' },
      ])
    }
  }, [role])

  const applyDatePreset = (preset: string) => {
    const now = new Date()
    let from: Date

    switch (preset) {
      case '7d':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        return
    }

    setFilters(prev => ({
      ...prev,
      dateRange: { from, to: now }
    }))
  }

  const clearFilters = () => {
    setFilters({
      dateRange: { from: undefined, to: undefined },
      stations: [],
      cohorts: [],
      devices: [],
      browsers: [],
    })
  }

  const toggleStation = (stationId: string) => {
    setFilters(prev => ({
      ...prev,
      stations: prev.stations.includes(stationId)
        ? prev.stations.filter(id => id !== stationId)
        : [...prev.stations, stationId]
    }))
  }

  const toggleCohort = (cohortId: string) => {
    setFilters(prev => ({
      ...prev,
      cohorts: prev.cohorts.includes(cohortId)
        ? prev.cohorts.filter(id => id !== cohortId)
        : [...prev.cohorts, cohortId]
    }))
  }

  const activeFiltersCount = 
    filters.stations.length + 
    filters.cohorts.length + 
    (filters.dateRange.from ? 1 : 0)

  return (
    <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4">
        <div className="flex flex-col space-y-4">
          {/* Date Range and Presets */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Date Range:
              </span>
              <div className="flex space-x-2">
                {datePresets.map((preset) => (
                  <Button
                    key={preset.value}
                    variant="outline"
                    size="sm"
                    onClick={() => applyDatePreset(preset.value)}
                    className="text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !filters.dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.from ? (
                    filters.dateRange.to ? (
                      <>
                        {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                        {format(filters.dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(filters.dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={filters.dateRange.from}
                  selected={filters.dateRange}
                  onSelect={(range) => setFilters(prev => ({ ...prev, dateRange: range || { from: undefined, to: undefined } }))}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Station and Cohort Filters */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Stations */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Stations:
              </span>
              <div className="flex flex-wrap gap-2">
                {availableStations.map((station) => (
                  <Badge
                    key={station.id}
                    variant={filters.stations.includes(station.id) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                    onClick={() => toggleStation(station.id)}
                  >
                    {station.title}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Cohorts (for educators and admins) */}
            {(role === 'educator' || role === 'admin') && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cohorts:
                </span>
                <div className="flex flex-wrap gap-2">
                  {availableCohorts.map((cohort) => (
                    <Badge
                      key={cohort.id}
                      variant={filters.cohorts.includes(cohort.id) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                      onClick={() => toggleCohort(cohort.id)}
                    >
                      {cohort.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Filters Summary */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Active filters: {activeFiltersCount}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear all
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
