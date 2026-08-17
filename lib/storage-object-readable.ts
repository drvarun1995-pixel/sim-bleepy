/**
 * Supabase can list/info objects that are no longer in S3.
 * Signed GET then returns HTTP 400 with {"code":"NoSuchKey"}.
 */
export async function isSignedStorageObjectReadable(signedUrl: string): Promise<boolean> {
  const head = await fetch(signedUrl, { method: 'HEAD' })
  if (head.ok) return true
  if (head.status === 405 || head.status === 501) {
    const range = await fetch(signedUrl, { headers: { Range: 'bytes=0-0' } })
    return range.ok || range.status === 206
  }
  return false
}
