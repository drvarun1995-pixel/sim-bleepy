import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user_id = session?.user?.id;

    console.log('Test track API - Session:', session);
    console.log('Test track API - User ID:', user_id);

    if (!user_id) {
      return NextResponse.json({ error: 'Unauthorized - No user ID' }, { status: 401 });
    }

    const { resourceId, resourceName, fileSize, fileType } = await req.json();

    console.log('Test track API - Received data:', { resourceId, resourceName, fileSize, fileType });

    if (!resourceId) {
      return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
    }

    const user_ip = req.ip || req.headers.get('x-forwarded-for') || null;

    console.log('Test track API - Attempting to insert into database...');

    const { data, error } = await supabaseAdmin
      .from('download_tracking')
      .insert({
        resource_id: resourceId,
        user_id: user_id,
        resource_name: resourceName,
        file_size: fileSize,
        file_type: fileType,
        user_ip: user_ip,
      })
      .select();

    if (error) {
      console.error('Test track API - Database error:', error);
      return NextResponse.json({ error: 'Failed to track download', details: error }, { status: 500 });
    }

    console.log('Test track API - Successfully inserted:', data);

    return NextResponse.json({ 
      message: 'Download tracked successfully', 
      data,
      debug: {
        user_id,
        resourceId,
        resourceName,
        fileSize,
        fileType
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Test track API - Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}

