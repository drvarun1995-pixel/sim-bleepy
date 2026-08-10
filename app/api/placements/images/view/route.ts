import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { canViewFyImageWithoutAuth } from '@/lib/fy-public-guides'

export async function GET(request: NextRequest) {
  try {
    // Get the file path from query parameters
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    // Get the session from NextAuth — allow public FY guide images without login
    const session = await getServerSession(authOptions)
    const isPublicFy = await canViewFyImageWithoutAuth(filePath)
    if (!session?.user?.id && !isPublicFy) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate a signed URL for the file
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('placements')
      .createSignedUrl(filePath, 3600) // Valid for 1 hour

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError)
      console.error('File path requested:', filePath)
      
      // Try to list files in the folder to see what's actually there
      const folderPath = filePath.split('/').slice(0, -1).join('/')
      const fileName = filePath.split('/').pop()
      const { data: fileList, error: listError } = await supabaseAdmin.storage
        .from('placements')
        .list(folderPath)
      
      if (listError) {
        console.error('Error listing files in folder:', listError)
      }
      
      return NextResponse.json({ 
        error: 'Failed to generate view URL',
        details: signedUrlError.message,
        filePath,
        folderPath,
        fileName,
        fileExists: fileList?.some(f => f.name === fileName) || false
      }, { status: 500 })
    }

    // Fetch the file from the signed URL
    const fileResponse = await fetch(signedUrlData.signedUrl)
    
    if (!fileResponse.ok) {
      console.error('Error fetching file from signed URL:', fileResponse.statusText)
      return NextResponse.json({ 
        error: 'Failed to fetch image file',
        details: fileResponse.statusText 
      }, { status: 500 })
    }

    const fileBuffer = await fileResponse.arrayBuffer()
    const contentType = fileResponse.headers.get('content-type') || 'image/png'
    // Longer cache for public FY guide images helps social scrapers (FB/WhatsApp/X)
    const cacheControl = isPublicFy
      ? 'public, max-age=86400, stale-while-revalidate=604800'
      : 'private, max-age=3600'

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
        'Content-Length': fileBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('Error in GET /api/placements/images/view:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

