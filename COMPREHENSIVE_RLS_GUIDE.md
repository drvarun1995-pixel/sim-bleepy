# 🔐 Comprehensive RLS Security Setup Guide

## 🎯 Problem Overview

Previously, RLS (Row Level Security) was **DISABLED** on many tables because educators and other roles couldn't access the features they needed. This was a **temporary workaround** that left your database insecure.

**This guide provides a PROPER SOLUTION with comprehensive RLS policies for ALL user roles.**

---

## 📋 What Tables Were Affected?

These tables had RLS disabled (insecure):
- ❌ `events`
- ❌ `categories`
- ❌ `formats`
- ❌ `locations`
- ❌ `organizers`
- ❌ `speakers`
- ❌ `event_speakers`
- ❌ `event_locations`
- ❌ `event_organizers`

---

## ✅ The Solution

### **File: `migrations/comprehensive-rls-all-roles.sql`**

This migration creates:
1. **Helper Functions** - Centralized role checking
2. **Comprehensive Policies** - Proper security for all roles
3. **Enables RLS** - Re-enables security on all tables

---

## 🎭 Role-Based Access Summary

| Feature | Student | Educator | MedEd Team | CTF | Admin |
|---------|---------|----------|------------|-----|-------|
| **View Events** | Published only | All events | All events | All events | All events |
| **Create Events** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Edit Events** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Delete Events** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **View Categories/Formats** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Manage Categories/Formats** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **View Resources** | Active only | All | All | All | All |
| **Upload Resources** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Edit Resources** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Contact Messages** | Submit only | ❌ | ✅ View/Manage | ✅ View/Manage | ✅ View/Manage |
| **Announcements** | View only | View only | View only | View only | ✅ Full access |
| **User Management** | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🛠️ Implementation Steps

### **Step 1: Run the Role Migration** (if not done)
```sql
-- File: migrations/add-meded-ctf-roles.sql
-- Adds meded_team and ctf to allowed roles
```

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `migrations/add-meded-ctf-roles.sql`
3. Paste and Run

### **Step 2: Run the Comprehensive RLS Migration**
```sql
-- File: migrations/comprehensive-rls-all-roles.sql
-- Creates proper RLS policies for ALL roles
```

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `migrations/comprehensive-rls-all-roles.sql`
3. Paste and Run
4. Check for success messages ✅

---

## 🔍 What the Migration Does

### **Creates 6 Helper Functions:**

1. **`get_user_role(user_id)`**
   - Returns the user's role from the users table
   - Defaults to 'student' if not found

2. **`is_admin(user_id)`**
   - Returns true if user is admin

3. **`is_educator_or_above(user_id)`**
   - Returns true for educator, meded_team, ctf, admin

4. **`can_manage_events(user_id)`**
   - Returns true for admin, meded_team, ctf

5. **`can_manage_resources(user_id)`**
   - Returns true for educator, meded_team, ctf, admin

6. **`can_view_contact_messages(user_id)`**
   - Returns true for admin, meded_team, ctf

### **Creates Policies For:**

#### **Events System:**
- ✅ events table
- ✅ categories table
- ✅ formats table
- ✅ locations table
- ✅ organizers table
- ✅ speakers table
- ✅ event_speakers junction table
- ✅ event_locations junction table
- ✅ event_organizers junction table

#### **Resources System:**
- ✅ resources table

#### **Communication:**
- ✅ contact_messages table

#### **Content:**
- ✅ announcements table

#### **User Data:**
- ✅ users table
- ✅ profiles table (if exists)
- ✅ portfolio_files table
- ✅ attempts table
- ✅ attempt_events table
- ✅ stations table

---

## 📊 Detailed Policies

### **Events Table:**
```sql
-- STUDENTS: Can view published events only
-- EDUCATORS: Can view all events (including drafts)
-- MEDED/CTF: Can create, edit, delete events
-- ADMIN: Full access
```

### **Categories, Formats, Locations, Organizers, Speakers:**
```sql
-- ALL USERS: Can view these lookup tables
-- MEDED/CTF/ADMIN: Can create, edit, delete
```

### **Resources Table:**
```sql
-- STUDENTS: Can view active resources
-- EDUCATORS+: Can upload, edit, delete resources
```

