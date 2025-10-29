import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 API: Checking session...')
    // Get the session from NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('❌ API: Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ API: Session found for user:', session.user.id)

    // Get the image path from the request
    const { imagePath } = await request.json()
    console.log('📁 API: Image path:', imagePath)
    
    if (!imagePath) {
      console.log('❌ API: No image path provided')
      return NextResponse.json({ error: 'Image path is required' }, { status: 400 })
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Generate signed URL for the image path
    console.log('🔗 API: Generating signed URL for:', imagePath)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('certificates')
      .createSignedUrl(imagePath, 3600) // 1 hour expiry
    
    if (signedUrlError) {
      console.error('❌ API: Error generating signed URL:', signedUrlError)
      return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 })
    }

    console.log('✅ API: Successfully generated signed URL')
    return NextResponse.json({ 
      success: true, 
      signedUrl: signedUrlData?.signedUrl 
    }, { status: 200 })

  } catch (error) {
    console.error('Error in POST /api/certificates/signed-url:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
