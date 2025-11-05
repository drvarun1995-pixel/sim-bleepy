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

    const body = await request.json();
    const { imagePaths } = body;

    if (!imagePaths || !Array.isArray(imagePaths) || imagePaths.length === 0) {
      return NextResponse.json({ error: 'imagePaths array is required' }, { status: 400 });
    }

    // Delete all specified images from storage
    const { data: deletedFiles, error: deleteError } = await supabaseAdmin.storage
      .from('placements')
      .remove(imagePaths);

    if (deleteError) {
      console.error('Error deleting images:', deleteError);
      return NextResponse.json({ error: 'Failed to delete some images: ' + deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      deletedCount: deletedFiles?.length || 0
    });
  } catch (error) {
    console.error('Error in cleanup images API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

