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
      
      // Use the template image directly
      let imageUrl = template.backgroundImage
      console.log('🖼️ Using template image for certificate generation:', imageUrl)
      
      img.onload = () => {
        // Set canvas to actual image size for full quality (EXACT match with working solution from chat history)
        canvas.width = img.width
        canvas.height = img.height

        console.log('🎯 CERTIFICATE GENERATION DEBUG (from chat history):')
        console.log('Canvas size:', img.width, 'x', img.height)
        console.log('Template canvas size:', template.canvasSize)
        console.log('Template canvas_size:', (template as any).canvas_size)
        
        // Calculate scale factors: from template canvas size to actual image size (EXACT match with working solution)
        const templateCanvasSize = template.canvasSize || (template as any).canvas_size || { width: 800, height: 600 }
        const scaleX = img.width / templateCanvasSize.width
        const scaleY = img.height / templateCanvasSize.height
        
        // Use correct scale factors - X and Y can be different for proper aspect ratio
        const scaleX_final = scaleX
        const scaleY_final = scaleY
        
        console.log('Template size:', templateCanvasSize.width, 'x', templateCanvasSize.height)
        console.log('Scale factors:', scaleX, scaleY)
        console.log('Using separate X/Y scales:', { scaleX_final, scaleY_final })
        
        // Draw background image at full size (EXACT match with working solution)
        ctx.drawImage(img, 0, 0, img.width, img.height)

        // Draw text fields (EXACT match with working solution from chat history)
        for (const field of template.fields) {
          const text = getFieldValue(field.dataSource, certificateData) || field.text
          console.log(`🎯 FIELD DEBUG "${text}":`)
          console.log('  Original field data:', {
            x: field.x, y: field.y, 
            width: field.width, height: field.height,
            fontSize: field.fontSize,
            textAlign: field.textAlign
          })
          
          // Scale everything from template coordinates to image coordinates (EXACT match with working solution)
          const scaledX = field.x * scaleX_final
          const scaledY = field.y * scaleY_final
          const scaledFontSize = field.fontSize * scaleX_final
          const scaledPadding = 8 * scaleX_final
          const scaledVerticalPadding = 4 * scaleY_final
          
          // Try adjusting Y coordinate to match preview - increase offset
          const adjustedY = scaledY + (scaledFontSize * 0.3) // Increase offset to move text down more
          
          console.log('  Scale factors:', { scaleX_final, scaleY_final })
          console.log('  Scaled coordinates:', {
            scaledX: scaledX, scaledY: scaledY,
            scaledFontSize: scaledFontSize,
            scaledPadding: scaledPadding,
            scaledVerticalPadding: scaledVerticalPadding,
            adjustedY: adjustedY
          })
          
          // Calculate text position based on alignment
          let textX = scaledX + scaledPadding
          if (field.textAlign === 'center') {
            textX = scaledX + (field.width * scaleX_final / 2)
          } else if (field.textAlign === 'right') {
            textX = scaledX + (field.width * scaleX_final) - scaledPadding
          }
          
          console.log('  Text positioning:', {
            'scaledX + scaledPadding': scaledX + scaledPadding,
            'scaledY + scaledVerticalPadding': scaledY + scaledVerticalPadding,
            finalTextX: textX,
            finalTextY: scaledY + scaledVerticalPadding,
            'Difference from original Y': (scaledY + scaledVerticalPadding) - field.y
          })
          
          // Set font properties
          const fontWeight = field.fontWeight || 'normal'
          ctx.font = `${fontWeight} ${scaledFontSize}px ${field.fontFamily}`
          ctx.fillStyle = field.color
          ctx.textAlign = field.textAlign as CanvasTextAlign
          ctx.textBaseline = 'top'

          // Draw text with adjusted Y coordinate
          ctx.fillText(text, textX, adjustedY + scaledVerticalPadding)
          console.log('  ✅ Text drawn at:', { textX, textY: adjustedY + scaledVerticalPadding })
        }
        
        resolve()
      }
      img.onerror = (error) => {
        console.error('❌ Error loading template image:', error)
        console.error('❌ Image URL:', template.backgroundImage)
        reject(new Error(`Failed to load template image: ${template.backgroundImage}`))
      }
      img.src = imageUrl
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
