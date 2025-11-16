import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import { ANNOUNCEMENT_BUCKET_ID } from '@/lib/admin-announcement-images'

const getContentType = (path: string): string => {
  if (path.endsWith('.png')) return 'image/png'
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg'
  if (path.endsWith('.gif')) return 'image/gif'
  return 'image/webp'
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pathParam = searchParams.get('path')

    if (!pathParam) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    const decodedPath = decodeURIComponent(pathParam)

    if (decodedPath.includes('..')) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.storage
      .from(ANNOUNCEMENT_BUCKET_ID)
      .download(decodedPath)

    if (error || !data) {
      console.error('Failed to download announcement image:', error)
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 })
    }

    const arrayBuffer = await data.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const contentType = getContentType(decodedPath)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error in GET /api/announcements/images/view:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

