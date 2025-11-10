"use client"

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface DownloadPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPasswordVerified: () => void
  fileName?: string
}

export function DownloadPasswordDialog({
  open,
  onOpenChange,
  onPasswordVerified,
  fileName,
}: DownloadPasswordDialogProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')

  const handleVerify = async () => {
    if (!password.trim()) {
      setError('Please enter the password')
      return
    }

    setVerifying(true)
    setError('')

    try {
      const response = await fetch('/api/platform/download-password/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Password verification failed')
      }

      if (data.valid) {
        // Password is correct
        setPassword('')
        setError('')
        onPasswordVerified()
        onOpenChange(false)
      } else {
        setError('Incorrect password. Please try again.')
      }
    } catch (error) {
      console.error('Password verification error:', error)
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to verify password. Please try again.'
      )
    } finally {
      setVerifying(false)
    }
  }

  const handleCancel = () => {
    setPassword('')
    setError('')
    onOpenChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !verifying) {
      handleVerify()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100">
              <Lock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                Password Required
              </DialogTitle>
              <DialogDescription className="mt-1">
                {fileName
                  ? `Enter the password to download "${fileName}"`
                  : 'Enter the password to download this file'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">Download Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter password"
                className={`pr-10 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
                disabled={verifying}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-medium mb-1">Information</p>
            <p>
              This password is distributed to medical students only. If you don't have the password, please contact your MedEd Team or Clinical Teaching Fellow.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={verifying}
          >
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={verifying || !password.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {verifying ? (
              <>
                <span className="mr-2">Verifying...</span>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </>
            ) : (
              'Verify & Download'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

