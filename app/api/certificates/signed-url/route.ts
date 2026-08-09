import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import {
  applyFileSecurityHeaders,
  canAccessCertificateStoragePath,
} from '@/lib/secure-file-access'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    }

    const { imagePath } = await request.json()

    if (!imagePath || typeof imagePath !== 'string') {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Image path is required' }, { status: 400 })
      )
    }

    const allowed = await canAccessCertificateStoragePath(session.user.email, imagePath)
    if (!allowed) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('certificates')
      .createSignedUrl(imagePath, 3600)

    if (signedUrlError) {
      console.error('Error generating signed URL:', signedUrlError)
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 })
      )
    }

    return applyFileSecurityHeaders(
      NextResponse.json({
        success: true,
        signedUrl: signedUrlData?.signedUrl,
      })
    )
  } catch (error) {
    console.error('Error in POST /api/certificates/signed-url:', error)
    return applyFileSecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
