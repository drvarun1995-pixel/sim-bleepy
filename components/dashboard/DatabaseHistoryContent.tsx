'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle, XCircle, Calendar, User, Stethoscope, ArrowRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ConsultationDetailModal } from './ConsultationDetailModal'

interface ConsultationHistory {
  id: string
  stationName: string
  date: string
  duration: number
  score: number
  maxScore: number
  status: 'PASS' | 'FAIL' | 'INCOMPLETE'
  totalMessages: number
  scores?: {
    totalScore: number
    maxScore: number
    status: string
    domainScores?: {
      dataGathering?: number
      clinicalManagement?: number
      interpersonalSkills?: number
    }
    examinerNotes?: string
    strengths?: string[]
    areasForImprovement?: string[]
    nextSteps?: string[]
    detailedAnalysis?: {
      communication: string
      clinicalReasoning: string
      patientSafety: string
      professionalism: string
    }
    diagnosisEvaluation?: {
      correctDiagnosis: string
      doctorDiagnosis: string
      diagnosisCorrect: boolean
      diagnosisReasoning: string
    }
  }
}

export function DatabaseHistoryContent() {
  const [consultationHistory, setConsultationHistory] = useState<ConsultationHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [displayedCount, setDisplayedCount] = useState(5)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)
        // Add cache-busting parameter to ensure fresh data
        const timestamp = new Date().getTime()
        const response = await fetch(`/api/user/stats?t=${timestamp}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        
        // Convert the recent activity data to consultation history format
        // Handle null/undefined data gracefully
        const recentActivity = data.stats?.recentActivity || []
        console.log('📊 Progress data received:', {
          totalStats: data.stats,
          recentActivityCount: recentActivity.length,
          recentActivity: recentActivity
        })
        
        const history = recentActivity.map((activity: any) => ({
          id: activity.id || 'unknown',
          stationName: activity.stationName || 'Unknown Station',
          date: activity.date || new Date().toISOString(),
          duration: activity.duration || 0, // Ensure duration is a number
          score: activity.score || 0,
          maxScore: activity.maxScore || 12,
          status: activity.status || 'INCOMPLETE',
          totalMessages: 0, // We don't have message count in the current API
          scores: activity.scores || {} // Include detailed scores if available
        }))
        
        console.log('📋 Formatted history:', history)
        
        // If no data from API, try to get data from localStorage as fallback
        if (history.length === 0) {
          console.log('🔄 No API data found, checking localStorage...')
          try {
            const storedHistory = localStorage.getItem('consultationHistory')
            if (storedHistory) {
              const localHistory = JSON.parse(storedHistory)
              console.log('📱 Found localStorage data:', localHistory.length, 'items')
              // Convert localStorage format to our format
              const convertedHistory = localHistory.map((item: any) => ({
                id: item.id || Date.now().toString(),
                stationName: item.stationName || 'Unknown Station',
                date: item.date || new Date().toISOString(),
                duration: item.duration * 60 || 0, // Convert minutes to seconds
                score: item.score || 0,
                maxScore: item.maxScore || 12,
                status: item.status || 'INCOMPLETE',
                totalMessages: item.totalMessages || 0,
                scores: item.scores || item // Use the full item as scores if no scores property
              }))
              setConsultationHistory(convertedHistory)
              console.log('✅ Using localStorage data as fallback')
              return
            }
          } catch (localError) {
            console.error('❌ Error reading localStorage:', localError)
          }
        }
        
        setConsultationHistory(history)
      } catch (err) {
        setError('Failed to load consultation history.')
        console.error('Error fetching consultation history:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [refreshKey])

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy, h:mm a')
    } catch (error) {
      return dateString
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'FAIL':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'text-green-600'
      case 'FAIL':
        return 'text-red-600'
      default:
        return 'text-yellow-600'
    }
  }

  const handleLoadMore = () => {
    setLoadingMore(true)
    // Simulate loading delay for better UX
    setTimeout(() => {
      setDisplayedCount(prev => Math.min(prev + 10, 30))
      setLoadingMore(false)
    }, 500)
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    setDisplayedCount(5) // Reset to show first 5 items
  }

  const displayedConsultations = consultationHistory.slice(0, displayedCount)
  const hasMoreConsultations = consultationHistory.length > displayedCount
  const canLoadMore = displayedCount < 30

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading consultation history...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Progress</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Review your past clinical practice sessions and track your progress.
        </p>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm" 
          className="mt-4"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultationHistory.length}</div>
            <p className="text-xs text-muted-foreground">All consultations (max 30)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {consultationHistory.filter(h => h.status === 'PASS').length}
            </div>
            <p className="text-xs text-muted-foreground">Successful attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {consultationHistory.filter(h => h.status === 'FAIL').length}
            </div>
            <p className="text-xs text-muted-foreground">Failed attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const validDurations = consultationHistory.filter(h => h.duration > 0)
                return validDurations.length > 0 
                  ? formatDuration(Math.round(validDurations.reduce((sum, h) => sum + h.duration, 0) / validDurations.length))
                  : '0s'
              })()}
            </div>
            <p className="text-xs text-muted-foreground">Average session time</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Consultations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Consultations</CardTitle>
        </CardHeader>
        <CardContent>
          {consultationHistory.length === 0 ? (
            <div className="text-center py-8">
              <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No consultations yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start your first clinical consultation to see your progress here.
              </p>
              <Link href="/dashboard">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Start Clinical Station
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedConsultations.map((consultation) => (
                <ConsultationDetailModal key={consultation.id} consultation={consultation}>
                  <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-2xl hover:shadow-purple-100/50 dark:hover:shadow-purple-900/20 transition-all duration-300 cursor-pointer">
                    {/* Animated gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-blue-50/30 to-indigo-50/50 dark:from-purple-900/10 dark:via-blue-900/5 dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="relative p-4 sm:p-6">
                      {/* Mobile Layout */}
                      <div className="flex flex-col space-y-4 sm:hidden">
                        {/* Header with icon and title */}
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                              <Stethoscope className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                              {consultation.stationName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                                <Calendar className="h-3 w-3 text-purple-500" />
                                <span className="text-xs font-medium">{formatDate(consultation.date)}</span>
                              </div>
                              <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                                <Clock className="h-3 w-3 text-blue-500" />
                                <span className="text-xs font-medium">{formatDuration(consultation.duration)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Score and Status Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-center">
                              <div className="text-2xl font-black text-gray-900 dark:text-white">
                                {consultation.score}<span className="text-sm text-gray-500">/{consultation.maxScore}</span>
                              </div>
                              <div className="text-xs text-gray-500 font-medium">SCORE</div>
                            </div>
                            <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                              consultation.status === 'PASS' 
                                ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' 
                                : consultation.status === 'FAIL'
                                ? 'bg-gradient-to-r from-red-400 to-rose-500 text-white'
                                : 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white'
                            }`}>
                              {getStatusIcon(consultation.status)}
                              <span className="ml-1">{consultation.status}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 text-purple-600 dark:text-purple-400">
                            <span className="text-xs font-semibold">View Details</span>
                            <ArrowRight className="h-3 w-3" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Desktop Layout */}
                      <div className="hidden sm:flex items-start justify-between">
                        {/* Left Content */}
                        <div className="flex items-start space-x-4 flex-1 min-w-0">
                          {/* Enhanced Icon */}
                          <div className="flex-shrink-0">
                            <div className="relative">
                              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                                <Stethoscope className="h-7 w-7 text-white" />
                              </div>
                              {/* Glow effect */}
                              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-3">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-300">
                                {consultation.stationName}
                              </h3>
                              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
                                  <Calendar className="h-4 w-4 text-purple-500" />
                                  <span className="font-medium">{formatDate(consultation.date)}</span>
                                </div>
                                <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
                                  <Clock className="h-4 w-4 text-blue-500" />
                                  <span className="font-medium">{formatDuration(consultation.duration)}</span>
                                </div>
                                {consultation.totalMessages > 0 && (
                                  <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
                                    <User className="h-4 w-4 text-green-500" />
                                    <span className="font-medium">{consultation.totalMessages} messages</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Right Content - Score & Status */}
                        <div className="flex items-center space-x-6 flex-shrink-0">
                          {/* Score Display */}
                          <div className="text-center">
                            <div className="text-3xl font-black text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                              {consultation.score}
                              <span className="text-lg text-gray-500">/{consultation.maxScore}</span>
                            </div>
                            <div className="text-xs text-gray-500 font-medium">SCORE</div>
                          </div>
                          
                          {/* Status Badge */}
                          <div className="flex flex-col items-center space-y-2">
                            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
                              consultation.status === 'PASS' 
                                ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-green-200' 
                                : consultation.status === 'FAIL'
                                ? 'bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-red-200'
                                : 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-yellow-200'
                            }`}>
                              {getStatusIcon(consultation.status)}
                              <span className="ml-2">{consultation.status}</span>
                            </div>
                            
                            {/* View Details Button */}
                            <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-300">
                              <span className="text-sm font-semibold">View Details</span>
                              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ConsultationDetailModal>
              ))}
              
              {/* Load More Button */}
              {hasMoreConsultations && canLoadMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    variant="outline"
                    className="min-w-[120px]"
                  >
                    {loadingMore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Loading...
                      </>
                    ) : (
                      `Load ${Math.min(10, 30 - displayedCount)} More`
                    )}
                  </Button>
                </div>
              )}
              
              {/* Show total count */}
              <div className="text-center text-sm text-gray-500 pt-2">
                Showing {displayedConsultations.length} of {consultationHistory.length} consultations
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

