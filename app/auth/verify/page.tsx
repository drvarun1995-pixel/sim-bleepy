'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided')
      return
    }

    verifyEmail(token)
  }, [token])

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/verify?token=${token}`, {
        method: 'GET',
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('Your email has been verified successfully!')
      } else {
        if (data.error?.includes('expired')) {
          setStatus('expired')
          setMessage('This verification link has expired. Please request a new one.')
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed')
        }
      }
    } catch (error) {
      console.error('Verification error:', error)
      setStatus('error')
      setMessage('An error occurred during verification')
    }
  }

  const resendVerification = async () => {
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('A new verification email has been sent!')
      } else {
        setMessage(data.error || 'Failed to resend verification email')
      }
    } catch (error) {
      console.error('Resend error:', error)
      setMessage('Failed to resend verification email')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {status === 'loading' && <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />}
              {status === 'success' && <CheckCircle className="h-12 w-12 text-green-500" />}
              {(status === 'error' || status === 'expired') && <XCircle className="h-12 w-12 text-red-500" />}
            </div>
            <CardTitle className="text-2xl">
              {status === 'loading' && 'Verifying Email...'}
              {status === 'success' && 'Email Verified!'}
              {(status === 'error' || status === 'expired') && 'Verification Failed'}
            </CardTitle>
            <CardDescription>
              {status === 'loading' && 'Please wait while we verify your email address'}
              {status === 'success' && 'Your account is now ready to use'}
              {(status === 'error' || status === 'expired') && 'There was a problem verifying your email'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <Alert variant={status === 'success' ? 'default' : 'destructive'}>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <p className="text-center text-gray-600">
                  Welcome to Bleepy Simulator! You can now access all features.
                </p>
                <div className="flex flex-col space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/">Back to Home</Link>
                  </Button>
                </div>
              </div>
            )}

            {(status === 'error' || status === 'expired') && (
              <div className="space-y-4">
                <p className="text-center text-gray-600">
                  {status === 'expired' 
                    ? 'Your verification link has expired. You can request a new one below.'
                    : 'There was an issue with your verification link. Please try again.'
                  }
                </p>
                <div className="flex flex-col space-y-2">
                  <Button 
                    onClick={resendVerification}
                    className="w-full"
                    disabled={!token}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Resend Verification Email
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/auth/signin">Back to Sign In</Link>
                  </Button>
                </div>
              </div>
            )}

            {status === 'loading' && (
              <div className="text-center">
                <p className="text-gray-600">
                  This may take a few moments...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}