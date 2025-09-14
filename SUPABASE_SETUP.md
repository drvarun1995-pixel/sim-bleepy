# Supabase Database Setup

This document explains how to set up the Supabase database and admin dashboard for the Bleepy Simulator project.

## 1. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Admin Configuration
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com,admin2@example.com

# Hume EVI Configuration (Optional - one per station)
NEXT_PUBLIC_HUME_CONFIG_CHEST_PAIN=your_chest_pain_config_id_here
NEXT_PUBLIC_HUME_CONFIG_SHORTNESS_BREATH=your_shortness_breath_config_id_here

# MailerLite Configuration (for newsletter signups)
MAILERLITE_API_KEY=your_mailerlite_api_key_here
MAILERLITE_GROUP_ID=your_mailerlite_group_id_here

# Email Service Configuration (for email verification and password reset)
RESEND_API_KEY=your_resend_api_key_here
```

**Note**: For Google OAuth setup instructions, see the Google Cloud Console documentation.

### Hume EVI Configuration Setup

Each station can have its own Hume EVI configuration for customized patient behavior:

1. **Create Hume EVI Configs**: Go to your [Hume EVI dashboard](https://beta.hume.ai/evi) and create separate configurations for each station
2. **Configure Patient Behavior**: Set up each config with the appropriate patient personality, symptoms, and conversation flow
3. **Get Config IDs**: Copy the configuration IDs from your Hume dashboard
4. **Add to Environment**: Add each config ID to your `.env.local` file using the format above

**Note**: If no Hume config ID is provided for a station, the system will fall back to a default configuration with a custom system prompt.

### MailerLite Newsletter Setup

To enable newsletter signup functionality:

1. **Create MailerLite Account**: Sign up at [MailerLite](https://www.mailerlite.com/)
2. **Get API Key**: 
   - Go to Account → Integrations → Developers → API
   - Generate a new API key
3. **Create a Group**: 
   - Go to Audience → Groups
   - Create a new group for your newsletter subscribers
   - Copy the Group ID
4. **Add to Environment**: Add both the API key and Group ID to your `.env.local` file

**Note**: The newsletter signup forms will automatically integrate with your MailerLite list when these environment variables are configured.

### Email Service Setup (Resend)

For email verification and password reset functionality, you'll need to set up Resend:

1. **Create Resend Account**:
   - Go to [resend.com](https://resend.com)
   - Sign up for a free account
   - Verify your email address

2. **Get API Key**:
   - Go to API Keys in your Resend dashboard
   - Create a new API key
   - Copy the key and add it to your `.env.local` file

3. **Domain Setup** (Optional for production):
   - Add your domain in Resend dashboard
   - Configure DNS records for better deliverability
   - For development, you can use the default domain

**Note**: The email verification and password reset features will work automatically when the `RESEND_API_KEY` is configured.

### Database Schema for Email Authentication

Run this SQL in your Supabase SQL Editor to set up email authentication:

```sql
-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'google';

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Update existing users to have 'google' as auth_provider and verified
UPDATE users 
SET auth_provider = 'google', email_verified = true
WHERE auth_provider IS NULL;

-- Add constraint to ensure auth_provider is either 'google' or 'email'
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS check_auth_provider;
ALTER TABLE users 
ADD CONSTRAINT check_auth_provider 
CHECK (auth_provider IN ('google', 'email'));

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);

-- Create email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster token lookups
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- Enable RLS on token tables
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for token tables
CREATE POLICY "Service role can manage verification tokens" ON email_verification_tokens
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage reset tokens" ON password_reset_tokens
  FOR ALL USING (auth.role() = 'service_role');
```

### Newsletter Tracking in Supabase (Optional)

For advanced analytics and tracking of newsletter signups, you can optionally set up database tracking:

#### 1. Create Newsletter Tracking Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create newsletter_signups table
CREATE TABLE IF NOT EXISTS newsletter_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  source VARCHAR(100), -- e.g., 'homepage', 'features', 'pricing', etc.
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_newsletter_signups_email ON newsletter_signups(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_signups_created_at ON newsletter_signups(created_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_signups_source ON newsletter_signups(source);

-- Enable Row Level Security
ALTER TABLE newsletter_signups ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow admins to read all newsletter signups
CREATE POLICY "Admins can view all newsletter signups" ON newsletter_signups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.jwt() ->> 'email' 
      AND users.email = ANY(string_to_array(current_setting('app.settings.admin_emails', true), ','))
    )
  );

-- Allow anyone to insert newsletter signups (for the signup form)
CREATE POLICY "Anyone can insert newsletter signups" ON newsletter_signups
  FOR INSERT WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_newsletter_signups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_newsletter_signups_updated_at
  BEFORE UPDATE ON newsletter_signups
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletter_signups_updated_at();

-- Create view for newsletter analytics
CREATE OR REPLACE VIEW newsletter_analytics AS
SELECT 
  DATE(created_at) as signup_date,
  COUNT(*) as daily_signups,
  COUNT(DISTINCT email) as unique_emails,
  source,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as weekly_signups,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as monthly_signups
FROM newsletter_signups
GROUP BY DATE(created_at), source
ORDER BY signup_date DESC;

-- Grant access to the view for admins
GRANT SELECT ON newsletter_analytics TO authenticated;
```

