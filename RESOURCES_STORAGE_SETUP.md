# Resources Storage Setup Guide

## Overview
This guide explains how to set up file storage for the resources feature using Supabase Storage.

## Why Supabase Storage?

Since you're already using Supabase for your database, **Supabase Storage** is the best choice because:

1. **Seamless Integration** - Works natively with your existing Supabase setup
2. **Built-in CDN** - Fast file delivery worldwide
3. **Row Level Security (RLS)** - Control who can access what files
4. **S3-Compatible** - Standard API, easy to migrate if needed
5. **Cost-Effective** - Free tier includes 1GB storage + 2GB bandwidth
6. **No Additional Setup** - Uses your existing Supabase project

## Storage Setup Steps

### 1. Create Storage Bucket in Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **New Bucket**
5. Create a bucket with these settings:
   - **Name**: `resources`
   - **Public**: `false` (we'll use signed URLs for downloads)
   - Click **Create Bucket**

### 2. Set Up Bucket Policies

After creating the bucket, set up the following policies:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resources' AND
  auth.role() IN ('admin', 'educator')
);

-- Allow all authenticated users to download files
CREATE POLICY "Allow authenticated downloads"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'resources');

-- Allow admins/educators to delete files
CREATE POLICY "Allow admin/educator deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'resources' AND
  auth.role() IN ('admin', 'educator')
);
```

### 3. Create Database Table

Run this SQL in your Supabase SQL Editor to create the resources table:

```sql
-- Create resources table
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('core-teaching', 'grand-rounds', 'osce', 'twilight')),
  
  -- File information
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_url TEXT, -- Public/signed URL
  file_size BIGINT NOT NULL, -- Size in bytes
  file_type TEXT NOT NULL, -- MIME type or extension
  
  -- Teaching information (visible to students)
  teaching_date DATE,
  taught_by TEXT,
  
  -- Upload information (visible to admins only)
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_by_name TEXT,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  views INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_resources_category ON public.resources(category);
CREATE INDEX idx_resources_teaching_date ON public.resources(teaching_date);
CREATE INDEX idx_resources_uploaded_by ON public.resources(uploaded_by);
CREATE INDEX idx_resources_is_active ON public.resources(is_active);

-- Enable Row Level Security
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students and authenticated users can view active resources
CREATE POLICY "Allow viewing active resources"
ON public.resources
FOR SELECT
TO authenticated
USING (is_active = true);

-- Admins and educators can insert resources
CREATE POLICY "Allow admin/educator insert"
ON public.resources
FOR INSERT
TO authenticated
WITH CHECK (
  auth.role() IN ('admin', 'educator')
);

-- Admins and educators can update resources
CREATE POLICY "Allow admin/educator update"
ON public.resources
FOR UPDATE
TO authenticated
USING (auth.role() IN ('admin', 'educator'));

-- Admins and educators can delete resources
CREATE POLICY "Allow admin/educator delete"
ON public.resources
FOR DELETE
TO authenticated
USING (auth.role() IN ('admin', 'educator'));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

## Backend API Setup

### 4. Create Upload API Route

Create `app/api/resources/upload/route.ts`:

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or educator
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || !['admin', 'educator'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const teachingDate = formData.get('teachingDate') as string;
    const taughtBy = formData.get('taughtBy') as string;

    if (!file || !title || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${category}/${fileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resources')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('resources')
      .getPublicUrl(filePath);

    // Insert metadata into database
    const { data: resourceData, error: dbError } = await supabase
      .from('resources')
      .insert({
        title,
        description,
        category,
        file_name: file.name,
        file_path: filePath,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type || fileExt,
        teaching_date: teachingDate || null,
        taught_by: taughtBy || null,
        uploaded_by: session.user.id,
        uploaded_by_name: session.user.email
      })
      .select()
      .single();

    if (dbError) {
      // If database insert fails, delete the uploaded file
      await supabase.storage.from('resources').remove([filePath]);
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to save resource metadata' }, { status: 500 });
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
```

### 5. Create Fetch Resources API Route

Create `app/api/resources/route.ts`:

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('resources')
      .select('*')
      .eq('is_active', true)
      .order('upload_date', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,taught_by.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
    }

    return NextResponse.json({ resources: data });

  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 6. Create Download API Route (with tracking)

Create `app/api/resources/download/[id]/route.ts`:

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get resource metadata
    const { data: resource, error } = await supabase
      .from('resources')
      .select('file_path, downloads')
      .eq('id', id)
      .single();

    if (error || !resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Increment download counter
    await supabase
      .from('resources')
      .update({ downloads: (resource.downloads || 0) + 1 })
      .eq('id', id);

    // Generate signed URL (valid for 1 hour)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('resources')
      .createSignedUrl(resource.file_path, 3600);

    if (urlError || !signedUrlData) {
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 });
    }

    return NextResponse.json({ url: signedUrlData.signedUrl });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### c) Delete Resource (app/api/resources/delete/[id]/route.ts)

```typescript
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
```

## Frontend Integration

### 7. Update the Resources Page

Update `app/resources/page.tsx` to fetch from API instead of mock data:

```typescript
// Replace mockResources with API call
useEffect(() => {
  async function fetchResources() {
    try {
      const response = await fetch('/api/resources');
      const data = await response.json();
      setResources(data.resources);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    }
  }
  
  fetchResources();
}, []);
```

### 8. Update Upload Page

Update `app/resources/upload/page.tsx` in the `handleSubmit` function:

```typescript
const response = await fetch('/api/resources/upload', {
  method: 'POST',
  body: uploadData,
});

if (!response.ok) {
  throw new Error('Upload failed');
}

const result = await response.json();
```

## Environment Variables

Add to your `.env.local`:

```env
# Already have these from Supabase setup
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## File Size Limits

To handle large files (videos), you may need to:

1. **Increase Next.js body size limit** in `next.config.js`:
```javascript
module.exports = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
}
```

2. **Consider chunked uploads** for files > 50MB using Supabase's resumable upload API

## Security Considerations

1. **File Type Validation** - Always validate file types on the server
2. **File Size Limits** - Enforce maximum file sizes
3. **Virus Scanning** - Consider adding virus scanning for uploaded files
4. **Access Control** - Use RLS policies to control who can see what
5. **Signed URLs** - Use signed URLs instead of public URLs for sensitive content

## Cost Estimation

Supabase Storage pricing:
- **Free tier**: 1GB storage + 2GB bandwidth/month
- **Pro tier**: $25/month for 100GB storage + 200GB bandwidth
- **Additional**: $0.021/GB storage, $0.09/GB bandwidth

For reference:
- 100 PDF files (2MB each) = 200MB storage
- 10 video files (100MB each) = 1GB storage
- 1000 downloads/month of 2MB files = 2GB bandwidth

## Next Steps

1. Run the SQL scripts in Supabase SQL Editor
2. Create the storage bucket
3. Create the API routes
4. Update the frontend to use real data
5. Test upload/download functionality
6. Deploy and monitor usage

## Alternative Storage Options

If Supabase Storage doesn't meet your needs, consider:

1. **AWS S3** - Most popular, pay-as-you-go pricing
2. **Cloudflare R2** - No egress fees, cheaper for high bandwidth
3. **Azure Blob Storage** - Good if using Microsoft ecosystem
4. **Backblaze B2** - Very cheap storage, good for archival

But for your use case, **Supabase Storage is highly recommended** due to the seamless integration with your existing setup.

