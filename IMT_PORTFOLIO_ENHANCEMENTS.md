# IMT Portfolio Enhancements Summary

## ✅ Changes Implemented

### 1. **Updated QI Subcategories**
Changed from:
- 2 cycles
- 1 cycle

To:
- **Audit**
- **QIP**

### 2. **Added Evidence Type System**

#### **Postgraduate:**
- Certificate (default selection)

#### **Presentations:**
- Abstract accepted email
- Certificate
- Abstract
- Slides

#### **Publications:**
- PMID and URL (text fields for user input)
  - Users can enter PubMed ID
  - Users can enter publication URL
  - **No file upload required** for this evidence type

#### **Teaching Experience:**
- Letter
- Timetable/Programme Outline/Content
- Formal Feedback

#### **Training in Teaching:**
- Certificate
- Course Outline

#### **QI:**
- Certificate
- QIPAT form
- Other

### 3. **Enhanced Table Styling**

#### **Table Header:**
- Gradient background (purple to blue)
- Bold, uppercase column headers
- Better spacing and borders

#### **Table Body:**
- Alternating row colors (white and light gray)
- Hover effects with purple tint
- Icon backgrounds with gradient
- Colored badges for subcategory and evidence type
- Enhanced action buttons with color-coded hover states:
  - Download: Green hover
  - Edit: Blue hover
  - Delete: Red hover

#### **New Table Columns:**
- File (with icon, filename, PMID, and URL display)
- Subcategory (purple badge)
- **Evidence Type** (blue badge) ← NEW
- Size
- Description
- Uploaded Date (formatted as DD MMM YYYY)
- Actions

### 4. **Special Features for Publications**

When users select "Publications" category with "PMID and URL" evidence type:
- **No file upload required**
- Two text input fields appear:
  - PMID (PubMed ID)
  - URL (Publication link)
- PMID displays below filename in purple
- URL displays as clickable link in blue
- File size shows as "N/A" for publication links

### 5. **Database Schema Updates**

Added new columns to `portfolio_files` table:
- `evidence_type` (TEXT) - Type of evidence for the file
- `pmid` (TEXT) - PubMed ID for publications
- `url` (TEXT) - URL for publications or references

### 6. **UI Improvements**

#### **Upload Dialog:**
- Scrollable content area for long forms
- Conditional field display based on selections
- Clear field labels with asterisks (*) for required fields
- Dynamic form that shows/hides file upload based on evidence type

#### **Edit Dialog:**
- Same enhancements as upload dialog
- Can edit evidence type, PMID, and URL
- Maintains all existing file information

#### **Category Display:**
- All categories start **collapsed** by default
- Click to expand and view files
- File count badge shows number of files per category

## 📋 Database Migration Required

Run this SQL script in Supabase:

```sql
-- Add new columns to portfolio_files table
ALTER TABLE portfolio_files 
ADD COLUMN IF NOT EXISTS evidence_type TEXT,
ADD COLUMN IF NOT EXISTS pmid TEXT,
ADD COLUMN IF NOT EXISTS url TEXT;

-- Add comments
COMMENT ON COLUMN portfolio_files.evidence_type IS 'Type of evidence for the file';
COMMENT ON COLUMN portfolio_files.pmid IS 'PubMed ID for publications';
COMMENT ON COLUMN portfolio_files.url IS 'URL for publications or other references';
```

## 🎨 Visual Enhancements

1. **Gradient backgrounds** on table headers
2. **Icon containers** with purple-blue gradients
3. **Color-coded badges** for categories
4. **Smooth hover transitions** on all interactive elements
5. **Alternating row colors** for better readability
6. **Professional date formatting** (e.g., "13 Oct 2025")
7. **Rounded corners** and modern spacing

## 🔄 Workflow Changes

### **For Regular Files:**
1. Select Category
2. Select Subcategory
3. Select Evidence Type
4. Upload File
5. Add Description (optional)

### **For Publications (PMID/URL):**
1. Select Category: Publications
2. Select Subcategory
3. Select Evidence Type: PMID and URL
4. Enter PMID (optional)
5. Enter URL (optional)
6. Add Description (optional)
7. **No file upload needed!**

## 📁 Files Modified

### Frontend:
- `app/imt-portfolio/page.tsx` - Main portfolio page with all UI enhancements

### Backend:
- `app/api/portfolio/upload/route.ts` - Handles file uploads and publication links
- `app/api/portfolio/files/[id]/route.ts` - Handles file updates

### Database:
- `create-portfolio-table.sql` - Updated schema
- `add-subcategory-column.sql` - Migration script for new columns

## 🚀 Ready to Use!

All changes are complete and ready for testing. The system now supports:
- ✅ Evidence type classification
- ✅ Publication links without file uploads
- ✅ Enhanced table styling
- ✅ Updated QI subcategories
- ✅ Improved user experience