#### 2. Features Enabled

With newsletter tracking enabled, you'll get:

- **Admin Dashboard Analytics**: Newsletter signup statistics in your admin panel
- **Source Tracking**: See which pages generate the most signups
- **Daily/Weekly/Monthly Stats**: Track growth over time
- **Recent Signups**: View the latest subscribers
- **User Agent & IP Tracking**: For analytics and security

#### 3. How It Works

- Newsletter signups are automatically tracked in Supabase when users subscribe
- The system tracks the source page (homepage, features, pricing, etc.)
- Admin users can view comprehensive analytics in the admin dashboard
- All tracking is optional - newsletter signups work even without Supabase tracking

## 2. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL script from `supabase-schema.sql` to create the required tables:

```sql
-- Create Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Stations table
CREATE TABLE IF NOT EXISTS stations (
  slug VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL
);

-- Create Attempts table
CREATE TABLE IF NOT EXISTS attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  station_slug VARCHAR(100) NOT NULL REFERENCES stations(slug) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- duration in seconds
  scores JSONB, -- store the scoring data as JSON
  overall_band VARCHAR(50), -- e.g., "Pass", "Fail", "Distinction"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Attempt Events table
CREATE TABLE IF NOT EXISTS attempt_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL, -- e.g., "session_start", "session_end", "message", "score_generated"
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  meta JSONB, -- additional metadata for the event
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default stations
INSERT INTO stations (slug, title) VALUES 
  ('chest-pain', 'Chest Pain'),
  ('shortness-of-breath', 'Shortness of Breath')
ON CONFLICT (slug) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_station_slug ON attempts(station_slug);
CREATE INDEX IF NOT EXISTS idx_attempts_start_time ON attempts(start_time);
CREATE INDEX IF NOT EXISTS idx_attempt_events_attempt_id ON attempt_events(attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_events_timestamp ON attempt_events(timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_events ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Create policies for stations table (public read access)
CREATE POLICY "Stations are publicly readable" ON stations
  FOR SELECT USING (true);

-- Create policies for attempts table
CREATE POLICY "Users can view their own attempts" ON attempts
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own attempts" ON attempts
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own attempts" ON attempts
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Create policies for attempt_events table
CREATE POLICY "Users can view events for their attempts" ON attempt_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM attempts 
      WHERE attempts.id = attempt_events.attempt_id 
      AND attempts.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert events for their attempts" ON attempt_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM attempts 
      WHERE attempts.id = attempt_events.attempt_id 
      AND attempts.user_id::text = auth.uid()::text
    )
  );
```

## 3. Admin Dashboard Access

The admin dashboard is accessible at `/admin` and is protected by email-based access control.

### Making a User an Admin

To make a user an admin:

1. Add their email address to the `NEXT_PUBLIC_ADMIN_EMAILS` environment variable
2. Separate multiple admin emails with commas: `admin1@example.com,admin2@example.com`
3. Restart your development server after updating the environment variable

### Admin Dashboard Features

The admin dashboard provides:

- **Daily Usage Chart**: Shows usage statistics per station over the last 30 days
- **Recent Attempts Table**: Displays recent consultation attempts with:
  - Time of attempt
  - Station name
  - User information (name and email)
  - Duration
  - Overall band (Pass/Fail/Distinction)

## 4. Database Schema

### Tables

1. **users**: Stores user information
   - `id`: UUID primary key
   - `email`: User's email address (unique)
   - `name`: User's display name
   - `created_at`: Account creation timestamp

2. **stations**: Stores available clinical stations
   - `slug`: Station identifier (e.g., 'chest-pain')
   - `title`: Station display name

3. **attempts**: Stores consultation attempts
   - `id`: UUID primary key
   - `user_id`: Reference to users table
   - `station_slug`: Reference to stations table
   - `start_time`: When the consultation started
   - `end_time`: When the consultation ended
   - `duration`: Duration in seconds
   - `scores`: JSON object containing scoring data
   - `overall_band`: Overall result (Pass/Fail/Distinction)

4. **attempt_events**: Stores events during consultations
   - `id`: UUID primary key
   - `attempt_id`: Reference to attempts table
   - `type`: Event type (session_start, session_end, etc.)
   - `timestamp`: When the event occurred
   - `meta`: Additional event metadata as JSON

## 5. API Endpoints

### Analytics APIs

- `GET /api/analytics/daily-usage?days=30&station=chest-pain`: Get daily usage statistics
- `GET /api/analytics/recent-attempts?limit=50`: Get recent consultation attempts

### Attempt Management

- `POST /api/attempts`: Create a new consultation attempt
- `PUT /api/attempts`: Update an existing attempt with completion data

## 6. Security

- Row Level Security (RLS) is enabled on all tables
- Users can only access their own data
- Admin access is controlled by email whitelist
- Service role key is used for server-side operations

## 7. Development

After setting up the database:

1. Install dependencies: `pnpm install`
2. Start the development server: `pnpm dev`
3. Access the admin dashboard at `http://localhost:3000/admin`

The system will automatically:
- Create users when they first sign in
- Track consultation attempts
- Store scoring data
- Provide analytics for admins
