import { readFile } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { getPublicFyPage } from '@/lib/fy-public-guides'
import { supabaseAdmin } from '@/utils/supabase'

export const runtime = 'nodejs'
export const alt = 'Bleepy Foundation Year guide'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/jpeg'

type Props = { params: { topicSlug: string; pageSlug: string } }

async function loadDefaultOgJpeg(): Promise<Buffer> {
  const png = await readFile(path.join(process.cwd(), 'public', 'og-default.png'))
  return sharp(png).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 85 }).toBuffer()
}

export default async function Image({ params }: Props) {
  try {
    const page = await getPublicFyPage(params.topicSlug, params.pageSlug)
    const storagePath = page?.featured_image?.trim()

    if (storagePath && !storagePath.includes('..')) {
      const { data, error } = await supabaseAdmin.storage
        .from('placements')
        .download(storagePath)

      if (!error && data) {
        const input = Buffer.from(await data.arrayBuffer())
        const jpeg = await sharp(input)
          .resize(1200, 630, { fit: 'cover', position: 'centre' })
          .jpeg({ quality: 85, mozjpeg: true })
          .toBuffer()

        return new Response(new Uint8Array(jpeg), {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          },
        })
      }
    }
  } catch (error) {
    console.error('opengraph-image error:', error)
  }

  const fallback = await loadDefaultOgJpeg()
  return new Response(new Uint8Array(fallback), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}
