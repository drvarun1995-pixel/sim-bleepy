'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ProfileForm } from '@/components/profile/ProfileForm'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TakeTourButton } from '@/components/onboarding/TakeTourButton'
import { ExternalLink } from 'lucide-react'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [avatarLibrary, setAvatarLibrary] = useState<any[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchProfile()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/profile')
      const data = await response.json()
      
      if (response.ok) {
        setProfile(data.user)
        setAvatarLibrary(data.avatarLibrary || [])
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
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

  if (!profile) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your account information and preferences
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <Button
              variant="outline"
              asChild
              disabled={!profile.public_slug}
              className="inline-flex items-center gap-2"
            >
              {profile.public_slug ? (
                <Link href={`/profile/${profile.public_slug}`}>
                  <ExternalLink className="h-4 w-4" />
                  {profile.is_public ? 'View Public Profile' : 'Preview Profile'}
                </Link>
              ) : (
                <span className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Generating link...
                </span>
              )}
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs text-left sm:text-right">
              {profile.is_public
                ? 'Your profile is currently visible to other learners.'
                : 'Your profile is private. Only you and authorized staff can view it.'}
            </p>
          </div>
        </div>

        {/* Take Tour Button */}
        <TakeTourButton />

        <ProfileForm initialProfile={profile} avatarLibrary={avatarLibrary} onUpdate={fetchProfile} />

        {/* Account Information Card */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Account Information</h3>
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