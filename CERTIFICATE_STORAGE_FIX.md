# Certificate Generation Storage Fix

## 🔍 **Root Cause Identified**

From the terminal logs, the issue is clear:
1. ✅ Template is fetched correctly from database
2. ✅ Template has `image_path` field with signed URL
3. ❌ **Source file path extraction is wrong**
4. ❌ **Template file doesn't exist at the extracted path**

## 🛠️ **Fixes Applied**

### 1. Fixed Path Extraction
**Problem**: `pathSegments.slice(5)` was removing too many segments
**Fix**: Changed to `pathSegments.slice(4)` to get correct path

**Before**: `certificates/template-images/filename.png` (wrong)
**After**: `template-images/filename.png` (correct)

### 2. Enhanced File Checking
**Problem**: Source file check was using wrong path
**Fix**: Check in `template-images` folder with filename search

### 3. Analytics User Limit Fix
**Problem**: API was still applying pagination limits
**Fix**: Allow unlimited users for analytics (limit < 2000)

## 🧪 **Testing Steps**

### 1. Test Storage Access
Visit: `http://localhost:3000/api/test-storage`
This will show all files in the template-images folder.

### 2. Test Certificate Generation
1. Go to `/certificates/generate`
2. Select an event and template
3. Check console logs for:
   ```
   ✅ Found template file: [filename]
   ✅ Certificate copied successfully: [path]
   ```

### 3. Test Analytics
1. Go to `/analytics`
2. Check if all 53 users are now visible
3. Look for user `VT334@student.aru.ac.uk`

## 🔧 **Files Modified**

1. `lib/certificate-generator.ts` - Fixed path extraction and file checking
2. `app/api/admin/users/route.ts` - Removed pagination for analytics
3. `app/api/test-storage/route.ts` - New test endpoint for storage

## 📋 **Expected Results**

After these fixes:
- ✅ Certificate generation should work
- ✅ All 53 users should appear in analytics
- ✅ Template files should be found and copied successfully

## 🚨 **If Still Failing**

If certificate generation still fails, check:
1. **Storage bucket permissions** - Ensure service role can access certificates bucket
2. **Template file existence** - Use `/api/test-storage` to verify files exist
3. **RLS policies** - Check if storage RLS is blocking the service role

The detailed console logs will now show exactly where the process fails.

