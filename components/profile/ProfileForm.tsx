'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { User, Save, Key, Mail, GraduationCap, Calendar, Stethoscope, Building2, Microscope, Heart, Brain, Baby, Zap, Eye, Bone, Settings, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { ProfilePictureUpload } from './ProfilePictureUpload'

interface ProfileFormProps {
  initialProfile: any
  onUpdate?: () => void
}

const roles = [
  { value: 'medical_student', label: 'Medical Student' },
  { value: 'foundation_doctor', label: 'Foundation Year Doctor' },
  { value: 'clinical_fellow', label: 'Clinical Fellow' },
  { value: 'specialty_doctor', label: 'Specialty Doctor' },
  { value: 'registrar', label: 'Registrar' },
  { value: 'consultant', label: 'Consultant' },
]

const availableInterests = [
  { value: 'clinical_skills', label: 'Clinical Skills', icon: Stethoscope },
  { value: 'research', label: 'Research & Academia', icon: Microscope },
  { value: 'surgery', label: 'Surgery', icon: Heart },
  { value: 'medicine', label: 'Medicine', icon: Brain },
  { value: 'pediatrics', label: 'Pediatrics', icon: Baby },
  { value: 'emergency', label: 'Emergency Medicine', icon: Zap },
  { value: 'psychiatry', label: 'Psychiatry', icon: Brain },
  { value: 'radiology', label: 'Radiology', icon: Eye },
  { value: 'orthopedics', label: 'Orthopedics', icon: Bone },
  { value: 'cardiology', label: 'Cardiology', icon: Heart },
  { value: 'oncology', label: 'Oncology', icon: Microscope },
  { value: 'neurology', label: 'Neurology', icon: Brain },
]

