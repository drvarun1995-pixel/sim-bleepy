# Question Deletion Feature - Setup Instructions

## Overview

The question deletion feature has been enhanced to allow admins to delete test questions even if they've been used in practice sessions. The system now:

1. **Prevents deletion of questions in active sessions** - Questions currently being used in incomplete practice sessions cannot be deleted
2. **Allows deletion of questions in completed sessions** - Questions used only in completed sessions can be deleted with a warning
3. **Preserves session data** - When a question is deleted, answer records are removed but session metadata is preserved
4. **Provides clear warnings** - Admins are informed about usage before deletion

## Database Migration Required

**IMPORTANT**: You need to run a database migration to enable cascade deletes.

### Step 1: Run the Migration

The migration file has been created at:
```
supabase/migrations/allow-question-deletion-with-cascade.sql
```

**Run this migration in your Supabase database:**

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/allow-question-deletion-with-cascade.sql`
4. Run the migration

This migration will:
- Change the foreign key constraint on `quiz_practice_answers.question_id` to `ON DELETE CASCADE`
- Change the foreign key constraint on `quiz_challenge_answers.question_id` to `ON DELETE CASCADE`
- Allow questions to be deleted even if they have answer records (answers will be automatically deleted)

### What This Means

- **Before migration**: Questions with answer records cannot be deleted (foreign key constraint blocks deletion)
- **After migration**: Questions can be deleted, and all related answer records will be automatically removed
- **Session data**: Practice session records remain intact (only answers are deleted)

## How It Works

### Deletion Flow

1. **Admin clicks delete** on a question
2. **System checks usage**:
   - If question is in **active (incomplete) sessions** → Block deletion, show error
   - If question is in **completed sessions only** → Show warning, ask for confirmation
   - If question has **no usage** → Delete immediately
3. **If confirmed** → Delete question and all related answer records
4. **Session data preserved** → Practice session records remain for statistics

### User Experience

#### Scenario 1: Question in Active Session
```
Error: "This question is currently being used in X active practice session(s). 
Please wait for these sessions to complete before deleting."
```
**Action**: Wait for sessions to complete, or archive the question

#### Scenario 2: Question in Completed Sessions Only
```
Warning: "This question has been used in X completed practice session(s) and Y challenge(s). 
Deleting will remove all answer records but preserve session data.

Do you want to proceed with deletion?"
```
**Action**: Confirm to delete, or cancel to keep the question

#### Scenario 3: Question Not Used
```
Success: "Question deleted successfully."
```
**Action**: Question is deleted immediately

## Archive as Alternative

If you don't want to delete a question, you can **archive** it instead:
- Archived questions won't appear in practice sessions
- Archived questions are preserved in the database
- Archived questions can be unarchived later

## Testing

After running the migration, test the deletion:

1. **Create a test question**
2. **Use it in a practice session** (complete the session)
3. **Try to delete the question**
4. **You should see a warning** about usage
5. **Confirm deletion**
6. **Question should be deleted** successfully

## Important Notes

### Data Impact

- **Answer records are deleted** when a question is deleted
- **Session records are preserved** (session metadata remains)
- **Statistics may be affected** if questions are deleted after sessions complete
- **Historical data**: Consider archiving instead of deleting if you need to preserve statistics

### Best Practices

1. **Archive instead of delete** for questions that might be needed later
2. **Delete only test questions** that were never meant for production
3. **Wait for active sessions to complete** before deleting questions
4. **Consider the impact** on user statistics and leaderboards

## Troubleshooting

### Error: "Foreign key constraint violation"

**Solution**: Run the migration file to enable cascade deletes

### Error: "Question is in active sessions"

**Solution**: Wait for sessions to complete, or archive the question instead

### Migration fails

**Solution**: 
1. Check if foreign key constraints exist
2. Verify table names match your database schema
3. Check Supabase logs for detailed error messages

## Next Steps

1. ✅ Run the database migration
2. ✅ Test question deletion with a test question
3. ✅ Verify that session data is preserved
4. ✅ Consider adding user-facing session deletion (future enhancement)

## Future Enhancements

- **User session deletion**: Allow users to delete their own practice sessions
- **Bulk deletion**: Delete multiple questions at once
- **Soft delete**: Mark questions as deleted instead of hard deleting
- **Deletion history**: Track when and why questions were deleted

