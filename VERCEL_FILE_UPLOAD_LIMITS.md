# Vercel File Upload Limits - Issue & Solutions

## 🚨 Problem: Files >4.5MB Rejected Despite Code Allowing 50MB

### Issue Description
Users uploading files larger than ~4-5MB receive an error saying the file is too large, even though the code is configured to allow up to 50MB uploads.

**Root Cause:** Vercel has platform-specific payload size limits that override your application code settings:
- **Free Tier**: 4.5MB maximum request body size
- **Pro Tier**: Can be increased but requires proper configuration
- **Enterprise Tier**: Even higher limits available

Your 32MB file is being rejected at the **Vercel platform level** before it even reaches your Next.js API route.

---

## ✅ Solution 1: Upgrade to Vercel Pro (Recommended for Ease)

### If You Have Vercel Pro Plan

1. **Update `vercel.json`** (already done):
```json
{
  "functions": {
    "app/api/resources/upload/route.ts": {
      "maxDuration": 300,
      "memory": 3008
    }
  },
  "maxDuration": 300
}
```

2. **Contact Vercel Support** to increase body size limit:
   - Go to https://vercel.com/support
   - Request: "Increase request body size limit to 100MB for file uploads"
       - Mention your project: `bleepy`
   - They typically approve within 24 hours

3. **Re-deploy after approval**:
```bash
vercel --prod
```

### Cost
- Vercel Pro: $20/month per user
- Body size increase: Included in Pro plan

---

## ✅ Solution 2: Direct-to-Storage Uploads (Works on Free Tier)

### Overview
Instead of uploading through your API route (which has Vercel limits), upload **directly from the browser to Supabase Storage** using signed URLs.

### Benefits
- ✅ Works on Vercel Free tier
- ✅ No 4.5MB limit
- ✅ Faster uploads (browser → storage directly)
- ✅ Less server load
- ❌ More complex implementation

### Implementation Steps

#### Step 1: Create Signed Upload URL API
Create `app/api/resources/upload-url/route.ts`:

```typescript
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
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (!profile || !['admin', 'educator'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { fileName, fileType, category } = await request.json();

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
      return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      filePath
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### Step 2: Create Metadata Save API
Create `app/api/resources/save-metadata/route.ts`:

```typescript
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

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const {
      title,
      description,
      category,
      fileName,
      filePath,
      fileSize,
      fileType,
      teachingDate,
      taughtBy,
      eventIds
    } = await request.json();

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('resources')
      .getPublicUrl(filePath);

    // Insert metadata
    const { data: resourceData, error: dbError } = await supabaseAdmin
      .from('resources')
      .insert({
        title,
        description: description || null,
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
      // Delete uploaded file if metadata save fails
      await supabaseAdmin.storage.from('resources').remove([filePath]);
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to save metadata' }, { status: 500 });
    }

    // Link to events
    if (eventIds && eventIds.length > 0 && resourceData?.id) {
      const eventAssociations = eventIds.map((eventId: string) => ({
        resource_id: resourceData.id,
        event_id: eventId
      }));

      await supabaseAdmin
        .from('resource_events')
        .insert(eventAssociations);
    }

    return NextResponse.json({ success: true, resource: resourceData });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### Step 3: Update Frontend Upload Logic
In `app/resources/upload/page.tsx`, replace the upload function:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!formData.file) {
    setUploadError('Please select a file to upload');
    return;
  }

  setIsUploading(true);
  setUploadError(null);
  setUploadProgress(0);

  try {
    // Step 1: Get signed upload URL
    const urlResponse = await fetch('/api/resources/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: formData.file.name,
        fileType: formData.file.type,
        category: formData.category
      })
    });

    if (!urlResponse.ok) {
      throw new Error('Failed to get upload URL');
    }

    const { signedUrl, token, path, filePath } = await urlResponse.json();

    // Step 2: Upload file directly to Supabase Storage
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(progress);
      }
    });

    const uploadPromise = new Promise((resolve, reject) => {
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) resolve(xhr.response);
        else reject(new Error(`Upload failed: ${xhr.status}`));
      });
      xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));
    });

    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('Content-Type', formData.file.type);
    xhr.send(formData.file);

    await uploadPromise;

    // Step 3: Save metadata to database
    const metadataResponse = await fetch('/api/resources/save-metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        fileName: formData.file.name,
        filePath: filePath,
        fileSize: formData.file.size,
        fileType: formData.file.type,
        teachingDate: formData.teachingDate,
        taughtBy: formData.taughtBy,
        eventIds: Array.from(selectedEventIds)
      })
    });

    if (!metadataResponse.ok) {
      throw new Error('Failed to save resource metadata');
    }

    setUploadSuccess(true);
    setTimeout(() => router.push('/resources'), 2000);

  } catch (error: any) {
    console.error('Upload error:', error);
    setUploadError(error.message || 'Failed to upload file');
  } finally {
    setIsUploading(false);
    setUploadProgress(0);
  }
};
```

---

## 🔄 Solution 3: Chunked Uploads (Most Robust)

### For files >100MB or slow connections

Implement chunked uploads that split large files into smaller pieces:

1. Split file into 5MB chunks
2. Upload each chunk sequentially  
3. Reassemble on server or use Supabase resumable uploads

**Reference:** Supabase Resumable Uploads
- https://supabase.com/docs/guides/storage/uploads/resumable-uploads

---

## 📋 Quick Fix Decision Tree

```
Is your file > 4.5MB?
├─ Yes → Are you on Vercel Pro?
│   ├─ Yes → Solution 1 (Contact Vercel Support)
│   └─ No → Solution 2 (Direct-to-Storage)
└─ No → Current implementation should work
```

---

## 🧪 Testing After Implementation

### Test with Different File Sizes:

```bash
# Test small file (< 4.5MB)
✅ Should work on all solutions

# Test medium file (5-50MB)  
❌ Solution 1 only (after Vercel approval)
✅ Solution 2 (Direct-to-Storage)
✅ Solution 3 (Chunked)

# Test large file (50-100MB)
✅ Solution 2 or 3 with increased limits

# Test very large file (> 100MB)
✅ Solution 3 (Chunked) only
```

---

## 💡 Recommended Approach

**For your 32MB file:**

1. **Quick Fix (Today)**: Implement Solution 2 (Direct-to-Storage)
   - Works immediately on free tier
   - No waiting for Vercel support
   - Better performance

2. **Long-term**: Consider Vercel Pro if you need other Pro features
   - But still use direct-to-storage for best performance

---

## 📞 Support

If you need help implementing any solution:
1. Check browser console for detailed errors
2. Test with smaller files first (<4.5MB) to isolate the issue
3. Verify Supabase storage permissions
4. Check network tab for actual payload sizes

---

**Current Status:**
- ✅ Code supports 50MB
- ❌ Vercel Free tier blocks at 4.5MB
- ⚠️ Your 32MB file needs Solution 2 or upgrading to Pro + approval


