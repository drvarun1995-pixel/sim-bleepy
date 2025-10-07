# Testing Large File Upload Fix

## Overview
This document provides step-by-step instructions for testing the large file upload fix that resolves the "JSON.parse: unexpected character at line 1 column 1" error.

## Files Changed

### Backend
- ✅ `app/api/resources/upload/route.ts` - Added route config for large uploads, fixed MIME type handling
- ✅ `vercel.json` - Added Vercel configuration for production deployments

### Frontend
- ✅ `app/resources/upload/page.tsx` - Improved error handling, added progress tracking
- ✅ `utils/apiHelpers.ts` - New utility functions for safe API calls (NEW FILE)

### Documentation
- ✅ `LARGE_FILE_UPLOAD_FIX.md` - Comprehensive fix documentation (NEW FILE)
- ✅ `TESTING_UPLOAD_FIX.md` - This testing guide (NEW FILE)

## Test Cases

### Test 1: Small File Upload (< 5MB)
**Purpose**: Verify basic functionality still works

**Steps:**
1. Navigate to `/resources/upload`
2. Select a PDF or image file under 5MB
3. Fill in required fields (title, format)
4. Click "Upload Resource"

**Expected Results:**
- Upload completes within seconds
- Progress bar shows 100%
- Success message appears
- Redirects to resources page
- File appears in resources list

---

### Test 2: Medium File Upload (5-20MB)
**Purpose**: Test improved handling of moderately large files

**Steps:**
1. Navigate to `/resources/upload`
2. Select a PowerPoint or video file between 5-20MB
3. Fill in required fields
4. Click "Upload Resource"
5. Watch progress bar

**Expected Results:**
- Upload completes within 30-60 seconds
- Progress bar updates smoothly (0% → 100%)
- No JSON parse errors
- Success message appears
- File uploads successfully

---

### Test 3: Large File Upload (20-50MB)
**Purpose**: Test the main fix for large files

**Steps:**
1. Navigate to `/resources/upload`
2. Select a video or large presentation file (20-50MB)
3. Fill in all fields
4. Click "Upload Resource"
5. Monitor progress bar (upload may take 1-3 minutes)

**Expected Results:**
- Upload starts without immediate error
- Progress bar shows incremental progress
- No "JSON.parse" error appears
- Upload completes successfully after 1-3 minutes
- File is accessible in resources

---

### Test 4: File Too Large (> 50MB)
**Purpose**: Verify size limit enforcement

**Steps:**
1. Navigate to `/resources/upload`
2. Select a file larger than 50MB
3. Fill in required fields
4. Click "Upload Resource"

**Expected Results:**
- Clear error message: "File size exceeds 50MB limit"
- Upload does not start
- User is prompted to use smaller file
- No JavaScript errors in console

---

### Test 5: Network Error Simulation
**Purpose**: Test error handling for network issues

**Steps:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Enable "Offline" mode OR use throttling
4. Navigate to `/resources/upload`
5. Try uploading a file

**Expected Results:**
- Clear error message about network error
- No JSON parse errors
- User-friendly message appears
- Upload can be retried

---

### Test 6: Server Error Simulation
**Purpose**: Verify graceful handling of server errors

**Steps:**
1. Temporarily break the backend (e.g., invalid Supabase credentials)
2. Navigate to `/resources/upload`
3. Try uploading a file

**Expected Results:**
- No JSON parse error
- Clear error message about upload failure
- Error logged in console with details
- Page remains functional

---

## Browser Testing

Test in multiple browsers to ensure compatibility:

- [ ] Google Chrome (recommended)
- [ ] Mozilla Firefox
- [ ] Microsoft Edge
- [ ] Safari (Mac only)

## Device Testing

Test on different devices:

- [ ] Desktop/Laptop
- [ ] Tablet
- [ ] Mobile phone (responsive design)

## Performance Checks

### Upload Speed Benchmarks
Test on different connection speeds:

| Connection Speed | File Size | Expected Time |
|-----------------|-----------|---------------|
| Fast (50+ Mbps) | 10 MB     | < 15 seconds  |
| Fast (50+ Mbps) | 50 MB     | < 60 seconds  |
| Medium (10 Mbps)| 10 MB     | < 30 seconds  |
| Medium (10 Mbps)| 50 MB     | 2-3 minutes   |
| Slow (1-5 Mbps) | 10 MB     | 1-2 minutes   |
| Slow (1-5 Mbps) | 50 MB     | 5-10 minutes  |

### Memory Usage
Monitor browser memory during large uploads:
1. Open DevTools > Performance tab
2. Start recording
3. Upload 50MB file
4. Stop recording after upload completes
5. Check for memory leaks or spikes

