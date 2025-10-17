# Profile Picture Feature - Quick Start Guide

## 🎯 In 5 Minutes

### Step 1: Database (2 min)
Open Supabase SQL Editor and run:

```sql
-- Add columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS profile_picture_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS about_me TEXT,
ADD COLUMN IF NOT EXISTS tagline VARCHAR(255);

-- Add index
CREATE INDEX IF NOT EXISTS idx_users_profile_picture_url 
ON users(profile_picture_url) WHERE profile_picture_url IS NOT NULL;
```

### Step 2: Storage Bucket (1 min)
**Option A** - Supabase Dashboard:
1. Go to Storage → Create bucket
2. Name: `profile-pictures`
3. Check: ☑ Public bucket
4. Save

**Option B** - SQL:
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-pictures', 'profile-pictures', true, 3145728, 
        ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
```

### Step 3: RLS Policies (2 min)
Run in Supabase SQL Editor:

```sql
-- Upload
CREATE POLICY "Users can upload their own profile picture"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update
CREATE POLICY "Users can update their own profile picture"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Delete
CREATE POLICY "Users can delete their own profile picture"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- View
CREATE POLICY "Public read access to profile pictures"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'profile-pictures');
```

### Step 4: Test (30 sec)
1. `npm run dev`
2. Go to your profile page
3. Click camera icon
4. Upload an image
5. ✅ Done!

## 📋 What You Get

✅ **Profile Picture Upload**
- Circular avatar display
- Crop & zoom controls
- Auto-compression (2-3MB → 200-300KB)
- Progress bar & notifications

✅ **Bio Fields**
- Tagline (255 chars)
- About Me (unlimited)
- Both optional

✅ **Zero Server Load**
- All processing in browser
- Direct upload to Supabase Storage
- No server-side image handling

✅ **Works For All Roles**
- Student
- Educator
- Admin
- MedEd
- MedEd Team
- CTF

## 🔧 Configuration

### Change Image Quality
Edit `components/profile/ProfilePictureUpload.tsx` line 148:

```tsx
maxSizeMB: 0.3,        // 0.2 = 200KB, 0.4 = 400KB
maxWidthOrHeight: 400, // Higher = better quality
```

### Change Avatar Size
Edit `components/profile/ProfilePictureUpload.tsx` line 227:

```tsx
<div className="h-32 w-32 rounded-full"> // Change both to same value
```

## 📝 API Usage

### Get Profile (includes picture)
```tsx
const response = await fetch('/api/user/profile')
const { user } = await response.json()
console.log(user.profile_picture_url)
console.log(user.tagline)
console.log(user.about_me)
```

### Update Bio Fields
```tsx
await fetch('/api/user/profile', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tagline: "FY1 Doctor at UCL",
    about_me: "Passionate about emergency medicine..."
  })
})
```

## 🚨 Troubleshooting

### Upload Fails
✓ Check bucket name is exactly `profile-pictures`
✓ Verify bucket is public
✓ Run all 4 RLS policies

### Image Doesn't Show
✓ Check browser console for errors
✓ Verify public read policy exists
✓ Try accessing image URL directly

### "Permission Denied"
✓ User must be authenticated
✓ Check RLS policies are active
✓ Verify `auth.uid()` works in Supabase

## 📚 Full Documentation

- **Setup Guide**: `PROFILE_PICTURE_SETUP.md`
- **Implementation Details**: `PROFILE_PICTURE_IMPLEMENTATION_SUMMARY.md`
- **Migrations**: `migrations/` folder

## ✨ That's It!

The feature is fully implemented and ready to use. Just complete the 3 setup steps above and all user roles will be able to upload profile pictures, crop images, and add bio information to their profiles!