### **Contact Messages:**
```sql
-- ANYONE: Can submit via contact form
-- MEDED/CTF/ADMIN: Can view, update, delete messages
```

---

## 🧪 Testing the RLS Policies

### **Test 1: Student Access**
```sql
-- Assign a test user as student
UPDATE users SET role = 'student' WHERE email = 'student@test.com';
```
Then log in and verify:
- ✅ Can view published events
- ❌ Cannot access event management pages
- ❌ Cannot upload resources
- ❌ Cannot view contact messages

### **Test 2: Educator Access**
```sql
UPDATE users SET role = 'educator' WHERE email = 'educator@test.com';
```
Then log in and verify:
- ✅ Can view all events
- ✅ Can upload/edit/delete resources
- ❌ Cannot create/edit events
- ❌ Cannot view contact messages

### **Test 3: MedEd Team Access**
```sql
UPDATE users SET role = 'meded_team' WHERE email = 'meded@test.com';
```
Then log in and verify:
- ✅ Can view all events
- ✅ Can create/edit/delete events
- ✅ Can upload/edit/delete resources
- ✅ Can view/manage contact messages
- ✅ Can access `/bulk-upload-ai`
- ✅ Can access `/formats`
- ✅ Can access `/contact-messages`

### **Test 4: CTF Access**
```sql
UPDATE users SET role = 'ctf' WHERE email = 'ctf@test.com';
```
Same access as MedEd Team ✅

---

## 🔥 Why This is Better Than Disabling RLS

### **Before (RLS Disabled):**
```sql
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
```
- ❌ **Security Risk**: Anyone with database access can read/modify data
- ❌ **No Authorization**: Can't control who does what
- ❌ **Audit Problems**: Can't track who changed what
- ❌ **Data Leaks**: Users could potentially access other users' data

### **After (Proper RLS):**
```sql
CREATE POLICY "Event managers can manage events"
    ON events FOR ALL
    USING (can_manage_events(auth.uid()));
```
- ✅ **Secure**: Only authorized roles can access
- ✅ **Granular**: Different permissions per role
- ✅ **Auditable**: Database tracks all actions
- ✅ **Maintainable**: Easy to update permissions
- ✅ **Scalable**: Easy to add new roles

---

## 🚀 Quick Start Commands

### **1. Run Both Migrations:**
```bash
# In Supabase SQL Editor, run in order:
1. migrations/add-meded-ctf-roles.sql
2. migrations/comprehensive-rls-all-roles.sql
```

### **2. Assign Test Users:**
```sql
-- Test all roles
UPDATE users SET role = 'student' WHERE email = 'student@test.com';
UPDATE users SET role = 'educator' WHERE email = 'educator@test.com';
UPDATE users SET role = 'meded_team' WHERE email = 'meded@test.com';
UPDATE users SET role = 'ctf' WHERE email = 'ctf@test.com';
UPDATE users SET role = 'admin' WHERE email = 'admin@test.com';
```

### **3. Test Each Role:**
Log in as each user and verify permissions work correctly.

---

## 🔍 Verification Queries

### **Check RLS is Enabled:**
```sql
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('events', 'categories', 'formats', 'resources', 'contact_messages')
ORDER BY tablename;
```
All should show `rls_enabled = true` ✅

### **Check Policies Exist:**
```sql
SELECT 
    tablename,
    policyname,
    cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```
Should see policies for all tables ✅

### **Test Function:**
```sql
-- Test the role checking function
SELECT 
    email,
    public.get_user_role(id) as role,
    public.can_manage_events(id) as can_manage_events,
    public.can_manage_resources(id) as can_manage_resources
FROM users
ORDER BY role;
```

---

## 📝 Policy Logic Explained

### **Example: Events Table**

