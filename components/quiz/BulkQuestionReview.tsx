'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Edit2, Trash2, CheckCircle, AlertCircle, X } from 'lucide-react'
import { QUIZ_DIFFICULTIES, getDifficultyDisplayName } from '@/lib/quiz/categories'
import { TiptapSimpleEditor } from '@/components/ui/tiptap-simple-editor'
import { useQuizCategories } from '@/hooks/useQuizCategories'

interface ExtractedQuestion {
  id: string
  scenario_text: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  option_e: string
  correct_answer: 'A' | 'B' | 'C' | 'D' | 'E'
  explanation_text: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  status: 'draft' | 'published'
  isValid?: boolean
  errors?: string[]
  asset_folder_id?: string
}

interface BulkQuestionReviewProps {
  questions: ExtractedQuestion[]
  onConfirm: (questions: ExtractedQuestion[]) => void
  onCancel: () => void
}

export function BulkQuestionReview({ questions: initialQuestions, onConfirm, onCancel }: BulkQuestionReviewProps) {
  const { categories, loading: categoriesLoading } = useQuizCategories()
  const [questions, setQuestions] = useState<ExtractedQuestion[]>(() =>
    initialQuestions.map((question, index) => ({
      ...question,
      asset_folder_id:
        question.asset_folder_id ||
        question.id ||
        `bulk-${Date.now().toString(36)}-${index}`,
    }))
  )
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)

  const handleUpdateQuestion = (questionId: string, updates: Partial<ExtractedQuestion>) => {
    setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, ...updates } : q))
  }

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId))
  }

  const handleConfirm = () => {
    onConfirm(questions)
  }

  const validCount = questions.filter(q => q.isValid !== false).length
  const invalidCount = questions.length - validCount

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Review Questions</h2>
          <p className="text-gray-600 mt-1">
            {validCount} valid, {invalidCount} invalid
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={validCount === 0}>
            Create {validCount} Question{validCount !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((question) => (
          <Card key={question.id} className={question.isValid === false ? 'border-red-300' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  Question {questions.indexOf(question) + 1}
                  {question.isValid === false && (
                    <span className="ml-2 text-sm text-red-600">(Has Errors)</span>
                  )}
                </CardTitle>
                <div className="flex gap-2">
                  {editingQuestionId === question.id ? (
                    <Button
                      size="sm"
                      onClick={() => setEditingQuestionId(null)}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingQuestionId(question.id)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteQuestion(question.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {question.errors && question.errors.length > 0 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  {question.errors.map((error, idx) => (
                    <div key={idx} className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {editingQuestionId === question.id ? (
                <div className="space-y-4">
                  <div>
                    <Label>Scenario Text</Label>
                    <TiptapSimpleEditor
                      value={question.scenario_text}
                      onChange={(value) => handleUpdateQuestion(question.id, { scenario_text: value })}
                      placeholder="Scenario/context..."
                      specialtySlug="quiz"
                      pageSlug="questions"
                      documentId={question.asset_folder_id || question.id}
                    />
                  </div>
                  <div>
                    <Label>Question Text *</Label>
                    <Textarea
                      value={question.question_text}
                      onChange={(e) => handleUpdateQuestion(question.id, { question_text: e.target.value })}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {(['A', 'B', 'C', 'D', 'E'] as const).map((option) => (
                      <div key={option}>
                        <Label>
                          Option {option} *
                          <input
                            type="radio"
                            name={`correct-${question.id}`}
                            checked={question.correct_answer === option}
                            onChange={() => handleUpdateQuestion(question.id, { correct_answer: option })}
                            className="ml-2"
                          />
                        </Label>
                        <Textarea
                          value={question[`option_${option.toLowerCase()}` as keyof ExtractedQuestion] as string}
                          onChange={(e) => handleUpdateQuestion(question.id, { [`option_${option.toLowerCase()}`]: e.target.value } as any)}
                          className="min-h-[60px]"
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label>Explanation Text *</Label>
                    <TiptapSimpleEditor
                      value={question.explanation_text}
                      onChange={(value) => handleUpdateQuestion(question.id, { explanation_text: value })}
                      placeholder="Explanation..."
                      specialtySlug="quiz"
                      pageSlug="questions"
                      documentId={question.asset_folder_id || question.id}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Category *</Label>
                      <Select
                        value={question.category}
                        onValueChange={(value) => handleUpdateQuestion(question.id, { category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categoriesLoading ? (
                            <SelectItem value="" disabled>Loading categories...</SelectItem>
                          ) : (
                            categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Difficulty *</Label>
                      <Select
                        value={question.difficulty}
                        onValueChange={(value) => handleUpdateQuestion(question.id, { difficulty: value as 'easy' | 'medium' | 'hard' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {QUIZ_DIFFICULTIES.map((diff) => (
                            <SelectItem key={diff} value={diff}>{getDifficultyDisplayName(diff)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={question.status}
                      onValueChange={(value) => handleUpdateQuestion(question.id, { status: value as 'draft' | 'published' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <strong>Scenario:</strong>
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: question.scenario_text || 'None' }} />
                  </div>
                  <div>
                    <strong>Question:</strong> {question.question_text}
                  </div>
                  <div>
                    <strong>Options:</strong>
                    <ul className="list-disc list-inside ml-4">
                      <li>A: {question.option_a} {question.correct_answer === 'A' && '✓'}</li>
                      <li>B: {question.option_b} {question.correct_answer === 'B' && '✓'}</li>
                      <li>C: {question.option_c} {question.correct_answer === 'C' && '✓'}</li>
                      <li>D: {question.option_d} {question.correct_answer === 'D' && '✓'}</li>
                      <li>E: {question.option_e} {question.correct_answer === 'E' && '✓'}</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Explanation:</strong>
                    <div 
                      className="prose max-w-none prose-headings:font-bold prose-strong:font-bold prose-ul:list-disc prose-ul:ml-4 prose-li:my-1"
                      dangerouslySetInnerHTML={{ __html: question.explanation_text || '' }}
                    />
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span><strong>Category:</strong> {question.category}</span>
                    <span><strong>Difficulty:</strong> {getDifficultyDisplayName(question.difficulty)}</span>
                    <span><strong>Status:</strong> {question.status}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

