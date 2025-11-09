"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
  User,
  Save,
  Key,
  Mail,
  GraduationCap,
  Calendar,
  Stethoscope,
  Building2,
  Microscope,
  Heart,
  Brain,
  Baby,
  Zap,
  Eye,
  Bone,
  Settings,
  FileText,
  Globe2,
  Shield,
  MessageCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { ProfilePictureUpload } from './ProfilePictureUpload'

interface AvatarLibraryItem {
  slug: string
  file_path: string
  display_name?: string | null
}

interface ProfileFormProps {
  initialProfile: any
  avatarLibrary?: AvatarLibraryItem[]
  onUpdate?: () => void
}

const roles = [
  { value: 'medical_student', label: 'Medical Student' },
  { value: 'foundation_doctor', label: 'Foundation Year Doctor' },
  { value: 'clinical_fellow', label: 'Clinical Fellow' },
  { value: 'specialty_doctor', label: 'Specialty Doctor' },
  { value: 'registrar', label: 'Registrar' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'meded_team', label: 'MedEd Team' },
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

export function ProfileForm({ initialProfile, avatarLibrary = [], onUpdate }: ProfileFormProps) {
  const [saving, setSaving] = useState(false)
  const [passwordResetLoading, setPasswordResetLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [pendingAvatar, setPendingAvatar] = useState<{ type: 'library' | 'upload'; asset: string | null; useDefault?: boolean } | null>(null)
  const [avatarProcessing, setAvatarProcessing] = useState(false)

  const initialShowAllEvents =
    initialProfile.role_type === 'meded_team' ? true : initialProfile.show_all_events || false

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
    show_all_events: initialShowAllEvents,
    about_me: initialProfile.about_me || '',
    tagline: initialProfile.tagline || '',
    profile_picture_url: initialProfile.profile_picture_url || null,
    is_public: initialProfile.is_public || false,
    public_display_name: initialProfile.public_display_name || '',
    allow_messages: initialProfile.allow_messages ?? true,
    avatar_type: initialProfile.avatar_type || (initialProfile.profile_picture_url ? 'upload' : 'library'),
    avatar_asset: initialProfile.avatar_asset || initialProfile.profile_picture_url || null,
    avatar_thumbnail: initialProfile.avatar_thumbnail || null,
    public_slug: initialProfile.public_slug || '',
    pause_connection_requests: initialProfile.pause_connection_requests ?? false,
  })

  const effectiveAvatarType = pendingAvatar?.type ?? profile.avatar_type
  const effectiveAvatarAsset = pendingAvatar?.asset ?? profile.avatar_asset
  const effectivePictureUrl = pendingAvatar?.type === 'upload'
    ? pendingAvatar.asset
    : profile.profile_picture_url

  const currentAvatarUrl =
    effectiveAvatarType === 'upload'
      ? effectivePictureUrl
      : effectiveAvatarAsset
      ? `/${effectiveAvatarAsset}`
      : null

  const isMededTeam = profile.role_type === 'meded_team'

  useEffect(() => {
    if (profile.role_type === 'meded_team' && !profile.show_all_events) {
      setProfile(prev => ({ ...prev, show_all_events: true }))
    }
  }, [profile.role_type, profile.show_all_events])

  const handleAvatarChange = async (
    type: 'library' | 'upload',
    asset: string | null,
    options?: { useDefault?: boolean }
  ) => {
    if (avatarProcessing) return

    try {
      setAvatarProcessing(true)

      const isSameAsCurrent =
        !options?.useDefault &&
        type === profile.avatar_type &&
        ((type === 'upload' &&
          (asset === profile.profile_picture_url || asset === profile.avatar_asset)) ||
          (type === 'library' && asset === profile.avatar_asset))

      if (isSameAsCurrent) {
        setPendingAvatar(null)
        return
      }

      setPendingAvatar({ type, asset, useDefault: options?.useDefault })
    } catch (error) {
      console.error('Error updating avatar selection:', error)
      toast.error('Failed to update avatar selection', {
        description: 'Please try again.',
        duration: 4000,
      })
    } finally {
      setAvatarProcessing(false)
    }
  }

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

      const avatarTypeToPersist = pendingAvatar?.type ?? profile.avatar_type
      const avatarAssetToPersist =
        avatarTypeToPersist === 'upload'
          ? pendingAvatar?.asset || profile.profile_picture_url || profile.avatar_asset
          : pendingAvatar?.asset ?? profile.avatar_asset

      const interestsToPersist = isMededTeam ? [] : profile.interests

      const payload: Record<string, any> = {
        name: profile.name,
        role_type: profile.role_type,
        university: profile.university,
        study_year: profile.study_year,
        foundation_year: profile.foundation_year,
        hospital_trust: profile.hospital_trust,
        specialty: profile.specialty,
        interests: interestsToPersist,
        show_all_events: isMededTeam ? true : profile.show_all_events,
        about_me: profile.about_me,
        tagline: profile.tagline,
        pause_connection_requests: profile.pause_connection_requests,
        is_public: profile.is_public,
        public_display_name: profile.public_display_name,
        allow_messages: profile.allow_messages,
        avatar_type: avatarTypeToPersist,
        avatar_asset: avatarAssetToPersist,
      }

      if (pendingAvatar?.useDefault) {
        payload.use_default_avatar = true
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
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
        if (data.user) {
          setProfile(prev => ({
            ...prev,
            name: data.user.name || prev.name,
            role_type: data.user.role_type || prev.role_type,
            university: data.user.university || '',
            study_year: data.user.study_year || '',
            foundation_year: data.user.foundation_year || '',
            hospital_trust: data.user.hospital_trust || '',
            specialty: data.user.specialty || '',
            interests: data.user.interests || [],
            show_all_events: data.user.role_type === 'meded_team' ? true : data.user.show_all_events || false,
            about_me: data.user.about_me || '',
            tagline: data.user.tagline || '',
            profile_picture_url: data.user.profile_picture_url || null,
            is_public: data.user.is_public || false,
            public_display_name: data.user.public_display_name || '',
            allow_messages: data.user.allow_messages ?? true,
            avatar_type: data.user.avatar_type || 'library',
            avatar_asset: data.user.avatar_asset || null,
            avatar_thumbnail: data.user.avatar_thumbnail || null,
            public_slug: data.user.public_slug || prev.public_slug || '',
            pause_connection_requests: data.user.pause_connection_requests ?? prev.pause_connection_requests,
          }))
          setPendingAvatar(null)
        }
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
        currentPictureUrl={currentAvatarUrl || undefined}
        userRole={initialProfile.role}
        avatarType={profile.avatar_type as 'library' | 'upload'}
        onUploadComplete={(url) => {
          void handleAvatarChange('upload', url)
        }}
        onDeleteComplete={() => {
          void handleAvatarChange('library', null, { useDefault: true })
        }}
      />

      {/* Visibility & Messaging */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe2 className="h-5 w-5" />
            Visibility & Messaging
          </CardTitle>
          <CardDescription>
            Control who can discover your profile and send you messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label htmlFor="is_public" className="flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-purple-500" />
                Public profile
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                When enabled, other members can view your profile and request to connect.
              </p>
            </div>
            <Switch
              id="is_public"
              checked={profile.is_public}
              onCheckedChange={(checked) =>
                setProfile(prev => ({ ...prev, is_public: checked }))
              }
            />
          </div>

          {profile.is_public && (
            <div className="space-y-2">
              <Label htmlFor="public_display_name" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Public display name
              </Label>
              <Input
                id="public_display_name"
                value={profile.public_display_name}
                onChange={(e) => setProfile(prev => ({ ...prev, public_display_name: e.target.value }))}
                placeholder="e.g., Dr. Adams"
                maxLength={60}
              />
              <p className="text-xs text-gray-500">
                This name appears on your public profile, comments, and messages.
              </p>
            </div>
          )}

          <div className="flex items-start justify-between gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div>
              <Label htmlFor="allow_messages" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-purple-500" />
                Allow direct messages
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                Keep this on to let eligible users contact you via the Messages center.
              </p>
            </div>
            <Switch
              id="allow_messages"
              checked={profile.allow_messages}
              onCheckedChange={(checked) =>
                setProfile(prev => ({ ...prev, allow_messages: checked }))
              }
            />
          </div>

          <div className="flex items-start justify-between gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div>
              <Label htmlFor="pause_connections" className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-500" />
                Pause new connection requests
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                Temporarily stop friend or mentor requests. Existing connections remain unaffected.
              </p>
            </div>
            <Switch
              id="pause_connections"
              checked={profile.pause_connection_requests}
              onCheckedChange={(checked) =>
                setProfile(prev => ({ ...prev, pause_connection_requests: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Avatar Library */}
      {avatarLibrary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Bleepy Avatars
            </CardTitle>
            <CardDescription>
              Choose one of our privacy-safe avatars or upload your own above
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {avatarLibrary.map((avatar) => {
                const isSelected =
                  profile.avatar_type === 'library' && profile.avatar_asset === avatar.file_path
                return (
                  <button
                    key={avatar.slug}
                    type="button"
                    onClick={() => void handleAvatarChange('library', avatar.file_path)}
                    className={`relative rounded-lg border p-3 flex flex-col items-center gap-2 transition ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50'
                        : pendingAvatar?.type === 'library' && pendingAvatar.asset === avatar.file_path
                        ? 'border-purple-300 bg-purple-50/50'
                        : 'border-gray-200 hover:border-purple-300'
                    } ${avatarProcessing ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    <span className="absolute top-2 right-2 text-xs font-semibold text-purple-600">
                      {pendingAvatar?.type === 'library' && pendingAvatar.asset === avatar.file_path
                        ? 'Pending'
                        : isSelected
                        ? 'Selected'
                        : ''}
                    </span>
                    <img
                      src={`/${avatar.file_path}`}
                      alt={avatar.display_name || avatar.slug}
                      className="h-16 w-16 rounded-full border border-gray-200"
                    />
                    <span className="text-xs font-medium text-gray-700 text-center">
                      {avatar.display_name || 'Bleepy Avatar'}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-gray-500">
                Want to start fresh? We can re-assign your deterministic default avatar.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleAvatarChange('library', null, { useDefault: true })}
                disabled={avatarProcessing}
              >
                Reset to default avatar
              </Button>
            </div>

            {pendingAvatar && (
              <Alert>
                <AlertDescription>
                  {pendingAvatar.useDefault
                    ? 'We\'ll assign your default Bleepy avatar after you save.'
                    : pendingAvatar.type === 'upload'
                    ? 'Your new profile photo is ready. Save to make it official.'
                    : 'Avatar will update once you save your changes.'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

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
                hospital_trust: '',
                specialty: '',
                interests: value === 'meded_team' ? [] : prev.interests,
                show_all_events: value === 'meded_team' ? true : prev.show_all_events,
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

          {isMededTeam ? (
            <div className="rounded-md bg-gray-50 border border-dashed border-gray-300 p-4 text-sm text-gray-600">
              MedEd Team members don&rsquo;t need to provide placement or specialty details. Save your changes to finish.
            </div>
          ) : (
            <>
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
              {profile.role_type && profile.role_type !== 'meded_team' && (
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Interests Card */}
      {!isMededTeam && (
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
      )}

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
              checked={isMededTeam ? true : profile.show_all_events}
              disabled={isMededTeam}
              onCheckedChange={(checked) => {
                if (isMededTeam) return
                setProfile(prev => ({ ...prev, show_all_events: !!checked }))
              }}
            />
            <div className="flex-1">
              <label
                htmlFor="show_all_events"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Show all events (not just mine)
              </label>
              <p className="text-xs text-gray-500 mt-1">
                {isMededTeam
                  ? 'MedEd Team members always have access to all events.'
                  : 'By default, we only show events matching your profile. Enable this to see all events.'}
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
