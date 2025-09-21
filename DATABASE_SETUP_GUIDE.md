# Database Setup Guide

This guide will help you set up the database for the Sim-Bleepy Analytics Dashboard.

## Quick Setup

### 1. Run the Database Setup Script

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `simple_database_setup.sql`
4. Click "Run" to execute the script

This will create all necessary tables, indexes, RLS policies, and sample data.

### 2. Set Up Environment Variables

Make sure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 3. Set Up Admin User

Run the admin user setup script:

```bash
npx tsx scripts/setup-admin-user.ts
```

This will create an admin user with email `admin@simbleepy.com`.

To set a different user as admin:

```bash
npx tsx scripts/setup-admin-user.ts your-email@example.com
```

### 4. Test the Dashboard

1. Start your development server: `pnpm dev`
2. Go to `http://localhost:3000/dashboard`
3. You should be redirected based on your role:
   - **Admin users**: Redirected to `/dashboard/admin`
   - **Non-admin users**: Redirected to `/dashboard/stations`

## User Roles

The system supports three user roles:

- **student**: Can view stations and start sessions
- **educator**: Can view cohort data and manage assignments
- **admin**: Full access to all analytics and system management

## Database Schema

The database includes the following main tables:

- `profiles`: User information and roles
- `stations`: Available simulation stations
- `sessions`: User simulation sessions
- `scores`: Session scoring data
- `transcripts`: Session transcripts
- `tech_metrics`: Performance metrics
- `cohorts`: Student groupings
- `api_usage`: AI service usage tracking

## Troubleshooting

### Error: "relation does not exist"
- Make sure you've run the complete `simple_database_setup.sql` script
- Check that all tables were created successfully

### Error: "column does not exist"
- The script includes proper table creation order
- Try running the script again from the beginning

### Dashboard shows "nothing loading"
- Check your environment variables
- Make sure Supabase is properly configured
- Verify the admin user was created successfully

### Role detection not working
- Check that the `profiles` table has your user record
- Verify the `role` column contains 'admin', 'educator', or 'student'
- Run the admin setup script if needed

## Next Steps

Once the database is set up:

1. **For Admins**: You'll see the full analytics dashboard with system metrics
2. **For Students**: You'll see the stations page to select and start simulations
3. **For Educators**: You'll see cohort management and student analytics

The system gracefully handles missing database connections by showing mock data during development.
