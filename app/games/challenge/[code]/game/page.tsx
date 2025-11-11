'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { QuestionDisplay } from '@/components/quiz/QuestionDisplay'

export default function ChallengeGamePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const router = useRouter()
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState(60)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChallenge()
  }, [code])

  useEffect(() => {
    if (timerSeconds > 0 && questions.length > 0) {
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
  }, [timerSeconds, currentQuestionIndex, questions.length])

  const fetchChallenge = async () => {
    try {
      const response = await fetch(`/api/quiz/challenges/${code}`)
      if (!response.ok) throw new Error('Failed to fetch challenge')
      const data = await response.json()
      
      if (data.challenge.status !== 'active') {
        router.push(`/games/challenge/${code}`)
        return
      }

      setQuestions(data.questions || [])
    } catch (error) {
      console.error('Error fetching challenge:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async (answer: string, timeTaken: number) => {
    if (!questions[currentQuestionIndex]) return

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

      if (!response.ok) throw new Error('Failed to submit answer')

      // Move to next question or results
      if (currentQuestionIndex < questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1)
          setTimerSeconds(60)
        }, 2000)
      } else {
        router.push(`/games/challenge/${code}/results`)
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
    }
  }

  if (loading || questions.length === 0) {
    return (
      <div className="text-center py-12">Loading challenge...</div>
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

