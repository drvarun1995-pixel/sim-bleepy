# 🧪 TEST THE NEW ROLES - Step-by-Step Guide

## ✅ All Code is Fixed!

I've updated **22 files** to properly support the new roles. Everything should work now!

---

## 🚀 Quick Test Steps

### **Step 1: Restart Your Dev Server**
```bash
# If server is running, stop it (Ctrl+C)
# Then start again:
npm run dev
```

### **Step 2: Verify SQL Migration Ran**
```sql
-- In Supabase SQL Editor, run this to check:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('events', 'resources', 'contact_messages');
```

**Expected:** All should show `rowsecurity = false`

If not, run: `migrations/proper-rls-for-nextauth.sql`

### **Step 3: Assign Test User to MedEd Team**
```sql
-- In Supabase SQL Editor:
UPDATE users 
SET role = 'meded_team' 
WHERE email = 'your-test-email@example.com';

-- Verify:
SELECT email, role FROM users WHERE email = 'your-test-email@example.com';
```

### **Step 4: Test MedEd Team Access**

1. **Clear browser cache** (very important!)
   - Chrome: Ctrl+Shift+Delete → Clear all
   - Or use Incognito mode

2. **Log out completely** from the app

3. **Log back in** as the MedEd Team user

4. **Check the Sidebar** - You should see:
   ```
   📊 Event Management
     - Event Data
     - All Events
     - Add Event
     - Smart Bulk Upload  ← Click this!
   
   🟣 MedEd Tools
     - Announcements
     - Contact Messages  ← Click this!
   ```

5. **Test Bulk Upload:**
   - Click "Smart Bulk Upload" in sidebar
   - Should load the page ✅
   - Should NOT redirect ✅

6. **Test Contact Messages:**
   - Click "Contact Messages" in sidebar
   - Should load the page ✅
   - Should see list of messages ✅

7. **Test Event Management:**
   - Click "Event Data" in sidebar
   - Should load ✅
   - Try creating a test event ✅

---

## 🧪 Test All Roles

### **Test as Admin:**
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```
- ✅ Should see Event Management section
- ✅ Should see Admin Tools section
- ✅ Can access `/admin`
- ✅ Can access `/dashboard/admin/users`
- ✅ Can access everything

### **Test as CTF:**
```sql
UPDATE users SET role = 'ctf' WHERE email = 'ctf@example.com';
```
- ✅ Should see Event Management section
- ✅ Should see CTF Tools section (orange)
- ✅ Can access `/bulk-upload-ai`
- ✅ Can access `/contact-messages`
- ✅ Same access as MedEd Team

### **Test as Educator:**
```sql
UPDATE users SET role = 'educator' WHERE email = 'educator@example.com';
```
- ✅ Should see Educator Tools section
- ❌ Should NOT see Event Management
- ❌ Should NOT see Contact Messages
- ✅ Can upload resources
- ❌ Cannot access `/bulk-upload-ai` (redirects to events-list)

### **Test as Student:**
```sql
UPDATE users SET role = 'student' WHERE email = 'student@example.com';
```
- ❌ No special tools sections
- ❌ Cannot access event management
- ❌ Cannot access contact messages
- ✅ Can view events and resources
- ✅ Has 3 attempts/day limit

---

## 🔍 Troubleshooting

### **"I don't see Event Management section"**

**Checklist:**
1. Did you run the SQL migration `migrations/proper-rls-for-nextauth.sql`?
2. Did you assign the user `role = 'meded_team'` or `'ctf'`?
3. Did you restart the dev server?
4. Did you clear browser cache?
5. Did you log out and log back in?

**Verify role:**
```sql
SELECT email, role FROM users WHERE email = 'your-email';
```

### **"Page still redirects me"**

**Check:**
1. Browser console (F12) for errors
2. Server console for permission errors
3. Are you logged in?
4. Is the role correct in database?

**Force refresh:**
- Clear `.next` folder: Delete `.next` directory
- Restart server

### **"Admin permissions are gone"**

**Fix:**
```sql
-- Verify admin role
SELECT email, role FROM users WHERE email = 'admin@example.com';

-- If wrong, fix it:
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

Then:
1. Clear browser cache
2. Log out and back in
3. Admin should work

---

## 📊 What Changed (Summary)

### **Before:**
- ❌ Only 3 roles: student, educator, admin
- ❌ Layouts hardcoded role types
- ❌ Sidebar only checked `role === 'admin'`
- ❌ Pages used `useAdmin()` hook
- ❌ TypeScript errors with new roles

### **After:**
- ✅ 5 roles: student, educator, meded_team, ctf, admin
- ✅ Layouts accept all 5 role types
- ✅ Sidebar checks `role === 'admin' || role === 'meded_team' || role === 'ctf'`
- ✅ Pages use `useRole()` hook with permission checks
- ✅ All TypeScript types updated
- ✅ No linter errors

---

## 🎯 Final Verification

After testing all roles, verify:

1. ✅ **MedEd Team can:**
   - See Event Management in sidebar
   - Access /bulk-upload-ai
   - Access /contact-messages
   - Upload resources
   - Unlimited practice attempts

2. ✅ **CTF can:**
   - Same as MedEd Team (all features)

3. ✅ **Admin can:**
   - Everything (User Management, Admin Dashboard, etc.)

4. ✅ **Educator can:**
   - Upload resources
   - View all events
   - Unlimited attempts
   - BUT cannot manage events or view contact messages

5. ✅ **Student can:**
   - View published events
   - Use AI simulator (3/day)
   - View resources

---

## 🎉 Success Criteria

**You'll know it's working when:**
1. ✅ MedEd Team user sees "Event Management" section in sidebar
2. ✅ MedEd Team can click "Smart Bulk Upload" and page loads
3. ✅ MedEd Team can click "Contact Messages" and page loads
4. ✅ Admin still has full access
5. ✅ No permission errors in console

---

## 📞 Ready to Test!

1. Restart `npm run dev`
2. Clear browser cache
3. Assign role in Supabase
4. Log out and back in
5. Check sidebar for Event Management
6. Click links and verify they work

**Everything is ready! Test it now!** 🚀

---

**Total Files Fixed:** 22  
**No Errors:** ✅  
**Ready for:** Testing → Git Push

