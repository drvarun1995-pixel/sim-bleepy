# Soft Delete for Bookings - Admin Record Keeping

## Feature Overview

Users can delete their bookings from the "My Bookings" page, BUT the booking records remain visible to administrators on the admin `/bookings` page for auditing and record-keeping purposes.

## How It Works

### For Users (My Bookings Page)
- Click "Delete Booking" on any booking
- Booking is **soft-deleted** (marked as deleted, not removed from database)
- Booking disappears from their "My Bookings" list
- They can re-book the same event if they want

### For Admins (Bookings Management Page)
- All bookings are visible, including soft-deleted ones
- Deleted bookings have a visual indicator:
  - Red background tint (`bg-red-50`)
  - Reduced opacity (`opacity-60`)
  - Badge showing "Deleted by User"
- Full audit trail maintained

## Database Changes

### New Migration: `migrations/add-soft-delete-to-bookings.sql`

Adds two new columns to `event_bookings` table:

1. **`deleted_at`** (TIMESTAMPTZ, nullable)
   - Records when the booking was deleted
   - `NULL` = active booking
   - Has timestamp = soft-deleted

2. **`deleted_by`** (UUID, nullable)
   - Foreign key to `users(id)`
   - Records which user deleted the booking
   - Useful for audit trails

### How to Run

```sql
-- In Supabase SQL Editor
-- Copy and paste the contents of migrations/add-soft-delete-to-bookings.sql
```

## API Changes

### 1. DELETE `/api/bookings/[id]`

**New Behavior:**
- **Users**: Soft delete (sets `deleted_at` and `deleted_by`)
- **Admins**: Soft delete by default, OR hard delete if `?hard=true` query parameter is provided

**Examples:**
```typescript
// User deletes their own booking (soft delete)
DELETE /api/bookings/abc123
→ Sets deleted_at = now(), deleted_by = user_id

// Admin soft deletes (same as user)
DELETE /api/bookings/abc123
→ Sets deleted_at = now(), deleted_by = admin_id

// Admin hard deletes (permanent removal)
DELETE /api/bookings/abc123?hard=true
→ Permanently removes record from database
```

**Code:**
```typescript
const hardDelete = isAdmin && new URL(request.url).searchParams.get('hard') === 'true';

if (hardDelete) {
  // Permanent deletion (admin only)
  await supabaseAdmin.from('event_bookings').delete().eq('id', bookingId);
} else {
  // Soft delete (sets deleted_at timestamp)
  await supabaseAdmin.from('event_bookings').update({
    deleted_at: new Date().toISOString(),
    deleted_by: user.id
  }).eq('id', bookingId);
}
```

### 2. GET `/api/bookings` (User's Bookings)

**Updated Query:**
```typescript
// Users only see their NON-deleted bookings
if (!isAdmin) {
  query = query.eq('user_id', user.id).is('deleted_at', null);
}

// Admins see ALL bookings (including deleted ones)
```

### 3. GET `/api/bookings/event/[eventId]` (Admin View)

**Updated Query:**
- Includes `deleted_at` and `deleted_by` in SELECT
- Shows all bookings regardless of deletion status
- Admins can see complete history

## Frontend Changes

### 1. `app/api/bookings/[id]/route.ts`
- Implemented soft delete logic
- Added support for hard delete via `?hard=true` param
- Sets `deleted_at` and `deleted_by` on soft delete

### 2. `app/api/bookings/route.ts`
- Filters out deleted bookings for regular users
- Shows all bookings (including deleted) for admins
- Added `deleted_at` and `deleted_by` to SELECT

### 3. `app/api/bookings/event/[eventId]/route.ts`
- Added `deleted_at` and `deleted_by` to SELECT
- No filtering - admins see everything

### 4. `app/bookings/[eventId]/page.tsx`
- Updated `Booking` interface with `deleted_at` and `deleted_by`
- Added visual indicator for deleted bookings:
  - Red background
  - "Deleted by User" badge
  - Reduced opacity

### 5. `app/my-bookings/page.tsx`
- No changes needed - already calls DELETE endpoint
- Soft-deleted bookings automatically hidden via API filter

## Visual Design

### Deleted Booking Appearance (Admin View)

```
┌──────────────────────────────────────────────────────────┐
│ [Name] [Deleted by User badge]   bg-red-50, opacity-60 │
│ Role: Student                                            │
│ Email: user@example.com                                  │
│ Status: Confirmed                                        │
│ Booked: 15 Jan 2025                                      │
└──────────────────────────────────────────────────────────┘
```

### Badge Styling
```jsx
<span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
  Deleted by User
</span>
```

## Benefits

### 1. **Audit Trail**
- Complete history of all bookings
- Know who deleted what and when
- Compliance and record-keeping

### 2. **Data Integrity**
- No accidental data loss
- Reversible if needed
- Statistics remain accurate

### 3. **User Experience**
- Users can delete bookings without admin intervention
- Clean interface for users (deleted bookings hidden)
- Admins have full visibility

### 4. **Flexibility**
- Admins can permanently delete if needed (`?hard=true`)
- Soft delete is default and safe
- Easy to implement "undelete" feature in future

## Future Enhancements (Optional)

1. **Undelete Feature**
   - Admin can restore deleted bookings
   - Reset `deleted_at` to `NULL`

2. **Automatic Purging**
   - Cron job to hard-delete bookings after X days
   - `DELETE FROM event_bookings WHERE deleted_at < NOW() - INTERVAL '90 days'`

3. **Deleted By Name**
   - Show who deleted: "Deleted by John Doe"
   - Join with users table on `deleted_by`

4. **Delete Reason**
   - Add `deletion_reason` column
   - Track why bookings were deleted

## Testing Checklist

### Database Migration
- [ ] Run `migrations/add-soft-delete-to-bookings.sql`
- [ ] Verify `deleted_at` and `deleted_by` columns exist
- [ ] Check no errors in migration

### User Flow
- [ ] User books an event
- [ ] User goes to "My Bookings"
- [ ] User clicks "Delete Booking"
- [ ] Booking disappears from user's list
- [ ] User can re-book the same event

### Admin Flow
- [ ] Admin goes to `/bookings`
- [ ] All bookings visible (including deleted)
- [ ] Deleted bookings have red background
- [ ] "Deleted by User" badge visible
- [ ] Can still manage/view deleted bookings

### API Testing
```bash
# Soft delete (user)
DELETE /api/bookings/abc123

# Check database
SELECT * FROM event_bookings WHERE id = 'abc123';
-- Should have deleted_at timestamp

# Hard delete (admin only)
DELETE /api/bookings/abc123?hard=true

# Check database
SELECT * FROM event_bookings WHERE id = 'abc123';
-- Should return no rows
```

## Summary

✅ **Soft delete** implemented - bookings marked as deleted, not removed
✅ **User-friendly** - deleted bookings hidden from users
✅ **Admin visibility** - all bookings visible to admins with visual indicators
✅ **Audit trail** - complete record of who deleted what and when
✅ **Reversible** - easy to implement undelete in future
✅ **Flexible** - admins can hard delete if needed

**Migration Required:** Yes - run `migrations/add-soft-delete-to-bookings.sql`

The booking system now maintains complete records while providing a clean user experience!


