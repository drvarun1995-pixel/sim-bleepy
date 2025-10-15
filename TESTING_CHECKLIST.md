# Comprehensive Testing Checklist for RLS Security Fix

## Overview

This checklist ensures that all 44 Supabase security errors are fixed AND that none of the 6 previous bugs have returned. Follow this systematically to verify the fix is complete and safe.

**Estimated Time:** 40 minutes for full test, 2 minutes for quick smoke test

---

## Quick Smoke Test (2 Minutes)

If you're short on time, run these 3 critical tests:

### ✅ Test 1: Database Verification
```sql
-- Run verify-rls-enabled.sql in Supabase SQL Editor
-- Expected: All 21 tables show "✅ Enabled"
```
- [ ] All tables have RLS enabled
- [ ] Supabase Security Advisor shows 0 errors (was 44)

### ✅ Test 2: Critical Bug Check
1. **Organizer Deletion:**
   - Edit any event, remove an organizer, save, refresh
   - [ ] Organizer stays removed (was reverting before)

2. **Educator Upload:**
   - Login as educator, try uploading a resource
   - [ ] Upload works (was completely blocked before)

3. **Leaderboard:**
   - View leaderboard as any user
   - [ ] Shows multiple users (was empty before)

### ✅ Test 3: Role Access
- [ ] Login as each role → Can access appropriate features
- [ ] No "permission denied" errors in console

**If all 3 pass, the fix is working correctly!**

---

## Full Testing Suite (40 Minutes)

### Phase 1: Database Verification (2 minutes)

#### Test 1.1: Verify RLS Enabled

**Steps:**
1. Open Supabase Dashboard → SQL Editor
2. Copy and run `verify-rls-enabled.sql`
3. Review the output

**Expected Results:**
```
RLS Status for All Tables
✅ Enabled for all 21 tables
Policy Count: 1+ for each table
Status: ✅ OK for all tables

Summary:
Total Tables Checked: 21
Tables with RLS Enabled: 21
Tables with RLS DISABLED: 0
```

**Checklist:**
- [ ] All 21 tables show "✅ Enabled"
- [ ] Each table has at least 1 policy
- [ ] No tables show "❌ RLS DISABLED"
- [ ] No tables show "⚠️ NO POLICIES"

**If This Fails:** Re-run `migrations/fix-supabase-security-advisor.sql`

---

#### Test 1.2: Check Supabase Security Advisor

**Steps:**
1. Go to Supabase Dashboard
2. Navigate to Database → Advisors
3. Check the security advisor section

**Expected Results:**
- [ ] **0 errors** (was 44 errors before)
- [ ] No "Policy Exists RLS Disabled" errors
- [ ] No "RLS Disabled in Public" errors
- [ ] No "Security Definer View" errors

**Screenshot:** Take a screenshot showing 0 errors for documentation

**If This Fails:** Check which specific tables/views still have issues

---

#### Test 1.3: Verify Views Fixed

**Steps:**
```sql
-- Run in Supabase SQL Editor
SELECT viewname, viewowner 
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname IN ('events_with_details', 'categories_with_counts', 'formats_with_counts');
```

**Expected Results:**
- [ ] All 3 views exist
- [ ] No SECURITY DEFINER warnings in Security Advisor

**If This Fails:** Re-run `migrations/fix-security-definer-views.sql`

---

### Phase 2: Previous Bug Regression Tests (15 minutes)

These tests verify that the 6 bugs that forced RLS to be dropped are now fixed.

#### Test 2.1: Organizer Deletion (Bug #2 - HIGH PRIORITY)

**Historical Issue:** Organizers couldn't be deleted from events. Deletions appeared successful but reverted on page refresh. This was caused by RLS blocking DELETE operations on junction tables.

**Test Steps:**
1. Login as **Admin** user
2. Navigate to `/event-data`
3. Click "All Events" tab
4. Find an event with multiple organizers
5. Click "Edit" on that event
6. Scroll to "Other Organizers" section
7. Click the **X** button to remove one organizer
8. Click "Update Event" button
9. **Wait for success message to appear**
10. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
11. Click "Edit" on the same event again
12. Check the organizers list

