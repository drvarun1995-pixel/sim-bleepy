import { createClient } from '@supabase/supabase-js'
import type { SKRSContext2D } from '@napi-rs/canvas'
import { existsSync, readFileSync } from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const DEBUG_CERT = process.env.CERT_DEBUG === '1'
const DEFAULT_FONT_FAMILY = 'Inter'
const REGISTERED_FONTS: Record<string, boolean> = {}
const FONT_ALIAS_CACHE = new Set<string>()
let RESOLVED_FONT_PATH: string | null = null
let FALLBACK_FONT_BUFFER: Buffer | null = null
let LAST_FONT_DEBUG: Record<string, any> = {}

const FONT_CANDIDATE_PATHS = [
  path.join(process.cwd(), 'node_modules', '@fontsource', 'inter', 'files', 'inter-latin-400-normal.ttf'),
  path.join(process.cwd(), 'public', 'fonts', 'Inter-Regular.ttf')
]

type FontCandidateStatus = { path: string; exists: boolean }

const FONT_CANDIDATE_STATUSES: FontCandidateStatus[] = []

const resolveFontPath = (): string | null => {
  FONT_CANDIDATE_STATUSES.length = 0
  for (const candidate of FONT_CANDIDATE_PATHS) {
    const exists = existsSync(candidate)
    FONT_CANDIDATE_STATUSES.push({ path: candidate, exists })
    if (exists) {
      return candidate
    }
  }
  return null
}

type CanvasGlobalFonts = {
  registerFromPath?: (src: string, family: string) => boolean | unknown
  register?: (...args: any[]) => any
  has?: (family: string) => boolean
}

function ensureFontRegistered(globalFonts: CanvasGlobalFonts | undefined): boolean {
  if (!globalFonts) {
    if (DEBUG_CERT) {
      console.warn('⚠️ Certificate debug: GlobalFonts helper unavailable - using default sans-serif')
    }
    return false
  }

  const cachedHasFamily = globalFonts.has?.(DEFAULT_FONT_FAMILY) ?? false
  if (REGISTERED_FONTS[DEFAULT_FONT_FAMILY] && cachedHasFamily) {
    LAST_FONT_DEBUG = {
      fontReady: true,
      resolvedFontPath: RESOLVED_FONT_PATH,
      candidatePaths: [...FONT_CANDIDATE_STATUSES],
      aliasCache: Array.from(FONT_ALIAS_CACHE),
      registerStrategy: 'cached',
      registeredFamilies: {
        ...(LAST_FONT_DEBUG.registeredFamilies || {}),
        [DEFAULT_FONT_FAMILY]: true
      }
    }
    return true
  }

  if (cachedHasFamily) {
    REGISTERED_FONTS[DEFAULT_FONT_FAMILY] = true
    LAST_FONT_DEBUG = {
      fontReady: true,
      resolvedFontPath: RESOLVED_FONT_PATH,
      candidatePaths: [...FONT_CANDIDATE_STATUSES],
      aliasCache: Array.from(FONT_ALIAS_CACHE),
      registerStrategy: 'preloaded',
      registeredFamilies: {
        ...(LAST_FONT_DEBUG.registeredFamilies || {}),
        [DEFAULT_FONT_FAMILY]: true
      }
    }
    return true
  }

  const fontPath = resolveFontPath()

  if (!fontPath) {
    if (DEBUG_CERT) {
      console.warn('⚠️ Certificate debug: no bundled fallback font found. Checked:', FONT_CANDIDATE_PATHS)
    }
    LAST_FONT_DEBUG = {
      fontReady: false,
      resolvedFontPath: null,
      candidatePaths: [...FONT_CANDIDATE_STATUSES],
      aliasCache: Array.from(FONT_ALIAS_CACHE),
      registerStrategy: null
    }
    return false
  }

  try {
    if (DEBUG_CERT) {
      console.log('🅵 Certificate font candidates:', FONT_CANDIDATE_PATHS)
      console.log('🅵 Resolved certificate font path:', fontPath)
    }
    RESOLVED_FONT_PATH = fontPath
    let registerStrategy: 'registerBuffer' | null = null

    try {
      if (!FALLBACK_FONT_BUFFER) {
        FALLBACK_FONT_BUFFER = readFileSync(fontPath)
      }
      if (typeof globalFonts.register === 'function' && FALLBACK_FONT_BUFFER) {
        globalFonts.register(FALLBACK_FONT_BUFFER, DEFAULT_FONT_FAMILY, {
          style: 'normal',
          weight: '400'
        })
        registerStrategy = 'registerBuffer'
      } else if (typeof globalFonts.registerFromPath === 'function') {
        globalFonts.registerFromPath(fontPath, DEFAULT_FONT_FAMILY)
        registerStrategy = 'registerBuffer'
      }
    } catch (readError) {
      console.error('⚠️ Failed to register fallback font buffer:', readError)
    }

    const hasFamily = Boolean(globalFonts.has?.(DEFAULT_FONT_FAMILY))

    if (hasFamily) {
      REGISTERED_FONTS[DEFAULT_FONT_FAMILY] = true
      FONT_ALIAS_CACHE.add(DEFAULT_FONT_FAMILY)
      console.log('🆕 Registered fallback font for certificates:', fontPath)
    } else if (DEBUG_CERT) {
      console.warn('⚠️ Unable to confirm fallback font registration for certificates. Attempted path:', fontPath)
    }

    LAST_FONT_DEBUG = {
      fontReady: hasFamily,
      resolvedFontPath: fontPath,
      candidatePaths: [...FONT_CANDIDATE_STATUSES],
      aliasCache: Array.from(FONT_ALIAS_CACHE),
      registerStrategy,
      registeredFamilies: {
        ...(LAST_FONT_DEBUG.registeredFamilies || {}),
        [DEFAULT_FONT_FAMILY]: hasFamily
      }
    }

    return hasFamily
  } catch (error) {
    console.error('⚠️ Failed to register fallback font:', error)
    LAST_FONT_DEBUG = {
      fontReady: false,
      resolvedFontPath: fontPath,
      candidatePaths: [...FONT_CANDIDATE_STATUSES],
      aliasCache: Array.from(FONT_ALIAS_CACHE),
      registerStrategy: null,
      error: String(error),
      registeredFamilies: {
        ...(LAST_FONT_DEBUG.registeredFamilies || {}),
        [DEFAULT_FONT_FAMILY]: false
      }
    }
    return false
  }
}

