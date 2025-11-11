'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QUIZ_DIFFICULTIES, getDifficultyDisplayName } from '@/lib/quiz/categories'
import { Play, BookOpen, Target, Clock, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useQuizCategories } from '@/hooks/useQuizCategories'

export function PracticeSetup() {
  const router = useRouter()
  const { categories, loading: categoriesLoading } = useQuizCategories()
  const [category, setCategory] = useState<string>('')
  const [difficulty, setDifficulty] = useState<string>('all')
  const [questionCount, setQuestionCount] = useState<number>(10)
  const [timeLimit, setTimeLimit] = useState<number>(60)
  const [mode, setMode] = useState<'continuous' | 'paced'>('paced')
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/quiz/practice/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: category || null,
          difficulty: difficulty === 'all' ? null : difficulty,
          question_count: questionCount,
          time_limit: timeLimit,
          mode: mode,
        }),
      })

      if (!response.ok) throw new Error('Failed to start practice')
      const data = await response.json()
      router.push(`/games/practice/${data.session.id}`)
    } catch (error) {
      console.error('Error starting practice:', error)
      alert('Failed to start practice session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Practice Mode
          </h1>
        </div>
        <p className="text-gray-600 text-lg">Practice medical questions at your own pace</p>
      </motion.div>

      {/* Info Cards - Hidden on larger screens since we have features section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200"
        >
          <Clock className="w-6 h-6 text-blue-600 mb-2" />
          <p className="font-semibold text-blue-900">Custom Timer</p>
          <p className="text-sm text-blue-700">Choose your pace</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200"
        >
          <Target className="w-6 h-6 text-purple-600 mb-2" />
          <p className="font-semibold text-purple-900">Instant Feedback</p>
          <p className="text-sm text-purple-700">Learn as you go</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200"
        >
          <Sparkles className="w-6 h-6 text-green-600 mb-2" />
          <p className="font-semibold text-green-900">Track Progress</p>
          <p className="text-sm text-green-700">See your stats</p>
        </motion.div>
      </div>

      {/* Setup Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-8 rounded-2xl shadow-xl border-2 border-blue-100 space-y-6"
      >
        <div>
          <label className="block text-sm font-semibold mb-3 text-gray-700">
            Category (Optional)
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            disabled={categoriesLoading}
          >
            <option value="">{categoriesLoading ? 'Loading categories...' : 'All Categories'}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-3 text-gray-700">
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">All Difficulties</option>
            {QUIZ_DIFFICULTIES.map((diff) => (
              <option key={diff} value={diff}>{getDifficultyDisplayName(diff)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-3 text-gray-700">
            Number of Questions
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[5, 10, 20, 50].map((count) => (
              <button
                key={count}
                onClick={() => setQuestionCount(count)}
                className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all ${
                  questionCount === count
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105'
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-3 text-gray-700">
            Time Limit Per Question
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[30, 45, 60, 75, 90].map((seconds) => (
              <button
                key={seconds}
                onClick={() => setTimeLimit(seconds)}
                className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all ${
                  timeLimit === seconds
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105'
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300'
                }`}
              >
                {seconds}s
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-3 text-gray-700">
            Practice Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setMode('continuous')}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                mode === 'continuous'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg border-transparent'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
              }`}
            >
              <div className="font-bold text-lg mb-1">Continuous Mode</div>
              <div className={`text-sm ${mode === 'continuous' ? 'text-blue-100' : 'text-gray-600'}`}>
                Answer all questions first, then see results and explanations at the end
              </div>
            </button>
            <button
              onClick={() => setMode('paced')}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                mode === 'paced'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg border-transparent'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
              }`}
            >
              <div className="font-bold text-lg mb-1">Paced Mode</div>
              <div className={`text-sm ${mode === 'paced' ? 'text-blue-100' : 'text-gray-600'}`}>
                See explanation and feedback immediately after each question
              </div>
            </button>
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-rose-600 text-white px-8 py-4 rounded-xl hover:shadow-2xl hover:from-red-700 hover:to-rose-700 transition-all disabled:opacity-50 font-bold text-lg mt-6"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              Starting...
            </>
          ) : (
            <>
              <Play className="w-6 h-6" />
              Start Practice Session
            </>
          )}
        </button>
      </motion.div>
    </div>
  )
}

