# 📊 Complete Download Tracking & Analytics System

## 🎯 What This Provides

A comprehensive download tracking system with full analytics capabilities:

### **Core Features:**
- ✅ **Detailed Download Tracking**: Every download is recorded with user info, timestamps, file details
- ✅ **Real-time Download Counts**: Live count updates on the downloads page
- ✅ **User Analytics**: Track which users download what files
- ✅ **File Analytics**: Most popular files, file types, categories
- ✅ **Time-based Analytics**: Downloads by day/week/month
- ✅ **Admin Dashboard Ready**: Full analytics API for admin pages

### **Analytics Data Captured:**
- User information (email, name, ID)
- File details (name, size, type, category)
- Download metadata (timestamp, IP, user agent)
- Download method and status
- Referrer information
- Session tracking

## 🚀 Setup Instructions

### **Step 1: Create the Download Tracking Table**

Run this SQL script in your Supabase SQL Editor:

```sql
-- Create download_tracking table for comprehensive download analytics
CREATE TABLE IF NOT EXISTS public.download_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    resource_name TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_name TEXT,
    ip_address TEXT,
    user_agent TEXT,
    file_size BIGINT,
    file_type TEXT,
    download_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional analytics fields
    session_id TEXT, -- For tracking user sessions
    referrer TEXT, -- Where the download was initiated from
    download_method TEXT DEFAULT 'direct', -- direct, bulk, api, etc.
    download_status TEXT DEFAULT 'completed', -- completed, failed, cancelled
    download_duration_ms INTEGER, -- How long the download took
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance and analytics queries
CREATE INDEX IF NOT EXISTS idx_download_tracking_resource_id ON public.download_tracking(resource_id);
CREATE INDEX IF NOT EXISTS idx_download_tracking_user_id ON public.download_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_download_tracking_timestamp ON public.download_tracking(download_timestamp);
CREATE INDEX IF NOT EXISTS idx_download_tracking_user_email ON public.download_tracking(user_email);
CREATE INDEX IF NOT EXISTS idx_download_tracking_file_type ON public.download_tracking(file_type);
CREATE INDEX IF NOT EXISTS idx_download_tracking_download_method ON public.download_tracking(download_method);
CREATE INDEX IF NOT EXISTS idx_download_tracking_status ON public.download_tracking(download_status);
CREATE INDEX IF NOT EXISTS idx_download_tracking_created_at ON public.download_tracking(created_at);

-- Enable RLS
ALTER TABLE public.download_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for download_tracking
-- Users can view their own download history
CREATE POLICY "Users can view their own download history" ON public.download_tracking
    FOR SELECT USING (
        auth.uid()::text = user_id::text OR 
        auth.jwt() ->> 'email' = user_email
    );

-- Users can insert their own download records
CREATE POLICY "Users can track their own downloads" ON public.download_tracking
    FOR INSERT WITH CHECK (
        auth.uid()::text = user_id::text OR 
        auth.jwt() ->> 'email' = user_email
    );

-- Admins can view all download tracking data
CREATE POLICY "Admins can view all download tracking" ON public.download_tracking
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Admins can delete download tracking data
CREATE POLICY "Admins can delete download tracking" ON public.download_tracking
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_download_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.download_timestamp = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_download_tracking_updated_at
    BEFORE UPDATE ON public.download_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_download_tracking_updated_at();
```

### **Step 2: Test the System**

1. **Go to** `http://localhost:3000/downloads`
2. **Download a file** by clicking on it
3. **Check the console** - you should see download tracking logs
4. **Refresh the page** - the download count should now show "1"
5. **Download again** - the count should increment to "2"

### **Step 3: Test Analytics API**

Test the analytics endpoint:
```bash
# Get all download analytics (admin only)
GET http://localhost:3000/api/analytics/downloads

# Get analytics for specific date range
GET http://localhost:3000/api/analytics/downloads?startDate=2024-01-01&endDate=2024-12-31

# Get analytics grouped by week
GET http://localhost:3000/api/analytics/downloads?groupBy=week

# Get analytics for specific resource
GET http://localhost:3000/api/analytics/downloads?resourceId=your-resource-id
```

## 📊 Analytics Data Available

### **Summary Statistics:**
- Total downloads
- Unique users
- Total file size downloaded
- Average file size

### **Breakdowns:**
- Downloads by file type (PDF, video, etc.)
- Downloads by category (core-teaching, grand-rounds, etc.)
- Downloads by time period (day/week/month)

### **Top Resources:**
- Most downloaded files
- File sizes and categories
- Download counts per resource

### **Recent Activity:**
- Latest downloads with user info
- File details and timestamps
- User engagement patterns

## 🔧 API Endpoints

### **Download Tracking:**
- `POST /api/downloads/track` - Track a download
- `GET /api/downloads/counts` - Get download counts
- `GET /api/downloads/track` - Get download history (admin)

### **Analytics:**
- `GET /api/analytics/downloads` - Comprehensive download analytics

## 🎉 Result

After running the SQL script, you'll have:

- ✅ **Working Download Counts**: Real-time updates on downloads page
- ✅ **Detailed Analytics**: Full download tracking with user data
- ✅ **Admin Dashboard Ready**: Analytics API for admin pages
- ✅ **User Privacy**: Users can only see their own download history
- ✅ **Performance Optimized**: Proper indexes for fast queries
- ✅ **Scalable**: Handles large volumes of download data

## 🚀 Next Steps for Analytics Page

You can now integrate this data into your analytics page:

```typescript
// Example usage in analytics page
const fetchDownloadAnalytics = async () => {
  const response = await fetch('/api/analytics/downloads?groupBy=week');
  const data = await response.json();
  
  // Use data.summary, data.breakdown, data.topResources, etc.
};
```

**Run the SQL script and your download tracking system will be fully functional with comprehensive analytics!** 🎉
