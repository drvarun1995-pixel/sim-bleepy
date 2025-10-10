# Bulk Upload with AI - Setup Checklist ✓

Use this checklist to verify your Bulk Upload with AI feature is ready to use.

---

## Prerequisites Checklist

### Environment Setup
- [ ] **OpenAI API Key added to `.env.local`**
  ```env
  OPENAI_API_KEY=sk-your-key-here
  ```
- [ ] **Restart development server** after adding environment variable
- [ ] **OpenAI account has billing enabled** (required for API usage)
- [ ] **Verify API key is valid** (test at platform.openai.com)

### Database Setup
- [ ] **Events table exists** in Supabase
- [ ] **Locations table exists** with some sample data
- [ ] **Speakers table exists** with some sample data
- [ ] **Categories table exists** with some sample data
- [ ] **Formats table exists** with some sample data
- [ ] **Organizers table exists** with some sample data
- [ ] **Event_speakers junction table exists**

### User Setup
- [ ] **Admin user account exists**
- [ ] **Can log in as admin**
- [ ] **Admin sees "Add Event" button** on events page

---

## Installation Verification

### Dependencies
Run these commands to verify:

```bash
# Check if packages are installed
npm list openai
npm list xlsx

# If missing, install them
npm install openai@^4.20.1 xlsx@^0.18.5
```

Expected output:
```
├── openai@4.20.1
└── xlsx@0.18.5
```

### Files Created
Verify these files exist in your project:

#### Pages
- [ ] `app/bulk-upload-ai/page.tsx` - Main bulk upload page

#### Components
- [ ] `components/BulkEventReview.tsx` - Review/edit interface

#### API Routes
- [ ] `app/api/events/bulk-upload-parse/route.ts` - File parsing with AI
- [ ] `app/api/events/bulk-upload-options/route.ts` - Fetch dropdown options
- [ ] `app/api/events/bulk-upload-create/route.ts` - Bulk event creation

#### Documentation
- [ ] `BULK_UPLOAD_AI_GUIDE.md` - Complete guide
- [ ] `BULK_UPLOAD_QUICK_START.md` - Quick start guide
- [ ] `BULK_UPLOAD_SETUP_CHECKLIST.md` - This checklist

### Modified Files
These files were updated to add navigation:

- [ ] `app/events/page.tsx` - Added "Bulk Upload with AI" button
- [ ] `app/event-data/page.tsx` - Added menu item and section

---

## Feature Access Testing

### Navigation
- [ ] **From Events page**: Click "Bulk Upload with AI" button → Navigates to `/bulk-upload-ai`
- [ ] **From Event Data page**: Click "Bulk Upload with AI" in sidebar → Shows feature info
- [ ] **Direct URL**: Navigate to `/bulk-upload-ai` → Page loads correctly
- [ ] **Non-admin users**: Cannot access the page (redirect to `/events`)

### UI Components
- [ ] **Step indicator** displays correctly (1-2-3 steps)
- [ ] **Info banner** shows feature description
- [ ] **Upload area** displays with drag-and-drop zone
- [ ] **Guidelines card** shows at bottom
- [ ] **Back button** works correctly

---

## Functionality Testing

### Basic Upload Test

Create a test Excel file with this content:

| Event Title | Date | Start Time | End Time |
|------------|------|------------|----------|
| Test Event 1 | 2025-12-01 | 10:00 | 12:00 |
| Test Event 2 | 2025-12-02 | 14:00 | 16:00 |

#### Test Steps:
1. [ ] **Upload test file** - No errors occur
2. [ ] **No emails detected** - Proceeds to processing
3. [ ] **AI processing** - Shows loading indicator
4. [ ] **Events extracted** - Shows 2 events in review
5. [ ] **Edit event** - Can modify event details
6. [ ] **Delete event** - Can remove unwanted event
7. [ ] **Continue to confirmation** - Shows final review
8. [ ] **Create events** - Successfully creates in database
9. [ ] **Redirect to events page** - Shows success message
10. [ ] **Verify events** - Events appear in calendar

### Email Detection Test

Create a test file with email addresses:

```
Event: Test Workshop
Date: 2025-12-01
Contact: john@example.com
```

#### Test Steps:
1. [ ] **Upload file with emails** - Detects email addresses
2. [ ] **Warning dialog appears** - Shows detected emails
3. [ ] **"Auto Remove" option** - Sanitizes and continues
4. [ ] **"Cancel" option** - Cancels upload successfully

### Edge Cases
- [ ] **Large file (>10MB)** - Shows error message
- [ ] **Invalid file type (.txt)** - Shows error message
- [ ] **Empty file** - Shows "No events found" message
- [ ] **Corrupted file** - Shows error message gracefully
- [ ] **Missing API key** - Shows error in console/logs

---

## Database Testing

### Before Upload
```sql
-- Check current event count
SELECT COUNT(*) FROM events;
```
- [ ] **Note the count** - Record current number

### After Upload
```sql
-- Check new event count
SELECT COUNT(*) FROM events;

-- View latest events
SELECT id, title, date, start_time, status
FROM events
ORDER BY created_at DESC
LIMIT 5;
```
- [ ] **Count increased** - New events added
- [ ] **Events have correct data** - Title, date, time populated
- [ ] **Status is "published"** - Events are visible
- [ ] **Author is set correctly** - Your admin user ID

