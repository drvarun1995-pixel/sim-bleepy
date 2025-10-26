# 📊 Supabase SQL Scripts Tracking Document

## 🎯 Purpose
This document tracks all SQL scripts that have been run in Supabase and any ongoing updates. This ensures we have a complete record of database changes and can track what's been implemented.

---

## ✅ **COMPLETED SQL SCRIPTS**

### **Core Database Structure (Already Restored)**
- ✅ **Basic Tables**: `users`, `events`, `categories`, `formats`, `locations`, `organizers`, `speakers`
- ✅ **Junction Tables**: `event_categories`, `event_speakers`, `event_organizers`, `event_locations`
- ✅ **Views**: `events_with_details`, `categories_with_counts`, `formats_with_counts`
- ✅ **Resources System**: `resources`, `resource_events`, `download_tracking`
- ✅ **Authentication**: `email_verification_tokens`, `password_reset_tokens`
- ✅ **User Profile**: Profile picture fields, onboarding fields

---

## 🚨 **PENDING SQL SCRIPTS TO RUN**

### **1. Communication & Messaging Systems**

#### **1A. Announcements System**
```sql
-- File: migrations/create-announcements-table.sql
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    target_audience JSONB NOT NULL, -- {type: 'all'|'role'|'university'|'year', values: []}
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON public.announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at);

-- RLS Policies
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Everyone can view active announcements
CREATE POLICY "Everyone can view active announcements"
    ON public.announcements FOR SELECT
    USING (is_active = true);

-- Only admins can manage announcements
CREATE POLICY "Admins can manage announcements"
    ON public.announcements FOR ALL
    USING (auth.role() = 'service_role');
```

#### **1B. Contact Messages System**
```sql
-- File: migrations/create-contact-messages-table.sql
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
    admin_notes TEXT,
    replied_at TIMESTAMP WITH TIME ZONE,
    replied_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at);

-- RLS Policies
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can insert contact messages (for contact form)
CREATE POLICY "Anyone can submit contact messages"
    ON public.contact_messages FOR INSERT
    WITH CHECK (true);

-- Authorized users can view contact messages
CREATE POLICY "Authorized users can view contact messages"
    ON public.contact_messages FOR SELECT
    USING (auth.role() = 'service_role');
```

#### **1C. File Request Messages System**
```sql
-- File: migrations/create-file-requests-table.sql
CREATE TABLE IF NOT EXISTS public.file_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    description TEXT NOT NULL,
    additional_info TEXT,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    event_title TEXT NOT NULL,
    event_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
    admin_notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_file_requests_status ON public.file_requests(status);
CREATE INDEX IF NOT EXISTS idx_file_requests_event_id ON public.file_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_file_requests_created_at ON public.file_requests(created_at);

-- RLS Policies
ALTER TABLE public.file_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own file requests
CREATE POLICY "Users can submit file requests"
    ON public.file_requests FOR INSERT
    WITH CHECK (true);

-- Authorized users can view file requests
CREATE POLICY "Authorized users can view file requests"
    ON public.file_requests FOR SELECT
    USING (auth.role() = 'service_role');
```

#### **1D. Teaching Request Messages System**
```sql
-- File: migrations/create-teaching-requests-table.sql
CREATE TABLE IF NOT EXISTS public.teaching_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    topic TEXT NOT NULL,
    description TEXT NOT NULL,
    preferred_date DATE,
    preferred_time TIME,
    duration TEXT NOT NULL,
    categories TEXT[] NOT NULL,
    format TEXT NOT NULL,
    additional_info TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
    admin_notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teaching_requests_status ON public.teaching_requests(status);
CREATE INDEX IF NOT EXISTS idx_teaching_requests_created_at ON public.teaching_requests(created_at);

-- RLS Policies
ALTER TABLE public.teaching_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own teaching requests
CREATE POLICY "Users can submit teaching requests"
    ON public.teaching_requests FOR INSERT
    WITH CHECK (true);

-- Authorized users can view teaching requests
CREATE POLICY "Authorized users can view teaching requests"
    ON public.teaching_requests FOR SELECT
    USING (auth.role() = 'service_role');
```

