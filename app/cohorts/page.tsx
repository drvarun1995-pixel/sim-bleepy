'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, GraduationCap, BarChart3, Mail, CheckCircle, XCircle, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Legend, Tooltip, CartesianGrid } from 'recharts'
import { StudentCohortsTourButton } from './StudentCohortsTourButton'

interface User {
  id: string
  email: string
  name: string
  university: string | null
  study_year: string | null
  role_type: string | null
  created_at: string
  email_verified: boolean
  inferred?: boolean
}

interface CohortData {
  stats: {
    total: number
    aru: number
    ucl: number
    other: number
    verified: number
    byYear: {
      aru: Record<string, number>
      ucl: Record<string, number>
    }
  }
  aruUsers: User[]
  uclUsers: User[]
  otherUsers: User[]
}

type FilterType = 'all' | 'aru' | 'ucl'

const COLORS = {
  aru: '#8B5CF6', // Purple
  ucl: '#3B82F6', // Blue
  other: '#6B7280' // Gray
}

export default function CohortsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [data, setData] = useState<CohortData | null>(null)
  const [loading, setLoading] = useState(true)
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const [filter, setFilter] = useState<FilterType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cohorts-filter')
      return (saved as FilterType) || 'all'
    }
    return 'all'
  })
  const [selectedYear, setSelectedYear] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cohorts-year')
    }
    return null
  })
  const [sortField, setSortField] = useState<'name' | 'email' | 'year' | 'status'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cohorts-sortField')
      return (saved as 'name' | 'email' | 'year' | 'status') || 'name'
    }
    return 'name'
  })
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cohorts-sortDirection')
      return (saved as 'asc' | 'desc') || 'asc'
    }
    return 'asc'
  })

  // Save to localStorage when filter changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cohorts-filter', filter)
    }
  }, [filter])

  // Save to localStorage when year changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedYear) {
        localStorage.setItem('cohorts-year', selectedYear)
      } else {
        localStorage.removeItem('cohorts-year')
      }
    }
  }, [selectedYear])

  // Save to localStorage when sort changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cohorts-sortField', sortField)
      localStorage.setItem('cohorts-sortDirection', sortDirection)
    }
  }, [sortField, sortDirection])

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
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    checkAccess()
  }, [session, status, router])

  const checkAccess = async () => {
    try {
      const response = await fetch('/api/user/role')
      if (response.ok) {
        const { role } = await response.json()
        if (!['ctf', 'admin', 'meded_team'].includes(role)) {
          router.push('/dashboard')
          return
        }
        fetchCohorts()
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Failed to check access:', error)
      router.push('/dashboard')
    }
  }

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
    return [
      { name: 'ARU', value: data.stats.aru, color: COLORS.aru },
      { name: 'UCL', value: data.stats.ucl, color: COLORS.ucl },
      { name: 'Other', value: data.stats.other, color: COLORS.other },
    ]
  }

  const prepareYearData = () => {
    if (!data) return []
    const years = ['1', '2', '3', '4', '5', '6']
    return years.map(year => ({
      year: `Year ${year}`,
      ARU: data.stats.byYear.aru[year] || 0,
      UCL: data.stats.byYear.ucl[year] || 0,
    })).filter(item => item.ARU > 0 || item.UCL > 0)
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayoutClient role="admin" userName={undefined}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600 dark:text-gray-400">Loading cohorts...</p>
        </div>
      </DashboardLayoutClient>
    )
  }

  if (!data) {
    return (
      <DashboardLayoutClient role="admin" userName={session?.user?.name as string | undefined}>
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
    if (selectedYear) {
      filtered = filtered.filter(user => user.study_year === selectedYear)
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
          aValue = a.study_year || ''
          bValue = b.study_year || ''
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
    <DashboardLayoutClient role="admin" userName={session?.user?.name as string | undefined}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <Users className="h-6 w-6 text-blue-600" />
              <span>Student Cohorts</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View and manage students by medical school
            </p>
          </div>
          <StudentCohortsTourButton />
        </div>

        {/* Filter Buttons */}
        <div className="space-y-4" data-tour="cohorts-filters">
          {/* University Filters - Top Section */}
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
                  All ({data.stats.total})
                </Button>
                <Button
                  size="sm"
                  className={`flex-shrink-0 text-sm sm:text-base sm:h-10 sm:px-4 ${filter === 'aru'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-purple-100 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-purple-400'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-2 border-slate-500'
                  }`}
                  onClick={() => {
                    setFilter('aru')
                    setSelectedYear(null)
                  }}
                >
                  ARU ({data.stats.aru})
                </Button>
                <Button
                  size="sm"
                  className={`flex-shrink-0 text-sm sm:text-base sm:h-10 sm:px-4 ${filter === 'ucl'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-cyan-400'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-2 border-slate-500'
                  }`}
                  onClick={() => {
                    setFilter('ucl')
                    setSelectedYear(null)
                  }}
                >
                  UCL ({data.stats.ucl})
                </Button>
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

          {/* Year Filters - Bottom Section */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap flex-shrink-0">Study Year:</span>
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
              {['1', '2', '3', '4', '5', '6'].map((year) => (
                <Button
                  key={year}
                  size="sm"
                  className={`flex-shrink-0 ${selectedYear === year
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-emerald-50 shadow-md hover:shadow-lg transition-all duration-300 border border-emerald-400'
                    : 'bg-slate-600 hover:bg-slate-500 text-slate-300 border border-slate-500'
                  }`}
                  onClick={() => setSelectedYear(year)}
                >
                  Year {year}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                ARU Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{data.stats.aru}</div>
              <p className="text-xs text-gray-500 mt-1">
                {((data.stats.aru / data.stats.total) * 100).toFixed(1)}% of total
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
              <div className="text-2xl font-bold text-blue-600">{data.stats.ucl}</div>
              <p className="text-xs text-gray-500 mt-1">
                {((data.stats.ucl / data.stats.total) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Verified Emails
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{data.stats.verified}</div>
              <p className="text-xs text-gray-500 mt-1">
                {((data.stats.verified / data.stats.total) * 100).toFixed(1)}% verified
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
                        `${value} (${data ? ((value / data.stats.total) * 100).toFixed(1) : 0}%)`,
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
              <CardDescription>Breakdown by study year</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={prepareYearData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="ARU" fill={COLORS.aru} />
                  <Bar dataKey="UCL" fill={COLORS.ucl} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tables */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* ARU Table */}
          {(filter === 'all' || filter === 'aru') && (
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
                          <td colSpan={4} className="text-center text-gray-500 p-4">
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
                              {user.study_year ? `Year ${user.study_year}` : 'N/A'}
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
          {(filter === 'all' || filter === 'ucl') && (
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
                          <td colSpan={4} className="text-center text-gray-500 p-4">
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
                              {user.study_year ? `Year ${user.study_year}` : 'N/A'}
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
        </div>
      </div>
    </DashboardLayoutClient>
  )
}

