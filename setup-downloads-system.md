# Setup Downloads System

## Step 1: Create Database Tables

Run the following SQL script in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of create-resources-database-structure.sql
```

## Step 2: Discover Existing Files

Run the following SQL script to see what's currently in your database:

```sql
-- Copy and paste the contents of discover-existing-resources.sql
```

## Step 3: Map Existing Files from Storage

If you have existing files in your Supabase storage bucket `resources`, you'll need to create database entries for them. Here's how:

### 3.1 Check Your Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to Storage → Buckets
3. Check the `resources` bucket
4. Note the folder structure (e.g., `bedside-teaching/`, `clinical-skills/`, etc.)

### 3.2 Create Database Entries

For each file in storage, create a database entry using this template:

```sql
INSERT INTO public.resources (
    title,
    description,
    category,
    file_name,
    file_path,
    file_url,
    file_size,
    file_type,
    uploaded_by_name,
    is_active
) VALUES (
    'Your File Title',                    -- title
    'Description of the file',            -- description
    'bedside-teaching',                   -- category (choose from available categories)
    'filename.pdf',                       -- file_name
    'bedside-teaching/filename.pdf',      -- file_path (path in storage bucket)
    'https://your-supabase-url.supabase.co/storage/v1/object/public/resources/bedside-teaching/filename.pdf', -- file_url
    1024000,                              -- file_size (in bytes)
    'application/pdf',                    -- file_type (MIME type)
    'Your Name',                          -- uploaded_by_name
    true                                  -- is_active
);
```

### 3.3 Link to Events (Optional)

If you want to link resources to specific events:

```sql
INSERT INTO public.resource_events (resource_id, event_id) 
VALUES (
    (SELECT id FROM public.resources WHERE file_name = 'filename.pdf'),
    'event-uuid-here'
);
```

## Step 4: Test the System

1. Go to `http://localhost:3000/downloads`
2. You should now see your resources listed
3. Try uploading a new file to test the upload functionality
4. Try downloading a file to test the download functionality

## Available Categories

The system supports these categories:
- `bedside-teaching`
- `clinical-skills`
- `core-teachings`
- `exams-mocks`
- `grand-round`
- `hub-days`
- `inductions`
- `obs-gynae-practice-sessions`
- `osce-revision`
- `others`
- `paeds-practice-sessions`
- `pharmacy-teaching`
- `portfolio-drop-ins`
- `twilight-teaching`
- `video-teaching`

## File Size Limits

- Maximum file size: 50MB
- Supported file types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, PNG, GIF, MP4, AVI, MOV, MP3, WAV, ZIP, RAR

## Permissions

- **View/Download**: All authenticated users
- **Upload/Edit/Delete**: Admins and Educators only

## Troubleshooting

### If you see "Failed to fetch resources":
1. Make sure the `resources` table exists
2. Check that RLS policies are set up correctly
3. Verify your user has the correct role

### If upload fails:
1. Check that the `resources` storage bucket exists
2. Verify file size is under 50MB
3. Check that you have admin/educator permissions

### If download fails:
1. Verify the file exists in storage
2. Check the file_path in the database matches the storage path
3. Ensure the file is marked as `is_active = true`
