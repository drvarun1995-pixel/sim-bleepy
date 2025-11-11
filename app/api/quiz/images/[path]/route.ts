import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

// GET - Get signed URL for image
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const imagePath = decodeURIComponent(params.path)

    // Generate signed URL (valid for 1 hour)
    const { data, error } = await supabaseAdmin.storage
      .from('quiz-images')
      .createSignedUrl(imagePath, 3600)

    if (error) {
      console.error('Error generating signed URL:', error)
      return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 })
    }

    return NextResponse.json({ signedUrl: data.signedUrl })
  } catch (error) {
    console.error('Error in GET /api/quiz/images/[path]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