**Expected Results:**
- [ ] Organizer removal succeeds without errors
- [ ] Success message appears: "Event updated successfully"
- [ ] After refresh, organizer is still removed
- [ ] No "permission denied" errors in browser console
- [ ] No revert to previous state
- [ ] Junction table delete worked

**Browser Console Check:**
- [ ] No errors mentioning "RLS"
- [ ] No errors mentioning "permission denied"
- [ ] No errors mentioning "event_organizers"

**If This Fails:**
- Check `event_organizers` table has RLS enabled
- Check service role policy exists on `event_organizers`
- Check browser console for specific error
- Check Supabase logs (Dashboard → Logs → Database)

---

#### Test 2.2: Educator Resource Upload (Bug #3 - HIGH PRIORITY)

**Historical Issue:** Educator role was completely blocked from uploading resources. RLS policies were too restrictive and only allowed admin role.

**Test Steps:**
1. Login as **Educator** user
2. Navigate to `/resources` or educator dashboard
3. Click "Upload Resource" or similar button
4. Fill in resource details:
   - Title
   - Description
   - Category
   - File upload
5. Submit the form

**Expected Results:**
- [ ] Upload form is accessible (not hidden/disabled)
- [ ] All form fields are editable
- [ ] File upload works without errors
- [ ] Form submission succeeds
- [ ] Success message appears
- [ ] Resource appears in the resource list
- [ ] Educator can see their uploaded resource
- [ ] No "permission denied" errors
- [ ] No "forbidden" errors (403)

**Browser Console Check:**
- [ ] No RLS policy violation errors
- [ ] No "permission denied for table resources"
- [ ] API call to `/api/resources` succeeds (status 200)

**If This Fails:**
- Check `resources` table has RLS enabled
- Check service role policy exists on `resources`
- Check API route `/api/resources` authorization logic
- Verify educator role is in permission helpers

---

#### Test 2.3: Leaderboard Display (Bug #4 - MEDIUM PRIORITY)

**Historical Issue:** Leaderboard showed empty or only current user's data. RLS policies blocked cross-user data reads needed for leaderboard display.

**Test Steps:**
1. Login as any user (Student role is fine)
2. Navigate to the leaderboard page
3. Check the displayed data

**Expected Results:**
- [ ] Leaderboard shows multiple users (at least 3-5 users)
- [ ] Shows usernames for all users
- [ ] Shows XP/points for all users
- [ ] Shows levels/ranks for all users
- [ ] Not just showing current user
- [ ] Sorted correctly by XP or level
- [ ] No "no data available" message
- [ ] No "permission denied" errors

**Data Verification:**
```sql
-- Run in Supabase SQL Editor to verify data exists
SELECT user_id, level, total_xp, current_xp 
FROM user_levels 
ORDER BY total_xp DESC 
LIMIT 10;
```
- [ ] Query returns multiple users
- [ ] Data matches what's shown on leaderboard

**If This Fails:**
- Check `user_levels` has public read policy
- Check `user_achievements` has public read policy
- Check leaderboard API endpoint
- Verify service role policy exists

---

#### Test 2.4: New Roles Access (Bug #5 - MEDIUM PRIORITY)

**Historical Issue:** When MedEd Team and CTF roles were added, they were completely blocked because RLS policies were hardcoded for old roles only.

**Test 2.4a: MedEd Team User**

**Test Steps:**
1. Login as **MedEd Team** user
2. Navigate to `/bulk-upload-ai`
3. Try creating an event
4. Navigate to `/contact-messages`
5. Try viewing messages
6. Navigate to `/event-data`
7. Try editing an event

**Expected Results:**
- [ ] Can access bulk upload page (not 403/forbidden)
- [ ] Can see event creation form
- [ ] Can create events successfully
- [ ] Can view contact messages list
- [ ] Can update contact message status
- [ ] Can manage event data (formats, categories)
- [ ] No "forbidden" errors
- [ ] No "permission denied" errors

**Test 2.4b: CTF User**

**Test Steps:**
1. Login as **CTF** user
2. Repeat all tests from 2.4a

**Expected Results:**
- [ ] Same access as MedEd Team user
- [ ] All features work identically
- [ ] No permission errors

**Browser Console Check:**
- [ ] No 403 (Forbidden) responses
- [ ] No "You don't have permission" messages
- [ ] API calls succeed

