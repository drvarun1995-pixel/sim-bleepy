import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export async function PATCH(
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
        error: 'Insufficient permissions. Only admins and educators can edit resources.' 
      }, { status: 403 });
    }

    const resourceId = params.id;

    // Get the resource details to check ownership
    const { data: resource, error: fetchError } = await supabaseAdmin
      .from('resources')
      .select('uploaded_by')
      .eq('id', resourceId)
      .single();

    if (fetchError || !resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Educators can only edit their own uploads, admins can edit any
    if (profile.role === 'educator' && resource.uploaded_by !== profile.id) {
      return NextResponse.json({ 
        error: 'You can only edit your own uploads' 
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { title, description, category, customCategory, teachingDate, taughtBy } = body;

    // Build description with custom category if needed
    let finalDescription = description || '';
    if (category === 'others' && customCategory) {
      finalDescription = finalDescription 
        ? `[Format: ${customCategory}] ${finalDescription}`
        : `Format: ${customCategory}`;
    }

    // Update the resource in database
    const { data: updatedResource, error: updateError } = await supabaseAdmin
      .from('resources')
      .update({
        title: title || undefined,
        description: finalDescription || null,
        category: category || undefined,
        teaching_date: teachingDate || null,
        taught_by: taughtBy || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', resourceId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update resource: ' + updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      resource: updatedResource 
    }, { status: 200 });

  } catch (error) {
    console.error('Error in edit resource:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}











