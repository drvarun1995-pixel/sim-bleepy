import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

const escapeIlike = (value: string) => value.replace(/[%_]/g, (match) => `\\${match}`)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (!user || !['admin', 'meded_team'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const offset = (page - 1) * limit
    const scopeFilter = searchParams.get('scope') || 'all'
    const senderFilter = searchParams.get('sender') || ''
    const statusFilter = searchParams.get('status') || 'all'
    const searchTerm = searchParams.get('search')?.trim() || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = supabaseAdmin
      .from('admin_email_logs')
      .select('*', { count: 'exact' })

    if (scopeFilter && scopeFilter !== 'all') {
      query = query.eq('recipient_scope', scopeFilter)
    }

    if (senderFilter) {
      query = query.eq('sender_email', senderFilter)
    }

    if (statusFilter === 'success') {
      query = query.or('failed_count.is.null,failed_count.eq.0')
    } else if (statusFilter === 'failed') {
      query = query.gt('failed_count', 0)
    }

    if (startDate) {
      query = query.gte('created_at', new Date(startDate).toISOString())
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      query = query.lte('created_at', end.toISOString())
    }

    if (searchTerm) {
      const escaped = escapeIlike(searchTerm)
      const conditions = [
        `subject.ilike.%${escaped}%`,
        `body_html.ilike.%${escaped}%`,
        `sender_email.ilike.%${escaped}%`,
        `sender_name.ilike.%${escaped}%`,
      ]
      query = query.or(conditions.join(','), { foreignTable: undefined })
    }

    const { data: logs, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Failed to fetch admin email logs:', error)
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }

    const { data: senderRows } = await supabaseAdmin
      .from('admin_email_logs')
      .select('sender_email,sender_name')
      .not('sender_email', 'is', null)

    const senders = Array.from(
      new Map(
        (senderRows || [])
          .filter((row) => row.sender_email)
          .map((row) => [row.sender_email, { email: row.sender_email, name: row.sender_name }])
      ).values()
    )

    return NextResponse.json({
      logs: logs || [],
      senders,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 1,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/admin/emails/logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

