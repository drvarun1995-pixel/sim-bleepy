# Profile Picture Feature - Setup Guide

This guide explains how to set up and use the profile picture feature with Supabase Storage.

## ✨ Features

- **Profile Pictures**: Upload, crop, and display circular profile pictures
- **Bio Fields**: Add optional "About Me" and "Tagline" to profiles
- **Client-Side Optimization**: Images are compressed from 2-3MB to 200-300KB before upload
- **Zero Server Load**: All processing happens in the browser
- **Modern UX**: Touch-friendly image cropper with zoom controls
- **Progress Tracking**: Real-time upload progress bar
- **Toast Notifications**: User feedback for all actions

## 📋 Prerequisites

- Supabase project with database access
- Environment variables configured (see `.env.local`)
- Node.js project with dependencies installed

## 🚀 Setup Instructions

### Step 1: Install Dependencies

The required packages are already installed:
- `react-easy-crop` - Modern image cropper
- `browser-image-compression` - Client-side compression

If not installed, run:
```bash
npm install react-easy-crop browser-image-compression
```

### Step 2: Database Migration

Run the SQL migration in your Supabase SQL editor:

```sql
-- File: migrations/add-profile-picture-and-bio-fields.sql

-- Add profile picture columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS profile_picture_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS about_me TEXT,
ADD COLUMN IF NOT EXISTS tagline VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN users.profile_picture_url IS 'URL to user profile picture in Supabase Storage';
COMMENT ON COLUMN users.profile_picture_updated_at IS 'Timestamp of last profile picture update';
COMMENT ON COLUMN users.about_me IS 'User bio/about me section (optional)';
COMMENT ON COLUMN users.tagline IS 'Short tagline/headline for user profile (optional, max 255 chars)';

-- Create index for faster profile picture lookups
CREATE INDEX IF NOT EXISTS idx_users_profile_picture_url ON users(profile_picture_url) WHERE profile_picture_url IS NOT NULL;
```

### Step 3: Create Supabase Storage Bucket

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"Create bucket"**
4. Configure the bucket:
   - **Name**: `profile-pictures`
   - **Public bucket**: ✅ Yes (allows public read access)
   - **File size limit**: 3MB (3145728 bytes)
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

#### Option B: Using SQL

Run this in your Supabase SQL editor:

```sql
-- Insert bucket configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,
  3145728, -- 3MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
```

### Step 4: Configure Storage RLS Policies

Run these RLS policies in your Supabase SQL editor:

```sql
-- File: migrations/setup-profile-pictures-bucket.sql

-- Policy 1: Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload their own profile picture"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Allow users to update their own profile pictures
CREATE POLICY "Users can update their own profile picture"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Allow users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile picture"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Allow public read access to all profile pictures
CREATE POLICY "Public read access to profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');
```

### Step 5: Verify Setup

1. Start your development server: `npm run dev`
2. Navigate to your profile page
3. Try uploading a profile picture
4. Check Supabase Storage to confirm the file was uploaded

## 📁 File Structure

### New Files Created

```
migrations/
├── add-profile-picture-and-bio-fields.sql  # Database schema updates
└── setup-profile-pictures-bucket.sql       # Storage bucket setup

components/profile/
└── ProfilePictureUpload.tsx                # Profile picture upload component

app/api/user/
└── profile-picture/
    └── route.ts                            # Upload/delete API endpoint
```

### Modified Files

```
components/profile/
└── ProfileForm.tsx                         # Added picture upload & bio fields

app/api/user/profile/
└── route.ts                                # Added new fields to API
```

## 🎨 User Experience

### Upload Flow

1. User clicks camera icon or "Upload Picture" button
2. File picker opens (JPEG, PNG, WebP only)
3. Selected image opens in cropper modal
4. User adjusts crop area and zoom
5. On "Upload Picture":
   - Image cropped to 1:1 ratio (400x400px)
   - Compressed to ~200-300KB (WebP format)
   - Uploaded to Supabase Storage
   - Database updated with URL
   - Progress bar shows upload status
   - Success toast notification
6. Profile picture appears in circular avatar

### Delete Flow

1. User clicks "Remove" button
2. File deleted from Supabase Storage
3. Database record cleared
4. Avatar shows user initial
5. Success toast notification

## ⚡ Performance Optimizations

### Client-Side Processing
- ✅ Image cropping happens in browser (Canvas API)
- ✅ Compression reduces file size by 85-90%
- ✅ WebP format for better compression
- ✅ Direct upload to Supabase Storage (no server proxy)

### Server Load
- ✅ Zero CPU usage for image processing
- ✅ Minimal API overhead (only metadata updates)
- ✅ No temporary file storage
- ✅ CDN-delivered images (Supabase Storage)

