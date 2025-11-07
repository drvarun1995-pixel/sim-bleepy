# 🔐 Comprehensive User Role Permissions Guide

**Last Updated:** November 2025  
**Application:** Bleepy  
**Version:** 1.1

---

## 📋 Table of Contents

1. [Role Hierarchy](#role-hierarchy)
2. [Role Overview](#role-overview)
3. [Detailed Permissions by Role](#detailed-permissions-by-role)
4. [API Route Permissions](#api-route-permissions)
5. [Page Access Matrix](#page-access-matrix)
6. [Feature Permissions Matrix](#feature-permissions-matrix)
7. [Implementation Details](#implementation-details)

---

## 🎭 Role Hierarchy

```
STUDENT (Basic Access)
    ↓
EDUCATOR (Resource Management)
    ↓
MEDED_TEAM / CTF (Event Management + Contact Messages)
    ↓
ADMIN (Full System Access)
```

**Role Definitions:**
- **STUDENT** (`student`): Basic access to learning resources
- **EDUCATOR** (`educator`): Student permissions + resource management
- **MEDED_TEAM** (`meded_team`): Educator permissions + event management + contact messages
- **CTF** (`ctf`): Educator permissions + event management + contact messages
- **ADMIN** (`admin`): Full access to everything

---

## 👥 Role Overview

### 1. 🟢 **STUDENT** (`student`)
**Purpose:** Basic end-user access to learning resources and events

**Key Characteristics:**
- Limited practice attempts (3 per day)
- View-only access to most content
- Can book and attend events
- Can submit feedback
- No content creation or management

### 2. 🔵 **EDUCATOR** (`educator`)
**Purpose:** Content creators and resource managers

**Key Characteristics:**
- All student permissions +
- Resource upload and management
- Announcement creation
- File and teaching request management
- Cohort management
- Educator-specific analytics

### 3. 🟣 **MEDED_TEAM** (`meded_team`)
**Purpose:** Medical Education Team - Event coordinators and administrators

**Key Characteristics:**
- All educator permissions +
- Full event management (create, edit, delete)
- Bulk event upload via AI
- QR code generation and management
- Feedback form management
- Certificate management
- Contact message access
- Booking management
- Attendance tracking

### 4. 🟠 **CTF** (`ctf`)
**Purpose:** Clinical Teaching Fellows - Same as MedEd Team for organizational distinction

**Key Characteristics:**
- **Identical to MedEd Team**
- All educator permissions +
- Full event management
- Contact message access
- Same event and administrative capabilities

### 5. 🔴 **ADMIN** (`admin`)
**Purpose:** System administrators with complete platform control

**Key Characteristics:**
- All permissions from all other roles +
- User management (create, edit, delete, change roles)
- System-wide analytics
- Data retention management
- Audit log access
- Unlimited practice attempts
- Full database access
- Admin dashboard access

---

## 📝 Detailed Permissions by Role

### 🟢 STUDENT Permissions

#### ✅ What Students CAN Do:

**Learning & Practice:**
- Access AI Patient Simulator stations
- Practice scenarios (3 attempts per day limit)
- View practice history and results
- View gamification progress and achievements
- Access learning resources (view only)

**Events & Booking:**
- View all published events
- Browse events by category, format, date
- Book spots on events with booking enabled
- Join waitlists for full events
- View personal calendar with bookings
- Scan QR codes for attendance
- Submit feedback forms (when required)
- Receive feedback invite emails

**Certificates:**
- Receive auto-generated certificates
- Download own certificates
- View "My Certificates" page

**Portfolio:**
- Upload files to IMT Portfolio
- Download own portfolio files
- Manage own portfolio content

**Profile:**
- View own profile
- Edit own profile information
- Upload profile picture
- Change password

**Dashboard:**
- Access personalized dashboard
- View upcoming events
- See own booking status
- View own progress and statistics

#### ❌ What Students CANNOT Do:
- Create or edit events
- Upload or manage resources
- Access admin pages
- Manage other users' bookings
- View contact messages
- Access event management tools
- Bulk upload events
- Generate QR codes
- Manage feedback forms
- Manage certificates for others
- Change user roles
- Access system analytics
- Export booking data

---

### 🔵 EDUCATOR Permissions

#### ✅ What Educators CAN Do:

**All Student Permissions +**

**Resource Management:**
- Upload resources (PDFs, videos, documents, images)
- Edit own resources
- Delete own resources
- Link resources to events
- Organize resources by category
- Set resource metadata

**Announcements:**
- Create announcements
- Edit own announcements
- Delete own announcements
- View announcement analytics

**File & Teaching Requests:**
- View file requests from students
- Approve/deny file requests
- Add notes to file requests
- Manage teaching requests
- Respond to teaching requests

**Cohort Management:**
- Create cohorts
- Manage cohorts
- View cohort analytics
- Assign students to cohorts

**Booking Management:**
- View all event bookings (`/bookings`)
- Access booking management for specific events
- Cancel user bookings (with reason)
- Delete cancelled and attended bookings
- View booking statistics
- Export booking data to CSV

**Analytics:**
- Educator dashboard analytics
- View student progress
- Resource usage statistics
- Own resource analytics

#### ❌ What Educators CANNOT Do:
- Create or edit events (only MedEd Team/CTF/Admin)
- Access event data page (`/event-data`)
- Bulk upload events
- Generate QR codes
- Manage feedback forms
- Access contact messages
- Change user roles
- Access system-wide admin functions
- Unlimited practice attempts (limited to 3/day like students)

---

### 🟣 MEDED_TEAM Permissions

#### ✅ What MedEd Team CAN Do:

**All Educator Permissions +**

**Event Management:**
- Create new events (`/event-data?tab=add-event`)
- Edit existing events (`/event-data?edit=<id>`)
- Delete events
- View all events (`/event-data?tab=all-events`)
- Bulk upload events via Excel/CSV (`/bulk-upload-ai`)
- Manage event categories
- Manage event formats (`/formats`)
- Manage event locations
- Manage event organizers
- Configure booking settings
- Enable/disable QR attendance
- Enable/disable feedback
- Configure certificate automation
- Set feedback requirements for certificates

**QR Codes:**
- Generate QR codes for events
- View QR codes for events (`/qr-codes`)
- Regenerate QR codes
- Deactivate QR codes
- View real-time attendance scanning

**Feedback Management:**
- Create feedback forms
- Edit feedback forms
- Delete feedback forms
- View feedback analytics
- View individual form responses
- Export feedback data
- Link feedback forms to events
- Configure anonymous feedback

**Certificates:**
- Create certificate templates
- Edit certificate templates
- Delete certificate templates
- Generate certificates manually
- Auto-generate certificates
- Send certificate emails
- View certificate analytics

**Booking Management:**
- Advanced booking management
- Booking approval workflows
- Booking statistics and reports
- Export comprehensive booking data

**Attendance Tracking:**
- View attendance for all events
- Export attendance data
- Track QR scan analytics
- Manage attendance records

**Contact Messages:**
- View all contact form submissions (`/contact-messages`)
- Update message status (new, read, replied, archived)
- Add admin notes to messages
- Delete messages
- Filter and search messages

**Smart Bulk Upload:**
- Upload events via AI parsing (`/bulk-upload-ai`)
- Parse Excel/CSV files with AI assistance
- Auto-populate event fields
- Batch create multiple events

#### ❌ What MedEd Team CANNOT Do:
- Change user roles
- Access user management (`/admin-users`)
- Access system-wide analytics (`/analytics`)
- Access data retention settings
- Access audit logs
- Unlimited practice attempts (limited to 3/day)
- Access admin dashboard (`/admin-dashboard`)

---

### 🟠 CTF Permissions

#### ✅ What CTF CAN Do:

**Exactly the same as MedEd Team:**
- All educator permissions +
- Full event management
- QR code management
- Feedback management
- Certificate management
- Contact message access
- Booking management
- Attendance tracking

> **Note:** CTF and MedEd Team are functionally identical. The distinction is organizational only.

#### ❌ What CTF CANNOT Do:
- Same restrictions as MedEd Team
- Change user roles
- Access admin-only functions

---

### 🔴 ADMIN Permissions

#### ✅ What Admins CAN Do:

**All Permissions from All Other Roles +**

**User Management:**
- View all users (`/admin-users`)
- Create new users
- Edit user information
- Change user roles (promote/demote)
- Delete user accounts
- Approve unverified users
- Suspend/activate accounts
- Send emails to users
- View user statistics and analytics
- Export user data
- Export login data

**System Administration:**
- Access admin dashboard (`/admin-dashboard`)
- Platform-wide analytics (`/analytics`)
- Simulator analytics (`/simulator-analytics`)
- Database health checks
- API usage tracking
- Daily usage statistics
- Newsletter analytics
- Database management tools

**Data Management:**
- Data retention settings (`/data-retention`)
- Configure data retention policies
- Export audit logs
- View audit logs
- Clear login data
- Manage data lifecycle

**Gamification:**
- Setup gamification system
- Apply gamification to users
- Configure gamification rules
- Manage gamification rewards

**Special Privileges:**
- **Unlimited practice attempts** (no 3/day limit)
- Bypass email verification requirements
- Access to all protected routes
- Service role database access
- Bypass RLS policies (via service role)

**Contact Messages:**
- All MedEd Team contact message permissions +
- Advanced filtering and search
- Bulk message operations

#### ❌ What Admins CANNOT Do:
- There are no restrictions for Admin users

---

## 🔌 API Route Permissions

### Authentication Required Routes

All API routes require authentication unless specified otherwise. Below are role-specific restrictions:

#### User Role Management
- **`GET /api/user/role`**: All authenticated users
- **`GET /api/user/profile`**: Own profile only (unless admin)
- **`PUT /api/user/profile`**: Own profile only (unless admin)

#### Admin Routes (Admin Only)
- **`GET /api/admin/users`**: Admin only
- **`POST /api/admin/users/add`**: Admin only
- **`POST /api/admin/users/[userId]/actions`**: Admin only (role changes, account actions)
- **`GET /api/admin/contact-messages`**: Admin, MedEd Team, CTF
- **`PATCH /api/admin/contact-messages`**: Admin, MedEd Team, CTF
- **`DELETE /api/admin/contact-messages`**: Admin, MedEd Team, CTF
- **`GET /api/admin/check`**: All authenticated users
- **`GET /api/admin/test-database`**: Admin only
- **`GET /api/admin/audit-logs`**: Admin only
- **`POST /api/admin/data-retention`**: Admin only
- **`POST /api/admin/send-email`**: Admin only
- **`GET /api/admin/newsletter-analytics`**: Admin only
- **`POST /api/admin/setup-gamification`**: Admin only
- **`POST /api/admin/apply-gamification`**: Admin only

#### Event Management Routes
- **`POST /api/events/create`**: Admin, MedEd Team, CTF, Educator
- **`PUT /api/events/[id]`**: Admin, MedEd Team, CTF
- **`DELETE /api/events/[id]`**: Admin, MedEd Team, CTF
- **`POST /api/events/bulk-upload-parse`**: Admin, MedEd Team, CTF
- **`POST /api/events/bulk-upload-create`**: Admin, MedEd Team, CTF
- **`GET /api/events/categories`**: All authenticated users
- **`POST /api/events/categories`**: Admin, MedEd Team, CTF
- **`PUT /api/events/update-status`**: Admin, MedEd Team, CTF

#### QR Code Routes
- **`POST /api/qr-codes/generate`**: Admin, MedEd Team, CTF
- **`GET /api/qr-codes/[eventId]`**: Admin, MedEd Team, CTF
- **`POST /api/qr-codes/scan`**: All authenticated users (when scanning)
- **`POST /api/qr-codes/regenerate`**: Admin, MedEd Team, CTF
- **`PUT /api/qr-codes/update`**: Admin, MedEd Team, CTF
- **`DELETE /api/qr-codes/delete`**: Admin only
- **`GET /api/qr-codes/[eventId]/realtime`**: Admin, MedEd Team, CTF
- **`GET /api/qr-codes/attendees/[qrCodeId]`**: Admin, MedEd Team, CTF

#### Booking Routes
- **`GET /api/bookings`**: All authenticated users (own bookings only, unless privileged)
- **`POST /api/bookings`**: All authenticated users
- **`DELETE /api/bookings/[id]`**: Own booking or privileged (Educator+)
- **`GET /api/bookings/event/[eventId]`**: Admin, MedEd Team, CTF, Educator
- **`GET /api/bookings/stats`**: Admin, MedEd Team, CTF, Educator
- **`POST /api/bookings/[id]/cancel`**: Own booking or privileged

#### Feedback Routes
- **`POST /api/feedback/submit`**: All authenticated users (when feedback enabled)
- **`GET /api/feedback/forms`**: All authenticated users
- **`POST /api/feedback/forms`**: Admin, MedEd Team, CTF
- **`GET /api/feedback/forms/[formId]`**: All authenticated users
- **`PUT /api/feedback/forms/[formId]`**: Admin, MedEd Team, CTF
- **`DELETE /api/feedback/forms/[formId]`**: Admin only
- **`GET /api/feedback/forms/[formId]/responses`**: Admin, MedEd Team, CTF
- **`GET /api/feedback/analytics`**: Admin, MedEd Team, CTF
- **`GET /api/feedback/responses`**: Admin, MedEd Team, CTF
- **`GET /api/feedback/templates`**: Admin, MedEd Team, CTF
- **`POST /api/feedback/templates`**: Admin, MedEd Team, CTF
- **`PUT /api/feedback/templates/[templateId]`**: Admin, MedEd Team, CTF
- **`DELETE /api/feedback/templates/[templateId]`**: Admin only

#### Certificate Routes
- **`GET /api/certificates`**: All authenticated users (own certificates)
- **`POST /api/certificates/generate`**: Admin, MedEd Team, CTF
- **`POST /api/certificates/auto-generate`**: System (cron) or Admin, MedEd Team, CTF
- **`POST /api/certificates/generate-with-fields`**: Admin, MedEd Team, CTF
- **`GET /api/certificates/templates`**: All authenticated users
- **`POST /api/certificates/templates`**: Admin, MedEd Team, CTF
- **`GET /api/certificates/templates/[id]`**: All authenticated users
- **`PUT /api/certificates/templates/[id]`**: Admin, MedEd Team, CTF (own templates)
- **`DELETE /api/certificates/templates/[id]`**: Admin, MedEd Team, CTF (own templates)
- **`POST /api/certificates/upload-image`**: Admin, MedEd Team, CTF
- **`POST /api/certificates/send-email`**: Admin, MedEd Team, CTF
- **`DELETE /api/certificates/[id]`**: Admin only

#### Resource Routes
- **`GET /api/resources`**: All authenticated users
- **`POST /api/resources/upload`**: Admin, MedEd Team, CTF, Educator
- **`POST /api/resources/upload-url`**: Admin, MedEd Team, CTF, Educator
- **`PUT /api/resources/edit/[id]`**: Admin, MedEd Team, CTF, Educator (own resources)
- **`DELETE /api/resources/delete/[id]`**: Admin (any), or MedEd Team/CTF/Educator (own)
- **`GET /api/resources/week-files`**: All authenticated users

#### Attendance Routes
- **`GET /api/attendance/[eventId]`**: Admin, MedEd Team, CTF, Educator
- **`GET /api/attendance/[eventId]/export`**: Admin, MedEd Team, CTF, Educator

#### Announcement Routes
- **`GET /api/announcements`**: All authenticated users
- **`POST /api/announcements`**: Admin, MedEd Team, CTF, Educator
- **`PUT /api/announcements/[id]`**: Admin, MedEd Team, CTF, Educator (own announcements)
- **`DELETE /api/announcements/[id]`**: Admin (any), or MedEd Team/CTF/Educator (own)

#### File & Teaching Request Routes
- **`GET /api/admin/file-requests`**: Admin, MedEd Team, CTF, Educator
- **`PATCH /api/admin/file-requests/[id]`**: Admin, MedEd Team, CTF, Educator
- **`GET /api/admin/teaching-requests`**: Admin, MedEd Team, CTF, Educator
- **`PATCH /api/admin/teaching-requests/[id]`**: Admin, MedEd Team, CTF, Educator

#### Portfolio Routes
- **`GET /api/portfolio/files`**: All authenticated users (own files)
- **`POST /api/portfolio/upload`**: All authenticated users
- **`GET /api/portfolio/files/[id]`**: All authenticated users (own files)
- **`DELETE /api/portfolio/files/[id]`**: All authenticated users (own files)
- **`GET /api/portfolio/download-all`**: All authenticated users (own portfolio)

#### Analytics Routes
- **`GET /api/analytics/downloads`**: Admin only
- **`GET /api/user/stats`**: All authenticated users (own stats)

#### Attempts Routes
- **`GET /api/attempts/check-limit`**: All authenticated users
  - Returns: `{ allowed: boolean, attemptsRemaining: number, hasUnlimited: boolean }`
  - Unlimited attempts: Admin only
  - 3 attempts/day: All other roles

---

## 📍 Page Access Matrix

| Page/Route | Student | Educator | MedEd Team | CTF | Admin |
|------------|---------|----------|-----------|-----|-------|
| **Dashboard & Main** |
| `/dashboard` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/dashboard/overview` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/dashboard/progress` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/dashboard/gamification` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/calendar` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/events-list` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/formats` | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Learning Resources** |
| `/stations` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/downloads` | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Bookings** |
| `/my-bookings` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/bookings` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/bookings/[eventId]` | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Portfolio** |
| `/imt-portfolio` | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Event Management** |
| `/event-data` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/event-data?tab=all-events` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/event-data?tab=add-event` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/event-data?edit=<id>` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/bulk-upload-ai` | ❌ | ❌ | ✅ | ✅ | ✅ |
| **QR Codes & Attendance** |
| `/qr-codes` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/qr-codes/[eventId]` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/scan-attendance` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/scan-attendance-smart` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/attendance-tracking` | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Feedback** |
| `/feedback` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/feedback/forms` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/feedback/forms/[formId]` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/feedback/forms/[formId]/responses` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/feedback/templates` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/feedback/templates/[templateId]` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/feedback/templates/[templateId]/edit` | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Certificates** |
| `/certificates` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/certificates/templates` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/certificates/templates?create` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/certificates/image-builder` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/certificates/generate` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/mycertificates` | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Announcements** |
| `/dashboard/announcements` | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Educator Features** |
| `/dashboard/educator/cohorts` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/dashboard/educator/analytics` | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Admin Features** |
| `/admin-dashboard` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/admin-users` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/analytics` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/simulator-analytics` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/data-retention` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/contact-messages` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/admin-file-requests` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/admin-teaching-requests` | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Profile & Settings** |
| `/onboarding/profile` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/profile` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/calendar-subscription` | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Other** |
| `/request-file` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/request-teaching` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/results/[stationId]` | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🎯 Feature Permissions Matrix

| Feature | Student | Educator | MedEd Team | CTF | Admin |
|---------|---------|----------|-----------|-----|-------|
| **Practice & Simulation** |
| Practice stations | ✅ (3/day) | ✅ (3/day) | ✅ (3/day) | ✅ (3/day) | ✅ (unlimited) |
| View results | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gamification | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Resources** |
| View resources | ✅ | ✅ | ✅ | ✅ | ✅ |
| Upload resources | ❌ | ✅ | ✅ | ✅ | ✅ |
| Edit resources | ❌ | ✅ (own) | ✅ (own) | ✅ (own) | ✅ (any) |
| Delete resources | ❌ | ✅ (own) | ✅ (own) | ✅ (own) | ✅ (any) |
| **Events** |
| View events | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create events | ❌ | ❌ | ✅ | ✅ | ✅ |
| Edit events | ❌ | ❌ | ✅ | ✅ | ✅ |
| Delete events | ❌ | ❌ | ✅ | ✅ | ✅ |
| Bulk upload events | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage categories | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage formats | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Bookings** |
| Book events | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cancel own bookings | ✅ | ✅ | ✅ | ✅ | ✅ |
| View all bookings | ❌ | ✅ | ✅ | ✅ | ✅ |
| Cancel any booking | ❌ | ✅ | ✅ | ✅ | ✅ |
| Delete bookings | ❌ | ✅ | ✅ | ✅ | ✅ |
| Export booking data | ❌ | ✅ | ✅ | ✅ | ✅ |
| **QR Codes** |
| Scan QR codes | ✅ | ✅ | ✅ | ✅ | ✅ |
| Generate QR codes | ❌ | ❌ | ✅ | ✅ | ✅ |
| View QR analytics | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Feedback** |
| Submit feedback | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create feedback forms | ❌ | ❌ | ✅ | ✅ | ✅ |
| View feedback analytics | ❌ | ❌ | ✅ | ✅ | ✅ |
| View form responses | ❌ | ❌ | ✅ | ✅ | ✅ |
| Export feedback data | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Certificates** |
| Receive certificates | ✅ | ✅ | ✅ | ✅ | ✅ |
| Download own certificates | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create templates | ❌ | ❌ | ✅ | ✅ | ✅ |
| Generate certificates | ❌ | ❌ | ✅ | ✅ | ✅ |
| Send certificate emails | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Announcements** |
| View announcements | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create announcements | ❌ | ✅ | ✅ | ✅ | ✅ |
| Edit announcements | ❌ | ✅ (own) | ✅ (own) | ✅ (own) | ✅ (any) |
| **Contact Messages** |
| View contact messages | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage contact messages | ❌ | ❌ | ✅ | ✅ | ✅ |
| **User Management** |
| View own profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit own profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| View all users | ❌ | ❌ | ❌ | ❌ | ✅ |
| Create users | ❌ | ❌ | ❌ | ❌ | ✅ |
| Change user roles | ❌ | ❌ | ❌ | ❌ | ✅ |
| Delete users | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Analytics** |
| View own stats | ✅ | ✅ | ✅ | ✅ | ✅ |
| View educator analytics | ❌ | ✅ | ✅ | ✅ | ✅ |
| View platform analytics | ❌ | ❌ | ❌ | ❌ | ✅ |
| **File Requests** |
| Request files | ✅ | ✅ | ✅ | ✅ | ✅ |
| View file requests | ❌ | ✅ | ✅ | ✅ | ✅ |
| Approve file requests | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Teaching Requests** |
| Request teaching | ✅ | ✅ | ✅ | ✅ | ✅ |
| View teaching requests | ❌ | ✅ | ✅ | ✅ | ✅ |
| Approve teaching requests | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Portfolio** |
| Upload portfolio files | ✅ | ✅ | ✅ | ✅ | ✅ |
| Download portfolio | ✅ | ✅ | ✅ | ✅ | ✅ |
| **System Administration** |
| Data retention | ❌ | ❌ | ❌ | ❌ | ✅ |
| Audit logs | ❌ | ❌ | ❌ | ❌ | ✅ |
| Database management | ❌ | ❌ | ❌ | ❌ | ✅ |
| Gamification setup | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🛠️ Implementation Details

### Role Checking Functions

Located in `lib/roles.ts`:

```typescript
// Role constants
USER_ROLES = {
  STUDENT: 'student',
  EDUCATOR: 'educator',
  ADMIN: 'admin',
  MEDED_TEAM: 'meded_team',
  CTF: 'ctf'
}

// Permission checkers
hasUnlimitedAttempts(role: string): boolean
  // Returns: true only for ADMIN

canManageEvents(role: string): boolean
  // Returns: true for ADMIN, MEDED_TEAM, CTF

canViewContactMessages(role: string): boolean
  // Returns: true for ADMIN, MEDED_TEAM, CTF

canManageResources(role: string): boolean
  // Returns: true for EDUCATOR, ADMIN, MEDED_TEAM, CTF

isAdmin(role: string): boolean
  // Returns: true only for ADMIN

isStudent(role: string): boolean
  // Returns: true only for STUDENT
```

### React Hooks

**`lib/useRole.ts`** - Client-side role checking:
```typescript
const { 
  role, 
  canManageEvents, 
  canViewContactMessages, 
  canManageResources,
  isAdmin,
  hasUnlimitedAttempts,
  loading 
} = useRole();
```

**`lib/usePermissions.ts`** - Legacy hook (still used):
```typescript
const { isAdmin, isEducator, loading } = usePermissions();
```

### Server-Side Checks

API routes check roles server-side:

```typescript
// Example from /api/events/create
const { data: user } = await supabaseAdmin
  .from('users')
  .select('role')
  .eq('email', session.user.email)
  .single();

if (!['admin', 'meded_team', 'ctf'].includes(user.role)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Database Role Column

The `users` table has a `role` column with constraint:
```sql
CHECK (role IN ('student', 'educator', 'admin', 'meded_team', 'ctf'))
```

### Role Assignment

Roles are assigned via:
1. **Database update** (direct SQL)
2. **Admin user management** (`/admin-users`) - Admin only
3. **During user creation** - Set by admin

---

## 🔒 Security Considerations

1. **Server-Side Validation**: All permission checks happen server-side in API routes
2. **Database Constraints**: Role column has CHECK constraint to prevent invalid values
3. **Service Role Access**: Backend uses Supabase service role to bypass RLS for admin operations
4. **Frontend Hiding**: UI elements are conditionally rendered, but not a security measure
5. **Middleware Protection**: Some routes protected at middleware level
6. **Type Safety**: TypeScript types ensure role consistency

---

## 📊 Quick Reference

### Check if user can manage events:
```typescript
import { useRole } from '@/lib/useRole';
const { canManageEvents } = useRole();
```

### Check if user can view contact messages:
```typescript
import { useRole } from '@/lib/useRole';
const { canViewContactMessages } = useRole();
```

### Server-side permission check:
```typescript
import { canManageEvents } from '@/lib/roles';
const { data: user } = await supabase.from('users').select('role')...;
if (!canManageEvents(user.role)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Check unlimited attempts:
```typescript
import { hasUnlimitedAttempts } from '@/lib/roles';
if (hasUnlimitedAttempts(user.role)) {
  // Allow unlimited attempts
}
```

---

## 📝 Notes

- **MedEd Team and CTF are functionally identical** - distinction is organizational only
- **Unlimited attempts**: Only Admin gets unlimited attempts; all other roles are limited to 3/day
- **Own resources**: Educators, MedEd Team, and CTF can only edit/delete their own resources; Admin can edit/delete any
- **Event creation**: Educators can create events through the API, but don't have access to the UI event management pages
- **Booking management**: Educators can manage bookings, but cannot create/edit events through the UI

---

**Document Version:** 1.0  
**Last Reviewed:** November 2025  
**Maintained By:** Development Team

