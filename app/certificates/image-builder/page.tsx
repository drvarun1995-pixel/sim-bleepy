'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Eye,
  Palette,
  Type,
  Move,
  RotateCcw,
  FolderOpen,
  Calendar,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Sparkles,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

interface TextField {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  color: string
  fontWeight: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
  textDecoration?: 'none' | 'underline'
  textAlign: 'left' | 'center' | 'right'
  width: number
  height: number
  dataSource?: string
  customValue?: string
}

interface CertificateTemplate {
  id: string
  name: string
  backgroundImage: string
  fields: TextField[]
  createdAt: string
  canvasSize?: {
    width: number
    height: number
  }
}

const DATA_SOURCES = [
  // Event Information
  { value: 'event.title', label: 'Event: Title' },
  { value: 'event.description', label: 'Event: Description' },
  { value: 'event.date', label: 'Event: Date' },
  { value: 'event.startTime', label: 'Event: Start Time' },
  { value: 'event.endTime', label: 'Event: End Time' },
  { value: 'event.timeNotes', label: 'Event: Time Notes' },
  { value: 'event.location', label: 'Event: Location' },
  { value: 'event.organizer', label: 'Event: Organizer' },
  { value: 'event.category', label: 'Event: Category' },
  { value: 'event.format', label: 'Event: Format' },
  { value: 'event.attendees', label: 'Event: Attendee Count' },
  { value: 'event.eventLink', label: 'Event: Event Link' },
  { value: 'event.status', label: 'Event: Status' },
  // Attendee/Recipient Information
  { value: 'attendee.name', label: 'Attendee: Name' },
  { value: 'attendee.email', label: 'Attendee: Email' },
  { value: 'attendee.university', label: 'Attendee: University' },
  { value: 'attendee.role', label: 'Attendee: Role' },
  // Certificate Information
  { value: 'certificate.date', label: 'Certificate: Issue Date' },
  { value: 'certificate.id', label: 'Certificate: ID' },
  // Custom
  { value: 'custom', label: 'Custom Text' }
]

const SAMPLE_EVENT_DATA = {
  // Event Information
  'event.title': 'Advanced Medical Training Workshop',
  'event.description': 'A comprehensive workshop on advanced medical procedures and techniques',
  'event.date': 'December 15, 2024',
  'event.startTime': '09:00 AM',
  'event.endTime': '05:00 PM',
  'event.timeNotes': '8 hours CPD',
  'event.location': 'Medical Conference Center, London',
  'event.organizer': 'Medical Education Department',
  'event.category': 'Medical Training',
  'event.format': 'In-Person',
  'event.attendees': '150',
  'event.eventLink': 'https://example.com/event/workshop',
  'event.status': 'Published',
  // Attendee/Recipient Information
  'attendee.name': 'Dr. John Smith',
  'attendee.email': 'john.smith@hospital.nhs.uk',
  'attendee.university': 'Imperial College London',
  'attendee.role': 'Participant',
  // Certificate Information
  'certificate.date': new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
  'certificate.id': 'CERT-2024-' + Math.random().toString(36).substr(2, 9).toUpperCase()
}

interface Event {
  id: string
  title: string
  description?: string
  date: string
  start_time?: string
  end_time?: string
  time_notes?: string
  location_id?: string
  locations?: Array<{
    name: string
  }>
  organizer_id?: string
  category_id?: string
  format_id?: string
  status?: string
  event_link?: string
}

