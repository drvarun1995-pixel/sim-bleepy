import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create Supabase client with anon key for client-side operations
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface CertificateData {
  attendee_name: string
  event_title: string
  event_date: string
  event_description?: string
  event_start_time?: string
  event_end_time?: string
  event_location?: string
  event_organizer?: string
  event_category?: string
  event_format?: string
  certificate_date: string
  certificate_id: string
  user_id?: string
  [key: string]: any
}

export interface Template {
  id: string
  name: string
  backgroundImage: string
  fields: Array<{
    id: string
    text: string
    x: number
    y: number
    fontSize: number
    fontFamily: string
    color: string
    fontWeight: string
    textAlign: string
    width: number
    height: number
    dataSource: string
    customValue?: string
  }>
  canvasSize?: {
    width: number
    height: number
  }
}

/**
 * Generate certificate image with text fields rendered on the template (client-side)
 */
export async function generateCertificateImageClient(
  template: Template,
  certificateData: CertificateData
): Promise<string | null> {
  try {
    console.log('🎯 Client-side Certificate Generator:')
    console.log('  - Attendee:', certificateData.attendee_name)
    console.log('  - Event:', certificateData.event_title)
    console.log('  - Template ID:', template.id)
    console.log('  - Fields to render:', template.fields.length)
    
    if (!template.backgroundImage) {
      console.error('❌ No background image provided for template')
      return null
    }
    
    // Create canvas and render the certificate
    console.log('🎨 Rendering certificate with text fields...')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('❌ Could not get canvas context')
      return null
    }
    
    // Load and draw the background image
    await new Promise<void>((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous' // Enable CORS for Supabase images
      img.onload = () => {
        // Set canvas size to match template
        const canvasSize = template.canvasSize || { width: 800, height: 600 }
        canvas.width = canvasSize.width
        canvas.height = canvasSize.height
        
        // Draw background image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // Render text fields
        template.fields.forEach(field => {
          let text = field.text
          
          // Replace dynamic data
          if (field.dataSource && field.dataSource !== 'custom') {
            const dataValue = getFieldValue(field.dataSource, certificateData)
            text = dataValue || field.text
          } else if (field.customValue) {
            text = field.customValue
          }
          
          // Set text properties
          ctx.font = `${field.fontWeight} ${field.fontSize}px ${field.fontFamily}`
          ctx.fillStyle = field.color
          ctx.textAlign = field.textAlign as CanvasTextAlign
          ctx.textBaseline = 'top'
          
          // Handle text wrapping if needed
          const maxWidth = field.width
          const lines = wrapText(ctx, text, maxWidth)
          
          // Draw each line
          lines.forEach((line, index) => {
            const y = field.y + (index * field.fontSize * 1.2)
            ctx.fillText(line, field.x, y)
          })
        })
        
        resolve()
      }
      img.onerror = (error) => {
        console.error('❌ Error loading template image:', error)
        console.error('❌ Image URL:', template.backgroundImage)
        reject(new Error(`Failed to load template image: ${template.backgroundImage}`))
      }
      img.src = template.backgroundImage
    })
    
    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL('image/png')
    console.log('✅ Certificate rendered successfully')
    
    return dataUrl
    
  } catch (error) {
    console.error('❌ Certificate generation error:', error)
    return null
  }
}

/**
 * Upload generated certificate to Supabase Storage
 */
export async function uploadCertificateToStorage(
  canvasDataUrl: string,
  certificateData: CertificateData
): Promise<string | null> {
  try {
    // Convert canvas data URL to blob
    const base64Data = canvasDataUrl.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const blob = new Blob([buffer], { type: 'image/png' })

    // Create proper folder structure: User > Attendee name > Certificate file
    const userId = certificateData.user_id || 'unknown'
    const eventTitleSlug = certificateData.event_title.replace(/[^a-zA-Z0-9]/g, '_')
    const attendeeNameSlug = certificateData.attendee_name.replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `${eventTitleSlug}_${certificateData.certificate_id}.png`
    const folderPath = `users/${userId}/certificates/${attendeeNameSlug}`
    const filePath = `${folderPath}/${filename}`

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Error uploading certificate:', uploadError)
      return null
    }

    console.log('✅ Certificate uploaded successfully:', filePath)
    return filePath

  } catch (error) {
    console.error('❌ Error uploading certificate:', error)
    return null
  }
}

/**
 * Get field value from certificate data based on data source
 */
function getFieldValue(dataSource: string, certificateData: CertificateData): string {
  const fieldMap: Record<string, string> = {
    'event.title': certificateData.event_title || '',
    'event.date': certificateData.event_date || '',
    'event.description': certificateData.event_description || '',
    'event.start_time': certificateData.event_start_time || '',
    'event.end_time': certificateData.event_end_time || '',
    'event.location': certificateData.event_location || '',
    'event.organizer': certificateData.event_organizer || '',
    'event.category': certificateData.event_category || '',
    'event.format': certificateData.event_format || '',
    'attendee.name': certificateData.attendee_name || '',
    'certificate.date': certificateData.certificate_date || '',
    'certificate.id': certificateData.certificate_id || ''
  }
  
  return fieldMap[dataSource] || ''
}

/**
 * Wrap text to fit within specified width
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = words[0] || ''
  
  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    const width = ctx.measureText(currentLine + ' ' + word).width
    if (width < maxWidth) {
      currentLine += ' ' + word
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }
  lines.push(currentLine)
  return lines
}
