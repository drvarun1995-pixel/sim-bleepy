# Bleepy - Comprehensive Project Overview

**Last Updated:** November 2025  
**Purpose:** Complete understanding of the Bleepy platform architecture, features, and implementation

---

## 🎯 Project Purpose

**Bleepy** is a comprehensive medical education platform that combines:

1. **Event Management System** - Teaching event coordination for medical schools (ARU, UCL)
2. **AI Patient Simulator** - Practice consultations with AI-powered feedback
3. **Analytics Dashboard** - Performance tracking for students, educators, and administrators
4. **Booking & Attendance System** - Event registration, QR check-in, feedback, and certificates
5. **Learning Resources** - File sharing, teaching requests, portfolio management
6. **Cohort Management** - Student grouping and progress tracking

**Primary Users:** Medical students, educators, MedEd teams, clinical teaching fellows (CTF), and administrators

---

## 🏗️ Architecture Overview

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- React 18
- Tailwind CSS
- shadcn/ui components
- Recharts (data visualization)
- Lucide React (icons)

**Backend:**
- Next.js API Routes
- NextAuth.js (authentication)
- Supabase (PostgreSQL database)
- Row-Level Security (RLS) policies

**AI Services:**
- OpenAI GPT-4 (consultation scoring, bulk event extraction)
- Hume AI (speech recognition, emotion detection - legacy)
- Whisper AI (speech-to-text - legacy)

**Infrastructure:**
- Vercel (hosting)
- Supabase Storage (file uploads)
- Resend (email service)

### Authentication Architecture

**Key Point:** Uses **NextAuth.js**, NOT Supabase Auth

```
User Login
  ↓
NextAuth.js (JWT session)
  ↓
API Routes (check session.user.email)
  ↓
Database Query (service role key - bypasses RLS)
  ↓
Role-based Authorization (checks users.role from database)
```

**Important:** RLS policies are mostly DISABLED because:
- Authorization happens in API layer, not database
- Service role key is used for all database access
- User roles stored in `users.role` column
- No Supabase Auth JWT tokens (auth.uid() is NULL)

---

## 👥 User Roles & Permissions

### Role Hierarchy

1. **Student** (`student`) - Base level
   - View events, book spots, practice simulator
   - Limited to 3 simulator attempts/day
   - Upload to IMT Portfolio
   - View own certificates

2. **Educator** (`educator`)
   - All student permissions +
   - Upload/manage resources
   - Manage announcements
   - Handle file/teaching requests
   - View cohort analytics
   - Manage bookings (view all, cancel, export)

3. **MedEd Team** (`meded_team`)
   - All student permissions +
   - Full event management (create, edit, delete)
   - Bulk event upload via AI
   - QR code generation
   - Feedback form management
   - Certificate management
   - Contact message access

4. **CTF** (`ctf`) - Clinical Teaching Fellows
   - Identical permissions to MedEd Team
   - Organizational distinction only

5. **Admin** (`admin`)
   - All permissions from all roles +
   - User management (create, edit, delete, change roles)
   - System-wide analytics
   - Data retention management
   - Audit log access
   - Unlimited simulator attempts

### Role Storage

- **Primary:** `users.role` column in database
- **Fallback:** Environment variable `NEXT_PUBLIC_ADMIN_EMAILS` (legacy)
- **All layouts** fetch role from `users` table first, then fallback

---

## 📊 Database Schema

### Core Tables

#### Users & Authentication
- `users` - Main user table with roles, profile info, preferences
- `email_verification_tokens` - Email verification tracking
- `password_reset_tokens` - Password reset flow

#### Events System
- `events` - Teaching events (43+ columns including booking, QR, feedback, certificate settings)
- `categories` - Event categories
- `formats` - Event formats (workshop, lecture, etc.)
- `locations` - Event locations
- `organizers` - Event organizers
- `speakers` - Event speakers
- `event_categories` - Junction table (events can have multiple categories)
- `event_speakers` - Junction table (events can have multiple speakers)

#### Booking System
- `event_bookings` - User event registrations
  - Status: `confirmed`, `waitlist`, `cancelled`, `attended`, `no_show`
  - Includes check-in tracking (`checked_in`, `checked_in_at`)
  - Confirmation checkbox states
