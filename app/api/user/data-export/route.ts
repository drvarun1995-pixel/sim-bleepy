import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user attempts
    const { data: attempts, error: attemptsError } = await supabase
      .from('attempts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Get user analytics (if table exists)
    let analytics = [];
    try {
      const { data: analyticsData } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      analytics = analyticsData || [];
    } catch (error) {
      // Analytics table might not exist
      console.log('Analytics table not found, skipping...');
    }

    // Get API usage (if table exists)
    let apiUsage = [];
    try {
      const { data: apiUsageData } = await supabase
        .from('api_usage')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      apiUsage = apiUsageData || [];
    } catch (error) {
      // API usage table might not exist
      console.log('API usage table not found, skipping...');
    }

    // Prepare export data
    const exportData = {
      export_info: {
        exported_at: new Date().toISOString(),
        user_email: session.user.email,
        data_version: '1.0'
      },
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        university: user.university,
        year: user.year,
        auth_provider: user.auth_provider,
        email_verified: user.email_verified,
        consent_given: user.consent_given,
        consent_timestamp: user.consent_timestamp,
        consent_version: user.consent_version,
        marketing_consent: user.marketing_consent,
        analytics_consent: user.analytics_consent,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      training_sessions: attempts || [],
      analytics: analytics,
      api_usage: apiUsage,
      summary: {
        total_sessions: attempts?.length || 0,
        account_created: user.created_at,
        last_activity: attempts?.[0]?.created_at || user.updated_at,
        data_retention: 'Data retained for 2 years from account creation'
      }
    };

    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="bleepy-data-export-${session.user.email}-${new Date().toISOString().split('T')[0]}.json"`
      }
    });

  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
