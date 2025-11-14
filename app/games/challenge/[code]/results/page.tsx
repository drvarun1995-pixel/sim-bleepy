'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Trophy, Medal, Award, RotateCcw, Home, Crown, Star, TrendingUp, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Hash } from 'lucide-react'
import { motion } from 'framer-motion'
import { playSound } from '@/lib/quiz/sounds'
import { resolveUserAvatar } from '@/lib/quiz/avatar'

export default function ChallengeResultsPage() {
  const params = useParams()
  const code = params.code as string
  const router = useRouter()
  const { data: session } = useSession()
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [questionsToShow, setQuestionsToShow] = useState(10)
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set())
  const QUESTIONS_PER_PAGE = 10

  const fetchResults = useCallback(async () => {
    if (!code || typeof code !== 'string') {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/quiz/challenges/${code}/results`)
      if (!response.ok) throw new Error('Failed to fetch results')
      const data = await response.json()
      setResults(data)
      // Play celebration sound when results load
      if (!hasAnimated) {
        playSound.allReady()
        setHasAnimated(true)
      }
    } catch (error) {
      console.error('Error fetching results:', error)
    } finally {
      setLoading(false)
    }
  }, [code, hasAnimated])

  useEffect(() => {
    if (code) {
      fetchResults()
      setQuestionsToShow(QUESTIONS_PER_PAGE)
    }
  }, [code, fetchResults])

  const handleLoadMore = useCallback(() => {
    setQuestionsToShow(prev => {
      const previousCount = prev
      const newCount = prev + QUESTIONS_PER_PAGE
      
      requestAnimationFrame(() => {
        setTimeout(() => {
          const firstNewQuestion = document.querySelector(`[data-question-card="${previousCount}"]`)
          if (firstNewQuestion) {
            firstNewQuestion.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      })
      
      return newCount
    })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />
          </motion.div>
          <p className="text-gray-600 font-medium">Loading results...</p>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-600">No results found</p>
        </div>
      </div>
    )
  }

  const { participants } = results
  const sortedParticipants = [...participants].sort((a: any, b: any) => b.final_score - a.final_score)
  const topThree = sortedParticipants.slice(0, 3)
  const rest = sortedParticipants.slice(3)

  const getParticipantAvatar = (participant: any) => resolveUserAvatar(participant?.users)

  const topThreeAvatars = topThree.map(getParticipantAvatar)

  const getInitials = (name: string): string => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const getAvatarColor = (userId: string): string => {
    const colors = [
      'bg-gradient-to-br from-yellow-400 to-yellow-600',
      'bg-gradient-to-br from-gray-300 to-gray-500',
      'bg-gradient-to-br from-amber-500 to-amber-700',
      'bg-gradient-to-br from-blue-500 to-blue-700',
      'bg-gradient-to-br from-green-500 to-green-700',
      'bg-gradient-to-br from-purple-500 to-purple-700',
      'bg-gradient-to-br from-pink-500 to-pink-700',
      'bg-gradient-to-br from-indigo-500 to-indigo-700'
    ]
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const calculateAccuracy = (correct: number, total: number): number => {
    if (total === 0) return 0
    return Math.round((correct / total) * 100)
  }

  // Get current user's answers and match with questions
  const getCurrentUserAnswers = () => {
    if (!results || !results.currentUserParticipantId) return []
    
    // Get user's answers using currentUserParticipantId from results
    const userAnswers = results.allAnswers?.filter((a: any) => 
      a.participant_id === results.currentUserParticipantId
    ) || []
    
    // Match answers with questions - sort answers by question_order first
    const sortedAnswers = [...userAnswers].sort((a: any, b: any) => 
      (a.question_order || 0) - (b.question_order || 0)
    )
    
    // Create a map of questions by ID for quick lookup
    const questionMap = new Map(results.questions?.map((q: any) => [q.id, q]) || [])
    
    // Match answers with questions in question_order sequence
    const questionsWithAnswers = sortedAnswers.map((answer: any) => {
      const question = questionMap.get(answer.question_id) as any
      if (!question) return null
      
      const selectedAnswer = answer.selected_answer || null
      const correctAnswer = question?.correct_answer
      // Check if answered (answered_at is set) - timeouts have null selected_answer but answered_at is set
      const isAnswered = answer.answered_at !== null && answer.answered_at !== undefined
      const isCorrect = selectedAnswer && selectedAnswer === correctAnswer
      // Unanswered means answered_at is null/undefined OR (answered_at is set but selected_answer is null/empty - timeout)
      const isUnanswered = !isAnswered || (isAnswered && (!selectedAnswer || selectedAnswer === ''))
      
      return {
        question,
        answer,
        selectedAnswer,
        correctAnswer,
        isCorrect,
        isUnanswered,
        questionOrder: answer.question_order || 0
      }
    }).filter((item: any) => item !== null)
    
    return questionsWithAnswers
  }

  const getOptionText = (question: any, option: string): string => {
    const optionMap: { [key: string]: string } = {
      'A': question.option_a || '',
      'B': question.option_b || '',
      'C': question.option_c || '',
      'D': question.option_d || '',
      'E': question.option_e || ''
    }
    return optionMap[option] || ''
  }

  const stripHtmlTags = (html: string): string => {
    if (!html) return ''
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  const questionsWithAnswers = getCurrentUserAnswers()
  const displayedQuestions = questionsWithAnswers.slice(0, questionsToShow)
  const remainingQuestions = questionsWithAnswers.length - questionsToShow
  const hasMoreQuestions = remainingQuestions > 0

  const toggleQuestion = (index: number) => {
    setExpandedQuestions(prev => {
      const newSet = new Set<number>()
      // If the clicked question is already expanded, close it (empty set)
      // Otherwise, expand only this question (close any previously expanded)
      if (!prev.has(index)) {
        newSet.add(index)
      }
      return newSet
    })
  }

  const scrollToQuestion = (index: number) => {
    const questionElement = document.querySelector(`[data-question-card="${index}"]`)
    if (questionElement) {
      questionElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // Close any currently expanded question and expand only the clicked one
      setExpandedQuestions(new Set([index]))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
            className="inline-block"
          >
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto drop-shadow-lg" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Challenge Complete!
          </h1>
          <p className="text-gray-600 text-lg">Final Rankings</p>
        </motion.div>

        {/* Podium for Top 3 */}
        {topThree.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white rounded-3xl shadow-2xl p-8 md:p-12"
          >
            <h2 className="text-2xl font-bold text-center mb-8 md:mb-10 flex items-center justify-center gap-2 relative z-10">
              <Crown className="w-6 h-6 text-yellow-500" />
              <span className="bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                Top Performers
              </span>
            </h2>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6 items-end justify-items-center mb-6 md:mb-8 px-1 sm:px-4">
              {/* 2nd Place - left */}
              {topThree[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="w-full max-w-[150px] sm:max-w-[180px] md:max-w-[200px] text-center flex flex-col items-center"
                >
                  <div className="relative mb-2 md:mb-4 pt-8 md:pt-0">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, -5, 5, 0]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 2
                      }}
                      className="absolute top-0 md:-top-12 left-1/2 transform -translate-x-1/2 z-10"
                    >
                      <Medal className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-400 drop-shadow-lg" />
                    </motion.div>
                    {topThreeAvatars[1] ? (
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full mx-auto overflow-hidden border-2 border-gray-300 shadow-lg mb-2">
                        <img
                          src={topThreeAvatars[1]!}
                          alt={topThree[1].users?.name || 'Anonymous'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement | null
                            if (fallback) fallback.style.display = 'flex'
                          }}
                        />
                        <span className="hidden absolute inset-0 items-center justify-center text-white font-bold text-base">
                          {getInitials(topThree[1].users?.name || topThree[1].user_id || '?')}
                        </span>
                      </div>
                    ) : (
                      <div className={`${getAvatarColor(topThree[1].user_id)} w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full mx-auto flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg mb-2`}>
                        {getInitials(topThree[1].users?.name || topThree[1].user_id || '?')}
                      </div>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 shadow-lg border border-gray-300 mx-auto w-full mt-auto">
                    <div className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-600 mb-1">2ND PLACE</div>
                    <div className="font-bold text-gray-800 text-xs sm:text-sm md:text-base mb-1 break-words px-1 min-h-[1.25rem] flex items-center justify-center" title={topThree[1].users?.name || 'Anonymous'}>
                      <span className="line-clamp-2 text-center">{topThree[1].users?.name || 'Anonymous'}</span>
                    </div>
                    <div className="text-base sm:text-lg md:text-2xl font-bold text-gray-700 mb-1 md:mb-2">
                      {topThree[1].final_score.toLocaleString()}
                    </div>
                    <div className="text-[8px] sm:text-[9px] md:text-xs text-gray-600 break-words">
                      {topThree[1].correct_answers}/{topThree[1].questions_answered} correct
                    </div>
                    <div className="text-[8px] sm:text-[9px] md:text-xs font-semibold text-gray-700 mt-0.5 md:mt-1">
                      {calculateAccuracy(topThree[1].correct_answers, topThree[1].questions_answered)}% accuracy
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 1st Place - center */}
              {topThree[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="w-full max-w-[170px] sm:max-w-[210px] md:max-w-[240px] text-center flex flex-col items-center"
                >
                  <div className="relative mb-2 md:mb-4 pt-8 md:pt-12">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0],
                        y: [0, -10, 0]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1.5
                      }}
                      className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none"
                      style={{ willChange: 'transform' }}
                    >
                      <Crown className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-yellow-500 drop-shadow-2xl" />
                    </motion.div>
                    {topThreeAvatars[0] ? (
                      <motion.div
                        animate={{ 
                          scale: [1, 1.05, 1],
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity
                        }}
                        className="w-14 h-14 sm:w-18 sm:h-18 md:w-24 md:h-24 rounded-full mx-auto overflow-hidden border-4 border-yellow-300 shadow-2xl mb-2 relative z-0"
                      >
                        <img
                          src={topThreeAvatars[0]!}
                          alt={topThree[0].users?.name || 'Anonymous'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement | null
                            if (fallback) fallback.style.display = 'flex'
                          }}
                        />
                        <span className="hidden absolute inset-0 items-center justify-center text-white font-bold text-lg sm:text-xl md:text-2xl">
                          {getInitials(topThree[0].users?.name || topThree[0].user_id || '?')}
                        </span>
                      </motion.div>
                    ) : (
                      <motion.div
                        animate={{ 
                          scale: [1, 1.05, 1],
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity
                        }}
                        className={`${getAvatarColor(topThree[0].user_id)} w-14 h-14 sm:w-18 sm:h-18 md:w-24 md:h-24 rounded-full mx-auto flex items-center justify-center text-white font-bold text-lg sm:text-xl md:text-2xl shadow-2xl mb-2 ring-2 sm:ring-4 ring-yellow-300`}
                      >
                        {getInitials(topThree[0].users?.name || topThree[0].user_id || '?')}
                      </motion.div>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-yellow-100 via-yellow-200 to-amber-200 rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 shadow-2xl border-2 sm:border-4 border-yellow-400 relative overflow-hidden mx-auto w-full mt-auto">
                    <motion.div
                      animate={{ 
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300 to-transparent"
                    />
                    <div className="relative z-10">
                      <div className="text-[9px] sm:text-[10px] md:text-xs font-bold text-yellow-800 mb-1 flex items-center justify-center gap-1">
                        <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 fill-yellow-600" />
                        CHAMPION
                        <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 fill-yellow-600" />
                      </div>
                      <div className="font-bold text-gray-900 text-sm sm:text-lg md:text-xl mb-1 break-words px-1 min-h-[1.5rem] flex items-center justify-center" title={topThree[0].users?.name || 'Anonymous'}>
                        <span className="line-clamp-2 text-center">{topThree[0].users?.name || 'Anonymous'}</span>
                      </div>
                      <div className="text-lg sm:text-2xl md:text-3xl font-bold text-yellow-900 mb-1 md:mb-2">
                        {topThree[0].final_score.toLocaleString()}
                      </div>
                      <div className="text-[10px] sm:text-xs md:text-sm text-yellow-800 font-medium break-words">
                        {topThree[0].correct_answers}/{topThree[0].questions_answered} correct
                      </div>
                      <div className="text-[10px] sm:text-xs md:text-sm font-bold text-yellow-900 mt-0.5 md:mt-1">
                        {calculateAccuracy(topThree[0].correct_answers, topThree[0].questions_answered)}% accuracy
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 3rd Place - right */}
              {topThree[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="w-full max-w-[150px] sm:max-w-[180px] md:max-w-[200px] text-center flex flex-col items-center"
                >
                  <div className="relative mb-2 md:mb-4 pt-8 md:pt-0">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 2.5
                      }}
                      className="absolute top-0 md:-top-12 left-1/2 transform -translate-x-1/2 z-10"
                    >
                      <Award className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-amber-600 drop-shadow-lg" />
                    </motion.div>
                    {topThreeAvatars[2] ? (
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full mx-auto overflow-hidden border-2 border-amber-400 shadow-lg mb-2">
                        <img
                          src={topThreeAvatars[2]!}
                          alt={topThree[2].users?.name || 'Anonymous'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement | null
                            if (fallback) fallback.style.display = 'flex'
                          }}
                        />
                        <span className="hidden absolute inset-0 items-center justify-center text-white font-bold text-base">
                          {getInitials(topThree[2].users?.name || topThree[2].user_id || '?')}
                        </span>
                      </div>
                    ) : (
                      <div className={`${getAvatarColor(topThree[2].user_id)} w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full mx-auto flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg mb-2`}>
                        {getInitials(topThree[2].users?.name || topThree[2].user_id || '?')}
                      </div>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 shadow-lg border border-amber-400 mx-auto w-full mt-auto">
                    <div className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-amber-800 mb-1">3RD PLACE</div>
                    <div className="font-bold text-gray-800 text-xs sm:text-sm md:text-base mb-1 break-words px-1 min-h-[1.25rem] flex items-center justify-center" title={topThree[2].users?.name || 'Anonymous'}>
                      <span className="line-clamp-2 text-center">{topThree[2].users?.name || 'Anonymous'}</span>
                    </div>
                    <div className="text-base sm:text-lg md:text-2xl font-bold text-amber-800 mb-1 md:mb-2">
                      {topThree[2].final_score.toLocaleString()}
                    </div>
                    <div className="text-[8px] sm:text-[9px] md:text-xs text-amber-700 break-words">
                      {topThree[2].correct_answers}/{topThree[2].questions_answered} correct
                    </div>
                    <div className="text-[8px] sm:text-[9px] md:text-xs font-semibold text-amber-800 mt-0.5 md:mt-1">
                      {calculateAccuracy(topThree[2].correct_answers, topThree[2].questions_answered)}% accuracy
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Rest of Participants */}
        {rest.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white rounded-2xl shadow-xl p-6 md:p-8"
          >
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>All Participants</span>
            </h3>
            <div className="space-y-3">
              {rest.map((participant: any, index: number) => {
                const rank = index + 4
                const accuracy = calculateAccuracy(participant.correct_answers, participant.questions_answered)
                const avatarUrl = getParticipantAvatar(participant)
                const initials = getInitials(participant.users?.name || participant.user_id || '?')
                return (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 transition-all"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-10 text-center">
                        <span className="text-lg font-bold text-gray-500">#{rank}</span>
                      </div>
                      {avatarUrl ? (
                        <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden border-2 border-gray-300 relative">
                          <img
                            src={avatarUrl}
                            alt={participant.users?.name || 'Anonymous'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement | null
                              if (fallback) fallback.style.display = 'flex'
                            }}
                          />
                          <span className="hidden absolute inset-0 items-center justify-center text-white font-semibold text-sm">
                            {initials}
                          </span>
                        </div>
                      ) : (
                        <div className={`${getAvatarColor(participant.user_id)} w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
                          {initials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate" title={participant.users?.name || 'Anonymous'}>
                          {participant.users?.name || 'Anonymous'}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            {participant.correct_answers} correct
                          </span>
                          <span className="flex items-center gap-1">
                            <XCircle className="w-4 h-4 text-red-600" />
                            {participant.questions_answered - participant.correct_answers} incorrect
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-500" />
                            {accuracy}% accuracy
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <div className="text-2xl font-bold text-gray-800">
                        {participant.final_score.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 text-right">points</div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Question Review Section */}
        {questionsWithAnswers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="bg-white rounded-2xl shadow-xl p-6 md:p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Question Review ({questionsWithAnswers.length} {questionsWithAnswers.length === 1 ? 'question' : 'questions'})
              </h2>
            </div>

            {/* Question Navigation Box */}
            <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Hash className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Jump to Question</h3>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-10 gap-2">
                {questionsWithAnswers.map((item: any, index: number) => {
                  const { isCorrect, isUnanswered } = item
                  let bgColor = 'bg-gray-200 hover:bg-gray-300'
                  let textColor = 'text-gray-700'
                  
                  if (isCorrect) {
                    bgColor = 'bg-green-500 hover:bg-green-600'
                    textColor = 'text-white'
                  } else if (isUnanswered) {
                    bgColor = 'bg-gray-400 hover:bg-gray-500'
                    textColor = 'text-white'
                  } else {
                    bgColor = 'bg-red-500 hover:bg-red-600'
                    textColor = 'text-white'
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => scrollToQuestion(index)}
                      className={`${bgColor} ${textColor} aspect-square rounded-lg font-bold text-sm sm:text-base transition-all hover:scale-110 hover:shadow-lg active:scale-95`}
                      title={`Question ${index + 1} - ${isCorrect ? 'Correct' : isUnanswered ? 'Not Answered' : 'Incorrect'}`}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-6">
              {displayedQuestions.map((item: any, displayIndex: number) => {
                const { question, selectedAnswer, correctAnswer, isCorrect, isUnanswered } = item
                if (!question) return null
                
                const actualQuestionNumber = displayIndex + 1

                const isExpanded = expandedQuestions.has(displayIndex)

                return (
                  <div
                    key={question.id || displayIndex}
                    data-question-card={displayIndex}
                    className={`border-2 rounded-lg overflow-hidden transition-all ${
                      isCorrect
                        ? 'border-green-500 bg-green-50'
                        : isUnanswered
                        ? 'border-gray-400 bg-gray-50'
                        : 'border-red-500 bg-red-50'
                    }`}
                  >
                    {/* Question Header - Always Visible */}
                    <button
                      onClick={() => toggleQuestion(displayIndex)}
                      className="w-full p-6 flex items-center justify-between hover:bg-opacity-80 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
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
                      <div className="flex-shrink-0 ml-4">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                    </button>

                    {/* Question Content - Collapsible */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="px-6 pb-6 space-y-4"
                      >

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
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Load More Button */}
            {hasMoreQuestions && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleLoadMore}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  <ChevronDown className="w-5 h-5" />
                  Load {Math.min(QUESTIONS_PER_PAGE, remainingQuestions)} More Questions
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/games/challenge')}
            className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            <RotateCcw className="w-6 h-6" />
            New Challenge
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/games')}
            className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            <Home className="w-6 h-6" />
            Back to Games
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}

