import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';
import sharp from 'sharp';

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

    // Convert image to WebP with max 200KB compression
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let processedBuffer: Buffer = fileBuffer; // Default to original if processing fails
    let quality = 85; // Start with high quality
    
    try {
      // Try to compress to WebP with quality adjustment
      let attempt = 0;
      const maxAttempts = 10;
      const targetSize = 200 * 1024; // 200KB
      
      while (attempt < maxAttempts) {
        processedBuffer = await sharp(fileBuffer)
          .webp({ quality, effort: 6 })
          .toBuffer();
        
        if (processedBuffer.length <= targetSize || quality <= 30) {
          break;
        }
        
        // Reduce quality by 5% each attempt
        quality -= 5;
        attempt++;
      }
      
      // If still too large, resize the image
      if (processedBuffer.length > targetSize) {
        const metadata = await sharp(fileBuffer).metadata();
        const maxDimension = 1920; // Max width or height
        let width = metadata.width;
        let height = metadata.height;
        
        if (width && height && (width > maxDimension || height > maxDimension)) {
          if (width > height) {
            width = maxDimension;
            height = Math.round((height / metadata.width!) * maxDimension);
          } else {
            height = maxDimension;
            width = Math.round((width / metadata.height!) * maxDimension);
          }
        }
        
        // Try again with resized image
        quality = 85;
        attempt = 0;
        while (attempt < maxAttempts) {
          const resizedBuffer = await sharp(fileBuffer)
            .resize(width, height, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality, effort: 6 })
            .toBuffer();
          
          if (resizedBuffer.length <= targetSize || quality <= 30) {
            processedBuffer = resizedBuffer;
            break;
          }
          
          quality -= 5;
          attempt++;
        }
      }
    } catch (error) {
      console.error('Error processing image:', error);
      // Fallback to original if processing fails
      processedBuffer = fileBuffer;
    }
    
    // Generate unique file name with .webp extension
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
    
    // Organize by specialty > page title > images
    // Structure: {specialtySlug}/{pageSlug}/images/{fileName}
    let folderPath = 'general/images';
    if (specialtySlug && pageSlug) {
      folderPath = `${specialtySlug}/${pageSlug}/images`;
    } else if (specialtySlug) {
      folderPath = `${specialtySlug}/images`;
    }
    const filePath = `${folderPath}/${fileName}`;

    // Upload processed WebP file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('placements')
      .upload(filePath, processedBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/webp'
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      console.error('Upload path attempted:', filePath);
      return NextResponse.json({ 
        error: 'Failed to upload file: ' + uploadError.message,
        attemptedPath: filePath,
        specialtySlug,
        pageSlug
      }, { status: 500 });
    }
    
    // Verify the file was actually uploaded by trying to create a signed URL
    // If the file doesn't exist, this will fail
    const { data: verifySignedUrl, error: verifyError } = await supabaseAdmin.storage
      .from('placements')
      .createSignedUrl(filePath, 60); // Short-lived URL just for verification

    if (verifyError) {
      console.error('File verification failed:', verifyError);
      console.error('Upload reported success but file not found:', filePath);
      console.error('Verify error details:', verifyError.message);
      return NextResponse.json({ 
        error: 'Upload reported success but file verification failed',
        attemptedPath: filePath,
        verifyError: verifyError.message
      }, { status: 500 });
    }

    // Return the storage path and a view API URL
    // The view API will generate fresh signed URLs on demand
    const viewUrl = `/api/placements/images/view?path=${encodeURIComponent(filePath)}`;

    // Also generate a temporary signed URL for immediate use in editor
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('placements')
      .createSignedUrl(filePath, 3600); // 1 hour for immediate editor display

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError);
      // Still return the view URL, but log the error
    }

    return NextResponse.json({ 
      url: viewUrl, // Use view API URL for final HTML (never expires)
      path: filePath,
      tempSignedUrl: signedUrlData?.signedUrl || null // Temporary signed URL for immediate editor display
    });
  } catch (error) {
    console.error('Error in upload image API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

