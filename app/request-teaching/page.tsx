'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { BookOpen, ArrowLeft, Send, Calendar, Clock, MapPin, Check, ChevronsUpDown } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function RequestTeachingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [userRole, setUserRole] = useState<'student' | 'educator' | 'admin' | 'meded_team' | 'ctf' | undefined>(undefined)

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!session?.user?.email) return
      
      try {
        const response = await fetch('/api/user/role')
        if (response.ok) {
          const data = await response.json()
          if (data.role) {
            setUserRole(data.role)
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
      }
    }

    if (status === 'authenticated') {
      fetchUserRole()
    }
  }, [session, status])

  // Fetch formats and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true)
        
        // Fetch formats
        const formatsResponse = await fetch('/api/formats')
        if (formatsResponse.ok) {
          const formatsData = await formatsResponse.json()
          setFormats(formatsData.formats || [])
        }
        
        // Fetch categories
        const categoriesResponse = await fetch('/api/categories')
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setCategories(categoriesData.categories || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load form data')
      } finally {
        setLoadingData(false)
      }
    }
    
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status])

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])
  
  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    preferredDate: '',
    preferredTime: '',
    duration: '',
    categories: [] as string[],
    format: '',
    additionalInfo: ''
  })
  
  const [formats, setFormats] = useState<Array<{ id: string; name: string }>>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [loadingData, setLoadingData] = useState(true)
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false)

  const durations = [
    '30 minutes',
    '45 minutes',
    '1 hour',
    '1.5 hours',
    '2 hours',
    'Half day (3-4 hours)',
    'Full day (6-8 hours)',
    'Multiple sessions'
  ]


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/requests/teaching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userEmail: session?.user?.email,
          userName: session?.user?.name
        }),
      })

      if (response.ok) {
        toast.success('Teaching request submitted successfully!', {
          description: 'We will review your request and get back to you soon.'
        })
        router.push('/events-list')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to submit request')
      }
    } catch (error) {
      console.error('Error submitting teaching request:', error)
      toast.error('Failed to submit request', {
        description: error instanceof Error ? error.message : 'Please try again or contact support if the issue persists.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }))
  }

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <DashboardLayoutClient role={userRole}>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayoutClient>
    )
  }

  // Don't render if not authenticated
  if (status === 'unauthenticated') {
    return null
  }

  return (
    <DashboardLayoutClient role={userRole}>
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-2xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100">
            <BookOpen className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Request Teaching Event</h1>
            <p className="text-gray-600">Request a specific teaching event or session</p>
          </div>
        </div>
      </div>

      <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-gray-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-600" />
            Teaching Request Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Topic */}
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-sm font-medium">
                Teaching Topic/Title *
              </Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                placeholder="e.g., ECG Interpretation Workshop"
                required
                className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Please provide a detailed description of the teaching session you'd like, including key topics to cover, clinical scenarios, or specific learning needs..."
                required
                rows={4}
                className="border-gray-200 focus:border-purple-300 focus:ring-purple-200 resize-none"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preferredDate" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Preferred Date
                </Label>
                <Input
                  id="preferredDate"
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                  className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                  style={{ 
                    WebkitAppearance: 'none',
                    colorScheme: 'light'
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="preferredTime" className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Preferred Time
                </Label>
                <Input
                  id="preferredTime"
                  type="time"
                  value={formData.preferredTime}
                  onChange={(e) => handleInputChange('preferredTime', e.target.value)}
                  className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-medium">
                Session Duration *
              </Label>
              <Select value={formData.duration} onValueChange={(value) => handleInputChange('duration', value)}>
                <SelectTrigger className="border-gray-200 focus:border-purple-300 focus:ring-purple-200">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {durations.map((duration) => (
                    <SelectItem key={duration} value={duration.toLowerCase()}>
                      {duration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Categories *
              </Label>
              <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoryPopoverOpen}
                    className="w-full justify-between border-gray-200 hover:border-purple-300 focus:border-purple-300 focus:ring-purple-200"
                  >
                    <span className="truncate">
                      {formData.categories.length === 0
                        ? "Select categories..."
                        : `${formData.categories.length} ${formData.categories.length === 1 ? 'category' : 'categories'} selected`}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <div className="max-h-64 overflow-y-auto p-2">
                    {loadingData ? (
                      <div className="text-sm text-gray-500 p-2">Loading categories...</div>
                    ) : categories.length === 0 ? (
                      <div className="text-sm text-gray-500 p-2">No categories available</div>
                    ) : (
                      <div className="space-y-1">
                        {categories.map((category) => (
                          <div
                            key={category.id}
                            className={cn(
                              "flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors",
                              formData.categories.includes(category.id) && "bg-purple-50"
                            )}
                            onClick={() => handleCategoryToggle(category.id)}
                          >
                            <div className={cn(
                              "flex h-4 w-4 items-center justify-center rounded border border-gray-300",
                              formData.categories.includes(category.id) && "bg-purple-600 border-purple-600"
                            )}>
                              {formData.categories.includes(category.id) && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <span className="text-sm text-gray-700">{category.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {formData.categories.length > 0 && (
                    <div className="border-t p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, categories: [] }))
                        }}
                      >
                        Clear all
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              {formData.categories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.categories.map((catId) => {
                    const category = categories.find(c => c.id === catId)
                    return category ? (
                      <span
                        key={catId}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs"
                      >
                        {category.name}
                      </span>
                    ) : null
                  })}
                </div>
              )}
            </div>

            {/* Format */}
            <div className="space-y-2">
              <Label htmlFor="format" className="text-sm font-medium">
                Teaching Format *
              </Label>
              <Select value={formData.format} onValueChange={(value) => handleInputChange('format', value)}>
                <SelectTrigger className="border-gray-200 focus:border-purple-300 focus:ring-purple-200">
                  <SelectValue placeholder="Select teaching format" />
                </SelectTrigger>
                <SelectContent>
                  {loadingData ? (
                    <SelectItem value="loading" disabled>Loading formats...</SelectItem>
                  ) : formats.length === 0 ? (
                    <SelectItem value="none" disabled>No formats available</SelectItem>
                  ) : (
                    formats.map((format) => (
                      <SelectItem key={format.id} value={format.id}>
                        {format.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Additional Information */}
            <div className="space-y-2">
              <Label htmlFor="additionalInfo" className="text-sm font-medium">
                Additional Information
              </Label>
              <Textarea
                id="additionalInfo"
                value={formData.additionalInfo}
                onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                placeholder="Any special requirements, equipment needed, or additional context that would help us organize this teaching session..."
                rows={3}
                className="border-gray-200 focus:border-purple-300 focus:ring-purple-200 resize-none"
              />
            </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="w-full sm:flex-1 order-2 sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !formData.topic || !formData.description || !formData.duration || formData.categories.length === 0 || !formData.format}
                    className="w-full sm:flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 order-1 sm:order-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        <span className="hidden sm:inline">Submitting...</span>
                        <span className="sm:hidden">Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Submit Request</span>
                        <span className="sm:hidden">Submit</span>
                      </>
                    )}
                  </Button>
                </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </DashboardLayoutClient>
  )
}
