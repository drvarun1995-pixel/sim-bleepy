'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TiptapSimpleEditor } from '@/components/ui/tiptap-simple-editor'
import { QUIZ_DIFFICULTIES, getDifficultyDisplayName } from '@/lib/quiz/categories'
import { Upload, X, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useQuizCategories } from '@/hooks/useQuizCategories'

interface QuestionFormData {
  scenario_text: string
  scenario_image_url: string | null
  scenario_table_data: any | null
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  option_e: string
  correct_answer: 'A' | 'B' | 'C' | 'D' | 'E'
  explanation_text: string
  explanation_image_url: string | null
  explanation_table_data: any | null
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  status: 'draft' | 'published'
  asset_folder_id?: string | null
}

interface QuestionFormProps {
  questionId?: string
}

export function QuestionForm({ questionId }: QuestionFormProps) {
  const router = useRouter()
  const { categories, loading: categoriesLoading } = useQuizCategories()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [documentId, setDocumentId] = useState(() => questionId || `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`)
  const [hasSaved, setHasSaved] = useState(false)
  const [formData, setFormData] = useState<QuestionFormData>({
    scenario_text: '',
    scenario_image_url: null,
    scenario_table_data: null,
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    option_e: '',
    correct_answer: 'A',
    explanation_text: '',
    explanation_image_url: null,
    explanation_table_data: null,
    category: '',
    difficulty: 'medium',
    tags: [],
    status: 'draft',
    asset_folder_id: null,
  })

  useEffect(() => {
    if (questionId) {
      fetchQuestion()
    }
  }, [questionId])

  const requestDraftCleanup = (folder?: string | null) => {
    if (!folder || !folder.startsWith('draft-')) return
    const payload = JSON.stringify({ folderId: folder })
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon('/api/quiz/images/cleanup', blob)
    } else {
      fetch('/api/quiz/images/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }
  }

  useEffect(() => {
    return () => {
      if (!questionId && !hasSaved) {
        requestDraftCleanup(documentId)
      }
    }
  }, [questionId, hasSaved, documentId])

  useEffect(() => {
    if (questionId) {
      return
    }
    const handleBeforeUnload = () => {
      if (!hasSaved) {
        requestDraftCleanup(documentId)
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [questionId, hasSaved, documentId])

  const fetchQuestion = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/quiz/questions/${questionId}`)
      if (!response.ok) throw new Error('Failed to fetch question')
      const data = await response.json()
      setFormData(data.question)
      setDocumentId((prev) => data.question.asset_folder_id || data.question.id || questionId || prev)
    } catch (error) {
      console.error('Error fetching question:', error)
      toast.error('Failed to load question')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file: File, type: 'scenario' | 'explanation') => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (documentId) {
        formData.append('documentId', documentId)
      }

      const response = await fetch('/api/quiz/images/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to upload image')
      const data = await response.json()

      if (type === 'scenario') {
        setFormData(prev => ({ ...prev, scenario_image_url: data.path }))
      } else {
        setFormData(prev => ({ ...prev, explanation_image_url: data.path }))
      }

      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = questionId 
        ? `/api/quiz/questions/${questionId}`
        : '/api/quiz/questions'
      const method = questionId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          asset_folder_id: documentId,
        }),
      })

      if (!response.ok) throw new Error('Failed to save question')
      
      setHasSaved(true)
      toast.success(questionId ? 'Question updated' : 'Question created')
      router.push('/games-organiser/questions')
    } catch (error) {
      console.error('Error saving question:', error)
      toast.error('Failed to save question')
    } finally {
      setSaving(false)
    }
  }

  const getImagePreviewUrl = (path: string | null | undefined) => {
    if (!path) return null
    if (path.startsWith('http')) {
      return path
    }
    return `/api/quiz/images/view?path=${encodeURIComponent(path)}`
  }

  if (loading) {
    return <div className="text-center py-12">Loading question...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {questionId ? 'Edit Question' : 'Create Question'}
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (!questionId) {
                requestDraftCleanup(documentId)
              }
              router.back()
            }}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-6">
        {/* Scenario Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Scenario</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Scenario Text *</label>
              <TiptapSimpleEditor
                value={formData.scenario_text}
                onChange={(value) => setFormData(prev => ({ ...prev, scenario_text: value }))}
                placeholder="Enter the scenario/context for the question..."
                specialtySlug="quiz"
                pageSlug="questions"
                documentId={documentId}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Scenario Image (Optional)</label>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <Upload className="w-4 h-4" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, 'scenario')
                      }}
                    />
                  </label>
                  {formData.scenario_image_url && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, scenario_image_url: null }))}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                      Remove image
                    </button>
                  )}
                </div>
                {formData.scenario_image_url && (
                  <div className="relative w-48">
                    <img
                      src={getImagePreviewUrl(formData.scenario_image_url) || ''}
                      alt="Scenario preview"
                      className="rounded-lg border border-gray-200 object-cover w-full h-32 bg-gray-50"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Question Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Question</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Question Text *</label>
              <textarea
                value={formData.question_text}
                onChange={(e) => setFormData(prev => ({ ...prev, question_text: e.target.value }))}
                placeholder="Enter the question..."
                className="w-full px-4 py-2 border rounded-lg min-h-[100px]"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['A', 'B', 'C', 'D', 'E'] as const).map((option) => (
                <div key={option}>
                  <label className="block text-sm font-medium mb-2">
                    Option {option} *
                    <input
                      type="radio"
                      name="correct_answer"
                      value={option}
                      checked={formData.correct_answer === option}
                      onChange={(e) => setFormData(prev => ({ ...prev, correct_answer: e.target.value as 'A' | 'B' | 'C' | 'D' | 'E' }))}
                      className="ml-2"
                    />
                    <span className="text-xs text-gray-500 ml-2">(Correct)</span>
                  </label>
                  <textarea
                    value={formData[`option_${option.toLowerCase()}` as keyof QuestionFormData] as string}
                    onChange={(e) => setFormData(prev => ({ ...prev, [`option_${option.toLowerCase()}`]: e.target.value } as any))}
                    placeholder={`Enter option ${option}...`}
                    className="w-full px-4 py-2 border rounded-lg min-h-[60px]"
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Explanation Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Explanation</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Explanation Text *</label>
              <TiptapSimpleEditor
                value={formData.explanation_text}
                onChange={(value) => setFormData(prev => ({ ...prev, explanation_text: value }))}
                placeholder="Enter the explanation..."
                specialtySlug="quiz"
                pageSlug="questions"
                documentId={documentId}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Explanation Image (Optional)</label>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <Upload className="w-4 h-4" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, 'explanation')
                      }}
                    />
                  </label>
                  {formData.explanation_image_url && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, explanation_image_url: null }))}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                      Remove image
                    </button>
                  )}
                </div>
                {formData.explanation_image_url && (
                  <div className="relative w-48">
                    <img
                      src={getImagePreviewUrl(formData.explanation_image_url) || ''}
                      alt="Explanation preview"
                      className="rounded-lg border border-gray-200 object-cover w-full h-32 bg-gray-50"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Metadata Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Metadata</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg"
                required
                disabled={categoriesLoading}
              >
                <option value="">{categoriesLoading ? 'Loading categories...' : 'Select category...'}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Difficulty *</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                {QUIZ_DIFFICULTIES.map((diff) => (
                  <option key={diff} value={diff}>{getDifficultyDisplayName(diff)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

