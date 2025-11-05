import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

// POST - Upload an image for placements content
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
    const specialtySlug = formData.get('specialtySlug') as string;
    const pageSlug = formData.get('pageSlug') as string;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Validate file type (images only)
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 });
    }

    // Validate file size (10MB limit for images)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    // Generate unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    // Organize by specialty > page title > images
    // Structure: {specialtySlug}/{pageSlug}/images/{fileName}
    let folderPath = 'general/images';
    if (specialtySlug && pageSlug) {
      folderPath = `${specialtySlug}/${pageSlug}/images`;
    } else if (specialtySlug) {
      folderPath = `${specialtySlug}/images`;
    }
    const filePath = `${folderPath}/${fileName}`;

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

    // Return the storage path and a view API URL
    // The view API will generate fresh signed URLs on demand
    const viewUrl = `/api/placements/images/view?path=${encodeURIComponent(filePath)}`;

    // Also generate a temporary signed URL for immediate use in editor
    const { data: signedUrlData } = await supabaseAdmin.storage
      .from('placements')
      .createSignedUrl(filePath, 3600); // 1 hour for immediate editor display

    return NextResponse.json({ 
      url: viewUrl, // Use view API URL for final HTML (never expires)
      path: filePath,
      tempSignedUrl: signedUrlData?.signedUrl // Temporary signed URL for immediate editor display
    });
  } catch (error) {
    console.error('Error in upload image API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

