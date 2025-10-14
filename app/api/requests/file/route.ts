import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

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
      fileName,
      description,
      preferredFormat,
      additionalInfo,
      eventId,
      eventTitle,
      eventDate,
      userEmail,
      userName
    } = body

    // Validate required fields
    if (!fileName || !description || !eventId || !eventTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Save to Supabase database
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data, error } = await supabase
      .from('file_requests')
      .insert({
        user_email: userEmail,
        user_name: userName,
        file_name: fileName,
        description: description,
        additional_info: additionalInfo || null,
        event_id: eventId,
        event_title: eventTitle,
        event_date: eventDate || null,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving file request:', error)
      return NextResponse.json(
        { error: 'Failed to save file request' },
        { status: 500 }
      )
    }

    console.log('File Request saved:', data)

    return NextResponse.json({ 
      success: true, 
      message: 'File request submitted successfully' 
    })

  } catch (error) {
    console.error('Error processing file request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
