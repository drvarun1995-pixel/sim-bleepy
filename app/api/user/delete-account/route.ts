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

    // Delete from event_bookings table
    try {
      await supabase
        .from('event_bookings')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.log('Event bookings table not found or error:', error);
    }

    // Delete from feedback_responses table
    try {
      await supabase
        .from('feedback_responses')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.log('Feedback responses table not found or error:', error);
    }

    // Delete from qr_code_scans table
    try {
      await supabase
        .from('qr_code_scans')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.log('QR code scans table not found or error:', error);
    }

    // Delete certificates and their files from storage
    try {
      // First, get all certificates for this user
      const { data: certificates, error: certError } = await supabase
        .from('certificates')
        .select('id, certificate_filename, event_id')
        .eq('user_id', userId);

      if (!certError && certificates && certificates.length > 0) {
        // Delete certificate files from storage
        const filePaths = certificates
          .map(cert => {
            if (cert.certificate_filename) {
              // Extract path from filename (format: users/{generator}/certificates/{event}/{user}/{filename})
              return cert.certificate_filename;
            }
            return null;
          })
          .filter(Boolean);

        if (filePaths.length > 0) {
          try {
            const { error: storageError } = await supabase.storage
              .from('certificates')
              .remove(filePaths);
            
            if (storageError) {
              console.log('Error deleting certificate files from storage:', storageError);
            }
          } catch (storageError) {
            console.log('Storage deletion error:', storageError);
          }
        }

        // Delete certificate records
        await supabase
          .from('certificates')
          .delete()
          .eq('user_id', userId);
      }
    } catch (error) {
      console.log('Certificates table not found or error:', error);
    }

    // Delete from resources table (files uploaded by user)
    try {
      // Get resources uploaded by this user
      const { data: resources, error: resError } = await supabase
        .from('resources')
        .select('id, file_path')
        .eq('uploaded_by', userId);

      if (!resError && resources && resources.length > 0) {
        // Delete resource files from storage
        const filePaths = resources
          .map(res => res.file_path)
          .filter(Boolean);

        if (filePaths.length > 0) {
          try {
            const { error: storageError } = await supabase.storage
              .from('resources')
              .remove(filePaths);
            
            if (storageError) {
              console.log('Error deleting resource files from storage:', storageError);
            }
          } catch (storageError) {
            console.log('Storage deletion error:', storageError);
          }
        }

        // Delete resource records
        await supabase
          .from('resources')
          .delete()
          .eq('uploaded_by', userId);
      }
    } catch (error) {
      console.log('Resources table not found or error:', error);
    }

    // Delete profile picture from storage
    try {
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('profile_picture_url')
        .eq('id', userId)
        .single();

      if (!profileError && userProfile?.profile_picture_url) {
        // Extract path from URL or use user ID folder
        const files = await supabase.storage
          .from('profile-pictures')
          .list(userId);

        if (files.data && files.data.length > 0) {
          const filesToDelete = files.data.map(f => `${userId}/${f.name}`);
          await supabase.storage
            .from('profile-pictures')
            .remove(filesToDelete);
        }
      }
    } catch (error) {
      console.log('Profile picture deletion error:', error);
    }

    // Delete from saved_events table (if exists)
    try {
      await supabase
        .from('saved_events')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.log('Saved events table not found or error:', error);
    }

    // Delete from user_preferences table (if exists)
    try {
      await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.log('User preferences table not found or error:', error);
    }

    // Delete from gamification tables (if exists)
    try {
      await supabase
        .from('user_achievements')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.log('User achievements table not found or error:', error);
    }

    try {
      await supabase
        .from('user_levels')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.log('User levels table not found or error:', error);
    }

    try {
      await supabase
        .from('user_skills')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.log('User skills table not found or error:', error);
    }

    try {
      await supabase
        .from('user_streaks')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.log('User streaks table not found or error:', error);
    }

    try {
      await supabase
        .from('xp_transactions')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.log('XP transactions table not found or error:', error);
    }

    // Delete from sessions table (if exists - analytics)
    try {
      await supabase
        .from('sessions')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.log('Sessions table not found or error:', error);
    }

    // Delete from scores table (if exists - analytics)
    try {
      // First get session IDs for this user
      const { data: userSessions } = await supabase
        .from('sessions')
        .select('id')
        .eq('user_id', userId);

      if (userSessions && userSessions.length > 0) {
        const sessionIds = userSessions.map(s => s.id);
        await supabase
          .from('scores')
          .delete()
          .in('session_id', sessionIds);
      }
    } catch (error) {
      console.log('Scores table not found or error:', error);
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
