# 🚀 Quick Start: Fix RLS Errors

## ⚡ 3 Steps to Fix Everything

### 1️⃣ Run SQL Script (1 minute)

Open Supabase SQL Editor and run:
```
migrations/cleanup-authenticated-user-rls-policies.sql
```

### 2️⃣ Test Event Creation (2 minutes)

Try creating:
- ✅ New event
- ✅ New organizer
- ✅ New location
- ✅ New category

All should work without errors!

### 3️⃣ Deploy (Optional)

```bash
git add .
git commit -m "Fix: Move event management to API routes"
git push origin main
vercel --prod
```

---

## ✅ What Was Fixed

**Problem:** RLS policies blocked event management because they checked for Supabase JWT tokens, but your app uses NextAuth.

**Solution:** Moved all operations to API routes that:
- Use NextAuth for authentication ✅
- Check user roles (admin/educator/meded_team/ctf) ✅
- Use service role key for database access ✅
- Keep RLS enabled for security ✅

---

## 📁 Files Changed

### API Routes Created:
- `app/api/events/categories/route.ts`
- `app/api/events/formats/route.ts`
- `app/api/events/speakers/route.ts`
- `app/api/events/locations/route.ts`
- `app/api/events/organizers/route.ts`
- `app/api/events/create/route.ts`
- `app/api/events/[id]/route.ts` (updated)

### Client Library Updated:
- `lib/events-api.ts` (all functions now use API routes)

### Migration Script:
- `migrations/cleanup-authenticated-user-rls-policies.sql`

---

## 🔒 Security

- ✅ RLS stays ENABLED
- ✅ Service role policies active
- ✅ NextAuth authentication required
- ✅ Role-based authorization enforced
- ✅ Service role key never exposed to client

---

## 🎯 Expected Result

After running the SQL script:
- ✅ Event creation works
- ✅ Organizer creation works
- ✅ Location creation works
- ✅ Speaker creation works
- ✅ All updates/deletes work
- ✅ No more RLS errors
- ✅ RLS stays enabled

---

## 📞 Need Help?

Check `WHAT_YOU_NEED_TO_DO.md` for detailed instructions and troubleshooting.