**If This Fails:**
- Check API route permission helpers include new roles
- Check `canManageEvents()` includes meded_team and ctf
- Check `canViewContactMessages()` includes meded_team and ctf
- Service role policies should allow all API operations

---

#### Test 2.5: Event Management (Bug #8 - MEDIUM PRIORITY)

**Historical Issue:** Full event CRUD operations were broken. Creating events with multiple relations (speakers, locations, organizers) failed. Junction table operations were blocked by RLS.

**Test Steps:**
1. Login as **Admin**, **MedEd Team**, or **CTF** user
2. Navigate to event creation page
3. Create a new event with:
   - Event title and description
   - **Multiple speakers** (add 2-3)
   - **Multiple locations** (add 2)
   - **Multiple organizers** (add 2)
   - Categories
   - Format
4. Save the event
5. Navigate to event list
6. Edit the event you just created
7. **Remove one speaker**
8. **Add a new location**
9. **Change the main organizer**
10. Save changes
11. Verify changes persisted
12. Delete the test event

**Expected Results:**
- [ ] Event creation succeeds
- [ ] All speakers saved correctly
- [ ] All locations saved correctly
- [ ] All organizers saved correctly
- [ ] Categories and format saved
- [ ] Edit page loads with all data
- [ ] Can remove speaker (junction table delete works)
- [ ] Can add location (junction table insert works)
- [ ] Can change organizer (junction table update works)
- [ ] Changes persist after save
- [ ] Event deletion succeeds
- [ ] Cascade deletes work (junction records removed)
- [ ] No orphaned records left behind

**Database Verification:**
```sql
-- After deletion, check no orphaned junction records
SELECT * FROM event_speakers WHERE event_id = 'deleted_event_id';
SELECT * FROM event_locations WHERE event_id = 'deleted_event_id';
SELECT * FROM event_organizers WHERE event_id = 'deleted_event_id';
-- All should return 0 rows
```

**If This Fails:**
- Check all junction tables have RLS enabled
- Check service role policies on junction tables
- Check CASCADE delete constraints
- Check API route handles junction table operations

---

#### Test 2.6: Service Role Blocked (Bug #6 - MEDIUM PRIORITY)

**Historical Issue:** Service role queries were blocked by RLS policies that didn't have service role exceptions.

**Test Steps:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Perform various operations:
   - Create an event
   - Upload a resource
   - View leaderboard
   - Edit user profile
   - Delete an organizer
4. Monitor console for errors

**Expected Results:**
- [ ] No "permission denied" errors in console
- [ ] No "RLS policy violation" errors
- [ ] No "auth.uid() is null" errors
- [ ] No "row level security policy" errors
- [ ] Only expected authorization errors (403 for wrong role)
- [ ] All API calls succeed (status 200 or 201)

**Network Tab Check:**
1. Go to Network tab in DevTools
2. Filter by "Fetch/XHR"
3. Perform operations
4. Check API responses

**Expected:**
- [ ] No 500 (Internal Server Error) responses
- [ ] No database error messages in responses
- [ ] Successful operations return 200/201
- [ ] Unauthorized operations return 401/403 (expected)

**If This Fails:**
- Check which table is causing the error
- Verify that table has service role policy
- Check policy syntax is correct

---

### Phase 3: Role-Based Access Tests (10 minutes)

Test that all 5 roles have correct permissions.

#### Test 3.1: Admin Role

**Test Steps:**
1. Login as **Admin**
2. Test access to:
   - Create/edit/delete events
   - Upload resources
   - View contact messages
   - Manage all data (categories, formats, locations, organizers, speakers)
   - Access admin dashboard
   - View analytics

**Expected Results:**
- [ ] Can create events
- [ ] Can edit any event
- [ ] Can delete events
- [ ] Can upload resources
- [ ] Can view all contact messages
- [ ] Can update contact message status
- [ ] Can delete contact messages
- [ ] Can manage categories
- [ ] Can manage formats
- [ ] Can manage locations
- [ ] Can manage organizers
- [ ] Can manage speakers
- [ ] Can access `/admin-dashboard`
- [ ] Can access `/analytics`
- [ ] Full access to all features

---

#### Test 3.2: MedEd Team Role

**Test Steps:**
1. Login as **MedEd Team** user
2. Test access to:
   - Event management
   - Contact messages
   - Bulk upload
   - Formats/categories management

