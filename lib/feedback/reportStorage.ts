import { supabaseAdmin } from '@/utils/supabase'

export const FEEDBACK_REPORTS_BUCKET = 'feedback-reports'

export type StoredFeedbackReport = {
  id: string
  formId: string
  storagePath: string
  fileName: string
  fileSize: number | null
  createdAt: string
}

export async function ensureFeedbackReportsBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  if (buckets?.some((bucket) => bucket.id === FEEDBACK_REPORTS_BUCKET)) {
    return
  }

  const { error } = await supabaseAdmin.storage.createBucket(FEEDBACK_REPORTS_BUCKET, {
    public: false,
    fileSizeLimit: 10_485_760
  })

  if (error && !/already exists/i.test(error.message)) {
    throw error
  }
}

export async function saveFeedbackReportPdf(opts: {
  formId: string
  eventId?: string | null
  filename: string
  bytes: Uint8Array
  createdBy?: string | null
}): Promise<StoredFeedbackReport | null> {
  await ensureFeedbackReportsBucket()

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const storagePath = `forms/${opts.formId}/${stamp}-${opts.filename}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from(FEEDBACK_REPORTS_BUCKET)
    .upload(storagePath, Buffer.from(opts.bytes), {
      contentType: 'application/pdf',
      upsert: false
    })

  if (uploadError) {
    console.error('Failed to upload advanced feedback report:', uploadError)
    return null
  }

  const { data, error } = await supabaseAdmin
    .from('feedback_advanced_reports')
    .insert({
      form_id: opts.formId,
      event_id: opts.eventId || null,
      storage_path: storagePath,
      file_name: opts.filename,
      file_size: opts.bytes.length,
      created_by: opts.createdBy || null
    })
    .select('id, form_id, storage_path, file_name, file_size, created_at')
    .single()

  if (error || !data) {
    console.error('Failed to record advanced feedback report:', error)
    return {
      id: '',
      formId: opts.formId,
      storagePath,
      fileName: opts.filename,
      fileSize: opts.bytes.length,
      createdAt: new Date().toISOString()
    }
  }

  return {
    id: data.id,
    formId: data.form_id,
    storagePath: data.storage_path,
    fileName: data.file_name,
    fileSize: data.file_size,
    createdAt: data.created_at
  }
}

export async function listFeedbackReports(formId: string): Promise<StoredFeedbackReport[]> {
  const { data, error } = await supabaseAdmin
    .from('feedback_advanced_reports')
    .select('id, form_id, storage_path, file_name, file_size, created_at')
    .eq('form_id', formId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Failed to list advanced feedback reports:', error)
    return []
  }

  return (data || []).map((row) => ({
    id: row.id,
    formId: row.form_id,
    storagePath: row.storage_path,
    fileName: row.file_name,
    fileSize: row.file_size,
    createdAt: row.created_at
  }))
}

export async function downloadFeedbackReport(formId: string, reportId: string): Promise<{
  bytes: Uint8Array
  fileName: string
} | null> {
  const { data, error } = await supabaseAdmin
    .from('feedback_advanced_reports')
    .select('storage_path, file_name, form_id')
    .eq('id', reportId)
    .eq('form_id', formId)
    .single()

  if (error || !data) return null

  const { data: file, error: downloadError } = await supabaseAdmin.storage
    .from(FEEDBACK_REPORTS_BUCKET)
    .download(data.storage_path)

  if (downloadError || !file) {
    console.error('Failed to download advanced feedback report:', downloadError)
    return null
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  return { bytes, fileName: data.file_name }
}
