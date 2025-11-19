import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

const ALLOWED_CATEGORIES = [
  'bedside-teaching',
  'twilight-teaching',
  'core-teaching',
  'osce-skills-teaching',
  'exams',
  'others'
]

const ALLOWED_EVIDENCE_TYPES = [
  'email',
  'certificate',
  'document',
  'other'
]

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has CTF or Admin role
    const userRole = (session.user as any)?.role
    if (userRole !== 'ctf' && userRole !== 'admin') {
      return NextResponse.json({ 
        error: 'Access Denied',
        message: 'Teaching Portfolio is only accessible to CTF and Admin users.'
      }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const category = formData.get('category') as string
    const evidenceType = formData.get('evidenceType') as string
    const displayName = formData.get('displayName') as string
    const description = formData.get('description') as string
    const activityDate = formData.get('activityDate') as string | null

    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    if (!evidenceType || !ALLOWED_EVIDENCE_TYPES.includes(evidenceType)) {
      return NextResponse.json({ error: 'Invalid evidence type' }, { status: 400 })
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 25MB limit' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not supported' }, { status: 400 })
    }

    // Get user name for directory structure
    const userName = session.user.name || session.user.email?.split('@')[0] || 'user'
    const sanitizedUserName = userName.replace(/[^a-zA-Z0-9-_]/g, '_')
    
    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const filename = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`
    
    // Create storage path
    const storagePath = `${sanitizedUserName}/${category}/${filename}`

    // Upload file to Supabase Storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('teaching-portfolio')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload file to storage', 
        details: uploadError.message
      }, { status: 500 })
    }

    // Save file info to database
    const { data, error } = await supabaseAdmin
      .from('teaching_portfolio_files')
      .insert({
        user_id: session.user.id,
        filename: filename,
        original_filename: file.name,
        display_name: displayName || null,
        file_size: file.size,
        file_type: fileExtension || null,
        mime_type: file.type,
        category,
        evidence_type: evidenceType,
        file_path: storagePath,
        description: description || null,
        activity_date: activityDate || null
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to save file info', 
        details: error.message,
        code: error.code 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      file: data 
    }, { status: 200 })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

