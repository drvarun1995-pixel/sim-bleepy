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
  event_time_notes?: string
  event_location?: string
  event_organizer?: string
  event_category?: string
  event_format?: string
  certificate_date: string
  certificate_id: string
}

export interface Template {
  id: string
  name: string
  background_image: string
  image_path?: string
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
  canvas_size: {
    width: number
    height: number
  }
}

export async function generateCertificateImage(
  template: Template, 
  certificateData: CertificateData
): Promise<string | null> {
  try {
    console.log('🎨 Starting certificate generation...')
    console.log('Template:', template.name)
    console.log('Certificate data:', certificateData)

    // Create a canvas element (we'll use a virtual canvas for server-side generation)
    const { createCanvas, loadImage } = await import('canvas')
    
    // Load the background image
    let backgroundImageUrl = template.background_image
    if (template.image_path && template.image_path.startsWith('http')) {
      backgroundImageUrl = template.image_path
    }

    console.log('Loading background image from:', backgroundImageUrl)
    
    const img = await loadImage(backgroundImageUrl)
    
    // Create canvas with template dimensions
    const canvas = createCanvas(img.width, img.height)
    const ctx = canvas.getContext('2d')
    
    // Draw background image
    ctx.drawImage(img, 0, 0, img.width, img.height)
    
    // Calculate scale factors if needed
    const scaleX = img.width / template.canvas_size.width
    const scaleY = img.height / template.canvas_size.height
    
    console.log('Canvas size:', img.width, 'x', img.height)
    console.log('Template size:', template.canvas_size.width, 'x', template.canvas_size.height)
    console.log('Scale factors:', scaleX, scaleY)
    
    // Draw text fields
    for (const field of template.fields) {
      const text = getFieldText(field, certificateData)
      console.log(`Drawing field "${text}" at position (${field.x}, ${field.y})`)
      
      // Scale everything from template coordinates to image coordinates
      const scaledX = field.x * scaleX
      const scaledY = field.y * scaleY
      const scaledFontSize = field.fontSize * scaleX
      const scaledPadding = 8 * scaleX
      const scaledVerticalPadding = 4 * scaleY
      
      // Set font properties
      const fontWeight = field.fontWeight || 'normal'
      ctx.font = `${fontWeight} ${scaledFontSize}px ${field.fontFamily}`
      ctx.fillStyle = field.color
      ctx.textAlign = field.textAlign as CanvasTextAlign
      ctx.textBaseline = 'top'
      
      // Calculate text position based on alignment
      let textX = scaledX + scaledPadding
      if (field.textAlign === 'center') {
        textX = scaledX + (field.width * scaleX / 2)
      } else if (field.textAlign === 'right') {
        textX = scaledX + (field.width * scaleX) - scaledPadding
      }
      
      // Draw text
      ctx.fillText(text, textX, scaledY + scaledVerticalPadding)
    }
    
    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png')
    
    // Generate filename
    const eventTitle = certificateData.event_title.replace(/[^a-zA-Z0-9]/g, '_')
    const attendeeName = certificateData.attendee_name.replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `${eventTitle}/${attendeeName}_${certificateData.certificate_id}.png`
    
    console.log('Uploading certificate to storage:', filename)
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(filename, buffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return null
    }
    
    // Return the file path instead of public URL (since bucket is private)
    console.log('Certificate generated successfully:', filename)
    
    return filename
    
  } catch (error) {
    console.error('Certificate generation error:', error)
    return null
  }
}

function getFieldText(field: Template['fields'][0], certificateData: CertificateData): string {
  if (field.dataSource === 'custom') {
    return field.customValue || field.text
  }
  
  // Map data source to certificate data
  const dataMap: Record<string, string> = {
    'attendee.name': certificateData.attendee_name,
    'event.title': certificateData.event_title,
    'event.date': certificateData.event_date,
    'event.description': certificateData.event_description || '',
    'event.start_time': certificateData.event_start_time || '',
    'event.end_time': certificateData.event_end_time || '',
    'event.time_notes': certificateData.event_time_notes || '',
    'event.location': certificateData.event_location || '',
    'event.organizer': certificateData.event_organizer || '',
    'event.category': certificateData.event_category || '',
    'event.format': certificateData.event_format || '',
    'certificate.date': certificateData.certificate_date,
    'certificate.id': certificateData.certificate_id
  }
  
  return dataMap[field.dataSource] || field.text
}
