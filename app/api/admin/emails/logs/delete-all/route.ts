import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { deleteAdminEmailImageFolder } from '@/lib/admin-email-images'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (!user || !['admin', 'meded_team'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 })
    }

    const { data: allLogs, error: fetchError } = await supabaseAdmin
      .from('admin_email_logs')
      .select('id')

    if (fetchError) {
      console.error('Failed to fetch logs before delete-all:', fetchError)
      return NextResponse.json({ error: 'Failed to clear logs' }, { status: 500 })
    }

    // If no logs exist, return success
    if (!allLogs || allLogs.length === 0) {
      return NextResponse.json({ success: true })
    }

    // Delete all records using the IDs we fetched
    const logIds = allLogs.map((log) => log.id).filter((id): id is string => Boolean(id))
    
    if (logIds.length === 0) {
      return NextResponse.json({ success: true })
    }

    const { error } = await supabaseAdmin
      .from('admin_email_logs')
      .delete()
      .in('id', logIds)

    if (error) {
      console.error('Failed to clear email logs:', error)
      return NextResponse.json({ error: 'Failed to clear logs' }, { status: 500 })
    }

    if (allLogs && allLogs.length > 0) {
      await Promise.all(allLogs.map((log) => deleteAdminEmailImageFolder(log.id)))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/admin/emails/logs/delete-all:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

