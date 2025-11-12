'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Trophy, Medal, Award, RotateCcw, Home, Crown, Star, TrendingUp, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { playSound } from '@/lib/quiz/sounds'

export default function ChallengeResultsPage() {
  const params = useParams()
  const code = params.code as string
  const router = useRouter()
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasAnimated, setHasAnimated] = useState(false)

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
    }
  }, [code, fetchResults])

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
            <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              <span className="bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                Top Performers
              </span>
            </h2>
            
            <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-4 md:gap-4 lg:gap-8 mb-8 px-2">
              {/* 2nd Place */}
              {topThree[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="w-full max-w-[280px] md:flex-1 md:max-w-[200px] text-center order-2 md:order-1"
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
                    {topThree[1].users?.profile_picture_url ? (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full mx-auto overflow-hidden border-2 border-gray-300 shadow-lg mb-2">
                        <img
                          src={topThree[1].users.profile_picture_url}
                          alt={topThree[1].users?.name || 'Anonymous'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`${getAvatarColor(topThree[1].user_id)} w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full mx-auto flex items-center justify-center text-white font-bold text-base sm:text-lg md:text-xl shadow-lg mb-2`}>
                        {getInitials(topThree[1].users?.name || topThree[1].user_id || '?')}
                      </div>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl md:rounded-2xl p-3 sm:p-3 md:p-4 shadow-lg border-2 border-gray-300 mx-auto max-w-full">
                    <div className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-600 mb-1">2ND PLACE</div>
                    <div className="font-bold text-gray-800 text-sm sm:text-base md:text-lg mb-1 break-words px-1 min-h-[1.5rem] flex items-center justify-center" title={topThree[1].users?.name || 'Anonymous'}>
                      <span className="line-clamp-2 text-center">{topThree[1].users?.name || 'Anonymous'}</span>
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-700 mb-1 md:mb-2">
                      {topThree[1].final_score.toLocaleString()}
                    </div>
                    <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-600 break-words">
                      {topThree[1].correct_answers}/{topThree[1].questions_answered} correct
                    </div>
                    <div className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-700 mt-0.5 md:mt-1">
                      {calculateAccuracy(topThree[1].correct_answers, topThree[1].questions_answered)}% accuracy
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="w-full max-w-[320px] md:flex-1 md:max-w-[240px] text-center order-1 md:order-2"
                >
                  <div className="relative mb-2 md:mb-4 pt-10 md:pt-0">
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
                      className="absolute top-0 md:-top-16 left-1/2 transform -translate-x-1/2 z-10"
                    >
                      <Crown className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-yellow-500 drop-shadow-2xl" />
                    </motion.div>
                    {topThree[0].users?.profile_picture_url ? (
                      <motion.div
                        animate={{ 
                          scale: [1, 1.05, 1],
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity
                        }}
                        className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full mx-auto overflow-hidden border-4 border-yellow-300 shadow-2xl mb-2"
                      >
                        <img
                          src={topThree[0].users.profile_picture_url}
                          alt={topThree[0].users?.name || 'Anonymous'}
                          className="w-full h-full object-cover"
                        />
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
                        className={`${getAvatarColor(topThree[0].user_id)} w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full mx-auto flex items-center justify-center text-white font-bold text-lg sm:text-xl md:text-2xl shadow-2xl mb-2 ring-2 sm:ring-4 ring-yellow-300`}
                      >
                        {getInitials(topThree[0].users?.name || topThree[0].user_id || '?')}
                      </motion.div>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-yellow-100 via-yellow-200 to-amber-200 rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 shadow-2xl border-2 sm:border-4 border-yellow-400 relative overflow-hidden mx-auto max-w-full">
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
                      <div className="font-bold text-gray-900 text-base sm:text-lg md:text-xl mb-1 break-words px-1 min-h-[1.5rem] flex items-center justify-center" title={topThree[0].users?.name || 'Anonymous'}>
                        <span className="line-clamp-2 text-center">{topThree[0].users?.name || 'Anonymous'}</span>
                      </div>
                      <div className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-900 mb-1 md:mb-2">
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

              {/* 3rd Place */}
              {topThree[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="w-full max-w-[280px] md:flex-1 md:max-w-[200px] text-center order-3"
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
                    {topThree[2].users?.profile_picture_url ? (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full mx-auto overflow-hidden border-2 border-amber-400 shadow-lg mb-2">
                        <img
                          src={topThree[2].users.profile_picture_url}
                          alt={topThree[2].users?.name || 'Anonymous'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`${getAvatarColor(topThree[2].user_id)} w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full mx-auto flex items-center justify-center text-white font-bold text-base sm:text-lg md:text-xl shadow-lg mb-2`}>
                        {getInitials(topThree[2].users?.name || topThree[2].user_id || '?')}
                      </div>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl md:rounded-2xl p-3 sm:p-3 md:p-4 shadow-lg border-2 border-amber-400 mx-auto max-w-full">
                    <div className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-amber-800 mb-1">3RD PLACE</div>
                    <div className="font-bold text-gray-800 text-sm sm:text-base md:text-lg mb-1 break-words px-1 min-h-[1.5rem] flex items-center justify-center" title={topThree[2].users?.name || 'Anonymous'}>
                      <span className="line-clamp-2 text-center">{topThree[2].users?.name || 'Anonymous'}</span>
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-amber-800 mb-1 md:mb-2">
                      {topThree[2].final_score.toLocaleString()}
                    </div>
                    <div className="text-[9px] sm:text-[10px] md:text-xs text-amber-700 break-words">
                      {topThree[2].correct_answers}/{topThree[2].questions_answered} correct
                    </div>
                    <div className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-amber-800 mt-0.5 md:mt-1">
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
                      {participant.users?.profile_picture_url ? (
                        <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden border-2 border-gray-300">
                          <img
                            src={participant.users.profile_picture_url}
                            alt={participant.users?.name || 'Anonymous'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to initials if image fails to load
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const parent = target.parentElement
                              if (parent) {
                                parent.className = `${getAvatarColor(participant.user_id)} w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`
                                parent.textContent = getInitials(participant.users?.name || participant.user_id || '?')
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className={`${getAvatarColor(participant.user_id)} w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
                          {getInitials(participant.users?.name || participant.user_id || '?')}
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

