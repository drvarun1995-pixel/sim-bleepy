import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import sharp from 'sharp'
import { ANNOUNCEMENT_BUCKET_ID, ANNOUNCEMENT_DRAFT_PREFIX } from '@/lib/admin-announcement-images'

const VALID_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (!user || !['admin', 'educator', 'meded_team', 'ctf'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const draftId = formData.get('draftId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    if (!draftId) {
      return NextResponse.json({ error: 'draftId is required for announcement uploads' }, { status: 400 })
    }

    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 })
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer()) as Buffer
    let processedBuffer = originalBuffer
    let quality = 85

    try {
      let attempt = 0
      const maxAttempts = 10
      const targetSize = 200 * 1024

      while (attempt < maxAttempts) {
        processedBuffer = await sharp(originalBuffer).webp({ quality, effort: 6 }).toBuffer()
        if (processedBuffer.length <= targetSize || quality <= 30) break
        quality -= 5
        attempt++
      }
    } catch (error) {
      console.error('Announcement image compression failed, using original buffer:', error)
      processedBuffer = originalBuffer
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`
    const folderPath = `${ANNOUNCEMENT_DRAFT_PREFIX}/${draftId}/images`
    const filePath = `${folderPath}/${fileName}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from(ANNOUNCEMENT_BUCKET_ID)
      .upload(filePath, processedBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/webp',
      })

    if (uploadError) {
      console.error('Failed to upload announcement image:', uploadError)
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    const viewUrl = `/api/announcements/images/view?path=${encodeURIComponent(filePath)}`

    return NextResponse.json({
      url: viewUrl,
      path: filePath,
    })
  } catch (error) {
    console.error('Error in POST /api/announcements/images:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