### Speaker Junction
```sql
-- Check if speakers are linked (if you added speakers during review)
SELECT e.title, s.name
FROM events e
JOIN event_speakers es ON e.id = es.event_id
JOIN speakers s ON es.speaker_id = s.id
WHERE e.title LIKE 'Test%';
```
- [ ] **Speakers linked correctly** - If you added speakers

---

## API Endpoint Testing

### Parse Endpoint
```bash
# Test file parsing (use curl or Postman)
curl -X POST http://localhost:3000/api/events/bulk-upload-parse \
  -H "Cookie: your-session-cookie" \
  -F "file=@test.xlsx" \
  -F "autoDeleteEmails=false"
```
- [ ] **Returns 401** - If not authenticated
- [ ] **Returns 200** - With valid session and file
- [ ] **Returns events array** - In response JSON

### Options Endpoint
```bash
# Test options fetching
curl http://localhost:3000/api/events/bulk-upload-options?type=locations
```
- [ ] **Returns locations array** - From database

### Create Endpoint
```bash
# Test bulk creation
curl -X POST http://localhost:3000/api/events/bulk-upload-create \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"events": [{"title": "Test", "date": "2025-12-01", "startTime": "10:00"}]}'
```
- [ ] **Creates event** - In database
- [ ] **Returns success** - With created count

---

## Performance Testing

### Upload Performance
- [ ] **Small file (5 events)** - Completes in < 10 seconds
- [ ] **Medium file (20 events)** - Completes in < 20 seconds
- [ ] **Large file (50 events)** - Completes in < 40 seconds

### UI Responsiveness
- [ ] **Progress indicator** - Shows during processing
- [ ] **No UI freezing** - Interface remains responsive
- [ ] **Review page** - Loads smoothly with many events
- [ ] **Edit forms** - Open/close without lag

---

## Security Testing

### Authentication
- [ ] **Logged out users** - Redirected to login
- [ ] **Non-admin users** - Cannot access feature
- [ ] **Admin users** - Full access granted

### Input Validation
- [ ] **File type validation** - Rejects invalid types
- [ ] **File size validation** - Rejects oversized files
- [ ] **Event data validation** - Requires title, date, time
- [ ] **SQL injection** - Protected by Supabase
- [ ] **XSS protection** - React escapes by default

### Privacy
- [ ] **Email detection works** - Catches email patterns
- [ ] **Email sanitization works** - Removes emails when requested
- [ ] **No file storage** - Files processed in memory only
- [ ] **No data leakage** - User can only see their own uploads

---

## Production Readiness

### Environment Variables
- [ ] **OPENAI_API_KEY** - Set in production environment
- [ ] **NEXT_PUBLIC_SUPABASE_URL** - Configured
- [ ] **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Configured
- [ ] **NEXTAUTH_SECRET** - Set for production

### Monitoring
- [ ] **OpenAI usage dashboard** - Monitor costs
- [ ] **Error logging** - Check server logs
- [ ] **Database monitoring** - Watch for issues
- [ ] **API rate limits** - Monitor OpenAI rate limits

### Documentation
- [ ] **Team training** - Staff knows how to use feature
- [ ] **User guide shared** - Documentation accessible
- [ ] **Support process** - Handle user questions

---

## Optional Enhancements (Future)

If you want to enhance the feature later:

### Better File Parsing
```bash
# Install enhanced parsing libraries
npm install pdf-parse mammoth
```

Then update the parsing functions in `bulk-upload-parse/route.ts` to use these libraries.

### Custom AI Prompts
Edit the prompt in `bulk-upload-parse/route.ts` to customize AI behavior.

### Duplicate Detection
Add logic to check for duplicate events before creation.

### Scheduled Uploads
Implement a queue system for processing large files in background.

---

## Troubleshooting Guide

### Common Issues

#### ❌ "Cannot find module 'openai'"
```bash
# Solution
npm install openai@^4.20.1
```

#### ❌ "OPENAI_API_KEY is not defined"
```bash
# Solution
1. Add to .env.local: OPENAI_API_KEY=sk-...
2. Restart dev server: npm run dev
```

#### ❌ "Insufficient credits"
- Check OpenAI billing at platform.openai.com
- Add payment method if needed

#### ❌ "Failed to parse Excel"
- Ensure xlsx package is installed
- Check file isn't password protected
- Try re-exporting the file

#### ❌ "No events extracted"
- Check file format matches examples
- Ensure dates are recognizable
- Add more context to your file

---

## Success Criteria

Your Bulk Upload with AI feature is ready when:

✅ All checklist items are complete  
✅ Test upload works end-to-end  
✅ Events appear in calendar  
✅ No console errors  
✅ Email detection works  
✅ Admin-only access enforced  
✅ Documentation is accessible  

---

## Next Steps

Once everything is checked:

1. **Train your team** on using the feature
2. **Share the Quick Start guide** with admins
3. **Monitor OpenAI costs** for first few uploads
4. **Gather feedback** from users
5. **Iterate and improve** based on usage

---

## Support Resources

- **Full Documentation**: `BULK_UPLOAD_AI_GUIDE.md`
- **Quick Start**: `BULK_UPLOAD_QUICK_START.md`
- **OpenAI Status**: https://status.openai.com
- **Supabase Status**: https://status.supabase.com

---

**🎉 Congratulations!** Your Bulk Upload with AI feature is ready to use!

*Last Updated: October 2025*

