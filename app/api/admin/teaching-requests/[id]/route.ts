import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role from database
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has permission
    if (!['admin', 'ctf', 'educator', 'meded_team'].includes(userData.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    // Validate status
    if (!['pending', 'in-progress', 'completed', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update the request status
    const { data, error } = await supabase
      .from('teaching_requests')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating teaching request:', error)
      return NextResponse.json(
        { error: 'Failed to update request', details: error.message },
        { status: 500 }
      )
    }

    // Transform to camelCase
    const transformedRequest = {
      id: data.id,
      userEmail: data.user_email,
      userName: data.user_name,
      topic: data.topic,
      description: data.description,
      preferredDate: data.preferred_date,
      preferredTime: data.preferred_time,
      duration: data.duration,
      categories: data.categories,
      format: data.format,
      additionalInfo: data.additional_info,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }

    return NextResponse.json({ 
      success: true,
      request: transformedRequest
    })

  } catch (error) {
    console.error('Error in teaching request update API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

