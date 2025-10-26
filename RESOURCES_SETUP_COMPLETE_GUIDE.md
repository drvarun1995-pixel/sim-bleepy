# 📁 Resources/Downloads System - Complete Setup Guide

## 🎯 Overview
This guide will restore your downloads system that was working before the database recreation. The system allows admins/educators to upload files and all users to download them.

## 🔍 What We Found
Based on the existing documentation and current API code, here's what needs to be set up:

### ✅ What's Already Working:
- Frontend pages (`/downloads`, `/downloads/upload`)
- API routes (upload, download, fetch, delete)
- File storage in Supabase Storage bucket `resources`

### ❌ What's Missing:
- Database tables (`resources` and `resource_events`)
- Storage bucket policies
- Database entries for existing files

---

## 📋 Step-by-Step Setup

### **Step 1: Create Database Tables**

Run this SQL script in your Supabase SQL Editor:

```sql
-- Create resources table for file downloads (CORRECTED VERSION)
-- This matches the current API expectations and includes all required categories

CREATE TABLE IF NOT EXISTS public.resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- Supports all categories from the API
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    teaching_date DATE,
    taught_by TEXT,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    uploaded_by_name TEXT,
    views INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resource_events junction table for linking resources to events
CREATE TABLE IF NOT EXISTS public.resource_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resource_id, event_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_uploaded_by ON public.resources(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON public.resources(created_at);
CREATE INDEX IF NOT EXISTS idx_resources_is_active ON public.resources(is_active);
CREATE INDEX IF NOT EXISTS idx_resource_events_resource_id ON public.resource_events(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_events_event_id ON public.resource_events(event_id);

-- Enable Row Level Security
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for resources table
-- Allow all authenticated users to read active resources
CREATE POLICY "Allow read access to active resources" ON public.resources
    FOR SELECT USING (is_active = true);

-- Allow admins and educators to insert resources
CREATE POLICY "Allow admins and educators to insert resources" ON public.resources
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'educator')
        )
    );

-- Allow admins and educators to update resources
CREATE POLICY "Allow admins and educators to update resources" ON public.resources
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'educator')
        )
    );

-- Allow admins and educators to delete resources
CREATE POLICY "Allow admins and educators to delete resources" ON public.resources
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'educator')
        )
    );

-- Create RLS policies for resource_events table
-- Allow all authenticated users to read resource_events
CREATE POLICY "Allow read access to resource_events" ON public.resource_events
    FOR SELECT USING (true);

-- Allow admins and educators to insert resource_events
CREATE POLICY "Allow admins and educators to insert resource_events" ON public.resource_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'educator')
        )
    );

-- Allow admins and educators to update resource_events
CREATE POLICY "Allow admins and educators to update resource_events" ON public.resource_events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'educator')
        )
    );

-- Allow admins and educators to delete resource_events
CREATE POLICY "Allow admins and educators to delete resource_events" ON public.resource_events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'educator')
        )
    );

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_resources_updated_at 
    BEFORE UPDATE ON public.resources 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.resources TO authenticated;
GRANT ALL ON public.resource_events TO authenticated;

-- Add comments
COMMENT ON TABLE public.resources IS 'Stores metadata for uploaded resource files';
COMMENT ON TABLE public.resource_events IS 'Junction table linking resources to events';
```

### **Step 2: Set Up Storage Bucket Policies**

Go to your Supabase Dashboard → Storage → Buckets → `resources` → Policies

Add these 3 policies:

**Policy 1: Allow authenticated uploads**
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resources' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'educator')
  )
);
```

**Policy 2: Allow authenticated downloads**
```sql
CREATE POLICY "Allow authenticated downloads"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'resources');
```

**Policy 3: Allow admin/educator deletes**
```sql
CREATE POLICY "Allow admin/educator deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'resources' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'educator')
  )
);
```

### **Step 3: Map Your Existing Files**

If you have existing files in your `resources` storage bucket, you need to create database entries for them.

**3.1 Check Your Storage Bucket:**
1. Go to Supabase Dashboard → Storage → Buckets → `resources`
2. Note the folder structure (e.g., `bedside-teaching/`, `clinical-skills/`, etc.)
3. List all your existing files

**3.2 Create Database Entries:**
For each file, create a database entry using this template:

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
    'bedside-teaching',                   -- category (see list below)
    'filename.pdf',                       -- file_name
    'bedside-teaching/filename.pdf',      -- file_path (path in storage bucket)
    'https://your-supabase-url.supabase.co/storage/v1/object/public/resources/bedside-teaching/filename.pdf', -- file_url
    1024000,                              -- file_size (in bytes)
    'application/pdf',                    -- file_type (MIME type)
    'Your Name',                          -- uploaded_by_name
    true                                  -- is_active
);
```

**3.3 Link to Events (Optional):**
```sql
INSERT INTO public.resource_events (resource_id, event_id) 
VALUES (
    (SELECT id FROM public.resources WHERE file_name = 'filename.pdf'),
    'event-uuid-here'
);
```

---

## 📂 Supported Categories

The system supports these categories (matching your current API):
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

---

## 🧪 Testing

### **Test 1: Check Database Tables**
```sql
SELECT COUNT(*) FROM public.resources;
SELECT COUNT(*) FROM public.resource_events;
```

### **Test 2: Check Storage Bucket**
1. Go to Supabase Dashboard → Storage → `resources`
2. Verify files are there
3. Check folder structure

### **Test 3: Test the Application**
1. Go to `http://localhost:3000/downloads`
2. You should see your resources listed
3. Try uploading a new file
4. Try downloading a file

---

## 🐛 Troubleshooting

### **"Failed to fetch resources" Error:**
1. ✅ Check `resources` table exists
2. ✅ Verify RLS policies are set up
3. ✅ Check your user role in database

### **Upload Fails:**
1. ✅ Check `resources` storage bucket exists
2. ✅ Verify storage bucket policies
3. ✅ Check file size is under 50MB
4. ✅ Verify you have admin/educator role

### **Download Fails:**
1. ✅ Verify file exists in storage
2. ✅ Check `file_path` in database matches storage path
3. ✅ Ensure `is_active = true` in database

### **Files Not Showing:**
1. ✅ Check `is_active = true` in database
2. ✅ Verify `created_at` is recent
3. ✅ Check category matches supported list

---

## 🎉 What This Restores

Once set up, you'll have:
- ✅ **File Upload**: Admins/Educators can upload files
- ✅ **File Display**: All users can see available resources
- ✅ **File Download**: All users can download files
- ✅ **Event Linking**: Resources can be linked to specific events
- ✅ **Category Organization**: Files organized by teaching format
- ✅ **Search & Filter**: Find resources by category or search terms
- ✅ **View Tracking**: Download counts are tracked
- ✅ **File Management**: Edit, delete, and manage resources

---

## 📝 Quick Reference

**Database Tables:**
- `resources` - File metadata
- `resource_events` - Links resources to events

**Storage:**
- Bucket: `resources`
- Structure: `category/filename.ext`

**API Endpoints:**
- `GET /api/resources` - Fetch resources
- `POST /api/resources/upload` - Upload file
- `GET /api/resources/download/[id]` - Download file
- `DELETE /api/resources/delete/[id]` - Delete resource

**User Permissions:**
- **View/Download**: All authenticated users
- **Upload/Edit/Delete**: Admins and Educators only

---

## 🚀 Ready to Go!

After running the SQL scripts and setting up storage policies, your downloads system will be fully restored and working exactly as it was before!
