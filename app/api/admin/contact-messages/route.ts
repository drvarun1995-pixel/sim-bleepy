import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canViewContactMessages } from '@/lib/roles'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Fetch all contact messages
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user || !canViewContactMessages(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin, MedEd Team, or CTF access required' },
        { status: 403 }
      )
    }

    // Fetch contact messages
    const { data: messages, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch contact messages' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true,
        messages: messages || []
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact messages API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update contact message status or add admin notes
export async function PATCH(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user || !canViewContactMessages(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin, MedEd Team, or CTF access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, status, admin_notes } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      )
    }

    // Validate status if provided
    const validStatuses = ['new', 'read', 'replied', 'archived']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) {
      updateData.status = status
      
      // Set replied_at if status is being changed to 'replied'
      if (status === 'replied') {
        updateData.replied_at = new Date().toISOString()
      }
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes
    }

    // Update the contact message
    const { data, error } = await supabase
      .from('contact_messages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update contact message' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'Contact message updated successfully',
        data
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact messages update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a contact message
export async function DELETE(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user || !canViewContactMessages(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin, MedEd Team, or CTF access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      )
    }

    // Delete the contact message
    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete contact message' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'Contact message deleted successfully'
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact messages delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}