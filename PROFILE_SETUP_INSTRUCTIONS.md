# Profile Page Setup Instructions

## 🎯 What's Been Created

I've created a complete profile management system for your dashboard with the following features:

### ✅ **Profile Page Features**
- **Change Name**: Users can update their full name
- **Change Role**: Dropdown with Student/Educator options
- **University/Institution**: Optional field for university name
- **Medical School Year**: Dropdown with all medical school years
- **Password Reset**: Secure password reset via email
- **Account Information**: Shows member since date and account ID

### ✅ **API Endpoints Created**
- `GET/PUT /api/user/profile` - Fetch and update profile
- `POST /api/auth/forgot-password` - Send password reset email
- `GET /api/auth/validate-reset-token` - Validate reset tokens
- `POST /api/auth/reset-password` - Reset password with token

### ✅ **Pages Created**
- `/dashboard/profile` - Main profile management page
- `/auth/reset-password` - Password reset page

## 🗄️ **Database Setup Required**

Run the SQL script to add the new fields to your database:

```sql
-- Run this in your Supabase SQL editor
-- File: add-profile-fields.sql

-- Add profile fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS university VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS year VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'student';
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Update existing users
UPDATE users SET role = 'student' WHERE role IS NULL;
```

## 🚀 **How to Test**

1. **Update Database**: Run the SQL script above in Supabase
2. **Start Server**: `npm run dev`
3. **Access Profile**: Go to `/dashboard/profile`
4. **Test Features**:
   - Update your name, role, university, and year
   - Test password reset functionality
   - Verify all changes are saved

## 📧 **Password Reset Flow**

1. User clicks "Send Password Reset Email"
2. System generates secure token (24-hour expiry)
3. Token is stored in `password_reset_tokens` table
4. User receives email with reset link (currently logged to console)
5. User clicks link → goes to `/auth/reset-password?token=...`
6. User enters new password
7. Password is updated and token is marked as used

## 🔧 **Email Integration**

Currently, password reset links are logged to the console. To enable actual email sending:

1. **Add Email Service**: Integrate with MailerLite, SendGrid, or similar
2. **Update Forgot Password API**: Replace console.log with actual email sending
3. **Environment Variables**: Add email service credentials to `.env.local`

## 🎨 **UI Features**

- **Responsive Design**: Works on all screen sizes
- **Form Validation**: Client and server-side validation
- **Loading States**: Visual feedback during operations
- **Success/Error Messages**: Toast notifications and alerts
- **Password Visibility Toggle**: Show/hide password fields
- **Medical School Years**: Comprehensive dropdown with all years

## 🔒 **Security Features**

- **Token Expiry**: Reset tokens expire after 24 hours
- **One-Time Use**: Tokens can only be used once
- **Password Hashing**: Uses bcrypt with salt rounds
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Parameterized queries

The profile page is now ready to use! 🎉
