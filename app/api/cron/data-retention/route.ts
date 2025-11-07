import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Data retention policies (in days) - NHS requirement: 7 years for education records
const RETENTION_POLICIES = {
  // NHS Education Records - 7 years (2555 days)
  event_bookings: 2555, // Keep for 7 years (NHS requirement)
  certificates: 2555, // Keep for 7 years (NHS requirement)
  qr_code_scans: 2555, // Keep for 7 years (NHS requirement)
  feedback_responses: 2555, // Keep for 7 years if linked to certificate, otherwise 730 days
  
  // User accounts - 7 years after last activity (NHS requirement)
  user_accounts: 2555,
  
  // Analytics data - 2 years (730 days), anonymized after 1 year
  analytics_data: 730,
  api_usage_logs: 730,
  
  // Tokens - short retention
  email_verification_tokens: 7,
  password_reset_tokens: 1,
  
  // Audit logs - 7 years (legal requirement)
  audit_logs: 2555,
  
  // Resources - 2 years after last access
  resources: 730,
  
  // Audio data (Hume) - 30 days
  audio_data: 30,
};

/**
 * Automated data retention cleanup cron job
 * 
 * This endpoint should be called daily via Vercel Cron or similar
 * 
 * To set up Vercel Cron:
 * 1. Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/data-retention",
 *     "schedule": "0 2 * * *" // Daily at 2 AM UTC
 *   }]
 * }
 * 
 * 2. Add CRON_SECRET to environment variables
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || process.env.INTERNAL_CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Also check query parameter for Vercel Cron
      const secret = request.nextUrl.searchParams.get('secret');
      if (secret !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const now = new Date();
    const results: any = {
      executed_at: now.toISOString(),
      cleanup_results: {}
    };

    // 1. Cleanup expired email verification tokens (7 days)
    try {
      const cutoffDate = new Date(now.getTime() - (RETENTION_POLICIES.email_verification_tokens * 24 * 60 * 60 * 1000));
      const { data: deletedTokens, error: tokenError } = await supabase
        .from('email_verification_tokens')
        .delete()
        .lt('expires_at', cutoffDate.toISOString())
        .select('id');

      results.cleanup_results.email_verification_tokens = {
        deleted: deletedTokens?.length || 0,
        error: tokenError?.message || null
      };
    } catch (error) {
      results.cleanup_results.email_verification_tokens = {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // 2. Cleanup expired password reset tokens (1 day)
    try {
      const cutoffDate = new Date(now.getTime() - (RETENTION_POLICIES.password_reset_tokens * 24 * 60 * 60 * 1000));
      const { data: deletedTokens, error: tokenError } = await supabase
        .from('password_reset_tokens')
        .delete()
        .lt('expires_at', cutoffDate.toISOString())
        .select('id');

      results.cleanup_results.password_reset_tokens = {
        deleted: deletedTokens?.length || 0,
        error: tokenError?.message || null
      };
    } catch (error) {
      results.cleanup_results.password_reset_tokens = {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // 3. Cleanup old analytics data (2 years) - anonymize first, then delete
    try {
      const anonymizeDate = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000)); // 1 year
      const deleteDate = new Date(now.getTime() - (RETENTION_POLICIES.analytics_data * 24 * 60 * 60 * 1000)); // 2 years
      
      // Anonymize old analytics (1-2 years old)
      // Note: This is a placeholder - implement anonymization logic based on your analytics structure
      
      // Delete very old analytics (>2 years)
      // Note: Adjust based on your analytics table structure
      
      results.cleanup_results.analytics_data = {
        message: 'Analytics cleanup requires table-specific implementation',
        anonymize_cutoff: anonymizeDate.toISOString(),
        delete_cutoff: deleteDate.toISOString()
      };
    } catch (error) {
      results.cleanup_results.analytics_data = {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // 4. Cleanup old anonymous feedback (2 years) - only if not linked to certificate
    try {
      const cutoffDate = new Date(now.getTime() - (730 * 24 * 60 * 60 * 1000)); // 2 years
      
      // Delete anonymous feedback older than 2 years
      // Note: This requires checking if feedback is linked to a certificate
      // For now, we'll only delete feedback that's explicitly marked as anonymous and old
      
      const { data: deletedFeedback, error: feedbackError } = await supabase
        .from('feedback_responses')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .is('user_id', null) // Only anonymous feedback
        .select('id');

      results.cleanup_results.anonymous_feedback = {
        deleted: deletedFeedback?.length || 0,
        error: feedbackError?.message || null
      };
    } catch (error) {
      results.cleanup_results.anonymous_feedback = {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // 5. Cleanup old audit logs (only if older than 7 years)
    try {
      const cutoffDate = new Date(now.getTime() - (RETENTION_POLICIES.audit_logs * 24 * 60 * 60 * 1000));
      
      const { data: deletedLogs, error: logsError } = await supabase
        .from('consent_audit_log')
        .delete()
        .lt('timestamp', cutoffDate.toISOString())
        .select('id');

      results.cleanup_results.audit_logs = {
        deleted: deletedLogs?.length || 0,
        error: logsError?.message || null
      };
    } catch (error) {
      results.cleanup_results.audit_logs = {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Note: We do NOT automatically delete:
    // - User accounts (requires manual review)
    // - Event bookings (NHS 7-year requirement)
    // - Certificates (NHS 7-year requirement)
    // - QR code scans (NHS 7-year requirement)
    // - Feedback linked to certificates (NHS 7-year requirement)

    results.summary = {
      total_cleanup_operations: Object.keys(results.cleanup_results).length,
      note: 'NHS education records (bookings, certificates, attendance) are retained for 7 years and not automatically deleted'
    };

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error in data retention cleanup:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

