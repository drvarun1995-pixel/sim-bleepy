# Announcements Storage Setup Guide

## Overview
This guide explains how to set up file storage for announcements with rich text editor images using Supabase Storage.

## Storage Bucket Setup

### Step 1: Create Storage Bucket in Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **New Bucket**
5. Create a bucket with these settings:
   - **Name**: `announcements`
   - **Public**: `false` (we'll use signed URLs via API routes)
   - **File size limit**: 10MB (or as needed)
   - **Allowed MIME types**: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`
   - Click **Create Bucket**

### Step 2: Set Up Bucket Policies

After creating the bucket, set up the following RLS policies in your Supabase SQL Editor:

```sql
-- Allow authenticated admins, educators, meded_team, and ctf to upload files
CREATE POLICY "Allow authenticated announcement uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'announcements' AND
  auth.jwt() ->> 'role' IN ('admin', 'educator', 'meded_team', 'ctf')
);

-- Allow authenticated admins, educators, meded_team, and ctf to update files
CREATE POLICY "Allow authenticated announcement updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'announcements' AND
  auth.jwt() ->> 'role' IN ('admin', 'educator', 'meded_team', 'ctf')
);

-- Allow authenticated admins, educators, meded_team, and ctf to delete files
CREATE POLICY "Allow authenticated announcement deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'announcements' AND
  auth.jwt() ->> 'role' IN ('admin', 'educator', 'meded_team', 'ctf')
);

-- Allow authenticated admins, educators, meded_team, and ctf to read files
CREATE POLICY "Allow authenticated announcement reads"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'announcements' AND
  auth.jwt() ->> 'role' IN ('admin', 'educator', 'meded_team', 'ctf')
);
```

**Note**: Since we're using API routes with service role key for actual file access (via `/api/announcements/images/view`), these policies provide an extra layer of security. The API routes handle authentication and authorization.

### Step 3: Folder Structure

The storage bucket will use the following structure:

```
announcements/
├── announcement-drafts/
│   └── {draftId}/
│       └── images/
│           └── {timestamp}-{random}.webp
└── announcements/
    └── {announcementId}/
        └── images/
            └── {timestamp}-{random}.webp
```

- **Draft images**: Stored in `announcement-drafts/{draftId}/images/` while editing
- **Final images**: Promoted to `announcements/{announcementId}/images/` when announcement is saved
- **Cleanup**: Draft folders are automatically cleaned up when form is cancelled or closed

## How It Works

### 1. Image Upload During Editing
- When creating/editing an announcement, a unique `draftId` is generated
- Images uploaded via the Tiptap editor are stored in `announcement-drafts/{draftId}/images/`
- Images are compressed to WebP format (max 200KB)

### 2. Image Promotion on Save
- When an announcement is saved, images are automatically promoted from draft to final location
- HTML content is updated with new image paths
- Draft folder is cleaned up after successful promotion

### 3. Image Cleanup on Delete
- When an announcement is deleted, its associated image folder is automatically cleaned up
- Prevents orphaned files in storage

### 4. Draft Cleanup on Cancel
- When the form is closed without saving, draft folders are cleaned up
- Prevents accumulation of unused draft images

## API Routes

- **POST `/api/announcements/images`**: Upload image to draft folder
- **GET `/api/announcements/images/view?path=...`**: View/download image (handles both draft and final images)
- **POST `/api/announcements/drafts/cleanup`**: Clean up draft folder

## Testing

After setup, you can test by:
1. Creating a new announcement
2. Uploading an image via the rich text editor
3. Saving the announcement
4. Verifying images load correctly in the announcement content
5. Deleting the announcement and verifying images are cleaned up

