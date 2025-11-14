import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import sharp from 'sharp'

export const dynamic = 'force-dynamic'

const sanitizeSegment = (value?: string | null) => {
  if (!value) return 'general'
  return value.replace(/[^a-zA-Z0-9-_]/g, '-')
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .maybeSingle()

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const documentId = formData.get('documentId') as string | null
    const pageSlug = formData.get('pageSlug') as string | null

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type.' }, { status: 400 })
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer())
    let processedBuffer = originalBuffer
    try {
      processedBuffer = await sharp(originalBuffer)
        .webp({ quality: 80, effort: 6 })
        .toBuffer()
    } catch (error) {
      console.error('Quiz image compression failed, using original file.', error)
    }

    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 9)
    const folderPath = `questions/${sanitizeSegment(documentId)}/${sanitizeSegment(pageSlug)}/rich-text`
    const filePath = `${folderPath}/${timestamp}-${randomString}.webp`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('quiz-images')
      .upload(filePath, processedBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/webp',
      })

    if (uploadError) {
      console.error('Error uploading quiz image:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    const { data: signedUrlData, error: signedError } = await supabaseAdmin.storage
      .from('quiz-images')
      .createSignedUrl(filePath, 3600)

    if (signedError) {
      console.error('Error creating signed URL:', signedError)
    }

    const viewUrl = `/api/quiz/images/view?path=${encodeURIComponent(filePath)}`

    return NextResponse.json({
      url: viewUrl,
      path: filePath,
      tempSignedUrl: signedUrlData?.signedUrl ?? null,
    })
  } catch (error) {
    console.error('Error in POST /api/quiz/images/rich-text:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


