import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { sendCertificateEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userRole = user.role
    if (!['admin', 'meded_team', 'ctf'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { certificateId } = body

    if (!certificateId) {
      return NextResponse.json({ 
        error: 'Missing required field: certificateId' 
      }, { status: 400 })
    }

    // Get certificate details
    const { data: certificate, error: certError } = await supabaseAdmin
      .from('certificates')
      .select(`
        id, certificate_data, certificate_url, users(name, email),
        events(title, date, locations(name))
      `)
      .eq('id', certificateId)
      .single()

    if (certError || !certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    // Check if user has permission to resend this certificate
    if (userRole !== 'admin' && (certificate as any).generated_by !== session.user.id) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    if (!(certificate.users as any)?.email) {
      return NextResponse.json({ error: 'No email address found for certificate recipient' }, { status: 400 })
    }

    try {
      // Send the certificate email
      await sendCertificateEmail({
        recipientEmail: (certificate.users as any).email,
        recipientName: (certificate.users as any).name || 'Participant',
        eventTitle: certificate.certificate_data.event_title || (certificate.events as any)?.[0]?.title || 'Event',
        eventDate: certificate.certificate_data.event_date || new Date((certificate.events as any)?.[0]?.date || '').toLocaleDateString('en-GB'),
        eventLocation: certificate.certificate_data.event_location || (certificate.events as any)?.[0]?.locations?.[0]?.name,
        eventDuration: certificate.certificate_data.event_time_notes,
        certificateUrl: certificate.certificate_url,
        certificateId: certificate.certificate_data.certificate_id || certificate.id
      })

      // Update certificate as sent
      const { error: updateError } = await supabaseAdmin
        .from('certificates')
        .update({
          sent_via_email: true,
          email_sent_at: new Date().toISOString()
        })
        .eq('id', certificateId)

      if (updateError) {
        console.error('Failed to update certificate email status:', updateError)
        // Don't fail the request if the update fails
      }

      return NextResponse.json({
        message: 'Certificate email sent successfully',
        recipientEmail: (certificate.users as any).email
      })

    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      return NextResponse.json({
        error: 'Failed to send certificate email',
        details: emailError instanceof Error ? emailError.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Certificate email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}




