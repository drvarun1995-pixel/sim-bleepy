import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Clear login tracking data for specific user
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        last_login: null,
        login_count: 0
      })
      .eq('id', userId)
      .select('id, email, name')
      .single();

    if (error) {
      console.error('Error clearing login data:', error);
      return NextResponse.json({ error: 'Failed to clear login data' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Login tracking data cleared for user: ${data.email}`,
      user: data
    });

  } catch (error) {
    console.error('Error in clear-login-data API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Clear all login data (bulk operation)
export async function DELETE(request: NextRequest) {
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

    // Clear login tracking data for ALL users
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        last_login: null,
        login_count: 0
      })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update all users
      .select('id');

    if (error) {
      console.error('Error clearing all login data:', error);
      return NextResponse.json({ error: 'Failed to clear all login data' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Login tracking data cleared for ${data?.length || 0} users`,
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Error in clear-all-login-data API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

