# 🔍 Root Cause Analysis: RLS Policy Failures

## 📊 The Problem

You're getting `new row violates row-level security policy` errors when creating events, organizers, locations, etc.

## 🎯 Root Cause Identified

### **The Architecture Mismatch**

Your application uses **NextAuth** for authentication, NOT Supabase Auth. This creates a fundamental problem:

1. **Browser Client (`lib/events-api.ts`)**:
   - Uses `createClient()` from `utils/supabase/client.ts`
   - This creates a Supabase client with the **ANON KEY**
   - The client has NO authentication context from NextAuth
   - When it makes INSERT/UPDATE/DELETE calls, Supabase sees it as an **unauthenticated request**

2. **RLS Policies Check**:
   ```sql
   EXISTS (
     SELECT 1 FROM public.users
     WHERE users.email = auth.jwt() ->> 'email'
     AND users.role IN ('admin', 'educator', 'meded_team', 'ctf')
   )
   ```
   - `auth.jwt()` looks for a **Supabase JWT token**
   - But you're using **NextAuth JWT tokens**, not Supabase tokens
   - `auth.jwt()` returns **NULL** because there's no Supabase session
   - The policy condition fails → RLS blocks the operation

3. **Why Service Role Policies Work**:
   - `auth.role() = 'service_role'` checks the **Supabase client's role**
   - When you use `SUPABASE_SERVICE_ROLE_KEY`, the client has `service_role`
   - This bypasses RLS completely

## 🔧 The Solution

### **Option 1: Move Event Management to API Routes (RECOMMENDED)**

This is the **correct architectural approach** and aligns with your existing patterns:

**Why this is better:**
- ✅ Consistent with your authentication architecture (NextAuth)
- ✅ Proper authorization checks in API layer
- ✅ Service role key stays secure on server
- ✅ No RLS policy complexity for client-side operations
- ✅ Better security and control

**Implementation:**
1. Create API routes for event management operations
2. Use service role key on server-side
3. Check user role/permissions in API route
4. Update `lib/events-api.ts` to call API routes instead of direct Supabase calls

### **Option 2: Disable RLS on Event Management Tables (NOT RECOMMENDED)**

This would work but is **not secure** for production:

**Why this is problematic:**
- ❌ No database-level security
- ❌ Relies entirely on application-level security
- ❌ Violates security best practices
- ❌ Supabase security advisor will flag it

## 📋 Detailed Implementation Plan

### **Step 1: Create API Routes for Event Operations**

Create the following API routes:
- `app/api/events/categories/route.ts` - POST/PUT/DELETE for categories
- `app/api/events/formats/route.ts` - POST/PUT/DELETE for formats
- `app/api/events/speakers/route.ts` - POST/PUT/DELETE for speakers
- `app/api/events/locations/route.ts` - POST/PUT/DELETE for locations
- `app/api/events/organizers/route.ts` - POST/PUT/DELETE for organizers
- `app/api/events/create/route.ts` - POST for creating events
- `app/api/events/[id]/route.ts` - PUT/DELETE for updating/deleting events

Each route should:
1. Get NextAuth session
2. Check user role (admin, educator, meded_team, ctf)
3. Use service role Supabase client
4. Perform database operation
5. Return result

### **Step 2: Update `lib/events-api.ts`**

Change from direct Supabase calls to API route calls:

```typescript
// OLD (direct Supabase call)
export async function createCategory(category: {...}) {
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// NEW (API route call)
export async function createCategory(category: {...}) {
  const response = await fetch('/api/events/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create category');
  }
  
  return await response.json();
}
```

### **Step 3: Keep RLS Policies for Service Role**

The RLS policies we created are still useful:
- They ensure only service role can access these tables
- They provide defense-in-depth security
- They satisfy Supabase security advisor

### **Step 4: Remove Authenticated User Policies**

Since client-side operations won't work with NextAuth, remove the authenticated user policies:

```sql
-- Drop all "Authenticated users" policies
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can update events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can delete events" ON public.events;
-- ... repeat for all tables
```

## 🎯 Why This is the Right Approach

1. **Architectural Consistency**: Your app uses NextAuth, not Supabase Auth. The API route approach works with NextAuth.

2. **Security**: Authorization logic is in your API routes where you control it, not in database policies that don't have access to NextAuth sessions.

3. **Maintainability**: All event management logic is in API routes, making it easier to add features, logging, validation, etc.

4. **Performance**: No difference in performance - API routes are fast and can be optimized.

5. **Best Practice**: This is how Next.js + NextAuth + Supabase should be architected.

## 📝 Summary

**The problem**: RLS policies check for Supabase JWT tokens, but your app uses NextAuth JWT tokens.

**The solution**: Move event management operations to API routes that:
- Use NextAuth for authentication
- Check user roles in the API layer
- Use service role key for database operations
- Keep RLS enabled with service role policies only

**Next steps**: Implement the API routes and update `lib/events-api.ts` to use them.

