**Expected Results:**
- [ ] Can create events
- [ ] Can edit events
- [ ] Can delete events
- [ ] Can view contact messages
- [ ] Can update contact message status
- [ ] Can access bulk upload (`/bulk-upload-ai`)
- [ ] Can manage formats
- [ ] Can manage categories
- [ ] Cannot access admin-only features
- [ ] Cannot view analytics (unless specified)

---

#### Test 3.3: CTF Role

**Test Steps:**
1. Login as **CTF** user
2. Test same access as MedEd Team

**Expected Results:**
- [ ] Same permissions as MedEd Team
- [ ] Can create/edit/delete events
- [ ] Can view contact messages
- [ ] Can access bulk upload
- [ ] Can manage event-related data

---

#### Test 3.4: Educator Role

**Test Steps:**
1. Login as **Educator** user
2. Test access to:
   - Resource upload
   - View events
   - Own resources management

**Expected Results:**
- [ ] Can upload resources
- [ ] Can edit own resources
- [ ] Can delete own resources
- [ ] Can view all events (published)
- [ ] Cannot create events
- [ ] Cannot view contact messages
- [ ] Cannot access admin features
- [ ] Cannot manage categories/formats

---

#### Test 3.5: Student Role

**Test Steps:**
1. Login as **Student** user
2. Test access to:
   - View events
   - Download resources
   - View leaderboard
   - Own XP/achievements

**Expected Results:**
- [ ] Can view published events only
- [ ] Can download resources
- [ ] Can view leaderboard
- [ ] Can see own XP
- [ ] Can see own achievements
- [ ] Can see own level
- [ ] Cannot upload resources
- [ ] Cannot create events
- [ ] Cannot view contact messages
- [ ] Cannot access admin features
- [ ] Cannot view other users' detailed data

---

### Phase 4: Gamification Tests (5 minutes)

#### Test 4.1: User XP and Achievements

**Test Steps:**
1. Login as **Student** user
2. Complete an activity that awards XP (e.g., complete a station, download resource)
3. Check XP updates
4. Check if achievements unlock

**Expected Results:**
- [ ] XP increases correctly
- [ ] User can see own XP value
- [ ] User can see own level
- [ ] Achievements appear when earned
- [ ] User cannot see other users' detailed XP transactions
- [ ] User cannot modify own XP directly (via UI)

**Database Check:**
```sql
-- Verify XP was recorded
SELECT * FROM xp_transactions 
WHERE user_id = 'test_user_id' 
ORDER BY created_at DESC 
LIMIT 5;
```
- [ ] Transactions are recorded
- [ ] Amounts are correct

---

#### Test 4.2: Leaderboard Public Access

**Test Steps:**
1. Logout (or use incognito window)
2. Navigate to leaderboard page (if publicly accessible)
3. Or login as different user and view leaderboard

**Expected Results:**
- [ ] Leaderboard is visible
- [ ] Shows all users' public data (username, XP, level)
- [ ] Sorted correctly (highest XP first)
- [ ] No private data exposed (email, personal info)
- [ ] No detailed XP transaction history shown

---

### Phase 5: API and Service Role Tests (5 minutes)

#### Test 5.1: API Endpoints

**Test Steps:**
Use browser DevTools or API testing tool (Postman, curl):

```bash
# Test events API (adjust URLs to your app)
GET /api/events
POST /api/events (with auth header)
PUT /api/events/[id] (with auth header)
DELETE /api/events/[id] (with auth header)

# Test resources API
GET /api/resources
POST /api/resources (with auth header)

# Test contact messages API
GET /api/contact-messages (with auth header)
```

**Expected Results:**
- [ ] All authenticated API calls succeed
- [ ] No RLS policy violation errors
- [ ] Proper authorization errors for unauthorized users (401/403)
- [ ] Service role queries work
- [ ] Data is returned correctly

---

#### Test 5.2: Browser Console Monitoring

**Test Steps:**
1. Open DevTools (F12) → Console
2. Clear console
3. Perform various actions:
   - Navigate between pages
   - Create/edit/delete data
   - Upload files
   - View leaderboard
4. Monitor for errors

