import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { sendAdminTeachingRequestNotification } from '@/lib/email'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      topic,
      description,
      preferredDate,
      preferredTime,
      duration,
      categories,
      format,
      additionalInfo,
      userEmail,
      userName
    } = body

    // Validate required fields
    if (!topic || !description || !duration || !categories || categories.length === 0 || !format) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Save to Supabase database
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data, error } = await supabase
      .from('teaching_requests')
      .insert({
        user_email: userEmail,
        user_name: userName,
        topic: topic,
        description: description,
        preferred_date: preferredDate || null,
        preferred_time: preferredTime || null,
        duration: duration,
        categories: categories,
        format: format,
        additional_info: additionalInfo || null,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving teaching request:', error)
      return NextResponse.json(
        { error: 'Failed to save teaching request', details: error.message },
        { status: 500 }
      )
    }

    console.log('Teaching Request saved:', data)

    // Send email notification to admin (don't wait for it to complete)
    sendAdminTeachingRequestNotification({
      requestId: data.id,
      userName: userName || 'Unknown User',
      userEmail: userEmail || session.user.email || 'Unknown',
      topic: topic,
      description: description,
      preferredDate: preferredDate || undefined,
      preferredTime: preferredTime || undefined,
      duration: duration,
      categories: categories,
      format: format,
      additionalInfo: additionalInfo || undefined,
      submissionTime: data.created_at || new Date().toISOString()
    }).catch(error => {
      console.error('Failed to send admin notification email:', error)
      // Don't fail the request if email fails
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Teaching request submitted successfully' 
    })

  } catch (error) {
    console.error('Error processing teaching request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
