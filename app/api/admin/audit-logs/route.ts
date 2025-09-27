import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch audit logs with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/admin/audit-logs - Fetching audit logs');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('GET /api/admin/audit-logs - Unauthorized: No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
    const isAdmin = adminEmails.includes(session.user.email.trim());
    
    if (!isAdmin) {
      console.log('GET /api/admin/audit-logs - Admin access required');
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const action = searchParams.get('action');
    const user_email = searchParams.get('user_email');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');

    console.log('GET /api/admin/audit-logs - Query params:', {
      page, limit, action, user_email, date_from, date_to
    });

    // Build the query
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

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('consent_audit_log')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error getting audit log count:', countError);
      return NextResponse.json({ error: 'Failed to get audit log count' }, { status: 500 });
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Execute the query
    const { data: logs, error: logsError } = await query;

    if (logsError) {
      console.error('Error fetching audit logs:', logsError);
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }

    // Transform the data to include user email
    const transformedLogs = logs?.map(log => ({
      ...log,
      user_email: log.users?.email || 'Unknown'
    })) || [];

    const totalPages = Math.ceil((count || 0) / limit);

    console.log('GET /api/admin/audit-logs - Success:', {
      logsCount: transformedLogs.length,
      totalCount: count,
      totalPages,
      currentPage: page
    });

    return NextResponse.json({
      success: true,
      logs: transformedLogs,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: count || 0,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('GET /api/admin/audit-logs - Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