**Expected Results:**
- [ ] No "permission denied" errors
- [ ] No "RLS policy violation" errors
- [ ] No "auth.uid() is null" errors
- [ ] No database-level errors
- [ ] Only expected application errors (validation, etc.)

---

### Phase 6: Views and Aggregations (3 minutes)

#### Test 6.1: Events with Details View

**Test Steps:**
```sql
-- Run in Supabase SQL Editor
SELECT * FROM events_with_details LIMIT 5;
```

**Expected Results:**
- [ ] Query succeeds without errors
- [ ] Returns events with all joined data
- [ ] Includes category_name, category_color
- [ ] Includes format_name, format_color
- [ ] Includes location_name
- [ ] Includes organizer_name
- [ ] Includes speakers array (JSON)
- [ ] No permission errors
- [ ] No SECURITY DEFINER warnings

---

#### Test 6.2: Category and Format Counts

**Test Steps:**
```sql
-- Run in Supabase SQL Editor
SELECT * FROM categories_with_counts;
SELECT * FROM formats_with_counts;
```

**Expected Results:**
- [ ] Both queries succeed
- [ ] Shows categories with event_count
- [ ] Shows formats with event_count
- [ ] Counts are accurate (match actual published events)
- [ ] No security errors

**Verification:**
```sql
-- Manually verify a count
SELECT COUNT(*) FROM events 
WHERE category_id = 'some_category_id' 
  AND status = 'published';
-- Should match the event_count in categories_with_counts
```

---

## Failure Response Plan

### If Any Test Fails

**Step 1: Document the Failure**
- [ ] Note which test number failed
- [ ] Copy the error message
- [ ] Take screenshot if relevant

**Step 2: Check Browser Console**
- [ ] Open DevTools (F12) → Console
- [ ] Look for red error messages
- [ ] Copy full error text
- [ ] Note which API endpoint failed (if applicable)

**Step 3: Check Supabase Logs**
1. Go to Supabase Dashboard
2. Navigate to Logs → Database
3. Look for recent errors
4. Check for:
   - "permission denied" errors
   - "RLS policy violation" errors
   - Table names mentioned in errors

**Step 4: Run Diagnostic Query**
```sql
-- Check RLS status on failing table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'failing_table_name';

-- Check policies on failing table
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'failing_table_name';
```

**Step 5: Report Back**
Provide:
- Test number that failed (e.g., "Test 2.1 - Organizer Deletion")
- Error message from console
- Error message from Supabase logs
- Diagnostic query results
- Steps to reproduce

---

## Success Criteria

**All Tests Must Pass:**
- ✅ 0 errors in Supabase Security Advisor (was 44)
- ✅ All 6 previous bugs fixed and verified
- ✅ All 5 roles work correctly with appropriate permissions
- ✅ No permission denied errors in normal operations
- ✅ Gamification features work (XP, achievements, leaderboard)
- ✅ Views return correct data without security errors
- ✅ Junction table operations work (create, update, delete)
- ✅ Service role queries succeed
- ✅ API endpoints respond correctly

**Documentation:**
- [ ] Screenshot of Supabase Advisor showing 0 errors
- [ ] Confirmation that all 6 previous bugs are fixed
- [ ] Note any edge cases discovered
- [ ] Record test completion date

---

## Quick Reference

### Previous Bugs to Verify Fixed

1. ✅ **Everyone Blocked** - Service role always has access
2. ✅ **Organizer Deletion** - Junction table deletes work
3. ✅ **Educator Access** - Can upload resources
4. ✅ **Leaderboard Empty** - Shows all users
5. ✅ **New Roles Blocked** - MedEd Team and CTF work
6. ✅ **Service Role Blocked** - No permission errors

### Expected Results Summary

- **Database:** 21 tables with RLS enabled, 21+ policies
- **Security Advisor:** 0 errors (was 44)
- **Views:** 3 views exist with security_invoker
- **Roles:** All 5 roles have correct access
- **Bugs:** All 6 previous bugs remain fixed
- **Performance:** No degradation from RLS overhead

---

**Testing Status:** Ready to execute  
**Estimated Time:** 40 minutes (full) or 2 minutes (smoke test)  
**Priority:** High - Verify before deploying to production  

---

*Complete this checklist systematically. Mark each item as you test it. If any test fails, follow the failure response plan before continuing.*

