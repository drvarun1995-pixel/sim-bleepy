'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { QuestionDisplay } from '@/components/quiz/QuestionDisplay'
import { Users, Clock, TrendingUp, LogOut, CheckCircle2, XCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

// Game states - simple state machine to avoid race conditions
type GameState = 
  | 'loading'           // Initial loading
  | 'question'         // Showing question, waiting for answers
  | 'showing_answer'    // Showing correct answer
  | 'showing_scores'    // Showing scoreboard update
  | 'completed'        // Game completed

export default function ChallengeGamePage() {
  const params = useParams()
  const code = params.code as string
  const router = useRouter()
  
  // Game state
  const [gameState, setGameState] = useState<GameState>('loading')
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeLimit, setTimeLimit] = useState(60)
  const [timerSeconds, setTimerSeconds] = useState(60)
  const [submittedTimerValue, setSubmittedTimerValue] = useState<number | null>(null) // Store timer value when answer is submitted
  
  // Transition countdown timers
  const [answerCountdown, setAnswerCountdown] = useState<number | null>(null) // Countdown for answer section
  const [scoreCountdown, setScoreCountdown] = useState<number | null>(null) // Countdown for scoreboard section
  
  // Answer state
  const [userAnswered, setUserAnswered] = useState(false)
  const [allAnswered, setAllAnswered] = useState(false)
  const [answerResult, setAnswerResult] = useState<any>(null)
  const [participantScores, setParticipantScores] = useState<any[]>([])
  const [userSelectedAnswer, setUserSelectedAnswer] = useState<string | null>(null) // Store user's selected answer while waiting
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  
  // Refs for cleanup
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const answerCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const answerTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const scoreTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const answerCountdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const scoreCountdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const answerSubmittedRef = useRef(false)
  const timerSecondsRef = useRef(60) // Ref to track timer value synchronously
  const fetchAnswerResultRef = useRef<(() => Promise<void>) | null>(null)

  // Fetch challenge and questions
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

      if (data.challenge.time_limit) {
        setTimeLimit(data.challenge.time_limit)
        setTimerSeconds(data.challenge.time_limit)
        timerSecondsRef.current = data.challenge.time_limit
      }

      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions)
        setGameState('question')
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

  // Fetch participant scores
  const fetchParticipantScores = useCallback(async () => {
    if (!code) return
    
    try {
      // Add cache-busting parameter to ensure fresh data
      const response = await fetch(`/api/quiz/challenges/${code}?t=${Date.now()}`)
      if (!response.ok) {
        console.error('Failed to fetch participant scores:', response.status)
        return
      }
      const data = await response.json()
      
      console.log('Fetched participant scores:', data.participants)
      
      if (data.participants && Array.isArray(data.participants)) {
        const sorted = [...data.participants].sort((a: any, b: any) => 
          (b.score || 0) - (a.score || 0)
        )
        console.log('Sorted participant scores:', sorted.map((p: any) => ({
          name: p.user?.name || p.user?.email,
          score: p.score
        })))
        setParticipantScores(sorted)
      } else {
        console.warn('No participants found in response')
      }
    } catch (error) {
      console.error('Error fetching participant scores:', error)
    }
  }, [code])

  // Check if all players answered
  const checkAnswerStatus = useCallback(async () => {
    // Only check if we're in question state
    if (!code || gameState !== 'question') {
      // Stop polling if not in question state
      if (answerCheckIntervalRef.current) {
        clearInterval(answerCheckIntervalRef.current)
        answerCheckIntervalRef.current = null
      }
      return
    }
    
    try {
      const currentQuestion = questions[currentQuestionIndex]
      if (!currentQuestion) return

      const response = await fetch(
        `/api/quiz/challenges/${code}/answer-status?question_order=${currentQuestionIndex + 1}&t=${Date.now()}`,
        {
          cache: 'no-store', // Ensure we get fresh data
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      )
      
      if (!response.ok) return
      
      const data = await response.json()
      
      // Log for debugging
      console.log('[checkAnswerStatus] API Response:', {
        timestamp: new Date().toISOString(),
        questionIndex: currentQuestionIndex,
        questionId: currentQuestion.id,
        allAnswered: data.allAnswered,
        userAnswered: data.userAnswered,
        answeredCount: data.answeredCount,
        totalCount: data.totalCount,
        gameState,
        url: `/api/quiz/challenges/${code}/answer-status?question_order=${currentQuestionIndex + 1}`
      })
      
      // Update state based on API response
      setUserAnswered(data.userAnswered || false)
      setAllAnswered(data.allAnswered || false)
      
      // CRITICAL: Only transition if ALL of these conditions are met:
      // 1. API confirms all players have answered (explicit true check)
      // 2. API confirms current user has answered (explicit true check)
      // 3. We have valid counts (answeredCount === totalCount) - EXACT match required
      // 4. totalCount is at least 2 (multiplayer) or 1 (single player)
      // 5. answeredCount matches totalCount exactly - no exceptions
      // 6. We're still in question state
      // 7. For multiplayer: answeredCount must equal totalCount exactly
      const hasMultipleParticipants = (data.totalCount || 0) > 1
      
      // Detailed condition checking for debugging
      const conditionChecks = {
        allAnsweredIsTrue: data.allAnswered === true,
        userAnsweredIsTrue: data.userAnswered === true,
        answeredCountIsNumber: typeof data.answeredCount === 'number',
        totalCountIsNumber: typeof data.totalCount === 'number',
        countsMatchExactly: data.answeredCount === data.totalCount, // EXACT match - no tolerance
        totalCountGreaterThanZero: data.totalCount > 0,
        answeredCountGreaterThanZero: (data.answeredCount || 0) > 0,
        inQuestionState: gameState === 'question',
        // For multiplayer: must have at least 2 players and answeredCount must equal totalCount exactly
        multiplayerCheck: !hasMultipleParticipants || (data.totalCount >= 2 && data.answeredCount === data.totalCount),
        // Additional safety: answeredCount must never exceed totalCount
        answeredCountNotExceedingTotal: (data.answeredCount || 0) <= (data.totalCount || 0)
      }
      
      const allConditionsMet = 
        conditionChecks.allAnsweredIsTrue &&
        conditionChecks.userAnsweredIsTrue &&
        conditionChecks.answeredCountIsNumber &&
        conditionChecks.totalCountIsNumber &&
        conditionChecks.countsMatchExactly &&
        conditionChecks.totalCountGreaterThanZero &&
        conditionChecks.answeredCountGreaterThanZero &&
        conditionChecks.inQuestionState &&
        conditionChecks.multiplayerCheck &&
        conditionChecks.answeredCountNotExceedingTotal
      
      console.log('[checkAnswerStatus] Condition checks:', {
        hasMultipleParticipants,
        conditionChecks,
        allConditionsMet,
        failedConditions: Object.entries(conditionChecks)
          .filter(([_, value]) => !value)
          .map(([key]) => key)
      })
      
      if (allConditionsMet) {
        // For multiplayer, verify with a second API call after a short delay
        // This prevents false positives from stale or incorrect API responses
        if (hasMultipleParticipants) {
          console.log('[checkAnswerStatus] ⚠️ Multiplayer detected, verifying with second API call...', {
            answeredCount: data.answeredCount,
            totalCount: data.totalCount,
            timestamp: new Date().toISOString()
          })
          
          // Wait 1200ms and verify again - longer delay for production to ensure database has updated
          // Production databases may have replication lag, so we need more time
          // This prevents false positives from stale or cached data
          await new Promise(resolve => setTimeout(resolve, 1200))
          
          // Make a second verification call with cache-busting
          try {
            const verifyUrl = `/api/quiz/challenges/${code}/answer-status?question_order=${currentQuestionIndex + 1}&t=${Date.now()}&verify=true`
            console.log('[checkAnswerStatus] Making verification call to:', verifyUrl)
            
            const verifyResponse = await fetch(verifyUrl, {
              cache: 'no-store', // Ensure we get fresh data
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
              }
            })
            
            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json()
              
              console.log('[checkAnswerStatus] Verification result:', {
                timestamp: new Date().toISOString(),
                allAnswered: verifyData.allAnswered,
                userAnswered: verifyData.userAnswered,
                answeredCount: verifyData.answeredCount,
                totalCount: verifyData.totalCount,
                gameState
              })
              
              // Only proceed if verification confirms all answered
              // CRITICAL: For multiplayer, we need EXACT match - all participants must have answered
              const verifyConditionChecks = {
                allAnsweredIsTrue: verifyData.allAnswered === true,
                userAnsweredIsTrue: verifyData.userAnswered === true,
                answeredCountIsNumber: typeof verifyData.answeredCount === 'number',
                totalCountIsNumber: typeof verifyData.totalCount === 'number',
                countsMatchExactly: verifyData.answeredCount === verifyData.totalCount, // EXACT match required
                totalCountGreaterThanZero: verifyData.totalCount > 0,
                answeredCountGreaterThanZero: verifyData.answeredCount > 0,
                totalCountAtLeast2: verifyData.totalCount >= 2,
                answeredCountAtLeast2: verifyData.answeredCount >= 2,
                answeredCountEqualsTotal: verifyData.answeredCount === verifyData.totalCount, // Double-check
                inQuestionState: gameState === 'question'
              }
              
              // For multiplayer, require EXACT match: answeredCount must equal totalCount
              const verified = 
                verifyConditionChecks.allAnsweredIsTrue &&
                verifyConditionChecks.userAnsweredIsTrue &&
                verifyConditionChecks.answeredCountIsNumber &&
                verifyConditionChecks.totalCountIsNumber &&
                verifyConditionChecks.countsMatchExactly &&
                verifyConditionChecks.totalCountGreaterThanZero &&
                verifyConditionChecks.answeredCountGreaterThanZero &&
                verifyConditionChecks.answeredCountEqualsTotal &&
                verifyConditionChecks.inQuestionState &&
                // For multiplayer (2+ players), ensure we have at least 2 and they match exactly
                (verifyData.totalCount === 1 || (verifyData.totalCount >= 2 && verifyData.answeredCount === verifyData.totalCount))
              
              console.log('[checkAnswerStatus] Verification condition checks:', {
                verifyConditionChecks,
                verified,
                failedConditions: Object.entries(verifyConditionChecks)
                  .filter(([_, value]) => !value)
                  .map(([key]) => key)
              })
              
              if (!verified) {
                console.log('[checkAnswerStatus] ❌ Verification failed, continuing to wait', {
                  reason: 'Verification conditions not met',
                  verifyData: {
                    allAnswered: verifyData.allAnswered,
                    answeredCount: verifyData.answeredCount,
                    totalCount: verifyData.totalCount
                  }
                })
                // Update state with verification data
                setUserAnswered(verifyData.userAnswered || false)
                setAllAnswered(verifyData.allAnswered || false)
                return // Don't transition
              }
              
              // EXTRA SAFETY: For multiplayer with 2+ players, do a third check after another short delay
              // This triple-verification ensures we're absolutely certain all players have answered
              // Longer delay for production to account for database replication lag
              if (verifyData.totalCount >= 2) {
                console.log('[checkAnswerStatus] ⚠️ Multiplayer with 2+ players, doing third verification check...')
                await new Promise(resolve => setTimeout(resolve, 800))
                
                try {
                  const thirdVerifyUrl = `/api/quiz/challenges/${code}/answer-status?question_order=${currentQuestionIndex + 1}&t=${Date.now()}&verify2=true`
                  const thirdVerifyResponse = await fetch(thirdVerifyUrl, {
                    cache: 'no-store',
                    headers: {
                      'Cache-Control': 'no-cache, no-store, must-revalidate',
                      'Pragma': 'no-cache'
                    }
                  })
                  
                  if (thirdVerifyResponse.ok) {
                    const thirdVerifyData = await thirdVerifyResponse.json()
                    
                    console.log('[checkAnswerStatus] Third verification result:', {
                      allAnswered: thirdVerifyData.allAnswered,
                      answeredCount: thirdVerifyData.answeredCount,
                      totalCount: thirdVerifyData.totalCount,
                      countsMatch: thirdVerifyData.answeredCount === thirdVerifyData.totalCount
                    })
                    
                    // Third check must also confirm all answered
                    if (!thirdVerifyData.allAnswered || 
                        thirdVerifyData.answeredCount !== thirdVerifyData.totalCount ||
                        thirdVerifyData.totalCount !== verifyData.totalCount) {
                      console.log('[checkAnswerStatus] ❌ Third verification failed, continuing to wait')
                      setUserAnswered(thirdVerifyData.userAnswered || false)
                      setAllAnswered(thirdVerifyData.allAnswered || false)
                      return // Don't transition
                    }
                    
                    console.log('[checkAnswerStatus] ✅ Third verification passed, all checks confirmed')
                  } else {
                    console.log('[checkAnswerStatus] ⚠️ Third verification API call failed, continuing to wait')
                    return // Don't transition if third verification fails
                  }
                } catch (thirdVerifyError) {
                  console.error('[checkAnswerStatus] Error during third verification:', thirdVerifyError)
                  return // Don't transition if third verification errors
                }
              }
            } else {
              console.log('[checkAnswerStatus] ⚠️ Verification API call failed:', {
                status: verifyResponse.status,
                statusText: verifyResponse.statusText
              })
              return // Don't transition if verification fails
            }
          } catch (verifyError) {
            console.error('[checkAnswerStatus] Error during verification:', verifyError)
            return // Don't transition if verification errors
          }
        }
        
        // FINAL SAFETY CHECK: Verify we're still in question state before transitioning
        // This prevents race conditions where state might have changed during async operations
        if (gameState !== 'question') {
          console.log('[checkAnswerStatus] ⚠️ Game state changed during verification, aborting transition', {
            currentGameState: gameState,
            expectedState: 'question'
          })
          return // Don't transition if state changed
        }
        
        console.log('[checkAnswerStatus] ✅ All players answered (verified), transitioning to showing_answer', {
          timestamp: new Date().toISOString(),
          answeredCount: data.answeredCount,
          totalCount: data.totalCount,
          isMultiplayer: hasMultipleParticipants,
          questionIndex: currentQuestionIndex,
          questionId: currentQuestion.id,
          finalGameStateCheck: gameState === 'question'
        })
        
        // Stop checking immediately
        if (answerCheckIntervalRef.current) {
          clearInterval(answerCheckIntervalRef.current)
          answerCheckIntervalRef.current = null
        }
        
        // Stop timer
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
          timerIntervalRef.current = null
        }
        
        // Fetch answer result using ref
        if (fetchAnswerResultRef.current) {
          await fetchAnswerResultRef.current()
        }
        
        // FINAL CHECK: Verify state one more time before transitioning
        // Use functional update to ensure we have latest state
        setGameState(prevState => {
          if (prevState !== 'question') {
            console.log('[checkAnswerStatus] ⚠️ Game state changed to', prevState, 'before transition, aborting')
            return prevState
          }
          console.log('[checkAnswerStatus] ✅ Transitioning to showing_answer')
          return 'showing_answer'
        })
      } else {
        console.log('[checkAnswerStatus] ⏳ Not all players answered yet, continuing to wait', {
          timestamp: new Date().toISOString(),
          allAnswered: data.allAnswered,
          userAnswered: data.userAnswered,
          answeredCount: data.answeredCount,
          totalCount: data.totalCount,
          conditionsMet: allConditionsMet,
          isMultiplayer: hasMultipleParticipants,
          questionIndex: currentQuestionIndex
        })
      }
    } catch (error) {
      console.error('Error checking answer status:', error)
    }
  }, [code, gameState, questions, currentQuestionIndex])

  // Fetch answer result for current question
  const fetchAnswerResult = useCallback(async () => {
    if (!code) return
    
    try {
      const response = await fetch(`/api/quiz/challenges/${code}`)
      if (!response.ok) return
      
      const data = await response.json()
      const currentQuestion = questions[currentQuestionIndex]
      if (!currentQuestion) return
      
      // Find user's participant
      const userParticipant = data.userParticipant || 
        data.participants?.find((p: any) => p.user_id)
      
      if (userParticipant) {
        const userAnswer = data.allAnswers?.find((a: any) => 
          a.participant_id === userParticipant.id && 
          a.question_order === currentQuestionIndex + 1
        )
        
        // Handle both cases: answer exists or timer expired without answer
        const selectedAnswer = userAnswer?.selected_answer || ''
        const isCorrect = selectedAnswer !== '' && selectedAnswer === currentQuestion.correct_answer
        
        // Get explanation from question - handle different possible structures
        let explanation
        if (currentQuestion.explanation && typeof currentQuestion.explanation === 'object') {
          // Explanation is already an object
          explanation = currentQuestion.explanation
        } else if (currentQuestion.explanation_text) {
          // Explanation is stored as text field
          explanation = {
            text: currentQuestion.explanation_text,
            image_url: currentQuestion.explanation_image_url,
            table_data: currentQuestion.explanation_table_data
          }
        } else {
          // No explanation available - create a default one
          explanation = {
            text: 'No explanation available for this question.',
            image_url: undefined,
            table_data: undefined
          }
        }
        
        // Ensure explanation has at least a text property
        if (!explanation.text) {
          explanation.text = 'No explanation available for this question.'
        }
        
        setAnswerResult({
          isCorrect,
          correctAnswer: currentQuestion.correct_answer,
          selectedAnswer: selectedAnswer,
          question: currentQuestion,
          explanation: explanation
        })
      }
    } catch (error) {
      console.error('Error fetching answer result:', error)
    }
  }, [code, questions, currentQuestionIndex])

  // Store fetchAnswerResult in ref for use in checkAnswerStatus
  useEffect(() => {
    fetchAnswerResultRef.current = fetchAnswerResult
  }, [fetchAnswerResult])

  // Handle answer submission
  const handleAnswer = useCallback(async (answer: string, timeTaken: number) => {
    if (!code || answerSubmittedRef.current || isSubmitting || gameState !== 'question') return
    
    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return

    answerSubmittedRef.current = true
    setIsSubmitting(true)
    
    // Store the current timer value from ref (synchronously) before stopping
    setSubmittedTimerValue(timerSecondsRef.current)
    
    // Stop timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

    try {
      const response = await fetch(`/api/quiz/challenges/${code}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          question_order: currentQuestionIndex + 1,
          selected_answer: answer,
          time_taken_seconds: timeTaken,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error?.includes('already submitted')) {
          // Answer already submitted, just update state
          setUserAnswered(true)
          answerSubmittedRef.current = true
          setIsSubmitting(false)
          return
        }
        throw new Error(data.error || 'Failed to submit answer')
      }

      setUserAnswered(true)
      setUserSelectedAnswer(answer) // Store the selected answer to show while waiting
      
      // IMPORTANT: Don't set allAnswered from API response here - let polling handle it
      // The API response might be stale or incorrect due to timing issues
      // We'll rely on the polling mechanism to accurately determine when all have answered
      
      console.log('[handleAnswer] Answer submitted successfully, starting polling:', {
        timestamp: new Date().toISOString(),
        questionIndex: currentQuestionIndex,
        questionId: currentQuestion.id,
        answer,
        timeTaken,
        allAnsweredFromResponse: data.allAnswered,
        answeredCountFromResponse: data.answeredCount,
        totalCountFromResponse: data.totalCount,
        gameState,
        note: 'NOT setting allAnswered from API response - will rely on polling'
      })
      
      // Always start checking for other players via polling
      // Don't rely on immediate allAnswered from API response as it may be stale
      // The polling interval will handle the transition when all players have actually answered
      // Wait a bit before starting to ensure the answer is saved on the server
      setTimeout(() => {
        console.log('[handleAnswer] setTimeout callback executing:', {
          hasInterval: !!answerCheckIntervalRef.current,
          gameState,
          userAnswered,
          allAnsweredFromState: allAnswered
        })
        
        if (!answerCheckIntervalRef.current && gameState === 'question') {
          console.log('[handleAnswer] Starting answer status polling interval')
          answerCheckIntervalRef.current = setInterval(() => {
            console.log('[handleAnswer] Polling interval tick, calling checkAnswerStatus')
            checkAnswerStatus()
          }, 1500) // Reduced from 2000ms to 1500ms for better responsiveness
          // Do an initial check after a delay to allow database to update in production
          // Production databases may have replication lag, so we need more time
          console.log('[handleAnswer] Scheduling initial checkAnswerStatus call after delay')
          setTimeout(() => {
            console.log('[handleAnswer] Doing initial checkAnswerStatus call after delay')
            checkAnswerStatus()
          }, 800) // Delay for production database write propagation
        } else {
          console.log('[handleAnswer] Skipping polling start:', {
            hasInterval: !!answerCheckIntervalRef.current,
            gameState,
            userAnswered,
            allAnsweredFromState: allAnswered
          })
        }
      }, 300) // Reduced from 500ms to 300ms for faster initial check
    } catch (error: any) {
      console.error('Error submitting answer:', error)
      alert(error.message || 'Failed to submit answer. Please try again.')
      answerSubmittedRef.current = false
    } finally {
      setIsSubmitting(false)
    }
  }, [code, questions, currentQuestionIndex, gameState, checkAnswerStatus, fetchAnswerResult])

  // Move to next question
  const moveToNextQuestion = useCallback(() => {
    const isLastQuestion = currentQuestionIndex >= questions.length - 1
    
    if (isLastQuestion) {
      // Game completed - go to results
      router.push(`/games/challenge/${code}/results`)
      return
    }
    
    // Reset state for next question
    setCurrentQuestionIndex(prev => prev + 1)
    setUserAnswered(false)
    setAllAnswered(false)
    setAnswerResult(null)
    setParticipantScores([])
    setUserSelectedAnswer(null) // Reset selected answer for next question
    answerSubmittedRef.current = false
    setTimerSeconds(timeLimit)
    setSubmittedTimerValue(null)
    setAnswerCountdown(null)
    setScoreCountdown(null)
    setGameState('question')
  }, [currentQuestionIndex, questions.length, code, router, timeLimit])

  // Initialize game
  useEffect(() => {
    if (code) {
      fetchChallenge()
    }
  }, [code, fetchChallenge])

  // Timer effect - only runs in 'question' state
  useEffect(() => {
    if (gameState !== 'question' || questions.length === 0 || currentQuestionIndex >= questions.length) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      return
    }

    // Clear any existing timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

    // Reset timer
    setTimerSeconds(timeLimit)
    timerSecondsRef.current = timeLimit // Sync ref

    // Start timer
    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds(prev => {
        const newValue = prev <= 1 ? 0 : prev - 1
        timerSecondsRef.current = newValue // Keep ref in sync
        if (prev <= 1) {
          // Timer expired - auto-submit empty answer
          if (!answerSubmittedRef.current) {
            // Store timer value before submitting
            setSubmittedTimerValue(0)
            // Stop the timer interval
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current)
              timerIntervalRef.current = null
            }
            // Auto-submit empty answer
            handleAnswer('', timeLimit).catch(async (error) => {
              console.error('Error auto-submitting answer on timeout:', error)
              // If submission fails, still mark as answered and fetch result
              setUserAnswered(true)
              answerSubmittedRef.current = true
              setIsSubmitting(false)
              // Fetch answer result to show correct answer
              try {
                await fetchAnswerResult()
                setGameState('showing_answer')
              } catch (fetchError) {
                console.error('Error fetching answer result after timeout:', fetchError)
              }
            })
          }
        }
        return newValue
      })
    }, 1000)

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }, [gameState, currentQuestionIndex, questions.length, timeLimit, handleAnswer, fetchAnswerResult])

  // Check answer status effect - only runs in 'question' state when user has answered
  useEffect(() => {
    console.log('[useEffect answer-check] Effect running:', {
      gameState,
      userAnswered,
      allAnswered,
      hasInterval: !!answerCheckIntervalRef.current
    })
    
    // Stop if not in question state or if all have already answered
    if (gameState !== 'question' || allAnswered) {
      if (answerCheckIntervalRef.current) {
        console.log('[useEffect answer-check] Stopping interval:', {
          reason: gameState !== 'question' ? 'not in question state' : 'all answered',
          gameState,
          allAnswered
        })
        clearInterval(answerCheckIntervalRef.current)
        answerCheckIntervalRef.current = null
      }
      return
    }

    // Only start checking if user has answered and we're still waiting
    // Don't start if already checking
    if (userAnswered && !allAnswered && !answerCheckIntervalRef.current) {
      console.log('[useEffect answer-check] Starting polling interval')
      answerCheckIntervalRef.current = setInterval(() => {
        console.log('[useEffect answer-check] Polling interval tick, calling checkAnswerStatus')
        checkAnswerStatus()
      }, 1500) // Reduced from 2000ms to 1500ms for better responsiveness
    } else {
      console.log('[useEffect answer-check] Not starting interval:', {
        userAnswered,
        allAnswered,
        hasInterval: !!answerCheckIntervalRef.current
      })
    }

    return () => {
      if (answerCheckIntervalRef.current) {
        console.log('[useEffect answer-check] Cleanup: clearing interval')
        clearInterval(answerCheckIntervalRef.current)
        answerCheckIntervalRef.current = null
      }
    }
  }, [gameState, userAnswered, allAnswered, checkAnswerStatus])

  // Handle state transitions with timeouts and countdowns
  useEffect(() => {
    // Clear any existing timeouts and countdowns
    if (answerTimeoutRef.current) {
      clearTimeout(answerTimeoutRef.current)
      answerTimeoutRef.current = null
    }
    if (scoreTimeoutRef.current) {
      clearTimeout(scoreTimeoutRef.current)
      scoreTimeoutRef.current = null
    }
    if (answerCountdownIntervalRef.current) {
      clearInterval(answerCountdownIntervalRef.current)
      answerCountdownIntervalRef.current = null
    }
    if (scoreCountdownIntervalRef.current) {
      clearInterval(scoreCountdownIntervalRef.current)
      scoreCountdownIntervalRef.current = null
    }

    if (gameState === 'showing_answer') {
      // Check if this is the last question
      const isLastQuestion = currentQuestionIndex >= questions.length - 1
      
      // Start countdown for answer section (5 seconds)
      setAnswerCountdown(5)
      answerCountdownIntervalRef.current = setInterval(() => {
        setAnswerCountdown(prev => {
          if (prev === null || prev <= 1) {
            if (answerCountdownIntervalRef.current) {
              clearInterval(answerCountdownIntervalRef.current)
              answerCountdownIntervalRef.current = null
            }
            return null
          }
          return prev - 1
        })
      }, 1000)
      
      // Show answer for 5 seconds, then either show scores or go to results
      answerTimeoutRef.current = setTimeout(async () => {
        setAnswerCountdown(null)
        if (isLastQuestion) {
          // Last question - skip scoreboard and go directly to results
          router.push(`/games/challenge/${code}/results`)
        } else {
          // Fetch fresh scores before showing scoreboard
          await fetchParticipantScores()
          setGameState('showing_scores')
        }
      }, 5000)
    } else if (gameState === 'showing_scores') {
      // Start countdown for scoreboard section (5 seconds)
      setScoreCountdown(5)
      scoreCountdownIntervalRef.current = setInterval(() => {
        setScoreCountdown(prev => {
          if (prev === null || prev <= 1) {
            if (scoreCountdownIntervalRef.current) {
              clearInterval(scoreCountdownIntervalRef.current)
              scoreCountdownIntervalRef.current = null
            }
            return null
          }
          return prev - 1
        })
      }, 1000)
      
      // Show scores for 5 seconds, then move to next question
      scoreTimeoutRef.current = setTimeout(() => {
        setScoreCountdown(null)
        moveToNextQuestion()
      }, 5000)
    } else {
      // Reset countdowns when not in these states
      setAnswerCountdown(null)
      setScoreCountdown(null)
    }

    return () => {
      if (answerTimeoutRef.current) {
        clearTimeout(answerTimeoutRef.current)
        answerTimeoutRef.current = null
      }
      if (scoreTimeoutRef.current) {
        clearTimeout(scoreTimeoutRef.current)
        scoreTimeoutRef.current = null
      }
      if (answerCountdownIntervalRef.current) {
        clearInterval(answerCountdownIntervalRef.current)
        answerCountdownIntervalRef.current = null
      }
      if (scoreCountdownIntervalRef.current) {
        clearInterval(scoreCountdownIntervalRef.current)
        scoreCountdownIntervalRef.current = null
      }
    }
  }, [gameState, fetchParticipantScores, moveToNextQuestion, currentQuestionIndex, questions.length, code, router])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
      if (answerCheckIntervalRef.current) {
        clearInterval(answerCheckIntervalRef.current)
      }
      if (answerTimeoutRef.current) {
        clearTimeout(answerTimeoutRef.current)
      }
      if (scoreTimeoutRef.current) {
        clearTimeout(scoreTimeoutRef.current)
      }
    }
  }, [])

  // Handle exit
  const handleExit = useCallback(() => {
    setShowExitDialog(true)
  }, [])

  const confirmExit = useCallback(() => {
    // Redirect to challenge list page
    router.push('/games/challenge')
  }, [router])

  if (loading || gameState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-700">Loading game...</div>
        </div>
      </div>
    )
  }

  if (questions.length === 0 || currentQuestionIndex >= questions.length) {
    return null
  }

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex >= questions.length - 1

  return (
    <div className="min-h-screen bg-gray-50 -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          </div>
        </div>
        <button
          onClick={handleExit}
          className="text-sm text-gray-600 hover:text-gray-800 underline px-3 py-1 rounded hover:bg-gray-100 transition-colors"
        >
          Exit Game
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Question Phase */}
        {gameState === 'question' && (
          <>
            <QuestionDisplay
              key={currentQuestion.id}
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              onAnswer={handleAnswer}
              timerSeconds={timerSeconds}
              disabled={userAnswered || isSubmitting}
              selectedAnswer={userSelectedAnswer || answerResult?.selectedAnswer}
              correctAnswer={answerResult?.correctAnswer}
              showSkipButton={false}
            />
            
            {/* Waiting for other players */}
            {userAnswered && !allAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center"
              >
                <div className="text-lg font-medium text-blue-900 mb-2">
                  Waiting for other players...
                </div>
                <div className="text-sm text-blue-700">
                  You've submitted your answer. Please wait while others finish.
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Showing Answer Phase - Show question with correct answer highlighted */}
        {gameState === 'showing_answer' && answerResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <QuestionDisplay
              key={`answer-${currentQuestion.id}`}
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              onAnswer={() => {}} // Disabled
              timerSeconds={submittedTimerValue ?? 0}
              disabled={true}
              selectedAnswer={answerResult.selectedAnswer}
              correctAnswer={answerResult.correctAnswer}
              showSkipButton={false}
            />
            {/* Show result message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-4 rounded-lg border-2 ${
                answerResult.isCorrect
                  ? 'bg-green-50 border-green-500'
                  : 'bg-red-50 border-red-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {answerResult.isCorrect ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      <div>
                        <div className="font-bold text-green-600">Correct!</div>
                        <div className="text-sm text-green-700">Well done!</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-red-600" />
                      <div>
                        <div className="font-bold text-red-600">Incorrect</div>
                        <div className="text-sm text-red-700">
                          The correct answer is <span className="font-bold">{answerResult.correctAnswer}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {answerCountdown !== null && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg"
                  >
                    <Clock className="w-4 h-4" />
                    <span className="font-bold text-lg">{answerCountdown}</span>
                    <span className="text-sm font-medium">s</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Showing Scores Phase */}
        {gameState === 'showing_scores' && participantScores.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Scoreboard Update</h2>
              </div>
              {scoreCountdown !== null && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-full shadow-lg"
                >
                  <Clock className="w-4 h-4" />
                  <span className="font-bold text-lg">{scoreCountdown}</span>
                  <span className="text-sm font-medium">s</span>
                </motion.div>
              )}
            </div>
            <div className="space-y-2">
              {participantScores.map((participant: any, index: number) => {
                // Handle both user (singular) and users (plural) from API
                const user = participant.user || participant.users
                const name = user?.name || user?.email || 'Player'
                const avatarUrl = user?.profile_picture_url
                
                // Top 3 get special styling
                const isTopThree = index < 3
                const rankColors = {
                  0: { // 1st place - Gold
                    bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
                    border: 'border-2 border-yellow-500',
                    text: 'text-yellow-900',
                    badge: 'bg-yellow-500 text-white',
                    cardBg: 'bg-gradient-to-r from-yellow-50 to-yellow-100'
                  },
                  1: { // 2nd place - Silver
                    bg: 'bg-gradient-to-br from-gray-300 to-gray-400',
                    border: 'border-2 border-gray-400',
                    text: 'text-gray-800',
                    badge: 'bg-gray-400 text-white',
                    cardBg: 'bg-gradient-to-r from-gray-50 to-gray-100'
                  },
                  2: { // 3rd place - Bronze
                    bg: 'bg-gradient-to-br from-orange-400 to-orange-600',
                    border: 'border-2 border-orange-500',
                    text: 'text-orange-900',
                    badge: 'bg-orange-500 text-white',
                    cardBg: 'bg-gradient-to-r from-orange-50 to-orange-100'
                  }
                }
                
                const colors = isTopThree ? rankColors[index as 0 | 1 | 2] : {
                  bg: 'bg-gray-200',
                  border: 'border border-gray-300',
                  text: 'text-gray-600',
                  badge: 'bg-gray-300 text-gray-700',
                  cardBg: 'bg-gray-50'
                }
                
                return (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center justify-between p-4 rounded-lg ${colors.cardBg} ${colors.border} ${
                      isTopThree ? 'shadow-md' : 'shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold overflow-hidden ${colors.bg} ${colors.text} shadow-lg`}>
                        {avatarUrl ? (
                          <img 
                            src={avatarUrl} 
                            alt={name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to number if image fails to load
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const parent = target.parentElement
                              if (parent) {
                                parent.textContent = String(index + 1)
                              }
                            }}
                          />
                        ) : (
                          <span className="text-lg">{index + 1}</span>
                        )}
                      </div>
                      <div>
                        <div className={`font-semibold ${isTopThree ? 'text-lg' : 'text-base'} ${colors.text}`}>
                          {name}
                        </div>
                        {isTopThree && (
                          <div className={`text-xs font-medium ${colors.text} opacity-75 mt-0.5`}>
                            {index === 0 ? '🥇 Champion' : index === 1 ? '🥈 Runner-up' : '🥉 Third Place'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`font-bold ${isTopThree ? 'text-xl' : 'text-lg'} ${colors.text}`}>
                      {participant.score || 0} pts
                    </div>
                  </motion.div>
                )
              })}
            </div>
            {!isLastQuestion && (
              <div className="mt-4 text-center text-sm text-gray-600">
                Moving to next question...
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Exit Confirmation Dialog */}
      <ConfirmationDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        onConfirm={confirmExit}
        onCancel={() => setShowExitDialog(false)}
        title="Exit Game"
        description="Are you sure you want to exit? Your progress will be saved."
        confirmText="Exit"
        cancelText="Continue"
        variant="warning"
        icon={<LogOut className="h-6 w-6 text-orange-500" />}
      />
    </div>
  )
}
