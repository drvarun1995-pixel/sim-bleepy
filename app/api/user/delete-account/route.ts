import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { deleteUserAndAllData } from '@/lib/delete-user-data'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = user.id

    // Audit trail before wipe (best-effort)
    try {
      await supabase.from('consent_audit_log').insert({
        user_id: userId,
        action: 'account_deletion_requested',
        new_values: JSON.stringify({
          deletion_requested_at: new Date().toISOString(),
          user_email: user.email,
        }),
        ip_address:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString(),
      })
    } catch (auditError) {
      console.error('Failed to log account deletion event:', auditError)
    }

    const result = await deleteUserAndAllData(supabase, userId, { email: user.email })

    if (!result.ok) {
      console.error('Account deletion failed:', result.error, result.steps)
      return NextResponse.json(
        { error: result.error || 'Failed to delete user account' },
        { status: 500 }
      )
    }

    console.log(
      `User account deleted: ${session.user.email} (ID: ${userId}) at ${new Date().toISOString()}`
    )

    return NextResponse.json({
      message: 'Account and all associated data have been permanently deleted',
      deleted_at: new Date().toISOString(),
      user_email: session.user.email,
    })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