- `booking_stats` - View for booking statistics

#### QR & Attendance
- `event_qr_codes` - QR codes for events
- `qr_code_scans` - Audit log of QR scans

#### Feedback System
- `feedback_templates` - Reusable feedback form templates
- `feedback_forms` - Event-specific feedback forms
- `feedback_responses` - User feedback submissions

#### Certificate System
- `certificates` - Generated certificates
- `certificate_templates` - Certificate templates
- Links to events, users, bookings

#### Portfolio & Resources
- `portfolio_files` - IMT Portfolio files
- `resources` - Learning resources (PDFs, videos, etc.)
- Storage buckets: `imt-portfolio`, `resources`, `profile-pictures`, `certificates`

#### Requests System
- `file_requests` - Users requesting files from events
- `teaching_requests` - Users requesting teaching sessions
- Status tracking: `pending`, `in-progress`, `completed`, `rejected`

#### Analytics & Simulator (Legacy/Analytics Schema)
- `profiles` - Extended user profiles (analytics)
- `stations` - AI simulator stations
- `sessions` - Simulator sessions
- `scores` - Performance scores
- `transcripts` - Session transcripts
- `api_usage` - AI service usage tracking
- `tech_metrics` - Performance metrics
- `cohorts` - Student cohorts
- `cohort_members` - Cohort membership
- `ab_tests` - A/B testing experiments

#### Other
- `announcements` - Platform announcements
- `contact_messages` - Contact form submissions
- `newsletter_signups` - Newsletter subscriptions
- `cron_tasks` - Background job tasks (certificate generation, feedback invites)
- `gamification` tables - Achievement tracking

### Views

- `events_with_details` - Comprehensive event view with all relations
- `booking_stats` - Booking statistics
- `user_stats` - User performance metrics (analytics)
- `station_stats` - Station usage stats (analytics)

---

## 🎯 Core Features

### 1. Event Management System

**Purpose:** Coordinate teaching events for medical students

**Key Features:**
- Event creation/editing with rich metadata
- Multiple categories, speakers, locations per event
- Bulk upload via AI (Excel, PDF, Word → events)
- Smart bulk upload extracts event data using OpenAI
- Event status management (published, draft, cancelled)
- Date/time management with timezone support

**Event Configuration Options:**
- Booking settings (enabled, capacity, deadline, waitlist)
- QR attendance tracking
- Feedback forms (optional, required, templates)
- Certificate generation (auto, manual, gated by feedback)
- Custom confirmation checkboxes
- Role-based visibility (`allowed_roles`)

**Event Workflows (7 Different Flows):**

| # | Booking | QR | Feedback | Certificate | Use Case |
|---|---------|----|----------|------------| ---------|
| 1 | ✅ | ✅ | ✅ | Auto (not gated) | Standard event with feedback |
| 2 | ✅ | ✅ | ❌ | Auto (not gated) | Event without feedback |
| 3 | ✅ | ✅ | ✅ Required | Auto (gated) | Feedback mandatory for cert |
| 4 | ❌ | ✅ | ❌ | ❌ | Drop-in attendance only |
| 5 | ❌ | ✅ | ✅ | ❌ | Attendance + feedback only |
| 6 | ✅ | ❌ | ❌ | ❌ | Roster/sign-up event |
| 7 | ✅ | ❌ | ✅ | Auto (after feedback) | Remote/async event |

**Email Flow:**
- Booking confirmation
- Event reminders
- QR code for check-in
- Feedback invite (after event)
- Certificate delivery (auto/manual)

### 2. Booking & Registration System

**Features:**
- Event capacity management
- Waitlist handling
- Booking deadlines
- Custom confirmation checkboxes
- Status tracking (confirmed → waitlist → attended/cancelled)
- CSV export for admin
- Bulk cancellation
- Auto-promotion from waitlist

**User Flow:**
1. User books event → Confirmation email
2. Admin can view all bookings
3. User can cancel (before deadline)
4. User scans QR at event → Marked attended
5. Feedback invited (if enabled)
6. Certificate generated (if enabled)

