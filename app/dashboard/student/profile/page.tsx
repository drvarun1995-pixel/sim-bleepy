'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, Save, Key, Mail, GraduationCap, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface UserProfile {
  id: string
  email: string
  name: string
  role: string
  university?: string
  year?: string
  createdAt: string
}

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [passwordResetLoading, setPasswordResetLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    email: '',
    name: '',
    role: 'student',
    university: '',
    year: '',
    createdAt: ''
  })

  useEffect(() => {
    if (session?.user?.email) {
      fetchProfile()
    } else {
      // If no session, redirect to sign in
      router.push('/auth/signin')
    }
  }, [session, router])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setMessage(null)
      
      const response = await fetch('/api/user/profile')
      const data = await response.json()
      
      if (response.ok) {
        setProfile(data.user)
      } else {
        console.error('Profile fetch error:', data)
        setMessage({ type: 'error', text: data.error || 'Failed to fetch profile' })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setMessage({ type: 'error', text: 'Network error: Failed to fetch profile' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage(null)

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Profile updated successfully!' })
        toast.success('Profile Updated', {
          description: 'Your profile has been updated successfully.'
        })
        
        // Update the session if needed
        await update()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' })
        toast.error('Update Failed', {
          description: data.error || 'Please try again.'
        })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile' })
      toast.error('Update Failed', {
        description: 'An unexpected error occurred.'
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordReset = async () => {
    try {
      setPasswordResetLoading(true)
      
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: profile.email
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Password Reset Email Sent', {
          description: 'Check your email for password reset instructions.'
        })
      } else {
        toast.error('Failed to Send Reset Email', {
          description: data.error || 'Please try again.'
        })
      }
    } catch (error) {
      console.error('Error sending password reset:', error)
      toast.error('Failed to Send Reset Email', {
        description: 'An unexpected error occurred.'
      })
    } finally {
      setPasswordResetLoading(false)
    }
  }

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-2">Loading profile...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <p className="text-gray-600">Redirecting to sign in...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account information and preferences
          </p>
        </div>

        {/* Message Alert */}
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="bg-gray-50 dark:bg-gray-800"
              />
              <p className="text-xs text-gray-500">Email address cannot be changed</p>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={profile.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={profile.role || 'student'} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="educator">Educator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* University */}
            <div className="space-y-2">
              <Label htmlFor="university" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                University/Institution
              </Label>
              <Input
                id="university"
                type="text"
                value={profile.university || ''}
                onChange={(e) => handleInputChange('university', e.target.value)}
                placeholder="Enter your university or institution name"
              />
            </div>

            {/* Year of Medical School */}
            <div className="space-y-2">
              <Label htmlFor="year" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Year of Medical School
              </Label>
              <Select 
                value={profile.year || 'not-specified'} 
                onValueChange={(value) => handleInputChange('year', value === 'not-specified' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-specified">Not specified</SelectItem>
                  <SelectItem value="pre-med">Pre-Medical</SelectItem>
                  <SelectItem value="year-1">Year 1</SelectItem>
                  <SelectItem value="year-2">Year 2</SelectItem>
                  <SelectItem value="year-3">Year 3</SelectItem>
                  <SelectItem value="year-4">Year 4</SelectItem>
                  <SelectItem value="year-5">Year 5</SelectItem>
                  <SelectItem value="year-6">Year 6</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="resident">Resident</SelectItem>
                  <SelectItem value="fellow">Fellow</SelectItem>
                  <SelectItem value="attending">Attending Physician</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full sm:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Password Reset Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Password & Security
            </CardTitle>
            <CardDescription>
              Manage your password and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                Need to change your password? We'll send you a secure reset link via email.
              </p>
              <Button 
                variant="outline" 
                onClick={handlePasswordReset}
                disabled={passwordResetLoading}
                className="w-full sm:w-auto"
              >
                <Key className="h-4 w-4 mr-2" />
                {passwordResetLoading ? 'Sending...' : 'Send Password Reset Email'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Details about your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Member since:</span>
                <p className="text-gray-900 dark:text-white">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Account ID:</span>
                <p className="text-gray-900 dark:text-white font-mono text-xs">
                  {profile.id.slice(0, 8)}...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
