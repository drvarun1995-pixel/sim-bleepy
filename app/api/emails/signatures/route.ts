import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { canSendAdminEmails } from '@/lib/roles'

export const dynamic = 'force-dynamic'

// GET - Fetch user's signature
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check permissions
    if (!canSendAdminEmails(user.role)) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 })
    }

    // Fetch signature
    const { data: signature, error } = await supabaseAdmin
      .from('email_signatures')
      .select('id, content_html, created_at, updated_at')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching signature:', error)
      return NextResponse.json({ error: 'Failed to fetch signature' }, { status: 500 })
    }

    return NextResponse.json({
      signature: signature || null,
    })
  } catch (error) {
    console.error('Error in GET /api/emails/signatures:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST/PUT - Create or update signature
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check permissions
    if (!canSendAdminEmails(user.role)) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 })
    }

    const { content_html } = await request.json()

    if (!content_html || typeof content_html !== 'string') {
      return NextResponse.json({ error: 'content_html is required' }, { status: 400 })
    }

    // Check if signature exists
    const { data: existing } = await supabaseAdmin
      .from('email_signatures')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let result
    if (existing) {
      // Update existing signature
      const { data, error } = await supabaseAdmin
        .from('email_signatures')
        .update({
          content_html,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating signature:', error)
        return NextResponse.json({ error: 'Failed to update signature' }, { status: 500 })
      }

      result = data
    } else {
      // Create new signature
      const { data, error } = await supabaseAdmin
        .from('email_signatures')
        .insert({
          user_id: user.id,
          content_html,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating signature:', error)
        return NextResponse.json({ error: 'Failed to create signature' }, { status: 500 })
      }

      result = data
    }

    return NextResponse.json({
      success: true,
      signature: result,
    })
  } catch (error) {
    console.error('Error in POST /api/emails/signatures:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete signature
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check permissions
    if (!canSendAdminEmails(user.role)) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 })
    }

    // Delete signature
    const { error } = await supabaseAdmin
      .from('email_signatures')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting signature:', error)
      return NextResponse.json({ error: 'Failed to delete signature' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/emails/signatures:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

