import { supabaseAdmin } from '@/utils/supabase'

export async function deleteEventRecord(eventId: string): Promise<{ error?: string }> {
  let feedbackForms: any[] = []
  try {
    const { data, error } = await supabaseAdmin
      .from('feedback_forms')
      .select('id, form_name, qr_code_image_url, qr_code_storage_path')
      .eq('event_id', eventId)
    if (!error) feedbackForms = data || []
  } catch {
    feedbackForms = []
  }

  if (feedbackForms.length > 0) {
    const { deleteFeedbackFormQr } = await import('@/lib/feedback/form-qr')
    for (const form of feedbackForms) {
      await deleteFeedbackFormQr(form)
      await supabaseAdmin.from('feedback_responses').delete().eq('feedback_form_id', form.id)
    }
    const { error: formsDeleteError } = await supabaseAdmin
      .from('feedback_forms')
      .delete()
      .eq('event_id', eventId)
    if (formsDeleteError) {
      return { error: 'Failed to delete feedback forms' }
    }
  }

  const { data: certificates } = await supabaseAdmin
    .from('certificates')
    .select('id, certificate_filename')
    .eq('event_id', eventId)

  if (certificates?.length) {
    for (const cert of certificates) {
      if (cert.certificate_filename) {
        await supabaseAdmin.storage.from('certificates').remove([cert.certificate_filename])
      }
    }
    await supabaseAdmin.from('certificates').delete().eq('event_id', eventId)
  }

  const { data: qrCodes } = await supabaseAdmin
    .from('event_qr_codes')
    .select('id, qr_code_image_url')
    .eq('event_id', eventId)

  if (qrCodes?.length) {
    const paths: string[] = []
    for (const qrCode of qrCodes) {
      const url: string | null = qrCode.qr_code_image_url
      if (!url) continue
      const idx = url.indexOf('/qr-codes/')
      if (idx !== -1) {
        const path = url.substring(idx + '/qr-codes/'.length)
        if (path) paths.push(path)
      }
    }
    if (paths.length > 0) {
      await supabaseAdmin.storage.from('qr-codes').remove(paths)
    }
    await supabaseAdmin.from('event_qr_codes').delete().eq('event_id', eventId)
  }

  try {
    await supabaseAdmin.from('cron_tasks').delete().eq('event_id', eventId)
  } catch {
    // optional table
  }

  const { error } = await supabaseAdmin.from('events').delete().eq('id', eventId)
  if (error) return { error: error.message }
  return {}
}
