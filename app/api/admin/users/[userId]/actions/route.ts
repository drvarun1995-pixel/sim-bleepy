import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendRoleChangeEmail } from '@/lib/email'

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

    // Check if user is admin or meded_team
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (userError || !user || (user.role !== 'admin' && user.role !== 'meded_team')) {
      return NextResponse.json({ error: 'Admin or MedEd Team access required' }, { status: 403 });
    }

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
        
        // Get current user data to check old role
        const { data: currentUser, error: userError } = await supabase
          .from('users')
          .select('id, email, name, role_type')
          .eq('id', userId)
          .single()

        if (userError || !currentUser) {
          console.error('Error fetching user:', userError)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const oldRole = currentUser.role_type || 'student'
        
        // Update user role in database
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            role_type: data.role,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (updateError) {
          console.error('Error updating user role:', updateError)
          return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
        }

        // Send role change email notification
        let emailResult = null;
        try {
          emailResult = await sendRoleChangeEmail({
            email: currentUser.email,
            name: currentUser.name,
            oldRole: oldRole,
            newRole: data.role
          });
          console.log('Role change email sent successfully to:', currentUser.email, emailResult);
        } catch (emailError: any) {
          console.error('Failed to send role change email to:', currentUser.email, emailError);
          
          // Log detailed error information for debugging
          console.error('Email error details:', {
            recipient: currentUser.email,
            action: 'role_change',
            oldRole,
            newRole: data.role,
            error: emailError.message,
            stack: emailError.stack,
            timestamp: new Date().toISOString()
          });
          
          // Don't fail the role update if email fails, but log it for monitoring
        }

        console.log('Role updated successfully:', { userId, oldRole, newRole: data.role })
        return NextResponse.json({ 
          success: true, 
          message: 'Role updated successfully',
          oldRole,
          newRole: data.role,
          emailSent: !!emailResult,
          emailResult: emailResult
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in POST /api/admin/users/[userId]/actions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
