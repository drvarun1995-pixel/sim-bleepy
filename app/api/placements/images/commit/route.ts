import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

// POST - Move temporary images to final location and clean up old images
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
    const { sessionId, specialtySlug, pageSlug, tempImagePaths, finalImagePaths, oldImagePaths } = body;

    if (!sessionId || !specialtySlug || !pageSlug) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const movedPaths: string[] = [];
    const errors: string[] = [];

    // Move temp images to final location
    if (tempImagePaths && Array.isArray(tempImagePaths) && tempImagePaths.length > 0) {
      for (const tempPath of tempImagePaths) {
        try {
          // Extract filename from temp path
          const fileName = tempPath.split('/').pop();
          if (!fileName) continue;

          // Final location: {specialtySlug}/{pageSlug}/images/{fileName}
          const finalPath = `${specialtySlug}/${pageSlug}/images/${fileName}`;

          // Download from temp location
          const { data: fileData, error: downloadError } = await supabaseAdmin.storage
            .from('placements')
            .download(tempPath);

          if (downloadError || !fileData) {
            errors.push(`Failed to download ${tempPath}: ${downloadError?.message}`);
            continue;
          }

          // Convert blob to buffer
          const buffer = Buffer.from(await fileData.arrayBuffer());

          // Upload to final location
          const { error: uploadError } = await supabaseAdmin.storage
            .from('placements')
            .upload(finalPath, buffer, {
              cacheControl: '3600',
              upsert: true,
              contentType: 'image/webp'
            });

          if (uploadError) {
            errors.push(`Failed to upload ${finalPath}: ${uploadError.message}`);
            continue;
          }

          // Delete temp file
          const { error: deleteError } = await supabaseAdmin.storage
            .from('placements')
            .remove([tempPath]);

          if (deleteError) {
            console.error(`Failed to delete temp file ${tempPath}:`, deleteError);
            // Continue even if temp deletion fails
          }

          movedPaths.push(finalPath);
        } catch (error: any) {
          errors.push(`Error processing ${tempPath}: ${error.message}`);
        }
      }
    }

    // Delete old images that are no longer in the content
    if (oldImagePaths && Array.isArray(oldImagePaths) && oldImagePaths.length > 0) {
      // Filter out images that are still in finalImagePaths
      const imagesToDelete = oldImagePaths.filter((path: string) => {
        return !finalImagePaths || !finalImagePaths.some((finalPath: string) => 
          finalPath.includes(path.split('/').pop() || '')
        );
      });

      if (imagesToDelete.length > 0) {
        const { error: deleteError } = await supabaseAdmin.storage
          .from('placements')
          .remove(imagesToDelete);

        if (deleteError) {
          console.error('Error deleting old images:', deleteError);
          errors.push(`Failed to delete some old images: ${deleteError.message}`);
        }
      }
    }

    // Clean up temp folder for this session
    try {
      const tempFolder = `temp/${sessionId}`;
      const { data: tempFiles } = await supabaseAdmin.storage
        .from('placements')
        .list(tempFolder, { limit: 1000 });

      if (tempFiles && tempFiles.length > 0) {
        const tempPaths = tempFiles
          .filter(file => file.name)
          .map(file => `${tempFolder}/${file.name}`);
        
        if (tempPaths.length > 0) {
          await supabaseAdmin.storage
            .from('placements')
            .remove(tempPaths);
        }
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temp folder:', cleanupError);
      // Don't fail the whole operation
    }

    if (errors.length > 0 && movedPaths.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to commit images', 
        errors 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      movedPaths,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in commit images API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

