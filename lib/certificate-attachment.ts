import { supabaseAdmin } from '@/utils/supabase'
import { isSafeStoragePath } from '@/lib/secure-file-access'

export type CertificateEmailAttachment = {
  name: string
  contentType: string
  contentBytes: string
}

/** Load a certificate PNG from storage for Graph API email attachment */
export async function loadCertificateEmailAttachment(
  storagePath: string | null | undefined,
  preferredFilename?: string | null
): Promise<CertificateEmailAttachment | null> {
  if (!storagePath || storagePath.startsWith('http') || !isSafeStoragePath(storagePath)) {
    return null
  }

  const { data, error } = await supabaseAdmin.storage
    .from('certificates')
    .download(storagePath)

  if (error || !data) {
    console.error('Failed to download certificate for email attachment:', error)
    return null
  }

  const buffer = Buffer.from(await data.arrayBuffer())
  const filename =
    preferredFilename ||
    storagePath.split('/').pop() ||
    'certificate.png'

  return {
    name: filename.endsWith('.png') ? filename : `${filename}.png`,
    contentType: 'image/png',
    contentBytes: buffer.toString('base64'),
  }
}
