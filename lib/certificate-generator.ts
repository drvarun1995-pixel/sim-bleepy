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
 * Simplified certificate generation that uses template images directly
 * For deployment compatibility, we'll use the template image as-is
 * and store it in the certificates bucket
 */
export async function generateCertificateImage(
  template: Template,
  certificateData: CertificateData
): Promise<string | null> {
  try {
    console.log('Generating certificate for:', certificateData.attendee_name)
    
    // For now, we'll copy the template image to the certificates bucket
    // with a new filename that includes the attendee and certificate ID
    
    const eventTitleSlug = certificateData.event_title.replace(/[^a-zA-Z0-9]/g, '_')
    const attendeeNameSlug = certificateData.attendee_name.replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `${attendeeNameSlug}_${certificateData.certificate_id}.png`
    const folderPath = `${eventTitleSlug}`
    const filePath = `${folderPath}/${filename}`

    // Download the template image
    const templateResponse = await fetch(template.backgroundImage)
    if (!templateResponse.ok) {
      throw new Error(`Failed to fetch template image: ${templateResponse.statusText}`)
    }
    
    const imageBuffer = await templateResponse.arrayBuffer()
    
    console.log('Uploading certificate to storage:', filePath)
    const { data, error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true // Overwrite if exists
      })

    if (uploadError) {
      console.error('Error uploading certificate to storage:', uploadError)
      return null
    }

    console.log('Certificate uploaded successfully:', filePath)
    
    // Return the file path (not URL) for consistency with our API
    return filePath
    
  } catch (error) {
    console.error('Certificate generation error:', error)
    return null
  }
}