import sharp from 'sharp'

export const TEACHING_PREVIEW_MAX_EDGE = 960
export const TEACHING_PREVIEW_JPEG_QUALITY = 72

export async function createTeachingPreviewJpeg(input: Buffer) {
  return sharp(input)
    .rotate()
    .resize(TEACHING_PREVIEW_MAX_EDGE, TEACHING_PREVIEW_MAX_EDGE, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: TEACHING_PREVIEW_JPEG_QUALITY, mozjpeg: true })
    .toBuffer()
}
