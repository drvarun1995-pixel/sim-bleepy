'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, User, Calendar, Clock as ClockIcon, Target, FileText, Star } from 'lucide-react'
import { format } from 'date-fns'

interface ConsultationDetail {
  id: string
  stationName: string
  date: string
  duration: number
  score: number
  maxScore: number
  status: 'PASS' | 'FAIL' | 'INCOMPLETE'
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

interface ConsultationDetailModalProps {
  consultation: ConsultationDetail
  children: React.ReactNode
}

export function ConsultationDetailModal({ consultation, children }: ConsultationDetailModalProps) {
  const [open, setOpen] = useState(false)

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
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'FAIL':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'FAIL':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              {getStatusIcon(consultation.status)}
              <span className="text-base sm:text-lg">{consultation.stationName}</span>
            </div>
            <Badge className={`${getStatusColor(consultation.status)} text-xs sm:text-sm`}>
              {consultation.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Session Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                Session Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-blue-600">
                    {consultation.score}/{consultation.maxScore}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">Score</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-purple-600">
                    {formatDuration(consultation.duration)}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">Duration</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-green-600">
                    {Math.round((consultation.score / consultation.maxScore) * 100)}%
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">Percentage</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm sm:text-lg font-bold text-orange-600 break-words">
                    {formatDate(consultation.date)}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">Date</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Scoring */}
          {consultation.scores && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                  Detailed Scoring
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                {/* Domain Scores */}
                <div>
                  <h4 className="text-sm sm:text-base font-semibold mb-3">Domain Scores</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg">
                      <div className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-200">Data Gathering</div>
                      <div className="text-lg sm:text-2xl font-bold text-blue-600">
                        {consultation.scores.domainScores.dataGathering}/4
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg">
                      <div className="text-xs sm:text-sm font-medium text-green-800 dark:text-green-200">Clinical Management</div>
                      <div className="text-lg sm:text-2xl font-bold text-green-600">
                        {consultation.scores.domainScores.clinicalManagement}/4
                      </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 sm:p-4 rounded-lg">
                      <div className="text-xs sm:text-sm font-medium text-purple-800 dark:text-purple-200">Interpersonal Skills</div>
                      <div className="text-lg sm:text-2xl font-bold text-purple-600">
                        {consultation.scores.domainScores.interpersonalSkills}/4
                      </div>
                    </div>
                  </div>
                </div>

                {/* Examiner Notes */}
                {consultation.scores.examinerNotes && (
                  <div>
                    <h4 className="font-semibold mb-2">Examiner Notes</h4>
                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      {consultation.scores.examinerNotes}
                    </p>
                  </div>
                )}

                {/* Strengths */}
                {consultation.scores.strengths && consultation.scores.strengths.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Star className="h-4 w-4 text-green-600" />
                      Strengths
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {consultation.scores.strengths.map((strength, index) => (
                        <li key={index} className="text-gray-700 dark:text-gray-300">
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Areas for Improvement */}
                {consultation.scores.areasForImprovement && consultation.scores.areasForImprovement.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Areas for Improvement</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {consultation.scores.areasForImprovement.map((area, index) => (
                        <li key={index} className="text-gray-700 dark:text-gray-300">
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next Steps */}
                {consultation.scores.nextSteps && consultation.scores.nextSteps.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Next Steps</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {consultation.scores.nextSteps.map((step, index) => (
                        <li key={index} className="text-gray-700 dark:text-gray-300">
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Detailed Analysis */}
                {consultation.scores.detailedAnalysis && (
                  <div>
                    <h4 className="font-semibold mb-3">Detailed Analysis</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg">
                        <h5 className="text-sm sm:text-base font-medium text-blue-800 dark:text-blue-200 mb-2">Communication</h5>
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                          {consultation.scores.detailedAnalysis.communication}
                        </p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg">
                        <h5 className="text-sm sm:text-base font-medium text-green-800 dark:text-green-200 mb-2">Clinical Reasoning</h5>
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                          {consultation.scores.detailedAnalysis.clinicalReasoning}
                        </p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 p-3 sm:p-4 rounded-lg">
                        <h5 className="text-sm sm:text-base font-medium text-red-800 dark:text-red-200 mb-2">Patient Safety</h5>
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                          {consultation.scores.detailedAnalysis.patientSafety}
                        </p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-3 sm:p-4 rounded-lg">
                        <h5 className="text-sm sm:text-base font-medium text-purple-800 dark:text-purple-200 mb-2">Professionalism</h5>
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                          {consultation.scores.detailedAnalysis.professionalism}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Diagnosis Evaluation */}
                {consultation.scores.diagnosisEvaluation && (
                  <div>
                    <h4 className="font-semibold mb-3">Diagnosis Evaluation</h4>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-lg space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                        <span className="text-sm sm:text-base font-medium">Correct Diagnosis:</span>
                        <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 break-words">
                          {consultation.scores.diagnosisEvaluation.correctDiagnosis}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                        <span className="text-sm sm:text-base font-medium">Your Diagnosis:</span>
                        <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 break-words">
                          {consultation.scores.diagnosisEvaluation.doctorDiagnosis}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                        <span className="text-sm sm:text-base font-medium">Diagnosis Correct:</span>
                        <Badge className={`text-xs ${consultation.scores.diagnosisEvaluation.diagnosisCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {consultation.scores.diagnosisEvaluation.diagnosisCorrect ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-sm sm:text-base font-medium">Reasoning:</span>
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-1">
                          {consultation.scores.diagnosisEvaluation.diagnosisReasoning}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Session Transcript */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                Session Transcript
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(consultation.scores as any)?.transcript && (consultation.scores as any).transcript.length > 0 ? (
                <div className="space-y-3">
                  {(consultation.scores as any).transcript
                    .filter((message: any, index: number, array: any[]) => {
                      // Remove duplicate messages based on content, role, and timestamp
                      return array.findIndex(m => 
                        m.content === message.content && 
                        m.role === message.role && 
                        Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 1000 // Within 1 second
                      ) === index;
                    })
                    .filter((message: any) => message.content && message.content.trim().length > 0) // Remove empty messages
                    .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) // Sort by timestamp
                    .map((message: any, index: number) => (
                    <div key={index} className={`p-3 sm:p-4 rounded-lg ${
                      message.role === 'doctor' 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
                        : 'bg-gray-50 dark:bg-gray-800 border-l-4 border-gray-400'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                        <span className={`text-xs sm:text-sm font-medium ${
                          message.role === 'doctor' ? 'text-blue-800 dark:text-blue-200' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {message.role === 'doctor' ? 'Doctor' : 'Patient'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 break-words">{message.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-gray-600 dark:text-gray-400 text-center">
                    Session transcript is not available for this consultation.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
