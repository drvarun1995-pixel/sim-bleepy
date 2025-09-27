import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Data retention policies (in days)
const RETENTION_POLICIES = {
  // Keep user accounts for 2 years after last activity
  user_accounts: 730,
  // Keep training attempts for 1 year
  training_attempts: 365,
  // Keep audit logs for 7 years (legal requirement)
  audit_logs: 2555,
  // Keep email verification tokens for 7 days
  verification_tokens: 7,
  // Keep password reset tokens for 1 day
  password_reset_tokens: 1,
  // Keep API usage logs for 1 year
  api_usage_logs: 365
};

// GET - Get data retention statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
    const isAdmin = adminEmails.includes(session.user.email.trim());
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const now = new Date();
    const stats: any = {};

    // Get user account statistics
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, created_at, updated_at');
      
      if (!usersError && users) {
        const expiredUsers = users.filter(user => {
          const lastActivity = new Date(user.updated_at || user.created_at);
          const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
          return daysSinceActivity > RETENTION_POLICIES.user_accounts;
        });

        stats['user_accounts'] = {
          total: users.length,
          expired: expiredUsers.length,
          retention_days: RETENTION_POLICIES.user_accounts
        };
      }
    } catch (error) {
      console.error('Error getting user stats:', error);
    }

    // Get training attempts statistics
    try {
      const { data: attempts, error: attemptsError } = await supabase
        .from('attempts')
        .select('id, created_at');
      
      if (!attemptsError && attempts) {
        const expiredAttempts = attempts.filter(attempt => {
          const createdDate = new Date(attempt.created_at);
          const daysSinceCreation = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysSinceCreation > RETENTION_POLICIES.training_attempts;
        });

        stats['training_attempts'] = {
          total: attempts.length,
          expired: expiredAttempts.length,
          retention_days: RETENTION_POLICIES.training_attempts
        };
      }
    } catch (error) {
      console.error('Error getting attempts stats:', error);
    }

    // Get audit logs statistics
    try {
      const { data: auditLogs, error: auditError } = await supabase
        .from('consent_audit_log')
        .select('id, timestamp');
      
      if (!auditError && auditLogs) {
        const expiredLogs = auditLogs.filter(log => {
          const logDate = new Date(log.timestamp);
          const daysSinceCreation = Math.floor((now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysSinceCreation > RETENTION_POLICIES.audit_logs;
        });

        stats['audit_logs'] = {
          total: auditLogs.length,
          expired: expiredLogs.length,
          retention_days: RETENTION_POLICIES.audit_logs
        };
      }
    } catch (error) {
      console.error('Error getting audit logs stats:', error);
    }

    return NextResponse.json({
      success: true,
      retention_policies: RETENTION_POLICIES,
      statistics: stats,
      generated_at: now.toISOString()
    });

  } catch (error) {
    console.error('Error in data retention stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Execute data retention cleanup
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
    const isAdmin = adminEmails.includes(session.user.email.trim());
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { cleanup_type, dry_run = true } = await request.json();
    const now = new Date();
    const results: any = {};

    if (!cleanup_type || !['all', 'user_accounts', 'training_attempts', 'audit_logs', 'tokens'].includes(cleanup_type)) {
      return NextResponse.json({ error: 'Invalid cleanup type' }, { status: 400 });
    }

    // Cleanup expired email verification tokens
    if (cleanup_type === 'all' || cleanup_type === 'tokens') {
      try {
        const cutoffDate = new Date(now.getTime() - (RETENTION_POLICIES.verification_tokens * 24 * 60 * 60 * 1000));
        
        if (!dry_run) {
          const { data: deletedTokens, error: tokenError } = await supabase
            .from('email_verification_tokens')
            .delete()
            .lt('created_at', cutoffDate.toISOString())
            .select('id');

          results['verification_tokens'] = {
            deleted: deletedTokens?.length || 0,
            error: tokenError?.message || null
          };
        } else {
          const { data: expiredTokens, error: tokenError } = await supabase
            .from('email_verification_tokens')
            .select('id')
            .lt('created_at', cutoffDate.toISOString());

          results['verification_tokens'] = {
            would_delete: expiredTokens?.length || 0,
            error: tokenError?.message || null
          };
        }
      } catch (error) {
        results['verification_tokens'] = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    // Cleanup expired password reset tokens
    if (cleanup_type === 'all' || cleanup_type === 'tokens') {
      try {
        const cutoffDate = new Date(now.getTime() - (RETENTION_POLICIES.password_reset_tokens * 24 * 60 * 60 * 1000));
        
        if (!dry_run) {
          const { data: deletedTokens, error: tokenError } = await supabase
            .from('password_reset_tokens')
            .delete()
            .lt('created_at', cutoffDate.toISOString())
            .select('id');

          results['password_reset_tokens'] = {
            deleted: deletedTokens?.length || 0,
            error: tokenError?.message || null
          };
        } else {
          const { data: expiredTokens, error: tokenError } = await supabase
            .from('password_reset_tokens')
            .select('id')
            .lt('created_at', cutoffDate.toISOString());

          results['password_reset_tokens'] = {
            would_delete: expiredTokens?.length || 0,
            error: tokenError?.message || null
          };
        }
      } catch (error) {
        results['password_reset_tokens'] = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    // Cleanup expired training attempts
    if (cleanup_type === 'all' || cleanup_type === 'training_attempts') {
      try {
        const cutoffDate = new Date(now.getTime() - (RETENTION_POLICIES.training_attempts * 24 * 60 * 60 * 1000));
        
        if (!dry_run) {
          const { data: deletedAttempts, error: attemptsError } = await supabase
            .from('attempts')
            .delete()
            .lt('created_at', cutoffDate.toISOString())
            .select('id');

          results['training_attempts'] = {
            deleted: deletedAttempts?.length || 0,
            error: attemptsError?.message || null
          };
        } else {
          const { data: expiredAttempts, error: attemptsError } = await supabase
            .from('attempts')
            .select('id')
            .lt('created_at', cutoffDate.toISOString());

          results['training_attempts'] = {
            would_delete: expiredAttempts?.length || 0,
            error: attemptsError?.message || null
          };
        }
      } catch (error) {
        results['training_attempts'] = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    // Cleanup expired audit logs (only if older than 7 years)
    if (cleanup_type === 'all' || cleanup_type === 'audit_logs') {
      try {
        const cutoffDate = new Date(now.getTime() - (RETENTION_POLICIES.audit_logs * 24 * 60 * 60 * 1000));
        
        if (!dry_run) {
          const { data: deletedLogs, error: logsError } = await supabase
            .from('consent_audit_log')
            .delete()
            .lt('timestamp', cutoffDate.toISOString())
            .select('id');

          results['audit_logs'] = {
            deleted: deletedLogs?.length || 0,
            error: logsError?.message || null
          };
        } else {
          const { data: expiredLogs, error: logsError } = await supabase
            .from('consent_audit_log')
            .select('id')
            .lt('timestamp', cutoffDate.toISOString());

          results['audit_logs'] = {
            would_delete: expiredLogs?.length || 0,
            error: logsError?.message || null
          };
        }
      } catch (error) {
        results['audit_logs'] = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    // Note: We don't automatically delete user accounts as this requires more careful consideration
    // and should be done manually or with additional safeguards

    return NextResponse.json({
      success: true,
      cleanup_type,
      dry_run,
      results,
      executed_at: now.toISOString()
    });

  } catch (error) {
    console.error('Error in data retention cleanup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
