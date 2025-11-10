"use client"

import { useEffect, useState } from 'react'
import { Globe2, Users } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface ProfileVisibilityCalloutProps {
  initialIsPublic: boolean
  className?: string
}

export function ProfileVisibilityCallout({ initialIsPublic, className }: ProfileVisibilityCalloutProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    setIsPublic(initialIsPublic)
  }, [initialIsPublic])

  const handleToggle = async (nextValue: boolean) => {
    const previous = isPublic
    setIsPublic(nextValue)
    setIsPending(true)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: nextValue }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile visibility')
      }

      toast.success(nextValue ? 'Your profile is now public.' : 'Your profile is now private.')
    } catch (error) {
      setIsPublic(previous)
      console.error('Failed to toggle profile visibility', error)
      toast.error('Unable to update profile visibility', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card className={cn('border border-blue-200 bg-blue-50/80', className)}>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 text-blue-900">
          <div className="rounded-xl bg-white/80 p-2 text-blue-600 shadow-inner">
            <Globe2 className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">Make your profile discoverable</p>
            <p className="text-xs text-blue-800 sm:text-sm">
              You need a public profile to send or receive friend and mentor requests. You can change this any time from your profile settings.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-full bg-white/70 px-3 py-1.5 text-sm text-blue-900 shadow-inner">
          <Users className="h-4 w-4" />
          <span className="font-medium">{isPublic ? 'Public' : 'Private'}</span>
          <Switch
            checked={isPublic}
            onCheckedChange={handleToggle}
            disabled={isPending}
            aria-label="Toggle public profile"
          />
        </div>
      </CardContent>
    </Card>
  )
}