## Supabase Storage Verification

After successful uploads, verify in Supabase:

1. Go to Supabase Dashboard
2. Navigate to Storage > resources bucket
3. Confirm files are present with correct paths
4. Check file sizes match uploaded files
5. Try downloading files via signed URLs

## Database Verification

After uploads, check database entries:

```sql
-- Check recent uploads
SELECT 
  id, 
  title, 
  file_name, 
  file_size, 
  file_type,
  upload_date
FROM resources
ORDER BY upload_date DESC
LIMIT 10;
```

Expected results:
- Entries match uploaded files
- file_size matches actual file size
- file_path contains correct storage path
- All metadata fields populated correctly

## Error Log Monitoring

### Browser Console
Check for:
- ✅ No "JSON.parse" errors
- ✅ No uncaught exceptions
- ⚠️ Expected: Upload progress logs
- ⚠️ Expected: Success/error messages

### Server Logs (Vercel/hosting)
Check for:
- ✅ No 413 (Payload Too Large) errors
- ✅ No timeout errors
- ✅ Successful upload confirmations
- ⚠️ Expected: File upload logs

## Regression Testing

Ensure other features still work:

- [ ] Resources listing page loads
- [ ] Resource filtering by category
- [ ] Resource search functionality
- [ ] Resource download/view
- [ ] Resource editing (admin/educator)
- [ ] Resource deletion (admin/educator)
- [ ] Event linking to resources

## Edge Cases

### Test Edge Case 1: Special Characters in Filename
- Upload file with special characters: `Test File (2024) #1.pdf`
- Verify filename is handled correctly

### Test Edge Case 2: Long Filename
- Upload file with very long name (>100 characters)
- Verify truncation or full name storage

### Test Edge Case 3: Duplicate Upload
- Upload same file twice
- Verify unique filenames are generated

### Test Edge Case 4: Upload Interruption
- Start upload of large file
- Close browser/tab during upload
- Verify no partial files remain in storage

### Test Edge Case 5: Multiple Simultaneous Uploads
- Open multiple tabs
- Try uploading files simultaneously
- Verify all uploads complete or queue properly

## Known Limitations

### Current System Limits
- Maximum file size: 50MB (configurable)
- Maximum timeout: 5 minutes (300 seconds)
- Supported formats: PDF, DOC, DOCX, PPT, PPTX, MP4, AVI, MOV, JPG, PNG
- Supabase free tier: 1GB total storage

### Vercel Deployment Limits
- **Free tier**: 10 second timeout (NOT suitable for large uploads)
- **Pro tier**: 300 second timeout (required for 20MB+ files)
- **Enterprise tier**: Custom limits

**Note**: If deploying to Vercel, you MUST be on Pro or higher plan for large file uploads.

## Troubleshooting

### Issue: "JSON.parse" error still appears
**Cause**: Response is not JSON
**Fix**: Check server logs for actual error, may need to increase timeouts

### Issue: Upload timeout
**Cause**: File too large or slow connection
**Fix**: 
1. Use smaller file
2. Increase `maxDuration` in route.ts
3. Check network connection

### Issue: 413 Request Entity Too Large
**Cause**: Proxy/CDN body size limit
**Fix**: Configure nginx/CloudFlare settings if using reverse proxy

### Issue: Progress bar stuck at 0%
**Cause**: Upload hasn't started or XHR not reporting progress
**Fix**: Check browser console, may need to refresh page

### Issue: Upload succeeds but file not in Supabase
**Cause**: Database transaction issue
**Fix**: Check database logs, verify RLS policies

## Success Criteria

All tests pass when:
- ✅ Files up to 50MB upload successfully
- ✅ No "JSON.parse" errors occur
- ✅ Progress bar updates correctly
- ✅ Clear error messages for failures
- ✅ Files appear in Supabase storage
- ✅ Database entries created correctly
- ✅ All regression tests pass
- ✅ Works across major browsers
- ✅ Mobile responsive

## Reporting Issues

If any test fails, report with:
1. Test case number
2. Browser and version
3. File size and type
4. Error message (screenshot)
5. Browser console logs
6. Server logs (if accessible)

## Next Steps After Testing

Once all tests pass:
1. Commit changes to git
2. Deploy to staging environment
3. Run full test suite on staging
4. Monitor production logs after deployment
5. Gather user feedback

## Contact

For questions about testing:
- Check LARGE_FILE_UPLOAD_FIX.md for technical details
- Review code comments in changed files
- Check Supabase dashboard for storage issues

