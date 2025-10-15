import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminUser, error: adminCheckError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (adminCheckError || adminUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all users with login tracking data
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, created_at, last_login, login_count')
      .order('last_login', { ascending: false, nullsFirst: false });

    if (usersError) {
      console.error('Error fetching users for export:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get attempt statistics for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        const { data: attempts } = await supabaseAdmin
          .from('attempts')
          .select('overall_band, scores')
          .eq('user_id', user.id);

        const totalAttempts = attempts?.length || 0;
        const completedAttempts = attempts?.filter(a => a.overall_band) || [];
        const averageScore = completedAttempts.length > 0 
          ? completedAttempts.reduce((sum, attempt) => {
              const scores = attempt.scores as any;
              return sum + (scores?.overall_pct || 0);
            }, 0) / completedAttempts.length
          : 0;

        return {
          Email: user.email,
          Name: user.name,
          Role: user.role || 'student',
          'Account Created': user.created_at ? new Date(user.created_at).toISOString() : '',
          'Last Login': user.last_login ? new Date(user.last_login).toISOString() : 'Never',
          'Login Count': user.login_count || 0,
          'Total Attempts': totalAttempts,
          'Average Score': Math.round(averageScore * 10) / 10
        };
      })
    );

    // Convert to CSV format
    const headers = ['Email', 'Name', 'Role', 'Account Created', 'Last Login', 'Login Count', 'Total Attempts', 'Average Score'];
    const csvRows = [
      headers.join(','),
      ...usersWithStats.map(user => 
        headers.map(header => {
          const value = user[header as keyof typeof user];
          // Escape commas and quotes in values
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ];

    const csv = csvRows.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="login-tracking-data-${timestamp}.csv"`,
      },
    });

  } catch (error) {
    console.error('Error in export-login-data API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

