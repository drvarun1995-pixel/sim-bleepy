import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Export audit logs as CSV
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/admin/audit-logs/export - Exporting audit logs');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('GET /api/admin/audit-logs/export - Unauthorized: No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
    const isAdmin = adminEmails.includes(session.user.email.trim());
    
    if (!isAdmin) {
      console.log('GET /api/admin/audit-logs/export - Admin access required');
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const user_email = searchParams.get('user_email');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');

    console.log('GET /api/admin/audit-logs/export - Query params:', {
      action, user_email, date_from, date_to
    });

    // Build the query (no pagination for export)
    let query = supabase
      .from('consent_audit_log')
      .select(`
        *,
        users!consent_audit_log_user_id_fkey(email)
      `)
      .order('timestamp', { ascending: false });

    // Apply filters
    if (action) {
      query = query.ilike('action', `%${action}%`);
    }

    if (user_email) {
      query = query.eq('users.email', user_email);
    }

    if (date_from) {
      query = query.gte('timestamp', `${date_from}T00:00:00.000Z`);
    }

    if (date_to) {
      query = query.lte('timestamp', `${date_to}T23:59:59.999Z`);
    }

    // Execute the query
    const { data: logs, error: logsError } = await query;

    if (logsError) {
      console.error('Error fetching audit logs for export:', logsError);
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }

    // Transform the data
    const transformedLogs = logs?.map(log => ({
      ...log,
      user_email: log.users?.email || 'Unknown'
    })) || [];

    // Generate CSV content
    const csvHeaders = [
      'Timestamp',
      'User Email',
      'Action',
      'Old Values',
      'New Values',
      'IP Address',
      'User Agent'
    ];

    const csvRows = transformedLogs.map(log => [
      new Date(log.timestamp).toISOString(),
      log.user_email || '',
      log.action || '',
      JSON.stringify(log.old_values || {}),
      JSON.stringify(log.new_values || {}),
      log.ip_address || '',
      log.user_agent || ''
    ]);

    // Escape CSV values
    const escapeCsvValue = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Build CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(escapeCsvValue).join(','))
    ].join('\n');

    console.log('GET /api/admin/audit-logs/export - Success:', {
      exportedCount: transformedLogs.length
    });

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('GET /api/admin/audit-logs/export - Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
