'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { QuestionForm } from '@/components/quiz/QuestionForm'

function CreateQuestionContent() {
  const searchParams = useSearchParams()
  const questionId = searchParams.get('id') || undefined

  return <QuestionForm questionId={questionId} />
}

export default function CreateQuestionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateQuestionContent />
    </Suspense>
  )
}

