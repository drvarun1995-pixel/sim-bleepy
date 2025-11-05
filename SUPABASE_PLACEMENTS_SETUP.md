# Supabase Setup for Placements System

## 📋 Quick Setup (3 Steps)

### Step 1: Run the Database Migrations (IN ORDER)

**Run these scripts one by one in the SQL Editor:**

#### Script 1: Create Tables (Functional)
1. Go to [Supabase Dashboard](https://app.supabase.com) → Your Project → **SQL Editor**
2. Click **New Query**
3. Copy and paste the **entire contents** of `migrations/create-placements-system-functional.sql`
4. Click **Run** (or press F5)

This will:
- ✅ Create 3 tables: `specialties`, `specialty_pages`, `specialty_documents`
- ✅ Add indexes for performance
- ✅ Enable RLS (but no policies yet - system is functional)
- ✅ Insert initial "Rheumatology" specialty

#### Script 2: Add RLS Policies
1. **New Query** again
2. Copy and paste the **entire contents** of `migrations/add-placements-rls-policies.sql`
3. Click **Run**

This will:
- ✅ Add proper RLS policies for all tables
- ✅ Allow service role full access (for API routes)
- ✅ Allow everyone to view active items
- ✅ Restrict management to Admin/MedEd/CTF roles

#### Script 3: Verify Setup (Optional but Recommended)
1. **New Query** again
2. Copy and paste the **entire contents** of `migrations/verify-placements-system.sql`
3. Click **Run**

This will:
- ✅ Verify all tables exist
- ✅ Check RLS is enabled
- ✅ Count policies
- ✅ Verify initial data
- ✅ Show summary report

---

### Step 2: Create Storage Bucket (✅ Already Done!)

You've already created the `placements` bucket with:
- ✅ Name: `placements`
- ✅ Public: `No`
- ✅ File size limit: `50 MB`
- ✅ MIME types: Not restricted

**You can skip this step!** ✅

---

### Step 3: Verify Setup (Run Verification Script)

After running the migration scripts, verify everything worked by running:

**File:** `migrations/verify-placements-system.sql`

This will show:
- ✅ All 3 tables exist
- ✅ RLS is enabled
- ✅ All policies are in place (18 total - 6 per table)
- ✅ Initial "Rheumatology" specialty exists
- ✅ Summary report

**Or run this quick check:**
```sql
-- Quick verification
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('specialties', 'specialty_pages', 'specialty_documents');

SELECT COUNT(*) as policy_count FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('specialties', 'specialty_pages', 'specialty_documents');

SELECT * FROM specialties;
```

You should see:
- ✅ `table_count` = 3
- ✅ `policy_count` = 18
- ✅ "Rheumatology" specialty in results

---

## ✅ That's It!

The system is now ready. You can:
1. Navigate to `/placements-guide` (as Admin/CTF/MedEd user)
2. Start adding specialties, pages, and documents
3. All users can view content on `/placements`

---

## 🔒 Security Notes

**Why RLS is Disabled:**
- Your app uses **NextAuth** (not Supabase Auth)
- API routes use **service role** (bypasses RLS anyway)
- Authorization happens at the **API layer** (Next.js routes check `user.role`)
- This matches your existing architecture pattern (events, resources, etc.)

**Security is handled by:**
- ✅ API route authentication (NextAuth session checks)
- ✅ API route authorization (role checks: `admin`, `meded_team`, `ctf`)
- ✅ Service role access (API routes use `supabaseAdmin`)

---

## 📝 Storage Policies (Optional)

Since your API uses service role for storage operations, storage policies are **optional**. However, if you want defense-in-depth, you can add these:

Go to **Storage** → **Policies** → **New Policy**:

**Policy 1: Upload (CTF/MedEd/Admin)**
```sql
CREATE POLICY "Allow CTF/MedEd/Admin uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'placements'
);
```

**Policy 2: Download (All authenticated)**
```sql
CREATE POLICY "Allow authenticated downloads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'placements');
```

**Policy 3: Delete (CTF/MedEd/Admin)**
```sql
CREATE POLICY "Allow CTF/MedEd/Admin deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'placements'
);
```

**Note:** These policies use `auth.uid()` which requires Supabase Auth. Since you use NextAuth, the API uses service role to bypass these. The policies are just for defense-in-depth if someone accesses storage directly.

---

## ❓ Troubleshooting

**Issue: "Permission denied"**
- Solution: Make sure you ran the migration SQL successfully

**Issue: "Table doesn't exist"**
- Solution: Re-run the migration SQL

**Issue: "Cannot upload documents"**
- Solution: Verify `placements` bucket exists in Storage (see `CREATE_STORAGE_BUCKET_GUIDE.md`)

---

## 📄 Files Reference

- **Script 1 (Functional):** `migrations/create-placements-system-functional.sql`
- **Script 2 (RLS Policies):** `migrations/add-placements-rls-policies.sql`
- **Script 3 (Verification):** `migrations/verify-placements-system.sql`
- **Storage Guide:** `CREATE_STORAGE_BUCKET_GUIDE.md`
- **Setup Guide:** This file (`SUPABASE_PLACEMENTS_SETUP.md`)
