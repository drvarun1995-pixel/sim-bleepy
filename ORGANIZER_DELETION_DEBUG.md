# Organizer Deletion Issue - Debug Guide

## Issue
Organizers cannot be deleted from events when editing. The deletion appears successful but reverts after refreshing.

---

## Root Causes (Possible)

1. **Row Level Security (RLS)** blocking deletions
2. **Missing permissions** on junction table `event_organizers`
3. **Foreign key constraints** preventing cascade deletes
4. **Database policies** conflicting with delete operations
5. **Client-side state** not properly syncing with database

---

## Solution Steps

### Step 1: Run Comprehensive SQL Fix ⚠️ CRITICAL

Run the file: `fix-organizers-deletion-comprehensive.sql`

This script will:
- ✅ Disable RLS on all related tables
- ✅ Drop conflicting policies
- ✅ Grant proper permissions to all roles
- ✅ Verify the changes
- ✅ Show diagnostics

**How to run:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy entire contents of `fix-organizers-deletion-comprehensive.sql`
4. Paste and click "Run"
5. Check the output tables

---

### Step 2: Verify SQL Execution

After running the SQL, verify:

```sql
-- Should show rowsecurity = false
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('organizers', 'event_organizers');
```

**Expected output:**
| tablename | rowsecurity |
|-----------|-------------|
| organizers | f (false) |
| event_organizers | f (false) |

If you see `t` (true), the SQL didn't run properly.

---

### Step 3: Test Deletion Process

1. Go to Event Data page (`/event-data`)
2. Click "All Events" tab
3. Click "Edit" on any event
4. Scroll to "Other Organizers" section
5. Click the X to remove an organizer
6. Click "Update Event"
7. **Wait for success message**
8. Refresh the page (F5)
9. Edit the same event again
10. Check if organizer is still removed ✓

---

### Step 4: Debug If Still Not Working

#### A. Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try deleting an organizer
4. Look for errors (especially ones mentioning "RLS" or "permission denied")
5. Copy any error messages

#### B. Check Network Requests

1. Open DevTools (F12)
2. Go to Network tab
3. Try deleting an organizer
4. Find the request to `/api/events` or similar
5. Check:
   - Request payload: Does it include the correct organizer IDs?
   - Response: Does it show success or error?
   - Status code: Should be 200, not 403 or 500

#### C. Check Supabase Logs

1. Go to Supabase Dashboard
2. Open "Logs" section
3. Select "Database" logs
4. Try deleting an organizer
5. Look for any error entries
6. Common errors:
   - "permission denied"
   - "violates foreign key constraint"
   - "RLS policy violation"

---

### Step 5: Verify Data Structure

Run these queries in Supabase SQL Editor:

```sql
-- 1. Check if event_organizers table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'event_organizers'
);

-- 2. Check structure of event_organizers
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'event_organizers';

-- 3. Check foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'event_organizers'
    AND tc.constraint_type = 'FOREIGN KEY';
```

**Expected foreign keys:**
- `event_id` → `events(id)` with DELETE CASCADE
- `organizer_id` → `organizers(id)` with DELETE CASCADE

---

## Common Issues & Fixes

### Issue: "Permission denied for table event_organizers"

**Fix:**
```sql
GRANT ALL ON public.event_organizers TO authenticated;
GRANT ALL ON public.event_organizers TO anon;
GRANT ALL ON public.event_organizers TO service_role;
```

---

### Issue: "violates foreign key constraint"

**Fix:** Check if the organizer is being used elsewhere:
```sql
SELECT e.id, e.title 
FROM events e
WHERE e.organizer_id = 'YOUR_ORGANIZER_ID';
```

---

### Issue: Changes show in UI but revert on refresh

**Possible causes:**
1. RLS blocking the delete on `event_organizers` table
2. Client cache not invalidating
3. The update API not actually calling the delete on junction table

**Fix:**
1. Ensure RLS is disabled (Step 1)
2. Hard refresh browser (Ctrl+Shift+R)
3. Check the `updateEvent` function in `lib/events-api.ts`

---

## Code-Level Debugging

### Check the Update Event Function

File: `lib/events-api.ts`

Look for this section (around line 564):
```typescript
// Update organizers if provided
if (organizerIds !== undefined) {
  // Delete existing organizer links
  await supabase
    .from('event_organizers')
    .delete()
    .eq('event_id', id);

  // Add new organizer links
  if (organizerIds.length > 0) {
    const organizerLinks = organizerIds.map(organizerId => ({
      event_id: id,
      organizer_id: organizerId
    }));

    const { error: organizersError } = await supabase
      .from('event_organizers')
      .insert(organizerLinks);
    
    if (organizersError) throw organizersError;
  }
}
```

**This should:**
1. Delete ALL existing organizer links for the event
2. Insert ONLY the new organizers (if any provided)
3. Throw an error if something fails

---

### Check the Event Form Submission

File: `app/event-data/page.tsx`

Around line 1219-1229, check this logic:
```typescript
const organizerIds = formData.otherOrganizers
  .map(orgName => {
    const organizer = allOrganizers.find(o => o.name === orgName);
    console.log(`  Lookup "${orgName}":`, organizer ? `Found (${organizer.id})` : 'NOT FOUND');
    return organizer?.id;
  })
  .filter((id): id is string => id !== undefined);
```

**Enable console logs:**
Open browser console and watch for these logs when updating an event. They should show:
- Which organizers are being looked up
- Which organizers are found
- The final array of organizer IDs being sent

---

## Alternative: API-Level Fix

If database fixes don't work, we can add an API endpoint:

Create: `app/api/events/[id]/organizers/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/client'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { organizerId } = await request.json()

  const { error } = await supabase
    .from('event_organizers')
    .delete()
    .eq('event_id', params.id)
    .eq('organizer_id', organizerId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

This would bypass RLS completely by using service role.

---

## Final Checklist

Before reporting that it still doesn't work:

- [ ] Ran `fix-organizers-deletion-comprehensive.sql` in Supabase
- [ ] Verified RLS is disabled (rowsecurity = false)
- [ ] Checked browser console for errors
- [ ] Checked network tab for failed requests
- [ ] Hard refreshed browser (Ctrl+Shift+R)
- [ ] Tried in incognito/private window
- [ ] Checked Supabase logs for errors
- [ ] Verified foreign key constraints have CASCADE

---

## Get More Help

If still not working after all steps:

1. **Share browser console errors** - Screenshot or copy-paste
2. **Share network request/response** - From DevTools Network tab
3. **Share Supabase logs** - Any error entries
4. **Confirm SQL execution** - Show the output of verification queries

This will help diagnose the exact issue!



















