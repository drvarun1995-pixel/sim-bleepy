# 👥 User Roles and Permissions Guide

## Overview

Bleepy has a **3-tier role system** with different access levels and capabilities:

1. **Admin** 🔴
2. **Educator** 🔵  
3. **Student** 🟢

---

## 🎭 User Roles Breakdown

### 1. 🔴 **Admin** (Full Access)

**Who should be Admin:**
- Platform administrators
- Technical support staff
- System managers

**Access & Permissions:**

✅ **All Student & Educator Permissions** (everything below)

✅ **User Management**
- View all users in the system
- Change user roles (promote/demote)
- Approve unverified users
- Suspend/activate user accounts
- Delete user accounts
- Send emails to users
- View user statistics (attempts, scores)

✅ **Content Management**
- Upload resources (unlimited)
- Edit ANY resource (not just own)
- Delete ANY resource
- Manage events
- Create/edit/delete event categories
- Manage event formats and locations

✅ **Analytics & Monitoring**
- View platform-wide analytics
- Daily usage statistics
- Recent attempts (all users)
- Newsletter analytics
- Database health checks
- API usage tracking

✅ **System Administration**
- Access to `/admin` dashboard
- Database management
- Gamification setup
- Apply gamification to users
- Audit logs access
- Data retention settings
- Export audit logs

✅ **Special Privileges**
- **Unlimited practice attempts** (no 3/day limit)
- Bypass email verification requirements
- Access to all protected routes

**How to Become Admin:**
- Email must be listed in `NEXT_PUBLIC_ADMIN_EMAILS` environment variable
- Format: `admin1@example.com,admin2@example.com,admin3@example.com`

---

### 2. 🔵 **Educator** (Content Management)

**Who should be Educator:**
- Medical school faculty
- Teaching staff
- Course coordinators
- Content creators

**Access & Permissions:**

✅ **Resource Management**
- Upload resources (PDFs, videos, documents)
- Edit own resources
- Delete own resources
- Link resources to events
- View all resources

✅ **Event Access**
- View all events
- Access calendar
- Filter events by format/category
- Download event resources

✅ **Profile Management**
- Complete professional profile
- Set role, hospital/trust, specialty
- Select interests
- Manage notification preferences

✅ **Limited Analytics**
- View own upload statistics
- See resource download counts
- (Educator dashboard exists but may have limited features)

❌ **Cannot Do:**
- Change user roles
- Delete other users' resources
- Access admin dashboard
- View platform-wide analytics
- Manage users
- Access audit logs

---

### 3. 🟢 **Student** (Basic Access)

**Who should be Student:**
- Medical students (ARU, UCL, etc.)
- Foundation doctors (FY1, FY2)
- Default role for new users

**Access & Permissions:**

✅ **Learning & Practice**
- Access AI patient simulations
- Practice OSCE scenarios
- View consultation results
- Track personal progress
- **3 practice attempts per day** (resets daily at midnight London time)

✅ **Event System**
- View personalized events (based on profile)
- Access calendar
- Filter events by preferences
- View event details
- Download event resources

✅ **Profile & Personalization**
- Complete onboarding profile
- Set university (ARU, UCL)
- Set year of study (optional)
- Set foundation year (optional)
- Select interests
- Toggle "show all events" option

✅ **Resources Access**
- View all resources
- Download resources
- Filter resources by category/format
- Search resources

✅ **Gamification**
- Earn XP for completing scenarios
- Unlock achievements
- View leaderboard
- Track daily streaks
- Level progression

✅ **Account Management**
- Update profile
- Change password
- Request password reset
- Data export (GDPR)
- Delete account

❌ **Cannot Do:**
- Upload resources
- Edit/delete resources
- Access admin dashboard
- Access educator dashboard
- Change other users' data
- Unlimited practice attempts
- View platform analytics

---

## 🔐 Admin User Management Features

### Admin Users Page (`/admin/users`)

**Current Status**: ✅ **Fully Functional**

**Features Available:**

#### 1. **User List View**
- Shows all users in the system
- Displays user information:
  - Name & Email
  - Current role (with color-coded badges)
  - Email verification status
  - Total attempts
  - Average score
  - Join date

#### 2. **Search & Filtering**
- Search by name or email
- Filter by role (All/Admin/Educator/Student)
- Real-time filtering