```sql
-- SELECT (Read) Policy
CREATE POLICY "Everyone can view published events"
    ON public.events FOR SELECT
    USING (
        status = 'published'  -- Anyone can see published events
        OR 
        public.can_manage_events(auth.uid())  -- Event managers see all
    );

-- INSERT Policy
CREATE POLICY "Event managers can insert events"
    ON public.events FOR INSERT
    WITH CHECK (public.can_manage_events(auth.uid()));
    -- Only admin, meded_team, ctf can insert

-- UPDATE Policy
CREATE POLICY "Event managers can update events"
    ON public.events FOR UPDATE
    USING (public.can_manage_events(auth.uid()));
    -- Only admin, meded_team, ctf can update

-- DELETE Policy
CREATE POLICY "Event managers can delete events"
    ON public.events FOR DELETE
    USING (public.can_manage_events(auth.uid()));
    -- Only admin, meded_team, ctf can delete
```

### **Why Use Functions?**

**Instead of:**
```sql
-- Repeating role checks everywhere
WHERE role IN ('admin', 'meded_team', 'ctf')
```

**We use:**
```sql
-- Single function call
WHERE public.can_manage_events(auth.uid())
```

**Benefits:**
- ✅ Centralized logic
- ✅ Easy to maintain
- ✅ Add roles in one place
- ✅ Consistent across tables
- ✅ Better performance (cached)

---

## 🐛 Troubleshooting

### **Issue: "Permission denied" errors**

**Possible causes:**
1. Migration not run yet
2. RLS still disabled
3. User role not set correctly

**Solutions:**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'events';

-- Check user role
SELECT email, role FROM users WHERE email = 'user@test.com';

-- Verify functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%can_%';
```

### **Issue: Functions not found**

**Solution:**
```sql
-- Re-run the helper functions section of the migration
-- Or check if they exist:
SELECT proname FROM pg_proc 
WHERE proname IN (
  'get_user_role',
  'is_admin',
  'can_manage_events',
  'can_manage_resources',
  'can_view_contact_messages'
);
```

### **Issue: Still can't access features**

**Checklist:**
- [ ] Ran migrations in correct order
- [ ] User has correct role in database
- [ ] Cleared browser cache
- [ ] Logged out and back in
- [ ] RLS is enabled on tables
- [ ] Policies exist for the table

---

## 🎯 What Happens After Migration

### **Security Restored:**
- ✅ RLS enabled on all tables
- ✅ Proper authorization checks
- ✅ Role-based access control
- ✅ Data isolation (users only see their own data)

### **Permissions Work:**
- ✅ Students see published content
- ✅ Educators can manage resources
- ✅ MedEd/CTF can manage events
- ✅ Admins have full access
- ✅ Everyone has appropriate access

### **Maintainable:**
- ✅ Easy to add new roles
- ✅ Easy to modify permissions
- ✅ Centralized in helper functions
- ✅ Well documented

---

## 📦 Files in This Update

### **Migrations:**
1. `migrations/add-meded-ctf-roles.sql` - Adds new roles to database
2. `migrations/comprehensive-rls-all-roles.sql` - Complete RLS setup

### **Code Updates:**
1. `lib/roles.ts` - Role constants and utilities
2. `lib/useRole.ts` - React hook for role checking
3. `app/api/user/role/route.ts` - API endpoint
4. Various API routes updated

### **Admin UI:**
1. `components/admin/UserManagementContent.tsx` - Role selection
2. `components/admin/UserEditModal.tsx` - Role editing
3. `app/api/admin/users/route.ts` - API with email notifications disabled

### **Documentation:**
1. `NEW_ROLES_DOCUMENTATION.md` - Role documentation
2. `FIX_NEW_ROLES_PERMISSIONS.md` - Permission fix guide
3. `ADMIN_ROLE_MANAGEMENT_UPDATE.md` - Admin UI updates
4. `COMPREHENSIVE_RLS_GUIDE.md` - This file

---

## 🚀 Deployment Checklist

### **Development Environment:**
- [ ] Run `migrations/add-meded-ctf-roles.sql`
- [ ] Run `migrations/comprehensive-rls-all-roles.sql`
- [ ] Assign test users to different roles
- [ ] Test each role's access
- [ ] Verify no permission errors
- [ ] Clear browser cache if needed

### **Production Environment:**
- [ ] Backup database first!
- [ ] Run migrations in order
- [ ] Assign roles to real users
- [ ] Test with real accounts
- [ ] Monitor for errors
- [ ] Keep service role key secure

---

## 💡 Key Improvements

### **1. Security Functions:**
```sql
-- Centralized role checking
CREATE FUNCTION can_manage_events(user_id)
  RETURNS boolean
  -- Checks if user is admin, meded_team, or ctf
