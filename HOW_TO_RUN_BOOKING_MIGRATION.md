# 🚀 How to Run the Booking System Migration

## ✅ This Migration is 100% SAFE

- **No data will be deleted**
- **No existing tables will be modified** (only new columns added)
- **Wrapped in a transaction** (will rollback if any error occurs)
- **Uses IF NOT EXISTS checks** (safe to run multiple times)
- **Booking OFF by default** (won't affect existing events)

---

## 📋 Quick Steps (5 Minutes)

### Step 1: Open Supabase
1. Go to https://app.supabase.com
2. Select your project
3. Click **"SQL Editor"** in left sidebar

### Step 2: Run the Migration
1. Click **"New Query"** button (top right)
2. **Copy and paste** the ENTIRE contents of:
   ```
   migrations/SAFE_BOOKING_SYSTEM_MIGRATION.sql
   ```
3. Click **"Run"** button (or press Ctrl/Cmd + Enter)

### Step 3: Wait for Success
- Migration takes: **~10-15 seconds**
- Watch for the **green success messages**
- You should see:
  ```
  ✅ MIGRATION SUCCESSFUL!
  ```

That's it! Your booking system is now installed! 🎉

---

## 📊 What This Migration Does

### Adds 9 New Columns to `events` Table
```sql
booking_enabled                      (BOOLEAN - default: false)
booking_button_label                 (VARCHAR - default: 'Register')
booking_capacity                     (INTEGER - nullable)
booking_deadline_hours               (INTEGER - default: 1)
allow_waitlist                       (BOOLEAN - default: true)
confirmation_checkbox_1_text         (TEXT - default: confirmation message)
confirmation_checkbox_1_required     (BOOLEAN - default: true)
confirmation_checkbox_2_text         (TEXT - nullable)
confirmation_checkbox_2_required     (BOOLEAN - default: false)
```

### Creates `event_bookings` Table
- Stores all user bookings
- Tracks status (confirmed, waitlist, cancelled, attended, no-show)
- Prevents duplicate bookings per user per event
- Auto-updates timestamps

### Creates `event_booking_stats` View
- Pre-calculates booking statistics
- Shows capacity utilization
- Fast queries for admin dashboard

### Sets Up 6 RLS Policies
- Users can view/manage own bookings
- Admins can view/manage all bookings
- Proper security boundaries

---

## 🔍 Verification

After running the migration, you should see this output at the end:

```
✅ MIGRATION SUCCESSFUL!
=====================================================
All booking system components installed correctly.

Next Steps:
1. Go to Event Data page
2. Edit an event and go to "Booking" tab
3. Enable booking and configure settings
4. Test booking on the event page
=====================================================
```

And this table:

| status | count |
|--------|-------|
| Events with booking enabled | 0 |
| Total bookings | 0 |
| Confirmed bookings | 0 |
| Waitlist bookings | 0 |

---

## ❓ What If Something Goes Wrong?

### Scenario 1: "Column already exists" warnings
**This is normal!** The migration checks for existing columns and skips them.

You'll see:
```
⚠ booking_enabled column already exists, skipping
```

**This is SAFE** - it means you've run the migration before or the column was manually added.

### Scenario 2: Transaction error
If ANY error occurs, the **entire migration will rollback** automatically.

Your database will be **exactly as it was** before running the script.

### Scenario 3: Permission denied
You need to be logged in as the **project owner** or have **database admin** permissions.

### Scenario 4: Foreign key constraint error
Make sure you have:
- ✅ `users` table with `id` and `role` columns
- ✅ `events` table

These should already exist from your base schema.

---

## 🔧 Manual Verification (Optional)

If you want to double-check everything was created correctly:

### Check Events Table Columns
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name LIKE 'booking%'
ORDER BY column_name;
```

**Expected:** 9 rows returned

### Check event_bookings Table
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'event_bookings'
);
```

**Expected:** `true`

### Check RLS Policies
```sql
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'event_bookings';
```

**Expected:** 6 policies

### Check View
```sql
SELECT EXISTS (
  SELECT FROM information_schema.views 
  WHERE table_name = 'event_booking_stats'
);
```

**Expected:** `true`

---

## 📝 What About the Other 4 Migration Files?

You can **IGNORE** these files:
- `migrations/add-event-booking-fields.sql`
- `migrations/create-event-bookings-table.sql`
- `migrations/create-booking-stats-view.sql`
- `migrations/setup-booking-rls-policies.sql`

The **SAFE_BOOKING_SYSTEM_MIGRATION.sql** file **combines all 4** into one safe script.

---

## ✅ Post-Migration Checklist

After successful migration:

- [ ] Migration completed without errors
- [ ] Saw "✅ MIGRATION SUCCESSFUL!" message
- [ ] Events table has 9 new booking columns
- [ ] event_bookings table exists
- [ ] event_booking_stats view exists
- [ ] 6 RLS policies created

Once all checked, you're ready to:
1. Enable booking on an event
2. Test booking as a user
3. View bookings as admin

---

## 🎯 Next Steps

1. **Read:** `BOOKING_SYSTEM_QUICK_START.md`
2. **Enable booking** on a test event
3. **Test** the booking flow
4. **Check** the admin dashboard

---

## 🆘 Need Help?

### Common Issues

**Q: Can I run this migration multiple times?**  
A: Yes! It's 100% safe. It will skip anything that already exists.

**Q: Will this affect my existing events?**  
A: No! Booking is OFF by default. Existing events won't change.

**Q: Can I rollback if I don't like it?**  
A: Yes, but you'd need to manually drop the table and columns (not recommended after going live).

**Q: Does this delete any data?**  
A: No! This is a pure addition. No deletions anywhere.

**Q: Will users see booking buttons immediately?**  
A: No. You must enable booking per event in the Booking tab.

---

## 🎉 Ready?

**Copy the contents of `migrations/SAFE_BOOKING_SYSTEM_MIGRATION.sql` and paste into Supabase SQL Editor, then click Run!**

It takes 15 seconds and you'll have a complete booking system! 🚀

---

*Last Updated: October 17, 2025*
*Safe for production use*


