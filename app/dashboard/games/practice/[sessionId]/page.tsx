'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { QuestionDisplay } from '@/components/quiz/QuestionDisplay'

interface Question {
  id: string
  scenario_text: string
  scenario_image_url?: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  option_e: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export default function PracticeSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState(45)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSession()
  }, [sessionId])

  useEffect(() => {
    if (timerSeconds > 0) {
      const interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            // Timeout - auto-submit empty answer
            handleAnswer('', 45)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [timerSeconds, currentQuestionIndex])

  const fetchSession = async () => {
    try {
      // Get session details and questions from the start endpoint response
      // In a real implementation, you'd store questions in session or fetch them separately
      // For now, we'll need to get questions from the practice start response
      // This is a simplified approach - in production, you might store question IDs in the session
      const response = await fetch(`/api/quiz/practice/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!response.ok) throw new Error('Failed to fetch session')
      const data = await response.json()
      
      // Fetch full question details
      if (data.questions && data.questions.length > 0) {
        const questionPromises = data.questions.map((q: { id: string }) =>
          fetch(`/api/quiz/questions/${q.id}`).then(r => r.json()).then(d => d.question)
        )
        const fullQuestions = await Promise.all(questionPromises)
        setQuestions(fullQuestions)
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async (answer: string, timeTaken: number) => {
    if (!questions[currentQuestionIndex]) return

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

      if (!response.ok) throw new Error('Failed to submit answer')
      const data = await response.json()

      // Show feedback, then move to next question or results
      if (currentQuestionIndex < questions.length - 1) {
        // Show feedback briefly, then next question
        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1)
          setTimerSeconds(45)
        }, 2000)
      } else {
        // Complete session
        router.push(`/dashboard/games/practice/${sessionId}/results`)
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
    }
  }

  if (loading || questions.length === 0) {
    return (
      <div className="p-4 lg:p-8">
        <div className="text-center py-12">Loading question...</div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gray-50">
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

