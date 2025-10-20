# 🚀 Implementation Plan: Fix Event Management with API Routes

## 📋 Overview

This plan will fix the RLS policy errors by moving all event management operations from client-side Supabase calls to server-side API routes.

## 🎯 What We're Fixing

**Current Problem:**
- `lib/events-api.ts` makes direct Supabase calls from the browser
- These calls use the ANON key and have no NextAuth authentication context
- RLS policies check for Supabase JWT tokens (which don't exist)
- All INSERT/UPDATE/DELETE operations fail with RLS errors

**Solution:**
- Create API routes for all event management operations
- API routes use NextAuth for authentication
- API routes use service role key for database access
- Update `lib/events-api.ts` to call API routes instead of direct Supabase

## 📝 Implementation Steps

### Step 1: Create API Routes for Categories

**File:** `app/api/events/categories/route.ts`

Operations:
- POST - Create category
- PUT - Update category (with ID in body)
- DELETE - Delete category (with ID in query param)

### Step 2: Create API Routes for Formats

**File:** `app/api/events/formats/route.ts`

Operations:
- POST - Create format
- PUT - Update format (with ID in body)
- DELETE - Delete format (with ID in query param)

### Step 3: Create API Routes for Speakers

**File:** `app/api/events/speakers/route.ts`

Operations:
- POST - Create speaker
- DELETE - Delete speaker (with ID in query param)

### Step 4: Create API Routes for Locations

**File:** `app/api/events/locations/route.ts`

Operations:
- POST - Create location
- PUT - Update location (with ID in body)
- DELETE - Delete location (with ID in query param)

### Step 5: Create API Routes for Organizers

**File:** `app/api/events/organizers/route.ts`

Operations:
- POST - Create organizer
- DELETE - Delete organizer (with ID in query param)

### Step 6: Update Event Creation/Update Routes

**File:** `app/api/events/create/route.ts` (new)
**File:** `app/api/events/[id]/route.ts` (update existing)

Operations:
- POST `/api/events/create` - Create event with all relations
- PUT `/api/events/[id]` - Update event with all relations
- DELETE `/api/events/[id]` - Delete event

### Step 7: Update `lib/events-api.ts`

Change all functions to call API routes instead of direct Supabase calls.

### Step 8: Clean Up RLS Policies

Remove the "Authenticated users" policies since they won't work with NextAuth.
Keep only the "Service role" policies.

## 🔧 Implementation Details

### API Route Template

Each API route should follow this pattern:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 2. Check user role
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();
    
    if (!user || !['admin', 'educator', 'meded_team', 'ctf'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // 3. Get request data
    const data = await request.json();
    
    // 4. Perform database operation using service role
    const { data: result, error } = await supabaseAdmin
      .from('table_name')
      .insert([data])
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // 5. Return result
    return NextResponse.json(result);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Client Function Template

Each function in `lib/events-api.ts` should be updated to:

```typescript
export async function createCategory(category: {...}) {
  const response = await fetch('/api/events/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create category');
  }
  
  return await response.json();
}
```

## ✅ Benefits of This Approach

1. **Works with NextAuth**: API routes have access to NextAuth sessions
2. **Secure**: Service role key stays on server, never exposed to client
3. **Consistent**: Matches your existing architecture (see `/api/events/route.ts`)
4. **Maintainable**: All business logic in one place (API routes)
5. **Flexible**: Easy to add validation, logging, webhooks, etc.
6. **RLS Compatible**: Service role bypasses RLS, which is what you want

## 🎯 Expected Outcome

After implementation:
- ✅ Event creation works
- ✅ Organizer creation works
- ✅ Location creation works
- ✅ Speaker creation works
- ✅ Category creation works
- ✅ Format creation works
- ✅ All updates and deletes work
- ✅ RLS policies remain enabled (for security compliance)
- ✅ No more RLS policy errors

## 📊 Progress Tracking

- [ ] Create categories API route
- [ ] Create formats API route
- [ ] Create speakers API route
- [ ] Create locations API route
- [ ] Create organizers API route
- [ ] Create events creation API route
- [ ] Update events [id] API route
- [ ] Update lib/events-api.ts
- [ ] Clean up RLS policies
- [ ] Test all operations
- [ ] Deploy and verify

## 🚀 Ready to Implement?

Let me know if you want me to proceed with creating all the API routes and updating the client library!

















