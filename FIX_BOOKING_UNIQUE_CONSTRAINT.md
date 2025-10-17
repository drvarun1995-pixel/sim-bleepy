# Fix Booking Unique Constraint for Soft Delete

## Problem
Users cannot re-book events after cancelling/deleting previous bookings because of a database unique constraint that doesn't account for soft-deleted records.

### Error Message
```
duplicate key value violates unique constraint "event_bookings_event_id_user_id_key"
```

## Solution
Replace the simple unique constraint with a **partial unique index** that only applies to non-deleted bookings.

## How to Apply the Fix

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Migration
1. Copy the entire contents of `migrations/fix-unique-constraint-for-soft-delete.sql`
2. Paste it into the SQL Editor
3. Click **Run** or press `Ctrl+Enter`

### Step 3: Verify
You should see a success message:
```
✓ UNIQUE CONSTRAINT FIX COMPLETE
- Removed: event_bookings_event_id_user_id_key constraint
- Added: event_bookings_active_user_event_unique partial index
```

### Step 4: Test
1. Cancel a booking
2. Delete the cancelled booking
3. Try to re-book the same event
4. It should work without errors! ✅

## What This Does

### Before (Problem)
- **Constraint:** One booking per user per event (including deleted bookings)
- **Issue:** Cannot re-book after cancelling/deleting

### After (Solution)
- **Partial Index:** One ACTIVE booking per user per event
- **Allows:** Re-booking after cancelling/deleting
- **Still Prevents:** Multiple simultaneous active bookings

## Technical Details

The partial unique index only enforces uniqueness WHERE `deleted_at IS NULL`, which means:
- ✅ Users can have multiple cancelled/deleted bookings for the same event
- ✅ Users can re-book events after cancelling
- ❌ Users cannot have multiple ACTIVE bookings for the same event

This is the correct behavior for a booking system with soft delete!

