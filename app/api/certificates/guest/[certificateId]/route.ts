import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import { verifyCertificateGuestToken } from '@/lib/certificate-guest-token'
import {
  applyFileSecurityHeaders,
  isSafeStoragePath,
  withFileSecurityHeaders,
} from '@/lib/secure-file-access'

export async function GET(
  request: NextRequest,
  { params }: { params: { certificateId: string } }
) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    const payload = verifyCertificateGuestToken(token)

    if (!payload || payload.certificateId !== params.certificateId) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Invalid or expired certificate link' }, { status: 403 })
      )
    }

    const { data: certificate, error } = await supabaseAdmin
      .from('certificates')
      .select('id, user_id, certificate_url, certificate_filename, certificate_data')
      .eq('id', params.certificateId)
      .single()

    if (error || !certificate) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
      )
    }

    if (certificate.user_id !== payload.userId) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Invalid certificate link' }, { status: 403 })
      )
    }

    const filePath = certificate.certificate_url
    if (!filePath || !isSafeStoragePath(filePath)) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Certificate file unavailable' }, { status: 404 })
      )
    }

    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('certificates')
      .createSignedUrl(filePath, 3600)

    if (signedUrlError || !signedUrlData?.signedUrl) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Failed to open certificate file' }, { status: 500 })
      )
    }

    const download = request.nextUrl.searchParams.get('download') === '1'
    const fileResponse = await fetch(signedUrlData.signedUrl)
    if (!fileResponse.ok) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Failed to fetch certificate file' }, { status: 500 })
      )
    }

    const fileBuffer = await fileResponse.arrayBuffer()
    const filename =
      certificate.certificate_filename ||
      filePath.split('/').pop() ||
      'certificate.png'

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: withFileSecurityHeaders(undefined, {
        'Content-Type': 'image/png',
        ...(download
          ? { 'Content-Disposition': `attachment; filename="${filename}"` }
          : { 'Content-Disposition': `inline; filename="${filename}"` }),
        'Content-Length': fileBuffer.byteLength.toString(),
      }),
    })
  } catch (error) {
    console.error('Error in GET /api/certificates/guest/[certificateId]:', error)
    return applyFileSecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
