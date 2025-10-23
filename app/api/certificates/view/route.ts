import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

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

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    // Generate a signed URL for the file
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('certificates')
      .createSignedUrl(filePath, 3600) // Valid for 1 hour

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError)
      return NextResponse.json({ 
        error: 'Failed to generate view URL',
        details: signedUrlError.message 
      }, { status: 500 })
    }

    // Fetch the file from the signed URL
    const fileResponse = await fetch(signedUrlData.signedUrl)
    
    if (!fileResponse.ok) {
      console.error('Error fetching file from signed URL:', fileResponse.statusText)
      return NextResponse.json({ 
        error: 'Failed to fetch certificate file',
        details: fileResponse.statusText 
      }, { status: 500 })
    }

    const fileBuffer = await fileResponse.arrayBuffer()
    
    // Return the file with proper headers for viewing (not downloading)
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Length': fileBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('Error in GET /api/certificates/view:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
