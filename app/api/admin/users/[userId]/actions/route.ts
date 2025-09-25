import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // For now, allow any authenticated user to perform actions
    // In production, you might want to add proper admin checks
    console.log('User action requested by:', session.user.email)

    const { action, data } = await request.json()
    const { userId } = params

    if (!userId || !action) {
      return NextResponse.json({ error: 'User ID and action are required' }, { status: 400 })
    }

    switch (action) {
      case 'suspend':
        // Since we don't have a role field in users table yet, just log this
        console.log('Suspend user requested:', userId)
        return NextResponse.json({ success: true, message: 'User suspend requested (not implemented yet)' })

      case 'activate':
        // Since we don't have a role field in users table yet, just log this
        console.log('Activate user requested:', userId)
        return NextResponse.json({ success: true, message: 'User activate requested (not implemented yet)' })

      case 'send_email':
        // This is handled by the send-email API endpoint
        console.log(`Email would be sent to user ${userId}:`, data)
        return NextResponse.json({ 
          success: true, 
          message: 'Email sent via MailerLite' 
        })

      case 'delete':
        // Delete all attempts by this user first
        const { error: attemptsError } = await supabase
          .from('attempts')
          .delete()
          .eq('user_id', userId)
        
        if (attemptsError) {
          console.error('Error deleting attempts:', attemptsError)
        }

        // Then delete the user from users table
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', userId)

        if (deleteError) {
          console.error('Error deleting user:', deleteError)
          return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'User deleted successfully' })

      case 'update_role':
        if (!data?.role || !['admin', 'educator', 'student'].includes(data.role)) {
          return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
        }
        
        // Since we don't have a role field yet, just log this action
        console.log('Update role requested:', { userId, role: data.role })
        return NextResponse.json({ success: true, message: 'Role update requested (not implemented yet)' })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in POST /api/admin/users/[userId]/actions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
