import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import sharp from 'sharp'

export async function GET(request: NextRequest) {
  try {
    // Get the session from NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the file path from query parameters
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    const width = parseInt(searchParams.get('width') || '300')
    const height = parseInt(searchParams.get('height') || '225')

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    console.log('🔍 Thumbnail request for path:', filePath)
    
    // Generate a signed URL for the file
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('certificates')
      .createSignedUrl(filePath, 3600) // Valid for 1 hour

    if (signedUrlError) {
      console.error('❌ Error creating signed URL:', signedUrlError)
      return NextResponse.json({ 
        error: 'Failed to generate thumbnail URL',
        details: signedUrlError.message 
      }, { status: 500 })
    }

    console.log('✅ Signed URL generated:', signedUrlData.signedUrl)

    // Fetch the original file from the signed URL
    const fileResponse = await fetch(signedUrlData.signedUrl)
    
    if (!fileResponse.ok) {
      console.error('Error fetching file from signed URL:', fileResponse.statusText)
      return NextResponse.json({ 
        error: 'Failed to fetch certificate file',
        details: fileResponse.statusText 
      }, { status: 500 })
    }

    const fileBuffer = await fileResponse.arrayBuffer()
    console.log('✅ File fetched, size:', fileBuffer.byteLength, 'bytes')
    
    // Resize the image using Sharp
    try {
      const resizedBuffer = await sharp(Buffer.from(fileBuffer))
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png({ quality: 80 })
        .toBuffer()
      
      console.log('✅ Image resized successfully, new size:', resizedBuffer.length, 'bytes')
      
      // Return the resized image with proper headers
      return new NextResponse(resizedBuffer as any, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
          'Content-Length': resizedBuffer.length.toString(),
        },
      })
    } catch (sharpError) {
      console.error('❌ Sharp processing error:', sharpError)
      return NextResponse.json({ 
        error: 'Failed to process image',
        details: sharpError instanceof Error ? sharpError.message : 'Unknown Sharp error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in GET /api/certificates/thumbnail:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
