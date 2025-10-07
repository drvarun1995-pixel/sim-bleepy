import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';
import { NextRequest, NextResponse } from 'next/server';

// Configure route to handle large file uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Increase body size limit to 100MB for large file uploads
export const maxDuration = 300; // 5 minutes timeout

// Helper function to get MIME type from file extension
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    
    // Videos
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    'flv': 'video/x-flv',
    'webm': 'video/webm',
    
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    
    // Archives
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
  };
  
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user exists in database, create if not
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role, id')
      .eq('email', session.user.email)
      .single();

    // If user doesn't exist, create them
    if (profileError || !profile) {
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          email: session.user.email,
          name: session.user.name || session.user.email,
          role: 'student' // Default role, will need to be updated by admin
        })
        .select('role, id')
        .single();

      if (createError || !newUser) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
      }

      profile = newUser;
    }

    // Check if user is admin or educator
    if (!profile || !['admin', 'educator'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions. Only admins and educators can upload resources.' }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    let description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const customCategory = formData.get('customCategory') as string;
    const teachingDate = formData.get('teachingDate') as string;
    const taughtBy = formData.get('taughtBy') as string;
    const eventIdsStr = formData.get('eventIds') as string;
    const eventIds = eventIdsStr ? JSON.parse(eventIdsStr) : [];

    // If category is "others" and customCategory is provided, prepend it to description
    if (category === 'others' && customCategory) {
      description = description 
        ? `[Format: ${customCategory}] ${description}`
        : `Format: ${customCategory}`;
    }

    if (!file || !title || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 });
    }

    // Generate unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${category}/${fileName}`;

    // Get proper MIME type from file extension (more reliable than file.type for large files)
    const contentType = getMimeType(file.name);

    // Convert File to ArrayBuffer for upload
    const fileBuffer = await file.arrayBuffer();
    
    // Upload file to Supabase Storage using admin client
    // Set contentType based on file extension for proper download behavior
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('resources')
      .upload(filePath, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentType // Set proper MIME type
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file: ' + uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('resources')
      .getPublicUrl(filePath);

    // Insert metadata into database using admin client (bypasses RLS)
    const { data: resourceData, error: dbError } = await supabaseAdmin
      .from('resources')
      .insert({
        title,
        description: description || null,
        category,
        file_name: file.name,
        file_path: filePath,
        file_url: publicUrl,
        file_size: file.size,
        file_type: contentType, // Store the proper MIME type
        teaching_date: teachingDate || null,
        taught_by: taughtBy || null,
        uploaded_by: profile.id,
        uploaded_by_name: session.user.name || session.user.email
      })
      .select()
      .single();

    if (dbError) {
      // If database insert fails, delete the uploaded file
      await supabaseAdmin.storage.from('resources').remove([filePath]);
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to save resource metadata: ' + dbError.message }, { status: 500 });
    }

    // Link resource to events if any were selected
    if (eventIds.length > 0 && resourceData?.id) {
      const eventAssociations = eventIds.map((eventId: string) => ({
        resource_id: resourceData.id,
        event_id: eventId
      }));

      const { error: linkError } = await supabaseAdmin
        .from('resource_events')
        .insert(eventAssociations);

      if (linkError) {
        console.error('Error linking events:', linkError);
        // Don't fail the request, but log the error
      }
    }

    return NextResponse.json({ 
      success: true, 
      resource: resourceData 
    }, { status: 201 });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

