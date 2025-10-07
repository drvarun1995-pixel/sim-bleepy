import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin/educator
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role, id')
      .eq('email', session.user.email)
      .single();

    if (!profile || !['admin', 'educator'].includes(profile.role)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Only admins and educators can upload resources.' 
      }, { status: 403 });
    }

    const { fileName, fileType, fileSize, category } = await request.json();

    if (!fileName || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (fileSize > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 });
    }

    // Generate unique file path
    const fileExt = fileName.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${category}/${uniqueFileName}`;

    // Create signed URL for upload (valid for 10 minutes)
    const { data, error } = await supabaseAdmin.storage
      .from('resources')
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error('Error creating signed URL:', error);
      return NextResponse.json({ 
        error: 'Failed to create upload URL: ' + error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      filePath,
      expiresIn: 600 // 10 minutes
    });

  } catch (error) {
    console.error('Error in upload-url:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

