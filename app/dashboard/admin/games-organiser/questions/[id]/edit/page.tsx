'use client'

import { use } from 'react'
import { QuestionForm } from '@/components/quiz/QuestionForm'

export default function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <div className="p-4 lg:p-8">
      <QuestionForm questionId={id} />
    </div>
  )
}