#### 3. **Role Management**
- Change any user's role via dropdown
- Options: Student → Educator → Admin
- Real-time updates
- Confirmation messages

#### 4. **User Actions**
✅ **Approve User** - Bypass email verification
✅ **Manage** (Edit Modal) - Opens detailed management panel
  - Change role
  - View statistics
  - Send email
  - Suspend/Activate
  - Delete account

#### 5. **Email Notifications**
- Send custom emails to users
- Uses MailerLite integration
- Custom subject and content

#### 6. **User Deletion**
- Cascading delete (removes attempts, events, etc.)
- Confirmation dialog
- Permanent action

---

## 📊 Permission Matrix

| Feature | Admin | Educator | Student |
|---------|-------|----------|---------|
| **AI Simulations** | ✅ Unlimited | ✅ Unlimited | ✅ 3/day limit |
| **View Events** | ✅ All | ✅ All | ✅ Personalized |
| **View Resources** | ✅ | ✅ | ✅ |
| **Upload Resources** | ✅ Any | ✅ Own | ❌ |
| **Edit Resources** | ✅ Any | ✅ Own only | ❌ |
| **Delete Resources** | ✅ Any | ✅ Own only | ❌ |
| **Create Events** | ✅ | ⚠️ Limited | ❌ |
| **Manage Events** | ✅ All | ⚠️ Own | ❌ |
| **User Management** | ✅ | ❌ | ❌ |
| **Change Roles** | ✅ | ❌ | ❌ |
| **View Analytics** | ✅ Platform | ⚠️ Limited | ✅ Own only |
| **Admin Dashboard** | ✅ | ❌ | ❌ |
| **Educator Dashboard** | ✅ | ✅ | ❌ |
| **Student Dashboard** | ✅ | ✅ | ✅ |
| **Gamification** | ✅ | ✅ | ✅ |

---

## 🛡️ Security Implementation

### Admin Access Control

#### Environment-Based (Current)
```typescript
// Admin emails are configured in .env
NEXT_PUBLIC_ADMIN_EMAILS=admin@bleepy.com,varun@example.com

// Checked in middleware and API routes
const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || []
const isAdmin = adminEmails.includes(session.user.email)
```

#### Database Role-Based
```typescript
// Users table has role column
interface User {
  id: string
  email: string
  role: 'admin' | 'educator' | 'student'
}

// Checked in API routes
if (!['admin', 'educator'].includes(profile.role)) {
  return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
}
```

### Middleware Protection

Protected routes (in `middleware.ts`):
- `/admin/*` - Admin only (redirects others to `/dashboard`)
- `/dashboard/*` - Authenticated users only
- `/calendar/*` - Authenticated users only
- `/stations/*` - Authenticated users only

### Row-Level Security (RLS)

Supabase RLS policies ensure:
- Users can only view/edit their own data
- Service role (backend) can bypass RLS for admin operations
- Public access to stations and events (read-only)

---

## 📍 Dashboard Routes by Role

### Admin Routes
- `/admin` - Main admin dashboard (analytics, newsletter stats)
- `/admin/users` - User management
- `/admin/analytics` - Platform analytics
- `/admin/data-retention` - Data management

### Educator Routes
- `/dashboard/educator` - Educator dashboard
- `/dashboard/educator/profile` - Educator profile settings
- `/resources/upload` - Upload resources
- `/resources` - Manage own resources

### Student Routes
- `/dashboard` - Student dashboard (personalized events)
- `/dashboard/student` - Student-specific features
- `/dashboard/student/profile` - Student profile settings
- `/calendar` - Event calendar
- `/events` - Browse events
- `/resources` - Browse & download resources
- `/stations` - Practice scenarios
- `/dashboard/gamification` - Gamification stats

### Shared Routes
- `/dashboard/overview` - General overview
- `/dashboard/progress` - Progress tracking
- `/dashboard/privacy` - Privacy settings
- `/profile` - Edit profile

---

## 🔧 API Endpoints by Role

### Admin-Only APIs
```
GET  /api/admin/check - Check if user is admin
GET  /api/admin/users - List all users
PUT  /api/admin/users - Update user role
POST /api/admin/users/approve - Approve user
POST /api/admin/users/[userId]/actions - User actions (suspend/delete)
POST /api/admin/send-email - Send emails to users
GET  /api/admin/newsletter-analytics - Newsletter stats
GET  /api/admin/audit-logs - View audit logs
POST /api/admin/audit-logs/export - Export audit logs
GET  /api/analytics/daily-usage - Platform analytics
GET  /api/analytics/recent-attempts - All user attempts
```

