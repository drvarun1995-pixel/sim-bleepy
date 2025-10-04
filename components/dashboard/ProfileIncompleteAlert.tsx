'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { AlertCircle, Sparkles } from 'lucide-react'

export function ProfileIncompleteAlert() {
  const router = useRouter()

  return (
    <Alert className="mb-6 border-2 border-orange-400 bg-gradient-to-r from-orange-50 to-yellow-50">
      <Sparkles className="h-5 w-5 text-orange-600" />
      <AlertTitle className="text-orange-900 font-bold text-lg">Complete Your Profile</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
        <span className="text-orange-800">
          Get personalized event recommendations tailored to your role, university, and interests. It only takes 2 minutes!
        </span>
        <Button 
          size="sm" 
          onClick={() => router.push('/onboarding/profile')}
          className="bg-orange-600 hover:bg-orange-700 whitespace-nowrap"
        >
          Complete Now
        </Button>
      </AlertDescription>
    </Alert>
  )
}
