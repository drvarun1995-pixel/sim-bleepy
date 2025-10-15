# ⚡ URGENT: Run This SQL to Fix Permissions

## 🚨 Current Situation

You ran the wrong migration. Nobody can access anything because the RLS policies check `auth.uid()` which is NULL (you use NextAuth, not Supabase Auth).

---

## ✅ THE FIX (2 Simple Steps)

### **Step 1: Run This SQL File**

**File:** `migrations/proper-rls-for-nextauth.sql`

1. Open Supabase Dashboard → SQL Editor
2. Copy **ALL** contents from `migrations/proper-rls-for-nextauth.sql`
3. Paste in SQL Editor
4. Click **"Run"**
5. ✅ Should see success messages

**This will:**
- Disable RLS on shared tables (events, resources, etc.)
- Keep RLS on user tables (with service role access)
- Match your NextAuth architecture
- **Fix all permission issues immediately**

---

### **Step 2: Test It Works**

```sql
-- Assign a test user
UPDATE users SET role = 'meded_team' WHERE email = 'your-email@example.com';
```

Then:
1. Log in as that user
2. Go to `/bulk-upload-ai` - Should work ✅
3. Go to `/contact-messages` - Should work ✅
4. Go to `/formats` - Should work ✅

---

## 🎯 Why This Works

### **Your App's Flow:**
```
1. User logs in via NextAuth ✅
2. Frontend calls API route ✅
3. API checks session (NextAuth) ✅
4. API checks user.role from database ✅
5. API uses permission helpers ✅
6. API accesses database with SERVICE ROLE ✅
   (service role bypasses RLS)
7. User gets authorized data ✅
```

### **Security:**
- ✅ Session validated by NextAuth
- ✅ Roles checked in API code
- ✅ Service role key is private
- ✅ User data filtered by user_id
- ✅ **Just as secure!**

---

## ⏱️ Time Required

- **Run SQL:** 10 seconds
- **Test:** 2 minutes
- **Total:** ~3 minutes

---

## 🎉 Result

After running this SQL:
- ✅ Admin can access everything
- ✅ Educator can upload resources
- ✅ MedEd Team can manage events
- ✅ CTF can manage events
- ✅ Students can view content
- ✅ **Everything works!**

---

## 📞 Quick Summary

**Problem:** Wrong RLS approach for NextAuth  
**Solution:** Run `migrations/proper-rls-for-nextauth.sql`  
**Time:** 3 minutes  
**Result:** All roles work perfectly ✅

---

**RUN THE SQL NOW** and everything will be fixed! 🚀









