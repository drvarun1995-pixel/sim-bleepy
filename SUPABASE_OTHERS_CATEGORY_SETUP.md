# Supabase Setup for "Others" Category in IMT Portfolio

## What Needs to Be Done on Supabase

To enable the new "Others" category in the IMT Portfolio, you need to run a SQL migration on your Supabase database.

### Steps:

1. **Open your Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration SQL**
   - Copy the entire contents of `migrations/add-others-category-to-portfolio.sql`
   - Paste it into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`

### What This Migration Does:

1. **Adds missing columns** (if they don't already exist):
   - `custom_subsection` - Allows users to create organizational folders
   - `custom_evidence_type` - Allows custom evidence type naming

2. **Updates the category constraint**:
   - Adds 'others' to the list of allowed categories
   - Previous categories: postgraduate, presentations, publications, teaching-experience, training-in-teaching, qi
   - New categories: All of the above + **others**

### Verification:

After running the migration, you can verify it worked by running this query:

```sql
-- Check the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'portfolio_files'::regclass 
AND conname = 'portfolio_files_category_check';

-- Check the columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'portfolio_files' 
AND column_name IN ('custom_subsection', 'custom_evidence_type');
```

You should see:
- The constraint includes 'others' in the list
- Both `custom_subsection` and `custom_evidence_type` columns exist with type 'text'

### Rollback (if needed):

If you need to rollback this change:

```sql
-- Remove 'others' from the constraint
ALTER TABLE portfolio_files 
DROP CONSTRAINT IF EXISTS portfolio_files_category_check;

ALTER TABLE portfolio_files 
ADD CONSTRAINT portfolio_files_category_check 
CHECK (category IN ('postgraduate', 'presentations', 'publications', 'teaching-experience', 'training-in-teaching', 'qi'));

-- Note: We don't remove the custom_subsection and custom_evidence_type columns 
-- as they may contain data and are used by other categories
```

## Features of the "Others" Category

Once the migration is complete, users will be able to:

1. **Upload files to the "Others" category**
   - Subcategories: General, Miscellaneous
   - Evidence Types: Document, Certificate, Other

2. **Organize files in custom folders**
   - Create named folders for better organization
   - Group related files together

3. **All standard portfolio features**
   - Upload, edit, delete, download files
   - Search and filter
   - Add descriptions, PMID, URLs
   - View by category

**Note:** The "Others" category does not display IMT scoring criteria (as it's not part of the official IMT portfolio sections).

