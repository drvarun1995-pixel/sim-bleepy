import { readFile } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { getPublicFyPage } from '@/lib/fy-public-guides'
import { supabaseAdmin } from '@/utils/supabase'

export const FY_OG_SIZE = { width: 1200, height: 630 } as const

async function loadDefaultOgJpeg(): Promise<Buffer> {
  const png = await readFile(path.join(process.cwd(), 'public', 'og-default.png'))
  return sharp(png)
    .resize(FY_OG_SIZE.width, FY_OG_SIZE.height, { fit: 'cover' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer()
}

/** Build a 1200×630 JPEG for social cards (Facebook / X / WhatsApp). */
export async function buildPublicFyOgJpeg(
  topicSlug: string,
  pageSlug: string
): Promise<Buffer> {
  try {
    const page = await getPublicFyPage(topicSlug, pageSlug)
    const storagePath = page?.featured_image?.trim()

    if (storagePath && !storagePath.includes('..')) {
      const { data, error } = await supabaseAdmin.storage
        .from('placements')
        .download(storagePath)

      if (!error && data) {
        const input = Buffer.from(await data.arrayBuffer())
        return sharp(input)
          .resize(FY_OG_SIZE.width, FY_OG_SIZE.height, {
            fit: 'cover',
            position: 'centre',
          })
          .jpeg({ quality: 85, mozjpeg: true })
          .toBuffer()
      }
    }
  } catch (error) {
    console.error('buildPublicFyOgJpeg error:', error)
  }

  return loadDefaultOgJpeg()
}

export function publicFyOgImagePath(topicSlug: string, pageSlug: string) {
  return `/guides/foundation-year/og/${topicSlug}/${pageSlug}`
}