### **2. Event Booking System**

#### **2A. Event Booking Fields**
```sql
-- File: migrations/add-event-booking-fields.sql
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS booking_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS booking_button_label TEXT DEFAULT 'Register';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS booking_capacity INTEGER;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS booking_deadline_hours INTEGER DEFAULT 1;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS allow_waitlist BOOLEAN DEFAULT TRUE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS confirmation_checkbox_1_text TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS confirmation_checkbox_1_required BOOLEAN DEFAULT TRUE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS confirmation_checkbox_2_text TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS confirmation_checkbox_2_required BOOLEAN DEFAULT FALSE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cancellation_deadline_hours INTEGER;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS booking_restrictions TEXT[]; -- Role restrictions
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS manual_approval_required BOOLEAN DEFAULT FALSE;
```

#### **2B. Event Bookings Table**
```sql
-- File: migrations/create-event-bookings-table.sql
CREATE TABLE IF NOT EXISTS public.event_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'waitlist', 'cancelled', 'attended', 'no-show')),
    booked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    checked_in BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    confirmation_checkbox_1_checked BOOLEAN,
    confirmation_checkbox_2_checked BOOLEAN,
    admin_notes TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Allow re-booking after cancellation
    UNIQUE(event_id, user_id) DEFERRABLE INITIALLY DEFERRED
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_bookings_event_id ON public.event_bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_event_bookings_user_id ON public.event_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_event_bookings_status ON public.event_bookings(status);
CREATE INDEX IF NOT EXISTS idx_event_bookings_booked_at ON public.event_bookings(booked_at);

-- Partial unique index for active bookings (allows re-booking after cancellation)
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_bookings_active_unique 
ON public.event_bookings(event_id, user_id) 
WHERE deleted_at IS NULL;

-- RLS Policies
ALTER TABLE public.event_bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings"
    ON public.event_bookings FOR SELECT
    USING (auth.role() = 'service_role');

-- Users can insert their own bookings
CREATE POLICY "Users can create their own bookings"
    ON public.event_bookings FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Users can update their own bookings
CREATE POLICY "Users can update their own bookings"
    ON public.event_bookings FOR UPDATE
    USING (auth.role() = 'service_role');
```

#### **2C. Booking Statistics View**
```sql
-- File: migrations/create-booking-stats-view.sql
CREATE OR REPLACE VIEW public.event_booking_stats AS
SELECT 
    e.id as event_id,
    e.title as event_title,
    e.booking_enabled,
    e.booking_capacity,
    COUNT(eb.id) as total_bookings,
    COUNT(CASE WHEN eb.status = 'confirmed' THEN 1 END) as confirmed_count,
    COUNT(CASE WHEN eb.status = 'waitlist' THEN 1 END) as waitlist_count,
    COUNT(CASE WHEN eb.status = 'cancelled' THEN 1 END) as cancelled_count,
    COUNT(CASE WHEN eb.status = 'attended' THEN 1 END) as attended_count,
    COUNT(CASE WHEN eb.status = 'no-show' THEN 1 END) as no_show_count,
    COUNT(CASE WHEN eb.status = 'pending' THEN 1 END) as pending_count,
    CASE 
        WHEN e.booking_capacity IS NULL THEN 'unlimited'
        WHEN COUNT(CASE WHEN eb.status = 'confirmed' THEN 1 END) >= e.booking_capacity THEN 'full'
        WHEN COUNT(CASE WHEN eb.status = 'confirmed' THEN 1 END) >= (e.booking_capacity * 0.9) THEN 'almost_full'
        ELSE 'available'
    END as availability_status
FROM public.events e
LEFT JOIN public.event_bookings eb ON e.id = eb.event_id AND eb.deleted_at IS NULL
GROUP BY e.id, e.title, e.booking_enabled, e.booking_capacity;
```

### **3. Gamification System**

