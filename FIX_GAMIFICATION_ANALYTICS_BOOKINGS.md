# Fix for Gamification, Analytics, and Bookings Issues

## Summary of Issues

1. **Gamification XP not updating** on https://sim.bleepy.co.uk/dashboard/gamification
2. **Analytics not registering all logged-in user entries**
3. **Booking event cards** need to show "Attended" and "No Show" counts

## Issue 3: Booking Event Cards ✅ FIXED

### What Was Done
Added "Attended" and "No Show" badges to the booking event cards on `/bookings` page.

**File Changed**: `app/bookings/page.tsx`

The badges now show:
- **Confirmed** (green) - Always shown
- **Attended** (emerald) - Shown when > 0
- **No Show** (orange) - Shown when > 0  
- **Waitlist** (yellow) - Shown when > 0
- **Cancelled** (red) - Always shown
- **Capacity** (blue) - Shown when capacity is set

---

## Issue 1: Gamification XP Not Updating

### Root Cause Analysis

The gamification system has TWO implementations in the code:

1. **Old Implementation** (in `lib/gamification.ts`):
   - Uses functions: `awardScenarioXP()`, `awardXP()`, `updateDailyStreak()`
   - These functions are IMPORTED but NOT CALLED in the attempts API

2. **New Implementation** (in `app/api/attempts/route.ts`):
   - Directly calls Supabase RPC functions: `award_xp()` and `update_gamification_on_attempt_completion()`
   - These are the functions actually being called when scenarios complete

### The Problem

The code is calling the database functions `award_xp()` and `update_gamification_on_attempt_completion()`, but these functions might:
1. Not exist in the database
2. Not be working correctly
3. Have permission issues

### Diagnostic Steps

Run this SQL in your Supabase SQL Editor to check if the functions exist:

```sql
-- Check if gamification functions exist
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc 
WHERE proname IN ('award_xp', 'update_gamification_on_attempt_completion')
ORDER BY proname;

-- Check if gamification tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'user_levels',
    'xp_transactions',
    'achievements',
    'user_achievements',
    'user_streaks'
  )
ORDER BY table_name;

-- Check recent XP transactions
SELECT * FROM xp_transactions 
ORDER BY created_at DESC 
LIMIT 10;

-- Check user levels
SELECT * FROM user_levels 
ORDER BY updated_at DESC 
LIMIT 10;
```

### Solution Options

#### Option A: Fix the Database Functions (Recommended)

If the functions don't exist or aren't working, you need to apply the gamification schema:

1. Run the gamification setup script: `migrations/complete-gamification-setup-final.sql`
2. Or run: `create-gamification-schema-safe.sql`

#### Option B: Use the Lib Functions Instead

Update `app/api/attempts/route.ts` to use the imported functions:

```typescript
// Replace lines 191-216 with:
console.log('🏆 Awarding XP using lib function')
await awardScenarioXP(
  attemptData.user_id,
  attemptData.station_slug,
  score,
  scenarioDuration,
  false // isFirstAttempt
)
console.log('✅ XP awarded successfully!')

// Update daily streak
console.log('📅 Updating daily streak...')
await updateDailyStreak(attemptData.user_id)
console.log('✅ Daily streak updated!')
```

---

## Issue 2: Analytics Not Registering All Logged-In User Entries

### Root Cause

The analytics system tracks attempts in the `attempts` table, but there might be:
1. Users not being created in the database when they log in
2. Attempts not being saved correctly
3. RLS policies blocking data access

### Diagnostic Steps

```sql
-- Check if users are being created
SELECT 
  u.email,
  u.name,
  u.created_at,
  COUNT(a.id) as attempt_count,
  MAX(a.start_time) as last_attempt
FROM users u
LEFT JOIN attempts a ON u.id = a.user_id
GROUP BY u.id, u.email, u.name, u.created_at
ORDER BY u.created_at DESC
LIMIT 20;

-- Check recent attempts
SELECT 
  a.id,
  a.user_id,
  u.email,
  a.station_slug,
  a.start_time,
  a.end_time,
  a.overall_band,
  a.created_at
FROM attempts a
JOIN users u ON a.user_id = u.id
ORDER BY a.created_at DESC
LIMIT 20;

-- Check for orphaned attempts (attempts without users)
SELECT 
  a.*
FROM attempts a
LEFT JOIN users u ON a.user_id = u.id
WHERE u.id IS NULL
LIMIT 10;
```

### Solution

#### Step 1: Ensure User Creation on Login

The user creation is handled in `app/api/attempts/route.ts` POST handler. This should work, but verify:

```typescript
// Lines 23-50 in app/api/attempts/route.ts
// This creates users if they don't exist
```

#### Step 2: Check RLS Policies

Run this SQL to verify RLS isn't blocking inserts:

```sql
-- Check RLS status on attempts table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'attempts';

-- Check RLS policies on attempts
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check
FROM pg_policies 
WHERE tablename = 'attempts';
```

If RLS is causing issues, you might need to adjust policies:

```sql
-- Allow service role to bypass RLS
ALTER TABLE attempts DISABLE ROW LEVEL SECURITY;

-- Or add a permissive policy for inserts
CREATE POLICY "Allow authenticated users to create attempts"
ON attempts
FOR INSERT
TO authenticated
WITH CHECK (true);
```

#### Step 3: Add Logging

Update the attempts API to log more details:

```typescript
// In app/api/attempts/route.ts POST handler, add after line 60:
console.log('✅ Attempt created successfully:', {
  attemptId: attempt.id,
  userId: userId,
  userEmail: session.user.email,
  stationSlug: stationSlug,
  startTime: startTime
});
```

---

## Testing the Fixes

### Test Gamification
1. Complete a scenario on https://sim.bleepy.co.uk
2. Check browser console for logs:
   - Look for "🎮 Starting gamification rewards process..."
   - Look for "✅ XP awarded successfully!"
   - Look for any "❌ Error" messages
3. Go to https://sim.bleepy.co.uk/dashboard/gamification
4. Verify XP and level updated

### Test Analytics
1. Log in and complete a scenario
2. Go to admin analytics (if you have access)
3. Check if the attempt appears in recent attempts
4. Check if user appears in user list

### Test Bookings
1. Go to https://sim.bleepy.co.uk/bookings
2. Find an event with bookings
3. Verify you see:
   - Confirmed count
   - Attended count (if > 0)
   - No Show count (if > 0)
   - Cancelled count
   - Capacity (if set)

---

## Quick Fix Commands

### To Deploy the Booking Fix
```bash
git add app/bookings/page.tsx
git commit -m "Add attended and no-show counts to booking event cards"
git push origin main
```

### To Check Gamification in Production
1. Open browser console on https://sim.bleepy.co.uk
2. Complete a scenario
3. Watch for console logs with 🎮 emoji
4. Take a screenshot of any errors and share them

---

## Need Help?

If you see specific errors in the console or database, share them and I can provide more targeted fixes.

The most likely issues are:
1. **Gamification**: Missing database functions - need to run migration script
2. **Analytics**: RLS blocking data - need to adjust policies
3. **Bookings**: ✅ Already fixed - just needs deployment






