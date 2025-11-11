'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'

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
  onAnswer: (answer: string, timeTaken: number) => void
  timerSeconds: number
}

export function QuestionDisplay({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  timerSeconds,
}: QuestionDisplayProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [timeStarted] = useState(Date.now())

  const handleSubmit = () => {
    if (!selectedAnswer) return
    const timeTaken = Math.floor((Date.now() - timeStarted) / 1000)
    onAnswer(selectedAnswer, timeTaken)
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

      {/* Question Card */}
      <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
        {/* Scenario */}
        {question.scenario_text && (
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: question.scenario_text }} />
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
          {options.map((option) => (
            <button
              key={option.key}
              onClick={() => setSelectedAnswer(option.key)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedAnswer === option.key
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  selectedAnswer === option.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {option.key}
                </div>
                <div className="flex-1">{option.text}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!selectedAnswer || timeRemaining === 0}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          Submit Answer
        </button>
      </div>
    </div>
  )
}


