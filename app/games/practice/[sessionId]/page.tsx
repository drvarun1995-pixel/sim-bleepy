'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { QuestionDisplay } from '@/components/quiz/QuestionDisplay'

export default function PracticeSessionPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const router = useRouter()
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState(60)
  const [loading, setLoading] = useState(true)

  const fetchSession = useCallback(async () => {
    if (!sessionId || typeof sessionId !== 'string') {
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      const response = await fetch(`/api/quiz/practice/${sessionId}`)
      const data = await response.json()
      
      if (!response.ok) {
        // Check if it's the "no questions" case
        if (data.message && data.questions && data.questions.length === 0) {
          // Session exists but has no questions - redirect to practice setup
          alert('This session has no questions. Please start a new practice session.')
          router.push('/games/practice')
          return
        }
        throw new Error(data.error || data.details || 'Failed to fetch session')
      }
      
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions)
      } else if (data.message) {
        // Session exists but has no questions
        alert(data.message || 'No questions found for this session. Please start a new practice session.')
        router.push('/games/practice')
      } else {
        console.error('No questions found in session')
        alert('No questions found for this session. Please start a new practice session.')
        router.push('/games/practice')
      }
    } catch (error: any) {
      console.error('Error fetching session:', error)
      alert(error.message || 'Failed to load practice session. Please try starting a new session.')
      router.push('/games/practice')
    } finally {
      setLoading(false)
    }
  }, [sessionId, router])

  useEffect(() => {
    if (sessionId) {
      fetchSession()
    }
  }, [sessionId, fetchSession])

  const handleAnswer = useCallback(async (answer: string, timeTaken: number) => {
    if (!questions[currentQuestionIndex] || !sessionId) return

    try {
      const response = await fetch(`/api/quiz/practice/${sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questions[currentQuestionIndex].id,
          selected_answer: answer,
          time_taken_seconds: timeTaken,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to submit answer')
      }

      // Answer submitted successfully
      if (currentQuestionIndex < questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1)
          setTimerSeconds(60)
        }, 2000)
      } else {
        // Last question answered, redirect to results
        router.push(`/games/practice/${sessionId}/results`)
      }
    } catch (error: any) {
      console.error('Error submitting answer:', error)
      alert(error.message || 'Failed to submit answer. Please try again.')
    }
  }, [questions, currentQuestionIndex, sessionId, router])

  useEffect(() => {
    if (timerSeconds > 0 && questions.length > 0 && currentQuestionIndex < questions.length) {
      const interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            handleAnswer('', 60) // Timeout
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [timerSeconds, currentQuestionIndex, questions.length, handleAnswer])

  if (loading || questions.length === 0) {
    return (
      <div className="text-center py-12">Loading questions...</div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      <QuestionDisplay
        question={questions[currentQuestionIndex]}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        onAnswer={handleAnswer}
        timerSeconds={timerSeconds}
      />
    </div>
  )
}

