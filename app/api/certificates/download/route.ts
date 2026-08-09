import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import {
  applyFileSecurityHeaders,
  canAccessCertificateStoragePath,
  withFileSecurityHeaders,
} from '@/lib/secure-file-access'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    }

    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')

    if (!filePath) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'File path is required' }, { status: 400 })
      )
    }

    const allowed = await canAccessCertificateStoragePath(session.user.email, filePath)
    if (!allowed) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      )
    }

    const { data: fileList, error: listError } = await supabaseAdmin.storage
      .from('certificates')
      .list(filePath.split('/').slice(0, -1).join('/'), {
        search: filePath.split('/').pop(),
      })

    if (listError || !fileList || fileList.length === 0) {
      console.error('File not found in storage:', filePath)
      return applyFileSecurityHeaders(
        NextResponse.json(
          {
            error: 'Certificate file not found',
            details: 'The certificate file does not exist in storage',
          },
          { status: 404 }
        )
      )
    }

    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('certificates')
      .createSignedUrl(filePath, 3600)

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError)
      return applyFileSecurityHeaders(
        NextResponse.json(
          {
            error: 'Failed to generate download URL',
            details: signedUrlError.message,
          },
          { status: 500 }
        )
      )
    }

    const fileResponse = await fetch(signedUrlData.signedUrl)

    if (!fileResponse.ok) {
      console.error('Error fetching file from signed URL:', fileResponse.statusText)
      return applyFileSecurityHeaders(
        NextResponse.json(
          {
            error: 'Failed to fetch certificate file',
            details: fileResponse.statusText,
          },
          { status: 500 }
        )
      )
    }

    const fileBuffer = await fileResponse.arrayBuffer()
    const filename = filePath.split('/').pop() || 'certificate.png'

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: withFileSecurityHeaders(undefined, {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.byteLength.toString(),
      }),
    })
  } catch (error) {
    console.error('Error in GET /api/certificates/download:', error)
    return applyFileSecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
