'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar, Copy, Check, Info, ExternalLink, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { getCategories, getFormats, getOrganizers, getSpeakers } from '@/lib/events-api'

interface UserProfile {
  university?: string
  study_year?: string
  role_type?: string
  foundation_year?: string
  profile_completed?: boolean
}

interface CalendarSubscriptionProps {
  isOpen: boolean
  onClose: () => void
}

export function CalendarSubscription({ isOpen, onClose }: CalendarSubscriptionProps) {
  const { data: session } = useSession()
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedFormat, setSelectedFormat] = useState<string>('')
  const [selectedOrganizers, setSelectedOrganizers] = useState<string[]>([])
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [formats, setFormats] = useState<any[]>([])
  const [organizers, setOrganizers] = useState<any[]>([])
  const [speakers, setSpeakers] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (isOpen && session) {
      loadData()
    }
  }, [isOpen, session])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [categoriesData, formatsData, organizersData, speakersData, profileRes] = await Promise.all([
        getCategories(),
        getFormats(),
        getOrganizers(),
        getSpeakers(),
        fetch('/api/user/profile')
      ])

      setCategories(categoriesData || [])
      setFormats(formatsData || [])
      setOrganizers(organizersData || [])
      setSpeakers(speakersData || [])

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
    
    if (selectedOrganizers.length > 0) {
      params.append('organizers', selectedOrganizers.join(','))
    }
    
    if (selectedSpeakers.length > 0) {
      params.append('speakers', selectedSpeakers.join(','))
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

  const handleToggleOrganizer = (organizerName: string) => {
    setSelectedOrganizers(prev => 
      prev.includes(organizerName)
        ? prev.filter(o => o !== organizerName)
        : [...prev, organizerName]
    )
  }

  const handleToggleSpeaker = (speakerName: string) => {
    setSelectedSpeakers(prev => 
      prev.includes(speakerName)
        ? prev.filter(s => s !== speakerName)
        : [...prev, speakerName]
    )
  }

  const openGoogleCalendar = () => {
    // Check if running on localhost
    const isLocalhost = subscriptionUrl.includes('localhost') || subscriptionUrl.includes('127.0.0.1')
    
    if (isLocalhost) {
      navigator.clipboard.writeText(subscriptionUrl).then(() => {
        toast.error('Development Mode', {
          description: 'Google Calendar requires a public HTTPS URL. This will work once deployed to production (https://sim.bleepy.co.uk)',
          duration: 7000
        })
      })
      return
    }
    
    // Use Google Calendar's direct import URL format
    const encodedUrl = encodeURIComponent(subscriptionUrl)
    const googleImportUrl = `https://calendar.google.com/calendar/render?cid=${encodedUrl}`
    
    // Copy the URL to clipboard first
    navigator.clipboard.writeText(subscriptionUrl).then(() => {
      toast.success('Opening Google Calendar!', {
        description: 'Direct calendar subscription opening...',
        duration: 3000
      })
    }).catch(() => {
      toast.info('Opening Google Calendar calendar subscription')
    })
    
    // Try Google Calendar's direct import
    window.open(googleImportUrl, '_blank')
  }

  const openOutlook = () => {
    // Check if running on localhost
    const isLocalhost = subscriptionUrl.includes('localhost') || subscriptionUrl.includes('127.0.0.1')
    
    if (isLocalhost) {
      navigator.clipboard.writeText(subscriptionUrl).then(() => {
        toast.error('Development Mode', {
          description: 'Outlook requires a public HTTPS URL. This will work once deployed to production (https://sim.bleepy.co.uk)',
          duration: 7000
        })
      })
      return
    }
    
    // Use Outlook's direct subscription URL format
    const encodedUrl = encodeURIComponent(subscriptionUrl)
    const calendarName = encodeURIComponent('Bleepy Events')
    const outlookUrl = `https://outlook.office.com/owa?path=/calendar/action/compose&rru=addsubscription&url=${encodedUrl}&name=${calendarName}`
    
    // Copy the URL to clipboard as backup
    navigator.clipboard.writeText(subscriptionUrl).then(() => {
      toast.success('Opening Outlook 365!', {
        description: 'Direct calendar subscription link opening...',
        duration: 3000
      })
    }).catch(() => {
      toast.info('Opening Outlook 365 calendar subscription')
    })
    
    // Open Outlook with direct subscription URL
    window.open(outlookUrl, '_blank')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Calendar Subscription</h2>
              <p className="text-sm text-gray-600">Sync Bleepy events to your calendar</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                <p className="text-gray-600">Loading calendar options...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Info Alert */}
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  Calendar subscriptions auto-update when events change. Your calendar app will check for updates every 24 hours.
                </AlertDescription>
              </Alert>

              {/* Filters */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Categories {selectedCategories.length > 0 && `(${selectedCategories.length} selected)`}
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedCategories.length > 0 ? `${selectedCategories.length} categories selected` : "All categories"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <div className="p-2">
                        <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => setSelectedCategories([])}>
                          <Checkbox checked={selectedCategories.length === 0} />
                          <span className="text-sm">All categories</span>
                        </div>
                        {categories.map((category) => (
                          <div key={category.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => handleToggleCategory(category.name)}>
                            <Checkbox checked={selectedCategories.includes(category.name)} />
                            <span className="text-sm">{category.name}</span>
                          </div>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                {/* Format Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Format
                  </label>
                  <Select value={selectedFormat || 'all'} onValueChange={(value) => setSelectedFormat(value === 'all' ? '' : value)}>
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

                {/* Organizers Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Organizers {selectedOrganizers.length > 0 && `(${selectedOrganizers.length} selected)`}
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedOrganizers.length > 0 ? `${selectedOrganizers.length} organizers selected` : "All organizers"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <div className="p-2">
                        <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => setSelectedOrganizers([])}>
                          <Checkbox checked={selectedOrganizers.length === 0} />
                          <span className="text-sm">All organizers</span>
                        </div>
                        {organizers.map((organizer) => (
                          <div key={organizer.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => handleToggleOrganizer(organizer.name)}>
                            <Checkbox checked={selectedOrganizers.includes(organizer.name)} />
                            <span className="text-sm">{organizer.name}</span>
                          </div>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                {/* Speakers Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Speakers {selectedSpeakers.length > 0 && `(${selectedSpeakers.length} selected)`}
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedSpeakers.length > 0 ? `${selectedSpeakers.length} speakers selected` : "All speakers"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <div className="p-2">
                        <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => setSelectedSpeakers([])}>
                          <Checkbox checked={selectedSpeakers.length === 0} />
                          <span className="text-sm">All speakers</span>
                        </div>
                        {speakers.map((speaker) => (
                          <div key={speaker.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => handleToggleSpeaker(speaker.name)}>
                            <Checkbox checked={selectedSpeakers.includes(speaker.name)} />
                            <span className="text-sm">{speaker.name}</span>
                          </div>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Filters Summary */}
              {(selectedCategories.length > 0 || selectedFormat || selectedOrganizers.length > 0 || selectedSpeakers.length > 0) && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Active Filters:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategories.map((cat) => (
                      <Badge key={cat} variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                        {cat}
                      </Badge>
                    ))}
                    {selectedFormat && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                        {selectedFormat}
                      </Badge>
                    )}
                    {selectedOrganizers.map((org) => (
                      <Badge key={org} variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                        {org}
                      </Badge>
                    ))}
                    {selectedSpeakers.map((speaker) => (
                      <Badge key={speaker} variant="secondary" className="bg-green-100 text-green-700 text-xs">
                        {speaker}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Subscription URL */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Calendar Feed URL</CardTitle>
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
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid md:grid-cols-3 gap-3">
                <Button
                  onClick={openGoogleCalendar}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                    <Calendar className="h-3 w-3 text-white" />
                  </div>
                  Open Google Calendar
                  <ExternalLink className="h-4 w-4" />
                </Button>

                <Button
                  onClick={openOutlook}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                    <Calendar className="h-3 w-3 text-white" />
                  </div>
                  Add to Outlook 365
                  <ExternalLink className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => {
                    // For Apple Calendar, we'll just copy the URL and show instructions
                    handleCopyUrl()
                    toast.info('URL copied!', {
                      description: 'In Apple Calendar: File → New Calendar Subscription → Paste URL'
                    })
                  }}
                >
                  <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center">
                    <Calendar className="h-3 w-3 text-white" />
                  </div>
                  Copy for Apple Calendar
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              {/* Instructions */}
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Google Calendar:</strong> Click the button to open Google Calendar with direct import. (Note: Requires public HTTPS URL - works in production)</p>
                <p><strong>Outlook 365:</strong> Click the button to open Outlook with direct subscription link. (Note: Requires public HTTPS URL - works in production)</p>
                <p><strong>Apple Calendar:</strong> File → New Calendar Subscription → Paste the URL. (Works in development mode)</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