export function ProfileForm({ initialProfile, onUpdate }: ProfileFormProps) {
  const [saving, setSaving] = useState(false)
  const [passwordResetLoading, setPasswordResetLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [availableYears, setAvailableYears] = useState<string[]>([])

  // Form state
  const [profile, setProfile] = useState({
    name: initialProfile.name || '',
    email: initialProfile.email || '',
    role_type: initialProfile.role_type || '',
    university: initialProfile.university || '',
    study_year: initialProfile.study_year || '',
    foundation_year: initialProfile.foundation_year || '',
    hospital_trust: initialProfile.hospital_trust || '',
    specialty: initialProfile.specialty || '',
    interests: initialProfile.interests || [],
    show_all_events: initialProfile.show_all_events || false,
    about_me: initialProfile.about_me || '',
    tagline: initialProfile.tagline || '',
    profile_picture_url: initialProfile.profile_picture_url || null,
  })

  // Update available years when university changes
  useEffect(() => {
    if (profile.university === 'ARU') {
      setAvailableYears(['1', '2', '3', '4', '5'])
    } else if (profile.university === 'UCL') {
      setAvailableYears(['1', '2', '3', '4', '5', '6'])
    } else {
      setAvailableYears([])
    }

    // Reset year if it's not available in the new university
    if (profile.study_year && profile.university) {
      const years = profile.university === 'ARU' ? ['1', '2', '3', '4', '5'] : ['1', '2', '3', '4', '5', '6']
      if (!years.includes(profile.study_year)) {
        setProfile(prev => ({ ...prev, study_year: '' }))
      }
    }
  }, [profile.university])

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage(null)

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.name,
          role_type: profile.role_type,
          university: profile.university,
          study_year: profile.study_year,
          foundation_year: profile.foundation_year,
          hospital_trust: profile.hospital_trust,
          specialty: profile.specialty,
          interests: profile.interests,
          show_all_events: profile.show_all_events,
          about_me: profile.about_me,
          tagline: profile.tagline,
          profile_completed: true, // Mark as completed when they save
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Profile updated successfully!' })
        toast.success('Profile Updated', {
          description: 'Your profile has been updated successfully.',
          duration: 3000
        })
        onUpdate?.()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' })
        toast.error('Update Failed', {
          description: data.error || 'Please try again.',
          duration: 3000
        })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile' })
      toast.error('Update Failed', {
        description: 'An unexpected error occurred.',
        duration: 3000
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
          description: 'Check your email for password reset instructions.',
          duration: 3000
        })
      } else {
        toast.error('Failed to Send Reset Email', {
          description: data.error || 'Please try again.',
          duration: 3000
        })
      }
    } catch (error) {
      console.error('Error sending password reset:', error)
      toast.error('Failed to Send Reset Email', {
        description: 'An unexpected error occurred.',
        duration: 3000
      })
    } finally {
      setPasswordResetLoading(false)
    }
  }

  const toggleInterest = (value: string) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(value)
        ? prev.interests.filter((i: string) => i !== value)
        : [...prev.interests, value]
    }))
  }

  return (
    <div className="space-y-6">
      {/* Message Alert */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Profile Picture Upload */}
      <ProfilePictureUpload
        userId={initialProfile.id}
        currentPictureUrl={profile.profile_picture_url}
        userRole={initialProfile.role}
        onUploadComplete={(url) => {
          setProfile(prev => ({ ...prev, profile_picture_url: url }))
          onUpdate?.()
        }}
        onDeleteComplete={() => {
          setProfile(prev => ({ ...prev, profile_picture_url: null }))
          onUpdate?.()
        }}
      />

      {/* Basic Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Your personal details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your full name"
            />
          </div>

          {/* Tagline */}
          <div className="space-y-2">
            <Label htmlFor="tagline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tagline <span className="text-gray-400 text-xs ml-1">(Optional)</span>
            </Label>
            <Input
              id="tagline"
              type="text"
              value={profile.tagline}
              onChange={(e) => setProfile(prev => ({ ...prev, tagline: e.target.value }))}
              placeholder="e.g., FY1 Doctor passionate about cardiology"
              maxLength={255}
            />
            <p className="text-xs text-gray-500">
              A short headline that describes you (max 255 characters)
            </p>
          </div>

          {/* About Me */}
          <div className="space-y-2">
            <Label htmlFor="about_me" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              About Me <span className="text-gray-400 text-xs ml-1">(Optional)</span>
            </Label>
            <textarea
              id="about_me"
              value={profile.about_me}
              onChange={(e) => setProfile(prev => ({ ...prev, about_me: e.target.value }))}
              placeholder="Tell others about yourself, your interests, experience, and goals..."
              className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y"
              rows={5}
            />
            <p className="text-xs text-gray-500">
              Share more about your background and interests
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Professional Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Professional Details
          </CardTitle>
          <CardDescription>
            Your role and educational information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Role Type */}
          <div className="space-y-2">
            <Label htmlFor="role_type" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Role
            </Label>
            <Select 
              value={profile.role_type} 
              onValueChange={(value) => setProfile(prev => ({ 
                ...prev, 
                role_type: value,
                // Reset role-specific fields when role changes
                university: '',
                study_year: '',
                foundation_year: '',
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Medical Student Fields */}
          {profile.role_type === 'medical_student' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="university" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  University
                </Label>
                <Select 
                  value={profile.university} 
                  onValueChange={(value) => setProfile(prev => ({ ...prev, university: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your university" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARU">Anglia Ruskin University (ARU)</SelectItem>
                    <SelectItem value="UCL">University College London (UCL)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {profile.university === 'ARU' && 'ARU offers Years 1-5'}
                  {profile.university === 'UCL' && 'UCL offers Years 1-6'}
                </p>
              </div>

              {profile.university && (
                <div className="space-y-2">
                  <Label htmlFor="study_year" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Year of Study
                  </Label>
                  <Select 
                    value={profile.study_year} 
                    onValueChange={(value) => setProfile(prev => ({ ...prev, study_year: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your year" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          Year {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {/* Foundation Doctor Fields */}
          {profile.role_type === 'foundation_doctor' && (
            <div className="space-y-2">
              <Label htmlFor="foundation_year" className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Foundation Year
              </Label>
              <Select 
                value={profile.foundation_year} 
                onValueChange={(value) => setProfile(prev => ({ ...prev, foundation_year: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select foundation year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FY1">FY1 (Foundation Year 1)</SelectItem>
                  <SelectItem value="FY2">FY2 (Foundation Year 2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Hospital/Trust - For all medical roles */}
          {profile.role_type && (
            <div className="space-y-2">
              <Label htmlFor="hospital_trust" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Hospital/Trust <span className="text-gray-400 text-xs ml-1">(Optional)</span>
              </Label>
              <Input
                id="hospital_trust"
                type="text"
                value={profile.hospital_trust}
                onChange={(e) => setProfile(prev => ({ ...prev, hospital_trust: e.target.value }))}
                placeholder="e.g., Cambridge University Hospitals NHS Foundation Trust"
              />
            </div>
          )}

          {/* Specialty - For registrars and consultants */}
          {['registrar', 'consultant'].includes(profile.role_type) && (
            <div className="space-y-2">
              <Label htmlFor="specialty" className="flex items-center gap-2">
                <Microscope className="h-4 w-4" />
                Specialty <span className="text-gray-400 text-xs ml-1">(Optional)</span>
              </Label>
              <Input
                id="specialty"
                type="text"
                value={profile.specialty}
                onChange={(e) => setProfile(prev => ({ ...prev, specialty: e.target.value }))}
                placeholder="e.g., Cardiology, Emergency Medicine"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interests Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Your Interests
          </CardTitle>
          <CardDescription>
            Select topics you're interested in for personalized event recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableInterests.map((interest) => {
              const Icon = interest.icon
              const isSelected = profile.interests.includes(interest.value)

              return (
                <div
                  key={interest.value}
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-purple-300 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-200'
                  }`}
                  onClick={() => toggleInterest(interest.value)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleInterest(interest.value)}
                  />
                  <Icon className={`h-4 w-4 ${isSelected ? 'text-purple-600' : 'text-gray-400'}`} />
                  <label className="text-sm font-medium cursor-pointer flex-1">
                    {interest.label}
                  </label>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event Preferences Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Event Preferences
          </CardTitle>
          <CardDescription>
            Customize how events are displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3 p-4 border rounded-lg">
            <Checkbox
              id="show_all_events"
              checked={profile.show_all_events}
              onCheckedChange={(checked) => setProfile(prev => ({ ...prev, show_all_events: !!checked }))}
            />
            <div className="flex-1">
              <label
                htmlFor="show_all_events"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Show all events (not just mine)
              </label>
              <p className="text-xs text-gray-500 mt-1">
                By default, we only show events matching your profile. Enable this to see all events.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

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
    </div>
  )
}
