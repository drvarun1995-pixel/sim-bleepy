'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { QuestionDisplay } from '@/components/quiz/QuestionDisplay'
import { AnswerExplanation } from '@/components/quiz/AnswerExplanation'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { LogOut } from 'lucide-react'

export default function PracticeSessionPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const router = useRouter()
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeLimit, setTimeLimit] = useState<number>(60)
  const [timerSeconds, setTimerSeconds] = useState(60)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionResetKey, setSubmissionResetKey] = useState(0)
  const [mode, setMode] = useState<'continuous' | 'paced'>('paced')
  const [showExplanation, setShowExplanation] = useState(false)
  const [answerResult, setAnswerResult] = useState<any>(null)
  const [answerResults, setAnswerResults] = useState<Map<number, any>>(new Map()) // Store all answer results by question index
  const [showExitDialog, setShowExitDialog] = useState(false) // State for exit session confirmation dialog
  const answerSubmittedRef = useRef<boolean>(false)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isSubmittingRef = useRef<boolean>(false)
  const sessionStartedRef = useRef<boolean>(false)
  const isNavigatingBackRef = useRef<boolean>(false) // Track if we're navigating back to prevent useEffect from interfering
  const timerSecondsRef = useRef<number>(60) // Track current timer value to avoid stale closures

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
        // Set time limit from session data
      if (data.session?.time_limit) {
        setTimeLimit(data.session.time_limit)
        setTimerSeconds(data.session.time_limit)
        timerSecondsRef.current = data.session.time_limit
      }
        // Set mode from session data
        if (data.session?.mode) {
          setMode(data.session.mode)
        }
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
      sessionStartedRef.current = true
    }
  }, [sessionId, fetchSession])

  // Prevent browser back button and page navigation during active session
  useEffect(() => {
    if (!sessionStartedRef.current || questions.length === 0) return

    // Only prevent navigation if session is still active (not completed)
    const isSessionActive = currentQuestionIndex < questions.length
    
    if (!isSessionActive) {
      // Session completed, allow normal navigation
      return
    }

    // Push state only once when session starts to prevent back navigation
    // Using replaceState to avoid creating multiple history entries
    if (!window.history.state?.sessionActive) {
      window.history.replaceState({ sessionActive: true }, '', window.location.href)
    }
    
    // Handle browser back/forward buttons
    const handlePopState = (event: PopStateEvent) => {
      // Prevent navigation back - immediately push state back
      window.history.pushState({ sessionActive: true }, '', window.location.href)
      
      // Show warning toast
      toast.warning('Cannot navigate back during practice session', {
        description: 'Questions are presented sequentially. Complete the session to see results.',
        duration: 3000,
      })
    }

    // Handle beforeunload (page refresh/close) - warn user
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Only show warning if session is active
      if (isSessionActive) {
        event.preventDefault()
        // Modern browsers ignore custom messages, but we can still trigger the dialog
        event.returnValue = ''
        return ''
      }
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [questions.length, currentQuestionIndex])

  const handleAnswer = useCallback(async (answer: string, timeTaken: number, isTimeout: boolean = false) => {
    if (!questions[currentQuestionIndex] || !sessionId) return
    
    // Prevent duplicate submissions using refs (immediate, no state lag)
    if (answerSubmittedRef.current || isSubmittingRef.current) {
      console.log('Answer already submitted or submitting, skipping duplicate submission')
      return
    }

    // Mark as submitting immediately using both ref and state
    answerSubmittedRef.current = true
    isSubmittingRef.current = true
    setIsSubmitting(true)
    
    // Stop the timer immediately
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

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
        // If session is already completed, just redirect to results (don't show error)
        if (data.error === 'Practice session already completed' || data.error?.includes('already completed')) {
          // Session was already completed (maybe from a previous submission or page refresh)
          toast.info('Session already completed', {
            description: 'Redirecting to results...',
            duration: 2000,
          })
          setTimeout(() => {
            router.push(`/games/practice/${sessionId}/results`)
          }, 500)
          return
        }
        throw new Error(data.error || data.details || 'Failed to submit answer')
      }

      // Answer submitted successfully
      const isLastQuestion = currentQuestionIndex >= questions.length - 1
      
      if (mode === 'paced') {
        // Paced mode: Store answer result and show explanation
        // Get current question to pass option text
        const currentQuestion = questions[currentQuestionIndex]
        
        // Debug: Log question data to verify it has option fields
        if (process.env.NODE_ENV === 'development') {
          console.log('Storing answer result with question:', {
            questionId: currentQuestion?.id,
            hasOptionA: !!currentQuestion?.option_a,
            hasOptionB: !!currentQuestion?.option_b,
            hasOptionC: !!currentQuestion?.option_c,
            hasOptionD: !!currentQuestion?.option_d,
            hasOptionE: !!currentQuestion?.option_e,
            correctAnswer: data.correctAnswer,
            optionC: currentQuestion?.option_c,
          })
        }
        
        // Calculate time remaining when answer was submitted
        // Use ref to get the current timer value (avoid stale closure)
        const timeRemaining = Math.max(0, timerSecondsRef.current)
        
        const result = {
          isCorrect: data.isCorrect,
          correctAnswer: data.correctAnswer,
          explanation: data.explanation,
          selectedAnswer: answer,
          question: currentQuestion, // Pass full question data for option text
          timeTaken: timeTaken, // Store time taken to answer
          timeRemaining: timeRemaining, // Store time remaining when answered (for timer display)
        }
        
        // Store answer result in the map for later navigation
        setAnswerResults(prev => {
          const newMap = new Map(prev)
          newMap.set(currentQuestionIndex, result)
          return newMap
        })
        
        setAnswerResult(result)
        setShowExplanation(true)
        // Don't move to next question yet - wait for user to click "Continue"
      } else {
        // Continuous mode: Move to next question immediately (no explanation shown)
        if (isLastQuestion) {
          // Last question - redirect to results immediately
          toast.success('Practice session completed!', {
            description: 'Great job! Redirecting to results...',
            duration: 3000,
          })
          setTimeout(() => {
            router.push(`/games/practice/${sessionId}/results`)
          }, 1500)
        } else {
          // Not last question - move to next question
          if (isTimeout) {
            toast.info('Time\'s up!', {
              description: 'Moving to next question...',
              duration: 2000,
            })
          }
          
          setTimeout(() => {
            setCurrentQuestionIndex(prev => prev + 1)
            setTimerSeconds(timeLimit)
            timerSecondsRef.current = timeLimit // Update ref as well
            answerSubmittedRef.current = false
            isSubmittingRef.current = false
            setIsSubmitting(false)
          }, 500)
        }
      }
    } catch (error: any) {
      console.error('Error submitting answer:', error)
      toast.error('Failed to submit answer', {
        description: error.message || 'Please try again.',
        duration: 3000,
      })
      answerSubmittedRef.current = false
      isSubmittingRef.current = false
      setIsSubmitting(false)
      // Reset submission state in child component
      setSubmissionResetKey(prev => prev + 1)
    }
  }, [questions, currentQuestionIndex, sessionId, router, mode, timeLimit])

  // Handle continuing to next question (for paced mode)
  const handleContinue = useCallback(() => {
    const isLastQuestion = currentQuestionIndex >= questions.length - 1
    
    if (isLastQuestion) {
      // Last question - redirect to results
      toast.success('Practice session completed!', {
        description: 'Great job! Redirecting to results...',
        duration: 2000,
      })
      setTimeout(() => {
        router.push(`/games/practice/${sessionId}/results`)
      }, 500)
    } else {
      // Move to next question
      setShowExplanation(false)
      setAnswerResult(null)
      setCurrentQuestionIndex(prev => prev + 1)
      setTimerSeconds(timeLimit)
      timerSecondsRef.current = timeLimit // Update ref as well
      answerSubmittedRef.current = false
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }, [currentQuestionIndex, questions.length, sessionId, router, timeLimit])

  // Handle going back to previous question (for paced mode only)
  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex === 0) {
      // Can't go back from first question
      return
    }

    const previousIndex = currentQuestionIndex - 1
    
    // Check if we have a stored answer result for this question
    const storedResult = answerResults.get(previousIndex)
    
    // Set flag to indicate we're navigating back - this prevents useEffect from interfering
    isNavigatingBackRef.current = true
    
    // Navigate back
    setCurrentQuestionIndex(previousIndex)
    
    // If the question has been answered, restore the answer result and show the explanation
    if (storedResult) {
      // Debug: Log the stored result to verify it has all necessary data
      if (process.env.NODE_ENV === 'development') {
        console.log('Navigating back to question with stored result:', {
          hasExplanation: !!storedResult.explanation,
          hasQuestion: !!storedResult.question,
          hasCorrectAnswer: !!storedResult.correctAnswer,
          hasSelectedAnswer: !!storedResult.selectedAnswer,
          timeRemaining: storedResult.timeRemaining,
          explanationText: storedResult.explanation?.text?.substring(0, 50) + '...',
          fullStoredResult: storedResult,
        })
      }
      
      // Set both states together - React will batch these updates
      // Setting them together ensures they're applied in the same render cycle
      setAnswerResult(storedResult)
      setShowExplanation(true)
      
      // Restore the timer to show the time remaining when the question was answered
      // If timeRemaining is stored, use it; otherwise, calculate from timeTaken
      let restoredTimeRemaining = 0
      if (storedResult.timeRemaining !== undefined) {
        restoredTimeRemaining = storedResult.timeRemaining
      } else if (storedResult.timeTaken !== undefined) {
        // Fallback: calculate time remaining from time taken
        restoredTimeRemaining = Math.max(0, timeLimit - storedResult.timeTaken)
      }
      setTimerSeconds(restoredTimeRemaining)
      timerSecondsRef.current = restoredTimeRemaining // Update ref as well
    } else {
      setAnswerResult(null)
      setShowExplanation(false)
      // Reset timer for unanswered question
      setTimerSeconds(timeLimit)
      timerSecondsRef.current = timeLimit // Update ref as well
      // Reset the flag immediately if no stored result
      isNavigatingBackRef.current = false
    }
    
    // Reset the flag after state updates have been processed (only if we have a stored result)
    if (storedResult) {
      // Use a delay to ensure all state updates are processed before allowing useEffect to run
      // This prevents the useEffect from interfering with the back navigation state
      setTimeout(() => {
        isNavigatingBackRef.current = false
      }, 300)
    }
    
    // Reset submission state (but preserve timer for answered questions)
    answerSubmittedRef.current = false
    isSubmittingRef.current = false
    setIsSubmitting(false)
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentQuestionIndex, answerResults, timeLimit])

  // Restore answer state when question index changes
  // This effect ensures answered questions maintain their state when navigating
  // The answerResults Map is the source of truth - this effect restores from it
  useEffect(() => {
    // Don't interfere if we're navigating back (handlePrevious handles it completely)
    if (isNavigatingBackRef.current) {
      return
    }
    
    // Check if we have a stored answer result for the current question
    const storedResult = answerResults.get(currentQuestionIndex)
    
    if (storedResult) {
      // Question has been answered - restore the answer result and show explanation in paced mode
      setAnswerResult(storedResult)
      // In paced mode, always show explanation for answered questions
      if (mode === 'paced') {
        setShowExplanation(true)
      }
      // Restore the timer to show time remaining when question was answered
      let restoredTimeRemaining = 0
      if (storedResult.timeRemaining !== undefined) {
        restoredTimeRemaining = storedResult.timeRemaining
      } else if (storedResult.timeTaken !== undefined) {
        // Fallback: calculate time remaining from time taken
        restoredTimeRemaining = Math.max(0, timeLimit - storedResult.timeTaken)
      }
      setTimerSeconds(restoredTimeRemaining)
      timerSecondsRef.current = restoredTimeRemaining // Update ref as well
    } else {
      // Question hasn't been answered
      // Only clear answerResult if we're not in the middle of submitting an answer
      if (!isSubmittingRef.current && !answerSubmittedRef.current) {
        setAnswerResult(null)
        setShowExplanation(false)
      }
      // Reset submission flags for unanswered questions
      if (!isSubmittingRef.current && !answerSubmittedRef.current) {
        answerSubmittedRef.current = false
        isSubmittingRef.current = false
      }
    }
  }, [currentQuestionIndex, answerResults, mode, timeLimit])
  
  // Reset timer and submission state when question changes (separate effect)
  useEffect(() => {
    // Clear any existing timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    
    // Check if question has been answered
    const storedResult = answerResults.get(currentQuestionIndex)
    
    // Only reset timer if question hasn't been answered and not showing explanation
    // For answered questions, the timer should be preserved (set in the previous effect)
    if (!storedResult && !showExplanation) {
      setTimerSeconds(timeLimit)
      timerSecondsRef.current = timeLimit // Update ref as well
      setIsSubmitting(false)
    }
  }, [currentQuestionIndex, timeLimit, showExplanation, answerResults])

  // Timer effect - only recreates when question index changes
  useEffect(() => {
    // Don't start timer if no questions or past last question
    if (questions.length === 0 || currentQuestionIndex >= questions.length) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      return
    }
    
    // Don't start timer if showing explanation (paced mode)
    if (showExplanation && mode === 'paced') {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      return
    }
    
    // Don't start timer if question has already been answered
    const storedResult = answerResults.get(currentQuestionIndex)
    if (storedResult) {
      // Question already answered - stop timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      return
    }
    
    // Clear any existing timer first
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    
    // Reset timer to timeLimit for new question
    setTimerSeconds(timeLimit)
    timerSecondsRef.current = timeLimit // Update ref as well
    
    // Start new timer
    timerIntervalRef.current = setInterval(() => {
      // Check refs BEFORE accessing state to prevent race conditions
      if (answerSubmittedRef.current || isSubmittingRef.current) {
        // Stop timer if answer already submitted
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
          timerIntervalRef.current = null
        }
        return
      }
      
      // Stop timer if showing explanation (paced mode)
      if (showExplanation && mode === 'paced') {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
          timerIntervalRef.current = null
        }
        return
      }
      
      // Stop timer if question has been answered (might have changed)
      const currentStoredResult = answerResults.get(currentQuestionIndex)
      if (currentStoredResult) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
          timerIntervalRef.current = null
        }
        return
      }
      
      setTimerSeconds(prev => {
        // Final check with refs
        if (answerSubmittedRef.current || isSubmittingRef.current) {
          return prev
        }
        
        // If timer is at 0 or below, stop
        if (prev <= 0) {
          timerSecondsRef.current = 0
          return 0
        }
        
        // If timer reaches 1, handle timeout
        if (prev === 1) {
          // Clear interval first to prevent multiple calls
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current)
            timerIntervalRef.current = null
          }
          
          // Update ref before submitting
          timerSecondsRef.current = 0
          
          // Submit timeout answer - handleAnswer will set the refs
          // Don't await, fire and forget
          handleAnswer('', timeLimit, true).catch(err => {
            console.error('Error in timeout answer submission:', err)
            // Error handling is done in handleAnswer, but we ensure timer is stopped
          })
          
          return 0
        }
        
        // Decrement timer and update ref
        const newValue = prev - 1
        timerSecondsRef.current = newValue
        return newValue
      })
    }, 1000)
    
    // Cleanup function
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }, [currentQuestionIndex, questions.length, handleAnswer, timeLimit, showExplanation, mode, answerResults])

  // Handle skip question - MUST be defined before any conditional returns (hooks rule)
  const handleSkip = useCallback(() => {
    if (isSubmittingRef.current || answerSubmittedRef.current) return
    
    const timeTaken = 0 // 0 seconds for skip
    handleAnswer('', timeTaken, false).catch(err => {
      console.error('Error skipping question:', err)
    })
  }, [handleAnswer])

  // Handle next question (when question is already answered)
  const handleNext = useCallback(() => {
    const isLastQuestion = currentQuestionIndex >= questions.length - 1
    
    if (isLastQuestion) {
      // Last question - redirect to results
      toast.success('Practice session completed!', {
        description: 'Great job! Redirecting to results...',
        duration: 2000,
      })
      setTimeout(() => {
        router.push(`/games/practice/${sessionId}/results`)
      }, 500)
    } else {
      // Move to next question
      setShowExplanation(false)
      setAnswerResult(null)
      setCurrentQuestionIndex(prev => prev + 1)
      setTimerSeconds(timeLimit)
      timerSecondsRef.current = timeLimit // Update ref as well
      answerSubmittedRef.current = false
      isSubmittingRef.current = false
      setIsSubmitting(false)
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentQuestionIndex, questions.length, sessionId, router, timeLimit])

  // Handle exit session - defined before conditional returns
  const handleExitSession = useCallback(() => {
    // Open the confirmation dialog
    setShowExitDialog(true)
  }, [])

  // Handle exit session confirmation
  const confirmExitSession = useCallback(() => {
    // Navigate to results page to save progress
    setShowExitDialog(false)
    router.push(`/games/practice/${sessionId}/results`)
  }, [sessionId, router])

  // Handle exit session cancellation
  const cancelExitSession = useCallback(() => {
    setShowExitDialog(false)
  }, [])

  // Calculate these values before the return statement to avoid conditional hooks
  const isLastQuestion = currentQuestionIndex >= questions.length - 1
  const hasAnsweredQuestion = answerResults.has(currentQuestionIndex) || answerResult !== null
  // Show Skip button only if question hasn't been answered and we're not showing explanation
  const canSkip = !showExplanation && !isSubmitting && !isLastQuestion && !hasAnsweredQuestion
  // Show Next button if question has been answered and it's not the last question
  // Show it even when explanation is visible (for back navigation scenario)
  const canNext = !isLastQuestion && hasAnsweredQuestion && !isSubmitting

  if (loading || questions.length === 0) {
    return (
      <div className="text-center py-12">Loading questions...</div>
    )
  }

  if (currentQuestionIndex >= questions.length) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      {/* Header with Back Button (paced mode only), Skip, and Exit Session Button */}
      <div className="max-w-4xl mx-auto mb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {mode === 'paced' && (
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0 || loading}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed px-3 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}
          {!showExplanation && !isLastQuestion && canSkip && (
            <button
              onClick={handleSkip}
              disabled={loading}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed px-3 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              Skip
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {/* Show Next button when question is answered - show it even when explanation is visible (for back navigation) */}
          {!isLastQuestion && canNext && (
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed px-3 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              Next
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={handleExitSession}
          className="text-sm text-gray-600 hover:text-gray-800 underline px-3 py-1 rounded hover:bg-gray-100 transition-colors"
        >
          Exit Session
        </button>
      </div>
      
      <div className="max-w-4xl mx-auto space-y-6">
        <QuestionDisplay
          key={questions[currentQuestionIndex]?.id || currentQuestionIndex}
          question={questions[currentQuestionIndex]}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          onAnswer={handleAnswer}
          timerSeconds={timerSeconds}
          resetSubmission={submissionResetKey}
          disabled={showExplanation || hasAnsweredQuestion}
          selectedAnswer={answerResult?.selectedAnswer}
          correctAnswer={answerResult?.correctAnswer}
          showSkipButton={false}
        />
        
        {/* Show explanation in paced mode */}
        {mode === 'paced' && showExplanation && answerResult && answerResult.explanation && (
          <AnswerExplanation
            isCorrect={answerResult.isCorrect}
            correctAnswer={answerResult.correctAnswer}
            explanation={answerResult.explanation}
            selectedAnswer={answerResult.selectedAnswer}
            onContinue={handleContinue}
            question={answerResult.question}
          />
        )}
      </div>

      {/* Exit Session Confirmation Dialog */}
      <ConfirmationDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        onConfirm={confirmExitSession}
        onCancel={cancelExitSession}
        title="Exit Practice Session"
        description="Are you sure you want to exit this practice session? Your progress will be saved, but you will need to start a new session to continue."
        confirmText="Exit Session"
        cancelText="Continue Session"
        variant="warning"
        icon={<LogOut className="h-6 w-6 text-orange-500" />}
      />
    </div>
  )
}

