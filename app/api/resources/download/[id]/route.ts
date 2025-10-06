import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get resource metadata using admin client
    const { data: resource, error } = await supabaseAdmin
      .from('resources')
      .select('file_path, downloads, file_name')
      .eq('id', id)
      .single();

    if (error || !resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Increment download counter
    await supabaseAdmin
      .from('resources')
      .update({ downloads: (resource.downloads || 0) + 1 })
      .eq('id', id);

    // Generate signed URL (valid for 1 hour) using admin client
    const { data: signedUrlData, error: urlError } = await supabaseAdmin.storage
      .from('resources')
      .createSignedUrl(resource.file_path, 3600);

    if (urlError || !signedUrlData) {
      console.error('Signed URL error:', urlError);
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 });
    }

    return NextResponse.json({ 
      url: signedUrlData.signedUrl,
      fileName: resource.file_name
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

