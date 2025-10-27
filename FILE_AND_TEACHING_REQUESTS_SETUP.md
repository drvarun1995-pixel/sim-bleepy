# File Requests & Teaching Requests Systems Setup Guide

## 🎯 **Overview**
This guide will help you restore the File Requests and Teaching Requests systems to your Bleepy application. Both systems allow users to submit requests that are managed by administrators.

## 📊 **System Features**

### **File Requests System**
- Users can request files from specific teaching events
- Admin dashboard for managing requests
- Status tracking: `pending` → `in-progress` → `completed`/`rejected`
- Role-based access control

### **Teaching Requests System**
- Users can request specific teaching sessions
- Category and format selection
- Scheduling preferences
- Admin management with assignment capabilities

## 🔧 **Setup Instructions**

### **Step 1: Run Database Scripts**

Execute these SQL scripts in your Supabase SQL Editor in order:

1. **Create File Requests System:**
   ```sql
   -- Run: create-file-requests-system.sql
   ```

2. **Create Teaching Requests System:**
   ```sql
   -- Run: create-teaching-requests-system.sql
   ```

3. **Set up RLS Policies for File Requests:**
   ```sql
   -- Run: create-file-requests-rls-policies.sql
   ```

4. **Set up RLS Policies for Teaching Requests:**
   ```sql
   -- Run: create-teaching-requests-rls-policies.sql
   ```

### **Step 2: Verify Database Structure**

After running the scripts, verify these tables exist:
- `file_requests`
- `teaching_requests`
- `file_requests_with_details` (view)
- `teaching_requests_with_details` (view)

### **Step 3: Test the Systems**

1. **File Requests:**
   - Visit `/request-file` to submit a request
   - Visit `/admin-file-requests` to manage requests (admin/CTF/educator/meded_team only)

2. **Teaching Requests:**
   - Visit `/request-teaching` to submit a request
   - Admin management (if admin pages exist)

## 🔐 **Role Permissions**

### **File Requests System**

| Role | Submit Requests | View Own Requests | View All Requests | Manage Requests |
|------|----------------|-------------------|-------------------|-----------------|
| **Student** | ✅ | ✅ | ❌ | ❌ |
| **Educator** | ✅ | ✅ | ✅ | ✅ |
| **MedEd Team** | ✅ | ✅ | ✅ | ✅ |
| **CTF** | ✅ | ✅ | ✅ | ✅ |
| **Admin** | ✅ | ✅ | ✅ | ✅ |

### **Teaching Requests System**

| Role | Submit Requests | View Own Requests | View All Requests | Manage Requests |
|------|----------------|-------------------|-------------------|-----------------|
| **Student** | ✅ | ✅ | ❌ | ❌ |
| **Educator** | ✅ | ✅ | ✅ | ✅ |
| **MedEd Team** | ✅ | ✅ | ✅ | ✅ |
| **CTF** | ✅ | ✅ | ✅ | ✅ |
| **Admin** | ✅ | ✅ | ✅ | ✅ |

## 📋 **Database Schema**

### **File Requests Table**
```sql
file_requests (
    id UUID PRIMARY KEY,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    description TEXT NOT NULL,
    additional_info TEXT,
    event_id UUID REFERENCES events(id),
    event_title TEXT NOT NULL,
    event_date DATE,
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    assigned_to UUID REFERENCES users(id),
    completed_at TIMESTAMP,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

### **Teaching Requests Table**
```sql
teaching_requests (
    id UUID PRIMARY KEY,
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
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    assigned_to UUID REFERENCES users(id),
    scheduled_date DATE,
    scheduled_time TIME,
    location TEXT,
    completed_at TIMESTAMP,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

## 🛠️ **Helper Functions**

### **File Requests Functions**
- `get_file_request_stats()` - Get request statistics
- `update_file_request_status()` - Update request status with timestamps
- `get_user_file_requests()` - Get requests for a specific user
- `search_file_requests()` - Search requests with filters

### **Teaching Requests Functions**
- `get_teaching_request_stats()` - Get request statistics
- `update_teaching_request_status()` - Update request status with scheduling
- `get_user_teaching_requests()` - Get requests for a specific user
- `search_teaching_requests()` - Search requests with filters
- `get_teaching_requests_by_category()` - Get requests by category
- `get_upcoming_teaching_requests()` - Get upcoming scheduled requests

## 🔒 **Security Features**

- **Row Level Security (RLS)** enabled on both tables
- **Role-based access control** with helper functions
- **User isolation** - users can only see their own requests
- **Admin access** - admins can see and manage all requests
- **Service role bypass** for API operations

## 📈 **Sample Data**

Both scripts include sample data for testing:
- 3 sample file requests with different statuses
- 3 sample teaching requests with different statuses

## 🚀 **Next Steps**

1. Run all SQL scripts in order
2. Test the frontend pages
3. Verify admin access works correctly
4. Check that users can only see their own requests
5. Test the status update functionality

## 🐛 **Troubleshooting**

### **Common Issues:**

1. **"Permission denied" errors:**
   - Check RLS policies are applied correctly
   - Verify user roles in the `users` table

2. **"Table doesn't exist" errors:**
   - Ensure all database scripts ran successfully
   - Check table names match exactly

3. **Frontend not loading data:**
   - Check API endpoints are working
   - Verify database connections
   - Check browser console for errors

### **Verification Queries:**

```sql
-- Check file requests table
SELECT COUNT(*) FROM file_requests;

-- Check teaching requests table  
SELECT COUNT(*) FROM teaching_requests;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename IN ('file_requests', 'teaching_requests');

-- Test user access
SELECT * FROM get_accessible_file_requests('your-email@example.com');
```

## 📞 **Support**

If you encounter any issues:
1. Check the database logs in Supabase
2. Verify all scripts ran without errors
3. Test with sample data first
4. Check role assignments in the users table

---

**✅ Both systems are now ready for use!**




