'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

interface QuestionDisplayProps {
  question: Question
  questionNumber: number
  totalQuestions: number
  onAnswer: (answer: string, timeTaken: number, isTimeout?: boolean) => void
  timerSeconds: number
  resetSubmission?: number // Key that changes to reset submission state
  disabled?: boolean // Disable interaction when showing explanation
  selectedAnswer?: string // The answer that was selected (for highlighting)
  correctAnswer?: string // The correct answer (for highlighting)
  onSkip?: () => void // Optional skip handler (if not provided, skip button won't show)
  showSkipButton?: boolean // Whether to show skip button in the question area
}

export function QuestionDisplay({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  timerSeconds,
  resetSubmission = 0,
  disabled = false,
  selectedAnswer: propSelectedAnswer,
  correctAnswer,
  onSkip,
  showSkipButton = true, // Default to true for backward compatibility
}: QuestionDisplayProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [timeStarted, setTimeStarted] = useState(Date.now())
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Reset selection and timer when question changes
  useEffect(() => {
    setSelectedAnswer(null)
    setTimeStarted(Date.now())
    setIsSubmitting(false)
  }, [question.id])
  
  // Reset submission state when resetSubmission key changes (for error recovery)
  useEffect(() => {
    if (resetSubmission > 0) {
      setIsSubmitting(false)
    }
  }, [resetSubmission])

  const handleSubmit = () => {
    if (!selectedAnswer || isSubmitting) return
    setIsSubmitting(true)
    const timeTaken = Math.floor((Date.now() - timeStarted) / 1000)
    onAnswer(selectedAnswer, timeTaken, false)
  }

  const handleSkip = () => {
    if (isSubmitting) return
    if (onSkip) {
      // If onSkip is provided, use it (for external skip handler)
      setIsSubmitting(true)
      onSkip()
    } else {
      // Default behavior: submit empty answer
      setIsSubmitting(true)
      const timeTaken = Math.floor((Date.now() - timeStarted) / 1000)
      onAnswer('', timeTaken, false) // Empty string means skip
    }
  }

  const options = [
    { key: 'A', text: question.option_a },
    { key: 'B', text: question.option_b },
    { key: 'C', text: question.option_c },
    { key: 'D', text: question.option_d },
    { key: 'E', text: question.option_e },
  ]

  const progress = (questionNumber / totalQuestions) * 100
  const timeRemaining = Math.max(0, timerSeconds)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div className="bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Timer and Question Number */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Question {questionNumber} of {totalQuestions}
        </div>
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Clock className="w-5 h-5" />
          <span className={timeRemaining <= 10 ? 'text-red-600' : ''}>
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Question Card with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="bg-white p-6 rounded-lg shadow-lg space-y-6"
        >
          {/* Scenario */}
          {question.scenario_text && (
            <div className="prose max-w-none">
              <div className="announcement-content" dangerouslySetInnerHTML={{ __html: question.scenario_text }} />
            </div>
          )}

          {question.scenario_image_url && (
            <div className="flex justify-center">
              <img
                src={question.scenario_image_url}
                alt="Scenario"
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )}

          {/* Question */}
          <div>
            <h2 className="text-xl font-semibold mb-4">{question.question_text}</h2>
          </div>

          {/* Answer Options */}
          <div className="space-y-3">
            {options.map((option) => {
              // Use prop selected answer if disabled (showing explanation), otherwise use local state
              const isSelected = disabled ? (propSelectedAnswer === option.key) : (selectedAnswer === option.key)
              const isCorrect = correctAnswer === option.key
              const isSelectedAndWrong = isSelected && !isCorrect && correctAnswer
              
              // Determine styling
              let optionBorderColor = 'border-gray-200'
              let optionBgColor = 'bg-white'
              let optionBadgeColor = 'bg-gray-200 text-gray-700'
              
              if (disabled && correctAnswer) {
                // Show answer highlights when disabled (explanation is showing)
                if (isSelected && isCorrect) {
                  // User selected correct answer
                  optionBorderColor = 'border-green-500'
                  optionBgColor = 'bg-green-50'
                  optionBadgeColor = 'bg-green-600 text-white'
                } else if (isSelected && !isCorrect) {
                  // User selected wrong answer
                  optionBorderColor = 'border-red-500'
                  optionBgColor = 'bg-red-50'
                  optionBadgeColor = 'bg-red-600 text-white'
                } else if (!isSelected && isCorrect) {
                  // Correct answer (user didn't select it)
                  optionBorderColor = 'border-green-500'
                  optionBgColor = 'bg-green-50'
                  optionBadgeColor = 'bg-green-600 text-white'
                }
              } else if (disabled && !correctAnswer && isSelected) {
                // Waiting for others - show user's selection
                optionBorderColor = 'border-blue-600'
                optionBgColor = 'bg-blue-50'
                optionBadgeColor = 'bg-blue-600 text-white'
              } else if (!disabled) {
                // Normal state - user can select
                if (isSelected) {
                  optionBorderColor = 'border-blue-600'
                  optionBgColor = 'bg-blue-50'
                  optionBadgeColor = 'bg-blue-600 text-white'
                }
              }
              
              return (
                <motion.button
                  key={option.key}
                  onClick={() => !disabled && setSelectedAnswer(option.key)}
                  disabled={disabled}
                  whileHover={disabled ? {} : { scale: 1.01 }}
                  whileTap={disabled ? {} : { scale: 0.99 }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    disabled
                      ? 'cursor-not-allowed'
                      : ''
                  } ${optionBorderColor} ${optionBgColor}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-all ${optionBadgeColor}`}>
                      {option.key}
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <span>{option.text}</span>
                      {disabled && correctAnswer && (
                        <span className={`text-xs font-semibold px-2 py-1 rounded ml-2 ${
                          isSelected && isCorrect
                            ? 'bg-green-600 text-white'
                            : isSelected && !isCorrect
                            ? 'bg-red-600 text-white'
                            : !isSelected && isCorrect
                            ? 'bg-green-600 text-white'
                            : ''
                        }`}>
                          {isSelected && isCorrect && 'Your Answer'}
                          {isSelected && !isCorrect && 'Your Answer'}
                          {!isSelected && isCorrect && 'Correct Answer'}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Submit Button */}
          {!disabled && (
            <div className="flex gap-3">
              <motion.button
                onClick={handleSubmit}
                disabled={!selectedAnswer || timeRemaining === 0 || isSubmitting}
                whileHover={(!selectedAnswer || timeRemaining === 0 || isSubmitting) ? {} : { scale: 1.02 }}
                whileTap={(!selectedAnswer || timeRemaining === 0 || isSubmitting) ? {} : { scale: 0.98 }}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  'Submit Answer'
                )}
              </motion.button>
              {/* Skip button only shown if showSkipButton is true and onSkip is provided */}
              {showSkipButton && onSkip && (
                <motion.button
                  onClick={handleSkip}
                  disabled={timeRemaining === 0 || isSubmitting}
                  whileHover={(timeRemaining === 0 || isSubmitting) ? {} : { scale: 1.02 }}
                  whileTap={(timeRemaining === 0 || isSubmitting) ? {} : { scale: 0.98 }}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
                >
                  Skip
                </motion.button>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}


