import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// reCAPTCHA v3 verification
async function verifyRecaptcha(token: string): Promise<boolean> {
  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY
  
  if (!recaptchaSecret) {
    console.warn('RECAPTCHA_SECRET_KEY not found, skipping verification')
    return true // Allow in development
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${recaptchaSecret}&response=${token}`,
    })

    const data = await response.json()
    
    // reCAPTCHA v3 returns a score between 0.0 and 1.0
    // 0.0 is very likely a bot, 1.0 is very likely a human
    // We'll accept scores above 0.5
    return data.success && data.score >= 0.5
  } catch (error) {
    console.error('reCAPTCHA verification error:', error)
    return false
  }
}

interface ContactFormData {
  name: string
  email: string
  subject: string
  category: string
  message: string
  recaptchaToken?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json()
    const { name, email, subject, category, message, recaptchaToken } = body

    // Validate required fields
    if (!name || !email || !subject || !category || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate message length
    if (message.length < 10) {
      return NextResponse.json(
        { error: 'Message must be at least 10 characters long' },
        { status: 400 }
      )
    }

    // Verify reCAPTCHA if token is provided
    if (recaptchaToken) {
      const isRecaptchaValid = await verifyRecaptcha(recaptchaToken)
      if (!isRecaptchaValid) {
        return NextResponse.json(
          { error: 'reCAPTCHA verification failed. Please try again.' },
          { status: 400 }
        )
      }
    }

    // Insert contact message into database
    const { data, error } = await supabase
      .from('contact_messages')
      .insert([
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          subject: subject.trim(),
          category,
          message: message.trim(),
          status: 'new',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save message. Please try again.' },
        { status: 500 }
      )
    }

    console.log('Contact message saved successfully:', data[0])

    return NextResponse.json(
      { 
        success: true, 
        message: 'Message sent successfully',
        id: data[0].id
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}

// Optional: Add a GET endpoint to check if the API is working
export async function GET() {
  return NextResponse.json(
    { 
      message: 'Contact API is working',
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  )
}
