import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing auto-certificate generation...')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accessToken = (session.user as { accessToken?: string })?.accessToken

    // Get all events with auto-certificate enabled
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('events')
      .select(`
        id, title, auto_generate_certificate, certificate_template_id,
        event_bookings (
          id, user_id, status, checked_in, feedback_completed,
          users (id, name, email)
        )
      `)
      .eq('auto_generate_certificate', true)
      .not('certificate_template_id', 'is', null)

    if (eventsError) {
      console.error('Error fetching events:', eventsError)
      return NextResponse.json({ 
        error: 'Failed to fetch events',
        details: eventsError.message 
      }, { status: 500 })
    }

    console.log('📊 Found events with auto-certificate enabled:', events.length)

    // Get all certificates
    const { data: certificates, error: certError } = await supabaseAdmin
      .from('certificates')
      .select('id, event_id, user_id, generated_at, certificate_url, certificate_filename')

    if (certError) {
      console.error('Error fetching certificates:', certError)
      return NextResponse.json({ 
        error: 'Failed to fetch certificates',
        details: certError.message 
      }, { status: 500 })
    }

    console.log('📜 Found existing certificates:', certificates.length)

    // Test auto-generate route
    let testResult = null
    if (events.length > 0 && events[0].event_bookings && events[0].event_bookings.length > 0) {
      const event = events[0]
      const booking = event.event_bookings[0]
      
      console.log('🧪 Testing auto-generate for event:', event.id, 'user:', booking.user_id)
      
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        }

        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`
        }

        const testResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/certificates/auto-generate`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            eventId: event.id,
            userId: booking.user_id,
            bookingId: booking.id,
            templateId: event.certificate_template_id,
            sendEmail: false // Don't send email for test
          })
        })

        const testData = await testResponse.json()
        testResult = {
          status: testResponse.status,
          ok: testResponse.ok,
          data: testData
        }
        
        console.log('🧪 Test result:', testResult)
      } catch (testError) {
        console.error('🧪 Test error:', testError)
        testResult = {
          error: testError instanceof Error ? testError.message : String(testError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        eventsWithAutoCert: events.length,
        existingCertificates: certificates.length,
        testResult: testResult
      },
      events: events.map(event => ({
        id: event.id,
        title: event.title,
        templateId: event.certificate_template_id,
        bookingsCount: event.event_bookings?.length || 0
      })),
      certificates: certificates.map(cert => ({
        id: cert.id,
        eventId: cert.event_id,
        userId: cert.user_id,
        generatedAt: cert.generated_at,
        hasUrl: !!cert.certificate_url,
        hasFilename: !!cert.certificate_filename
      }))
    })

  } catch (error) {
    console.error('Error in test auto-generate:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