### Admin & Educator APIs
```
POST /api/resources/upload - Upload resources (old method)
POST /api/resources/upload-url - Get signed upload URL (new method)
POST /api/resources/save-metadata - Save resource metadata
DELETE /api/resources/delete/[id] - Delete resources (own only for educators)
PUT /api/resources/edit/[id] - Edit resources (own only for educators)
```

### All Authenticated Users
```
GET  /api/user/profile - Get own profile
PUT  /api/user/profile - Update own profile
POST /api/user/profile-skip - Skip onboarding
GET  /api/user/stats - Get own statistics
POST /api/user/consent - Update GDPR consent
GET  /api/user/data-export - Export own data
POST /api/user/delete-account - Delete own account
POST /api/attempts - Create attempt
PUT  /api/attempts - Update attempt
GET  /api/attempts/check-limit - Check daily limit
GET  /api/gamification/achievements - Get own achievements
GET  /api/gamification/leaderboard - View leaderboard
```

### Public APIs
```
GET  /api/events - Browse events
GET  /api/events/[id] - Event details
GET  /api/events/[id]/resources - Event resources
GET  /api/resources - Browse resources
GET  /api/resources/download/[id] - Download resources
POST /api/newsletter/subscribe - Newsletter signup
```

---

## 👤 User Management Page - Feature Status

### ✅ Working Features

1. **List All Users** ✅
   - Shows all registered users
   - Displays role, verification status, activity stats

2. **Search Users** ✅
   - Search by name or email
   - Real-time filtering

3. **Filter by Role** ✅
   - Filter: All, Admin, Educator, Student
   - Updates user count

4. **Change User Roles** ✅
   - Dropdown to select new role
   - Save changes button
   - Success/error messages

5. **Approve Users** ✅
   - Bypass email verification
   - One-click approval
   - Confirmation dialog

6. **View User Stats** ✅
   - Total attempts
   - Average score
   - Join date
   - Email verification status

7. **User Actions Modal** ✅
   - Edit user details
   - Send custom emails
   - Suspend/activate (UI ready)
   - Delete users

### ⚠️ Partially Implemented

8. **Suspend/Activate Users** ⚠️
   - **UI**: ✅ Buttons exist
   - **Backend**: ⚠️ Logs action but doesn't enforce
   - **Effect**: No actual restriction on suspended users
   - **Need**: Add `status` column and check in auth

9. **Send Email** ⚠️
   - **UI**: ✅ Prompts for subject/content
   - **Backend**: ✅ API endpoint exists (`/api/admin/send-email`)
   - **Status**: Depends on MailerLite configuration

---

## 🚀 How to Use Admin User Management

### Access the Page
1. Ensure your email is in `NEXT_PUBLIC_ADMIN_EMAILS`
2. Sign in to the platform
3. Navigate to `/admin/users`

### Change a User's Role
1. Click "Manage" on any user row
2. Select new role from dropdown
3. Click "Save Changes"
4. User's permissions update immediately

### Approve Unverified Users
1. Look for users with "Pending" status
2. Click "Approve" button
3. Confirm the action
4. User can now access platform without email verification

### Delete a User
1. Click "Manage" on user row
2. Click "Delete" button (red)
3. Confirm deletion
4. User and all their data removed (attempts, events, etc.)

---

## 🔑 How Roles are Assigned

### New User Registration
```
User signs up
    ↓
Default Role: "student"
    ↓
Admin can change role in /admin/users
```

### Promoting Users

**Student → Educator:**
1. Go to `/admin/users`
2. Find the user
3. Click "Manage"
4. Change role to "Educator"
5. Save

**Educator → Admin:**
- Same process as above
- **Important**: Also add their email to `NEXT_PUBLIC_ADMIN_EMAILS` for full admin access

---

## 🎯 Role Assignment Best Practices

### Students
- All medical students
- Foundation doctors
- Default role for safety

### Educators
- Teaching staff
- Content creators
- Those who need to upload resources
- Trust-based assignment

### Admins
- Very limited (1-3 people max)
- Platform managers only
- Full system access

---

## 🐛 Known Limitations & Future Enhancements

