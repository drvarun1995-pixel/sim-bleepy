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

    // First, check if the file exists in storage
    const { data: fileList, error: listError } = await supabaseAdmin.storage
      .from('certificates')
      .list(filePath.split('/').slice(0, -1).join('/'), {
        search: filePath.split('/').pop()
      })

    if (listError || !fileList || fileList.length === 0) {
      console.error('File not found in storage:', filePath)
      return NextResponse.json({ 
        error: 'Certificate file not found',
        details: 'The certificate file does not exist in storage' 
      }, { status: 404 })
    }

    // Generate a signed URL for the file
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('certificates')
      .createSignedUrl(filePath, 3600) // Valid for 1 hour

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError)
      return NextResponse.json({ 
        error: 'Failed to generate download URL',
        details: signedUrlError.message 
      }, { status: 500 })
    }

    // Download the file directly
    const fileResponse = await fetch(signedUrlData.signedUrl)
    
    if (!fileResponse.ok) {
      console.error('Error fetching file from signed URL:', fileResponse.statusText)
      return NextResponse.json({ 
        error: 'Failed to fetch certificate file',
        details: fileResponse.statusText 
      }, { status: 500 })
    }

    const fileBuffer = await fileResponse.arrayBuffer()
    
    // Extract filename from path
    const filename = filePath.split('/').pop() || 'certificate.png'
    
    // Return the file with proper headers for download
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('Error in GET /api/certificates/download:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
