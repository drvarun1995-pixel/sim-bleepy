# Certificate Storage Debug Guide

## 🔍 **Root Cause Identified**

The certificate generation is failing because:
1. ✅ Template data is saved to database correctly
2. ❌ **Template image files are NOT in storage** (only `.emptyFolderPlaceholder` exists)
3. ❌ Path extraction was wrong (now fixed)

## 🛠️ **Immediate Fixes Applied**

### 1. Fixed Path Extraction
**Before**: `certificates/template-images/filename.png` (wrong)
**After**: `template-images/filename.png` (correct)
**Fix**: Changed `slice(5)` to `slice(6)` in path extraction

### 2. Enhanced Storage Debugging
- Added comprehensive file checking
- Created `/api/test-storage` endpoint
- Enhanced console logging

## 🧪 **Testing Steps**

### 1. **Check Storage Contents**
Visit: `http://localhost:3000/api/test-storage`
**Expected**: Should show template files, not just `.emptyFolderPlaceholder`

### 2. **Re-upload Template Images**
1. Go to `/certificates/image-builder`
2. Create a new template with an image
3. Check if the image uploads successfully
4. Verify in Supabase Dashboard > Storage > certificates > template-images

### 3. **Test Certificate Generation**
1. Go to `/certificates/generate`
2. Select event and template
3. Check console for:
   ```
   ✅ Found template file: [filename]
   ✅ Certificate copied successfully: [path]
   ```

## 🔧 **Files Modified**

1. `lib/certificate-generator.ts` - Fixed path extraction (slice(6))
2. `app/api/test-storage/route.ts` - New test endpoint
3. `debug-analytics-api.sql` - Analytics debugging script

## 🚨 **If Still Failing**

### Template Images Missing
If template images are not in storage:
1. **Re-upload templates** - Go to image builder and re-save templates
2. **Check upload permissions** - Ensure service role can write to storage
3. **Check RLS policies** - Storage RLS might be blocking uploads

### Analytics Still Not Working
If analytics still shows limited users:
1. **Run debug script**: `debug-analytics-api.sql`
2. **Check RLS policies** on users table
3. **Verify API limits** - Check if pagination is still applied

## 📋 **Next Steps**

1. **Test storage access** with `/api/test-storage`
2. **Re-upload template images** if missing
3. **Test certificate generation** with detailed logs
4. **Run analytics debug script** if users still missing

The path extraction fix should resolve certificate generation once template images are properly stored.



