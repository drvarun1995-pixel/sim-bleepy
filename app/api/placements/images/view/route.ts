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
      } else {
        const matchingFile = fileList?.find(f => f.name === fileName)
        console.log('Files in folder:', fileList?.map(f => f.name))
        console.log('Looking for file:', fileName)
        console.log('File found:', !!matchingFile)
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
    
    // Return the file with proper headers for viewing (not downloading)
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
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

