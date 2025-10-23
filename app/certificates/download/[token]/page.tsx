import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/utils/supabase'

interface PageProps {
  params: {
    token: string
  }
}

export default async function CertificateDownloadPage({ params }: PageProps) {
  try {
    const token = params.token

    if (!token) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Link</h1>
            <p className="text-gray-600">The download link is invalid or missing.</p>
          </div>
        </div>
      )
    }

    // Verify JWT token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!)
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError)
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid or Expired Link</h1>
            <p className="text-gray-600">This download link is invalid or has expired.</p>
            <p className="text-sm text-gray-500 mt-2">Please contact the event organizer for a new link.</p>
          </div>
        </div>
      )
    }

    // Validate token structure
    if (!decoded.certificateId || !decoded.userId || decoded.type !== 'certificate_download') {
      console.error('❌ Invalid token structure:', decoded)
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Link</h1>
            <p className="text-gray-600">The download link is malformed.</p>
          </div>
        </div>
      )
    }

    console.log('🔍 Verifying certificate access for:', decoded.certificateId)

    // Fetch certificate from database
    const { data: certificate, error: certError } = await supabaseAdmin
      .from('certificates')
      .select('*')
      .eq('id', decoded.certificateId)
      .single()

    if (certError || !certificate) {
      console.error('❌ Certificate not found:', certError)
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Certificate Not Found</h1>
            <p className="text-gray-600">The requested certificate could not be found.</p>
          </div>
        </div>
      )
    }

    // Verify certificate belongs to the user
    if (certificate.user_id !== decoded.userId) {
      console.error('❌ Unauthorized access attempt:', {
        certificateUserId: certificate.user_id,
        tokenUserId: decoded.userId
      })
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
            <p className="text-gray-600">You are not authorized to access this certificate.</p>
          </div>
        </div>
      )
    }

    console.log('✅ Certificate access verified, generating download URL')

    // Generate signed URL for the certificate file
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('certificates')
      .createSignedUrl(certificate.certificate_url, 3600) // Valid for 1 hour

    if (signedUrlError || !signedUrlData) {
      console.error('❌ Error generating signed URL:', signedUrlError)
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Download Error</h1>
            <p className="text-gray-600">Unable to generate download link. Please try again later.</p>
          </div>
        </div>
      )
    }

    console.log('✅ Signed URL generated, redirecting to download')

    // Redirect to the signed URL for download
    redirect(signedUrlData.signedUrl)

  } catch (error) {
    console.error('❌ Error in certificate download page:', error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Download Error</h1>
          <p className="text-gray-600">An error occurred while processing your download request.</p>
          <p className="text-sm text-gray-500 mt-2">Please try again or contact support if the problem persists.</p>
        </div>
      </div>
    )
  }
}
