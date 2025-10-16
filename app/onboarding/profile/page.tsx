'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProgressIndicator } from '@/components/onboarding/ProgressIndicator'
import { RoleSelector } from '@/components/onboarding/RoleSelector'
import { StudentDetails } from '@/components/onboarding/StudentDetails'
import { FoundationYearDetails } from '@/components/onboarding/FoundationYearDetails'
import { OtherRoleDetails } from '@/components/onboarding/OtherRoleDetails'
import { InterestsSelector } from '@/components/onboarding/InterestsSelector'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'

export default function OnboardingProfilePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [currentStep, setCurrentStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Form state
  const [roleType, setRoleType] = useState('')
  const [university, setUniversity] = useState('')
  const [studyYear, setStudyYear] = useState('')
  const [foundationYear, setFoundationYear] = useState('')
  const [hospitalTrust, setHospitalTrust] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [interests, setInterests] = useState<string[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    
    // Log session data for debugging
    if (status === 'authenticated' && session) {
      console.log('[Onboarding] Session data:', {
        email: session.user?.email,
        mustChangePassword: (session.user as any)?.mustChangePassword,
        adminCreated: (session.user as any)?.adminCreated
      })
      
      // If user still needs to change password, something went wrong with session refresh
      if ((session.user as any)?.mustChangePassword) {
        console.error('[Onboarding] User still has mustChangePassword=true, redirecting back to change password')
        router.push('/change-password')
      }
    }
  }, [status, router, session])

  const getStepLabels = () => {
    if (roleType === 'medical_student' || roleType === 'foundation_doctor') {
      return ['Select Role', 'Your Details', 'Interests']
    }
    return ['Select Role', 'Your Details', 'Interests']
  }

  const canProceed = () => {
    if (currentStep === 0) {
      return roleType !== ''
    }
    if (currentStep === 1) {
      if (roleType === 'medical_student') {
        // Only university is required, year is optional
        return university !== ''
      }
      if (roleType === 'foundation_doctor') {
        // Foundation doctor role is enough, specific year is optional
        return true
      }
      // Other roles can proceed without required fields
      return true
    }
    if (currentStep === 2) {
      // Interests are optional
      return true
    }
    return false
  }

  const handleNext = () => {
    if (!canProceed()) {
      toast.error('Please fill in all required fields')
      return
    }
    setCurrentStep(prev => prev + 1)
  }

  const handleBack = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSkip = async () => {
    try {
      // Record skip timestamp
      await fetch('/api/user/profile-skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      toast.info('You can complete your profile anytime from Settings', {
        duration: 5000
      })

      router.push('/dashboard')
    } catch (error) {
      console.error('Error skipping profile:', error)
      router.push('/dashboard')
    }
  }

  const handleComplete = async () => {
    if (!canProceed()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)

      const profileData = {
        role_type: roleType,
        university: university || null,
        study_year: studyYear || null,
        foundation_year: foundationYear || null,
        hospital_trust: hospitalTrust || null,
        specialty: specialty || null,
        interests: interests.length > 0 ? interests : null,
        profile_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })

      if (!response.ok) {
        throw new Error('Failed to save profile')
      }

      toast.success('Profile completed successfully!', {
        description: 'Welcome to your personalized dashboard',
        duration: 3000
      })

      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            Let's personalize your experience to show you the most relevant content
          </p>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator 
          currentStep={currentStep}
          totalSteps={3}
          stepLabels={getStepLabels()}
        />

        {/* Main Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>
              {currentStep === 0 && 'What describes you best?'}
              {currentStep === 1 && 'Tell us more about yourself'}
              {currentStep === 2 && 'Your interests'}
            </CardTitle>
            <CardDescription>
              {currentStep === 0 && 'Select your current role'}
              {currentStep === 1 && 'This helps us show you relevant events'}
              {currentStep === 2 && 'Optional - helps us recommend events you\'ll love'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Role Selection */}
            {currentStep === 0 && (
              <RoleSelector 
                selectedRole={roleType}
                onRoleChange={setRoleType}
              />
            )}

            {/* Step 2: Role-specific Details */}
            {currentStep === 1 && (
              <>
                {roleType === 'medical_student' && (
                  <StudentDetails
                    university={university}
                    studyYear={studyYear}
                    onUniversityChange={setUniversity}
                    onStudyYearChange={setStudyYear}
                  />
                )}
                {roleType === 'foundation_doctor' && (
                  <FoundationYearDetails
                    foundationYear={foundationYear}
                    hospitalTrust={hospitalTrust}
                    onFoundationYearChange={setFoundationYear}
                    onHospitalTrustChange={setHospitalTrust}
                  />
                )}
                {!['medical_student', 'foundation_doctor'].includes(roleType) && (
                  <OtherRoleDetails
                    roleType={roleType}
                    hospitalTrust={hospitalTrust}
                    specialty={specialty}
                    onHospitalTrustChange={setHospitalTrust}
                    onSpecialtyChange={setSpecialty}
                  />
                )}
              </>
            )}

            {/* Step 3: Interests */}
            {currentStep === 2 && (
              <InterestsSelector
                interests={interests}
                onInterestsChange={setInterests}
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div>
                {currentStep > 0 ? (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                  >
                    I'll do this later
                  </Button>
                )}
              </div>

              <div>
                {currentStep < 2 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleComplete}
                    disabled={saving || !canProceed()}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {saving ? 'Saving...' : 'Complete Profile'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>You can always update your profile later in Settings</p>
        </div>
      </div>
    </div>
  )
}
