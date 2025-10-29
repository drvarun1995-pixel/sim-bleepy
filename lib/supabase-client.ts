import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)


// Helper function to generate signed URLs for certificate template images
export async function generateCertificateImageUrl(imagePath: string): Promise<string | null> {
  if (!imagePath) return null
  
  // If it's already a URL (signed URL or data URL), return as is
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    console.log('🔗 Image is already a URL, returning as-is:', imagePath.substring(0, 50) + '...')
    return imagePath
  }
  
  // Use API endpoint to generate signed URL with proper authentication
  try {
    console.log('🔗 Generating signed URL for:', imagePath)
    const response = await fetch('/api/certificates/signed-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imagePath })
    })
    
    console.log('📡 API response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error generating signed URL via API:', response.status, errorText)
      return null
    }
    
    const result = await response.json()
    console.log('✅ Generated signed URL:', result.signedUrl ? 'SUCCESS' : 'FAILED')
    return result.signedUrl || null
  } catch (error) {
    console.error('❌ Error generating signed URL via API:', error)
    return null
  }
}
