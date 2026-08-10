import { NextResponse } from 'next/server'
import { buildPublicFyOgJpeg } from '@/lib/fy-og-image'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Props = { params: { topicSlug: string; pageSlug: string } }

/**
 * Clean social-card image URL (no /api, no query hash).
 * Example: /guides/foundation-year/og/clerking-shifts/aki-stages-quick-guide
 */
export async function GET(_request: Request, { params }: Props) {
  const pageSlug = params.pageSlug.replace(/\.jpe?g$/i, '')
  const jpeg = await buildPublicFyOgJpeg(params.topicSlug, pageSlug)

  return new NextResponse(new Uint8Array(jpeg), {
    status: 200,
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'Content-Length': String(jpeg.byteLength),
    },
  })
}
