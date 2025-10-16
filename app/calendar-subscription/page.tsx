'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Copy, Check, Info, ArrowLeft, ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getCategories, getFormats } from '@/lib/events-api'

interface UserProfile {
  university?: string
  study_year?: string
  role_type?: string
  foundation_year?: string
  profile_completed?: boolean
}

export default function CalendarSubscriptionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedFormat, setSelectedFormat] = useState<string>('')
  const [categories, setCategories] = useState<any[]>([])
  const [formats, setFormats] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    // Load categories, formats, and user profile
    const loadData = async () => {
      try {
        setLoading(true)
        
        const [categoriesData, formatsData, profileRes] = await Promise.all([
          getCategories(),
          getFormats(),
          fetch('/api/user/profile')
        ])

        setCategories(categoriesData || [])
        setFormats(formatsData || [])

        if (profileRes.ok) {
          const profileData = await profileRes.json()
          setUserProfile(profileData.user || null)
          
          // Auto-select categories based on user profile
          if (profileData.user && profileData.user.profile_completed) {
            const autoSelectedCategories: string[] = []
            
            // Add university category
            if (profileData.user.university) {
              const universityMatch = categoriesData.find((cat: any) => 
                cat.name.toLowerCase().includes(profileData.user.university.toLowerCase())
              )
              if (universityMatch) {
                autoSelectedCategories.push(universityMatch.name)
              }
            }
            
            // Add year category for medical students
            if (profileData.user.role_type === 'medical_student' && profileData.user.study_year) {
              const yearMatch = categoriesData.find((cat: any) => 
                cat.name.toLowerCase().includes(`year ${profileData.user.study_year}`)
              )
              if (yearMatch) {
                autoSelectedCategories.push(yearMatch.name)
              }
            }
            
            // Add foundation year category for foundation doctors
            if (profileData.user.role_type === 'foundation_doctor') {
              const fyMatch = categoriesData.find((cat: any) => 
                cat.name.toLowerCase().includes('foundation')
              )
              if (fyMatch) {
                autoSelectedCategories.push(fyMatch.name)
              }
            }
            
            setSelectedCategories(autoSelectedCategories)
          }
        }
      } catch (error) {
        console.error('Error loading filter data:', error)
        toast.error('Failed to load data', {
          description: 'Please refresh the page to try again'
        })
      } finally {
        setLoading(false)
      }
    }

    if (status === 'authenticated') {
      loadData()
    }
  }, [status])

  // Generate subscription URL
  const generateSubscriptionUrl = () => {
    const baseUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}`
      : 'https://sim.bleepy.co.uk'
    
    const params = new URLSearchParams()
    
    if (selectedCategories.length > 0) {
      params.append('categories', selectedCategories.join(','))
    }
    
    if (selectedFormat) {
      params.append('format', selectedFormat)
    }

    const queryString = params.toString()
    return `${baseUrl}/api/calendar/feed${queryString ? `?${queryString}` : ''}`
  }

  const subscriptionUrl = generateSubscriptionUrl()

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(subscriptionUrl)
    setCopied(true)
    toast.success('Calendar URL copied!', {
      description: 'Paste this URL into your calendar app',
      duration: 3000
    })
    setTimeout(() => setCopied(false), 3000)
  }

  const handleToggleCategory = (categoryName: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    )
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
          <p className="text-gray-600">Loading calendar subscription...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Calendar Subscription</h1>
          </div>
          <p className="text-gray-600">
            Subscribe to a personalized calendar feed that automatically syncs Bleepy events with your calendar app
          </p>
        </div>

        {/* Info Alert */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            Calendar subscriptions auto-update when events change. Your calendar app will check for updates every 24 hours.
          </AlertDescription>
        </Alert>

        {/* Filters Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Customize Your Feed</CardTitle>
            <CardDescription>
              Select which events you want to include in your calendar subscription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 15).map((category) => (
                  <Badge
                    key={category.id}
                    variant={selectedCategories.includes(category.name) ? 'default' : 'outline'}
                    className={`cursor-pointer ${
                      selectedCategories.includes(category.name)
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleToggleCategory(category.name)}
                  >
                    {category.name}
                  </Badge>
                ))}
                {selectedCategories.length === 0 && (
                  <span className="text-sm text-gray-500 py-1">
                    No filter - all categories included
                  </span>
                )}
              </div>
            </div>

            {/* Format Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Format
              </label>
              <Select value={selectedFormat || undefined} onValueChange={(value) => setSelectedFormat(value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All formats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All formats</SelectItem>
                  {formats.map((format) => (
                    <SelectItem key={format.id} value={format.name}>
                      {format.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters Summary */}
            {(selectedCategories.length > 0 || selectedFormat) && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-gray-700 mb-2">Active Filters:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((cat) => (
                    <Badge key={cat} variant="secondary" className="bg-purple-100 text-purple-700">
                      {cat}
                    </Badge>
                  ))}
                  {selectedFormat && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {selectedFormat}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription URL Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Calendar Feed URL</CardTitle>
            <CardDescription>
              Copy this URL to subscribe in your calendar app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-sm break-all">
                {subscriptionUrl}
              </div>
              <Button
                onClick={handleCopyUrl}
                className="flex-shrink-0"
                variant={copied ? 'default' : 'outline'}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URL
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {/* Google Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                Google Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Open Google Calendar</li>
                <li>Click "+" next to "Other calendars"</li>
                <li>Select "From URL"</li>
                <li>Paste the URL above</li>
                <li>Click "Add calendar"</li>
              </ol>
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-blue-600"
                onClick={() => window.open('https://calendar.google.com/calendar/u/0/r/settings/addbyurl', '_blank')}
              >
                Open Google Calendar
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* Outlook */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                Outlook
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Open Outlook Calendar</li>
                <li>Click "Add calendar"</li>
                <li>Select "Subscribe from web"</li>
                <li>Paste the URL above</li>
                <li>Click "Import"</li>
              </ol>
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-blue-600"
                onClick={() => window.open('https://outlook.live.com/calendar', '_blank')}
              >
                Open Outlook Calendar
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* Apple Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                Apple Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Open Calendar app</li>
                <li>Go to File → New Calendar Subscription</li>
                <li>Paste the URL above</li>
                <li>Click "Subscribe"</li>
                <li>Choose update frequency</li>
              </ol>
              <p className="text-xs text-gray-500 mt-2">
                Or use iCal app on macOS
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">How often does the calendar update?</h4>
              <p className="text-sm text-gray-600">
                Your calendar app will check for updates every 24 hours. Some apps let you manually refresh more frequently.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">What happens if I change my filters?</h4>
              <p className="text-sm text-gray-600">
                You'll need to unsubscribe from the old feed and subscribe to a new one with your updated filters.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Can I subscribe to multiple feeds?</h4>
              <p className="text-sm text-gray-600">
                Yes! You can create different subscriptions with different filters and subscribe to all of them.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-1">What timezone are events displayed in?</h4>
              <p className="text-sm text-gray-600">
                All events are in Europe/London timezone (GMT/BST). Your calendar app will automatically convert to your local timezone.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-1">How do I unsubscribe?</h4>
              <p className="text-sm text-gray-600">
                In your calendar app, find the "Bleepy Events" calendar in your calendar list and delete it.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

