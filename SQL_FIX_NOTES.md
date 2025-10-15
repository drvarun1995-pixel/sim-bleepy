# 🔧 SQL Error Fix

## Issue
Error when running `migrations/comprehensive-rls-all-roles.sql`:
```
ERROR: 42703: record "r" has no field "tablename"
```

## Root Cause
In the DO block for dropping attempt policies, the code was trying to use `r.tablename` but only selecting `policyname` from the query.

## Fix Applied

**Before (BROKEN):**
```sql
FOR r IN (
  SELECT policyname  -- Only selecting policyname
  FROM pg_policies
  WHERE tablename IN ('attempts', 'attempt_events')
) LOOP
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  -- Trying to use r.tablename but it wasn't selected! ❌
END LOOP;
```

**After (FIXED):**
```sql
FOR r IN (
  SELECT tablename, policyname  -- Now selecting BOTH
  FROM pg_policies
  WHERE tablename IN ('attempts', 'attempt_events')
) LOOP
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  -- Now r.tablename exists! ✅
END LOOP;
```

## Status
✅ **FIXED** - The SQL file should now run without errors

## What to Do
Simply run the SQL file again in Supabase SQL Editor. It should work now!

---

**Date:** October 14, 2025  
**Fixed in:** `migrations/comprehensive-rls-all-roles.sql` (line 496)