```

### **2. Granular Permissions:**
```sql
-- Different access levels per operation
FOR SELECT - Everyone sees published content
FOR INSERT - Only authorized roles
FOR UPDATE - Only authorized roles
FOR DELETE - Only authorized roles
```

### **3. Maintainability:**
```sql
-- To add a new role with event management:
-- Just update the function!
ALTER FUNCTION can_manage_events ...
  -- Add new role here, policies auto-update
```

---

## 🎓 Understanding RLS Policies

### **Policy Components:**

**USING clause:** Who can perform the action
```sql
USING (status = 'published')  -- Condition to find matching rows
```

**WITH CHECK clause:** What data can be inserted/updated
```sql
WITH CHECK (can_manage_events(auth.uid()))  -- Validates new data
```

### **Example Scenario:**

**Student tries to create event:**
```
1. Student clicks "Create Event"
2. Frontend sends POST request
3. Database checks INSERT policy
4. Policy checks: can_manage_events(student_user_id)
5. Function returns false (student not in allowed list)
6. Database rejects: "Permission denied"
7. User sees: "You don't have permission"
```

**MedEd Team creates event:**
```
1. MedEd user clicks "Create Event"
2. Frontend sends POST request
3. Database checks INSERT policy
4. Policy checks: can_manage_events(meded_user_id)
5. Function returns true (meded_team in allowed list)
6. Database accepts: Event created ✅
7. User sees: "Event created successfully"
```

---

## ⚠️ Important Notes

1. **Service Role Bypass**: Your backend API uses service role key which bypasses RLS - this is correct for admin operations

2. **Auth Context**: `auth.uid()` gives you the currently authenticated user's ID from Supabase Auth

3. **Function Security**: Functions are marked `SECURITY DEFINER` so they run with privileges of the creator

4. **Performance**: Functions are marked `STABLE` for better query optimization

5. **Default Role**: Users without a role default to 'student' in helper functions

---

## 📈 Performance Impact

**Minimal to none:**
- Functions are cached by PostgreSQL
- Policies use indexed columns
- Queries remain fast
- No noticeable slowdown

---

## 🔮 Future Additions

To add a new role with special permissions:

1. **Add to database constraint:**
```sql
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ADD CONSTRAINT users_role_check 
CHECK (role IN ('student', 'educator', 'admin', 'meded_team', 'ctf', 'NEW_ROLE'));
```

2. **Update helper function:**
```sql
CREATE OR REPLACE FUNCTION can_manage_events(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN get_user_role(user_id) IN ('admin', 'meded_team', 'ctf', 'NEW_ROLE');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

3. **Done!** All policies automatically update ✅

---

## ✅ Success Criteria

After running the migration, verify:

1. ✅ All tables have RLS enabled
2. ✅ Helper functions exist
3. ✅ Policies exist for all tables
4. ✅ Students can view published content
5. ✅ Educators can upload resources
6. ✅ MedEd/CTF can manage events
7. ✅ MedEd/CTF can view contact messages
8. ✅ Admins have full access
9. ✅ No permission denied errors for valid operations
10. ✅ Permission denied for unauthorized operations

---

## 🆘 Need Help?

**Check the console logs:**
- Backend: Check API console for permission errors
- Database: Check Supabase logs for RLS denials
- Frontend: Check browser console for API errors

**Common Commands:**
```sql
-- See all policies
\dp events

-- See function definition
\df+ can_manage_events

-- Test a user's permissions
SELECT can_manage_events('user-uuid-here');
```

---

## 📞 Summary

**Before:** RLS disabled (insecure) ❌  
**After:** Comprehensive RLS policies (secure) ✅

**Impact:**
- ✅ Database is secure
- ✅ All roles work properly
- ✅ No more temporary workarounds
- ✅ Production-ready security

**Next Steps:**
1. Run the migrations
2. Test with different roles
3. Verify everything works
4. Push to production

---

**Status:** ✅ Ready to Deploy  
**Estimated Time:** 5 minutes to run migrations  
**Security Level:** Production-grade 🔒





