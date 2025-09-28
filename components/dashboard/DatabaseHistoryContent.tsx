'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle, XCircle, Calendar, User, Stethoscope, ArrowRight } from 'lucide-react'
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
    domainScores: {
      dataGathering: number
      clinicalManagement: number
      interpersonalSkills: number
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

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/user/stats')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        
        // Convert the recent activity data to consultation history format
        // Handle null/undefined data gracefully
        const recentActivity = data.stats?.recentActivity || []
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
        
        setConsultationHistory(history)
      } catch (err) {
        setError('Failed to load consultation history.')
        console.error('Error fetching consultation history:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer gap-4">
                    <div className="flex items-start sm:items-center space-x-4 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <Stethoscope className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                          {consultation.stationName}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{formatDate(consultation.date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <span>{formatDuration(consultation.duration)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4 flex-shrink-0" />
                            <span>{consultation.totalMessages} messages</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end space-x-4 flex-shrink-0">
                      <div className="text-left sm:text-right">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {consultation.score}/{consultation.maxScore}
                        </div>
                        <div className={`text-sm font-medium ${getStatusColor(consultation.status)}`}>
                          {consultation.status}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(consultation.status)}
                        <ArrowRight className="h-4 w-4 text-gray-400" />
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
