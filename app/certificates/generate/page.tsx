'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { 
  Sparkles, 
  Users, 
  FileImage,
  Mail,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Eye,
  Download
} from 'lucide-react'
import { toast } from 'sonner'

interface Event {
  event_id: string
  title: string
  date: string
}

interface Template {
  id: string
  name: string
  created_at: string
}

interface Attendee {
  id: string
  user_id: string
  checked_in: boolean
  status: string
  users?: {
    id: string
    name: string
    email: string
  }
}

export default function GenerateCertificatesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [attendees, setAttendees] = useState<Attendee[]>([])
  
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [includeAttended, setIncludeAttended] = useState(true)
  const [includeAll, setIncludeAll] = useState(false)
  const [customSelection, setCustomSelection] = useState(false)
  const [selectedAttendeeIds, setSelectedAttendeeIds] = useState<string[]>([])
  const [regenerateExisting, setRegenerateExisting] = useState(false)
  
  // Search state
  const [eventSearchQuery, setEventSearchQuery] = useState('')
  const [templateSearchQuery, setTemplateSearchQuery] = useState('')
  
  // Filtered arrays for search
  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
    event.date.toLowerCase().includes(eventSearchQuery.toLowerCase())
  )
  
  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(templateSearchQuery.toLowerCase())
  )
  
  const [showPreview, setShowPreview] = useState(false)
  const [generationResults, setGenerationResults] = useState<{
    success: number
    failed: number
    emailsSent: number
    skipped: number
  } | null>(null)

  // Email-related state
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [generatedCertificates, setGeneratedCertificates] = useState<any[]>([])
  const [sendingEmails, setSendingEmails] = useState(false)
  const [emailResults, setEmailResults] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  // Pre-load event and template from URL parameters
  useEffect(() => {
    if (events.length > 0 && searchParams.get('event')) {
      setSelectedEvent(searchParams.get('event')!)
    }
    if (templates.length > 0 && searchParams.get('template')) {
      setSelectedTemplate(searchParams.get('template')!)
    }
  }, [events, templates, searchParams])

  useEffect(() => {
    if (selectedEvent) {
      loadAttendees(selectedEvent)
    }
  }, [selectedEvent])

  const loadData = async () => {
    try {
      setLoading(true)
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()

      // Load events using the same view as other pages (events with booking enabled)
      const { data: eventsData } = await supabase
        .from('event_booking_stats')
        .select('event_id, title, date')
        .order('date', { ascending: false })
        .limit(50)

      if (eventsData) {
        console.log('Loaded events:', eventsData.length)
        setEvents(eventsData)
      } else {
        console.log('No events loaded')
        setEvents([])
      }

      // Load templates from API
      const templatesResponse = await fetch('/api/certificates/templates')
      const templatesResult = await templatesResponse.json()

      if (!templatesResponse.ok) {
        console.error('Error loading templates:', templatesResult.error)
        setTemplates([])
      } else if (templatesResult.templates) {
        console.log('Loaded templates:', templatesResult.templates.length)
        // Map to the format expected by the component
        const mappedTemplates = templatesResult.templates.map((t: any) => ({
          id: t.id,
          name: t.name,
          created_at: t.created_at
        }))
        setTemplates(mappedTemplates)
      } else {
        console.log('No templates loaded')
        setTemplates([])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load events and templates')
    } finally {
      setLoading(false)
    }
  }

  const loadAttendees = async (eventId: string) => {
    try {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()

      console.log('Loading attendees for event:', eventId)

      // Debug: Check if we're authenticated via NextAuth
      console.log('NextAuth session:', session)
      console.log('Session user:', session?.user)

      // Since NextAuth and Supabase auth are separate, we need to use a different approach
      // Let's use the API route instead of direct Supabase client
      const response = await fetch(`/api/certificates/attendees?eventId=${eventId}`)
      const result = await response.json()
      
      console.log('API route result:', result)
      
      if (result.success) {
        setAttendees(result.attendees)
        console.log('Set attendees via API:', result.attendees.length)
      } else {
        setAttendees([])
        console.log('No attendees found via API:', result.error)
      }

      // API route handles the data processing
    } catch (error) {
      console.error('Error loading attendees:', error)
      toast.error('Failed to load attendees')
    }
  }

  const getSelectedAttendees = () => {
    if (customSelection) {
      return attendees.filter(a => selectedAttendeeIds.includes(a.user_id))
    }
    if (includeAll) {
      return attendees
    }
    if (includeAttended) {
      return attendees.filter(a => a.checked_in)
    }
    return []
  }

  const checkExistingCertificates = async (attendees: Attendee[], eventId: string) => {
    try {
      const attendeeIds = attendees.map(a => a.user_id)
      const response = await fetch('/api/certificates/check-existing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          attendeeIds
        })
      })

      if (!response.ok) {
        throw new Error('Failed to check existing certificates')
      }

      const result = await response.json()
      return result.existingCertificates || []
    } catch (error) {
      console.error('Error checking existing certificates:', error)
      return []
    }
  }

  const handleSendEmails = async () => {
    console.log('📧 handleSendEmails called with certificates:', generatedCertificates)
    
    if (!generatedCertificates || generatedCertificates.length === 0) {
      console.log('❌ No certificates to send')
      toast.error('No certificates to send')
      return
    }

    console.log('📧 Starting email sending process...')
    setSendingEmails(true)
    const loadingToast = toast.loading('Sending certificate emails...')

    try {
      const certificateIds = generatedCertificates.map(cert => cert.id)
      
      const response = await fetch('/api/certificates/send-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ certificateIds })
      })

      const result = await response.json()
      toast.dismiss(loadingToast)

      if (!response.ok) {
        console.error('❌ Email API Error:', result)
        throw new Error(result.error || result.details || 'Failed to send emails')
      }

      setEmailResults(result.results)
      
      const { sent, failed } = result.summary
      
      if (failed > 0) {
        toast.success(`Emails sent successfully!`, {
          description: `${sent} sent, ${failed} failed`,
          duration: 5000
        })
      } else {
        toast.success(`All ${sent} certificate emails sent successfully!`)
      }

      // Update generation results
      setGenerationResults(prev => prev ? {
        ...prev,
        emailsSent: sent
      } : null)

      // Don't auto-close modal - let user decide when to close

    } catch (error) {
      console.error('Error sending emails:', error)
      toast.dismiss(loadingToast)
      
      // Show specific error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to send certificate emails'
      toast.error(errorMessage, {
        description: 'Check console for more details',
        duration: 8000
      })
    } finally {
      setSendingEmails(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedEvent || !selectedTemplate) {
      toast.error('Please select both an event and a template')
      return
    }

    const selectedAttendees = getSelectedAttendees()
    if (selectedAttendees.length === 0) {
      toast.error('No attendees selected. Please check your filters.')
      return
    }

    setGenerating(true)
    const loadingToast = toast.loading(`Checking for existing certificates...`)

    let results: any[] = []

    try {
      // Check for existing certificates first
      const existingCertificates = await checkExistingCertificates(selectedAttendees, selectedEvent)
      const existingUserIds = existingCertificates.map((cert: any) => cert.user_id)
      const newAttendees = selectedAttendees.filter(attendee => !existingUserIds.includes(attendee.user_id))
      const duplicateAttendees = selectedAttendees.filter(attendee => existingUserIds.includes(attendee.user_id))

      let attendeesToProcess = newAttendees
      let skippedCount = 0

      if (duplicateAttendees.length > 0) {
        if (regenerateExisting) {
          // Include existing attendees for regeneration
          attendeesToProcess = selectedAttendees
          toast.dismiss(loadingToast)
          toast.info(`Regenerating certificates for ${duplicateAttendees.length} existing attendees`, {
            description: `This will overwrite their current certificates`,
            duration: 5000
          })
        } else {
          // Skip existing attendees
          skippedCount = duplicateAttendees.length
          toast.dismiss(loadingToast)
          toast.warning(`${duplicateAttendees.length} attendees already have certificates`, {
            description: `Skipping: ${duplicateAttendees.map(a => a.users?.name || 'Unknown').join(', ')}`,
            duration: 5000
          })
        }
      }

      if (attendeesToProcess.length === 0) {
        toast.dismiss(loadingToast)
        toast.info('No attendees to process')
        setGenerating(false)
        return
      }

      toast.dismiss(loadingToast)
      const generationToast = toast.loading(`Generating ${attendeesToProcess.length} certificates...`)
      // First, get the template details with fields
      const templateResponse = await fetch(`/api/certificates/templates/${selectedTemplate}`)
      if (!templateResponse.ok) {
        throw new Error('Failed to fetch template details')
      }
      const templateData = await templateResponse.json()
      const template = {
        ...templateData.template,
        // The API already provides a fresh signed URL in background_image
        backgroundImage: templateData.template.background_image || templateData.template.backgroundImage,
        // Map canvas_size to canvasSize for compatibility
        canvasSize: templateData.template.canvas_size || templateData.template.canvasSize || { width: 800, height: 600 }
      }

      console.log('🔍 Template data for certificate generation:', {
        templateId: selectedTemplate,
        template: template,
        backgroundImage: template.backgroundImage,
        imagePath: template.imagePath,
        fieldsCount: template.fields?.length || 0
      })

      if (!template.fields || template.fields.length === 0) {
        toast.dismiss(loadingToast)
        toast.error('Template has no text fields. Please add fields to your template.')
        return
      }

      // Get event details
      const eventResponse = await fetch(`/api/events/${selectedEvent}`)
      if (!eventResponse.ok) {
        throw new Error('Failed to fetch event details')
      }
      const event = await eventResponse.json()
      
      if (!event || !event.title) {
        throw new Error('Event data is invalid or missing')
      }

      let successCount = 0
      let failedCount = 0

      // Generate certificates for each attendee (only new ones)
      for (const attendee of attendeesToProcess) {
        try {
          const certificateId = crypto.randomUUID()
          
          // Prepare certificate data
          const certificateData = {
            event_title: event.title,
            event_description: event.description || '',
            event_date: new Date(event.date).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }),
            event_start_time: event.start_time || '',
            event_end_time: event.end_time || '',
            event_time_notes: event.time_notes || '',
            event_location: event.location || '',
            event_organizer: event.organizer || '',
            event_category: event.category || '',
            event_format: event.format || '',
            attendee_name: attendee.users?.name || '',
            attendee_email: attendee.users?.email || '',
            certificate_date: new Date().toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }),
            certificate_id: certificateId,
            user_id: attendee.user_id,
            event_id: selectedEvent,
            generator_name: session?.user?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown_Generator' // Person who generated the certificate
          }

          // Generate certificate image with text fields (client-side)
          const { generateCertificateImageClient } = await import('@/lib/certificate-generator-client')
          const canvasDataUrl = await generateCertificateImageClient(template, certificateData)
          
          if (!canvasDataUrl) {
            throw new Error('Failed to generate certificate image')
          }

          // Upload the generated certificate to Supabase Storage
          const uploadResponse = await fetch('/api/certificates/generate-with-fields', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              templateId: selectedTemplate,
              certificateData,
              canvasDataUrl,
              regenerateExisting
            })
          })

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json()
            if (errorData.code === 'DUPLICATE_CERTIFICATE') {
              console.log(`Certificate already exists for attendee ${attendee.user_id}`)
              // This should not happen since we pre-check, but handle gracefully
              return
            }
            throw new Error('Failed to upload certificate')
          }

          const uploadResult = await uploadResponse.json()
          
          // Certificate is already saved to database by the generate-with-fields endpoint
          results.push({
            success: true,
            certificate: {
              id: uploadResult.certificate?.id || certificateId,
              attendee_name: attendee.users?.name || '',
              attendee_email: attendee.users?.email || ''
            }
          })

          successCount++
          console.log('✅ Certificate generated successfully for:', attendee.users?.name, 'Success count:', successCount)

        } catch (attendeeError) {
          console.error(`Error generating certificate for attendee ${attendee.user_id}:`, attendeeError)
          results.push({
            success: false,
            error: attendeeError instanceof Error ? attendeeError.message : 'Unknown error',
            attendee_name: attendee.users?.name || '',
            attendee_email: attendee.users?.email || ''
          })
          failedCount++
        }
      }

      toast.dismiss(generationToast)
      
      // Show comprehensive results
      if (skippedCount > 0) {
        toast.success(`Generated ${successCount} certificates`, {
          description: `${skippedCount} were skipped (already existed)${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
          duration: 6000
        })
      } else if (regenerateExisting && duplicateAttendees.length > 0) {
        toast.success(`Regenerated ${successCount} certificates`, {
          description: `Overwrote existing certificates${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
          duration: 6000
        })
      } else {
        toast.success(`Successfully generated ${successCount} certificates!`, {
          description: failedCount > 0 ? `${failedCount} failed` : 'All certificates generated successfully'
        })
      }

      setGenerationResults({
        success: successCount,
        failed: failedCount,
        emailsSent: 0, // We'll implement email sending later
        skipped: skippedCount
      })

      // Show email modal if certificates were generated successfully
      console.log('📊 Generation results:', { successCount, failedCount, skippedCount })
      console.log('📊 Results array:', results)
      
      if (successCount > 0) {
        console.log('📧 Showing email modal for', successCount, 'certificates')
        setShowEmailModal(true)
        setGeneratedCertificates(results.filter(r => r.success).map(r => r.certificate))
      } else {
        console.log('❌ No certificates generated successfully, not showing email modal')
      }

    } catch (error) {
      console.error('Error generating certificates:', error)
      toast.dismiss(loadingToast)
      toast.error('Failed to generate certificates')
    } finally {
      setGenerating(false)
    }
  }

  const selectedEventData = events.find(e => e.event_id === selectedEvent)
  const selectedTemplateData = templates.find(t => t.id === selectedTemplate)
  const selectedAttendeesCount = getSelectedAttendees().length

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/certificates')}
            className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 transition-all duration-200 hover:scale-105 w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Back to Certificates</span>
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Generate Certificates</h1>
              <p className="text-gray-600">Bulk generate certificates for event attendees</p>
            </div>
          </div>
        </div>

        {generationResults ? (
          /* Results View */
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CheckCircle className="h-6 w-6" />
                Certificates Generated Successfully!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Generated</p>
                  <p className="text-2xl font-bold text-green-600">{generationResults.success}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-yellow-200">
                  <p className="text-sm text-gray-600 mb-1">Skipped</p>
                  <p className="text-2xl font-bold text-yellow-600">{generationResults.skipped}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Emails Sent</p>
                  <p className="text-2xl font-bold text-blue-600">{generationResults.emailsSent}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-red-200">
                  <p className="text-sm text-gray-600 mb-1">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{generationResults.failed}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={() => router.push('/certificates/manage')}>
                  View All Certificates
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setGenerationResults(null)
                    setSelectedEvent('')
                    setSelectedTemplate('')
                  }}
                >
                  Generate More
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Configuration View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Left Column - Configuration */}
            <div className="lg:col-span-2 space-y-4 lg:space-y-6">
              {/* Step 1: Select Event */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </span>
                    Select Event
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Event</Label>
                    <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an event..." />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2">
                          <Input
                            placeholder="Search events..."
                            value={eventSearchQuery}
                            onChange={(e) => setEventSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            className="mb-2"
                          />
                        </div>
                        {filteredEvents.length === 0 ? (
                          <SelectItem value="no-events" disabled>
                            No events found
                          </SelectItem>
                        ) : (
                          filteredEvents.map((event) => (
                            <SelectItem key={event.event_id} value={event.event_id}>
                              {event.title} - {new Date(event.date).toLocaleDateString('en-GB')}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedEventData && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-900">{selectedEventData.title}</p>
                      <p className="text-xs text-blue-700">
                        {new Date(selectedEventData.date).toLocaleDateString('en-GB', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Step 2: Select Template */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </span>
                    Select Template
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Certificate Template</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2">
                          <Input
                            placeholder="Search templates..."
                            value={templateSearchQuery}
                            onChange={(e) => setTemplateSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            className="mb-2"
                          />
                        </div>
                        {filteredTemplates.length === 0 ? (
                          <SelectItem value="no-templates" disabled>
                            {templates.length === 0 ? 'No templates available - Create one first' : 'No templates found'}
                          </SelectItem>
                        ) : (
                          filteredTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex items-center gap-2">
                                <FileImage className="h-4 w-4" />
                                {template.name}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    
                    {/* Design Certificate Button */}
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push('/certificates/image-builder')}
                      >
                        <FileImage className="h-4 w-4 mr-2" />
                        Design New Certificate
                      </Button>
                    </div>
                  </div>

                  {templates.length === 0 && (
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        No templates found. Please create a template first.
                      </p>
                      <Button
                        variant="link"
                        className="text-yellow-900 p-0 h-auto"
                        onClick={() => router.push('/certificates/image-builder')}
                      >
                        Create Template →
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Step 3: Select Recipients */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </span>
                    Select Recipients
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedEvent ? (
                    <>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="attended"
                            checked={includeAttended}
                            onCheckedChange={(checked) => {
                              setIncludeAttended(checked as boolean)
                              if (checked) {
                                setIncludeAll(false)
                                setCustomSelection(false)
                              }
                            }}
                          />
                          <Label htmlFor="attended" className="cursor-pointer">
                            Only attendees who checked in ({attendees.filter(a => a.checked_in).length})
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="all"
                            checked={includeAll}
                            onCheckedChange={(checked) => {
                              setIncludeAll(checked as boolean)
                              if (checked) {
                                setIncludeAttended(false)
                                setCustomSelection(false)
                              }
                            }}
                          />
                          <Label htmlFor="all" className="cursor-pointer">
                            All registered attendees ({attendees.length})
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="custom"
                            checked={customSelection}
                            onCheckedChange={(checked) => {
                              setCustomSelection(checked as boolean)
                              if (checked) {
                                setIncludeAttended(false)
                                setIncludeAll(false)
                              }
                            }}
                          />
                          <Label htmlFor="custom" className="cursor-pointer">
                            Custom selection ({selectedAttendeeIds.length} selected)
                          </Label>
                        </div>
                      </div>

                      {/* Custom Selection List */}
                      {customSelection && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border max-h-60 overflow-y-auto">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900">Select Attendees</h4>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const checkedInIds = attendees.filter(a => a.checked_in).map(a => a.user_id)
                                    setSelectedAttendeeIds(checkedInIds)
                                  }}
                                >
                                  Select Checked In
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedAttendeeIds(attendees.map(a => a.user_id))}
                                >
                                  Select All
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedAttendeeIds([])}
                                >
                                  Clear All
                                </Button>
                              </div>
                            </div>
                            
                            {attendees.map((attendee) => (
                              <div key={attendee.user_id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`attendee-${attendee.user_id}`}
                                  checked={selectedAttendeeIds.includes(attendee.user_id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedAttendeeIds(prev => [...prev, attendee.user_id])
                                    } else {
                                      setSelectedAttendeeIds(prev => prev.filter(id => id !== attendee.user_id))
                                    }
                                  }}
                                />
                                <Label 
                                  htmlFor={`attendee-${attendee.user_id}`} 
                                  className="cursor-pointer flex-1 flex items-center justify-between"
                                >
                                  <div>
                                    <span className="font-medium">{attendee.users?.name || 'Unknown'}</span>
                                    <span className="text-sm text-gray-500 ml-2">({attendee.users?.email})</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {attendee.checked_in && (
                                      <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                                        Checked In
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      {attendee.status}
                                    </Badge>
                                  </div>
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-gray-600" />
                            <span className="font-medium text-gray-900">
                              {selectedAttendeesCount} certificate{selectedAttendeesCount !== 1 ? 's' : ''} will be generated
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Please select an event first</p>
                  )}
                </CardContent>
              </Card>


              {/* Regenerate Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold">
                      4
                    </span>
                    Duplicate Handling
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="regenerateExisting"
                      checked={regenerateExisting}
                      onCheckedChange={(checked) => setRegenerateExisting(checked as boolean)}
                    />
                    <Label htmlFor="regenerateExisting" className="cursor-pointer">
                      Regenerate existing certificates (overwrite)
                    </Label>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {regenerateExisting 
                      ? "⚠️ This will overwrite existing certificates for the same attendees and event"
                      : "Current: Skip attendees who already have certificates for this event"
                    }
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Summary & Actions */}
            <div className="space-y-4 lg:space-y-6">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-500">Event</Label>
                    <p className="text-sm font-medium">
                      {selectedEventData?.title || 'Not selected'}
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">Template</Label>
                    <p className="text-sm font-medium">
                      {selectedTemplateData?.name || 'Not selected'}
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">Recipients</Label>
                    <p className="text-sm font-medium">
                      {selectedAttendeesCount} attendee{selectedAttendeesCount !== 1 ? 's' : ''}
                    </p>
                  </div>


                  <div className="pt-4 space-y-2">
                    <Button
                      onClick={handleGenerate}
                      disabled={!selectedEvent || !selectedTemplate || selectedAttendeesCount === 0 || generating}
                      className="w-full"
                    >
                      {generating ? (
                        <>Generating...</>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Certificates
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-gray-500">
                      This will generate {selectedAttendeesCount} certificate{selectedAttendeesCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">Note</p>
                      <p className="text-blue-700">
                        Certificates will be saved to the database and can be downloaded later from the Manage page.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Email Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    📧 Send Certificates via Email
                  </h3>
                  <p className="text-gray-600">
                    {generatedCertificates.length} certificate{generatedCertificates.length !== 1 ? 's' : ''} generated successfully!
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Send them to attendees now?
                  </p>
                </div>

                {emailResults.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {emailResults.filter(r => r.status === 'sent').length}
                        </div>
                        <div className="text-sm text-green-600">Sent</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {emailResults.filter(r => r.status === 'failed').length}
                        </div>
                        <div className="text-sm text-red-600">Failed</div>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {emailResults.map((result, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {result.status === 'sent' ? (
                            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className="text-gray-600">Certificate {result.certificateId.slice(-8)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowEmailModal(false)
                          setGeneratedCertificates([])
                          setEmailResults([])
                        }}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-blue-800">
                          Professional emails will be sent to each attendee with secure download links.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowEmailModal(false)
                          setGeneratedCertificates([])
                        }}
                        className="flex-1"
                      >
                        Close
                      </Button>
                      <Button
                        onClick={handleSendEmails}
                        disabled={sendingEmails}
                        className="flex-1"
                      >
                        {sendingEmails ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending...
                          </>
                        ) : (
                          'Send Certificates'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


