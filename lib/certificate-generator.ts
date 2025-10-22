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
    console.log('🎯 Certificate Generator Debug:')
    console.log('  - Attendee:', certificateData.attendee_name)
    console.log('  - Event:', certificateData.event_title)
    console.log('  - Template ID:', template.id)
    console.log('  - Template background image URL:', template.backgroundImage)
    
    if (!template.backgroundImage) {
      console.error('❌ No background image provided for template')
      return null
    }
    
    // Extract the storage path from the signed URL
    let sourcePath: string
    try {
      if (template.backgroundImage.includes('template-images/')) {
        // Extract path from signed URL
        const url = new URL(template.backgroundImage)
        const pathSegments = url.pathname.split('/')
        // The path should be: template-images/filename.png
        sourcePath = pathSegments.slice(6).join('/') // Remove /storage/v1/object/sign/certificates/
        console.log('  - Extracted from signed URL:', sourcePath)
      } else {
        // Assume it's already a storage path
        sourcePath = template.backgroundImage
        console.log('  - Using as direct path:', sourcePath)
      }
    } catch (urlError) {
      console.error('❌ Error parsing template URL:', urlError)
      return null
    }
    
    if (!sourcePath) {
      console.error('❌ Could not extract storage path from template URL')
      return null
    }
    
    const eventTitleSlug = certificateData.event_title.replace(/[^a-zA-Z0-9]/g, '_')
    const attendeeNameSlug = certificateData.attendee_name.replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `${attendeeNameSlug}_${certificateData.certificate_id}.png`
    const folderPath = `${eventTitleSlug}`
    const filePath = `${folderPath}/${filename}`

    console.log('📁 File paths:')
    console.log('  - Source:', sourcePath)
    console.log('  - Destination:', filePath)
    
    // First, check if source file exists
    console.log('🔍 Checking if source template exists...')
    try {
      const { data: sourceExists, error: sourceCheckError } = await supabase.storage
        .from('certificates')
        .list('template-images', {
          search: sourcePath.split('/').pop() // Just the filename
        })
      
      if (sourceCheckError) {
        console.error('❌ Error checking source file:', sourceCheckError)
      } else {
        console.log('✅ Source file check result:', sourceExists)
        if (sourceExists && sourceExists.length > 0) {
          console.log('✅ Found template file:', sourceExists[0].name)
        } else {
          console.log('❌ Template file not found in template-images folder')
        }
      }
    } catch (checkError) {
      console.error('❌ Error during source file check:', checkError)
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
    
    // Return the file path for consistency with our API
    return filePath
    
  } catch (error) {
    console.error('❌ Certificate generation error:', error)
    console.error('  - Error details:', JSON.stringify(error, null, 2))
    return null
  }
}