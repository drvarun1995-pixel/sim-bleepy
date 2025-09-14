import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await import('next-auth').then(auth => auth.getServerSession());
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user?.email || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get newsletter analytics
    const { data: analytics, error } = await supabase
      .from('newsletter_analytics')
      .select('*')
      .order('signup_date', { ascending: false })
      .limit(30); // Last 30 days

    if (error) {
      console.error('Error fetching newsletter analytics:', error);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // Get total signups
    const { count: totalSignups } = await supabase
      .from('newsletter_signups')
      .select('*', { count: 'exact', head: true });

    // Get signups by source
    const { data: sourceStats } = await supabase
      .from('newsletter_signups')
      .select('source')
      .not('source', 'is', null);

    const sourceCounts = sourceStats?.reduce((acc: Record<string, number>, item) => {
      acc[item.source] = (acc[item.source] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get recent signups
    const { data: recentSignups } = await supabase
      .from('newsletter_signups')
      .select('email, source, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      analytics,
      totalSignups,
      sourceCounts,
      recentSignups
    });

  } catch (error) {
    console.error('Newsletter analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
