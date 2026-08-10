import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { sendCertificateEmail } from '@/lib/email'
import { resolveCertificateEmailAccess } from '@/lib/certificate-guest-token'
import jwt from 'jsonwebtoken'

interface SendEmailsRequest {
  certificateIds: string[]
}

interface EmailResult {
  certificateId: string
  status: 'sent' | 'failed'
  error?: string
  emailId?: string
}

export async function POST(request: NextRequest) {
  try {
    // Get the session from NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const { certificateIds }: SendEmailsRequest = await request.json()
    
    if (!certificateIds || !Array.isArray(certificateIds) || certificateIds.length === 0) {
      return NextResponse.json({ 
        error: 'Certificate IDs are required' 
      }, { status: 400 })
    }

    console.log(`📧 Sending certificate emails for ${certificateIds.length} certificates`)
    console.log('🔍 Certificate IDs:', certificateIds)
    console.log('🔍 Certificate IDs type:', typeof certificateIds[0])
    console.log('🔍 Certificate IDs length:', certificateIds.length)
    console.log('🔍 JWT Secret available:', !!process.env.JWT_SECRET)
    console.log('🔍 App URL:', process.env.NEXT_PUBLIC_APP_URL)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    
    // Check email environment variables
    console.log('🔍 Email Environment Variables:')
    console.log('  - AZURE_TENANT_ID:', !!process.env.AZURE_TENANT_ID)
    console.log('  - AZURE_CLIENT_ID:', !!process.env.AZURE_CLIENT_ID)
    console.log('  - AZURE_CLIENT_SECRET:', !!process.env.AZURE_CLIENT_SECRET)
    console.log('  - SMTP_USER:', !!process.env.SMTP_USER)
    
    // Check if all required email environment variables are present
    const requiredEmailVars = ['AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET', 'SMTP_USER']
    const missingVars = requiredEmailVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required email environment variables:', missingVars)
      return NextResponse.json({ 
        error: 'Email configuration is incomplete',
        details: `Missing environment variables: ${missingVars.join(', ')}`,
        missingVars
      }, { status: 500 })
    }

    // Fetch certificates from database
    const { data: certificates, error: fetchError } = await supabaseAdmin
      .from('certificates')
      .select(`
        *,
        users:user_id ( id, name, email, account_origin ),
        event_bookings:booking_id ( registration_source )
      `)
      .in('id', certificateIds)

    if (fetchError) {
      console.error('❌ Error fetching certificates:', fetchError)
      return NextResponse.json({ 
        error: 'Failed to fetch certificates',
        details: fetchError.message 
      }, { status: 500 })
    }

    if (!certificates || certificates.length === 0) {
      console.log('❌ No certificates found in database')
      console.log('🔍 Searched for certificate IDs:', certificateIds)
      console.log('🔍 Database query result:', certificates)
      return NextResponse.json({ 
        error: 'No certificates found' 
      }, { status: 404 })
    }

    console.log(`✅ Found ${certificates.length} certificates to email`)
    
    // Debug: Log the first certificate structure
    if (certificates.length > 0) {
      console.log('🔍 First certificate structure:', {
        id: certificates[0].id,
        certificate_data: certificates[0].certificate_data,
        user_id: certificates[0].user_id
      })
    }

    // Generate secure download URLs and send emails
    const results: EmailResult[] = []
    
    for (const certificate of certificates) {
      try {
        // Extract certificate data safely
        const certData = certificate.certificate_data as any || {}
        
        // Validate required fields
        if (!certData.attendee_name || !certData.attendee_email) {
          console.error(`❌ Missing attendee data for certificate ${certificate.id}:`, {
            attendee_name: certData.attendee_name,
            attendee_email: certData.attendee_email,
            certificate_data: certificate.certificate_data
          })
          results.push({
            certificateId: certificate.id,
            status: 'failed',
            error: 'Missing attendee name or email'
          })
          continue
        }

        const bookingRel = (certificate as any).event_bookings
        const registrationSource = Array.isArray(bookingRel)
          ? bookingRel[0]?.registration_source
          : bookingRel?.registration_source
        const access = resolveCertificateEmailAccess({
          certificateId: certificate.id,
          userId: certificate.user_id,
          accountOrigin: (certificate as any).users?.account_origin,
          registrationSource,
          baseUrl,
        })

        // Prepare email data using existing interface
        const emailData = {
          recipientName: certData.attendee_name,
          recipientEmail: certData.attendee_email,
          eventTitle: certData.event_title || 'Event',
          eventDate: certData.event_date || new Date().toLocaleDateString(),
          eventLocation: certData.event_location,
          eventDuration: certData.event_duration,
          certificateUrl: access.viewUrl,
          certificateId: certData.certificate_id || certificate.id,
          isGuestAccess: access.isGuestAccess,
          certificateStoragePath: certificate.certificate_url,
          certificateFilename:
            certificate.certificate_filename ||
            certificate.certificate_url?.split('/').pop() ||
            'certificate.png',
        }

        console.log(`📤 Sending email to: ${emailData.recipientEmail}`)

        // Send email using existing email system
        console.log('📤 Attempting to send email to:', emailData.recipientEmail)
        await sendCertificateEmail(emailData)
        console.log('✅ Email sent successfully to:', emailData.recipientEmail)

        // Update database with email status
        const { error: updateError } = await supabaseAdmin
          .from('certificates')
          .update({
            email_sent_at: new Date().toISOString(),
            sent_via_email: true,
            email_error_message: null
          })
          .eq('id', certificate.id)

        if (updateError) {
          console.error('❌ Error updating email status:', updateError)
        }

        results.push({
          certificateId: certificate.id,
          status: 'sent',
          emailId: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        })

        console.log(`✅ Email sent successfully for certificate ${certificate.id}`)

      } catch (error) {
        console.error(`❌ Error sending email for certificate ${certificate.id}:`, error)
        console.error('❌ Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          certificateId: certificate.id,
          recipientEmail: certificate.certificate_data?.attendee_email || 'Unknown'
        })
        
        // Update database with error status
        await supabaseAdmin
          .from('certificates')
          .update({
            sent_via_email: false,
            email_error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', certificate.id)

        results.push({
          certificateId: certificate.id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Calculate summary
    const sentCount = results.filter(r => r.status === 'sent').length
    const failedCount = results.filter(r => r.status === 'failed').length

    console.log(`📊 Email sending complete: ${sentCount} sent, ${failedCount} failed`)

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        sent: sentCount,
        failed: failedCount
      },
      results
    })

  } catch (error) {
    console.error('❌ Error in send-emails API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
