import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import {
  ANNOUNCEMENT_BUCKET_ID,
  ANNOUNCEMENT_DRAFT_PREFIX,
  ANNOUNCEMENT_FINAL_PREFIX,
} from '@/lib/admin-announcement-images'
import {
  applyFileSecurityHeaders,
  isSafeStoragePath,
  isStaffRole,
  withFileSecurityHeaders,
} from '@/lib/secure-file-access'

const getContentType = (path: string): string => {
  if (path.endsWith('.png')) return 'image/png'
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg'
  if (path.endsWith('.gif')) return 'image/gif'
  return 'image/webp'
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    }

    const { searchParams } = new URL(request.url)
    const pathParam = searchParams.get('path')

    if (!pathParam) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'File path is required' }, { status: 400 })
      )
    }

    const decodedPath = decodeURIComponent(pathParam)

    if (!isSafeStoragePath(decodedPath)) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
      )
    }

    // Draft images: staff only
    if (decodedPath.startsWith(`${ANNOUNCEMENT_DRAFT_PREFIX}/`)) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('email', session.user.email)
        .single()

      if (!isStaffRole(user?.role)) {
        return applyFileSecurityHeaders(
          NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        )
      }
    } else if (!decodedPath.startsWith(`${ANNOUNCEMENT_FINAL_PREFIX}/`)) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
      )
    }

    const { data, error } = await supabaseAdmin.storage
      .from(ANNOUNCEMENT_BUCKET_ID)
      .download(decodedPath)

    if (error || !data) {
      console.error('Failed to download announcement image:', error)
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 })
      )
    }

    const arrayBuffer = await data.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const contentType = getContentType(decodedPath)

    return new NextResponse(buffer, {
      status: 200,
      headers: withFileSecurityHeaders(undefined, {
        'Content-Type': contentType,
      }),
    })
  } catch (error) {
    console.error('Error in GET /api/announcements/images/view:', error)
    return applyFileSecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
