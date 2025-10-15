# 🆕 New User Roles: MedEd Team & CTF

## Overview

Two new user roles have been added to the Bleepy platform:

1. **MedEd Team** (`meded_team`)
2. **CTF** (`ctf`)

Both roles have the same permissions: **Educator permissions + Event Management + Contact Messages access**.

---

## 🎭 Role Hierarchy

```
Student (Basic Access)
    ↓
Educator (Resource Management)
    ↓
MedEd Team / CTF (Event Management + Contact Messages)
    ↓
Admin (Full Access)
```

---

## 🔑 Permissions Comparison

| Permission | Student | Educator | MedEd Team | CTF | Admin |
|---|---|---|---|---|---|
| **Practice Attempts** | 3/day | Unlimited | Unlimited | Unlimited | Unlimited |
| **Resource Management** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Event Management** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Contact Messages** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Bulk Event Upload** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **User Management** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **System Admin** | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 📋 Detailed Permissions

### MedEd Team Role (`meded_team`)

**Who should have this role:**
- Medical Education Team members
- Content coordinators
- Event managers

**Access:**
- ✅ **All Educator Permissions**
  - Upload resources (PDFs, videos, documents)
  - Edit own resources
  - Delete own resources
  - View all resources
  - Link resources to events

- ✅ **Event Management**
  - Bulk upload events via Excel/CSV
  - Create new events
  - Edit existing events
  - Manage event categories and formats
  - Access `/bulk-upload-ai` page
  - Access `/event-data` page
  - Access `/formats` page

- ✅ **Contact Messages**
  - View all contact form submissions
  - Update message status (new, read, replied, archived)
  - Add admin notes to messages
  - Delete messages
  - Access `/contact-messages` page

- ✅ **Unlimited Practice**
  - No 3-attempts-per-day limit
  - Can practice as many times as needed

---

### CTF Role (`ctf`)

**Who should have this role:**
- Clinical Teaching Fellows
- Senior teaching staff
- Training program coordinators

**Access:**
- ✅ **All Educator Permissions** (same as MedEd Team)
- ✅ **Event Management** (same as MedEd Team)
- ✅ **Contact Messages** (same as MedEd Team)
- ✅ **Unlimited Practice** (same as MedEd Team)

> **Note:** MedEd Team and CTF have identical permissions. The distinction is for organizational purposes only.

---

## 🛠️ Implementation Details

### Database Changes

**SQL Migration:** `migrations/add-meded-ctf-roles.sql`

```sql
-- Update role column constraint to include new roles
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ADD CONSTRAINT users_role_check 
CHECK (role IN ('student', 'educator', 'admin', 'meded_team', 'ctf'));
```

### Code Structure

**Role Constants:** `lib/roles.ts`
```typescript
export const USER_ROLES = {
  STUDENT: 'student',
  EDUCATOR: 'educator',
  ADMIN: 'admin',
  MEDED_TEAM: 'meded_team',
  CTF: 'ctf',
} as const;
```

**Permission Helpers:**
- `hasUnlimitedAttempts(role)` - Check if user has unlimited practice attempts
- `canManageEvents(role)` - Check if user can manage events
- `canViewContactMessages(role)` - Check if user can view contact messages
- `canManageResources(role)` - Check if user can manage resources

**React Hook:** `lib/useRole.ts`
```typescript
const { role, canManageEvents, canViewContactMessages, loading } = useRole();
```

**API Endpoint:** `/api/user/role`
- Returns current user's role
- Used by frontend hooks for permission checking

---

## 🔄 Updated APIs

The following API routes now support MedEd Team and CTF roles:

1. **`/api/attempts/check-limit`**
   - MedEd Team & CTF get unlimited attempts

2. **`/api/admin/contact-messages`** (GET, PATCH, DELETE)
   - MedEd Team & CTF can view and manage contact messages

3. **`/api/events/bulk-upload-parse`**
   - MedEd Team & CTF can upload events

4. **`/api/events/bulk-upload-create`**
   - MedEd Team & CTF can create events in bulk

---

## 📍 Updated Pages/Routes

### Accessible by MedEd Team & CTF:

1. **`/bulk-upload-ai`** - Bulk upload events via AI parsing
2. **`/event-data`** - Manage event data
3. **`/formats`** - Manage event formats
4. **`/contact-messages`** - View and manage contact form submissions

### Navigation Updates:

The navigation will automatically show appropriate links based on user role using the `useRole()` hook.