export default function ImageCertificateBuilder() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [fields, setFields] = useState<TextField[]>([])
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [isEditingText, setIsEditingText] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [currentEventData, setCurrentEventData] = useState(SAMPLE_EVENT_DATA)
  const [editingText, setEditingText] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null)
  // Removed showPreview state - no more preview mode
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [isShared, setIsShared] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load templates from database on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        // Use API route to load templates (bypasses RLS issues)
        const response = await fetch('/api/certificates/templates')
        const result = await response.json()

        if (!response.ok) {
          console.error('Error loading templates:', result.error)
          setTemplates([])
          return
        }

        if (result.templates) {
          // Convert database format to frontend format
          const convertedTemplates = result.templates.map((t: any) => {
            // Use image_path if available (should be signed URL), otherwise fall back to background_image (base64)
            let imageUrl = t.background_image
            if (t.image_path) {
              imageUrl = t.image_path // This should now be a signed URL
            }
            
            return {
              id: t.id,
              name: t.name,
              backgroundImage: imageUrl,
              fields: t.fields || [],
              createdAt: t.created_at,
              canvasSize: t.canvas_size || { width: 800, height: 600 }
            }
          })
          setTemplates(convertedTemplates)
        }
      } catch (error) {
        console.error('Error loading templates:', error)
        setTemplates([])
      }
    }

    loadTemplates()

    // Check if an event ID is provided in URL
    const eventId = searchParams.get('event')
    if (eventId) {
      loadEventData(eventId)
    } else {
      // Load events for selection (fallback)
      loadEvents()
    }
  }, [])

  // Handle template loading from URL parameter
  useEffect(() => {
    if (templates.length > 0) {
      const templateId = searchParams.get('template')
      const useTemplateId = searchParams.get('use')
      const templateIdToLoad = templateId || useTemplateId
      
      console.log('Template ID from URL:', templateIdToLoad)
      console.log('Available templates:', templates)
      if (templateIdToLoad) {
        const template = templates.find((t: CertificateTemplate) => t.id === templateIdToLoad)
        console.log('Found template:', template)
        if (template) {
          loadTemplate(template)
          toast.success(`Loaded template: ${template.name}`)
        } else {
          console.error('Template not found:', templateIdToLoad)
          toast.error(`Template not found: ${templateIdToLoad}`)
        }
      }
    }
  }, [templates, searchParams])

  const loadEvents = async () => {
    try {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()

        const { data, error } = await supabase
          .from('events')
          .select('id, title, description, date, start_time, end_time, time_notes, location_id, locations(name), organizer_id, category_id, format_id, status, event_link')
          .eq('status', 'published')
          .order('date', { ascending: false })
          .limit(50)

      if (error) throw error
      if (data) {
        setEvents(data as Event[])
      }
    } catch (error) {
      console.error('Error loading events:', error)
      // Continue with sample data if loading fails
    }
  }

  const loadEventData = async (eventId: string) => {
    try {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, date, start_time, end_time, time_notes, location_id, locations(name), organizer_id, category_id, format_id, status, event_link')
        .eq('id', eventId)
        .single()

      if (error) throw error
      if (data) {
        const event = data as Event
        setEvents([event]) // Set as single event in array
        setSelectedEventId(eventId)
        updateEventData(eventId)
        toast.success(`Loaded event: ${event.title}`)
      }
    } catch (error) {
      console.error('Error loading event data:', error)
      toast.error('Failed to load event data')
      // Fallback to loading all events
      loadEvents()
    }
  }

  const updateEventData = (eventId: string) => {
    if (!eventId || eventId === 'sample-data') {
      setCurrentEventData(SAMPLE_EVENT_DATA)
      return
    }

    const selectedEvent = events.find(e => e.id === eventId)
    if (!selectedEvent) return

    const eventData = {
      // Event Information
      'event.title': selectedEvent.title || 'Event Title',
      'event.description': selectedEvent.description || 'Event Description',
      'event.date': new Date(selectedEvent.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      'event.startTime': selectedEvent.start_time || 'Start Time',
      'event.endTime': selectedEvent.end_time || 'End Time',
      'event.timeNotes': selectedEvent.time_notes || '',
      'event.location': selectedEvent.locations?.[0]?.name || 'Location',
      'event.organizer': selectedEvent.organizer_id || 'Organizer',
      'event.category': selectedEvent.category_id || 'Category',
      'event.format': selectedEvent.format_id || 'Format',
      'event.attendees': 'Attendee Count',
      'event.eventLink': selectedEvent.event_link || '',
      'event.status': selectedEvent.status || 'Published',
      // Attendee/Recipient Information (sample)
      'attendee.name': 'Dr. John Smith',
      'attendee.email': 'john.smith@hospital.nhs.uk',
      'attendee.university': 'Imperial College London',
      'attendee.role': 'Participant',
      // Certificate Information
      'certificate.date': new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      'certificate.id': 'CERT-2024-' + Math.random().toString(36).substr(2, 9).toUpperCase()
    }

    setCurrentEventData(eventData)
  }

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId)
    updateEventData(eventId)
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    try {
      // Use local URL for immediate preview - no upload to Supabase storage
      const localUrl = URL.createObjectURL(file)
      
      // Set up the canvas with the uploaded image
      const img = new Image()
      img.onload = () => {
        const maxDisplayWidth = 800
        const maxDisplayHeight = 600
        
        let displayWidth = img.width
        let displayHeight = img.height
        
        if (displayWidth > maxDisplayWidth || displayHeight > maxDisplayHeight) {
          const widthRatio = maxDisplayWidth / displayWidth
          const heightRatio = maxDisplayHeight / displayHeight
          const ratio = Math.min(widthRatio, heightRatio)
          
          displayWidth = Math.floor(img.width * ratio)
          displayHeight = Math.floor(img.height * ratio)
        }
        
        setCanvasSize({ width: displayWidth, height: displayHeight })
        setBackgroundImage(localUrl)
        setFields([])
        setSelectedTemplate(null) // Clear selected template when starting new
        setTemplateName('') // Clear template name when starting new
        toast.success('Image loaded successfully')
      }
      
      img.onerror = () => {
        console.error('Failed to load image')
        toast.error('Failed to load image')
      }
      
      img.src = localUrl
      
    } catch (error) {
      console.error('Error loading image:', error)
      toast.error('Failed to load image')
    }
  }

  const addTextField = (dataSource: string = 'custom') => {
    const defaultText = dataSource === 'custom' 
      ? 'Click to edit' 
      : currentEventData[dataSource as keyof typeof currentEventData] || 'Sample Text'
    
    const newField: TextField = {
      id: `field-${Date.now()}`,
      text: String(defaultText),
      x: 100,
      y: 100,
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
      color: '#000000',
      fontWeight: 'normal',
      textAlign: 'left',
      width: 200,
      height: 30,
      dataSource: dataSource,
      customValue: dataSource === 'custom' ? 'Click to edit' : undefined
    }
    
    setFields([...fields, newField])
    setSelectedField(newField.id)
    toast.success('Text field added')
  }

  const updateField = (fieldId: string, updates: Partial<TextField>) => {
    setFields(fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ))
  }

  const deleteField = (fieldId: string) => {
    setFields(fields.filter(field => field.id !== fieldId))
    if (selectedField === fieldId) {
      setSelectedField(null)
    }
    toast.success('Field deleted')
  }

  const handleFieldClick = (fieldId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setSelectedField(fieldId)
    
    // Start inline editing on double click
    if (event.detail === 2) {
      const field = fields.find(f => f.id === fieldId)
      if (field) {
        setIsEditingText(true)
        setEditingText(field.customValue || field.text)
      }
    }
  }

  const handleTextEdit = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId)
    if (field) {
      setIsEditingText(true)
      setEditingText(field.customValue || field.text)
    }
  }

  const saveTextEdit = () => {
    if (selectedField) {
      updateField(selectedField, { 
        customValue: editingText,
        text: editingText 
      })
      setIsEditingText(false)
      setEditingText('')
    }
  }

  const cancelTextEdit = () => {
    setIsEditingText(false)
    setEditingText('')
  }

  const handleMouseDown = (fieldId: string, event: React.MouseEvent) => {
    event.preventDefault()
    setIsDragging(true)
    const field = fields.find(f => f.id === fieldId)
    if (field) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        setDragOffset({
          x: event.clientX - rect.left - field.x,
          y: event.clientY - rect.top - field.y
        })
      }
    }
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging || !selectedField) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const newX = event.clientX - rect.left - dragOffset.x
    const newY = event.clientY - rect.top - dragOffset.y

    updateField(selectedField, {
      x: Math.max(0, Math.min(canvasSize.width - 200, newX)),
      y: Math.max(0, Math.min(canvasSize.height - 30, newY))
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const getFieldText = (field: TextField) => {
    if (field.dataSource === 'custom') {
      return field.customValue || field.text
    }
    return currentEventData[field.dataSource as keyof typeof currentEventData] || field.text
  }

  const exportAsDataURL = () => {
    if (!backgroundImage) {
      toast.error('Please upload a background image first')
      return
    }

    // Create a loading toast that we can dismiss later
    const loadingToast = toast.loading('Generating certificate...')

    try {
      // Create image element first to get actual image dimensions
      const img = new Image()
      img.crossOrigin = 'anonymous' // Required for canvas export with external images
      
      img.onerror = () => {
        toast.dismiss(loadingToast)
        toast.error('Failed to load image for export')
        return
      }
      
      img.onload = () => {
        try {
          // Create canvas with the ORIGINAL image dimensions
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            toast.dismiss(loadingToast)
            toast.error('Canvas not supported')
            return
          }

          // Set canvas to actual image size for full quality
          canvas.width = img.width
          canvas.height = img.height

          console.log('🎯 Export Debug:')
          console.log('Display canvas size:', { width: canvasSize.width, height: canvasSize.height })
          console.log('Original image size:', { width: img.width, height: img.height })
          
          // Calculate scale factors: from display size to actual image size
          const scaleX = img.width / canvasSize.width
          const scaleY = img.height / canvasSize.height
          console.log('Scale factors (display → image):', { scaleX, scaleY })
          
          // Draw background image at full size
          ctx.drawImage(img, 0, 0, img.width, img.height)

          // Draw text fields scaled to match the original image size
          fields.forEach(field => {
            const text = getFieldText(field)
            
            // Scale everything from display coordinates to image coordinates
            const scaledX = field.x * scaleX
            const scaledY = field.y * scaleY
            const scaledWidth = field.width * scaleX
            const scaledHeight = field.height * scaleY
            const scaledFontSize = field.fontSize * scaleX
            const scaledPadding = 8 * scaleX // px-2 = 8px
            const scaledVerticalPadding = 4 * scaleY // py-1 = 4px
            
            console.log(`Field "${text}":`, {
              displayPosition: { x: field.x, y: field.y },
              imagePosition: { x: scaledX, y: scaledY },
              displaySize: { width: field.width, height: field.height },
              imageSize: { width: scaledWidth, height: scaledHeight }
            })
            
            // Set font properties scaled to image size
            const fontStyle = field.fontStyle || 'normal'
            const fontWeight = field.fontWeight || 'normal'
            ctx.font = `${fontStyle} ${fontWeight} ${scaledFontSize}px ${field.fontFamily}`
            ctx.fillStyle = field.color
            ctx.textAlign = field.textAlign as CanvasTextAlign
            ctx.textBaseline = 'top'

            // Calculate text position based on alignment
            let textX = scaledX + scaledPadding
            if (field.textAlign === 'center') {
              textX = scaledX + (scaledWidth / 2)
            } else if (field.textAlign === 'right') {
              textX = scaledX + scaledWidth - scaledPadding
            }

            // Draw text only (no background or border)
            ctx.fillStyle = field.color
            ctx.fillText(text, textX, scaledY + scaledVerticalPadding)
          })

          // Create download link
          const link = document.createElement('a')
          link.download = `certificate-${new Date().toISOString().split('T')[0]}.png`
          link.href = canvas.toDataURL('image/png')
          link.click()

          // Dismiss loading toast and show success
          toast.dismiss(loadingToast)
          toast.success('Certificate exported successfully!')
        } catch (error) {
          toast.dismiss(loadingToast)
          console.error('Export error:', error)
          toast.error('Failed to export certificate')
        }
      }
      
      img.onerror = () => {
        toast.dismiss(loadingToast)
        toast.error('Failed to load background image')
      }
      
      img.src = backgroundImage
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error('Export error:', error)
      toast.error('Failed to export certificate')
    }
  }

  const saveTemplate = async () => {
    if (!backgroundImage) {
      toast.error('Please upload a background image first')
      return
    }

    // Only ask for template name when creating a new template, not when editing existing
    let templateName
    if (selectedTemplate) {
      // Editing existing template - use existing name
      templateName = selectedTemplate.name
    } else {
      // Creating new template - ask for name
      templateName = prompt('Enter template name:')
      if (!templateName) return
    }

    const loadingToast = toast.loading('Saving template...')

    try {
      // Handle image upload to Supabase storage with proper folder structure
      let imagePath = null
      let finalImageUrl = backgroundImage
      
      if (backgroundImage.startsWith('blob:')) {
        // This is a local blob URL, need to upload to Supabase storage
        console.log('📤 Uploading template image to Supabase storage...')
        
        // Convert blob URL to file
        const response = await fetch(backgroundImage)
        const blob = await response.blob()
        const file = new File([blob], 'template-image.png', { type: blob.type })
        
        // Upload to Supabase storage with proper folder structure
        const formData = new FormData()
        formData.append('file', file)
        formData.append('fileName', `template-${Date.now()}.png`)
        
        const uploadResponse = await fetch('/api/certificates/upload-template-image', {
          method: 'POST',
          body: formData
        })
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          imagePath = uploadResult.path
          finalImageUrl = uploadResult.imageUrl
          console.log('✅ Template image uploaded successfully:', imagePath)
        } else {
          console.error('❌ Failed to upload template image')
          toast.dismiss(loadingToast)
          toast.error('Failed to upload template image')
          return
        }
      } else if (backgroundImage.includes('supabase')) {
        // Extract path from existing Supabase Storage URL
        const urlParts = backgroundImage.split('/certificates/')
        if (urlParts.length > 1) {
          imagePath = urlParts[1]
        }
      }

      const newTemplate = {
        id: `template-${Date.now()}`,
        name: templateName,
        background_image: finalImageUrl, // Use the final image URL (Supabase storage or local)
        image_path: imagePath, // New field for storage path
        fields: fields,
        canvas_size: canvasSize
      }

      console.log('📤 Saving template:', {
        name: templateName,
        fieldCount: fields.length,
        canvasSize: canvasSize
      })

      const response = await fetch('/api/certificates/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTemplate)
      })

      console.log('📥 API Response status:', response.status)
      const result = await response.json()
      console.log('📥 API Response data:', result)

      if (!response.ok) {
        console.error('❌ API Error:', result.error)
        throw new Error(result.error || 'Failed to save template')
      }

      toast.dismiss(loadingToast)
      toast.success('Template saved successfully!')
      setFields([])
      setBackgroundImage('')
      setCanvasSize({ width: 800, height: 600 })
      setSelectedField(null)
      setShowSaveModal(false)
      setSelectedTemplate(null) // Clear selected template after saving new one
      
      // Refresh templates list
      const loadTemplatesFunc = async () => {
        try {
          const { createClient } = await import('@/utils/supabase/client')
          const supabase = createClient()

          const { data: templatesData, error } = await supabase
            .from('certificate_templates')
            .select('*')
            .order('created_at', { ascending: false })

          if (error) {
            console.error('Error loading templates:', error)
            setTemplates([])
            return
          }

          if (templatesData) {
            const convertedTemplates = templatesData.map(t => ({
              id: t.id,
              name: t.name,
              backgroundImage: t.background_image,
              fields: t.fields || [],
              createdAt: t.created_at,
              canvasSize: t.canvas_size || { width: 800, height: 600 }
            }))
            setTemplates(convertedTemplates)
          }
        } catch (error) {
          console.error('Error loading templates:', error)
          setTemplates([])
        }
      }
      loadTemplatesFunc()
    } catch (error) {
      console.error('Error saving template:', error)
      toast.dismiss(loadingToast)
      toast.error(error instanceof Error ? error.message : 'Failed to save template')
    }
  }

  const loadTemplate = (template: CertificateTemplate) => {
    setBackgroundImage(template.backgroundImage)
    // Use template canvasSize if available, otherwise use default 800x600
    setCanvasSize(template.canvasSize || { width: 800, height: 600 })
    setFields([...template.fields])
    setSelectedField(null)
    setSelectedTemplate(template)
    setTemplateName(template.name) // Set the template name when loading
    toast.success(`Template "${template.name}" loaded`)
  }

  const handleSaveTemplate = async () => {
    if (!backgroundImage) {
      toast.error('Please upload a background image first')
      return
    }

    if (!templateName.trim() && !selectedTemplate) {
      toast.error('Please enter a template name')
      return
    }

    const loadingToast = toast.loading('Saving template...')

    try {
      // Handle image upload to Supabase storage with proper folder structure
      let imagePath = null
      let finalImageUrl = backgroundImage
      
      if (backgroundImage.startsWith('blob:')) {
        // This is a local blob URL, need to upload to Supabase storage
        console.log('📤 Uploading template image to Supabase storage...')
        
        // Convert blob URL to file
        const response = await fetch(backgroundImage)
        const blob = await response.blob()
        const file = new File([blob], 'template-image.png', { type: blob.type })
        
        // Upload to Supabase storage with proper folder structure
        const formData = new FormData()
        formData.append('file', file)
        formData.append('fileName', `template-${Date.now()}.png`)
        
        const uploadResponse = await fetch('/api/certificates/upload-template-image', {
          method: 'POST',
          body: formData
        })
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          imagePath = uploadResult.path
          finalImageUrl = uploadResult.imageUrl
          console.log('✅ Template image uploaded successfully:', imagePath)
        } else {
          console.error('❌ Failed to upload template image')
          toast.dismiss(loadingToast)
          toast.error('Failed to upload template image')
          return
        }
      } else if (backgroundImage.includes('supabase')) {
        // Extract path from existing Supabase Storage URL
        const urlParts = backgroundImage.split('/certificates/')
        if (urlParts.length > 1) {
          imagePath = urlParts[1]
        }
      }

      const templateData = {
        name: selectedTemplate ? selectedTemplate.name : templateName,
        background_image: finalImageUrl,
        image_path: imagePath,
        fields: fields,
        canvas_size: canvasSize,
        isShared: isShared
      }

      let response
      if (selectedTemplate) {
        // Update existing template
        response = await fetch(`/api/certificates/templates/${selectedTemplate.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(templateData)
        })
      } else {
        // Create new template
        const newTemplate = {
          id: `template-${Date.now()}`,
          ...templateData
        }
        response = await fetch('/api/certificates/templates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newTemplate)
        })
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save template')
      }

      toast.dismiss(loadingToast)
      toast.success('Template saved successfully!')
      setShowSaveModal(false)
      setTemplateName('')
      setIsShared(false)
      
      // Refresh templates list
      const loadTemplatesFunc = async () => {
        try {
          const { createClient } = await import('@/utils/supabase/client')
          const supabase = createClient()

          const { data: templatesData, error } = await supabase
            .from('certificate_templates')
            .select('*')
            .order('created_at', { ascending: false })

          if (error) {
            console.error('Error loading templates:', error)
            setTemplates([])
            return
          }

          if (templatesData) {
            const convertedTemplates = templatesData.map(t => ({
              id: t.id,
              name: t.name,
              backgroundImage: t.background_image,
              fields: t.fields || [],
              createdAt: t.created_at,
              canvasSize: t.canvas_size || { width: 800, height: 600 }
            }))
            setTemplates(convertedTemplates)
          }
        } catch (error) {
          console.error('Error loading templates:', error)
          setTemplates([])
        }
      }
      loadTemplatesFunc()
      
      // Return the template ID for use in handleSaveAndGenerate
      return result.template?.id || result.id
    } catch (error) {
      console.error('Error saving template:', error)
      toast.dismiss(loadingToast)
      toast.error(error instanceof Error ? error.message : 'Failed to save template')
    }
  }

  const handleSaveAndGenerate = async () => {
    // First save the template and get the template ID
    const templateId = await handleSaveTemplate()
    
    // Then navigate to generate page with the event ID and template ID
    if (templateName.trim() && templateId) {
      setShowGenerateModal(false)
      const eventId = searchParams.get('event')
      if (eventId) {
        router.push(`/certificates/generate?event=${eventId}&template=${templateId}`)
      } else {
        router.push(`/certificates/generate?template=${templateId}`)
      }
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/certificates')}
          className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 transition-all duration-200 hover:scale-105 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-medium">Back to Certificates</span>
        </Button>
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Image Certificate Builder</h1>
          <p className="text-gray-600 mt-2">Create certificates using images as backgrounds with draggable text fields</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Left Sidebar - Controls */}
          <div className="space-y-4 lg:space-y-6">
            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Background Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
                {backgroundImage && (
                  <div className="text-sm text-green-600">
                    ✓ Background image loaded
                  </div>
                )}
              </CardContent>
            </Card>


            {/* Add Text Field */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Text Fields
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Quick Add Field:</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => addTextField('event.title')} 
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                    >
                      Event Title
                    </Button>
                    <Button 
                      onClick={() => addTextField('event.date')} 
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                    >
                      Event Date
                    </Button>
                    <Button 
                      onClick={() => addTextField('attendee.name')} 
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                    >
                      Attendee Name
                    </Button>
                    <Button 
                      onClick={() => addTextField('certificate.date')} 
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                    >
                      Cert. Date
                    </Button>
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <Label className="text-sm font-medium mb-2 block">Or select from all fields:</Label>
                  <Select onValueChange={(value) => addTextField(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a data source..." />
                    </SelectTrigger>
                    <SelectContent>
                      {DATA_SOURCES.map((source) => (
                        <SelectItem key={source.value} value={source.value}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-2 border-t space-y-2">
                  <Button 
                    onClick={() => {
                      setFields([])
                      setSelectedField(null)
                      toast.success('All fields removed')
                    }}
                    variant="outline" 
                    size="sm"
                    className="w-full text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                    disabled={fields.length === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Reset All Fields
                  </Button>
                  <div className="text-sm text-gray-600 text-center">
                    {fields.length} field{fields.length !== 1 ? 's' : ''} added
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Load Template Section - only show when building for an event */}
            {searchParams.get('event') && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Load Existing Template
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Choose a template to start with:</Label>
                    <Select onValueChange={(templateId) => {
                      const template = templates.find(t => t.id === templateId)
                      if (template) {
                        loadTemplate(template)
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-sm text-gray-600">
                      {templates.length} template{templates.length !== 1 ? 's' : ''} available
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}


          </div>

          {/* Main Canvas Area */}
          <div className="lg:col-span-3 space-y-4 lg:space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Certificate Canvas
                  </CardTitle>
                  <div className="flex gap-2">
                    {/* EDIT TEMPLATE: ?template= - Show Save Changes buttons */}
                    {searchParams.get('template') ? (
                      <>
                        <Button onClick={exportAsDataURL} size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export Certificate
                        </Button>
                        <Button onClick={saveTemplate} size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link href="/certificates/templates">
                            <FolderOpen className="h-4 w-4 mr-2" />
                            Manage All Templates
                          </Link>
                        </Button>
                      </>
                    ) : searchParams.get('use') ? (
                      /* USE TEMPLATE: ?use= - Show Generate Certificate buttons */
                      <>
                        <Button onClick={exportAsDataURL} size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export Certificate
                        </Button>
                        <Button
                          onClick={() => router.push(`/certificates/generate?template=${selectedTemplate?.id}`)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Certificate
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link href="/certificates/templates">
                            <FolderOpen className="h-4 w-4 mr-2" />
                            Manage All Templates
                          </Link>
                        </Button>
                      </>
                    ) : searchParams.get('event') ? (
                      /* BUILD FOR EVENT: ?event= - Show Generate Certificate buttons */
                      <>
                        <Button asChild variant="outline" size="sm">
                          <Link href="/certificates/templates">
                            <FolderOpen className="h-4 w-4 mr-2" />
                            Manage All Templates
                          </Link>
                        </Button>
                        <Button onClick={exportAsDataURL} size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export Certificate
                        </Button>
                        <Button
                          onClick={() => router.push(`/certificates/generate?event=${searchParams.get('event')}&template=${selectedTemplate?.id}`)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Certificate
                        </Button>
                      </>
                    ) : (
                      /* CREATE NEW: No params - Show Save Template buttons */
                      <>
                        <Button onClick={exportAsDataURL} size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export Certificate
                        </Button>
                        <Button onClick={saveTemplate} size="sm" variant="outline">
                          <Save className="h-4 w-4 mr-2" />
                          Save Template
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link href="/certificates/templates">
                            <FolderOpen className="h-4 w-4 mr-2" />
                            Manage All Templates
                          </Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Text Field Properties Toolbar */}
                {selectedField && fields.find(f => f.id === selectedField) && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Font Family */}
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium">Font:</Label>
                        <Select 
                          value={fields.find(f => f.id === selectedField)?.fontFamily || 'Arial'} 
                          onValueChange={(value) => updateField(selectedField, { fontFamily: value })}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                            <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                            <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                            <SelectItem value="Georgia, serif">Georgia</SelectItem>
                            <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Font Size */}
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium">Size:</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateField(selectedField, { fontSize: Math.max(8, (fields.find(f => f.id === selectedField)?.fontSize || 16) - 2) })}
                        >
                          -
                        </Button>
                        <span className="w-10 text-center text-sm font-medium">
                          {fields.find(f => f.id === selectedField)?.fontSize || 16}px
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateField(selectedField, { fontSize: Math.min(72, (fields.find(f => f.id === selectedField)?.fontSize || 16) + 2) })}
                        >
                          +
                        </Button>
                      </div>

                      {/* Divider */}
                      <div className="h-8 w-px bg-gray-300" />

                      {/* Text Color */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <div 
                              className="w-4 h-4 rounded border border-gray-300"
                              style={{ backgroundColor: fields.find(f => f.id === selectedField)?.color || '#000000' }}
                            />
                            Color
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64">
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Preset Colors</Label>
                              <div className="grid grid-cols-8 gap-2">
                                {[
                                  '#000000', '#404040', '#808080', '#FFFFFF',
                                  '#EF4444', '#F59E0B', '#EAB308', '#84CC16',
                                  '#22C55E', '#10B981', '#14B8A6', '#06B6D4',
                                  '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
                                  '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
                                ].map((color) => (
                                  <button
                                    key={color}
                                    onClick={() => updateField(selectedField, { color })}
                                    className={`w-7 h-7 rounded border-2 transition-all hover:scale-110 ${
                                      fields.find(f => f.id === selectedField)?.color === color 
                                        ? 'border-blue-500 ring-2 ring-blue-200' 
                                        : 'border-gray-300'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                ))}
                              </div>
                            </div>
                            
                            <div className="border-t pt-4">
                              <Label className="text-sm font-medium mb-2 block">Custom Color</Label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={fields.find(f => f.id === selectedField)?.color || '#000000'}
                                  onChange={(e) => updateField(selectedField, { color: e.target.value })}
                                  className="w-12 h-10 rounded border cursor-pointer"
                                />
                                <Input
                                  type="text"
                                  value={fields.find(f => f.id === selectedField)?.color || '#000000'}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    if (/^#[0-9A-F]{6}$/i.test(value)) {
                                      updateField(selectedField, { color: value })
                                    }
                                  }}
                                  className="flex-1 font-mono text-sm"
                                  placeholder="#000000"
                                />
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>

                      {/* Divider */}
                      <div className="h-8 w-px bg-gray-300" />

                      {/* Text Formatting Group */}
                      <div className="flex items-center gap-1">
                        {/* Font Weight */}
                        <Button
                          size="sm"
                          variant={fields.find(f => f.id === selectedField)?.fontWeight === 'bold' ? 'default' : 'outline'}
                          onClick={() => updateField(selectedField, { 
                            fontWeight: fields.find(f => f.id === selectedField)?.fontWeight === 'bold' ? 'normal' : 'bold' 
                          })}
                          title="Bold"
                        >
                          <Bold className="h-4 w-4" />
                        </Button>

                        {/* Italic */}
                        <Button
                          size="sm"
                          variant={fields.find(f => f.id === selectedField)?.fontStyle === 'italic' ? 'default' : 'outline'}
                          onClick={() => updateField(selectedField, { 
                            fontStyle: fields.find(f => f.id === selectedField)?.fontStyle === 'italic' ? 'normal' : 'italic' 
                          })}
                          title="Italic"
                        >
                          <Italic className="h-4 w-4" />
                        </Button>

                        {/* Underline */}
                        <Button
                          size="sm"
                          variant={fields.find(f => f.id === selectedField)?.textDecoration === 'underline' ? 'default' : 'outline'}
                          onClick={() => updateField(selectedField, { 
                            textDecoration: fields.find(f => f.id === selectedField)?.textDecoration === 'underline' ? 'none' : 'underline' 
                          })}
                          title="Underline"
                        >
                          <Underline className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Divider */}
                      <div className="h-8 w-px bg-gray-300" />

                      {/* Text Alignment */}
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant={fields.find(f => f.id === selectedField)?.textAlign === 'left' ? 'default' : 'outline'}
                          onClick={() => updateField(selectedField, { textAlign: 'left' })}
                          title="Align Left"
                        >
                          <AlignLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={fields.find(f => f.id === selectedField)?.textAlign === 'center' ? 'default' : 'outline'}
                          onClick={() => updateField(selectedField, { textAlign: 'center' })}
                          title="Align Center"
                        >
                          <AlignCenter className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={fields.find(f => f.id === selectedField)?.textAlign === 'right' ? 'default' : 'outline'}
                          onClick={() => updateField(selectedField, { textAlign: 'right' })}
                          title="Align Right"
                        >
                          <AlignRight className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Divider */}
                      <div className="h-8 w-px bg-gray-300" />

                      {/* Edit Text Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTextEdit(selectedField)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit Text
                      </Button>

                      {/* Delete Field Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteField(selectedField)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
                  <div
                    ref={canvasRef}
                    className="relative mx-auto bg-white"
                    style={{
                      width: canvasSize.width,
                      height: canvasSize.height
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    {/* Background Image */}
                    {backgroundImage && (
                      <img
                        src={backgroundImage}
                        alt="Certificate Background"
                        className="absolute inset-0 w-full h-full object-fill"
                        draggable={false}
                      />
                    )}

                    {/* Text Fields */}
                    {fields.map((field) => (
                      <div
                        key={field.id}
                        className={`absolute cursor-move select-none ${
                          selectedField === field.id 
                            ? 'ring-2 ring-blue-500 ring-opacity-50' 
                            : 'hover:ring-1 hover:ring-gray-400'
                        }`}
                        style={{
                          left: field.x,
                          top: field.y,
                          width: field.width,
                          height: field.height,
                          fontSize: field.fontSize,
                          fontFamily: field.fontFamily,
                          color: field.color,
                          fontWeight: field.fontWeight,
                          fontStyle: field.fontStyle || 'normal',
                          textDecoration: field.textDecoration || 'none',
                          textAlign: field.textAlign,
                          pointerEvents: 'auto'
                        }}
                        onClick={(e) => handleFieldClick(field.id, e)}
                        onMouseDown={(e) => handleMouseDown(field.id, e)}
                      >
                        {isEditingText && selectedField === field.id ? (
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onBlur={saveTextEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                saveTextEdit()
                              } else if (e.key === 'Escape') {
                                cancelTextEdit()
                              }
                            }}
                            className="w-full h-full px-2 py-1 bg-white bg-opacity-90 border border-blue-500 rounded text-sm outline-none"
                            autoFocus
                          />
                        ) : (
                          <div className="px-2 py-1">
                            {getFieldText(field)}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Placeholder when no background */}
                    {!backgroundImage && (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-lg font-medium">Upload a background image to get started</p>
                          <p className="text-sm">Supported formats: PNG, JPG, JPEG</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Save Template Modal */}
      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Template</DialogTitle>
            <DialogDescription>
              Save your template before generating certificates. This ensures your design is preserved.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-name" className="text-right">
                Name
              </Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="col-span-3"
                placeholder="Enter template name"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="share-template"
                checked={isShared}
                onCheckedChange={(checked) => setIsShared(checked as boolean)}
              />
              <Label htmlFor="share-template" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Share this template with others
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleSaveTemplate()} disabled={!templateName.trim()}>
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Certificate Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Template & Generate Certificates</DialogTitle>
            <DialogDescription>
              Save your template first, then generate certificates for this event's attendees. This ensures your design is preserved and can be reused.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="generate-template-name" className="text-right">
                Name
              </Label>
              <Input
                id="generate-template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="col-span-3"
                placeholder="Enter template name"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="generate-share-template"
                checked={isShared}
                onCheckedChange={(checked) => setIsShared(checked as boolean)}
              />
              <Label htmlFor="generate-share-template" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Share this template with others
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleSaveAndGenerate()} disabled={!templateName.trim()}>
              Save & Generate Certificates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}