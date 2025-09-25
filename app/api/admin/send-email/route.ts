import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { mailerLiteService } from '@/lib/mailerlite'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, we'll allow any authenticated user to send emails
    // In production, you might want to check for admin role here
    
    const { to, subject, content, userName } = await request.json()

    if (!to || !subject || !content) {
      return NextResponse.json({ 
        error: 'Missing required fields: to, subject, content' 
      }, { status: 400 })
    }

    // Send email through MailerLite with user name
    const result = await mailerLiteService.sendEmail(to, subject, content, userName)

    if (result.error) {
      console.error('MailerLite error:', result.error)
      return NextResponse.json({ 
        error: `Failed to send email: ${result.error.message}` 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully',
      data: result.data
    })

  } catch (error) {
    console.error('Error in POST /api/admin/send-email:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
