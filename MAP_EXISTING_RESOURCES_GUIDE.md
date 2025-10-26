# 📁 How to Map Your Existing Resources from Storage

## 🎯 Overview
Your existing files are safely stored in the Supabase storage bucket `resources`. This guide shows you how to map them to the database so they appear on your downloads page.

---

## 📋 Step-by-Step Process

### **Step 1: Discover Your Existing Files**

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to **SQL Editor**

2. **Run this query to see all your files:**
   ```sql
   SELECT 
       name,
       path_tokens,
       metadata->>'size' as file_size,
       metadata->>'mimetype' as mime_type,
       created_at,
       updated_at
   FROM storage.objects 
   WHERE bucket_id = 'resources'
   ORDER BY name;
   ```

3. **Copy the results** - you'll need this data for the next step

### **Step 2: Create Database Entries**

For each file you found, create a database entry using this template:

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
    'Your File Title',                    -- Give it a descriptive name
    'Description of the file',            -- What is this file about?
    'bedside-teaching',                   -- Choose from categories below
    'filename.pdf',                       -- The actual filename
    'bedside-teaching/filename.pdf',      -- Full path in storage
    'https://your-supabase-url.supabase.co/storage/v1/object/public/resources/bedside-teaching/filename.pdf', -- Public URL
    1024000,                              -- File size in bytes
    'application/pdf',                    -- MIME type (see reference below)
    'Your Name',                          -- Who uploaded it originally
    true                                  -- Set to true to make it visible
);
```

### **Step 3: Bulk Mapping (If You Have Many Files)**

If you have many files, you can create multiple entries at once:

```sql
INSERT INTO public.resources (
    title, description, category, file_name, file_path, file_url, file_size, file_type, uploaded_by_name, is_active
) VALUES 
    -- File 1
    ('Grand Rounds Presentation', 'Weekly grand rounds presentation slides', 'grand-round', 'grand-rounds-2024-01.pdf', 'grand-round/grand-rounds-2024-01.pdf', 'https://your-supabase-url.supabase.co/storage/v1/object/public/resources/grand-round/grand-rounds-2024-01.pdf', 2048000, 'application/pdf', 'Dr. Smith', true),
    
    -- File 2
    ('Clinical Skills Guide', 'Step-by-step clinical skills guide', 'clinical-skills', 'clinical-skills-guide.pdf', 'clinical-skills/clinical-skills-guide.pdf', 'https://your-supabase-url.supabase.co/storage/v1/object/public/resources/clinical-skills/clinical-skills-guide.pdf', 1536000, 'application/pdf', 'Dr. Johnson', true),
    
    -- File 3
    ('Bedside Teaching Video', 'Video recording of bedside teaching session', 'bedside-teaching', 'bedside-teaching-video.mp4', 'bedside-teaching/bedside-teaching-video.mp4', 'https://your-supabase-url.supabase.co/storage/v1/object/public/resources/bedside-teaching/bedside-teaching-video.mp4', 52428800, 'video/mp4', 'Dr. Williams', true)
    
    -- Add more files as needed...
;
```

### **Step 4: Link to Events (Optional)**

If you want to link resources to specific events:

```sql
INSERT INTO public.resource_events (resource_id, event_id) 
VALUES (
    (SELECT id FROM public.resources WHERE file_name = 'grand-rounds-2024-01.pdf'),
    (SELECT id FROM public.events WHERE title LIKE '%Grand Round%' AND date = '2024-01-15')
);
```

### **Step 5: Verify Everything Works**

1. **Check your resources:**
   ```sql
   SELECT * FROM public.resources ORDER BY created_at DESC;
   ```

2. **Go to your app:**
   - Visit `http://localhost:3000/downloads`
   - You should see all your files listed
   - Test downloading a file

---

## 📂 Category Reference

Choose the appropriate category for each file:

| Category | Description |
|----------|-------------|
| `bedside-teaching` | Bedside teaching materials |
| `clinical-skills` | Clinical skills guides |
| `core-teachings` | Core teaching materials |
| `exams-mocks` | Exam preparation materials |
| `grand-round` | Grand rounds presentations |
| `hub-days` | Hub day materials |
| `inductions` | Induction materials |
| `obs-gynae-practice-sessions` | Obstetrics and gynecology |
| `osce-revision` | OSCE revision materials |
| `others` | Miscellaneous files |
| `paeds-practice-sessions` | Pediatrics practice |
| `pharmacy-teaching` | Pharmacy teaching |
| `portfolio-drop-ins` | Portfolio materials |
| `twilight-teaching` | Twilight teaching |
| `video-teaching` | Video-based teaching |

---

## 📄 File Type Reference

Common MIME types for different file extensions:

| Extension | MIME Type |
|-----------|-----------|
| `.pdf` | `application/pdf` |
| `.docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| `.xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| `.pptx` | `application/vnd.openxmlformats-officedocument.presentationml.presentation` |
| `.jpg` | `image/jpeg` |
| `.png` | `image/png` |
| `.mp4` | `video/mp4` |
| `.mp3` | `audio/mpeg` |
| `.txt` | `text/plain` |
| `.zip` | `application/zip` |

---

## 🔧 Helper Scripts

I've created two helper files for you:

1. **`map-existing-resources-from-storage.sql`** - SQL queries to discover and map files
2. **`discover-and-map-resources.js`** - JavaScript script to automate the process

---

## ⚠️ Important Notes

1. **File Paths**: Make sure the `file_path` in the database exactly matches the path in storage
2. **File URLs**: Replace `your-supabase-url` with your actual Supabase URL
3. **File Sizes**: Use the actual file size in bytes from the storage metadata
4. **MIME Types**: Use the correct MIME type for proper download behavior
5. **Uploader Names**: Set `uploaded_by_name` to the person who originally uploaded the file

---

## 🎉 Result

After mapping your files:
- ✅ All existing files will appear on the downloads page
- ✅ Users can search and filter by category
- ✅ Download functionality will work properly
- ✅ File permissions will be enforced correctly
- ✅ You can continue uploading new files

Your existing resources will be preserved and fully functional! 🚀
