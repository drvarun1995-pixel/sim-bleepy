import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user ID first
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user.id;

    // Log account deletion event for audit trail
    try {
      await supabase
        .from('consent_audit_log')
        .insert({
          user_id: userId,
          action: 'account_deletion_requested',
          new_values: JSON.stringify({
            deletion_requested_at: new Date().toISOString(),
            user_email: user.email
          }),
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          timestamp: new Date().toISOString()
        });
    } catch (auditError) {
      console.error('Failed to log account deletion event:', auditError);
      // Don't fail the request if audit logging fails
    }

    // Delete user data from all related tables
    // Note: Using DO blocks to handle tables that might not exist
    
    // Delete from attempts table
    try {
      await supabase
        .from('attempts')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.log('Attempts table not found or error:', error);
    }

    // Delete from user analytics table (if exists)
    try {
      await supabase
        .from('user_analytics')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.log('User analytics table not found or error:', error);
    }

    // Delete from API usage table (if exists)
    try {
      await supabase
        .from('api_usage')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.log('API usage table not found or error:', error);
    }

    // Delete from email verification tokens
    try {
      await supabase
        .from('email_verification_tokens')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.log('Email verification tokens table not found or error:', error);
    }

    // Delete from password reset tokens
    try {
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.log('Password reset tokens table not found or error:', error);
    }

    // Delete from profiles table (if exists)
    try {
      await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
    } catch (error) {
      console.log('Profiles table not found or error:', error);
    }

    // Finally, delete the user record
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete user account' },
        { status: 500 }
      );
    }

    // Log the deletion for audit purposes
    console.log(`User account deleted: ${session.user.email} (ID: ${userId}) at ${new Date().toISOString()}`);

    return NextResponse.json({
      message: 'Account and all associated data have been permanently deleted',
      deleted_at: new Date().toISOString(),
      user_email: session.user.email
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
