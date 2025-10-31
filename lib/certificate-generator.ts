import { createClient } from '@supabase/supabase-js'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import type { SKRSContext2D } from '@napi-rs/canvas'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export interface CertificateData {
  attendee_name: string
  event_title: string
  event_date: string
  event_description?: string
  event_start_time?: string
  event_end_time?: string
  event_location?: string
  event_organizer?: string
  event_category?: string
  event_format?: string
  certificate_date: string
  certificate_id: string
  [key: string]: any
}

export interface Template {
  id: string
  name: string
  backgroundImage: string // This will be a signed URL
  fields: Array<{
    id: string
    text: string
    x: number
    y: number
    fontSize: number
    fontFamily: string
    color: string
    fontWeight: string
    textAlign: string
    width: number
    height: number
    dataSource: string
    customValue?: string
  }>
  canvasSize?: {
    width: number
    height: number
  }
  canvas_size?: {
    width: number
    height: number
  }
}

/**
 * Generate certificate image with text fields rendered on the template
 * This function downloads the template image, renders text fields on it, and uploads the result
 */
export async function generateCertificateImage(
  template: Template,
  certificateData: CertificateData
): Promise<string | null> {
  try {
    console.log('🎯 Certificate Generator Debug:')
    console.log('  - Attendee:', certificateData.attendee_name)
    console.log('  - Event:', certificateData.event_title)
    console.log('  - Template ID:', template.id)
    console.log('  - Template background image URL:', template.backgroundImage)
    console.log('  - Fields to render:', template.fields?.length || 0)

    if (!template.backgroundImage) {
      console.error('❌ No background image provided for template')
      return null
    }

    const sanitize = (value: string | undefined, fallback: string) => {
      const usable = (value || fallback).trim() || fallback
      return usable.replace(/[^a-zA-Z0-9]/g, '_')
    }

    // Create proper folder structure: users > generator name > certificates > event title > recipient name > certificate file
    const generatorName = sanitize(certificateData.generator_name, 'Auto_Generator')
    const eventTitleSlug = sanitize(certificateData.event_title, 'Event')
    const attendeeNameSlug = sanitize(certificateData.attendee_name, 'Recipient')
    const filename = `${eventTitleSlug}_${certificateData.certificate_id}.png`
    const folderPath = `users/${generatorName}/certificates/${eventTitleSlug}/${attendeeNameSlug}`
    const filePath = `${folderPath}/${filename}`

    console.log('📁 File paths:')
    console.log('  - Destination:', filePath)

    // Download the template image
    console.log('📥 Downloading template image from:', template.backgroundImage)

    const imageResponse = await fetch(template.backgroundImage)

    if (!imageResponse.ok) {
      console.error('❌ Failed to download template image:', imageResponse.status)
      const errorText = await imageResponse.text()
      console.error('❌ Response text:', errorText)
      return null
    }

    const arrayBuffer = await imageResponse.arrayBuffer()
    const backgroundImage = await loadImage(Buffer.from(arrayBuffer))

    const canvas = createCanvas(backgroundImage.width, backgroundImage.height)
    const ctx = canvas.getContext('2d')

    ctx.drawImage(backgroundImage, 0, 0, backgroundImage.width, backgroundImage.height)

    const templateCanvasSize = template.canvasSize || template.canvas_size || { width: backgroundImage.width, height: backgroundImage.height }
    const scaleX = templateCanvasSize.width ? backgroundImage.width / templateCanvasSize.width : 1
    const scaleY = templateCanvasSize.height ? backgroundImage.height / templateCanvasSize.height : 1

    for (const field of template.fields || []) {
      const valueFromData = field.dataSource ? getFieldValue(field.dataSource, certificateData) : ''
      const text = (valueFromData || field.text || '').toString().trim()

      if (!text) {
        continue
      }

      const scaledX = field.x * scaleX
      const scaledY = field.y * scaleY
      const scaledWidth = (field.width || templateCanvasSize.width) * scaleX
      const scaledFontSize = (field.fontSize || 24) * scaleX
      const textAlign = (field.textAlign || 'left') as CanvasTextAlign
      const fontFamily = field.fontFamily || 'Arial'
      const fontWeight = field.fontWeight || 'normal'

      ctx.font = `${fontWeight} ${scaledFontSize}px "${fontFamily}"`
      ctx.fillStyle = field.color || '#000000'
      ctx.textAlign = textAlign
      ctx.textBaseline = 'top'

      const lines = wrapText(ctx, text, scaledWidth)

      let textX = scaledX
      if (textAlign === 'center') {
        textX = scaledX + scaledWidth / 2
      } else if (textAlign === 'right') {
        textX = scaledX + scaledWidth
      }

      let currentY = scaledY
      for (const line of lines) {
        ctx.fillText(line, textX, currentY)
        currentY += scaledFontSize * 1.2
      }
    }

    const pngBuffer = canvas.toBuffer('image/png')

    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(filePath, pngBuffer, {
        cacheControl: '3600',
        contentType: 'image/png',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Error uploading rendered certificate:', uploadError)
      return null
    }

    console.log('✅ Certificate rendered and uploaded successfully:', filePath)

    return filePath
  } catch (error) {
    console.error('❌ Certificate generation error:', error)
    return null
  }
}

/**
 * Get field value from certificate data based on data source
 */
function getFieldValue(dataSource: string, certificateData: CertificateData): string {
  const fieldMap: Record<string, string> = {
    'event.title': certificateData.event_title || '',
    'event.date': certificateData.event_date || '',
    'event.description': certificateData.event_description || '',
    'event.start_time': certificateData.event_start_time || '',
    'event.end_time': certificateData.event_end_time || '',
    'event.location': certificateData.event_location || '',
    'event.organizer': certificateData.event_organizer || '',
    'event.category': certificateData.event_category || '',
    'event.format': certificateData.event_format || '',
    'attendee.name': certificateData.attendee_name || '',
    'certificate.date': certificateData.certificate_date || '',
    'certificate.id': certificateData.certificate_id || ''
  }
  
  return fieldMap[dataSource] || ''
}

/**
 * Wrap text to fit within specified width
 */
function wrapText(ctx: SKRSContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = words[0] || ''
  
  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    const width = ctx.measureText(currentLine + ' ' + word).width
    if (width < maxWidth) {
      currentLine += ' ' + word
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }
  lines.push(currentLine)
  return lines
}