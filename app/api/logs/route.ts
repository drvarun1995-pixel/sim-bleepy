import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

// GET - Fetch system logs (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const level = searchParams.get('level') || null
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const startDate = searchParams.get('startDate') || null
    const endDate = searchParams.get('endDate') || null
    const apiRoute = searchParams.get('apiRoute') || null
    const search = searchParams.get('search') || null

    // Build query
    let query = supabaseAdmin
      .from('system_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (level) {
      query = query.eq('level', level)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    if (apiRoute) {
      query = query.ilike('api_route', `%${apiRoute}%`)
    }

    if (search) {
      query = query.or(`message.ilike.%${search}%,user_email.ilike.%${search}%`)
    }

    const { data: logs, error, count } = await query

    if (error) {
      console.error('Error fetching logs:', error)
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      limit,
      offset
    })

  } catch (error) {
    console.error('Error in GET /api/logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Clear old logs (admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse body for options
    const body = await request.json().catch(() => ({}))
    const daysToKeep = parseInt(body.daysToKeep || '30', 10)

    // Calculate cutoff date
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    // Delete logs older than cutoff date
    const { error: deleteError, count } = await supabaseAdmin
      .from('system_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select()

    if (deleteError) {
      console.error('Error deleting logs:', deleteError)
      return NextResponse.json({ error: 'Failed to delete logs' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deleted: count || 0,
      cutoffDate: cutoffDate.toISOString()
    })

  } catch (error) {
    console.error('Error in DELETE /api/logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