### 3. QR Code Attendance System

**Features:**
- Generate unique QR code per event
- Time-based scan windows (e.g., 30 min before to 1 hour after)
- Scan to mark attendance automatically
- Updates booking status to `attended`
- Audit log of all scans
- "Thank you" email for attendance-only events

### 4. Feedback System

**Features:**
- Reusable feedback templates
- Event-specific feedback forms
- Multiple question types
- Anonymous or authenticated feedback
- Feedback required for certificate (optional)
- Admin can view all responses
- CSV export of responses

**Integration:**
- Triggered after QR scan OR event end (depending on workflow)
- Can gate certificate generation
- Email invites sent via cron job

### 5. Certificate System

**Features:**
- Template-based certificate generation
- Image builder for templates
- Auto-generation after feedback/attendance
- Manual generation by admins
- Email delivery
- PDF storage in Supabase Storage
- Custom fields (name, event, date, certificate ID)

**Generation Triggers:**
- After QR scan (if auto-enabled, not gated)
- After feedback submission (if gated)
- Manual by admin
- Cron job for batch generation

### 6. AI Patient Simulator

**Purpose:** Practice medical consultations with AI feedback

**Features:**
- Multiple clinical stations/scenarios
- Voice-based consultation (Hume AI - legacy)
- Real-time conversation
- AI-powered scoring (OpenAI GPT-4)
- OSCE-style domain scoring
- Performance tracking
- 3 attempts/day limit (unlimited for admin)
- Specialized scoring for joint pain/arthritis scenarios

**Scoring Domains:**
- Data Gathering (0-4)
- Clinical Management (0-4)
- Interpersonal Skills (0-4)
- Total: 12 points (pass = 8+)

**UK OSCE Scoring (Specialized):**
- Communication Skills
- Data Gathering
- Structure
- Summary
- Investigations & Management
- Overall Grade: A-E

### 7. Cohort Management

**Features:**
- View students by university (ARU, UCL, Other)
- Filter by study year (1-6)
- Statistics (total, verified, by year)
- Charts (pie chart by university, bar chart by year)
- Sortable tables (name, email, year, verification status)
- University inference from email domain
- Admin/MedEd/CTF access only

**Data Source:**
- Fetches from `users` table
- Filters by `role = 'student'`
- Groups by `university` field
- Infers university from email if missing

### 8. File & Teaching Requests

**File Requests:**
- Users request files from events
- Admin/educator can manage requests
- Status: pending → in-progress → completed/rejected
- Linked to specific events

**Teaching Requests:**
- Users request teaching sessions
- Category and format selection
- Scheduling preferences
- Admin assignment and scheduling

### 9. IMT Portfolio

**Purpose:** Store files for IMT (Internal Medicine Training) portfolio

**Features:**
- File upload (PDF, images, documents)
- Organized by categories
- Download all as ZIP
- User-specific (RLS protected)
- Supabase Storage integration

### 10. Announcements

**Features:**
- Platform-wide announcements
- Role-based visibility
- Rich text editor
- Admin/educator can create
- Displayed on dashboard

### 11. Analytics Dashboard

**Student Dashboard:**
- Performance trends
- OSCE domain analysis (radar chart)
- Recent attempts
- Skill gap analysis

**Educator Dashboard:**
- Cohort management
- Student progress tracking
- Station usage analytics
- Assignment builder

**Admin Dashboard:**
- Live metrics
- Station performance
- Tech health monitoring
- Cost telemetry
- System logs

**Note:** Analytics schema exists but may not be fully integrated with main app

---

## 🔐 Security & Authorization

### Authentication Flow

1. User logs in via NextAuth (email/password)
2. Session stored as JWT cookie
3. API routes check `getServerSession(authOptions)`
4. Fetch user role from `users` table using email
5. Check permissions using helper functions
6. Access database with service role key (bypasses RLS)

### Authorization Layers

1. **Middleware** (`middleware.ts`)
   - Protects routes (`/dashboard/*`, `/admin/*`, etc.)
   - Redirects unauthenticated users
   - Checks profile completion for onboarding