---

## 🎨 UI Badge Colors

Each role has a distinct badge color for easy identification:

| Role | Badge Color |
|---|---|
| Student | 🟢 Green |
| Educator | 🔵 Blue |
| MedEd Team | 🟣 Purple |
| CTF | 🟠 Orange |
| Admin | 🔴 Red |

```typescript
import { getRoleBadgeColor } from '@/lib/roles';

<Badge className={getRoleBadgeColor(user.role)}>
  {getRoleDisplayName(user.role)}
</Badge>
```

---

## 🔐 Security Considerations

1. **Database-driven** - Roles are stored in the database, not environment variables
2. **API-level checks** - All sensitive endpoints verify user role server-side
3. **Frontend permissions** - UI elements conditionally rendered based on role
4. **Type-safe** - TypeScript types ensure role consistency

---

## 📝 How to Assign Roles

### Method 1: Database Direct (Recommended)
```sql
UPDATE users 
SET role = 'meded_team' 
WHERE email = 'user@example.com';

UPDATE users 
SET role = 'ctf' 
WHERE email = 'doctor@example.com';
```

### Method 2: Admin Dashboard (Coming Soon)
Admins will be able to change user roles through the User Management interface.

---

## 🧪 Testing the New Roles

### Test MedEd Team Access:
1. Update a test user's role to `meded_team` in database
2. Sign in as that user
3. Verify access to:
   - Bulk upload events
   - Event management pages
   - Contact messages
   - Unlimited practice attempts

### Test CTF Access:
1. Update a test user's role to `ctf` in database
2. Sign in as that user
3. Verify same access as MedEd Team

### Test Permission Denials:
1. Try accessing protected pages as a `student` or `educator`
2. Should see "Unauthorized" or "Forbidden" messages
3. Should not see event management or contact message links in navigation

---

## 🚀 Migration Guide

### To Deploy These Changes:

1. **Run SQL Migration**
   ```bash
   # Connect to your Supabase database
   # Run: migrations/add-meded-ctf-roles.sql
   ```

2. **Deploy Code Updates**
   ```bash
   git pull
   npm install
   npm run build
   # Deploy to production
   ```

3. **Assign Roles**
   ```sql
   -- Update specific users to new roles
   UPDATE users SET role = 'meded_team' WHERE email IN (...);
   UPDATE users SET role = 'ctf' WHERE email IN (...);
   ```

4. **Verify**
   - Test with each role type
   - Check API responses
   - Verify navigation updates
   - Confirm unlimited attempts work

---

## ✅ Checklist

- [x] Database schema updated
- [x] Role constants defined
- [x] Permission helper functions created
- [x] React hook for role checking (`useRole`)
- [x] API endpoint for role fetching
- [x] API routes updated for new roles
- [x] Attempt limit checking updated
- [x] Contact messages access updated
- [x] Event management access updated
- [x] Documentation created

---

## 🔮 Future Enhancements

1. **Admin UI for Role Management**
   - Visual interface to assign roles
   - Bulk role updates
   - Role change history

2. **Role-specific Dashboards**
   - Custom dashboard views per role
   - Role-specific analytics

3. **Granular Permissions**
   - Individual permission toggles
   - Custom role creation

4. **Audit Logging**
   - Track role changes
   - Permission usage logs

---

## 📞 Support

For questions or issues with the new roles:
1. Check this documentation
2. Review `USER_ROLES_AND_PERMISSIONS.md`
3. Inspect `lib/roles.ts` for implementation details
4. Test with `useRole()` hook in components

---

## 📊 Quick Reference

**Check if user can manage events:**
```typescript
import { useRole } from '@/lib/useRole';

const { canManageEvents } = useRole();
if (canManageEvents) {
  // Show event management UI
}
```

**Check user's specific role:**
```typescript
import { useRole } from '@/lib/useRole';
import { USER_ROLES } from '@/lib/roles';

const { role } = useRole();
if (role === USER_ROLES.MEDED_TEAM || role === USER_ROLES.CTF) {
  // MedEd Team or CTF specific logic
}
```

**Server-side permission check:**
```typescript
import { canManageEvents } from '@/lib/roles';

const { data: user } = await supabase
  .from('users')
  .select('role')
  .eq('email', email)
  .single();

if (canManageEvents(user.role)) {
  // Allow access
}
```

---

**Version:** 1.0  
**Date:** October 14, 2025  
**Status:** ✅ Implemented and Ready for Use










