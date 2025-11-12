'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { QuestionDisplay } from '@/components/quiz/QuestionDisplay'
import { Users, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ChallengeGamePage() {
  const params = useParams()
  const code = params.code as string
  const router = useRouter()
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState(60)
  const [timeLimit, setTimeLimit] = useState(60)
  const [loading, setLoading] = useState(true)
  const [userAnswered, setUserAnswered] = useState(false)
  const [allAnswered, setAllAnswered] = useState(false)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const answerStatusIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const answerSubmittedRef = useRef(false)
  const isNavigatingRef = useRef(false)

  const fetchChallenge = useCallback(async () => {
    if (!code || typeof code !== 'string') {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/quiz/challenges/${code}`)
      if (!response.ok) throw new Error('Failed to fetch challenge')
      const data = await response.json()
      
      if (data.challenge.status !== 'active') {
        router.push(`/games/challenge/${code}`)
        return
      }

      // Set time limit from challenge settings
      if (data.challenge.time_limit) {
        setTimeLimit(data.challenge.time_limit)
        setTimerSeconds(data.challenge.time_limit)
      }

      // Questions should be returned from the API for active challenges
      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions)
        // Reset state for new question
        setUserAnswered(false)
        setAllAnswered(false)
        answerSubmittedRef.current = false
      } else {
        console.error('No questions found for active challenge')
        router.push(`/games/challenge/${code}`)
      }
    } catch (error) {
      console.error('Error fetching challenge:', error)
      router.push(`/games/challenge/${code}`)
    } finally {
      setLoading(false)
    }
  }, [code, router])

  const checkAnswerStatus = useCallback(async () => {
    if (!code || questions.length === 0 || currentQuestionIndex >= questions.length) return

    try {
      const response = await fetch(
        `/api/quiz/challenges/${code}/answer-status?question_order=${currentQuestionIndex + 1}`
      )
      if (!response.ok) return
      const data = await response.json()
      
      setUserAnswered(data.userAnswered)
      setAllAnswered(data.allAnswered)
      setAnsweredCount(data.answeredCount)
      setTotalCount(data.totalCount)

      // If all answered and user has answered, move to next question after a delay
      if (data.allAnswered && data.userAnswered && !isNavigatingRef.current) {
        isNavigatingRef.current = true
        setTimeout(() => {
          moveToNextQuestion()
        }, 1500)
      }
    } catch (error) {
      console.error('Error checking answer status:', error)
    }
  }, [code, questions, currentQuestionIndex])

  const moveToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setUserAnswered(false)
      setAllAnswered(false)
      answerSubmittedRef.current = false
      isNavigatingRef.current = false
      setTimerSeconds(timeLimit)
    } else {
      // Challenge completed
      router.push(`/games/challenge/${code}/results`)
    }
  }, [currentQuestionIndex, questions.length, timeLimit, code, router])

  const handleAnswer = useCallback(async (answer: string, timeTaken: number) => {
    if (!questions[currentQuestionIndex] || !code || answerSubmittedRef.current || isSubmitting) return

    answerSubmittedRef.current = true
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/quiz/challenges/${code}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questions[currentQuestionIndex].id,
          question_order: currentQuestionIndex + 1,
          selected_answer: answer,
          time_taken_seconds: timeTaken,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        answerSubmittedRef.current = false
        console.error('Failed to submit answer:', errorData)
        throw new Error(errorData.error || 'Failed to submit answer')
      }

      const data = await response.json()
      
      // Update state from response
      setUserAnswered(true)
      setAllAnswered(data.allAnswered || false)
      setAnsweredCount(data.answeredCount || 0)
      setTotalCount(data.totalCount || 0)

      // If all answered immediately, move to next question
      if (data.allAnswered) {
        isNavigatingRef.current = true
        setTimeout(() => {
          moveToNextQuestion()
        }, 1500)
      }
    } catch (error: any) {
      console.error('Error submitting answer:', error)
      answerSubmittedRef.current = false
      // Show user-friendly error message
      const errorMessage = error?.message || 'Failed to submit answer. Please try again.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [questions, currentQuestionIndex, code, moveToNextQuestion, isSubmitting])

  // Timer effect - only run when question changes and not all answered
  useEffect(() => {
    const handleTimeout = async () => {
      if (!answerSubmittedRef.current && !isSubmitting && !userAnswered) {
        answerSubmittedRef.current = true
        await handleAnswer('', timeLimit) // Timeout - empty answer
      }
    }
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

    // Only start timer if question exists, not all answered, and user hasn't answered yet
    if (questions.length > 0 && currentQuestionIndex < questions.length && !allAnswered && !userAnswered) {
      setTimerSeconds(timeLimit)
      answerSubmittedRef.current = false

      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            handleTimeout()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (userAnswered && !allAnswered) {
      // User has answered but waiting for others - stop timer at current value
      // Timer display will show the time when user answered
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }, [currentQuestionIndex, questions.length, timeLimit, allAnswered, userAnswered, handleAnswer, isSubmitting])

  // Poll for answer status when user has answered but others haven't
  useEffect(() => {
    if (answerStatusIntervalRef.current) {
      clearInterval(answerStatusIntervalRef.current)
    }

    if (userAnswered && !allAnswered && questions.length > 0) {
      // Poll every 1 second to check if all participants have answered
      answerStatusIntervalRef.current = setInterval(() => {
        checkAnswerStatus()
      }, 1000)
    } else {
      // Also check once when question changes
      checkAnswerStatus()
    }

    return () => {
      if (answerStatusIntervalRef.current) {
        clearInterval(answerStatusIntervalRef.current)
        answerStatusIntervalRef.current = null
      }
    }
  }, [userAnswered, allAnswered, questions, currentQuestionIndex, checkAnswerStatus])

  // Reset state when question changes
  useEffect(() => {
    setUserAnswered(false)
    setAllAnswered(false)
    answerSubmittedRef.current = false
    isNavigatingRef.current = false
    setTimerSeconds(timeLimit)
    checkAnswerStatus()
  }, [currentQuestionIndex, timeLimit, checkAnswerStatus])

  useEffect(() => {
    if (code) {
      fetchChallenge()
    }
  }, [code, fetchChallenge])

  if (loading || questions.length === 0) {
    return (
      <div className="text-center py-12">Loading challenge...</div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  if (!currentQuestion) {
    return <div className="text-center py-12">No question found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      {/* Waiting for Others Overlay */}
      <AnimatePresence>
        {userAnswered && !allAnswered && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3"
          >
            <Users className="w-5 h-5 animate-pulse" />
            <div className="flex items-center gap-2">
              <span className="font-semibold">Waiting for others...</span>
              <span className="text-blue-100">
                ({answeredCount}/{totalCount} answered)
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Display */}
      <div className={userAnswered && !allAnswered ? 'opacity-50 pointer-events-none' : ''}>
        <QuestionDisplay
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          onAnswer={handleAnswer}
          timerSeconds={timerSeconds}
          disabled={userAnswered && !allAnswered}
        />
      </div>

      {/* Answer Status Footer */}
      {userAnswered && !allAnswered && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 bg-white border-2 border-blue-200 rounded-lg shadow-lg px-6 py-4"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600">
                Waiting for {totalCount - answeredCount} more {totalCount - answeredCount === 1 ? 'player' : 'players'}...
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: totalCount }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < answeredCount ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