2. **API Routes**
   - Check session authentication
   - Fetch user role from database
   - Use permission helpers (`canManageEvents`, `canViewContactMessages`, etc.)
   - Return 403 if unauthorized

3. **Database (RLS)**
   - Mostly DISABLED on shared tables (events, resources, etc.)
   - ENABLED on user-specific tables (portfolio, attempts)
   - Service role bypasses RLS for API operations

### Permission Helpers

Located in `lib/permissions.ts` (if exists) or inline in API routes:

```typescript
// Examples:
canManageEvents(role) // admin, meded_team, ctf
canViewContactMessages(role) // admin, meded_team, ctf
canUploadResources(role) // admin, meded_team, ctf, educator
canManageBookings(role) // admin, meded_team, ctf, educator
```

---

## 📁 File Structure

### Key Directories

```
app/
├── api/                    # API routes
│   ├── admin/             # Admin-only endpoints
│   ├── bookings/          # Booking management
│   ├── events/            # Event CRUD
│   ├── qr-codes/          # QR generation/scanning
│   ├── feedback/          # Feedback forms/responses
│   ├── certificates/      # Certificate generation
│   ├── resources/         # Resource upload
│   ├── cohorts/           # Cohort data
│   └── ...
├── dashboard/             # Dashboard pages (role-based)
├── events/                # Event listing/detail pages
├── event-data/            # Event management page
├── bulk-upload-ai/        # AI bulk upload
├── bookings/              # Admin booking management
├── my-bookings/           # User bookings page
├── cohorts/               # Cohort management page
├── certificates/          # Certificate pages
├── imt-portfolio/         # Portfolio pages
├── stations/              # AI simulator pages
└── ...

components/
├── dashboard/             # Dashboard components
├── bookings/              # Booking components
├── ui/                    # shadcn/ui components
└── ...

lib/
├── auth.ts                # NextAuth configuration
├── email.ts               # Email sending (Resend)
├── permissions.ts         # Permission helpers
└── ...

migrations/                # Database migrations (150+ files)
supabase-migrations/       # Analytics schema migrations
utils/
├── supabase.ts            # Supabase client utilities
├── openaiService.ts       # OpenAI integration
└── ...

```

---

## 🔄 Key Workflows

### Event Creation Workflow

1. Admin/MedEd/CTF creates event via `/event-data`
2. Configure booking, QR, feedback, certificate settings
3. Event saved to database
4. If booking enabled, users can register
5. If QR enabled, QR code generated
6. Event happens → QR scan marks attendance
7. Feedback invited (if enabled) → Certificate generated (if enabled)

### Booking Workflow

1. User views event → Clicks "Book Now"
2. Confirms checkboxes (if configured)
3. Booking created → Status: `confirmed` or `waitlist`
4. Confirmation email sent
5. User can cancel (before deadline)
6. On event day → QR scan → Status: `attended`
7. Feedback invited → Certificate generated

### Certificate Generation Workflow

**Auto (Not Gated):**
- QR scan → Certificate generated immediately → Email sent

**Auto (Gated by Feedback):**
- QR scan → Feedback invited
- User submits feedback → Certificate generated → Email sent

**Manual:**
- Admin generates from certificate page
- Select template, fill fields, generate, send email

### AI Bulk Upload Workflow

1. Admin uploads Excel/PDF/Word file
2. File parsed (text extracted)
3. Content sent to OpenAI GPT-4
4. AI extracts event data (title, date, time, location, speakers)
5. Locations/speakers matched with database
6. User reviews extracted events
7. User edits/deletes as needed
8. User confirms → Events created in bulk

---

## 🚀 Deployment

**Platform:** Vercel
**Database:** Supabase (PostgreSQL)
**Storage:** Supabase Storage
**Domain:** Configured via Vercel

**Environment Variables:**
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Authentication
NEXTAUTH_URL
NEXTAUTH_SECRET

# OpenAI
OPENAI_API_KEY

# Email
RESEND_API_KEY

