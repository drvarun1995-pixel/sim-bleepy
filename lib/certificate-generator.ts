import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

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
  [key: string]: any
}

export interface Template {
  id: string
  name: string
  backgroundImage: string // This will be a signed URL
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
 * Generate certificate image with text fields rendered on the template
 * This function downloads the template image, renders text fields on it, and uploads the result
 */
export async function generateCertificateImage(
  template: Template,
  certificateData: CertificateData
): Promise<string | null> {
  try {
    console.log('🎯 Certificate Generator Debug:')
    console.log('  - Attendee:', certificateData.attendee_name)
    console.log('  - Event:', certificateData.event_title)
    console.log('  - Template ID:', template.id)
    console.log('  - Template background image URL:', template.backgroundImage)
    console.log('  - Fields to render:', template.fields.length)
    
    if (!template.backgroundImage) {
      console.error('❌ No background image provided for template')
      return null
    }
    
    // Create proper folder structure: User > Attendee name > Certificate file
    const userId = certificateData.user_id || 'unknown'
    const eventTitleSlug = certificateData.event_title.replace(/[^a-zA-Z0-9]/g, '_')
    const attendeeNameSlug = certificateData.attendee_name.replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `${eventTitleSlug}_${certificateData.certificate_id}.png`
    const folderPath = `users/${userId}/certificates/${attendeeNameSlug}`
    const filePath = `${folderPath}/${filename}`

    console.log('📁 File paths:')
    console.log('  - Destination:', filePath)
    
    // Download the template image
    console.log('📥 Downloading template image...')
    const imageResponse = await fetch(template.backgroundImage)
    if (!imageResponse.ok) {
      console.error('❌ Failed to download template image:', imageResponse.status)
      return null
    }
    
    const imageBlob = await imageResponse.blob()
    const imageUrl = URL.createObjectURL(imageBlob)
    
    // For now, we'll copy the template image without text rendering
    // TODO: Implement server-side canvas rendering or move to client-side generation
    console.log('📋 Copying template image (text rendering will be implemented later)...')
    
    // Extract the storage path from the template URL
    let sourcePath: string
    try {
      if (template.backgroundImage.includes('template-images/') || template.backgroundImage.includes('users/')) {
        // Extract path from signed URL or direct path
        if (template.backgroundImage.startsWith('http')) {
          const url = new URL(template.backgroundImage)
          const pathSegments = url.pathname.split('/')
          sourcePath = pathSegments.slice(6).join('/') // Remove /storage/v1/object/sign/certificates/
        } else {
          sourcePath = template.backgroundImage
        }
        console.log('  - Extracted source path:', sourcePath)
      } else {
        console.error('❌ Could not extract storage path from template URL')
        return null
      }
    } catch (urlError) {
      console.error('❌ Error parsing template URL:', urlError)
      return null
    }
    
    // Copy the template image to the new certificate path
    console.log('📋 Copying template image...')
    const { data, error: copyError } = await supabase.storage
      .from('certificates')
      .copy(sourcePath, filePath)

    if (copyError) {
      console.error('❌ Error copying template image:', copyError)
      console.error('  - Copy error details:', JSON.stringify(copyError, null, 2))
      return null
    }

    console.log('✅ Certificate copied successfully:', filePath)
    
    // Clean up
    URL.revokeObjectURL(imageUrl)
    
    return filePath
    
  } catch (error) {
    console.error('❌ Certificate generation error:', error)
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