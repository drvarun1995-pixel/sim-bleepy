import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

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
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!['admin', 'educator'].includes(profile.role)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions' 
      }, { status: 403 });
    }

    const {
      title,
      description,
      category,
      customCategory,
      fileName,
      filePath,
      fileSize,
      teachingDate,
      taughtBy,
      eventIds
    } = await request.json();

    if (!title || !category || !fileName || !filePath) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get MIME type from file extension
    const fileType = getMimeType(fileName);

    // Verify file exists in storage before creating metadata
    const { data: fileExists, error: checkError } = await supabaseAdmin.storage
      .from('resources')
      .list(category, {
        search: filePath.split('/').pop()
      });

    if (checkError || !fileExists || fileExists.length === 0) {
      console.error('File not found in storage:', checkError);
      return NextResponse.json({ 
        error: 'File upload verification failed. Please try again.' 
      }, { status: 400 });
    }

    // Prepare description with custom category if needed
    let finalDescription = description;
    if (category === 'others' && customCategory) {
      finalDescription = description 
        ? `[Format: ${customCategory}] ${description}`
        : `Format: ${customCategory}`;
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('resources')
      .getPublicUrl(filePath);

    // Insert metadata into database
    const { data: resourceData, error: dbError } = await supabaseAdmin
      .from('resources')
      .insert({
        title,
        description: finalDescription || null,
        category,
        file_name: fileName,
        file_path: filePath,
        file_url: publicUrl,
        file_size: fileSize,
        file_type: fileType,
        teaching_date: teachingDate || null,
        taught_by: taughtBy || null,
        uploaded_by: profile.id,
        uploaded_by_name: session.user.name || session.user.email
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      
      // If metadata save fails, attempt to delete the uploaded file
      try {
        await supabaseAdmin.storage.from('resources').remove([filePath]);
      } catch (cleanupError) {
        console.error('Failed to cleanup file after metadata error:', cleanupError);
      }
      
      return NextResponse.json({ 
        error: 'Failed to save resource metadata: ' + dbError.message 
      }, { status: 500 });
    }

    // Link to events if any were selected
    if (eventIds && eventIds.length > 0 && resourceData?.id) {
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
    });

  } catch (error) {
    console.error('Error in save-metadata:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

