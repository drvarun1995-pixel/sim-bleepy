# Teaching Portfolio Feature - Setup Instructions

## ✅ What Has Been Created

### 1. Database Table
- **File:** `migrations/create-teaching-portfolio-table.sql`
- **Table:** `teaching_portfolio_files`
- **RLS Policies:** ✅ Properly configured (service_role based, similar to IMT portfolio)

### 2. Frontend Components
- **Page:** `app/teaching-portfolio/page.tsx`
- **Layout:** `app/teaching-portfolio/layout.tsx`
- **Sidebar Link:** Updated in `components/dashboard/DashboardSidebar.tsx`

### 3. API Routes
- **Upload:** `app/api/teaching-portfolio/upload/route.ts`
- **Files List:** `app/api/teaching-portfolio/files/route.ts`
- **File Operations:** `app/api/teaching-portfolio/files/[id]/route.ts` (GET, PUT, DELETE)

## 📋 What You Need to Do

### Step 1: Run SQL Migration

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `migrations/create-teaching-portfolio-table.sql`
4. Run the SQL script

**Important:** This will create:
- The `teaching_portfolio_files` table
- All necessary indexes
- RLS policies (using service_role, same pattern as IMT portfolio)

### Step 2: Create Supabase Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name it: **`teaching-portfolio`** (exactly as specified)
4. Make it **Private** (not public)
5. Click "Create bucket"

**Note:** The bucket name must be exactly `teaching-portfolio` (lowercase, with hyphen) as it's hardcoded in the API routes.

### Step 3: Configure Storage Bucket Policies (Optional but Recommended)

If you want to add additional security policies to the bucket:

```sql
-- Allow authenticated users to upload files (handled by API, but good to have)
-- The API uses service_role, so this is mainly for reference
```

The API routes use `supabaseAdmin` (service_role), so bucket policies are less critical, but you can add them if needed.

### Step 4: Test the Feature

1. **Login** as a CTF or Admin user
2. **Navigate** to Dashboard → Portfolio → Teaching Portfolio
3. **Upload** a test file:
   - Select a category (e.g., "Bedside Teaching")
   - Select evidence type (e.g., "Certificate")
   - Upload a file
   - Add display name and description
4. **Verify** the file appears in the category
5. **Test** edit and delete functionality

## 📁 Feature Details

### Categories
1. Bedside teaching
2. Twilight teaching
3. Core teaching
4. OSCE skills teaching
5. Exams
6. Others

### Evidence Types
- Email
- Certificate
- Document
- Other

### Access Control
- ✅ Only CTF and Admin roles can access
- ✅ Users can only see/edit/delete their own files
- ✅ RLS policies enforce data isolation

### File Storage
- **Bucket:** `teaching-portfolio`
- **Path Structure:** `{username}/{category}/{filename}`
- **Max File Size:** 25MB
- **Allowed Types:** Images, PDFs, Office documents (same as IMT portfolio)

## 🔍 Verification Checklist

- [ ] SQL migration executed successfully
- [ ] `teaching_portfolio_files` table exists in database
- [ ] RLS policies are enabled on the table
- [ ] Storage bucket `teaching-portfolio` created
- [ ] Can access Teaching Portfolio from sidebar (CTF/Admin only)
- [ ] Can upload a file
- [ ] Can view uploaded files by category
- [ ] Can edit file details
- [ ] Can delete files
- [ ] Can download files
- [ ] Search functionality works

## 🐛 Troubleshooting

### Issue: "Access Denied" error
**Solution:** Make sure you're logged in as CTF or Admin role. Check your user role in the database.

### Issue: "Failed to upload file to storage"
**Solution:** 
1. Verify the `teaching-portfolio` bucket exists
2. Check bucket name is exactly `teaching-portfolio` (lowercase, hyphen)
3. Verify bucket is accessible (not deleted)

### Issue: "File not found" when downloading
**Solution:**
1. Check if file exists in storage bucket
2. Verify `file_path` in database matches actual storage path
3. Check storage bucket permissions

### Issue: RLS policy errors
**Solution:**
1. Verify RLS policies were created correctly
2. Check that policies use `auth.role() = 'service_role'` (same as IMT portfolio)
3. API routes use `supabaseAdmin` which bypasses RLS, so this should work

## 📝 Notes

- The feature is similar to IMT Portfolio but simplified (no subcategories)
- All files are stored in the `teaching-portfolio` bucket
- File structure: `{username}/{category}/{filename}`
- Same file size and type restrictions as IMT Portfolio
- Search functionality included
- Category-based organization with expand/collapse

## ✅ Ready to Use

Once you've completed Steps 1-2 (SQL migration + storage bucket), the feature is ready to use!

No code changes needed - everything is implemented and ready.

