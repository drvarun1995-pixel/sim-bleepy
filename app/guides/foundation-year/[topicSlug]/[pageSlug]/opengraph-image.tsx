import { buildPublicFyOgJpeg, FY_OG_SIZE } from '@/lib/fy-og-image'

export const runtime = 'nodejs'
export const alt = 'Bleepy Foundation Year guide'
export const size = FY_OG_SIZE
export const contentType = 'image/jpeg'

type Props = { params: { topicSlug: string; pageSlug: string } }

export default async function Image({ params }: Props) {
  const jpeg = await buildPublicFyOgJpeg(params.topicSlug, params.pageSlug)
  return new Response(new Uint8Array(jpeg), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}