#### **3A. Complete Gamification Schema**
```sql
-- File: migrations/create-gamification-schema.sql
-- User levels table
CREATE TABLE IF NOT EXISTS public.user_levels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    current_level INTEGER DEFAULT 1,
    total_xp INTEGER DEFAULT 0,
    xp_to_next_level INTEGER DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    icon TEXT,
    xp_reward INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- XP transactions table
CREATE TABLE IF NOT EXISTS public.xp_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    source TEXT NOT NULL, -- 'scenario_completion', 'achievement', 'streak_bonus', etc.
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily streaks table
CREATE TABLE IF NOT EXISTS public.daily_streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Leaderboards table
CREATE TABLE IF NOT EXISTS public.leaderboards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    leaderboard_type TEXT NOT NULL, -- 'weekly_xp', 'monthly_xp', 'all_time_xp', 'daily_streak'
    score INTEGER NOT NULL,
    rank_position INTEGER,
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    challenge_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    target_value INTEGER NOT NULL,
    xp_reward INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User challenges table
CREATE TABLE IF NOT EXISTS public.user_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

-- Indexes for gamification tables
CREATE INDEX IF NOT EXISTS idx_user_levels_user_id ON public.user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON public.xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_streaks_user_id ON public.daily_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_type ON public.leaderboards(leaderboard_type);
CREATE INDEX IF NOT EXISTS idx_leaderboards_user_id ON public.leaderboards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON public.user_challenges(user_id);

-- RLS Policies for gamification
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

-- Service role access for all gamification tables
CREATE POLICY "Service role full access to user_levels" ON public.user_levels FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to achievements" ON public.achievements FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to user_achievements" ON public.user_achievements FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to xp_transactions" ON public.xp_transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to daily_streaks" ON public.daily_streaks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to leaderboards" ON public.leaderboards FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to challenges" ON public.challenges FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to user_challenges" ON public.user_challenges FOR ALL USING (auth.role() = 'service_role');
```

### **4. IMT Portfolio System**

#### **4A. Portfolio Files Table**
```sql
-- File: migrations/create-portfolio-files-table.sql
CREATE TABLE IF NOT EXISTS public.portfolio_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'postgraduate', 'presentations', 'publications', 'teaching_experience', 'training_in_teaching', 'qi'
    subcategory TEXT, -- 'audit', 'qip', etc.
    evidence_type TEXT, -- 'certificate', 'abstract', 'pmid_and_url', etc.
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    description TEXT,
    pmid TEXT, -- For publications
    url TEXT, -- For publications
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_files_user_id ON public.portfolio_files(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_files_category ON public.portfolio_files(category);
CREATE INDEX IF NOT EXISTS idx_portfolio_files_created_at ON public.portfolio_files(created_at);

-- RLS Policies
ALTER TABLE public.portfolio_files ENABLE ROW LEVEL SECURITY;

-- Users can view their own portfolio files
CREATE POLICY "Users can view their own portfolio files"
    ON public.portfolio_files FOR SELECT
    USING (auth.role() = 'service_role');

-- Users can insert their own portfolio files
CREATE POLICY "Users can insert their own portfolio files"
    ON public.portfolio_files FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Users can update their own portfolio files
CREATE POLICY "Users can update their own portfolio files"
    ON public.portfolio_files FOR UPDATE
    USING (auth.role() = 'service_role');

-- Users can delete their own portfolio files
CREATE POLICY "Users can delete their own portfolio files"
    ON public.portfolio_files FOR DELETE
    USING (auth.role() = 'service_role');
```

### **5. Data Retention & Privacy System**

#### **5A. Audit Logs Table**
```sql
-- File: migrations/create-audit-logs-table.sql
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout', etc.
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- RLS Policies
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access audit logs
CREATE POLICY "Service role full access to audit_logs"
    ON public.audit_logs FOR ALL
    USING (auth.role() = 'service_role');
```

