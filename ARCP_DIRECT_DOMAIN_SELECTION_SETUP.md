# ARCP Direct Domain Selection - Setup Guide

## ✅ What Has Been Implemented

### 1. Direct Domain Selection
- **Upload Form**: Users now select curriculum domain FIRST, then category
- **Domain-Filtered Categories**: Only shows categories relevant to selected domain
- **Database Storage**: Stores `curriculum_domain` field for direct mapping
- **Progress Calculation**: Uses `curriculum_domain` if available, falls back to category mapping

### 2. Enhanced Categories
Added new categories for previously unmapped domains:
- **Health Promotion**: Public Health Teaching, Prevention Strategies
- **Patient Safety**: QI Projects, Audit Projects, Patient Safety Training

### 3. UI Improvements
- Domain cards show which categories count toward them
- Clear messaging for domains without specific categories
- Better user guidance in upload form

## 📋 What You Need to Do

### Step 1: Run Database Migration (REQUIRED)

Add the `curriculum_domain` column to the database:

1. Go to Supabase Dashboard → SQL Editor
2. Run: `migrations/add-curriculum-domain-to-teaching-portfolio.sql`

This adds:
- `curriculum_domain` column (nullable, for backward compatibility)
- CHECK constraint for valid domain values
- Index for better query performance

### Step 2: Update Category Constraints (If Needed)

If you haven't run the category update migration yet:

1. Run: `migrations/update-teaching-portfolio-categories.sql`
2. This adds all categories including the new ones (QI Projects, Audit, etc.)

### Step 3: Update Evidence Types (If Needed)

If you haven't run the evidence types update:

1. Run: `migrations/update-teaching-portfolio-evidence-types.sql`
2. This adds `feedback` and `reflection` evidence types

### Step 4: Test the New Flow

1. **Login** as CTF or Admin
2. **Go to Teaching Portfolio** → Click "Upload File"
3. **Select Curriculum Domain FIRST** (e.g., "Professional Values & Behaviours")
4. **See Filtered Categories** (only categories for that domain appear)
5. **Complete Upload** and verify it counts toward the correct domain
6. **Check Overview Tab** to see progress update

## 🎯 How It Works Now

### Upload Flow:
1. User selects **Curriculum Domain** (e.g., "Professional Values & Behaviours")
2. System shows only **relevant categories** for that domain
3. User selects category, evidence type, uploads file
4. File is stored with both `curriculum_domain` and `category`
5. Progress calculation uses `curriculum_domain` directly

### Progress Calculation:
- **New files**: Use `curriculum_domain` field directly
- **Legacy files**: Fall back to category-to-domain mapping
- **Mixed portfolios**: Both approaches work together

### Domain-to-Category Mapping:

**Professional Values & Behaviours:**
- Portfolio drop in sessions

**Professional Skills:**
- Bedside Teaching, Twilight Teaching, Core Teaching
- OSCE Skills Teaching, VR Sessions, Simulations
- Clinical Skills sessions, Paediatric, Obs & Gynae
- A-E sessions, Hub days

**Professional Knowledge:**
- Exams, Others

**Health Promotion & Illness Prevention:**
- Public Health Teaching
- Prevention Strategies

**Patient Safety & Quality Improvement:**
- QI Projects
- Audit Projects
- Patient Safety Training

## 🔍 Verification Checklist

- [ ] Database migration run (curriculum_domain column added)
- [ ] Can select curriculum domain in upload form
- [ ] Categories filter based on selected domain
- [ ] Can upload file with domain selection
- [ ] File appears in correct domain on Overview tab
- [ ] Progress updates correctly
- [ ] Legacy files still work (fallback to category mapping)
- [ ] Edit dialog shows domain selection
- [ ] All domains have at least one category option

## 📊 Expected Behavior

### When Uploading:
1. Select "Professional Values & Behaviours" → Only "Portfolio drop in sessions" appears
2. Select "Professional Skills" → All teaching categories appear
3. Select "Health Promotion" → Public Health, Prevention Strategies appear
4. Select "Patient Safety" → QI Projects, Audit Projects, Patient Safety Training appear

### Progress Updates:
- Upload file to "Professional Values" → Count increases immediately
- Upload file to "Professional Skills" → That domain's count increases
- Complete a domain → Green badge appears, removed from missing evidence

## ✅ Ready to Use

Once you've run the database migration (Step 1), the direct domain selection feature is ready!

The frontend code is complete and will work once the `curriculum_domain` column exists in the database.

