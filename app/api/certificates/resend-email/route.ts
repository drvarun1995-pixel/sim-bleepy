import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import { sendCertificateEmail } from '@/lib/email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Get the session from NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const { certificateId }: { certificateId: string } = await request.json()
    
    if (!certificateId) {
      return NextResponse.json({ 
        error: 'Certificate ID is required' 
      }, { status: 400 })
    }

    console.log(`📧 Resending email for certificate: ${certificateId}`)

    // Check if all required email environment variables are present
    const requiredEmailVars = ['AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET', 'SMTP_USER', 'JWT_SECRET']
    const missingVars = requiredEmailVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required email environment variables:', missingVars)
      return NextResponse.json({ 
        error: 'Email configuration is incomplete',
        details: `Missing environment variables: ${missingVars.join(', ')}`,
        missingVars
      }, { status: 500 })
    }

    // Fetch the certificate
    const { data: certificate, error: fetchError } = await supabaseAdmin
      .from('certificates')
      .select(`
        *,
        users:user_id (
          name,
          email
        )
      `)
      .eq('id', certificateId)
      .single()

    if (fetchError || !certificate) {
      console.error('❌ Error fetching certificate:', fetchError)
      return NextResponse.json({ 
        error: 'Certificate not found' 
      }, { status: 404 })
    }

    // Extract certificate data safely
    const certData = certificate.certificate_data as any || {}
    
    // Validate required fields
    if (!certData.attendee_name || !certData.attendee_email) {
      console.error('❌ Missing attendee data:', {
        attendee_name: certData.attendee_name,
        attendee_email: certData.attendee_email
      })
      return NextResponse.json({ 
        error: 'Missing attendee name or email in certificate data' 
      }, { status: 400 })
    }

    // Generate secure download URL
    const downloadToken = jwt.sign(
      { 
        certificateId: certificate.id,
        userId: certificate.user_id,
        type: 'certificate_download'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    )
    
    const certificateUrl = `${process.env.NEXT_PUBLIC_APP_URL}/certificates/download/${downloadToken}`

    // Prepare email data
    const emailData = {
      recipientEmail: certificate.users?.email || certData.attendee_email,
      recipientName: certificate.users?.name || certData.attendee_name,
      eventTitle: certificate.events?.title || certData.event_title || 'Event',
      eventDate: certificate.events?.date ? new Date(certificate.events.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : certData.event_date || new Date().toLocaleDateString(),
      eventLocation: certificate.events?.locations?.name || certData.event_location,
      eventDuration: certData.event_duration,
      certificateUrl,
      certificateId: certificate.id,
    }

    console.log(`📤 Sending email to: ${emailData.recipientEmail}`)
    
    // Send the email
    await sendCertificateEmail(emailData)
    console.log('✅ Email sent successfully to:', emailData.recipientEmail)

    // Update database with email status
    console.log('📝 Updating certificate email status for:', certificate.id)
    const { error: updateError } = await supabaseAdmin
      .from('certificates')
      .update({
        email_sent_at: new Date().toISOString(),
        sent_via_email: true,
        email_error: null // Clear any previous error
      })
      .eq('id', certificate.id)

    if (updateError) {
      console.error('❌ Error updating certificate email status:', updateError)
      console.error('❌ Update error details:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      })
      return NextResponse.json({ 
        error: 'Email sent but failed to update database status',
        details: updateError.message
      }, { status: 500 })
    }

    console.log('✅ Certificate email status updated successfully')

    return NextResponse.json({ 
      success: true,
      message: 'Email sent successfully',
      recipientEmail: emailData.recipientEmail
    })

  } catch (error) {
    console.error('❌ Error resending email:', error)
    
    // Update database with error status
    const { certificateId } = await request.json().catch(() => ({}))
    if (certificateId) {
      await supabaseAdmin
        .from('certificates')
        .update({
          sent_via_email: false,
          email_error: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', certificateId)
    }

    return NextResponse.json({ 
      error: 'Failed to resend email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
