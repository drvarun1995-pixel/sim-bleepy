# Large File Upload Fix

## Issue
When uploading large files (>10MB), users encountered the error:
```
JSON.parse: unexpected character at line 1 column 1 of the JSON data
```

## Root Causes

1. **Next.js/Vercel Body Size Limits**: By default, serverless functions have limited request body sizes and timeouts
2. **Poor Error Handling**: When the server returned non-JSON responses (like HTML error pages), the frontend tried to parse them as JSON
3. **MIME Type Issues**: Removed MIME type restrictions in Supabase that could cause conflicts

## Fixes Applied

### 1. Backend Route Configuration (`app/api/resources/upload/route.ts`)

Added route segment config to handle large uploads:
```typescript
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes timeout for large files
```

**Changes:**
- Increased timeout to 5 minutes (300 seconds) to handle large file uploads
- Set runtime to nodejs for better memory handling
- Convert File to ArrayBuffer before upload to avoid MIME type issues

### 2. Frontend Error Handling (`app/resources/upload/page.tsx`)

Improved error handling to check response content type before parsing:
```typescript
// Check if response is actually JSON before parsing
const contentType = response.headers.get('content-type');
let result;

if (contentType && contentType.includes('application/json')) {
  result = await response.json();
} else {
  // Response is not JSON (probably an error page)
  const text = await response.text();
  console.error('Non-JSON response:', text);
  throw new Error(
    response.status === 413 
      ? 'File is too large to upload. Please try a smaller file or contact support.' 
      : `Upload failed with status ${response.status}. The server returned an unexpected response.`
  );
}
```

**Benefits:**
- Prevents JSON parse errors when server returns HTML error pages
- Provides clear, user-friendly error messages
- Handles 413 (Payload Too Large) errors specifically

### 3. Vercel Configuration (`vercel.json`)

Created Vercel configuration for production deployments:
```json
{
  "functions": {
    "app/api/resources/upload/route.ts": {
      "maxDuration": 300,
      "memory": 1024
    }
  }
}
```

**Note:** This configuration only applies when deploying to Vercel. The `maxDuration` of 300 seconds requires a Pro plan or higher.

### 4. Removed MIME Type Dependency

The upload now uses ArrayBuffer instead of File blob, avoiding MIME type validation issues:
```typescript
// Convert File to ArrayBuffer for upload
const fileBuffer = await file.arrayBuffer();

// Upload without contentType to avoid MIME type issues
const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
  .from('resources')
  .upload(filePath, fileBuffer, {
    cacheControl: '3600',
    upsert: false
  });
```

## Current File Size Limits

- **Frontend validation**: 50MB (configurable in upload route)
- **Backend timeout**: 5 minutes
- **Supabase Storage**: Depends on your plan (typically 5GB max per file)

## Testing Recommendations

1. **Small files (<5MB)**: Should upload instantly
2. **Medium files (5-20MB)**: Should upload within 30 seconds
3. **Large files (20-50MB)**: May take 1-3 minutes depending on connection
4. **Very large files (>50MB)**: Currently blocked, but can be increased

## To Increase File Size Limit

If you need to support files larger than 50MB:

1. Update the size check in `app/api/resources/upload/route.ts`:
```typescript
const maxSize = 100 * 1024 * 1024; // Change to 100MB
if (file.size > maxSize) {
  return NextResponse.json({ error: 'File size exceeds 100MB limit' }, { status: 400 });
}
```

2. Update the UI guidance in `app/resources/upload/page.tsx` (line 533):
```typescript
<li>• Maximum file size: 100 MB</li>
```

3. Consider implementing chunked uploads for files >100MB using Supabase's resumable upload API

## Deployment Notes

### Vercel
- Free tier: Maximum 10 second timeout (not suitable for large files)
- Pro tier: Maximum 300 seconds timeout
- You may need to upgrade to Pro for large file uploads

### Self-Hosted (Docker/VPS)
- No built-in timeout limits
- Configure nginx/Apache upload limits if using reverse proxy
- Ensure sufficient disk space for temporary file storage

## Alternative Solutions for Very Large Files

If you frequently need to upload files >100MB, consider:

1. **Chunked Uploads**: Split files into smaller chunks and upload sequentially
2. **Direct to S3**: Use pre-signed URLs to upload directly from client to storage
3. **Resumable Uploads**: Implement Supabase's resumable upload API
4. **External Transfer**: Use services like WeTransfer for very large files

## Supabase Storage Configuration

Make sure your Supabase storage bucket is configured correctly:

1. Go to Supabase Dashboard > Storage > resources bucket
2. Ensure the bucket exists and is accessible
3. Check that RLS policies allow uploads from admins/educators:
```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

## Monitoring Upload Success

You can monitor uploads in:
1. **Browser DevTools**: Network tab to see upload progress
2. **Supabase Dashboard**: Storage > resources bucket > Files
3. **Database**: Check `resources` table for metadata entries
4. **Server Logs**: Check Vercel/hosting platform logs for errors

## Support

If you continue to experience upload issues:
1. Check browser console for detailed error messages
2. Verify Supabase storage bucket permissions
3. Test with smaller files to isolate the issue
4. Check your Vercel plan limits (if using Vercel)
5. Monitor network connectivity during upload

