# Placements and My Attendance Setup Instructions

## Overview

Two new pages have been created:

1. **My Attendance Tracking** (`/my-attendance`) - Tracks all events where the user's QR code was scanned
2. **Placements** (`/placements`) - Specialty information pages with sub-pages and document uploads

## What You Need to Do

### Step 1: Run the Database Migration

Run the SQL migration file to create the placements database tables:

**File**: `migrations/create-placements-system.sql`

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `migrations/create-placements-system.sql`
4. Run the SQL script

This will create:
- `specialties` table - Main specialties (Rheumatology is already added)
- `specialty_pages` table - Sub-pages for each specialty
- `specialty_documents` table - Documents for specialties/pages
- All necessary indexes and RLS policies

### Step 2: Verify Storage Bucket

The placements system uses the existing `resources` storage bucket for document uploads. Make sure this bucket exists in your Supabase Storage:

1. Go to Supabase Dashboard → Storage
2. Verify the `resources` bucket exists
3. If it doesn't exist, create it with public access

### Step 3: Test the Pages

1. **My Attendance Tracking**:
   - Navigate to `/my-attendance` (or use the sidebar link)
   - View your attendance records (if you have any QR scans)
   - The page shows all events where you scanned a QR code

2. **Placements**:
   - Navigate to `/placements` (or use the sidebar link)
   - You should see "Rheumatology" as the first specialty
   - Click on it to view details
   - As an admin/meded_team/ctf user, you can:
     - Add new pages (sub-pages)
     - Upload documents
     - Edit/delete pages and documents

## Features

### My Attendance Tracking
- ✅ Shows all events where user scanned QR code
- ✅ Displays scan timestamp
- ✅ Shows event details (format, organizer, location, speakers)
- ✅ Links to event detail pages
- ✅ Search functionality
- ✅ Statistics (total events, unique dates)

### Placements
- ✅ Specialty listing page
- ✅ Specialty detail pages with sub-pages
- ✅ Document upload and management
- ✅ Rich text editor for page content
- ✅ Admin/MedEd Team/CTF can manage content
- ✅ All users can view content
- ✅ Automatic slug generation for URLs

## Navigation

Both pages have been added to the main navigation sidebar:
- **My Attendance** - Available to all users
- **Placements** - Available to all users

## Permissions

### My Attendance
- All authenticated users can view their own attendance records

### Placements
- **View**: All authenticated users can view specialties, pages, and documents
- **Manage**: Only `admin`, `meded_team`, and `ctf` roles can:
  - Add/edit/delete specialties
  - Add/edit/delete specialty pages
  - Upload/delete documents

## API Routes Created

### My Attendance
- `GET /api/my-attendance` - Fetch user's attendance records

### Placements
- `GET /api/placements/specialties` - List all specialties
- `POST /api/placements/specialties` - Create specialty (admin/meded/ctf only)
- `GET /api/placements/pages?specialtyId=xxx` - List pages for a specialty
- `POST /api/placements/pages` - Create page (admin/meded/ctf only)
- `GET /api/placements/pages/[id]` - Get single page
- `PUT /api/placements/pages/[id]` - Update page (admin/meded/ctf only)
- `DELETE /api/placements/pages/[id]` - Delete page (admin/meded/ctf only)
- `GET /api/placements/documents?specialtyId=xxx` - List documents
- `POST /api/placements/documents` - Upload document (admin/meded/ctf only)
- `DELETE /api/placements/documents/[id]` - Delete document (admin/meded/ctf only)

## Database Schema

### specialties
- `id` (UUID, primary key)
- `name` (TEXT, unique)
- `slug` (TEXT, unique)
- `description` (TEXT, nullable)
- `icon` (TEXT, nullable)
- `display_order` (INTEGER)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

### specialty_pages
- `id` (UUID, primary key)
- `specialty_id` (UUID, foreign key)
- `title` (TEXT)
- `slug` (TEXT, unique per specialty)
- `content` (TEXT, nullable - HTML content)
- `display_order` (INTEGER)
- `is_active` (BOOLEAN)
- `created_by` (UUID, foreign key to users)
- `created_at`, `updated_at` (TIMESTAMP)

### specialty_documents
- `id` (UUID, primary key)
- `specialty_id` (UUID, foreign key, nullable)
- `specialty_page_id` (UUID, foreign key, nullable)
- `title` (TEXT)
- `description` (TEXT, nullable)
- `file_name` (TEXT)
- `file_path` (TEXT)
- `file_url` (TEXT)
- `file_size` (BIGINT)
- `file_type` (TEXT)
- `uploaded_by` (UUID, foreign key to users)
- `display_order` (INTEGER)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

## Next Steps

1. ✅ Run the migration SQL
2. ✅ Test the pages
3. Add more specialties as needed
4. Add content to Rheumatology specialty
5. Customize as needed

## Notes

- No demo or seed data was added (as requested)
- All content will be added through the UI
- The system is ready for real data
- RLS policies ensure proper access control

