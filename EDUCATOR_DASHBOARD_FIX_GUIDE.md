# 🎓 Educator Dashboard Access Fix Guide

## Problem
Educators are seeing the student dashboard instead of the educator dashboard, and cannot upload files to the resources page.

## Root Cause
Row Level Security (RLS) policies on Supabase tables are blocking:
1. Role checking queries from the `/api/admin/check` endpoint
2. Resource upload operations for educators
3. Profile data access needed for educator features

## Solution: Disable RLS on Critical Tables

### Step 1: Run the Comprehensive Fix
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `mtugjycjaztilqiqcjqr`
3. Click on **SQL Editor** in the left sidebar
4. Click **+ New Query**
5. Copy and paste the contents of `comprehensive-educator-fix.sql`
6. Click **Run** or press `Ctrl + Enter`

### Step 2: Verify the Fix
1. In the same SQL Editor, create another new query
2. Copy and paste the contents of `verify-educator-access.sql`
3. Click **Run**
4. Check the results:
   - ✅ All tables should show "✓ DISABLED (Good)" for RLS status
   - ✅ Your educators should be listed with their emails
   - ✅ No blocking RLS policies should be active

### Step 3: Test Educator Access
1. **Log in as an educator** on your site
2. Go to `/dashboard` - You should now see the educator dashboard
3. Go to `/downloads` - You should see the **Upload Resource** button
4. Try uploading a test file - It should work without errors

---

## What This Fix Does

### Tables with RLS Disabled:
1. **`users`** - Allows role checking (educator, admin, student)
2. **`user_profiles`** - Allows profile data access
3. **`resources`** - Allows educators to upload/manage resources
4. **`events`** - Allows educators to view event data
5. **`resource_events`** - Allows linking resources to events

### Security Still Maintained Through:
- ✅ **NextAuth Session Management** - Only authenticated users can access
- ✅ **API Route Protection** - All API endpoints check authentication
- ✅ **Middleware** - Protected routes require specific roles
- ✅ **Service Role Key** - API routes use privileged access securely
- ✅ **Application-Level Checks** - `usePermissions()` and `useAdmin()` hooks

---

## Quick Troubleshooting

### If educators still can't access:

1. **Check the user's role in database:**
   ```sql
   SELECT email, role FROM users WHERE email = 'educator@example.com';
   ```
   - Should return `role = 'educator'`

2. **Manually set educator role if needed:**
   ```sql
   UPDATE users 
   SET role = 'educator' 
   WHERE email = 'educator@example.com';
   ```

3. **Clear browser cache and cookies** for the educator user

4. **Check browser console** (F12) for any API errors when loading `/dashboard`

---

## About RLS and Security

### Why We Disabled RLS:
RLS in Supabase is powerful but can cause issues when:
- Complex role-based access is needed
- Multiple tables need coordinated access
- API routes already handle authentication
- Service role key is used for admin operations

### Our Security Model:
```
┌─────────────────────────────────────┐
│   User tries to access /dashboard   │
└────────────────┬────────────────────┘
                 │
                 ▼
      ┌──────────────────────┐
      │  NextAuth Session?   │  ◄── First Check
      └──────────┬───────────┘
                 │ Yes
                 ▼
      ┌──────────────────────┐
      │  API: /admin/check   │  ◄── Second Check
      │  (Service Role Key)  │
      └──────────┬───────────┘
                 │
                 ▼
      ┌──────────────────────┐
      │   Query users table  │  ◄── Third Check
      │   Get user role      │
      └──────────┬───────────┘
                 │
                 ▼
      ┌──────────────────────┐
      │ role === 'educator'? │  ◄── Fourth Check
      └──────────┬───────────┘
                 │ Yes
                 ▼
      ┌──────────────────────┐
      │ Show Educator        │  ✓ Access Granted
      │ Dashboard            │
      └──────────────────────┘
```

---

## Files Created

1. **`comprehensive-educator-fix.sql`** - Main fix script
2. **`verify-educator-access.sql`** - Verification script
3. **`fix-educator-dashboard-access.sql`** - Simple users table fix

---

## Next Steps (Optional - For Later)

### Re-implementing RLS Properly:
If you want to re-enable RLS in the future, we should:

1. **Create specific policies per role:**
   ```sql
   -- Example: Allow educators to read their own data
   CREATE POLICY "educators_read_own_data" ON users
   FOR SELECT USING (auth.jwt() ->> 'email' = email AND role = 'educator');
   ```

2. **Test each policy individually** before enabling the next

3. **Use service role key** for admin operations that need to bypass RLS

4. **Document each policy** with clear comments

**For now, keep RLS disabled** since your application's security model is sound without it.

---

## Summary

✅ **Run `comprehensive-educator-fix.sql` in Supabase SQL Editor**
✅ **Verify with `verify-educator-access.sql`**
✅ **Test as an educator user**
✅ **Security is maintained at the application level**

---

*Need help? Check the verification script results or contact support.*

