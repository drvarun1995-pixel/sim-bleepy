'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, X, Check } from 'lucide-react'
import { usePushNotifications } from '@/components/push/PushNotificationProvider'
import { toast } from 'sonner'

interface PushNotificationPromptProps {
  onComplete: () => void
  onSkip: () => void
}

export function PushNotificationPrompt({ onComplete, onSkip }: PushNotificationPromptProps) {
  const { isSupported, isSubscribed, permission, subscribe, isLoading } = usePushNotifications()
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [userSkipped, setUserSkipped] = useState(false)

  const handleEnable = async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in your browser')
      return
    }

    if (permission === 'denied') {
      toast.error('Push notifications are blocked. Please enable them in your browser settings.')
      return
    }

    try {
      setIsSubscribing(true)
      await subscribe()
      toast.success('Push notifications enabled!', {
        description: 'You\'ll receive important updates about events, bookings, and more.',
        duration: 3000
      })
      // Small delay to show success message
      setTimeout(() => {
        onComplete()
      }, 500)
    } catch (error) {
      console.error('Error enabling push notifications:', error)
      toast.error('Failed to enable push notifications', {
        description: 'You can enable them later in your profile settings.',
        duration: 3000
      })
      onComplete() // Continue anyway
    } finally {
      setIsSubscribing(false)
    }
  }

  const handleSkip = () => {
    setUserSkipped(true)
    toast.info('You can enable push notifications anytime in your profile settings')
    onSkip()
  }

  if (userSkipped || isSubscribed) {
    return null
  }

  if (!isSupported) {
    // If not supported, just show a message and continue
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-600" />
            Stay Updated
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in your browser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onComplete} className="w-full bg-purple-600 hover:bg-purple-700">
            Continue to Dashboard
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>Stay Updated with Push Notifications</CardTitle>
              <CardDescription>
                Get instant alerts about events, bookings, certificates, and more
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Event Reminders</p>
              <p className="text-sm text-gray-600">Get notified before events start</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Booking Updates</p>
              <p className="text-sm text-gray-600">Know when you're promoted from waitlist</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Certificates & Feedback</p>
              <p className="text-sm text-gray-600">Never miss important updates</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleEnable}
            disabled={isSubscribing || isLoading || permission === 'denied'}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            {isSubscribing ? 'Enabling...' : 'Enable Notifications'}
          </Button>
          <Button
            onClick={handleSkip}
            variant="outline"
            disabled={isSubscribing}
          >
            Maybe Later
          </Button>
        </div>

        {permission === 'denied' && (
          <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
            Notifications are blocked. Please enable them in your browser settings to receive updates.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

