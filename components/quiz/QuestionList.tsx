'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, Edit, Trash2, Eye, CheckCircle, XCircle, Upload, FileQuestion, Sparkles, Archive } from 'lucide-react'
import { QUIZ_DIFFICULTIES, getDifficultyDisplayName, getDifficultyColor } from '@/lib/quiz/categories'
import { motion } from 'framer-motion'
import { useQuizCategories } from '@/hooks/useQuizCategories'

/**
 * Strips HTML tags from a string and returns plain text
 * Also decodes HTML entities
 */
function stripHtmlTags(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }
  
  // Create a temporary DOM element to parse HTML
  const tmp = document.createElement('DIV')
  tmp.innerHTML = html
  
  // Get text content (automatically strips tags and decodes entities)
  const text = tmp.textContent || tmp.innerText || ''
  
  // Clean up any remaining whitespace issues
  return text.replace(/\s+/g, ' ').trim()
}

interface Question {
  id: string
  scenario_text: string
  question_text: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  status: 'draft' | 'published' | 'archived'
  created_at: string
}

export function QuestionList() {
  const router = useRouter()
  const { categories, loading: categoriesLoading } = useQuizCategories()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    fetchQuestions()
  }, [categoryFilter, difficultyFilter, statusFilter, searchTerm])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (categoryFilter) params.append('category', categoryFilter)
      if (difficultyFilter) params.append('difficulty', difficultyFilter)
      if (statusFilter) params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/quiz/questions?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch questions')
      
      const data = await response.json()
      setQuestions(data.questions || [])
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      // First call: Check if deletion requires confirmation
      const response = await fetch(`/api/quiz/questions/${id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json().catch(() => ({}))
      
      if (!response.ok) {
        const errorMessage = data.message || data.error || data.details || 'Failed to delete question'
        
        // If deletion fails because question is in use, offer to archive instead
        if (errorMessage.includes('cannot be deleted') || errorMessage.includes('used in') || errorMessage.includes('active')) {
          const shouldArchive = confirm(
            `${errorMessage}\n\nWould you like to archive this question instead? Archived questions won't appear in practice sessions but will be preserved.`
          )
          if (shouldArchive) {
            await handleArchive(id)
          }
          return
        }
        
        alert(errorMessage)
        return
      }
      
      // Check if confirmation is required
      if (data.requiresConfirmation && data.warning) {
        const confirmed = confirm(
          `⚠️ WARNING: This question has been used in ${data.completedSessions} completed practice session(s) and ${data.challengeCount} challenge(s).\n\n` +
          `Deleting will remove all answer records but preserve session data.\n\n` +
          `Do you want to proceed with deletion?`
        )
        if (!confirmed) {
          return
        }
        
        // Second call: Confirm deletion
        const confirmResponse = await fetch(`/api/quiz/questions/${id}?confirmed=true`, {
          method: 'DELETE',
        })
        
        const confirmData = await confirmResponse.json().catch(() => ({}))
        
        if (!confirmResponse.ok) {
          const errorMessage = confirmData.message || confirmData.error || 'Failed to delete question'
          alert(errorMessage)
          return
        }
        
        // Success
        fetchQuestions()
        if (confirmData.message) {
          alert(confirmData.message)
        }
        return
      }
      
      // Success (no usage, deleted immediately)
      fetchQuestions()
      if (data.message) {
        alert(data.message)
      }
    } catch (error: any) {
      console.error('Error deleting question:', error)
      alert(error.message || 'Failed to delete question. Please try again.')
    }
  }

  const handleArchive = async (id: string) => {
    try {
      const response = await fetch(`/api/quiz/questions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'archived',
        }),
      })
      if (!response.ok) throw new Error('Failed to archive question')
      fetchQuestions()
    } catch (error) {
      console.error('Error archiving question:', error)
      alert('Failed to archive question. Please try again.')
    }
  }

  const handleUnarchive = async (id: string) => {
    try {
      const response = await fetch(`/api/quiz/questions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'draft',
        }),
      })
      if (!response.ok) throw new Error('Failed to unarchive question')
      fetchQuestions()
    } catch (error) {
      console.error('Error unarchiving question:', error)
      alert('Failed to unarchive question. Please try again.')
    }
  }

  const handlePublish = async (id: string, currentStatus: string) => {
    try {
      const response = await fetch(`/api/quiz/questions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: currentStatus === 'published' ? 'draft' : 'published',
        }),
      })
      if (!response.ok) throw new Error('Failed to update question')
      fetchQuestions()
    } catch (error) {
      console.error('Error updating question:', error)
      alert('Failed to update question')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center flex-wrap gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
            <FileQuestion className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Question Management
            </h1>
            <p className="text-gray-600 mt-1">{questions.length} questions</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/games-organiser/questions-bulk-upload')}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
          >
            <Sparkles className="w-5 h-5" />
            Bulk Upload
          </button>
          <button
            onClick={() => router.push('/games-organiser/create-question')}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
          >
            <Plus className="w-5 h-5" />
            Create Question
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-2xl shadow-lg border-2 border-blue-200 space-y-4"
      >
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">All Difficulties</option>
            {QUIZ_DIFFICULTIES.map((diff) => (
              <option key={diff} value={diff}>{getDifficultyDisplayName(diff)}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </motion.div>

      {/* Questions Table */}
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading questions...</p>
        </motion.div>
      ) : questions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-dashed border-blue-300"
        >
          <FileQuestion className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-semibold">No questions found</p>
          <p className="text-gray-500 text-sm mt-2">Create your first question to get started!</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-200"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Question</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Difficulty</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {questions.map((question, index) => (
                  <motion.tr
                    key={question.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {stripHtmlTags(question.question_text)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {stripHtmlTags(question.scenario_text)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{question.category}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(question.difficulty)}`}>
                        {getDifficultyDisplayName(question.difficulty)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        question.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : question.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {question.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/games-organiser/create-question?id=${question.id}`)}
                          className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {question.status !== 'archived' && (
                          <button
                            onClick={() => handlePublish(question.id, question.status)}
                            className={`p-2.5 rounded-lg transition-colors ${
                              question.status === 'published'
                                ? 'text-yellow-600 hover:bg-yellow-100'
                                : 'text-green-600 hover:bg-green-100'
                            }`}
                            title={question.status === 'published' ? 'Unpublish' : 'Publish'}
                          >
                            {question.status === 'published' ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {question.status !== 'archived' ? (
                          <>
                            <button
                              onClick={() => handleArchive(question.id)}
                              className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Archive"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(question.id)}
                              className="p-2.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleUnarchive(question.id)}
                            className="p-2.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            title="Unarchive"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  )
}

