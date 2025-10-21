import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user role for permissions
    const allowedRoles = ['admin', 'meded_team', 'ctf']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only admin, meded_team, and ctf can upload images.' },
        { status: 403 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileName = formData.get('fileName') as string

    if (!file || !fileName) {
      return NextResponse.json(
        { error: 'File and fileName are required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type)

    // Upload file to storage
    const { data, error } = await supabase.storage
      .from('certificates')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('Upload successful, data:', data)

    // Get a signed URL instead of public URL (for private bucket)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('certificates')
      .createSignedUrl(fileName, 3600) // Valid for 1 hour

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError)
      return NextResponse.json(
        { error: `Failed to create signed URL: ${signedUrlError.message}` },
        { status: 500 }
      )
    }

    console.log('Generated signed URL:', signedUrlData.signedUrl)

    // Test if the file actually exists by trying to list it
    const { data: listData, error: listError } = await supabase.storage
      .from('certificates')
      .list('template-images', {
        search: fileName.split('/')[1] // Just the filename part
      })

    if (listError) {
      console.error('Error listing files:', listError)
    } else {
      console.log('File list result:', listData)
    }

    return NextResponse.json({
      success: true,
      imageUrl: signedUrlData.signedUrl,
      fileName: fileName,
      uploadData: data,
      listData: listData
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
