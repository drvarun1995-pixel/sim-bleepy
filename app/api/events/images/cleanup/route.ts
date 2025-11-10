import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

// POST - Delete unused images (cleanup)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();

    if (!user || !['admin', 'meded_team', 'ctf'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 });
    }

    // Handle both regular JSON and sendBeacon blob requests
    let body: any;
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      body = await request.json();
    } else {
      // Handle sendBeacon blob
      const blob = await request.blob();
      const text = await blob.text();
      try {
        body = JSON.parse(text);
      } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
      }
    }
    
    const { imagePaths } = body;

    let deletedCount = 0;

    // Delete specific image paths if provided
    if (imagePaths && Array.isArray(imagePaths) && imagePaths.length > 0) {
      const { data: deletedFiles, error: deleteError } = await supabaseAdmin.storage
        .from('events')
        .remove(imagePaths);

      if (deleteError) {
        console.error('Error deleting images:', deleteError);
        return NextResponse.json({ error: 'Failed to delete some images: ' + deleteError.message }, { status: 500 });
      }

      deletedCount += deletedFiles?.length || 0;
    }

    return NextResponse.json({ 
      success: true,
      deletedCount
    });
  } catch (error) {
    console.error('Error in cleanup images API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

