import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { sendAccountApprovalEmail } from '@/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Approve user (bypass email verification)
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/admin/users/approve - Approving user');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('POST /api/admin/users/approve - Unauthorized: No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
    const isAdmin = adminEmails.includes(session.user.email.trim());
    
    if (!isAdmin) {
      console.log('POST /api/admin/users/approve - Admin access required');
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    // Update user to verified
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        email_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, email, name, email_verified, role_type')
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json({ error: 'Failed to approve user' }, { status: 500 });
    }

    // Delete any pending verification tokens for this user
    const { error: tokenDeleteError } = await supabase
      .from('email_verification_tokens')
      .delete()
      .eq('user_id', userId);

    if (tokenDeleteError) {
      console.warn('Failed to delete verification tokens:', tokenDeleteError);
      // Don't fail the operation if token deletion fails
    }

    console.log('POST /api/admin/users/approve - Success:', { 
      userId: updatedUser.id, 
      email: updatedUser.email 
    });

    // Send approval email notification
    try {
      await sendAccountApprovalEmail({
        email: updatedUser.email,
        name: updatedUser.name
      });
      console.log('Account approval email sent to:', updatedUser.email);
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
      // Don't fail the approval if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'User approved successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('POST /api/admin/users/approve - Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
