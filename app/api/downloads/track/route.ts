import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('Download tracking API called');
    console.log('Session:', session ? 'Present' : 'Not present');
    
    // Get client IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    
    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    const body = await request.json();
    const { resourceId, resourceName, fileSize, fileType } = body;

    console.log('Request body:', { resourceId, resourceName, fileSize, fileType });

    if (!resourceId || !resourceName) {
      console.log('Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Attempting to insert into download_tracking table...');

    // Get user ID from users table if session exists
    let userId = null;
    if (session?.user?.email) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', session.user.email)
        .single();
      userId = user?.id || null;
    }

    // Insert download tracking record with analytics data
    const { data, error } = await supabaseAdmin
      .from('download_tracking')
      .insert({
        resource_id: resourceId,
        resource_name: resourceName,
        user_id: userId,
        user_email: session?.user?.email || null,
        user_name: session?.user?.name || null,
        ip_address: ip,
        user_agent: userAgent,
        file_size: fileSize || null,
        file_type: fileType || null,
        download_method: 'direct', // Default to direct download
        download_status: 'completed',
        referrer: request.headers.get('referer') || null
      })
      .select()
      .single();

    if (error) {
      console.error('Database error tracking download:', error);
      return NextResponse.json({ error: 'Failed to track download', details: error.message }, { status: 500 });
    }

    console.log('Successfully tracked download:', data);
    return NextResponse.json({ success: true, downloadId: data.id });
  } catch (error) {
    console.error('Unexpected error in download tracking API:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (userError || !user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabaseAdmin
      .from('download_tracking')
      .select(`
        id,
        resource_id,
        resource_name,
        user_email,
        user_name,
        download_timestamp,
        file_size,
        file_type
      `)
      .order('download_timestamp', { ascending: false })
      .limit(limit);

    if (resourceId) {
      query = query.eq('resource_id', resourceId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching download data:', error);
      return NextResponse.json({ error: 'Failed to fetch download data' }, { status: 500 });
    }

    return NextResponse.json({ downloads: data });
  } catch (error) {
    console.error('Error in download tracking API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
