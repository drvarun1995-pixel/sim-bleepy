import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile and check role
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role, id')
      .eq('email', session.user.email)
      .single();

    // Check if user is admin or educator
    if (!profile || !['admin', 'educator'].includes(profile.role)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Only admins and educators can delete resources.' 
      }, { status: 403 });
    }

    const resourceId = params.id;

    // Get the resource details first (to get the file path)
    const { data: resource, error: fetchError } = await supabaseAdmin
      .from('resources')
      .select('file_path, uploaded_by')
      .eq('id', resourceId)
      .single();

    if (fetchError || !resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Educators can only delete their own uploads, admins can delete any
    if (profile.role === 'educator' && resource.uploaded_by !== profile.id) {
      return NextResponse.json({ 
        error: 'You can only delete your own uploads' 
      }, { status: 403 });
    }

    // Delete the file from storage
    const { error: storageError } = await supabaseAdmin
      .storage
      .from('resources')
      .remove([resource.file_path]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Continue anyway - the database record should be deleted even if storage fails
    }

    // Delete the database record
    const { error: deleteError } = await supabaseAdmin
      .from('resources')
      .delete()
      .eq('id', resourceId);

    if (deleteError) {
      console.error('Error deleting resource from database:', deleteError);
      return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Resource deleted successfully' 
    });

  } catch (error) {
    console.error('Error in delete resource:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

