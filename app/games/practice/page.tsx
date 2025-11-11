'use client'

import { PracticeSetup } from '@/components/quiz/PracticeSetup'
import { BetaNotice } from '@/components/quiz/BetaNotice'

export default function PracticePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <BetaNotice />
      <PracticeSetup />
    </div>
  )
}

