# 📊 Event Import Instructions

## Overview
Your CSV file has been analyzed and I've created two safe import methods for your events data.

## 📋 Data Analysis Summary

### ✅ **Good News:**
- **120+ events** ready for import
- **Well-structured data** with all necessary fields
- **Consistent format** across most events
- **Rich content** with descriptions, locations, and categories

### ⚠️ **Issues Found:**
1. **Date Format**: DD/MM/YYYY needs conversion to YYYY-MM-DD
2. **Time Format**: 12-hour format needs conversion to 24-hour
3. **HTML Content**: Descriptions contain HTML that needs cleaning
4. **Missing Data**: Some fields are empty (handled gracefully)
5. **Multiple Categories**: Events have multiple categories (comma-separated)

### 🎯 **Import Statistics:**
- **Total Events**: ~120 events
- **Event Types**: OSCE Revision, Core Teaching, Twilight Teaching, etc.
- **Locations**: Physical (Education Centre, KLT) and Virtual
- **Organizers**: CTF Team, Simulation Team, Pharmacy
- **Categories**: ARU, UCL, Foundation Year Doctors, etc.

## 🛡️ **Safe Import Methods**

### **Method 1: SQL Script (Recommended)**
- **File**: `import-events-from-csv.sql`
- **Pros**: Full control, detailed validation, rollback capability
- **Best for**: Production environments, detailed oversight

### **Method 2: Node.js Script**
- **File**: `import-events.js`
- **Pros**: Easy to run, automatic error handling, progress tracking
- **Best for**: Quick imports, development environments

## 🚀 **Quick Start (Node.js Method)**

### **Step 1: Install Dependencies**
```bash
npm install dotenv @supabase/supabase-js
```

### **Step 2: Set Environment Variables**
Add to your `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **Step 3: Run Import**
```bash
node import-events.js "C:\Users\Varun Tyagi\Downloads\mec-events-b7a833fcdbcffa8b3d0b352417e9882b.csv"
```

## 🔧 **SQL Method (Advanced)**

### **Step 1: Copy CSV Data**
1. Open `import-events-from-csv.sql`
2. Replace the sample data in `INSERT INTO temp_events_raw VALUES` section
3. Copy your CSV data (excluding header row)

### **Step 2: Run in Supabase**
1. Go to Supabase SQL Editor
2. Paste the entire script
3. Run it step by step
4. Review validation report
5. Uncomment import section when ready

## 📊 **What Gets Created**

### **New Categories:**
- ARU, ARU Year 1-5
- UCL, UCL Year 5-6
- Foundation Year 1-2, Foundation Year Doctors

### **New Formats:**
- OSCE Revision
- Core Teachings
- Twilight Teaching
- Others
- Clinical Skills
- Hub days
- Grand Round
- Bedside Teaching
- Pharmacy Teaching
- Virtual Reality Sessions
- A-E Practice Sessions
- Paeds Practice Sessions
- Obs & Gynae Practice Sessions
- Exams & Mocks
- Inductions
- Portfolio Drop-ins

### **New Locations:**
- B4, Education Centre
- A5, Education Centre
- A3, Education Centre
- A1, Education Centre
- A2, Education Centre
- KLT
- Simulation Suite
- Virtual
- IS1, Education Centre
- CTC Room 3
- Social Area

### **New Organizers:**
- CTF Team
- Simulation Team
- Pharmacy
- Avni Patel

### **New Speakers:**
- Varun Tyagi
- Anirudh Suresh
- Thanuji Rangana
- Hannah-Maria Francis

## ⚠️ **Safety Features**

### **Built-in Protections:**
1. **Validation**: All events validated before import
2. **Error Reporting**: Detailed error messages for failed imports
3. **Rollback**: Can be easily undone
4. **Duplicate Prevention**: Won't create duplicate records
5. **Foreign Key Safety**: All dependencies created first
6. **Data Cleaning**: HTML content cleaned, dates/times converted

### **What Happens to Invalid Events:**
- Events with missing titles → Skipped
- Events with invalid dates → Skipped
- Events with invalid times → Skipped
- Events with empty locations → Imported (location will be NULL)

## 🔍 **Post-Import Verification**

After import, verify:
1. **Event Count**: Check total events in database
2. **Categories**: Verify all categories were created
3. **Locations**: Check location mappings
4. **Dates**: Ensure dates display correctly
5. **Times**: Verify time formatting

## 🚨 **Troubleshooting**

### **Common Issues:**
1. **Permission Errors**: Ensure service role key has full access
2. **Date Parsing**: Check date format in CSV
3. **Foreign Key Errors**: Run dependency creation first
4. **Duplicate Errors**: Check for existing events with same title/date

### **Rollback Instructions:**
```sql
-- Delete imported events (replace 'imported-from-csv' with your author_id)
DELETE FROM event_speakers WHERE event_id IN (
    SELECT id FROM events WHERE author_id = 'imported-from-csv'
);

DELETE FROM event_categories WHERE event_id IN (
    SELECT id FROM events WHERE author_id = 'imported-from-csv'
);

DELETE FROM events WHERE author_id = 'imported-from-csv';
```

## 📞 **Support**

If you encounter issues:
1. Check the validation report first
2. Verify your Supabase credentials
3. Ensure all required tables exist
4. Check the console output for specific error messages

## 🎉 **Expected Results**

After successful import:
- **120+ events** in your events table
- **All dependencies** created automatically
- **Clean, formatted data** ready for your application
- **Proper relationships** between events, categories, locations, etc.

**Ready to import? Choose your method and let's get your events into the system!** 🚀
