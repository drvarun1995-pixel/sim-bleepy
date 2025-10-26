# 📊 Download Tracking System Setup

## 🎯 What This Fixes

The download counts weren't updating because the `download_tracking` table was missing. This system tracks:
- Who downloaded what files
- When downloads occurred
- File sizes and types
- User information and IP addresses

## 🚀 Setup Steps

### **Step 1: Create the Download Tracking Table**

Run this SQL script in your Supabase SQL Editor:

```sql
-- Create download_tracking table for tracking file downloads
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
    download_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_download_tracking_resource_id ON public.download_tracking(resource_id);
CREATE INDEX IF NOT EXISTS idx_download_tracking_user_id ON public.download_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_download_tracking_timestamp ON public.download_tracking(download_timestamp);

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

## ✅ What's Fixed

- ✅ **Download Counts**: Now properly track and display download counts
- ✅ **Download Tracking**: Records who downloaded what and when
- ✅ **User Privacy**: Users can only see their own download history
- ✅ **Admin Access**: Admins can see all download statistics
- ✅ **Performance**: Proper indexes for fast queries

## 🔍 How It Works

1. **User Downloads File**: Frontend calls `/api/resources/download/[id]`
2. **File Served**: File is downloaded with proper headers
3. **Tracking Request**: Frontend calls `/api/downloads/track` to record the download
4. **Count Update**: Frontend calls `/api/downloads/counts` to get updated counts
5. **Display Update**: Download count is updated in the UI

## 📊 Admin Features

Admins can access download analytics via:
- `/api/downloads/track` (GET) - View all download records
- Download counts are automatically tracked and displayed
- User download history is preserved

## 🎉 Result

After running the SQL script, your download tracking system will be fully functional:
- Download counts will update in real-time
- User download history will be tracked
- Admin analytics will be available
- No more 500 errors from the download counts API

**Run the SQL script and test downloading a file - the count should update immediately!** 🚀
