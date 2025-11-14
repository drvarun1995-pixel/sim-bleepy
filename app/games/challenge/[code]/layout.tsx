import { ReactNode } from 'react'
import { ChallengeAudioProvider } from '@/components/quiz/ChallengeAudioProvider'

interface ChallengeLayoutProps {
  children: ReactNode
  params: { code: string }
}

export default function ChallengeLayout({ children, params }: ChallengeLayoutProps) {
  return <ChallengeAudioProvider challengeCode={params.code}>{children}</ChallengeAudioProvider>
}