# Feature Flags
NEXT_PUBLIC_ADMIN_EMAILS (legacy)
```

---

## 📝 Important Notes

### Database Migrations

**There are 150+ migration files** - many are:
- Debug/test queries
- Fix attempts
- One-off checks
- Incremental updates

**Key Migrations:**
- `create-events-schema.sql` - Initial events system
- `add-event-booking-fields.sql` - Booking system
- `create-event-bookings-table.sql` - Bookings table
- `add-feedback-and-qr-system.sql` - Feedback/QR system
- `create-certificates-system.sql` - Certificate system
- `proper-rls-for-nextauth.sql` - RLS fixes for NextAuth
- `add-meded-ctf-roles.sql` - New roles

### RLS Policy Strategy

**Correct Approach (Current):**
- RLS DISABLED on shared tables (events, categories, resources, etc.)
- RLS ENABLED on user tables (portfolio, attempts) with service role access
- Authorization happens in API layer, not database

**Why This Works:**
- NextAuth doesn't provide Supabase JWT tokens
- `auth.uid()` is NULL in RLS policies
- Service role key bypasses RLS
- API routes handle authorization

### Role System Evolution

**Old System:**
- Environment variable `NEXT_PUBLIC_ADMIN_EMAILS`
- Hardcoded admin checks

**New System:**
- Database `users.role` column
- Roles: `student`, `educator`, `meded_team`, `ctf`, `admin`
- All layouts fetch from database first, fallback to env var

### Event Workflow Status

**Workflows 1-2:** ✅ Verified and working
**Workflows 3-7:** ✅ Implemented, ready for testing
**Cron Jobs:** Background tasks for certificate generation and feedback invites

---

## 🎯 Planned/Future Features

From `REFINEMENTS.md`:

1. **Smart Event Recommendations** - AI-powered event suggestions
2. **Progress Tracking & Gamification** - Attendance streaks, badges, leaderboards
3. **Personalized Email Digests** - Daily/weekly event summaries
4. **Save/Bookmark Events** - Personal event collections
5. **Peer Learning Features** - Discussion threads, study groups
6. **Mobile App** - QR scanning, offline mode, push notifications
7. **Advanced Analytics** - Machine learning insights
8. **Calendar Integration** - Google Calendar, Outlook sync

---

## 🔧 Development Workflow

### Running Locally

```bash
pnpm install
pnpm dev
```

### Database Setup

1. Create Supabase project
2. Run key migrations in SQL Editor:
   - `create-events-schema.sql`
   - `create-event-bookings-table.sql`
   - `add-feedback-and-qr-system.sql`
   - `create-certificates-system.sql`
   - `proper-rls-for-nextauth.sql`
3. Configure environment variables
4. Create storage buckets:
   - `imt-portfolio`
   - `resources`
   - `profile-pictures`
   - `certificates`

### Testing

- Test workflows 1-7 with different event configurations
- Verify role permissions for each user type
- Test booking flow end-to-end
- Verify certificate generation
- Test bulk upload with sample files

---

## 📚 Key Documentation Files

- `README.md` - Main project README
- `REFINEMENTS.md` - Planned enhancements
- `WORKFLOW_CYCLES.md` - Event workflow documentation
- `COMPREHENSIVE_ROLE_PERMISSIONS.md` - Detailed permissions
- `BOOKING_SYSTEM_SUMMARY.md` - Booking system details
- `CERTIFICATE_SYSTEM_COMPLETE.md` - Certificate system
- `BULK_UPLOAD_README.md` - Bulk upload guide
- Various implementation guides and setup docs

---

## 🎓 Understanding Summary

**Bleepy** is a sophisticated medical education platform that:
- Manages teaching events for medical schools
- Provides AI-powered consultation practice
- Handles event registration, attendance, feedback, and certificates
- Offers role-based access for students, educators, and admins
- Uses modern Next.js architecture with Supabase backend
- Integrates AI (OpenAI) for scoring and bulk data extraction

**Key Architectural Decisions:**
- NextAuth (not Supabase Auth) for authentication
- API-layer authorization (not RLS-based)
- Service role key for database access
- Role-based permissions system
- Workflow-based event configuration

This system is production-ready and handles complex event management workflows for medical education institutions.