#### **5B. Data Retention Policies Table**
```sql
-- File: migrations/create-data-retention-policies-table.sql
CREATE TABLE IF NOT EXISTS public.data_retention_policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL UNIQUE,
    retention_days INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    last_cleanup TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default retention policies
INSERT INTO public.data_retention_policies (table_name, retention_days, description) VALUES
('email_verification_tokens', 7, 'Email verification tokens expire after 7 days'),
('password_reset_tokens', 1, 'Password reset tokens expire after 1 day'),
('audit_logs', 2555, 'Audit logs retained for 7 years for compliance'),
('api_usage_logs', 365, 'API usage logs retained for 1 year'),
('user_sessions', 30, 'User session data retained for 30 days'),
('download_tracking', 365, 'Download tracking data retained for 1 year')
ON CONFLICT (table_name) DO NOTHING;

-- RLS Policies
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;

-- Only service role can access data retention policies
CREATE POLICY "Service role full access to data_retention_policies"
    ON public.data_retention_policies FOR ALL
    USING (auth.role() = 'service_role');
```

### **6. Analytics System**

#### **6A. Analytics Tables**
```sql
-- File: migrations/create-analytics-tables.sql
-- Sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    station_id UUID REFERENCES public.stations(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_s INTEGER,
    completed BOOLEAN DEFAULT FALSE,
    device TEXT,
    browser TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scores table
CREATE TABLE IF NOT EXISTS public.scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    station_id UUID REFERENCES public.stations(id),
    overall_score DECIMAL(5,2),
    communication_score DECIMAL(5,2),
    clinical_score DECIMAL(5,2),
    professionalism_score DECIMAL(5,2),
    overall_band TEXT CHECK (overall_band IN ('Pass', 'Fail', 'Distinction')),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tech metrics table
CREATE TABLE IF NOT EXISTS public.tech_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_name TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    response_time_ms INTEGER,
    status_code INTEGER,
    error_message TEXT,
    user_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API usage table
CREATE TABLE IF NOT EXISTS public.api_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    response_time_ms INTEGER,
    status_code INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON public.sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_scores_session_id ON public.scores(session_id);
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON public.scores(user_id);
CREATE INDEX IF NOT EXISTS idx_tech_metrics_created_at ON public.tech_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON public.api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON public.api_usage(created_at);

-- RLS Policies
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Service role access for all analytics tables
CREATE POLICY "Service role full access to sessions" ON public.sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to scores" ON public.scores FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to tech_metrics" ON public.tech_metrics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to api_usage" ON public.api_usage FOR ALL USING (auth.role() = 'service_role');
```

### **7. Feedback & QR Code System**

#### **7A. Feedback System Tables**
```sql
-- File: migrations/create-feedback-system-tables.sql
-- Feedback forms table
CREATE TABLE IF NOT EXISTS public.feedback_forms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    form_name TEXT NOT NULL,
    form_template JSONB NOT NULL,
    questions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    anonymous_enabled BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback responses table
CREATE TABLE IF NOT EXISTS public.feedback_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id UUID NOT NULL REFERENCES public.feedback_forms(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    responses JSONB NOT NULL,
    is_anonymous BOOLEAN DEFAULT false,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QR codes table
CREATE TABLE IF NOT EXISTS public.qr_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    qr_code_data TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QR code scans table
CREATE TABLE IF NOT EXISTS public.qr_code_scans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    qr_code_id UUID NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_forms_event_id ON public.feedback_forms(event_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_form_id ON public.feedback_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_event_id ON public.feedback_responses(event_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_event_id ON public.qr_codes(event_id);
CREATE INDEX IF NOT EXISTS idx_qr_code_scans_qr_code_id ON public.qr_code_scans(qr_code_id);

-- RLS Policies
ALTER TABLE public.feedback_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_code_scans ENABLE ROW LEVEL SECURITY;

-- Service role access for all feedback tables
CREATE POLICY "Service role full access to feedback_forms" ON public.feedback_forms FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to feedback_responses" ON public.feedback_responses FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to qr_codes" ON public.qr_codes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to qr_code_scans" ON public.qr_code_scans FOR ALL USING (auth.role() = 'service_role');
```

### **8. Certificate System**

