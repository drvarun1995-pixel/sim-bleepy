# Environment Variables Cleanup

## Remove These Google OAuth Variables

Remove or comment out these variables from your `.env.local` file:

```bash
# Remove these Google OAuth variables
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Keep These Variables

Make sure you have these essential variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
```

## Database Reset Instructions

1. **Run the SQL script** in your Supabase SQL editor:
   - Copy the contents of `clear-database.sql`
   - Paste into Supabase SQL editor
   - Execute the script

2. **Verify tables are empty**:
   - Check the `users` table
   - Check the `email_verification_tokens` table
   - Check any other user-related tables

## What Was Removed

✅ **Google OAuth Provider** - Removed from NextAuth configuration
✅ **Google Sign-in Button** - Removed from sign-in page
✅ **Google OAuth Callbacks** - Removed from auth configuration
✅ **Social Sign-in Function** - Removed unused function
✅ **Database Cleanup Script** - Created to clear all user data

## Next Steps

1. **Clear your database** using the provided SQL script
2. **Remove Google OAuth environment variables**
3. **Test the application** with email/password authentication only
4. **Deploy changes** to production

## Testing

After cleanup, test:
- ✅ User registration with email/password
- ✅ Email verification flow
- ✅ User login with email/password
- ✅ Password reset functionality
- ❌ Google sign-in should no longer be available