### Current Limitations

1. **No User Status Field**
   - Suspended users can still log in
   - Need to add `status` column: 'active', 'suspended', 'deleted'

2. **No Last Login Tracking**
   - Can't see when users last accessed platform
   - Need to add `last_login` timestamp

3. **No Bulk Actions**
   - Can't select multiple users
   - No bulk role changes or deletions

4. **No Activity Logs**
   - Can't see what educators/students did
   - Limited audit trail (exists but not tied to user actions)

5. **No Email Templates**
   - Admin emails are plain text via prompt
   - Could use rich text editor

### Recommended Enhancements

#### Phase 1 (Quick Wins)
- [ ] Add user status column and enforcement
- [ ] Add last_login tracking
- [ ] Better email composer (modal with rich text)
- [ ] Export user list to CSV

#### Phase 2 (Medium Priority)
- [ ] Bulk user actions (select multiple)
- [ ] User activity timeline
- [ ] Advanced search (by date, activity level)
- [ ] User import from CSV

#### Phase 3 (Advanced)
- [ ] Role permissions customization
- [ ] Custom role creation
- [ ] Detailed audit logs per user
- [ ] User engagement scoring

---

## 💾 Database Schema for Roles

### Current Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'student', -- 'admin', 'educator', 'student'
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Profile fields
  role_type VARCHAR(50),  -- 'medical_student', 'foundation_doctor', etc.
  university VARCHAR(100),
  study_year VARCHAR(10),
  foundation_year VARCHAR(10),
  hospital_trust TEXT,
  specialty TEXT,
  interests JSONB,
  profile_completed BOOLEAN DEFAULT FALSE,
  show_all_events BOOLEAN DEFAULT FALSE
);
```

### Recommended Schema Additions
```sql
-- Add user status
ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
-- Options: 'active', 'suspended', 'pending', 'deleted'

-- Add login tracking
ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;

-- Add metadata
ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN suspension_reason TEXT;
ALTER TABLE users ADD COLUMN suspended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN suspended_by UUID REFERENCES users(id);
```

---

## 🔍 Checking Current Role Permissions

### Check User's Role
```sql
SELECT id, email, name, role, email_verified 
FROM users 
WHERE email = 'user@example.com';
```

### List All Admins
```sql
SELECT id, email, name, created_at 
FROM users 
WHERE role = 'admin'
ORDER BY created_at DESC;
```

### List All Educators
```sql
SELECT id, email, name, created_at 
FROM users 
WHERE role = 'educator'
ORDER BY created_at DESC;
```

### User Activity Summary
```sql
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  COUNT(a.id) as total_attempts,
  MAX(a.start_time) as last_activity
FROM users u
LEFT JOIN attempts a ON u.id = a.user_id
GROUP BY u.id, u.email, u.name, u.role
ORDER BY total_attempts DESC;
```

---

## 🎯 Quick Reference

### Default Permissions

| Action | Required Role |
|--------|--------------|
| View own data | Any authenticated |
| Upload resources | Educator or Admin |
| Delete any resource | Admin only |
| Delete own resource | Educator or Admin |
| Change user roles | Admin only |
| View all users | Admin only |
| Access /admin | Admin only |
| Unlimited attempts | Admin only |
| View platform analytics | Admin only |

---

## 🔐 Security Best Practices

### For Admins

1. **Limit Admin Accounts**
   - Keep admin list small (1-3 people)
   - Review regularly

2. **Use Strong Passwords**
   - All admin accounts should use strong passwords
   - Enable 2FA (when implemented)

3. **Regular Audits**
   - Review user roles monthly
   - Check for inactive admin accounts
   - Monitor unusual activity

4. **Role Assignment**
   - Only promote trusted educators
   - Verify identity before promoting
   - Document role changes

### For All Users

1. **Verify Email**
   - Ensures account ownership
   - Prevents spam accounts

2. **Complete Profile**
   - Better personalization
   - More accurate analytics

3. **Regular Password Changes**
   - Use password reset feature
   - Avoid reusing passwords

---

## 📞 Support

### To Request Role Change
Users should:
1. Email platform admin
2. Provide justification for educator role
3. Wait for admin approval

### To Report Issues
- Use contact form
- Email support
- Admin dashboard feedback

---

**Last Updated**: October 7, 2025  
**Version**: 1.0  
**Status**: ✅ User Management Fully Functional