function ensureFontAlias(globalFonts: CanvasGlobalFonts | undefined, alias: string): void {
  if (!globalFonts) {
    return
  }

  const normalizedAlias = alias.trim()
  if (!normalizedAlias) {
    return
  }

  const lower = normalizedAlias.toLowerCase()
  if (['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui'].includes(lower)) {
    FONT_ALIAS_CACHE.add(normalizedAlias)
    LAST_FONT_DEBUG = {
      ...LAST_FONT_DEBUG,
      aliasCache: Array.from(FONT_ALIAS_CACHE)
    }
    return
  }

  if (FONT_ALIAS_CACHE.has(normalizedAlias)) {
    return
  }

  if (globalFonts.has && globalFonts.has(normalizedAlias)) {
    FONT_ALIAS_CACHE.add(normalizedAlias)
    LAST_FONT_DEBUG = {
      ...LAST_FONT_DEBUG,
      aliasCache: Array.from(FONT_ALIAS_CACHE),
      registeredFamilies: {
        ...(LAST_FONT_DEBUG.registeredFamilies || {}),
        [normalizedAlias]: true
      }
    }
    return
  }

  if (!RESOLVED_FONT_PATH) {
    return
  }

  try {
    if (!FALLBACK_FONT_BUFFER && RESOLVED_FONT_PATH) {
      FALLBACK_FONT_BUFFER = readFileSync(RESOLVED_FONT_PATH)
    }
    if (FALLBACK_FONT_BUFFER && typeof globalFonts.register === 'function') {
      globalFonts.register(FALLBACK_FONT_BUFFER, normalizedAlias, {
        style: 'normal',
        weight: '400'
      })
    } else if (RESOLVED_FONT_PATH && typeof globalFonts.registerFromPath === 'function') {
      globalFonts.registerFromPath(RESOLVED_FONT_PATH, normalizedAlias)
    }
    FONT_ALIAS_CACHE.add(normalizedAlias)
    LAST_FONT_DEBUG = {
      ...LAST_FONT_DEBUG,
      fontReady: true,
      aliasCache: Array.from(FONT_ALIAS_CACHE),
      registeredFamilies: {
        ...(LAST_FONT_DEBUG.registeredFamilies || {}),
        [normalizedAlias]: globalFonts.has?.(normalizedAlias) ?? false
      }
    }
    if (DEBUG_CERT) {
      console.log('📚 Registered fallback font alias for certificates:', normalizedAlias)
    }
  } catch (error) {
    console.error(`⚠️ Failed to register fallback alias "${normalizedAlias}" for certificates:`, error)
  }
}

