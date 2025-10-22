# 🔧 Fix: Gamification Leaderboard & AI Simulator Auto-Start

## 🎯 Issues Identified

### **Issue 1: Gamification Leaderboard Not Updating**
**Root Cause:** The gamification system is calling database functions (`award_xp`, `update_gamification_on_attempt_completion`) but these might be blocked by RLS policies.

**Location:** `app/api/attempts/route.ts` lines 191-216

### **Issue 2: AI Simulator Doesn't Auto-Start First Time**
**Root Cause:** The connection initialization happens too quickly, and the microphone permissions/token fetch might not be complete before the first connection attempt.

**Location:** `components/OptimizedStationStartCall.tsx` line 144-146

---

## ✅ Solution 1: Fix Gamification RLS

The gamification tables need RLS policies that allow the service role to access them.

### **SQL Script to Run:**

```sql
-- Enable RLS on gamification tables (if not already enabled)
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

-- Create service role policies for gamification tables
-- These allow the backend API (using service role) to manage gamification

-- user_levels
DROP POLICY IF EXISTS "Service role full access" ON public.user_levels;
CREATE POLICY "Service role full access"
  ON public.user_levels FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- xp_transactions
DROP POLICY IF EXISTS "Service role full access" ON public.xp_transactions;
CREATE POLICY "Service role full access"
  ON public.xp_transactions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- achievements
DROP POLICY IF EXISTS "Service role full access" ON public.achievements;
CREATE POLICY "Service role full access"
  ON public.achievements FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- user_achievements
DROP POLICY IF EXISTS "Service role full access" ON public.user_achievements;
CREATE POLICY "Service role full access"
  ON public.user_achievements FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- user_streaks
DROP POLICY IF EXISTS "Service role full access" ON public.user_streaks;
CREATE POLICY "Service role full access"
  ON public.user_streaks FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- skills
DROP POLICY IF EXISTS "Service role full access" ON public.skills;
CREATE POLICY "Service role full access"
  ON public.skills FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- user_skills
DROP POLICY IF EXISTS "Service role full access" ON public.user_skills;
CREATE POLICY "Service role full access"
  ON public.user_skills FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Verify policies were created
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'user_levels', 'xp_transactions', 'achievements', 
    'user_achievements', 'user_streaks', 'skills', 'user_skills'
  )
ORDER BY tablename, policyname;
```

---

## ✅ Solution 2: Fix AI Simulator Auto-Start

The issue is that the connection happens too quickly on first load. We need to add a longer initial delay.

### **File to Update:** `components/OptimizedStationStartCall.tsx`

**Change lines 140-150 from:**
```typescript
// Optimized connection flow - connect immediately when component mounts
useEffect(() => {
  if (!hasConnected.current && !isConnecting && status.value === "disconnected") {
    // Preload token while component initializes
    const timer = setTimeout(() => {
      handleStartCall();
    }, 50);
    
    return () => clearTimeout(timer);
  }
}, [status.value, isConnecting]);
```

**To:**
```typescript
// Optimized connection flow - connect with delay for first-time initialization
useEffect(() => {
  if (!hasConnected.current && !isConnecting && status.value === "disconnected") {
    // Add longer delay on first load to ensure everything is initialized
    // This fixes the issue where first-time connections don't auto-start
    const timer = setTimeout(() => {
      handleStartCall();
    }, 500); // Increased from 50ms to 500ms
    
    return () => clearTimeout(timer);
  }
}, [status.value, isConnecting]);
```

---

## 📋 Implementation Steps

### **Step 1: Fix Gamification (Run SQL)**

1. Open **Supabase SQL Editor**
2. Copy the SQL script above
3. Paste and **Run**
4. Verify that policies were created (should see 7 tables with policies)

### **Step 2: Fix AI Simulator (Code Change)**

The code change is already prepared. I'll update the file now.

### **Step 3: Test Both Fixes**

**Test Gamification:**
1. Complete a station scenario
2. Check the leaderboard
3. Your XP should update ✅

**Test AI Simulator:**
1. Navigate to a station for the first time
2. The AI patient should start talking automatically ✅
3. Try again with a different station to confirm ✅

---

## 🎯 Why These Fixes Work

### **Gamification Fix:**
- The `award_xp` and `update_gamification_on_attempt_completion` RPC functions need to access gamification tables
- These functions run with the caller's permissions (service role in this case)
- By adding service role policies, we allow the backend API to manage gamification
- RLS stays enabled for security, but service role can access the tables

### **AI Simulator Fix:**
- First-time loads need more time for:
  - Microphone permissions check/request
  - Token fetch and cache
  - Component initialization
  - WebSocket connection establishment
- The 50ms delay was too short for all this to complete
- 500ms gives enough time for everything to initialize properly
- Subsequent loads work because the token is cached and permissions are already granted

---

## 🔒 Security Note

Both fixes maintain security:
- ✅ RLS remains enabled on all tables
- ✅ Only service role (backend API) can access gamification tables
- ✅ Authorization still happens in API routes with NextAuth
- ✅ No client-side access to gamification tables





























