import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import sharp from 'sharp'

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
 * POST - Upload profile picture
 * Client sends compressed image, we upload to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 3MB, but should already be compressed on client)
    if (file.size > 3 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 3MB.' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const fullBuffer = await sharp(buffer)
      .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90 })
      .toBuffer()

    const thumbnailBuffer = await sharp(buffer)
      .resize(196, 196, { fit: 'cover', position: 'attention' })
      .webp({ quality: 85 })
      .toBuffer()

    const folder = user.id
    const fullFilename = 'profile.webp'
    const thumbFilename = 'profile-thumb.webp'
    const filePath = `${folder}/${fullFilename}`
    const thumbPath = `${folder}/${thumbFilename}`

    // Delete existing profile picture if it exists
    const { data: existingFiles } = await supabase.storage
      .from('profile-pictures')
      .list(user.id)

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map((f) => `${user.id}/${f.name}`)
      await supabase.storage.from('profile-pictures').remove(filesToDelete)
    }

    // Upload to Supabase Storage
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, fullBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      console.error('Upload error details:', JSON.stringify(uploadError, null, 2))
      return NextResponse.json(
        { error: `Failed to upload image to storage: ${uploadError.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    console.log('Full image uploaded successfully:', uploadData)

    const { error: thumbUploadError, data: thumbUploadData } = await supabase.storage
      .from('profile-pictures')
      .upload(thumbPath, thumbnailBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true,
      })

    if (thumbUploadError) {
      console.error('Thumbnail upload error:', thumbUploadError)
      console.error('Thumbnail upload error details:', JSON.stringify(thumbUploadError, null, 2))
      // Try to clean up the full image if thumbnail fails
      try {
        await supabase.storage.from('profile-pictures').remove([filePath])
      } catch (cleanupError) {
        console.error('Failed to cleanup full image:', cleanupError)
      }
      return NextResponse.json(
        { error: `Failed to upload thumbnail: ${thumbUploadError.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    console.log('Thumbnail uploaded successfully:', thumbUploadData)

    // Store the API endpoint URL instead of direct storage URL
    const baseUrl = `/api/user/profile-picture/${user.id}`
    const thumbnailUrl = `${baseUrl}?variant=thumb`

    // Update user record with new profile picture URL
    const { error: updateError } = await supabase
      .from('users')
      .update({
        profile_picture_url: baseUrl,
        profile_picture_updated_at: new Date().toISOString(),
        avatar_type: 'upload',
        avatar_asset: thumbnailUrl,
        avatar_thumbnail: thumbnailUrl,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Database update error:', updateError)
      // Clean up uploaded file
      await supabase.storage.from('profile-pictures').remove([filePath, thumbPath])
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Profile picture uploaded successfully',
      url: baseUrl,
      thumbnail: thumbnailUrl,
    })
  } catch (error) {
    console.error('Error in POST /api/user/profile-picture:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove profile picture
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, profile_picture_url')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.profile_picture_url) {
      return NextResponse.json(
        { error: 'No profile picture to delete' },
        { status: 400 }
      )
    }

    // Delete all files in user's folder
    const { data: files } = await supabase.storage
      .from('profile-pictures')
      .list(user.id)

    if (files && files.length > 0) {
      const filesToDelete = files.map((f) => `${user.id}/${f.name}`)
      const { error: deleteError } = await supabase.storage
        .from('profile-pictures')
        .remove(filesToDelete)

      if (deleteError) {
        console.error('Storage delete error:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete image from storage' },
          { status: 500 }
        )
      }
    }

    // Update user record to remove profile picture URL
    const { error: updateError } = await supabase
      .from('users')
      .update({
        profile_picture_url: null,
        profile_picture_updated_at: null,
        avatar_type: 'library',
        avatar_asset: null,
        avatar_thumbnail: null,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Profile picture removed successfully',
    })
  } catch (error) {
    console.error('Error in DELETE /api/user/profile-picture:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

