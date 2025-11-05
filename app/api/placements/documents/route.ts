import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

// GET - Fetch documents for a specialty or specialty page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialtyId = searchParams.get('specialtyId');
    const specialtyPageId = searchParams.get('specialtyPageId');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    if (!specialtyId && !specialtyPageId) {
      return NextResponse.json({ error: 'specialtyId or specialtyPageId is required' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('specialty_documents')
      .select('*')
      .order('display_order', { ascending: true });

    if (specialtyId) {
      query = query.eq('specialty_id', specialtyId);
    }
    if (specialtyPageId) {
      query = query.eq('specialty_page_id', specialtyPageId);
    }
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: documents, error } = await query;

    if (error) {
      console.error('Error fetching specialty documents:', error);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    return NextResponse.json({ documents: documents || [] });
  } catch (error) {
    console.error('Error in specialty documents API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Upload a document
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const specialtyId = formData.get('specialtyId') as string;
    const specialtyPageId = formData.get('specialtyPageId') as string;
    const displayOrder = formData.get('displayOrder') as string;

    if (!file || !title) {
      return NextResponse.json({ error: 'File and title are required' }, { status: 400 });
    }

    if (!specialtyId && !specialtyPageId) {
      return NextResponse.json({ error: 'specialtyId or specialtyPageId is required' }, { status: 400 });
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 });
    }

    // Generate unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${specialtyId || specialtyPageId}/${fileName}`;

    // Upload file to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('placements')
      .upload(filePath, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file: ' + uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('placements')
      .getPublicUrl(filePath);

    // Insert document record
    const { data: document, error: dbError } = await supabaseAdmin
      .from('specialty_documents')
      .insert({
        specialty_id: specialtyId || null,
        specialty_page_id: specialtyPageId || null,
        title,
        description: description || null,
        file_name: file.name,
        file_path: filePath,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: user.id,
        display_order: displayOrder ? parseInt(displayOrder) : 0,
        is_active: true
      })
      .select()
      .single();

    if (dbError) {
      // Delete uploaded file if database insert fails
      await supabaseAdmin.storage.from('placements').remove([filePath]);
      console.error('Error saving document record:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error in upload document API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

