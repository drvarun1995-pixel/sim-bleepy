'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Trophy, RotateCcw, Home, CheckCircle2, XCircle, Clock, ChevronDown } from 'lucide-react'
import { PracticeAudioProvider, usePracticeMusic } from '@/components/quiz/PracticeAudioProvider'
import { PracticeMusicControls } from '@/components/quiz/PracticeMusicControls'

function PracticeResultsContent() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const router = useRouter()
  const { syncTrackFromServer } = usePracticeMusic()
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [questionsToShow, setQuestionsToShow] = useState(10) // Number of questions to display initially
  const QUESTIONS_PER_PAGE = 10

  const fetchResults = useCallback(async () => {
    if (!sessionId || typeof sessionId !== 'string') {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/quiz/practice/${sessionId}/complete`, {
        method: 'POST',
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.details || 'Failed to fetch results')
      }
      const data = await response.json()
      setResults(data)
      // Sync music track from session to continue playing
      if (data.session?.music_track_id) {
        syncTrackFromServer(data.session.music_track_id)
      }
    } catch (error: any) {
      console.error('Error fetching results:', error)
      // Don't set results to null on error, just log it
      // The API might have already completed the session
    } finally {
      setLoading(false)
    }
  }, [sessionId, syncTrackFromServer])

  // Handle loading more questions - MUST be defined before conditional returns
  const handleLoadMore = useCallback(() => {
    setQuestionsToShow(prev => {
      const previousCount = prev
      const newCount = prev + QUESTIONS_PER_PAGE
      
      // Scroll to the first newly loaded question after React updates the DOM
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        setTimeout(() => {
          const questionElements = document.querySelectorAll('[data-question-card]')
          if (questionElements.length > previousCount) {
            // Scroll to the first newly loaded question
            const targetElement = questionElements[previousCount] as HTMLElement
            if (targetElement) {
              targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }
        }, 50)
      })
      
      return newCount
    })
  }, [])

  // Helper function to get option text - MUST be defined before conditional returns
  const getOptionText = useCallback((question: any, optionLetter: string) => {
    if (!question || !optionLetter) return ''
    const optionMap: { [key: string]: string } = {
      'A': question.option_a || '',
      'B': question.option_b || '',
      'C': question.option_c || '',
      'D': question.option_d || '',
      'E': question.option_e || '',
    }
    return optionMap[optionLetter.toUpperCase()] || ''
  }, [])

  // Reset questions to show when sessionId changes (new results loaded)
  useEffect(() => {
    setQuestionsToShow(QUESTIONS_PER_PAGE)
  }, [sessionId])

  useEffect(() => {
    if (sessionId) {
      fetchResults()
    }
  }, [sessionId, fetchResults])

  if (loading) {
    return (
      <div className="text-center py-12">Loading results...</div>
    )
  }

  if (!results || !results.summary) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No results found</p>
        <button
          onClick={() => router.push('/games/practice')}
          className="mt-4 text-blue-600 hover:underline"
        >
          Start a new practice session
        </button>
      </div>
    )
  }

  const { summary, session, questionsWithAnswers } = results
  const hasQuestionsReview = questionsWithAnswers && Array.isArray(questionsWithAnswers) && questionsWithAnswers.length > 0
  
  // Get questions to display (limited by questionsToShow)
  const displayedQuestions = hasQuestionsReview 
    ? questionsWithAnswers.slice(0, questionsToShow)
    : []
  const remainingQuestions = hasQuestionsReview 
    ? questionsWithAnswers.length - questionsToShow
    : 0
  const hasMoreQuestions = remainingQuestions > 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Music Controls */}
      <div className="flex justify-end">
        <PracticeMusicControls />
      </div>
      
      <div className="text-center space-y-4">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />
        <h1 className="text-3xl font-bold">Practice Complete!</h1>
      </div>

      {/* Action Buttons at Top */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => router.push('/games/practice')}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          Practice Again
        </button>
        <button
          onClick={() => router.push('/games')}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Home className="w-5 h-5" />
          Back to Games
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600">{summary.totalScore || 0}</div>
          <div className="text-gray-600">Total Points</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{summary.correctAnswers || 0}</div>
            <div className="text-gray-600">Correct</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{summary.incorrectAnswers || 0}</div>
            <div className="text-gray-600">Incorrect</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{summary.unansweredCount || 0}</div>
            <div className="text-gray-600">Did Not Answer</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{Math.round(summary.accuracy || 0)}%</div>
            <div className="text-gray-600">Accuracy</div>
          </div>
        </div>

        {/* Questions Review Section - Show for both continuous and paced modes */}
        {hasQuestionsReview && (
          <div className="pt-6 border-t space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Question Review ({questionsWithAnswers.length} {questionsWithAnswers.length === 1 ? 'question' : 'questions'})
            </h2>
            <div className="space-y-6">
              {displayedQuestions.map((item: any, displayIndex: number) => {
                const { question, selectedAnswer, correctAnswer, isCorrect, isUnanswered } = item
                if (!question) return null
                
                // Calculate the actual question number (1-based index in the full list)
                const actualQuestionNumber = displayIndex + 1

                return (
                  <div
                    key={question.id || displayIndex}
                    data-question-card
                    className={`border-2 rounded-lg p-6 space-y-4 ${
                      isCorrect
                        ? 'border-green-500 bg-green-50'
                        : isUnanswered
                        ? 'border-gray-400 bg-gray-50'
                        : 'border-red-500 bg-red-50'
                    }`}
                  >
                    {/* Question Number and Status */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Question {actualQuestionNumber} of {questionsWithAnswers.length}
                      </h3>
                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-semibold">Correct</span>
                          </div>
                        ) : isUnanswered ? (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-5 h-5" />
                            <span className="font-semibold">Not Answered</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600">
                            <XCircle className="w-5 h-5" />
                            <span className="font-semibold">Incorrect</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Scenario */}
                    {question.scenario_text && (
                      <div className="prose max-w-none">
                        <div
                          dangerouslySetInnerHTML={{ __html: question.scenario_text }}
                          className="text-gray-700"
                        />
                      </div>
                    )}

                    {/* Question Text */}
                    <div className="prose max-w-none">
                      <div
                        dangerouslySetInnerHTML={{ __html: question.question_text }}
                        className="text-gray-900 font-medium"
                      />
                    </div>

                    {/* Answer Options */}
                    <div className="space-y-2">
                      {['A', 'B', 'C', 'D', 'E'].map((option) => {
                        const optionText = getOptionText(question, option)
                        if (!optionText || optionText.trim() === '') return null

                        const isSelected = selectedAnswer === option
                        const isCorrectOption = correctAnswer === option
                        const isSelectedAndWrong = isSelected && !isCorrect

                        let borderColor = 'border-gray-300'
                        let bgColor = 'bg-white'
                        let textColor = 'text-gray-700'

                        if (isCorrectOption) {
                          borderColor = 'border-green-500'
                          bgColor = 'bg-green-100'
                          textColor = 'text-green-900'
                        } else if (isSelectedAndWrong) {
                          borderColor = 'border-red-500'
                          bgColor = 'bg-red-100'
                          textColor = 'text-red-900'
                        }

                        return (
                          <div
                            key={option}
                            className={`border-2 ${borderColor} ${bgColor} rounded-lg p-3 ${isCorrectOption || isSelectedAndWrong || (isSelected && isCorrect) ? 'flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3' : 'flex items-start gap-3'}`}
                          >
                            <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                              <span className={`font-bold ${textColor} flex-shrink-0`}>{option}:</span>
                              <div 
                                className={`flex-1 prose max-w-none ${textColor} min-w-0 break-words`}
                                dangerouslySetInnerHTML={{ __html: optionText }}
                              />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0 sm:ml-auto mt-1 sm:mt-0">
                              {isCorrectOption && (
                                <span className="text-green-600 font-semibold text-sm sm:text-base whitespace-nowrap">✓ Correct Answer</span>
                              )}
                              {isSelectedAndWrong && (
                                <span className="text-red-600 font-semibold text-sm sm:text-base whitespace-nowrap">✗ Your Answer</span>
                              )}
                              {isSelected && isCorrect && (
                                <span className="text-green-600 font-semibold text-sm sm:text-base whitespace-nowrap">✓ Your Answer</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Explanation */}
                    {question.explanation_text && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Explanation:</h4>
                        <div
                          className="prose max-w-none text-gray-700"
                          dangerouslySetInnerHTML={{ __html: question.explanation_text }}
                        />
                        {question.explanation_image_url && (
                          <div className="mt-4">
                            <img
                              src={question.explanation_image_url}
                              alt="Explanation"
                              className="max-w-full h-auto rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            {/* Load More Button */}
            {hasMoreQuestions && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={handleLoadMore}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg"
                >
                  <ChevronDown className="w-5 h-5" />
                  +{Math.min(QUESTIONS_PER_PAGE, remainingQuestions)} More
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
          <button
            onClick={() => router.push('/games/practice')}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            <RotateCcw className="w-5 h-5" />
            Practice Again
          </button>
          <button
            onClick={() => router.push('/games')}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
          >
            <Home className="w-5 h-5" />
            Back to Games
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PracticeResultsPage() {
  const params = useParams()
  const sessionId = params.sessionId as string

  return (
    <PracticeAudioProvider sessionId={sessionId}>
      <PracticeResultsContent />
    </PracticeAudioProvider>
  )
}

