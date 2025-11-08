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

    // Convert file to buffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate filename: user-id.webp (overwrites existing)
    const filename = `${user.id}.webp`
    const filePath = `${user.id}/${filename}`

    // Delete existing profile picture if it exists
    const { data: existingFiles } = await supabase.storage
      .from('profile-pictures')
      .list(user.id)

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map((f) => `${user.id}/${f.name}`)
      await supabase.storage.from('profile-pictures').remove(filesToDelete)
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload image to storage' },
        { status: 500 }
      )
    }

    // Store the API endpoint URL instead of direct storage URL
    const publicUrl = `/api/user/profile-picture/${user.id}`

    // Update user record with new profile picture URL
    const { error: updateError } = await supabase
      .from('users')
      .update({
        profile_picture_url: publicUrl,
        profile_picture_updated_at: new Date().toISOString(),
        avatar_type: 'upload',
        avatar_asset: publicUrl,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Database update error:', updateError)
      // Clean up uploaded file
      await supabase.storage.from('profile-pictures').remove([filePath])
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Profile picture uploaded successfully',
      url: publicUrl,
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

