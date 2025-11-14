'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, Edit, Trash2, Eye, CheckCircle, XCircle, Upload, FileQuestion, Sparkles, Archive } from 'lucide-react'
import { QUIZ_DIFFICULTIES, getDifficultyDisplayName, getDifficultyColor } from '@/lib/quiz/categories'
import { motion } from 'framer-motion'
import { useQuizCategories } from '@/hooks/useQuizCategories'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { toast } from 'sonner'

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [usageDialog, setUsageDialog] = useState<{ open: boolean; message: string; details?: string }>({ open: false, message: '' })
  const [usageLoading, setUsageLoading] = useState(false)
  const [resultDialog, setResultDialog] = useState<{ open: boolean; title: string; description: string }>({ open: false, title: '', description: '' })
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)

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
      setSelectedQuestions((prev) => {
        if (!data.questions) {
          return new Set()
        }
        const next = new Set<string>()
        data.questions.forEach((question: Question) => {
          if (prev.has(question.id)) {
            next.add(question.id)
          }
        })
        return next
      })
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const performDeleteRequest = async (questionId: string, confirmed?: boolean) => {
    try {
      const url = confirmed ? `/api/quiz/questions/${questionId}?confirmed=true` : `/api/quiz/questions/${questionId}`
      const response = await fetch(url, { method: 'DELETE' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const errorMessage = data.message || data.error || data.details || 'Failed to delete question'
        toast.error(errorMessage)
        return { status: 'error' as const }
      }

      if (data.requiresConfirmation && data.warning) {
        setUsageDialog({
          open: true,
          message: data.warning,
          details: data.message,
        })
        return { status: 'needs-confirmation' as const }
      }

      fetchQuestions()
      setResultDialog({
        open: true,
        title: 'Question deleted',
        description: data.message || 'The question and its associated images have been removed.',
      })
      setDeleteTarget(null)
      return { status: 'success' as const }
    } catch (error: any) {
      console.error('Error deleting question:', error)
      toast.error(error?.message || 'Failed to delete question. Please try again.')
      return { status: 'error' as const }
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    const result = await performDeleteRequest(deleteTarget.id)
    setDeleteLoading(false)
    setDeleteDialogOpen(false)
    if (result?.status !== 'needs-confirmation') {
      setUsageDialog({ open: false, message: '' })
    }
  }

  const confirmUsageDelete = async () => {
    if (!deleteTarget) return
    setUsageLoading(true)
    const result = await performDeleteRequest(deleteTarget.id, true)
    setUsageLoading(false)
    if (result?.status !== 'needs-confirmation') {
      setUsageDialog({ open: false, message: '' })
    }
  }

  const toggleQuestionSelection = (id: string) => {
    setSelectedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAllQuestions = () => {
    if (questions.length === 0) {
      return
    }
    setSelectedQuestions((prev) => {
      if (prev.size === questions.length) {
        return new Set()
      }
      return new Set(questions.map((q) => q.id))
    })
  }

  const clearSelection = () => setSelectedQuestions(new Set())
  const selectedCount = selectedQuestions.size
  const allQuestionsSelected = questions.length > 0 && selectedCount === questions.length

  const handleBulkDelete = async () => {
    if (selectedQuestions.size === 0) {
      return
    }
    setBulkDeleteLoading(true)
    try {
      const response = await fetch('/api/quiz/questions/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selectedQuestions),
          force: true,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete selected questions')
      }

      const summary = data.summary || {}
      const deletedCount = summary.deleted?.length || 0
      if (deletedCount > 0) {
        toast.success(`Deleted ${deletedCount} question${deletedCount === 1 ? '' : 's'}.`)
      }

      const issues: string[] = []
      if (summary.blocked?.length) {
        issues.push(`${summary.blocked.length} blocked`)
      }
      if (summary.errors?.length) {
        issues.push(`${summary.errors.length} failed`)
      }
      if (summary.notFound?.length) {
        issues.push(`${summary.notFound.length} not found`)
      }
      if (summary.needsConfirmation?.length) {
        issues.push(`${summary.needsConfirmation.length} require confirmation`)
      }

      if (issues.length > 0) {
        toast.warning('Some questions could not be deleted', {
          description: issues.join(' • '),
          duration: 6000,
        })
      }

      setBulkDeleteDialogOpen(false)
      setSelectedQuestions(new Set())
      fetchQuestions()
    } catch (error: any) {
      console.error('Error deleting questions in bulk:', error)
      toast.error(error?.message || 'Failed to delete selected questions')
    } finally {
      setBulkDeleteLoading(false)
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
    <>
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

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <p className="text-sm font-semibold text-red-700">
            {selectedCount} question{selectedCount === 1 ? '' : 's'} selected
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={clearSelection}
              className="text-sm font-semibold text-red-600 hover:text-red-800"
            >
              Clear selection
            </button>
            <button
              type="button"
              onClick={() => setBulkDeleteDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 transition"
            >
              <Trash2 className="w-4 h-4" />
              Delete selected
            </button>
          </div>
        </div>
      )}

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
                  <th className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={allQuestionsSelected}
                      onChange={toggleSelectAllQuestions}
                      aria-label="Select all questions"
                    />
                  </th>
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
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedQuestions.has(question.id)}
                        onChange={() => toggleQuestionSelection(question.id)}
                        aria-label={`Select ${stripHtmlTags(question.question_text)}`}
                      />
                    </td>
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
                              onClick={() => {
                                setDeleteTarget(question)
                                setDeleteDialogOpen(true)
                              }}
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

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open && !deleteLoading) {
            setDeleteDialogOpen(false)
            setDeleteTarget(null)
          }
        }}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (!deleteLoading) {
            setDeleteDialogOpen(false)
            setDeleteTarget(null)
          }
        }}
        isLoading={deleteLoading}
        title="Delete question?"
        description={
          deleteTarget
            ? `This will permanently delete "${stripHtmlTags(deleteTarget.question_text)}" and remove its stored images.`
            : 'This will permanently delete the selected question.'
        }
        confirmText="Delete question"
        cancelText="Cancel"
        variant="destructive"
      />

      <ConfirmationDialog
        open={usageDialog.open}
        onOpenChange={(open) => {
          if (!open && !usageLoading) {
            setUsageDialog({ open: false, message: '' })
          }
        }}
        onConfirm={confirmUsageDelete}
        onCancel={() => {
          if (!usageLoading) {
            setUsageDialog({ open: false, message: '' })
          }
        }}
        isLoading={usageLoading}
        title="Question already in use"
        description={
          usageDialog.message ||
          'This question has been used in practice sessions or challenges. Deleting it will remove related answer records.'
        }
        confirmText="Delete anyway"
        cancelText="Keep question"
        variant="warning"
      />

      <ConfirmationDialog
        open={resultDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setResultDialog({ open: false, title: '', description: '' })
          }
        }}
        onConfirm={() => setResultDialog({ open: false, title: '', description: '' })}
        title={resultDialog.title || 'Question deleted'}
        description={resultDialog.description || 'The question has been removed.'}
        confirmText="Close"
        cancelText=""
        showCancelButton={false}
        variant="default"
      />

      <ConfirmationDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open && !bulkDeleteLoading) {
            setBulkDeleteDialogOpen(false)
          }
        }}
        onConfirm={handleBulkDelete}
        onCancel={() => {
          if (!bulkDeleteLoading) {
            setBulkDeleteDialogOpen(false)
          }
        }}
        isLoading={bulkDeleteLoading}
        title={`Delete ${selectedCount} selected question${selectedCount === 1 ? '' : 's'}?`}
        description="This will permanently delete the selected questions and remove their stored images. This action cannot be undone."
        confirmText="Delete selected"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  )
}

