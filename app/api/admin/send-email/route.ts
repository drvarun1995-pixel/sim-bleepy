import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendCustomHtmlEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, we'll allow any authenticated user to send emails
    // In production, you might want to check for admin role here
    
    const { to, subject, content } = await request.json()

    if (!to || !subject || !content) {
      return NextResponse.json({ 
        error: 'Missing required fields: to, subject, content' 
      }, { status: 400 })
    }

    // Send email through MailerLite with user name
    await sendCustomHtmlEmail(to, subject, content)

    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully',
      data: { recipient: to }
    })

  } catch (error) {
    console.error('Error in POST /api/admin/send-email:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