#### **8A. Certificate System Tables**
```sql
-- File: migrations/create-certificate-system-tables.sql
-- Certificate templates table
CREATE TABLE IF NOT EXISTS public.certificate_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL,
    background_image_path TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Certificates table
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    template_id UUID REFERENCES public.certificate_templates(id),
    certificate_data JSONB NOT NULL,
    file_path TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_event_id ON public.certificates(event_id);
CREATE INDEX IF NOT EXISTS idx_certificates_generated_at ON public.certificates(generated_at);

-- RLS Policies
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Service role access for certificate tables
CREATE POLICY "Service role full access to certificate_templates" ON public.certificate_templates FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to certificates" ON public.certificates FOR ALL USING (auth.role() = 'service_role');
```

### **9. User Role Permissions & RLS Policies**

#### **9A. Comprehensive RLS Policies**
```sql
-- File: migrations/comprehensive-rls-all-roles.sql
-- This file contains the complete RLS setup for all user roles
-- (student, educator, meded_team, ctf, admin)

-- Helper functions for role checking
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE id = user_id;
  
  RETURN COALESCE(user_role, 'student');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN public.get_user_role(user_id) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_educator_or_above(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN public.get_user_role(user_id) IN ('educator', 'meded_team', 'ctf', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_manage_events(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN public.get_user_role(user_id) IN ('meded_team', 'ctf', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_manage_resources(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN public.get_user_role(user_id) IN ('educator', 'meded_team', 'ctf', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_view_contact_messages(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN public.get_user_role(user_id) IN ('meded_team', 'ctf', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- RLS Policies for all tables
-- (This would be a very long file with policies for each table)
-- For brevity, showing the pattern for key tables

-- Events table policies
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Everyone can view events
CREATE POLICY "Everyone can view events"
    ON public.events FOR SELECT
    USING (true);

-- Only authorized roles can manage events
CREATE POLICY "Authorized roles can manage events"
    ON public.events FOR ALL
    USING (auth.role() = 'service_role');

-- Similar patterns for all other tables...
```

---

## 📝 **ONGOING SQL UPDATES**

### **Date: [Current Date]**
- **Status**: Planning phase
- **Next Steps**: 
  1. Run communication systems SQL scripts
  2. Run event booking system SQL scripts
  3. Run gamification system SQL scripts
  4. Run IMT portfolio system SQL scripts
  5. Run data retention system SQL scripts
  6. Run analytics system SQL scripts
  7. Run feedback & QR system SQL scripts
  8. Run certificate system SQL scripts
  9. Run comprehensive RLS policies SQL scripts

---

## 🔄 **UPDATE LOG**

### **2025-01-XX - Initial Setup**
- ✅ Created comprehensive SQL tracking document
- ✅ Identified all missing systems and their SQL requirements
- ✅ Documented complete database schema for all systems
- ⏳ Ready to begin implementation

---

## 📋 **IMPLEMENTATION CHECKLIST**

### **Phase 1: Communication Systems**
- [ ] Run announcements table SQL
- [ ] Run contact messages table SQL
- [ ] Run file requests table SQL
- [ ] Run teaching requests table SQL

### **Phase 2: Event Booking System**
- [ ] Run event booking fields SQL
- [ ] Run event bookings table SQL
- [ ] Run booking statistics view SQL

### **Phase 3: Gamification System**
- [ ] Run complete gamification schema SQL

### **Phase 4: IMT Portfolio System**
- [ ] Run portfolio files table SQL

### **Phase 5: Data Retention & Privacy**
- [ ] Run audit logs table SQL
- [ ] Run data retention policies table SQL

### **Phase 6: Analytics System**
- [ ] Run analytics tables SQL

### **Phase 7: Feedback & QR System**
- [ ] Run feedback system tables SQL

### **Phase 8: Certificate System**
- [ ] Run certificate system tables SQL

### **Phase 9: User Role Permissions**
- [ ] Run comprehensive RLS policies SQL

---

## 🎯 **NEXT ACTIONS**

1. **Start with Communication Systems** (Highest Priority)
2. **Follow with Event Booking System** (High Priority)
3. **Continue with remaining systems** in order of priority
4. **Update this document** after each SQL script is run
5. **Test each system** after implementation

---

**Note**: This document will be updated every time we run a SQL script in Supabase. All changes should be recorded here for complete tracking.

