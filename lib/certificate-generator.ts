import { createClient } from '@supabase/supabase-js'
import type { SKRSContext2D } from '@napi-rs/canvas'
import { existsSync } from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const DEBUG_CERT = process.env.CERT_DEBUG === '1'
const DEFAULT_FONT_FAMILY = 'Inter'
const REGISTERED_FONTS: Record<string, boolean> = {}

const getFontPath = (fontFile: string) => path.join(process.cwd(), 'public', 'fonts', fontFile)

function ensureFontRegistered(registerFont: ((src: string, options: { family: string }) => void) | undefined) {
  if (!registerFont) {
    return
  }

  const fontPath = getFontPath('Inter-Regular.ttf')

  if (!existsSync(fontPath)) {
    if (DEBUG_CERT) {
      console.warn('⚠️ Certificate debug: fallback font file missing at', fontPath)
    }
    return
  }

  if (REGISTERED_FONTS[DEFAULT_FONT_FAMILY]) {
    return
  }

  try {
    registerFont(fontPath, { family: DEFAULT_FONT_FAMILY })
    REGISTERED_FONTS[DEFAULT_FONT_FAMILY] = true
    console.log('🆕 Registered fallback font for certificates:', fontPath)
  } catch (error) {
    console.error('⚠️ Failed to register fallback font:', error)
  }
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export interface CertificateData {
  attendee_name: string
  attendee_email?: string
  attendee_university?: string
  attendee_role?: string
  event_title: string
  event_date: string
  event_description?: string
  event_start_time?: string
  event_startTime?: string
  event_end_time?: string
  event_endTime?: string
  event_time_notes?: string
  event_timeNotes?: string
  event_location?: string
  event_organizer?: string
  event_category?: string
  event_format?: string
  event_link?: string
  event_eventLink?: string
  event_status?: string
  event_attendees?: string | number
  event_owner_name?: string
  certificate_date: string
  certificate_id: string
  generator_name?: string
  [key: string]: any
}

export interface TemplateField {
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
}

export interface Template {
  id: string
  name: string
  backgroundImage: string // This will be a signed URL
  fields?: TemplateField[] | string | null
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
    const { createCanvas, loadImage, registerFont } = await import('@napi-rs/canvas')
    ensureFontRegistered(registerFont)
    const fields = normalizeFields(template.fields)
    const fieldDebugInfo: Array<Record<string, any>> = []

    console.log('🎯 Certificate Generator Debug:')
    console.log('  - Attendee:', certificateData.attendee_name)
    console.log('  - Event:', certificateData.event_title)
    console.log('  - Template ID:', template.id)
    console.log('  - Template background image URL:', template.backgroundImage)
    console.log('  - Fields to render:', fields.length)

    if (!template.backgroundImage) {
      console.error('❌ No background image provided for template')
      return null
    }

    const sanitize = (value: string | undefined, fallback: string) => {
      const usable = (value || fallback).trim() || fallback
      return usable.replace(/[^a-zA-Z0-9]/g, '_')
    }

    // Create folder structure: users/{generator}/certificates/{event title}/{attendee}/file
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

    for (const field of fields) {
      const valueFromData = field.dataSource ? getFieldValue(field.dataSource, certificateData) : ''
      const resolvedText = (valueFromData || field.text || '').toString().trim()
      const isBlank = resolvedText.length === 0
      const placeholderText = `[MISSING ${field.dataSource || field.id}]`
      const textToRender = isBlank && DEBUG_CERT ? placeholderText : resolvedText

      const resolvedFontStack = resolveFontStack(field.fontFamily)
      const formattedFontStack = formatFontStack(resolvedFontStack)

      const debugEntry = {
        fieldId: field.id,
        dataSource: field.dataSource,
        originalText: field.text,
        resolvedText,
        isBlank,
        placeholderUsed: isBlank && DEBUG_CERT,
        font: {
          size: field.fontSize,
          requested: field.fontFamily,
          resolved: resolvedFontStack,
          weight: field.fontWeight,
          color: field.color,
          align: field.textAlign
        },
        position: {
          x: field.x,
          y: field.y,
          width: field.width,
          height: field.height
        }
      }

      fieldDebugInfo.push(debugEntry)

      console.log('🖨️ Rendering certificate field', debugEntry)

      if (!textToRender) {
        continue
      }

      const scaledX = field.x * scaleX
      const scaledY = field.y * scaleY
      const scaledWidth = (field.width || templateCanvasSize.width) * scaleX
      const scaledFontSize = (field.fontSize || 24) * scaleX
      const textAlign = (field.textAlign || 'left') as CanvasTextAlign
      const fontFamily = formattedFontStack
      const fontWeight = field.fontWeight || 'normal'

      ctx.font = `${fontWeight} ${scaledFontSize}px ${fontFamily}`
      ctx.fillStyle = field.color || '#000000'
      ctx.textAlign = textAlign
      ctx.textBaseline = 'top'

      const lines = wrapText(ctx, textToRender, scaledWidth)

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

    if (DEBUG_CERT) {
      const debugPayload = {
        timestamp: new Date().toISOString(),
        template: {
          id: template.id,
          fieldCount: fields.length,
          canvasSize: template.canvasSize || template.canvas_size || null,
          backgroundImage: template.backgroundImage
        },
        certificateData,
        fieldDebugInfo
      }

      const debugFilePath = `${folderPath}/${filename.replace(/\.png$/i, '')}.debug.json`
      const { error: debugUploadError } = await supabase.storage
        .from('certificates')
        .upload(debugFilePath, Buffer.from(JSON.stringify(debugPayload, null, 2), 'utf-8'), {
          cacheControl: '60',
          contentType: 'application/json',
          upsert: true
        })

      if (debugUploadError) {
        console.error('⚠️ Failed to upload certificate debug log:', debugUploadError)
      } else {
        console.log('📝 Certificate debug log uploaded:', debugFilePath)
      }
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
  const directField = (keys: string[]): string => {
    for (const key of keys) {
      const value = certificateData[key]
      if (value !== undefined && value !== null && String(value).trim().length > 0) {
        return String(value)
      }
    }
    return ''
  }

  const fieldMap: Record<string, string> = {
    'event.title': directField(['event_title']),
    'event.description': directField(['event_description']),
    'event.date': directField(['event_date']),
    'event.start_time': directField(['event_start_time', 'event_startTime']),
    'event.startTime': directField(['event_startTime', 'event_start_time']),
    'event.end_time': directField(['event_end_time', 'event_endTime']),
    'event.endTime': directField(['event_endTime', 'event_end_time']),
    'event.time_notes': directField(['event_time_notes', 'event_timeNotes']),
    'event.timeNotes': directField(['event_timeNotes', 'event_time_notes']),
    'event.location': directField(['event_location']),
    'event.organizer': directField(['event_organizer', 'event_owner_name']),
    'event.category': directField(['event_category']),
    'event.format': directField(['event_format']),
    'event.attendees': directField(['event_attendees']),
    'event.eventLink': directField(['event_eventLink', 'event_link']),
    'event.status': directField(['event_status']),
    'attendee.name': directField(['attendee_name']),
    'attendee.email': directField(['attendee_email']),
    'attendee.university': directField(['attendee_university']),
    'attendee.role': directField(['attendee_role']),
    'certificate.date': directField(['certificate_date']),
    'certificate.id': directField(['certificate_id'])
  }

    const fallback = certificateData[dataSource]
    if (typeof fallback === 'string' && fallback.trim().length > 0) {
      return fallback
    }

  return fieldMap[dataSource] || ''
}

function resolveFontStack(requestedFontFamily?: string): string[] {
  const fallbackStack = [DEFAULT_FONT_FAMILY, 'sans-serif']

  if (!requestedFontFamily) {
    return [...fallbackStack]
  }

  const rawFamilies = requestedFontFamily
    .split(',')
    .map((font) => font.trim())
    .filter(Boolean)
    .map((font) => font.replace(/^['"]|['"]$/g, ''))

  const normalizedSet = new Set<string>()
  const orderedStack: string[] = []

  for (const family of rawFamilies) {
    const lowered = family.toLowerCase()
    if (['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui'].includes(lowered)) {
      continue
    }
    if (!normalizedSet.has(lowered)) {
      normalizedSet.add(lowered)
      orderedStack.push(family)
    }
  }

  for (const fallback of fallbackStack) {
    if (!normalizedSet.has(fallback.toLowerCase())) {
      normalizedSet.add(fallback.toLowerCase())
      orderedStack.push(fallback)
    }
  }

  return orderedStack
}

function formatFontStack(fontFamilies: string[]): string {
  return fontFamilies
    .map((family) => {
      if (/[^a-z0-9-]/i.test(family)) {
        const sanitized = family.replace(/"/g, '\"')
        return `"${sanitized}"`
      }
      return family
    })
    .join(', ')
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

function normalizeFields(fields: Template['fields']): TemplateField[] {
  if (!fields) {
    return []
  }

  if (Array.isArray(fields)) {
    return fields as TemplateField[]
  }

  if (typeof fields === 'string') {
    try {
      const parsed = JSON.parse(fields)
      return Array.isArray(parsed) ? parsed as TemplateField[] : []
    } catch (error) {
      console.error('❌ Failed to parse template fields JSON:', error)
      return []
    }
  }

  return []
}