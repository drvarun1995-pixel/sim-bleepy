# ARCP Teaching Portfolio - Setup Guide

## ✅ What Has Been Implemented

### 1. Frontend Enhancements
- **ARCP Dashboard Tab**: Overview with progress tracking
- **Files Tab**: Existing file management (unchanged)
- **Curriculum-Aligned Structure**: 5 curriculum domains
- **Progress Tracking**: Real-time domain completion calculation
- **ARCP Readiness Score**: Overall readiness percentage
- **Missing Evidence Alerts**: Highlights what needs attention

### 2. Curriculum Domains
1. **Professional Values & Behaviours** (min: 3 evidence items)
2. **Professional Skills** (min: 4 evidence items)
3. **Professional Knowledge** (min: 3 evidence items)
4. **Health Promotion & Illness Prevention** (min: 2 evidence items)
5. **Patient Safety & Quality Improvement** (min: 2 evidence items)

## 📋 What You Need to Do

### Step 1: Update Database Categories (If Not Done)

If you haven't run the category update migration yet:

1. Go to Supabase Dashboard → SQL Editor
2. Run the migration: `migrations/update-teaching-portfolio-categories.sql`
3. This adds all the new categories (VR sessions, simulations, etc.)

### Step 2: Update Database Evidence Types (NEW - Required)

The frontend now supports additional evidence types. Run this SQL:

```sql
-- Update evidence_type CHECK constraint to include new types
ALTER TABLE public.teaching_portfolio_files 
DROP CONSTRAINT IF EXISTS teaching_portfolio_files_evidence_type_check;

ALTER TABLE public.teaching_portfolio_files 
ADD CONSTRAINT teaching_portfolio_files_evidence_type_check 
CHECK (evidence_type IN (
  'email',
  'certificate',
  'document',
  'feedback',
  'reflection',
  'other'
));

-- Update comment
COMMENT ON COLUMN public.teaching_portfolio_files.evidence_type IS 'Type of evidence: email, certificate, document, feedback, reflection, other';
```

### Step 3: Verify Activity Date Column Exists

If you haven't run this migration:

1. Run: `migrations/add-date-to-teaching-portfolio.sql`
2. This adds the `activity_date` column for tracking when activities occurred

### Step 4: Test the ARCP Features

1. **Login** as CTF or Admin user
2. **Navigate** to Teaching Portfolio
3. **Check Overview Tab**:
   - ARCP Readiness score should display
   - Domain progress cards should show
   - Missing evidence alerts (if any)
4. **Upload Files**:
   - Use any category
   - Try new evidence types (feedback, reflection)
   - Add activity dates
5. **Verify Progress**:
   - Upload files in different categories
   - Check if domain progress updates
   - Verify ARCP readiness score changes

## 🎯 How It Works

### Category to Domain Mapping

The system automatically maps your existing categories to curriculum domains:

- **Professional Skills**: Bedside Teaching, Twilight Teaching, Core Teaching, OSCE Skills, VR Sessions, Simulations, Clinical Skills, Paediatric, Obs & Gynae, A-E Sessions, Hub Days
- **Professional Knowledge**: Exams, Others
- **Professional Values**: Portfolio Drop-in Sessions

### ARCP Readiness Calculation

- Each domain has a minimum evidence requirement
- Progress is calculated as: `(current evidence / minimum required) * 100`
- Overall readiness = `(complete domains / total domains) * 100`
- Domains are marked complete when they meet minimum requirements

### Missing Evidence Alerts

- Automatically identifies domains below minimum requirements
- Shows exactly how many more items are needed
- Provides quick link to upload evidence

## 🔍 Verification Checklist

- [ ] Database categories updated (all 14 categories allowed)
- [ ] Evidence types updated (includes feedback, reflection)
- [ ] Activity date column exists
- [ ] Can access Overview tab
- [ ] ARCP Readiness score displays correctly
- [ ] Domain progress cards show accurate counts
- [ ] Can upload files with new evidence types
- [ ] Progress updates when files are added
- [ ] Missing evidence alerts work correctly
- [ ] Files tab still works as before

## 📊 Expected Behavior

### When You Have No Files
- ARCP Readiness: 0%
- All domains show 0% progress
- All domains in "Missing Evidence" alert

### When You Upload Files
- Domain progress updates in real-time
- ARCP Readiness recalculates
- Missing evidence list updates
- Progress bars fill up

### When Domain is Complete
- Green "Complete" badge appears
- Progress bar shows 100%
- Removed from missing evidence list

## 🎨 Visual Features

- **Color-Coded Domains**: Each domain has its own color (purple, blue, green, orange, red)
- **Progress Bars**: Visual representation of completion
- **Status Badges**: Complete/In Progress indicators
- **Summary Cards**: Key metrics at a glance
- **Responsive Design**: Works on all screen sizes

## ✅ Ready to Use

Once you've completed Steps 1-3 (database updates), the ARCP features are ready to use!

The frontend code is already updated and will work once the database constraints are updated.

