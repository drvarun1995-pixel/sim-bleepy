'use client'

import { CheckCircle2, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface AnswerExplanationProps {
  isCorrect: boolean
  correctAnswer: string
  explanation: {
    text: string
    image_url?: string
    table_data?: any
  }
  selectedAnswer: string
  onContinue: () => void
  question?: {
    option_a?: string
    option_b?: string
    option_c?: string
    option_d?: string
    option_e?: string
  }
}

export function AnswerExplanation({
  isCorrect,
  correctAnswer,
  explanation,
  selectedAnswer,
  onContinue,
  question,
}: AnswerExplanationProps) {
  // Build options array for display - include all options, even if empty (we'll filter for display)
  const allOptions = question ? [
    { key: 'A', text: question.option_a || '' },
    { key: 'B', text: question.option_b || '' },
    { key: 'C', text: question.option_c || '' },
    { key: 'D', text: question.option_d || '' },
    { key: 'E', text: question.option_e || '' },
  ] : []
  
  // Filter options for display (only show non-empty ones)
  const options = allOptions.filter(opt => opt.text && opt.text.trim().length > 0)
  
  // Get the option text for the correct answer
  const getOptionText = (optionLetter: string): string => {
    if (!optionLetter || !question) return ''
    
    // Handle both lowercase and uppercase
    const letter = optionLetter.toUpperCase()
    
    // First, try to find in allOptions (includes all options, even empty ones)
    const foundOption = allOptions.find(opt => opt.key === letter)
    
    if (foundOption && foundOption.text && foundOption.text.trim().length > 0) {
      return foundOption.text
    }
    
    // Fallback: try to get from question object directly
    const optionMap: { [key: string]: string | undefined } = {
      'A': question.option_a,
      'B': question.option_b,
      'C': question.option_c,
      'D': question.option_d,
      'E': question.option_e,
    }
    
    const optionText = optionMap[letter]
    if (optionText && typeof optionText === 'string' && optionText.trim().length > 0) {
      return optionText
    }
    
    // Return empty string if not found (we'll handle this in display)
    return ''
  }
  
  const correctOptionText = getOptionText(correctAnswer)
  
  // Strip HTML tags from option text for the header display (if it contains HTML)
  const stripHtmlFromText = (text: string): string => {
    if (!text || typeof text !== 'string') return ''
    // Create a temporary DOM element to parse and extract text
    if (typeof document === 'undefined') return text // SSR safety
    const tmp = document.createElement('DIV')
    tmp.innerHTML = text
    const textContent = tmp.textContent || tmp.innerText || ''
    return textContent.trim() || text
  }
  
  const displayCorrectOptionText = correctOptionText ? stripHtmlFromText(correctOptionText) : ''
  
  // Only show the option text part if we successfully got it (not empty and not just the letter)
  const showCorrectAnswerText = displayCorrectOptionText && 
    displayCorrectOptionText.trim().length > 0 && 
    displayCorrectOptionText.toUpperCase() !== correctAnswer?.toUpperCase()
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="mt-6 bg-white rounded-lg shadow-lg border-2 p-6 space-y-4"
      style={{
        borderColor: isCorrect ? '#10b981' : '#ef4444',
      }}
    >
      {/* Result Header */}
      <div className="flex items-center gap-3">
        {isCorrect ? (
          <>
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-green-600 text-lg">Correct!</h3>
              <p className="text-sm text-gray-600">Well done!</p>
            </div>
          </>
        ) : (
          <>
            <div className="p-2 bg-red-100 rounded-full">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-red-600 text-lg">Incorrect</h3>
              <p className="text-sm text-gray-600">
                The correct answer is <span className="font-bold">{correctAnswer}{showCorrectAnswerText ? `: ${displayCorrectOptionText}` : ''}</span>
              </p>
            </div>
          </>
        )}
      </div>

      {/* Explanation */}
      {explanation.text && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-xl font-semibold text-gray-900 mb-2">Explanation:</h4>
          <div 
            className="prose max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: explanation.text }}
          />
        </div>
      )}

      {/* Explanation Image */}
      {explanation.image_url && (
        <div className="flex justify-center">
          <img
            src={explanation.image_url}
            alt="Explanation"
            className="max-w-full h-auto rounded-lg"
          />
        </div>
      )}

      {/* Continue Button */}
      <button
        onClick={() => {
          // Scroll to top of the page smoothly when continuing to next question
          window.scrollTo({ top: 0, behavior: 'smooth' })
          // Call the onContinue callback after a short delay to allow scroll to start
          setTimeout(() => {
            onContinue()
          }, 100)
        }}
        className="w-full mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
      >
        Continue
      </button>
    </motion.div>
  )
}

