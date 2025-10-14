# 🔧 Fix Permissions for New Roles (MedEd Team & CTF)

## 🐛 Problem

CTF and MedEd Team users can't access event management or contact messages because the Supabase RLS (Row Level Security) policies only allow `role = 'admin'`.

## ✅ Solution

Run the SQL migration to update RLS policies to include the new roles.

---

## 📋 Step-by-Step Fix

### **Step 1: Run Database Migrations**

You need to run **2 SQL files** in your Supabase database:

#### **1.1 Add New Roles to Database**
```sql
-- File: migrations/add-meded-ctf-roles.sql
-- Run this first if you haven't already
```

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `migrations/add-meded-ctf-roles.sql`
3. Paste and click **"Run"**

#### **1.2 Update RLS Policies**
```sql
-- File: migrations/update-rls-for-new-roles.sql
-- This gives MedEd Team and CTF the right permissions
```

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `migrations/update-rls-for-new-roles.sql`
3. Paste and click **"Run"**
4. You should see success messages ✅

---

## 🎯 What the RLS Update Does

### **Creates Helper Functions:**
- `user_can_manage_events()` - Checks if user is admin, meded_team, or ctf
- `user_can_view_contact_messages()` - Checks if user can view contact messages
- `user_can_manage_resources()` - Checks if user is admin, educator, meded_team, or ctf

### **Updates RLS Policies For:**

1. **Events Table**
   - INSERT, UPDATE, DELETE now allowed for meded_team & ctf

2. **Event-Related Tables**
   - categories
   - formats
   - locations
   - organizers
   - speakers
   - event_categories (junction)
   - event_locations (junction)
   - event_organizers (junction)
   - event_speakers (junction)

3. **Contact Messages Table**
   - SELECT, UPDATE, DELETE now allowed for meded_team & ctf

4. **Resources Table**
   - INSERT, UPDATE, DELETE now allowed for meded_team & ctf
   - Note: Fixed incorrect `auth.role()` checks to properly check user role

---

## 🧪 Testing After Migration

### **Test 1: Assign Test User**
```sql
-- In Supabase SQL Editor
UPDATE users 
SET role = 'meded_team' 
WHERE email = 'your-test@email.com';
```

### **Test 2: Login and Verify Access**
1. Log in as the test user
2. Try accessing these pages:
   - ✅ `/bulk-upload-ai` - Event bulk upload
   - ✅ `/formats` - Event formats management
   - ✅ `/contact-messages` - Contact messages
   - ✅ `/event-data` - Event data management

### **Test 3: Try Creating an Event**
1. Go to bulk upload page
2. Upload a test event file
3. Should work without permission errors ✅

---

## 🔍 Verify Policies Were Updated

Run this in Supabase SQL Editor to check:

```sql
-- Check events policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('events', 'contact_messages')
ORDER BY tablename, policyname;
```

You should see policies like:
- "Event managers can insert events"
- "Event managers can update events"
- "Event managers can delete events"
- "Authorized users can view contact messages"

---

## 🚨 If You Still Have Issues

### **Issue: Still getting permission errors**

**Solution:**
1. Clear browser cache and cookies
2. Log out completely
3. Log back in
4. Try again

### **Issue: SQL migration errors**

**Possible causes:**
- Tables don't exist yet
- Policies already exist with different names

**Solution:**
1. Check error message
2. You may need to drop conflicting policies first
3. Or adjust the migration SQL for your setup

### **Issue: Functions not found**

**Solution:**
```sql
-- Verify functions were created
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%can_manage%';
```

---

## 📊 Summary of Changes

| What | Before | After |
|------|--------|-------|
| **Events** | Only admins | ✅ Admin, MedEd Team, CTF |
| **Categories** | Only admins | ✅ Admin, MedEd Team, CTF |
| **Formats** | Only admins | ✅ Admin, MedEd Team, CTF |
| **Locations** | Only admins | ✅ Admin, MedEd Team, CTF |
| **Organizers** | Only admins | ✅ Admin, MedEd Team, CTF |
| **Speakers** | Only admins | ✅ Admin, MedEd Team, CTF |
| **Resources** | Admin, Educator | ✅ Admin, Educator, MedEd Team, CTF |
| **Contact Messages** | Only admins | ✅ Admin, MedEd Team, CTF |

---

## ⚡ Quick Commands

### **Assign roles:**
```sql
-- Make someone MedEd Team
UPDATE users SET role = 'meded_team' WHERE email = 'user@example.com';

-- Make someone CTF
UPDATE users SET role = 'ctf' WHERE email = 'doctor@example.com';

-- Check all roles
SELECT email, role FROM users ORDER BY role;
```

### **Test event management:**
```sql
-- Check if user can access events (as the user)
SELECT * FROM events LIMIT 5;

-- This should work for meded_team and ctf users now
```

---

## 📝 Email Notifications Status

⚠️ **Email notifications are TEMPORARILY DISABLED** as requested.

To re-enable later, uncomment the email code in:
- `app/api/admin/users/route.ts` (lines 158-173)

---

## ✅ Checklist

Before testing:
- [ ] Run `migrations/add-meded-ctf-roles.sql` in Supabase
- [ ] Run `migrations/update-rls-for-new-roles.sql` in Supabase
- [ ] Assign a test user to meded_team or ctf role
- [ ] Clear browser cache
- [ ] Log out and log back in

During testing:
- [ ] Can access `/bulk-upload-ai` page
- [ ] Can access `/formats` page
- [ ] Can access `/contact-messages` page
- [ ] Can create/edit events without errors
- [ ] Can view contact form submissions

---

## 💡 Why This Approach?

**Using Helper Functions:**
- ✅ Cleaner code
- ✅ Easy to maintain
- ✅ Single source of truth
- ✅ Easy to add more roles later
- ✅ Centralized permission logic

**Example:**
```sql
-- Instead of repeating this everywhere:
WHERE role IN ('admin', 'meded_team', 'ctf')

-- We use:
WHERE user_can_manage_events(auth.uid())
```

If we add more roles later, we only update the function!

---

## 🎯 Next Steps

1. ✅ Run the SQL migrations
2. ✅ Test with a user assigned to meded_team or ctf
3. ✅ Verify all features work
4. 📧 When ready, re-enable email notifications

---

**Status:** ⚠️ Requires SQL Migration  
**Priority:** 🔥 High - Blocking new roles from working  
**Time to Fix:** ~5 minutes (just run the SQL)

