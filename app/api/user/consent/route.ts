import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch user's current consent data
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/user/consent - Fetching consent data');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('GET /api/user/consent - Unauthorized: No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('GET /api/user/consent - Session found for:', session.user.email);

    // Fetch user's consent data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('consent_given, consent_timestamp, consent_version, marketing_consent, analytics_consent')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      console.log('GET /api/user/consent - User not found:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('GET /api/user/consent - Consent data retrieved:', {
      consent_given: user.consent_given,
      marketing_consent: user.marketing_consent,
      analytics_consent: user.analytics_consent
    });

    return NextResponse.json({
      consent_given: user.consent_given || false,
      consent_timestamp: user.consent_timestamp,
      consent_version: user.consent_version || '1.0',
      marketing_consent: user.marketing_consent || false,
      analytics_consent: user.analytics_consent || false
    });

  } catch (error) {
    console.error('GET /api/user/consent - Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update user's consent preferences
export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/user/consent - Updating consent preferences');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('PUT /api/user/consent - Unauthorized: No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('PUT /api/user/consent - Session found for:', session.user.email);

    const { marketing_consent, analytics_consent, consent_version } = await request.json();
    
    console.log('PUT /api/user/consent - Request body:', {
      marketing_consent,
      analytics_consent,
      consent_version
    });

    // Validate input
    if (typeof marketing_consent !== 'boolean' || typeof analytics_consent !== 'boolean') {
      return NextResponse.json({ error: 'Invalid consent values' }, { status: 400 });
    }

    // Update user's consent preferences
    const { data: updateResult, error: updateError } = await supabase
      .from('users')
      .update({
        marketing_consent: marketing_consent,
        analytics_consent: analytics_consent,
        consent_timestamp: new Date().toISOString(),
        consent_version: consent_version || '1.1',
        updated_at: new Date().toISOString()
      })
      .eq('email', session.user.email)
      .select('id, email, marketing_consent, analytics_consent, consent_timestamp, consent_version');

    if (updateError) {
      console.error('PUT /api/user/consent - Error updating consent:', updateError);
      return NextResponse.json({ error: 'Failed to update consent preferences' }, { status: 500 });
    }

    if (!updateResult || updateResult.length === 0) {
      console.log('PUT /api/user/consent - User not found with email:', session.user.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('PUT /api/user/consent - Consent updated successfully:', updateResult[0]);

    // Log consent change for audit trail
    try {
      await supabase
        .from('consent_audit_log')
        .insert({
          user_id: updateResult[0].id,
          action: 'consent_preferences_updated',
          old_values: JSON.stringify({}), // We don't store old values for simplicity
          new_values: JSON.stringify({
            marketing_consent: marketing_consent,
            analytics_consent: analytics_consent,
            consent_version: consent_version
          }),
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          timestamp: new Date().toISOString()
        });
    } catch (auditError) {
      console.error('PUT /api/user/consent - Failed to log consent change:', auditError);
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'Consent preferences updated successfully',
      data: {
        marketing_consent: updateResult[0].marketing_consent,
        analytics_consent: updateResult[0].analytics_consent,
        consent_timestamp: updateResult[0].consent_timestamp,
        consent_version: updateResult[0].consent_version
      }
    });

  } catch (error) {
    console.error('PUT /api/user/consent - Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
