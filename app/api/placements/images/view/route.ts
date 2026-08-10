import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import sharp from 'sharp'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { canViewFyImageWithoutAuth } from '@/lib/fy-public-guides'
import { FY_IMAGE_WIDTHS } from '@/lib/fy-public-html'
import { isSafeStoragePath } from '@/lib/secure-file-access'

const ALLOWED_WIDTHS = new Set<number>(FY_IMAGE_WIDTHS)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    const wRaw = searchParams.get('w')

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    if (!isSafeStoragePath(filePath)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }

    let resizeWidth: number | null = null
    if (wRaw != null && wRaw !== '') {
      const parsed = Number.parseInt(wRaw, 10)
      if (!Number.isFinite(parsed) || !ALLOWED_WIDTHS.has(parsed)) {
        return NextResponse.json(
          { error: 'Invalid width', allowed: Array.from(ALLOWED_WIDTHS) },
          { status: 400 }
        )
      }
      resizeWidth = parsed
    }

    // Get the session from NextAuth — allow public FY guide images without login
    const session = await getServerSession(authOptions)
    const isPublicFy = await canViewFyImageWithoutAuth(filePath)
    if (!session?.user?.id && !isPublicFy) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate a signed URL for the file
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('placements')
      .createSignedUrl(filePath, 3600) // Valid for 1 hour

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError.message)
      return NextResponse.json({ error: 'Failed to generate view URL' }, { status: 500 })
    }

    const fileResponse = await fetch(signedUrlData.signedUrl)

    if (!fileResponse.ok) {
      console.error('Error fetching file from signed URL:', fileResponse.statusText)
      return NextResponse.json({
        error: 'Failed to fetch image file',
        details: fileResponse.statusText,
      }, { status: 500 })
    }

    let outBuffer: Buffer = Buffer.from(await fileResponse.arrayBuffer())
    let contentType = fileResponse.headers.get('content-type') || 'image/png'

    // Resize only public FY images (list/carousel/hero caps). Private images stay untouched.
    if (isPublicFy && resizeWidth) {
      try {
        const meta = await sharp(outBuffer, { failOn: 'none' }).metadata()
        const format = meta.format

        if (format && format !== 'svg' && format !== 'pdf') {
          const pipeline = sharp(outBuffer, { failOn: 'none', animated: false })
            .rotate()
            .resize({
              width: resizeWidth,
              withoutEnlargement: true,
              fit: 'inside',
            })

          if (format === 'gif') {
            outBuffer = await pipeline.gif().toBuffer()
            contentType = 'image/gif'
          } else {
            outBuffer = await pipeline.webp({ quality: 80 }).toBuffer()
            contentType = 'image/webp'
          }
        }
      } catch (resizeError) {
        console.error('FY image resize failed; serving original:', resizeError)
      }
    }

    const cacheControl = isPublicFy
      ? 'public, max-age=86400, stale-while-revalidate=604800'
      : 'private, max-age=3600'

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
      'Content-Length': String(outBuffer.byteLength),
    }
    // Members-only FY/hospital assets must not be indexed even if a URL leaks.
    if (!isPublicFy) {
      headers['X-Robots-Tag'] = 'noindex, nofollow, noarchive'
    }

    return new NextResponse(new Uint8Array(outBuffer), {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('Error in GET /api/placements/images/view:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