### Database Efficiency
- ✅ Indexed profile_picture_url for fast lookups
- ✅ Automatic cleanup of old files
- ✅ One file per user (overwrites on update)

## 🔒 Security

### Authentication
- All endpoints require valid session
- Users can only access their own data
- Service role key used for storage operations

### File Validation
- File type checking (JPEG, PNG, WebP only)
- File size limit (3MB max)
- MIME type validation
- User ownership verification

### Storage Security
- RLS policies enforce ownership
- Public read-only for viewing
- Authenticated write for own files
- Folder-based isolation per user

## 📊 Technical Specifications

| Aspect | Specification |
|--------|--------------|
| Max Upload Size | 3 MB |
| Target Compressed Size | 200-300 KB |
| Final Dimensions | 400x400px (1:1) |
| Supported Formats | JPEG, PNG, WebP |
| Output Format | WebP (JPEG fallback) |
| Display Shape | Circular |
| Storage Location | Supabase Storage `profile-pictures` |
| File Naming | `{user-id}/{user-id}.webp` |
| CDN | Supabase CDN (automatic) |

## 🧪 Testing Checklist

- [ ] Upload JPEG image
- [ ] Upload PNG image
- [ ] Upload WebP image
- [ ] Try uploading file > 3MB (should reject)
- [ ] Try uploading non-image file (should reject)
- [ ] Crop and zoom functionality works
- [ ] Progress bar displays during upload
- [ ] Success toast appears after upload
- [ ] Profile picture persists after page reload
- [ ] Delete functionality removes image
- [ ] All user roles can upload pictures
- [ ] About Me and Tagline fields save correctly

## 🐛 Troubleshooting

### Upload Fails

**Issue**: "Failed to upload image to storage"

**Solutions**:
1. Check Supabase Storage bucket exists
2. Verify bucket name is `profile-pictures`
3. Confirm bucket is public
4. Check RLS policies are active

### RLS Permission Denied

**Issue**: "new row violates row-level security policy"

**Solutions**:
1. Run all RLS policies from Step 4
2. Check user is authenticated
3. Verify `auth.uid()` matches user folder

### Image Not Displaying

**Issue**: Profile picture URL exists but image doesn't load

**Solutions**:
1. Check bucket is marked as public
2. Verify "Public read access" policy exists
3. Check browser console for CORS errors
4. Try accessing URL directly in browser

### Compression Too Aggressive

**Issue**: Compressed images look pixelated

**Solutions**:
1. Increase `maxSizeMB` in ProfilePictureUpload.tsx (line 150)
2. Adjust WebP quality parameter (line 60)
3. Increase final dimensions from 400x400

## 🎯 Usage Example

```tsx
// In any profile page component
import { ProfileForm } from '@/components/profile/ProfileForm'

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)

  const fetchProfile = async () => {
    const response = await fetch('/api/user/profile')
    const data = await response.json()
    setProfile(data.user)
  }

  return (
    <ProfileForm 
      initialProfile={profile} 
      onUpdate={fetchProfile} 
    />
  )
}
```

## 📝 API Reference

### POST /api/user/profile-picture

Upload a new profile picture.

**Request**: `multipart/form-data`
- `file`: Image file (JPEG/PNG/WebP, max 3MB)
- `userId`: User ID

**Response**: `application/json`
```json
{
  "message": "Profile picture uploaded successfully",
  "url": "https://supabase-storage-url/profile-pictures/user-id/user-id.webp"
}
```

### DELETE /api/user/profile-picture

Remove current profile picture.

**Response**: `application/json`
```json
{
  "message": "Profile picture removed successfully"
}
```

### PUT /api/user/profile

Update profile including bio fields.

**Request**: `application/json`
```json
{
  "name": "John Doe",
  "tagline": "Medical student passionate about emergency medicine",
  "about_me": "I'm a 4th year medical student at UCL..."
}
```

## 🔄 Future Enhancements

Possible improvements:
- [ ] Avatar gallery/presets for users without pictures
- [ ] Image filters and effects
- [ ] Multiple photo support (portfolio)
- [ ] Automatic face detection for better cropping
- [ ] AI-powered background removal
- [ ] Social media import (LinkedIn, etc.)

## 📞 Support

If you encounter issues:
1. Check this troubleshooting guide
2. Review Supabase Storage logs
3. Check browser console for errors
4. Verify environment variables
5. Test with different image files

## ✅ Success Indicators

You'll know the feature is working when:
- ✅ Profile picture uploads without errors
- ✅ Image appears circular on profile page
- ✅ File size is ~200-300KB in storage
- ✅ Delete removes image completely
- ✅ About Me and Tagline save properly
- ✅ All user roles can access feature
- ✅ No performance issues during upload


