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
  event_id?: string
  generator_name?: string // Person who generated the certificate
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
        // Set canvas size to match the ORIGINAL image dimensions for full quality
        canvas.width = img.width
        canvas.height = img.height
        
        // Draw background image at full size
        ctx.drawImage(img, 0, 0, img.width, img.height)
        
        // Get template canvas size (display size)
        const templateCanvasSize = template.canvasSize || { width: 800, height: 600 }
        
        // Calculate scale factors: from display size to actual image size
        const scaleX = img.width / templateCanvasSize.width
        const scaleY = img.height / templateCanvasSize.height
        
        console.log('🎯 Certificate Generation Scaling:')
        console.log('Template canvas size:', templateCanvasSize)
        console.log('Actual image size:', { width: img.width, height: img.height })
        console.log('Scale factors:', { scaleX, scaleY })
        
        // Render text fields with proper scaling
        template.fields.forEach(field => {
          let text = field.text
          
          // Replace dynamic data
          if (field.dataSource && field.dataSource !== 'custom') {
            const dataValue = getFieldValue(field.dataSource, certificateData)
            text = dataValue || field.text
          } else if (field.customValue) {
            text = field.customValue
          }
          
          // Scale coordinates and dimensions from display to image size
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
          
          // Set text properties with scaled font size
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
          
          // Handle text wrapping with scaled width
          const maxWidth = scaledWidth
          const lines = wrapText(ctx, text, maxWidth)
          
          // Draw each line with scaled coordinates
          lines.forEach((line, index) => {
            const lineY = scaledY + scaledVerticalPadding + (index * scaledFontSize * 1.2)
            ctx.fillText(line, textX, lineY)
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

    // Create proper folder structure: Generator Name > certificates > Event Name > Recipient Name > Certificate file
    const generatorName = certificateData.generator_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown_Generator' // Person who generated the certificate
    const recipientName = certificateData.attendee_name || 'Unknown_Recipient' // Person who received the certificate
    const eventTitleSlug = certificateData.event_title.replace(/[^a-zA-Z0-9]/g, '_')
    const recipientNameSlug = recipientName.replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `${eventTitleSlug}_${certificateData.certificate_id}.png`
    const folderPath = `users/${generatorName}/certificates/${eventTitleSlug}/${recipientNameSlug}`
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
