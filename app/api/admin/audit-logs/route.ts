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
      .select('*')
      .order('timestamp', { ascending: false });

    // Apply filters
    if (action) {
      query = query.ilike('action', `%${action}%`);
    }

    // Note: user_email filter will be applied after fetching data since we need to join manually

    if (date_from) {
      query = query.gte('timestamp', `${date_from}T00:00:00.000Z`);
    }

    if (date_to) {
      query = query.lte('timestamp', `${date_to}T23:59:59.999Z`);
    }

    // For now, fetch all logs and handle pagination in memory
    // This is not ideal for large datasets but works for the current use case
    // TODO: Implement proper database-level pagination with user_email filtering

    // Execute the query
    const { data: logs, error: logsError } = await query;

    if (logsError) {
      console.error('Error fetching audit logs:', logsError);
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }

    // Get user emails for all user_ids in the logs
    const userIds = [...new Set(logs?.map(log => log.user_id) || [])];
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    // Create a map of user_id to email
    const userEmailMap = new Map();
    users?.forEach(user => {
      userEmailMap.set(user.id, user.email);
    });

    // Transform the data to include user email
    let transformedLogs = logs?.map(log => ({
      ...log,
      user_email: userEmailMap.get(log.user_id) || 'Unknown'
    })) || [];

    // Apply user_email filter if specified
    if (user_email) {
      transformedLogs = transformedLogs.filter(log => 
        log.user_email.toLowerCase().includes(user_email.toLowerCase())
      );
    }

    // Apply pagination after filtering
    const totalCount = transformedLogs.length;
    const totalPages = Math.ceil(totalCount / limit);
    const from = (page - 1) * limit;
    const to = from + limit;
    const paginatedLogs = transformedLogs.slice(from, to);

    console.log('GET /api/admin/audit-logs - Success:', {
      logsCount: paginatedLogs.length,
      totalCount,
      totalPages,
      currentPage: page
    });

    return NextResponse.json({
      success: true,
      logs: paginatedLogs,
      totalPages,
      totalCount,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('GET /api/admin/audit-logs - Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
