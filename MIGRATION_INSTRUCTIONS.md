# Migration Instructions: Add Rescheduled Date and Moved Online Link Fields

## Overview
This migration adds two new columns to the `events` table to support the rescheduled and moved-online event status features.

## What You Need to Do

### Step 1: Run the Migration SQL

1. **Open your Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Migration**
   - Copy the contents of `migrations/add-rescheduled-and-moved-online-fields.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the migration

   **OR** run it via command line if you have Supabase CLI:
   ```bash
   supabase db push
   ```

### Step 2: Verify the Migration

After running the migration, verify the columns were added:

```sql
-- Check if columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
  AND column_name IN ('rescheduled_date', 'moved_online_link');
```

You should see:
- `rescheduled_date` - DATE (nullable)
- `moved_online_link` - TEXT (nullable)

### Step 3: Verify the View (Optional)

The `events_with_details` view should automatically include these new columns because it uses `SELECT e.*`. To verify:

**Option 1: Quick test query**
```sql
SELECT rescheduled_date, moved_online_link 
FROM events_with_details 
LIMIT 1;
```

If this query works without errors, the view includes the new columns! ✅

**Option 2: Run the verification script**
Run `migrations/verify-view-includes-new-columns.sql` to check the view status.

**If columns are missing** (shouldn't happen, but just in case):
- The view might need to be refreshed, but this is unlikely
- Check if your view uses `SELECT e.*` - if it does, it should work automatically
- If you need to refresh the view, be careful about security definer settings

## What This Migration Does

✅ **Safe Changes Only:**
- Adds 2 new nullable columns to the `events` table
- **Does NOT modify or recreate the `events_with_details` view**
- No existing data is modified
- No existing columns are changed
- All existing events will have `NULL` for these fields (which is correct)

### ⚠️ Security Definer Concerns

**This migration is safe regarding security definer issues because:**
- It **only adds columns** to the `events` table
- It **does NOT touch** the `events_with_details` view definition
- The view uses `SELECT e.*` which automatically includes all columns from the events table
- Since we're only **adding** columns (not removing or modifying), the view automatically picks them up
- **No view recreation = No security definer issues**

If you've had security definer problems in the past, this migration avoids them entirely by not modifying the view at all.

## Features Enabled After Migration

Once the migration is complete, you'll be able to:

1. **Rescheduled Events:**
   - Select a new date when marking an event as "rescheduled"
   - The date will appear as "Postponed to [date]" on event pages
   - Announcements will include the rescheduled date

2. **Moved Online Events:**
   - Add an online meeting link when marking an event as "moved-online"
   - The link will be displayed on the event page
   - Announcements will include the online meeting link

3. **Automatic Announcements:**
   - When an event is created or updated with "rescheduled" or "moved-online" status, an announcement is automatically created
   - Toast notifications will appear when announcements are created

## Troubleshooting

If you encounter any issues:

1. **Columns not appearing:**
   - Make sure you ran the migration successfully
   - Check for any error messages in the SQL Editor
   - Verify you're connected to the correct database

2. **View not showing new columns:**
   - The view should automatically include new columns from the events table
   - If needed, you can manually refresh the view by checking its definition

3. **Application errors:**
   - Make sure you've restarted your development server after the migration
   - Clear your browser cache if needed

## Support

If you need help, check:
- The migration SQL file: `migrations/add-rescheduled-and-moved-online-fields.sql`
- Supabase documentation for SQL migrations