function ensureFontAliases(globalFonts: CanvasGlobalFonts | undefined, aliases: string[]): void {
  for (const alias of aliases) {
    ensureFontAlias(globalFonts, alias)
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
    const { createCanvas, loadImage, GlobalFonts } = await import('@napi-rs/canvas')
    const fontReady = ensureFontRegistered(GlobalFonts)
    if (DEBUG_CERT) {
      const available = GlobalFonts?.has ? GlobalFonts.has(DEFAULT_FONT_FAMILY) : undefined
      console.log('🅵 Certificate font readiness:', {
        fontReady,
        cached: REGISTERED_FONTS[DEFAULT_FONT_FAMILY] ?? false,
        available
      })
    }
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

      const resolvedFontStack = [DEFAULT_FONT_FAMILY]
      ensureFontAliases(GlobalFonts, resolvedFontStack)

      const debugEntry: Record<string, any> = {
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
          applied: DEFAULT_FONT_FAMILY,
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
      const fontSize = field.fontSize || 24
      const scaledFontSizeX = fontSize * scaleX
      const scaledFontSizeY = fontSize * scaleY
      const textAlign = (field.textAlign || 'left') as CanvasTextAlign
      const primaryFontFamily = DEFAULT_FONT_FAMILY
      const fontWeight = (field.fontWeight || 'normal').toLowerCase() === 'bold' ? 'bold' : 'normal'
      const fontFamilyStack = `${DEFAULT_FONT_FAMILY}, sans-serif`

      const fontString = `${fontWeight} ${scaledFontSizeX}px ${fontFamilyStack}`
      ctx.font = fontString
      ctx.fillStyle = field.color || '#000000'
      ctx.textAlign = textAlign
      ctx.textBaseline = 'top'

      const lines = wrapText(ctx, textToRender, scaledWidth)
      debugEntry.rendering = {
        scaleX,
        scaleY,
        scaledFontSizeX,
        scaledFontSizeY,
        computedLines: lines.length,
        fontString,
        fillStyle: ctx.fillStyle,
        appliedFontFamily: primaryFontFamily
      }
      debugEntry.font.appliedWeight = fontWeight

      const metrics = ctx.measureText(textToRender)
      debugEntry.metrics = {
        width: metrics.width,
        actualBoundingBoxAscent: metrics.actualBoundingBoxAscent,
        actualBoundingBoxDescent: metrics.actualBoundingBoxDescent,
        emHeightAscent: metrics.emHeightAscent,
        emHeightDescent: metrics.emHeightDescent
      }

      const lineHeight = scaledFontSizeY * 1.2
      const textBlockHeight = lineHeight * lines.length
      const fieldHeightPx = field.height ? field.height * scaleY : null
      const verticalOffset = fieldHeightPx ? Math.max((fieldHeightPx - textBlockHeight) / 2, 0) : 0
      debugEntry.rendering.verticalOffset = verticalOffset

      let textX = scaledX
      if (textAlign === 'center') {
        textX = scaledX + scaledWidth / 2
      } else if (textAlign === 'right') {
        textX = scaledX + scaledWidth
      }

      let currentY = scaledY + verticalOffset
      for (const line of lines) {
        ctx.fillText(line, textX, currentY)
        currentY += scaledFontSizeY * 1.2
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
  const mapToInter = (items: TemplateField[]): TemplateField[] =>
    items.map((item) => ({
      ...item,
      fontFamily: DEFAULT_FONT_FAMILY
    }))

  if (!fields) {
    return []
  }

  if (Array.isArray(fields)) {
    return mapToInter(fields as TemplateField[])
  }

  if (typeof fields === 'string') {
    try {
      const parsed = JSON.parse(fields)
      return Array.isArray(parsed) ? mapToInter(parsed as TemplateField[]) : []
    } catch (error) {
      console.error('❌ Failed to parse template fields JSON:', error)
      return []
    }
  }

  return []
}