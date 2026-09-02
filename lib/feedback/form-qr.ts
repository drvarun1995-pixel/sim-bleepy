import QRCode from 'qrcode'
import { supabaseAdmin } from '@/utils/supabase'

export const FEEDBACK_QR_BUCKET = 'qr-codes'

type FeedbackFormQrRow = {
  id: string
  event_id?: string | null
  anonymous_enabled?: boolean | null
  qr_code_data?: string | null
  qr_code_image_url?: string | null
  qr_code_storage_path?: string | null
}

export type FeedbackFormQr = {
  formId: string
  formUrl: string
  imageUrl: string
  storagePath: string
}

function siteOrigin() {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://sim.bleepy.co.uk'
  ).replace(/\/$/, '')
}

export function buildFeedbackFormPublicUrl(
  formId: string,
  anonymousEnabled?: boolean | null
) {
  return anonymousEnabled
    ? `${siteOrigin()}/guest-feedback/${formId}`
    : `${siteOrigin()}/feedback/${formId}`
}

function storagePathFromPublicUrl(url: string | null | undefined) {
  if (!url) return null
  const marker = `/${FEEDBACK_QR_BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  const path = url.substring(idx + marker.length)
  return path || null
}

async function removeStoredQr(path: string | null | undefined) {
  if (!path) return
  try {
    await supabaseAdmin.storage.from(FEEDBACK_QR_BUCKET).remove([path])
  } catch (error) {
    console.error('Failed to remove feedback QR from storage:', error)
  }
}

export async function deleteFeedbackFormQr(form: FeedbackFormQrRow) {
  const path = form.qr_code_storage_path || storagePathFromPublicUrl(form.qr_code_image_url)
  await removeStoredQr(path)
}

export async function deleteFeedbackFormQrsForEvent(eventId: string) {
  const { data: forms } = await supabaseAdmin
    .from('feedback_forms')
    .select('id, qr_code_image_url, qr_code_storage_path')
    .eq('event_id', eventId)

  for (const form of forms || []) {
    await deleteFeedbackFormQr(form)
  }
}

export async function ensureFeedbackFormQr(
  form: FeedbackFormQrRow,
  eventTitle?: string | null
): Promise<FeedbackFormQr | null> {
  const formUrl = buildFeedbackFormPublicUrl(form.id, form.anonymous_enabled)
  const existingPath =
    form.qr_code_storage_path || storagePathFromPublicUrl(form.qr_code_image_url)

  if (
    form.qr_code_image_url &&
    form.qr_code_data === formUrl &&
    existingPath
  ) {
    return {
      formId: form.id,
      formUrl,
      imageUrl: form.qr_code_image_url,
      storagePath: existingPath,
    }
  }

  try {
    const qrBuffer = await QRCode.toBuffer(formUrl, {
      type: 'png',
      margin: 1,
      width: 512,
      color: { dark: '#000000', light: '#FFFFFF' },
    })

    const sanitizedTitle = (eventTitle || 'event')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .slice(0, 60) || 'event'
    const storagePath = `feedback/${sanitizedTitle}/feedback-qr-${form.id}.png`

    const { error: uploadError } = await supabaseAdmin.storage
      .from(FEEDBACK_QR_BUCKET)
      .upload(storagePath, qrBuffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error('Failed to upload feedback QR:', uploadError)
      return form.qr_code_image_url
        ? {
            formId: form.id,
            formUrl,
            imageUrl: form.qr_code_image_url,
            storagePath: existingPath || '',
          }
        : null
    }

    if (existingPath && existingPath !== storagePath) {
      await removeStoredQr(existingPath)
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(FEEDBACK_QR_BUCKET)
      .getPublicUrl(storagePath)

    const imageUrl = urlData.publicUrl
    const { error: updateError } = await supabaseAdmin
      .from('feedback_forms')
      .update({
        qr_code_data: formUrl,
        qr_code_image_url: imageUrl,
        qr_code_storage_path: storagePath,
      })
      .eq('id', form.id)

    if (updateError) {
      console.error('Failed to save feedback QR columns:', updateError)
    }

    return {
      formId: form.id,
      formUrl,
      imageUrl,
      storagePath,
    }
  } catch (error) {
    console.error('Error generating feedback QR:', error)
    return null
  }
}

export async function ensureFeedbackFormQrById(formId: string) {
  const { data: form } = await supabaseAdmin
    .from('feedback_forms')
    .select('id, event_id, anonymous_enabled, qr_code_data, qr_code_image_url, qr_code_storage_path')
    .eq('id', formId)
    .maybeSingle()

  if (!form) return null

  let eventTitle: string | null = null
  if (form.event_id) {
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('title')
      .eq('id', form.event_id)
      .maybeSingle()
    eventTitle = event?.title || null
  }

  return ensureFeedbackFormQr(form, eventTitle)
}
