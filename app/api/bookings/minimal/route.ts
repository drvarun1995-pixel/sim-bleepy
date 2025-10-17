import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

/**
 * MINIMAL /api/bookings/minimal - Super simple test
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 MINIMAL API called');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'exists' : 'null');
    
    if (!session?.user?.email) {
      console.log('❌ No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Session found:', session.user.email);

    // Get user info
    console.log('🔍 Fetching user...');
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();

    console.log('User query result:', { user, userError });

    if (userError || !user) {
      console.log('❌ User not found:', userError);
      return NextResponse.json({ error: 'User not found', details: userError }, { status: 404 });
    }

    console.log('✅ User found:', user.id, user.role);

    // Super simple query
    console.log('🔍 Fetching bookings...');
    const { data: bookings, error } = await supabaseAdmin
      .from('event_bookings')
      .select('id, event_id, user_id, status')
      .eq('user_id', user.id)
      .limit(5);

    console.log('Bookings query result:', { bookings, error });

    if (error) {
      console.log('❌ Bookings query failed:', error);
      return NextResponse.json({ 
        error: 'Database error', 
        details: error,
        message: error.message,
        code: error.code
      }, { status: 500 });
    }

    console.log('✅ Success!');
    return NextResponse.json({ 
      success: true,
      user: { id: user.id, role: user.role },
      bookings: bookings || [],
      count: bookings?.length || 0
    });

  } catch (error) {
    console.error('❌ Catch block error:', error);
    return NextResponse.json({ 
      error: 'Catch error', 
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
