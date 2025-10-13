import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
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
  'postgraduate',
  'presentations', 
  'publications',
  'teaching-experience',
  'training-in-teaching',
  'qi'
]

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const category = formData.get('category') as string
    const subcategory = formData.get('subcategory') as string
    const evidenceType = formData.get('evidenceType') as string
    const customSubsection = formData.get('customSubsection') as string
    const displayName = formData.get('displayName') as string
    const pmid = formData.get('pmid') as string
    const url = formData.get('url') as string
    const description = formData.get('description') as string

    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    // For publications with PMID/URL, file is optional
    const isPublicationLink = category === 'publications' && evidenceType === 'pmid-url'
    
    if (!isPublicationLink && !file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file && file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    if (file && !ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not supported' }, { status: 400 })
    }

    let filename = ''
    let storagePath = ''
    let fileSize = 0
    let fileType = ''
    let mimeType = ''
    let originalFilename = ''

    // Only upload file if it exists
    if (file) {
      // Get user name for directory structure
      const userName = session.user.name || session.user.email?.split('@')[0] || 'user'
      const sanitizedUserName = userName.replace(/[^a-zA-Z0-9-_]/g, '_')
      
      // Generate unique filename
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop()
      filename = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`
      
      // Create storage path with custom subsection support
      const subsection = customSubsection || subcategory || 'general'
      const sanitizedSubsection = subsection.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase()
      storagePath = `${sanitizedUserName}/${category}/${sanitizedSubsection}/${filename}`

      // Upload file to Supabase Storage
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('imt-portfolio')
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 })
      }

      fileSize = file.size
      fileType = fileExtension || ''
      mimeType = file.type
      originalFilename = file.name
    } else {
      // For publication links without files
      originalFilename = ''
      storagePath = ''
    }

    // Save file info to database
    const { data, error } = await supabaseAdmin
      .from('portfolio_files')
      .insert({
        user_id: session.user.id,
        filename: filename || null,
        original_filename: originalFilename || null,
        display_name: displayName || null,
        file_size: fileSize || 0,
        file_type: fileType || null,
        mime_type: mimeType || null,
        category,
        subcategory: subcategory || null,
        evidence_type: evidenceType || null,
        custom_subsection: customSubsection || null,
        pmid: pmid || null,
        url: url || null,
        file_path: storagePath || null,
        description: description || null
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to save file info' }, { status: 500 })
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
