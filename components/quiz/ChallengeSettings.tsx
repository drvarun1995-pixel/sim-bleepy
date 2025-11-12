'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { QUIZ_DIFFICULTIES, getDifficultyDisplayName } from '@/lib/quiz/categories'
import { Settings, BookOpen, Target, Clock, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { useQuizCategories } from '@/hooks/useQuizCategories'
import { toast } from 'sonner'

interface ChallengeSettingsProps {
  code: string
  isHost?: boolean
  initialSettings?: {
    selected_categories?: string[]
    selected_difficulties?: string[]
    question_count?: number
    time_limit?: number
  }
  onSettingsChange?: (settings: any) => void
  onSettingsSaved?: () => void
}

export function ChallengeSettings({ code, isHost = false, initialSettings, onSettingsChange, onSettingsSaved }: ChallengeSettingsProps) {
  const { categories, loading: categoriesLoading } = useQuizCategories()
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialSettings?.selected_categories || [])
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(initialSettings?.selected_difficulties || [])
  const [questionCount, setQuestionCount] = useState<number>(initialSettings?.question_count || 10)
  const [timeLimit, setTimeLimit] = useState<number>(initialSettings?.time_limit || 60)
  const [isSaving, setIsSaving] = useState(false)
  const [isExpanded, setIsExpanded] = useState(!isHost) // Non-host sees settings expanded by default
  const isSavingRef = useRef(false) // Track saving state to prevent sync interference
  const lastSettingsHashRef = useRef<string>('') // Track last synced settings to detect changes

  // Create a stable hash of initialSettings to detect changes
  // Stringify arrays for stable comparison
  const categoriesStr = JSON.stringify(initialSettings?.selected_categories || [])
  const difficultiesStr = JSON.stringify(initialSettings?.selected_difficulties || [])
  const questionCountValue = initialSettings?.question_count ?? 10
  const timeLimitValue = initialSettings?.time_limit ?? 60

  const settingsHash = useMemo(() => {
    if (!initialSettings) return ''
    return `${categoriesStr}|${difficultiesStr}|${questionCountValue}|${timeLimitValue}`
  }, [categoriesStr, difficultiesStr, questionCountValue, timeLimitValue])

  // Sync local state when initialSettings prop changes (from SSE updates)
  // For non-host: always sync with server state (they can't edit)
  // For host: only sync when panel is collapsed (not actively editing) and not saving
  useEffect(() => {
    if (!initialSettings || isSavingRef.current || !settingsHash) {
      return
    }

    // Skip if settings haven't actually changed
    if (settingsHash === lastSettingsHashRef.current) {
      return
    }

    // Normalize null/undefined to empty arrays
    const normalizedCategories = initialSettings.selected_categories || []
    const normalizedDifficulties = initialSettings.selected_difficulties || []
    const normalizedQuestionCount = initialSettings.question_count ?? 10
    const normalizedTimeLimit = initialSettings.time_limit ?? 60

    // Non-host always syncs, host only syncs when not editing
    if (!isHost || !isExpanded) {
      console.log('[ChallengeSettings] Syncing settings:', {
        isHost,
        isExpanded,
        normalizedCategories,
        normalizedDifficulties,
        normalizedQuestionCount,
        normalizedTimeLimit,
        settingsHash,
        lastHash: lastSettingsHashRef.current,
      })
      setSelectedCategories(normalizedCategories)
      setSelectedDifficulties(normalizedDifficulties)
      setQuestionCount(normalizedQuestionCount)
      setTimeLimit(normalizedTimeLimit)
      lastSettingsHashRef.current = settingsHash
    } else {
      console.log('[ChallengeSettings] Skipping sync:', {
        isHost,
        isExpanded,
        reason: 'Host is editing (panel expanded)',
      })
    }
  }, [
    settingsHash, // This will change when any setting value changes
    isHost,
    isExpanded,
    // Removed initialSettings from deps - we use settingsHash instead
  ])

  // Note: Removed the "panel collapse sync" effect because it was overwriting saved values
  // The main sync effect will handle updates when settingsHash changes from SSE updates

  useEffect(() => {
    if (onSettingsChange) {
      onSettingsChange({
        selected_categories: selectedCategories,
        selected_difficulties: selectedDifficulties,
        question_count: questionCount,
        time_limit: timeLimit,
      })
    }
  }, [selectedCategories, selectedDifficulties, questionCount, timeLimit, onSettingsChange])

  const handleSave = async () => {
    setIsSaving(true)
    isSavingRef.current = true // Prevent sync during save
    
    try {
      const response = await fetch(`/api/quiz/challenges/${code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_categories: selectedCategories.length > 0 ? selectedCategories : null,
          selected_difficulties: selectedDifficulties.length > 0 ? selectedDifficulties : null,
          question_count: questionCount,
          time_limit: timeLimit,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update settings')
      }
      
      const data = await response.json()
      
      // Update local state with server response immediately
      if (data.challenge) {
        const newCategories = data.challenge.selected_categories || []
        const newDifficulties = data.challenge.selected_difficulties || []
        const newQuestionCount = data.challenge.question_count || 10
        const newTimeLimit = data.challenge.time_limit || 60
        
        console.log('[ChallengeSettings] Save successful, updating local state:', {
          newCategories,
          newDifficulties,
          newQuestionCount,
          newTimeLimit,
        })
        
        setSelectedCategories(newCategories)
        setSelectedDifficulties(newDifficulties)
        setQuestionCount(newQuestionCount)
        setTimeLimit(newTimeLimit)
        
        // Update the hash to reflect the new state (use same format as settingsHash)
        const newHash = `${JSON.stringify(newCategories)}|${JSON.stringify(newDifficulties)}|${newQuestionCount}|${newTimeLimit}`
        lastSettingsHashRef.current = newHash
        console.log('[ChallengeSettings] Save completed, updated hash:', newHash)
      }
      
      setIsExpanded(false)
      
      // Show success toast
      toast.success('Settings Saved', {
        description: 'Challenge settings have been updated successfully.',
        duration: 3000,
      })
      
      // Notify parent that settings were saved
      if (onSettingsSaved) {
        onSettingsSaved()
      }
      
      // Wait a bit longer before allowing sync to prevent overwriting saved values
      // The SSE update will come through and update initialSettings, which will trigger sync
      setTimeout(() => {
        isSavingRef.current = false
        setIsSaving(false) // Reset saving state to allow further changes
        // After allowing sync, check if initialSettings has updated from SSE
        // If it has, the sync effect will run automatically
      }, 1000) // Increased delay to ensure SSE update arrives first
    } catch (error: any) {
      console.error('Error updating settings:', error)
      toast.error('Failed to Save Settings', {
        description: error.message || 'An error occurred while saving challenge settings.',
        duration: 5000,
      })
      setIsSaving(false)
      isSavingRef.current = false
    }
  }

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    )
  }

  const toggleDifficulty = (difficulty: string) => {
    setSelectedDifficulties(prev =>
      prev.includes(difficulty)
        ? prev.filter(d => d !== difficulty)
        : [...prev, difficulty]
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg shadow-lg border-2 border-blue-100"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-4"
        disabled={!isHost && !isExpanded && false} // Allow non-host to toggle
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Settings className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Challenge Settings</h2>
          {!isHost && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Read Only</span>
          )}
        </div>
        <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-6"
        >
          {/* Categories */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-700 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Categories {selectedCategories.length === 0 && '(All Categories)'}
            </label>
            {isHost ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.name)
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleCategory(cat.name)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {cat.name}
                      </button>
                    )
                  })}
                </div>
                {selectedCategories.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: {selectedCategories.join(', ')}
                  </p>
                )}
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedCategories.length > 0 ? (
                  selectedCategories.map((catName) => (
                    <span
                      key={catName}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-700"
                    >
                      {catName}
                    </span>
                  ))
                ) : (
                  <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600">
                    All Categories
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Difficulties */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-700 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Difficulty
            </label>
            {isHost ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {QUIZ_DIFFICULTIES.map((diff) => {
                    const isSelected = selectedDifficulties.includes(diff)
                    return (
                      <button
                        key={diff}
                        onClick={() => toggleDifficulty(diff)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {getDifficultyDisplayName(diff)}
                      </button>
                    )
                  })}
                </div>
                {selectedDifficulties.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">All difficulties will be included</p>
                )}
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedDifficulties.length > 0 ? (
                  selectedDifficulties.map((diff) => (
                    <span
                      key={diff}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-100 text-purple-700"
                    >
                      {getDifficultyDisplayName(diff)}
                    </span>
                  ))
                ) : (
                  <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600">
                    All Difficulties
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Question Count */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Number of Questions
            </label>
            {isHost ? (
              <div className="grid grid-cols-4 gap-3">
                {[5, 10, 20, 50].map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      questionCount === count
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 border-2 border-gray-200 text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-blue-100 text-blue-700 inline-block">
                {questionCount} Questions
              </div>
            )}
          </div>

          {/* Time Limit */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time Limit Per Question
            </label>
            {isHost ? (
              <div className="grid grid-cols-5 gap-3">
                {[30, 45, 60, 75, 90].map((seconds) => (
                  <button
                    key={seconds}
                    onClick={() => setTimeLimit(seconds)}
                    className={`px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      timeLimit === seconds
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 border-2 border-gray-200 text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    {seconds}s
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-blue-100 text-blue-700 inline-block">
                {timeLimit} seconds
              </div>
            )}
          </div>

          {/* Save Button (Host Only) */}
          {isHost && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Settings className="w-5 h-5" />
                  Save Settings
                </>
              )}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

