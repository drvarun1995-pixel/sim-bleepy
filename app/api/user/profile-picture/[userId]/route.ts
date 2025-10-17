import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Initialize Supabase client with service role for storage operations
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

/**
 * GET - Serve profile picture with authentication
 * This endpoint serves the image data directly, bypassing RLS issues
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = params

    // Check if user has a profile picture by looking for files in their folder
    const { data: files, error: listError } = await supabase.storage
      .from('profile-pictures')
      .list(userId)

    if (listError || !files || files.length === 0) {
      return NextResponse.json({ error: 'Profile picture not found' }, { status: 404 })
    }

    // Find the profile picture file (should be {userId}.webp)
    const profilePictureFile = files.find(file => 
      file.name === `${userId}.webp` || file.name.endsWith('.webp')
    )

    if (!profilePictureFile) {
      return NextResponse.json({ error: 'Profile picture not found' }, { status: 404 })
    }

    const bucketName = 'profile-pictures'
    const filePath = `${userId}/${profilePictureFile.name}`

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucketName)
      .download(filePath)

    if (downloadError || !fileData) {
      console.error('Error downloading file:', downloadError)
      return NextResponse.json({ error: 'Failed to retrieve image' }, { status: 500 })
    }

    // Convert blob to array buffer
    const arrayBuffer = await fileData.arrayBuffer()

    // Return the image with proper headers
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000', // 1 year cache
        'Content-Length': arrayBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('Error in GET /api/user/profile-picture/[userId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
