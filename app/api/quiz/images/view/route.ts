import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    const { data: signedUrlData, error } = await supabaseAdmin.storage
      .from('quiz-images')
      .createSignedUrl(filePath, 3600)

    if (error || !signedUrlData?.signedUrl) {
      console.error('Failed to create signed URL for quiz image:', error)
      return NextResponse.json({ error: 'Failed to generate view URL' }, { status: 500 })
    }

    const fileResponse = await fetch(signedUrlData.signedUrl)
    if (!fileResponse.ok) {
      console.error('Failed to fetch quiz image from signed URL:', fileResponse.statusText)
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 })
    }

    const buffer = await fileResponse.arrayBuffer()
    const contentType = fileResponse.headers.get('content-type') || 'image/webp'

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': buffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('Error in GET /api/quiz/images/view:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


