# Database Verification Checklist for Workflows 3-7

**Purpose:** Verify that all required database columns exist before testing workflows 3-7.

---

## ✅ Required Database Fields

All workflows use existing database columns. **No new columns need to be added.** However, you should verify these columns exist in your Supabase database.

### Required Columns in `events` Table

| Column Name | Type | Default | Purpose |
|------------|------|---------|---------|
| `booking_enabled` | BOOLEAN | false | Controls booking functionality |
| `qr_attendance_enabled` | BOOLEAN | false | Controls QR code attendance tracking |
| `feedback_enabled` | BOOLEAN | false | Controls feedback collection |
| `auto_generate_certificate` | BOOLEAN | false | Controls automatic certificate generation |
| `certificate_template_id` | TEXT | NULL | ID of certificate template to use |
| `certificate_auto_send_email` | BOOLEAN | true | Whether to auto-send certificate emails |
| `feedback_required_for_certificate` | BOOLEAN | true | **Critical for Workflow 3** - Gates certificates by feedback |

---

## 🔍 Verification Steps

### Step 1: Check if Columns Exist

Run this SQL query in your Supabase SQL Editor:

```sql
-- Check if all required columns exist in events table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND column_name IN (
    'booking_enabled',
    'qr_attendance_enabled',
    'feedback_enabled',
    'auto_generate_certificate',
    'certificate_template_id',
    'certificate_auto_send_email',
    'feedback_required_for_certificate'
  )
ORDER BY column_name;
```

**Expected Result:** You should see all 7 columns listed.

**If any columns are missing:** Run the appropriate migration file from the `migrations/` folder.

---

### Step 2: Check Existing Migration Files

The following migration files should have already been run:

1. **`migrations/add-event-booking-fields.sql`**
   - Adds: `booking_enabled`, `booking_button_label`, `booking_capacity`, etc.

2. **`migrations/update-events-for-qr-codes.sql`**
   - Adds: `qr_attendance_enabled`, `feedback_required_for_certificate`, `auto_generate_certificate`, `certificate_template_id`, `certificate_auto_send_email`

3. **`migrations/add-feedback-enabled-column.sql`**
   - Adds: `feedback_enabled`

---

### Step 3: Run Missing Migrations (If Needed)

**If any columns are missing**, run these migrations in order:

#### Migration 1: Booking Fields
```sql
-- File: migrations/add-event-booking-fields.sql
-- Run this if booking_enabled column doesn't exist
```

#### Migration 2: QR Codes & Certificates
```sql
-- File: migrations/update-events-for-qr-codes.sql
-- Run this if qr_attendance_enabled, auto_generate_certificate, or feedback_required_for_certificate don't exist
```

#### Migration 3: Feedback Enabled
```sql
-- File: migrations/add-feedback-enabled-column.sql
-- Run this if feedback_enabled column doesn't exist
```

---

## 📋 Quick Verification Query

Run this single query to check everything at once:

```sql
-- Comprehensive check of all workflow-related columns
SELECT 
  CASE 
    WHEN COUNT(*) = 7 THEN '✅ All columns exist'
    ELSE '❌ Missing columns: ' || STRING_AGG(missing.column_name, ', ')
  END as status
FROM (
  SELECT unnest(ARRAY[
    'booking_enabled',
    'qr_attendance_enabled', 
    'feedback_enabled',
    'auto_generate_certificate',
    'certificate_template_id',
    'certificate_auto_send_email',
    'feedback_required_for_certificate'
  ]) as column_name
) as required
LEFT JOIN information_schema.columns c 
  ON c.table_name = 'events' 
  AND c.column_name = required.column_name
LEFT JOIN LATERAL (SELECT column_name as missing WHERE c.column_name IS NULL) as missing ON true
GROUP BY missing.column_name;
```

---

## 🎯 What to Do Based on Results

### ✅ All Columns Exist
**Action:** You're ready to test! No database changes needed.

**Next Steps:**
1. Test each workflow (3-7) as described in `WORKFLOWS_3_7_IMPLEMENTATION_REPORT.md`
2. Verify email delivery
3. Check certificate generation
4. Confirm feedback collection

### ❌ Some Columns Missing
**Action:** Run the missing migration files from `migrations/` folder.

**How to Run Migrations:**
1. Go to Supabase Dashboard → SQL Editor
2. Open the migration file from `migrations/` folder
3. Copy and paste the SQL into SQL Editor
4. Click "Run"
5. Verify success message
6. Re-run the verification query above

---

## 📊 Migration File Reference

### Complete List of Relevant Migrations

| File | Adds Columns | When to Run |
|------|--------------|-------------|
| `add-event-booking-fields.sql` | `booking_enabled`, booking fields | If booking not working |
| `update-events-for-qr-codes.sql` | `qr_attendance_enabled`, `feedback_required_for_certificate`, `auto_generate_certificate`, etc. | If QR/certificates not working |
| `add-feedback-enabled-column.sql` | `feedback_enabled` | If feedback not working |

---

## ⚠️ Important Notes

1. **All migrations use `ADD COLUMN IF NOT EXISTS`** - Safe to run multiple times
2. **No data loss** - All migrations are additive only
3. **Indexes created automatically** - Migrations include performance indexes
4. **Backward compatible** - Existing events will have safe defaults

---

## 🔄 If You're Unsure

**Option 1: Check via Supabase Dashboard**
1. Go to Supabase Dashboard → Table Editor
2. Select `events` table
3. Check if these columns exist in the column list

**Option 2: Run All Migrations (Safe)**
All migrations use `IF NOT EXISTS`, so running them again won't cause errors:
```sql
-- Run all three migrations in order (they're safe to re-run)
-- 1. Booking fields
-- 2. QR codes & certificates  
-- 3. Feedback enabled
```

---

## ✅ Verification Complete Checklist

- [ ] Verified all 7 columns exist in `events` table
- [ ] Checked migration files are available in `migrations/` folder
- [ ] Run any missing migrations (if needed)
- [ ] Confirmed no errors in migration execution
- [ ] Ready to test workflows 3-7

---

## 📞 Summary

**TL;DR:** 

- **Most likely:** All columns already exist (migrations were likely run during previous development)
- **Action needed:** Just verify with the SQL query above
- **If missing:** Run the migration files from `migrations/` folder (they're safe to re-run)
- **No destructive changes:** All migrations are additive only

**You're probably ready to test immediately!** Just verify the columns exist first.

---

**Document Version:** 1.0  
**Created:** January 2025  
**Related Documents:**
- `WORKFLOWS_3_7_IMPLEMENTATION_REPORT.md` - Implementation details
- `WORKFLOW_CYCLES.md` - Workflow definitions

