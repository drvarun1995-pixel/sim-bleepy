# Email Signatures Setup Guide

## Overview
This feature allows users with email access (Admin and MedEd Team) to create and manage their own email signatures. Signatures can include rich text formatting and images, and can be inserted into emails when composing.

## What Was Created

### 1. Database Table
- **File**: `supabase/migrations/20251119_create-email-signatures.sql`
- Creates `email_signatures` table with:
  - `user_id` (unique per user)
  - `content_html` (signature HTML content)
  - `created_at` and `updated_at` timestamps
  - RLS policies for access control

### 2. API Routes
- **GET/POST/DELETE** `/api/emails/signatures` - Manage signatures
- **POST** `/api/emails/signatures/images` - Upload signature images

### 3. Frontend Pages
- **Page**: `/app/emails/signatures/page.tsx` - Signature management page
- **Component**: `/components/tiptap-ui/signature-button.tsx` - Button to insert signatures in email editor

### 4. Editor Integration
- Signature button added to TipTap editor toolbar (only visible when `uploadContext === 'admin-email'`)
- Button appears next to the "Add Image" button
- Uses PenSquare icon

### 5. Sidebar Navigation
- Added "Signatures" link to dashboard sidebar under email section
- Only visible to users with email access (Admin, MedEd Team)

## Setup Instructions

### Step 1: Run Database Migration

Run the migration in your Supabase SQL Editor:

```sql
-- File: supabase/migrations/20251119_create-email-signatures.sql
```

This creates the `email_signatures` table and sets up RLS policies.

### Step 2: Set Up Storage Policies

**IMPORTANT**: Storage policies cannot be created via SQL migrations due to permissions. You must create them manually through the Supabase Dashboard.

1. **Verify the bucket exists**:
   - Go to Supabase Dashboard → Storage
   - Check if `email-files` bucket exists
   - If not, create it:
     - Click "New bucket"
     - Name: `email-files`
     - Set to **Private** (not public)
     - Click "Create bucket"

2. **Create Storage Policies**:
   - Go to Storage → `email-files` bucket → **Policies** tab
   - Click **"New Policy"** for each of the 3 policies below
   - Copy and paste the SQL from `supabase/migrations/20251119_setup-signature-storage-manual.sql`
   - Or use the SQL Editor method (see below)

   **Method 1: Using Dashboard UI**
   - For each policy, click "New Policy"
   - Select the operation (INSERT, SELECT, or DELETE)
   - Paste the policy SQL in the editor
   - Save

   **Method 2: Using SQL Editor** (if you have owner permissions)
   - Go to SQL Editor
   - Copy all SQL from `supabase/migrations/20251119_setup-signature-storage-manual.sql`
   - Paste and run

### Step 3: Verify Setup

1. **Test Database**:
   ```sql
   SELECT * FROM email_signatures;
   ```
   Should return empty result (no errors).

2. **Test Storage Policies**:
   - Go to Supabase Dashboard → Storage → Policies
   - Verify you see the three signature image policies

3. **Test Frontend**:
   - Log in as Admin or MedEd Team user
   - Navigate to Dashboard → Signatures (should appear in sidebar)
   - Create a signature with text and images
   - Go to Send Email page
   - Click the signature button (PenSquare icon) next to "Add Image"
   - Verify signature can be inserted

## Features

### Signature Management Page
- Create/edit signature with rich text editor
- Upload images (same TipTap editor as email sending)
- Delete signature
- View last updated timestamp

### Email Editor Integration
- Signature button appears in email editor toolbar
- Clicking button opens dialog showing signature preview
- Click "Insert" to add signature to email at cursor position
- Signature HTML is inserted directly into email body

### Access Control
- Only users with `canSendAdminEmails` permission can:
  - Access signatures page
  - Create/edit/delete signatures
  - Insert signatures in emails
- Currently: Admin and MedEd Team roles

## Storage Structure

Signature images are stored in the `email-files` bucket at:
```
email-signatures/{user_id}/images/{filename}
```

This keeps signature images organized per user and separate from draft email images.

## Notes

- Each user can have only one signature (enforced by UNIQUE constraint on `user_id`)
- Signature images use the same compression and optimization as admin email images
- Signatures are stored as HTML, so they can include any formatting supported by TipTap
- When inserting a signature, the full HTML is inserted at the cursor position

## Troubleshooting

### Signature button not appearing
- Ensure you're on the email send page (`/emails/send`)
- Check that `uploadContext="admin-email"` is set on the TipTap editor
- Verify you have email access permissions

### Images not uploading
- Check that `email-files` bucket exists
- Verify storage policies are set up correctly
- Check browser console for errors

### Signature not saving
- Check database migration ran successfully
- Verify RLS policies allow your user to insert/update
- Check API route logs for errors

