# 🎯 What You Need To Do - Certificate System Setup

## ✅ What I've Already Done

1. ✅ **Added Certificate Email Function** (`lib/email.ts`)
   - Beautiful HTML email template
   - Uses your existing Microsoft Graph API (support@bleepy.co.uk)
   - Includes download button, event details, certificate ID

2. ✅ **Created Certificate Utilities** (`lib/certificates.ts`)
   - Helper functions for fetching, deleting, downloading certificates
   - TypeScript interfaces for type safety
   - Database query functions

3. ✅ **Updated Dashboard Sidebar** (`components/dashboard/DashboardSidebar.tsx`)
   - Added "Certificates" to Event Management section (for admin/meded_team/ctf)
   - Added "My Certificates" to Main Navigation (for all users)
   - Uses Award icon from lucide-react

4. ✅ **Updated Certificates Landing Page** (`app/certificates/page.tsx`)
   - Added "Generate", "Manage", "Templates" buttons in header
   - Clean, organized layout

5. ✅ **Created Database Migration** (`migrations/create-certificates-system.sql`)
   - Complete SQL script ready to run
   - Creates `certificates` table with all necessary fields
   - Includes RLS policies, indexes, triggers

6. ✅ **Created Implementation Guide** (`CERTIFICATE_SYSTEM_IMPLEMENTATION.md`)
   - Complete documentation
   - Step-by-step instructions
   - Code examples and testing checklist

---

## 🚀 What You Need To Do NOW

### **Step 1: Run Database Migrations** (5 minutes)

**Migration 1: Certificates Table**
1. Go to Supabase Dashboard
2. Click on **SQL Editor**
3. Open the file: `migrations/create-certificates-system.sql`
4. Copy the entire contents
5. Paste into SQL Editor
6. Click **RUN**
7. You should see success messages

**Verify it worked:**
```sql
SELECT * FROM certificates;
```
Should return empty result (no errors)

**Migration 2: Certificate Templates Table**
1. Still in SQL Editor
2. Open the file: `migrations/create-certificate-templates-table.sql`
3. Copy the entire contents
4. Paste into SQL Editor  
5. Click **RUN**
6. You should see success messages with permission details

**Verify it worked:**
```sql
SELECT * FROM certificate_templates;
```
Should return empty result (no errors)

---

### **Step 2: Create Storage Bucket** (3 minutes)

1. Go to Supabase Dashboard → **Storage**
2. Click **New bucket**
3. Name: `certificates`
4. Set to **Private** (not public)
5. Click **Create bucket**

**Add RLS Policies:**
Go to Storage → certificates bucket → Policies → Add these 3 policies:

**Policy 1: Users can view own certificates**
```sql
CREATE POLICY "Users can download own certificates"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'certificates' AND
  auth.uid()::text = (storage.foldername(name))[2]
);
```

**Policy 2: Staff can view all**
```sql
CREATE POLICY "Staff can view all certificates"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'certificates' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id::text = auth.uid()::text
    AND users.role IN ('admin', 'educator', 'meded_team', 'ctf')
  )
);
```

**Policy 3: Staff can upload**
```sql
CREATE POLICY "Staff can upload certificates"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'certificates' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id::text = auth.uid()::text
    AND users.role IN ('admin', 'meded_team', 'ctf')
  )
);
```

---

### **Step 3: Test Locally** (2 minutes)

1. Start your dev server: `npm run dev`
2. Go to http://localhost:3000/dashboard
3. Check sidebar - you should see:
   - Under "Event Management": **Certificates** link
   - Under main nav: **My Certificates** link
4. Click **Certificates** → should show certificate builder page with new buttons

---

## 📝 What I'm Building Next

Once you complete Steps 1-3 above and confirm they work, I'll build:

1. **Generate Certificates Page** (`/certificates/generate`)
   - Select event
   - Select template
   - Choose attendees
   - Preview
   - Bulk generate
   - Send emails

2. **Manage Certificates Page** (`/certificates/manage`)
   - View all certificates
   - Filter by event/user/date
   - Download individual/bulk
   - Resend emails
   - Delete certificates

3. **My Certificates Page** (`/dashboard/certificates`)
   - User's personal certificates
   - Download buttons
   - Search/filter

4. **API Routes** (`/api/certificates/*`)
   - Generate certificates endpoint
   - Send email endpoint
   - Get/delete endpoints

---

## ⚠️ Important Notes

### **Database Migration Safety**
- ✅ Safe to run - creates NEW table, doesn't modify existing ones
- ✅ No data loss risk
- ✅ Can be rolled back if needed

### **Storage Bucket**
- ✅ Private by default - only auth users can access
- ✅ RLS policies ensure users only see their own certificates
- ✅ Staff can see all

### **Permissions**

**Certificates:**
- **Students**: Can view and download own certificates only
- **Educators**: Can view all certificates
- **MedEd Team/CTF**: Can generate, view, and send certificates
- **Admin**: Full access including delete

**Templates:**
- **Admin**: Can see and use ALL templates (everyone's)
- **MedEd Team**: Can see and use ONLY their own templates
- **CTF**: Can see and use ONLY their own templates
- **Educator**: Can see and use ONLY their own templates (for future)

---

## 🐛 Troubleshooting

### If database migration fails:
- Check for syntax errors in SQL editor
- Make sure you copied the ENTIRE file
- Look at error message - usually tells you what's wrong

### If storage bucket policies fail:
- Make sure the bucket is named exactly `certificates` (lowercase)
- Policies must be added in Storage section, not SQL editor
- Test by trying to upload a file manually

### If sidebar links don't show:
- Clear browser cache and hard refresh (Ctrl+Shift+R)
- Check your user role in database
- Make sure you're logged in

---

## ✅ Checklist

Before telling me you're done, please confirm:

- [ ] Certificates table migration ran successfully
- [ ] Templates table migration ran successfully
- [ ] `SELECT * FROM certificates;` returns empty result (not error)
- [ ] `SELECT * FROM certificate_templates;` returns empty result (not error)
- [ ] Storage bucket `certificates` exists and is private
- [ ] 3 RLS policies added to storage bucket
- [ ] Dev server is running
- [ ] "Certificates" link appears in sidebar under Event Management
- [ ] "My Certificates" link appears in sidebar under main nav
- [ ] No console errors in browser

---

## 🎯 Once You're Done

Just reply with:
**"Done! Steps 1-3 complete"**

And I'll immediately build:
- Generate certificates page (with event selection, bulk generation, email sending)
- Manage certificates page (with filtering, downloading, stats)
- My certificates page (user view)
- All API routes

This should take you **10 minutes max**. Let me know when ready! 🚀

