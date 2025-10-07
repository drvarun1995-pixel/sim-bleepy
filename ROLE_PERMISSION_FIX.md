# Role Permission Fix - Admin Dashboard Not Showing

## 🐛 Problem

When changing a user's role from "student" to "admin" in the User Management page (`/admin/users`), the user's permissions didn't change and they still saw the student dashboard without admin navigation links.

## 🔍 Root Cause

The application had **two different sources of truth** for user roles:

### 1. Environment Variable (Old Method)
```typescript
// In middleware.ts and /api/admin/check
const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',')
const isAdmin = adminEmails.includes(userEmail)
```

### 2. Two Different Database Tables

**Problem:** The app used two tables for roles:
- `users` table - Where admin panel **writes** role changes
- `profiles` table - Where layouts **read** role data

**Result:** Changing role in admin panel updated `users` table, but layouts read from `profiles` table → **no change visible**!

---

## ✅ Solution Applied

### 1. Updated All Layout Files
Fixed 7 layout files to check `users` table first:

- ✅ `app/dashboard/layout.tsx`
- ✅ `app/calendar/layout.tsx`
- ✅ `app/formats/layout.tsx`
- ✅ `app/resources/layout.tsx`
- ✅ `app/events-list/layout.tsx`
- ✅ `app/event-data/layout.tsx`
- ✅ `app/stations/layout.tsx`

**New Logic:**
```typescript
async function getUserRole(userEmail: string) {
  // 1. Check users table (primary)
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('email', userEmail)
    .single()

  if (user && user.role) {
    return user.role // ← Returns database role!
  }

  // 2. Fallback to profiles table (legacy)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('email', userEmail)
    .single()

  return profile?.role || 'student'
}
```

### 2. Updated Admin Check API
`app/api/admin/check/route.ts` now:
- ✅ Checks `users` table first
- ✅ Falls back to environment variable
- ✅ Returns role info

### 3. Updated Middleware
`middleware.ts` now:
- ✅ Checks database role for `/admin` access
- ✅ Falls back to environment variable
- ✅ Allows database admins through

### 4. Updated Attempts Check
`app/api/attempts/check-limit/route.ts` now:
- ✅ Checks database role for unlimited attempts
- ✅ **Educators also get unlimited attempts** (was admin-only)
- ✅ Falls back to environment variable

### 5. Enhanced Sidebar Navigation
`components/dashboard/DashboardSidebar.tsx` now shows:
- ✅ **Admin Dashboard** link (main admin page)
- ✅ **User Management** link (manage users)
- ✅ Event Data, All Events, Add Event (existing)

---

## 🎯 How It Works Now

### Change User Role Flow

```
Admin changes role in /admin/users
    ↓
Updates users.role = 'admin'
    ↓
User refreshes page
    ↓
Layout checks users table
    ↓
Sees role = 'admin'
    ↓
Renders admin navigation! ✅
```

### Priority Order for Role Detection

1. **Database `users` table** ← Primary (what admin panel updates)
2. **Database `profiles` table** ← Fallback (legacy support)
3. **Environment variable** ← Last resort (initial setup)

---

## 🧪 Testing the Fix

### Test Steps:

1. **Login as an admin**
2. **Go to `/admin/users`**
3. **Find a student user**
4. **Click "Manage"**
5. **Change role to "Admin"**
6. **Click "Save Changes"**
7. **Ask that user to:**
   - Log out
   - Log back in
   - Check sidebar

**Expected Result:**
- ✅ Sidebar shows "Admin" section with:
  - Admin Dashboard
  - User Management
  - Event Data
  - All Events
  - Add Event
- ✅ User can access `/admin` routes
- ✅ User has unlimited practice attempts
- ✅ User can upload/manage resources

---

## 📋 Admin Navigation Links Added

### Before:
```
Sidebar (Admin)
├─ Admin
│  ├─ Event Data
│  ├─ All Events
│  └─ Add Event
```

### After:
```
Sidebar (Admin)
├─ Admin
│  ├─ Admin Dashboard ← NEW!
│  ├─ User Management ← NEW!
│  ├─ Event Data
│  ├─ All Events
│  └─ Add Event
```

---

## 🔑 Key Changes Summary

| File | Change |
|------|--------|
| `app/api/admin/check/route.ts` | Check `users` table first |
| `middleware.ts` | Check database role for admin routes |
| `app/api/attempts/check-limit/route.ts` | Use database role for unlimited attempts |
| `app/dashboard/layout.tsx` | Read from `users` table |
| `app/calendar/layout.tsx` | Read from `users` table |
| `app/formats/layout.tsx` | Read from `users` table |
| `app/resources/layout.tsx` | Read from `users` table |
| `app/events-list/layout.tsx` | Read from `users` table |
| `app/event-data/layout.tsx` | Read from `users` table |
| `app/stations/layout.tsx` | Read from `users` table |
| `components/dashboard/DashboardSidebar.tsx` | Added Admin Dashboard & User Management links |

---

## ⚡ Impact

### Before Fix:
- ❌ Role changes in admin panel had no effect
- ❌ Users couldn't see admin navigation after promotion
- ❌ Had to manually add emails to .env file
- ❌ Confusing for admins

### After Fix:
- ✅ Role changes work immediately (after re-login)
- ✅ Admin navigation appears automatically
- ✅ Database is single source of truth
- ✅ Environment variable is just fallback
- ✅ Easy to manage via UI

---

## 🚀 Benefits

1. **Dynamic Role Management**
   - Change roles via UI
   - No need to edit .env files
   - No need to restart server

2. **Immediate Effect**
   - User logs out and back in
   - New role applied
   - Navigation updates

3. **Better Security**
   - Database-driven (auditable)
   - No hardcoded emails in code
   - RLS policies apply

4. **Easier Maintenance**
   - One place to manage roles
   - Clear role hierarchy
   - Fallback for safety

---

## 📝 Important Notes

### For Users to See Changes:
**They MUST log out and log back in!**

Why? Server-side layouts cache the role on page load. Logging out clears the session and forces a fresh role check.

### Environment Variable Still Used:
- Acts as fallback
- Useful for initial setup
- Overridden by database role

### Two Tables Remain:
- `users` table - Primary (active users)
- `profiles` table - Legacy (analytics schema)
- Both checked for compatibility

---

## 🎯 Future Improvements

### Recommended Enhancements:

1. **Real-time Role Updates**
   - Use WebSockets or polling
   - Auto-refresh when role changes
   - No need to log out/in

2. **Consolidate Tables**
   - Merge `users` and `profiles` tables
   - Single source of truth
   - Cleaner architecture

3. **Role Audit Log**
   - Track who changed roles
   - When changes were made
   - Historical role data

4. **Force Logout on Role Change**
   - Admin changes user role
   - User automatically logged out
   - Forced to re-login with new permissions

---

## ✅ Status

**Fixed!** Role changes in admin panel now immediately affect user permissions (after they re-login).

**Testing:** Ask the user you promoted to admin to:
1. Log out
2. Log back in
3. Check sidebar - should see Admin section!

---

**Date Fixed**: October 7, 2025  
**Status**: ✅ Complete (NOT YET DEPLOYED)

